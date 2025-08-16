import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Authorization': `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };
};

// API client for edge functions
export class EdgeFunctionAPI {
  // Get signed playback URL for lesson video
  static async getPlaybackUrl(lessonId: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-signed-playback-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ lesson_id: lessonId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get playback URL');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get playback URL',
      };
    }
  }

  // Grant access to a level (teacher only)
  static async grantAccess(userId: string, levelId: string, expiresAt?: string, reason?: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${SUPABASE_URL}/functions/v1/grant-access`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          user_id: userId, 
          level_id: levelId, 
          expires_at: expiresAt,
          reason 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to grant access');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to grant access',
      };
    }
  }

  // Request access to a level (student)
  static async requestAccess(levelId: string, message?: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${SUPABASE_URL}/functions/v1/request-access`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          level_id: levelId, 
          message 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to request access');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request access',
      };
    }
  }

  // Submit practice video
  static async submitPractice(lessonId: string, storagePath: string, durationSeconds?: number, title?: string, description?: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${SUPABASE_URL}/functions/v1/submit-practice`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          lesson_id: lessonId,
          storage_path: storagePath,
          duration_seconds: durationSeconds,
          title,
          description
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit practice');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit practice',
      };
    }
  }

  // Review submission (teacher only)
  static async reviewSubmission(submissionId: string, status: 'reviewed' | 'approved' | 'rejected', feedback?: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${SUPABASE_URL}/functions/v1/review-submission`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          submission_id: submissionId,
          status,
          teacher_feedback: feedback
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to review submission');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to review submission',
      };
    }
  }

  // Create announcement (teacher only)
  static async createAnnouncement(title: string, content: string, body?: string, target?: string, pinned?: boolean) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${SUPABASE_URL}/functions/v1/create-announcement`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          title,
          content,
          body,
          target,
          pinned
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create announcement');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create announcement',
      };
    }
  }

  // Get signed upload URL
  static async getUploadUrl(filePath: string, bucket: 'lesson-videos' | 'submissions', contentType?: string) {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${SUPABASE_URL}/functions/v1/upload-signed-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          file_path: filePath,
          bucket,
          content_type: contentType
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get upload URL');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get upload URL',
      };
    }
  }
}

// Helper function to upload file using signed URL
export const uploadFileToStorage = async (file: File, signedUrl: string) => {
  try {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};