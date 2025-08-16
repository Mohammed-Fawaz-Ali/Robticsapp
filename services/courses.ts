import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Level = Database['public']['Tables']['levels']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];
type StudentProgress = Database['public']['Tables']['student_progress']['Row'];

export class CoursesService {
  // Get all levels for a user
  static async getLevels(userId: string) {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select(`
          *,
          lessons(count),
          level_access!inner(user_id)
        `)
        .or(`access_policy.eq.public,level_access.user_id.eq.${userId}`)
        .order('position');

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get levels',
        data: [],
      };
    }
  }

  // Get level details with lessons
  static async getLevelDetails(levelId: string, userId: string) {
    try {
      // Get level info
      const { data: level, error: levelError } = await supabase
        .from('levels')
        .select('*')
        .eq('id', levelId)
        .single();

      if (levelError) {
        throw new Error(levelError.message);
      }

      // Get lessons for this level
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          student_progress(
            completed,
            completion_percentage,
            time_spent,
            last_accessed
          )
        `)
        .eq('level_id', levelId)
        .order('position');

      if (lessonsError) {
        throw new Error(lessonsError.message);
      }

      // Calculate progress
      const completedLessons = lessons.filter(lesson => 
        lesson.student_progress?.[0]?.completed
      ).length;
      
      const progressPercentage = lessons.length > 0 
        ? Math.round((completedLessons / lessons.length) * 100)
        : 0;

      return {
        success: true,
        data: {
          level,
          lessons,
          progress: {
            completedLessons,
            totalLessons: lessons.length,
            progressPercentage,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get level details',
      };
    }
  }

  // Get lesson details
  static async getLessonDetails(lessonId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          levels(title, position),
          student_progress(
            completed,
            completion_percentage,
            time_spent,
            notes,
            last_accessed
          )
        `)
        .eq('id', lessonId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get lesson details',
      };
    }
  }

  // Update lesson progress
  static async updateLessonProgress(
    userId: string,
    lessonId: string,
    progress: {
      completed?: boolean;
      completion_percentage?: number;
      time_spent?: number;
      notes?: string;
    }
  ) {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          ...progress,
          last_accessed: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Check if user earned any badges
      await this.checkBadgeEligibility(userId);

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update progress',
      };
    }
  }

  // Get user's overall progress
  static async getUserProgress(userId: string) {
    try {
      // Get completed lessons count
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('completed, lesson_id, time_spent')
        .eq('user_id', userId);

      if (progressError) {
        throw new Error(progressError.message);
      }

      // Get user's badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          earned_at,
          badges(name, description, icon, points)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (badgesError) {
        throw new Error(badgesError.message);
      }

      // Get accessible levels
      const { data: levelsData, error: levelsError } = await supabase
        .from('levels')
        .select('id, title, position')
        .or(`access_policy.eq.public,level_access.user_id.eq.${userId}`)
        .order('position');

      if (levelsError) {
        throw new Error(levelsError.message);
      }

      const completedLessons = progressData.filter(p => p.completed).length;
      const totalTimeSpent = progressData.reduce((sum, p) => sum + (p.time_spent || 0), 0);
      const totalBadges = badgesData.length;

      return {
        success: true,
        data: {
          completedLessons,
          totalTimeSpent,
          totalBadges,
          badges: badgesData,
          accessibleLevels: levelsData.length,
          recentBadges: badgesData.slice(0, 3),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user progress',
      };
    }
  }

  // Check badge eligibility and award badges
  static async checkBadgeEligibility(userId: string) {
    try {
      // Get user's current progress
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('completed, lesson_id')
        .eq('user_id', userId);

      if (!progressData) return;

      const completedLessons = progressData.filter(p => p.completed).length;

      // Get available badges
      const { data: badges } = await supabase
        .from('badges')
        .select('*');

      if (!badges) return;

      // Check each badge criteria
      for (const badge of badges) {
        const criteria = badge.criteria as any;
        let eligible = false;

        if (criteria?.lessons_completed && completedLessons >= criteria.lessons_completed) {
          eligible = true;
        }

        if (eligible) {
          // Check if user already has this badge
          const { data: existingBadge } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', userId)
            .eq('badge_id', badge.id)
            .single();

          if (!existingBadge) {
            // Award the badge
            await supabase
              .from('user_badges')
              .insert({
                user_id: userId,
                badge_id: badge.id,
              });

            // Create notification
            await supabase
              .from('notifications')
              .insert({
                user_id: userId,
                type: 'achievement',
                title: 'New Badge Earned!',
                message: `Congratulations! You earned the "${badge.name}" badge.`,
                data: { badge_id: badge.id },
              });
          }
        }
      }
    } catch (error) {
      console.error('Error checking badge eligibility:', error);
    }
  }

  // Grant level access to student
  static async grantLevelAccess(studentId: string, levelId: string, grantedBy: string) {
    try {
      const { data, error } = await supabase
        .from('level_access')
        .insert({
          user_id: studentId,
          level_id: levelId,
          granted_by: grantedBy,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Create notification for student
      const { data: level } = await supabase
        .from('levels')
        .select('title')
        .eq('id', levelId)
        .single();

      if (level) {
        await supabase
          .from('notifications')
          .insert({
            user_id: studentId,
            type: 'announcement',
            title: 'New Level Unlocked!',
            message: `You now have access to ${level.title}. Start learning today!`,
            data: { level_id: levelId },
          });
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to grant level access',
      };
    }
  }

  // Create new level (teacher/admin only)
  static async createLevel(levelData: Database['public']['Tables']['levels']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('levels')
        .insert(levelData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create level',
      };
    }
  }

  // Create new lesson (teacher/admin only)
  static async createLesson(lessonData: Database['public']['Tables']['lessons']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update level's total lessons count
      if (lessonData.level_id) {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('level_id', lessonData.level_id);

        if (lessons) {
          await supabase
            .from('levels')
            .update({ total_lessons: lessons.length })
            .eq('id', lessonData.level_id);
        }
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create lesson',
      };
    }
  }

  // Get dashboard data for user
  static async getDashboardData(userId: string) {
    try {
      // Get user progress
      const progressResult = await this.getUserProgress(userId);
      
      // Get recent announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      // Get current level progress
      const { data: currentProgress } = await supabase
        .from('student_progress')
        .select(`
          *,
          lessons(
            title,
            levels(title, position)
          )
        `)
        .eq('user_id', userId)
        .eq('completed', false)
        .order('last_accessed', { ascending: false })
        .limit(1);

      return {
        success: true,
        data: {
          progress: progressResult.data,
          announcements: announcements || [],
          currentLesson: currentProgress?.[0] || null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dashboard data',
      };
    }
  }
}