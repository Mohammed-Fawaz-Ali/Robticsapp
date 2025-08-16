import { supabase } from '@/lib/supabase';

export class AnalyticsService {
  // Get platform analytics (admin only)
  static async getPlatformAnalytics() {
    try {
      // Get total users by role
      const { data: userStats } = await supabase
        .from('profiles')
        .select('role')
        .then(({ data }) => {
          const stats = { students: 0, teachers: 0, admins: 0, total: 0 };
          data?.forEach(user => {
            stats.total++;
            if (user.role === 'student') stats.students++;
            else if (user.role === 'teacher') stats.teachers++;
            else if (user.role === 'admin') stats.admins++;
          });
          return { data: stats };
        });

      // Get course completion stats
      const { data: completionStats } = await supabase
        .from('student_progress')
        .select('completed, user_id')
        .then(({ data }) => {
          const completed = data?.filter(p => p.completed).length || 0;
          const total = data?.length || 0;
          const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
          return { data: { completed, total, rate } };
        });

      // Get active users (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: activeUsers } = await supabase
        .from('student_progress')
        .select('user_id')
        .gte('last_accessed', sevenDaysAgo.toISOString())
        .then(({ data }) => {
          const uniqueUsers = new Set(data?.map(p => p.user_id));
          return { data: { count: uniqueUsers.size } };
        });

      // Get popular levels
      const { data: popularLevels } = await supabase
        .from('student_progress')
        .select(`
          lesson_id,
          lessons(level_id, levels(title))
        `)
        .then(({ data }) => {
          const levelCounts: { [key: string]: { title: string; count: number } } = {};
          data?.forEach(progress => {
            const level = progress.lessons?.levels;
            if (level) {
              if (!levelCounts[level.title]) {
                levelCounts[level.title] = { title: level.title, count: 0 };
              }
              levelCounts[level.title].count++;
            }
          });
          return { 
            data: Object.values(levelCounts)
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
          };
        });

      return {
        success: true,
        data: {
          userStats: userStats?.data,
          completionStats: completionStats?.data,
          activeUsers: activeUsers?.data,
          popularLevels: popularLevels?.data,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get analytics',
      };
    }
  }

  // Get student analytics for teacher dashboard
  static async getStudentAnalytics(teacherId: string) {
    try {
      // Get students' progress overview
      const { data: studentsProgress } = await supabase
        .from('student_progress')
        .select(`
          user_id,
          completed,
          completion_percentage,
          profiles(full_name)
        `)
        .then(({ data }) => {
          const studentStats: { [key: string]: any } = {};
          data?.forEach(progress => {
            const userId = progress.user_id;
            if (!studentStats[userId]) {
              studentStats[userId] = {
                userId,
                fullName: progress.profiles?.full_name,
                totalLessons: 0,
                completedLessons: 0,
                averageCompletion: 0,
              };
            }
            studentStats[userId].totalLessons++;
            if (progress.completed) {
              studentStats[userId].completedLessons++;
            }
            studentStats[userId].averageCompletion += progress.completion_percentage || 0;
          });

          // Calculate averages
          Object.values(studentStats).forEach((student: any) => {
            student.averageCompletion = student.totalLessons > 0 
              ? Math.round(student.averageCompletion / student.totalLessons)
              : 0;
            student.completionRate = student.totalLessons > 0
              ? Math.round((student.completedLessons / student.totalLessons) * 100)
              : 0;
          });

          return { data: Object.values(studentStats) };
        });

      // Get recent submissions
      const { data: recentSubmissions } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles(full_name),
          lessons(title)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        success: true,
        data: {
          studentsProgress: studentsProgress?.data || [],
          recentSubmissions: recentSubmissions || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get student analytics',
      };
    }
  }

  // Get individual student detailed analytics
  static async getStudentDetailedAnalytics(studentId: string) {
    try {
      // Get student's progress by level
      const { data: progressByLevel } = await supabase
        .from('student_progress')
        .select(`
          *,
          lessons(
            title,
            duration,
            levels(title, position)
          )
        `)
        .eq('user_id', studentId)
        .order('last_accessed', { ascending: false });

      // Get student's badges
      const { data: badges } = await supabase
        .from('user_badges')
        .select(`
          earned_at,
          badges(name, description, points)
        `)
        .eq('user_id', studentId)
        .order('earned_at', { ascending: false });

      // Get student's submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          *,
          lessons(title, levels(title))
        `)
        .eq('user_id', studentId)
        .order('created_at', { ascending: false });

      // Calculate learning streaks and patterns
      const learningDays = progressByLevel?.map(p => 
        p.last_accessed ? new Date(p.last_accessed).toDateString() : null
      ).filter(Boolean);

      const uniqueLearningDays = [...new Set(learningDays)].length;
      const totalTimeSpent = progressByLevel?.reduce((sum, p) => sum + (p.time_spent || 0), 0) || 0;

      return {
        success: true,
        data: {
          progressByLevel: progressByLevel || [],
          badges: badges || [],
          submissions: submissions || [],
          stats: {
            uniqueLearningDays,
            totalTimeSpent,
            totalBadges: badges?.length || 0,
            totalSubmissions: submissions?.length || 0,
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get student analytics',
      };
    }
  }

  // Get course analytics
  static async getCourseAnalytics() {
    try {
      // Get lesson completion rates
      const { data: lessonStats } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          duration,
          levels(title),
          student_progress(completed, completion_percentage)
        `)
        .then(({ data }) => {
          return {
            data: data?.map(lesson => {
              const totalStudents = lesson.student_progress.length;
              const completedStudents = lesson.student_progress.filter(p => p.completed).length;
              const averageCompletion = totalStudents > 0
                ? lesson.student_progress.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / totalStudents
                : 0;

              return {
                id: lesson.id,
                title: lesson.title,
                levelTitle: lesson.levels?.title,
                duration: lesson.duration,
                totalStudents,
                completedStudents,
                completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
                averageCompletion: Math.round(averageCompletion),
              };
            })
          };
        });

      // Get level popularity
      const { data: levelStats } = await supabase
        .from('levels')
        .select(`
          id,
          title,
          position,
          level_access(user_id),
          lessons(
            student_progress(completed, user_id)
          )
        `)
        .then(({ data }) => {
          return {
            data: data?.map(level => {
              const enrolledStudents = level.level_access.length;
              const allProgress = level.lessons.flatMap(l => l.student_progress);
              const uniqueActiveStudents = new Set(allProgress.map(p => p.user_id)).size;
              const completedLessons = allProgress.filter(p => p.completed).length;
              const totalLessons = level.lessons.length * enrolledStudents;

              return {
                id: level.id,
                title: level.title,
                position: level.position,
                enrolledStudents,
                activeStudents: uniqueActiveStudents,
                completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
              };
            })
          };
        });

      return {
        success: true,
        data: {
          lessonStats: lessonStats?.data || [],
          levelStats: levelStats?.data || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get course analytics',
      };
    }
  }

  // Get engagement metrics
  static async getEngagementMetrics(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily active users
      const { data: dailyActivity } = await supabase
        .from('student_progress')
        .select('last_accessed, user_id')
        .gte('last_accessed', startDate.toISOString())
        .then(({ data }) => {
          const dailyUsers: { [key: string]: Set<string> } = {};
          data?.forEach(progress => {
            if (progress.last_accessed) {
              const date = new Date(progress.last_accessed).toDateString();
              if (!dailyUsers[date]) {
                dailyUsers[date] = new Set();
              }
              dailyUsers[date].add(progress.user_id!);
            }
          });

          return {
            data: Object.entries(dailyUsers).map(([date, users]) => ({
              date,
              activeUsers: users.size,
            })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          };
        });

      // Get submission trends
      const { data: submissionTrends } = await supabase
        .from('submissions')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString())
        .then(({ data }) => {
          const trends: { [key: string]: { pending: number; reviewed: number; approved: number; rejected: number } } = {};
          data?.forEach(submission => {
            const date = new Date(submission.created_at!).toDateString();
            if (!trends[date]) {
              trends[date] = { pending: 0, reviewed: 0, approved: 0, rejected: 0 };
            }
            trends[date][submission.status as keyof typeof trends[typeof date]]++;
          });

          return {
            data: Object.entries(trends).map(([date, counts]) => ({
              date,
              ...counts,
            })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          };
        });

      return {
        success: true,
        data: {
          dailyActivity: dailyActivity?.data || [],
          submissionTrends: submissionTrends?.data || [],
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get engagement metrics',
      };
    }
  }
}