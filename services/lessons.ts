import { supabase } from '@/lib/supabase';
import { EdgeFunctionAPI } from '@/lib/api';
import { Database } from '@/types/database';

type Lesson = Database['public']['Tables']['lessons']['Row'];

export class LessonsService {
  // Get lesson details with access check
  static async getLessonDetails(lessonId: string, userId: string) {
    try {
      const { data: lesson, error } = await supabase
        .from('lessons')
        .select(`
          *,
          levels(
            id,
            title,
            level_number,
            access_policy
          ),
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

      // Check if user has access to this lesson's level
      let hasAccess = false;
      
      if (lesson.levels?.access_policy === 'public') {
        hasAccess = true;
      } else {
        const { data: access } = await supabase
          .from('level_access')
          .select('id')
          .eq('user_id', userId)
          .eq('level_id', lesson.levels?.id)
          .single();

        hasAccess = !!access;
      }

      return {
        success: true,
        data: {
          ...lesson,
          has_access: hasAccess,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get lesson details',
      };
    }
  }

  // Get signed playback URL for lesson video
  static async getPlaybackUrl(lessonId: string) {
    return await EdgeFunctionAPI.getPlaybackUrl(lessonId);
  }

  // Update lesson progress
  static async updateProgress(
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

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update progress',
      };
    }
  }

  // Submit practice video for lesson
  static async submitPractice(
    lessonId: string,
    file: File,
    title?: string,
    description?: string
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique file path
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      const filePath = `${user.id}/${fileName}`;

      // Get signed upload URL
      const uploadResult = await EdgeFunctionAPI.getUploadUrl(filePath, 'submissions', file.type);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Upload file
      const uploadResponse = await fetch(uploadResult.data.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Create submission record
      const submissionResult = await EdgeFunctionAPI.submitPractice(
        lessonId,
        filePath,
        undefined, // duration will be calculated later
        title,
        description
      );

      return submissionResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit practice',
      };
    }
  }

  // Create new lesson (teacher only)
  static async createLesson(lessonData: {
    level_id: string;
    title: string;
    description: string;
    duration?: number;
    order_index: number;
    hls_path?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert({
          ...lessonData,
          published: false, // Start as unpublished
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
        error: error instanceof Error ? error.message : 'Failed to create lesson',
      };
    }
  }

  // Update lesson (teacher only)
  static async updateLesson(lessonId: string, updates: Partial<Lesson>) {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lessonId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update lesson',
      };
    }
  }

  // Publish/unpublish lesson (teacher only)
  static async togglePublished(lessonId: string, published: boolean) {
    return await this.updateLesson(lessonId, { published });
  }

  // Upload lesson video (teacher only)
  static async uploadLessonVideo(levelNumber: number, lessonIndex: number, file: File) {
    try {
      // Generate file path
      const fileExtension = file.name.split('.').pop();
      const filePath = `lessons/level${levelNumber}/lesson${lessonIndex}.${fileExtension}`;

      // Get signed upload URL
      const uploadResult = await EdgeFunctionAPI.getUploadUrl(filePath, 'lesson-videos', file.type);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Upload file
      const uploadResponse = await fetch(uploadResult.data.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      return { 
        success: true, 
        data: { 
          file_path: filePath,
          playback_url: uploadResult.data.playback_url 
        } 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload lesson video',
      };
    }
  }

  // Get lessons for teacher management
  static async getLessonsForTeacher(levelId?: string) {
    try {
      let query = supabase
        .from('lessons')
        .select(`
          *,
          levels(title, level_number)
        `)
        .order('order_index');

      if (levelId) {
        query = query.eq('level_id', levelId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get lessons',
        data: [],
      };
    }
  }
}