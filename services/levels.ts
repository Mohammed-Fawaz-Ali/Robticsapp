import { supabase } from '@/lib/supabase';
import { EdgeFunctionAPI } from '@/lib/api';
import { Database } from '@/types/database';

type Level = Database['public']['Tables']['levels']['Row'];
type LevelAccess = Database['public']['Tables']['level_access']['Row'];

export class LevelsService {
  // Get all levels with access information for user
  static async getLevelsWithAccess(userId: string) {
    try {
      const { data: levels, error } = await supabase
        .from('levels')
        .select(`
          *,
          lessons(count),
          level_access!left(
            id,
            granted_at,
            expires_at
          )
        `)
        .order('level_number');

      if (error) {
        throw new Error(error.message);
      }

      // Process levels to determine access status
      const levelsWithAccess = levels?.map(level => {
        const hasDirectAccess = level.level_access && level.level_access.length > 0;
        const isPublic = level.access_policy === 'public';
        const hasAccess = isPublic || hasDirectAccess;

        return {
          ...level,
          has_access: hasAccess,
          access_type: isPublic ? 'public' : hasDirectAccess ? 'granted' : 'locked',
          lesson_count: level.lessons?.[0]?.count || 0,
        };
      }) || [];

      return { success: true, data: levelsWithAccess };
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
      // Get level information
      const { data: level, error: levelError } = await supabase
        .from('levels')
        .select('*')
        .eq('id', levelId)
        .single();

      if (levelError) {
        throw new Error(levelError.message);
      }

      // Check access
      const { data: access } = await supabase
        .from('level_access')
        .select('*')
        .eq('user_id', userId)
        .eq('level_id', levelId)
        .single();

      const hasAccess = level.access_policy === 'public' || access;

      // Get lessons for this level
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          *,
          student_progress(
            completed,
            completion_percentage,
            last_accessed
          )
        `)
        .eq('level_id', levelId)
        .eq('published', true)
        .order('order_index');

      if (lessonsError) {
        throw new Error(lessonsError.message);
      }

      // Calculate progress
      const completedLessons = lessons?.filter(lesson => 
        lesson.student_progress?.[0]?.completed
      ).length || 0;
      
      const totalLessons = lessons?.length || 0;
      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

      return {
        success: true,
        data: {
          level,
          lessons: lessons || [],
          has_access: hasAccess,
          progress: {
            completed_lessons: completedLessons,
            total_lessons: totalLessons,
            progress_percentage: progressPercentage,
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

  // Request access to a level
  static async requestAccess(levelId: string, message?: string) {
    return await EdgeFunctionAPI.requestAccess(levelId, message);
  }

  // Grant access to a level (teacher only)
  static async grantAccess(userId: string, levelId: string, expiresAt?: string, reason?: string) {
    return await EdgeFunctionAPI.grantAccess(userId, levelId, expiresAt, reason);
  }

  // Get access requests (teacher only)
  static async getAccessRequests() {
    try {
      const { data, error } = await supabase
        .from('level_access_requests')
        .select(`
          *,
          profiles(full_name, role),
          levels(title, level_number)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get access requests',
        data: [],
      };
    }
  }

  // Approve/reject access request (teacher only)
  static async reviewAccessRequest(requestId: string, status: 'approved' | 'rejected', reviewerId: string) {
    try {
      // Update the request status
      const { data: request, error: updateError } = await supabase
        .from('level_access_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewerId,
        })
        .eq('id', requestId)
        .select(`
          *,
          profiles(full_name),
          levels(title)
        `)
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // If approved, grant actual access
      if (status === 'approved') {
        await this.grantAccess(request.user_id!, request.level_id!, undefined, 'approved_request');
      }

      // Notify the student
      await supabase
        .from('notifications')
        .insert({
          user_id: request.user_id,
          type: 'announcement',
          title: `Access Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
          message: status === 'approved' 
            ? `Your request for ${request.levels?.title} has been approved!`
            : `Your request for ${request.levels?.title} has been rejected.`,
          data: { 
            request_id: requestId,
            level_id: request.level_id,
            status
          }
        });

      return { success: true, data: request };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to review access request',
      };
    }
  }

  // Create new level (teacher only)
  static async createLevel(levelData: {
    title: string;
    description: string;
    level_number: number;
    access_policy: 'public' | 'invite';
    createdBy: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('levels')
        .insert({
          title: levelData.title,
          description: levelData.description,
          level_number: levelData.level_number,
          access_policy: levelData.access_policy,
          created_by: levelData.createdBy,
          position: levelData.level_number,
        })
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

  // Update level (teacher only)
  static async updateLevel(levelId: string, updates: Partial<Level>) {
    try {
      const { data, error } = await supabase
        .from('levels')
        .update(updates)
        .eq('id', levelId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update level',
      };
    }
  }
}