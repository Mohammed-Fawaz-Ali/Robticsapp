import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Submission = Database['public']['Tables']['submissions']['Row'];

export class SubmissionsService {
  // Create new submission
  static async createSubmission(submissionData: {
    userId: string;
    lessonId: string;
    title: string;
    description?: string;
    videoUrl?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          user_id: submissionData.userId,
          lesson_id: submissionData.lessonId,
          title: submissionData.title,
          description: submissionData.description,
          video_url: submissionData.videoUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Create notification for teachers
      const { data: teachers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['teacher', 'admin']);

      if (teachers) {
        const notifications = teachers.map(teacher => ({
          user_id: teacher.id,
          type: 'assignment' as const,
          title: 'New Submission Received',
          message: `${submissionData.title} has been submitted for review.`,
          data: { submission_id: data.id },
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create submission',
      };
    }
  }

  // Get user's submissions
  static async getUserSubmissions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          lessons(title, levels(title, position))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get submissions',
        data: [],
      };
    }
  }

  // Get all submissions (teacher/admin only)
  static async getAllSubmissions(status?: string) {
    try {
      let query = supabase
        .from('submissions')
        .select(`
          *,
          profiles(full_name),
          lessons(title, levels(title, position))
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get submissions',
        data: [],
      };
    }
  }

  // Review submission (teacher/admin only)
  static async reviewSubmission(
    submissionId: string,
    reviewerId: string,
    status: 'approved' | 'rejected',
    feedback?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status,
          feedback,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select(`
          *,
          profiles(full_name)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Create notification for student
      await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          type: 'assignment',
          title: `Submission ${status === 'approved' ? 'Approved' : 'Needs Revision'}`,
          message: status === 'approved' 
            ? `Your submission "${data.title}" has been approved!`
            : `Your submission "${data.title}" needs revision. Check the feedback.`,
          data: { submission_id: submissionId, feedback },
        });

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to review submission',
      };
    }
  }

  // Get submission details
  static async getSubmissionDetails(submissionId: string) {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles(full_name, avatar_url),
          lessons(title, levels(title, position)),
          reviewed_by_profile:profiles!submissions_reviewed_by_fkey(full_name)
        `)
        .eq('id', submissionId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get submission details',
      };
    }
  }

  // Delete submission
  static async deleteSubmission(submissionId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete submission',
      };
    }
  }
}