import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Announcement = Database['public']['Tables']['announcements']['Row'];

export class AnnouncementsService {
  // Get announcements for user
  static async getAnnouncements(userId: string, limit?: number) {
    try {
      let query = supabase
        .from('announcements')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get announcements',
        data: [],
      };
    }
  }

  // Create announcement (teacher/admin only)
  static async createAnnouncement(announcementData: {
    title: string;
    content: string;
    type?: string;
    priority?: string;
    targetRoles?: Database['public']['Enums']['user_role'][];
    createdBy: string;
    expiresAt?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcementData.title,
          content: announcementData.content,
          type: announcementData.type || 'general',
          priority: announcementData.priority || 'medium',
          target_roles: announcementData.targetRoles || ['student'],
          created_by: announcementData.createdBy,
          expires_at: announcementData.expiresAt,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Create notifications for target users
      const targetRoles = announcementData.targetRoles || ['student'];
      const { data: targetUsers } = await supabase
        .from('profiles')
        .select('id')
        .in('role', targetRoles);

      if (targetUsers) {
        const notifications = targetUsers.map(user => ({
          user_id: user.id,
          type: 'announcement' as const,
          title: 'New Announcement',
          message: announcementData.title,
          data: { announcement_id: data.id },
        }));

        await supabase
          .from('notifications')
          .insert(notifications);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create announcement',
      };
    }
  }

  // Update announcement (teacher/admin only)
  static async updateAnnouncement(
    announcementId: string,
    updates: Database['public']['Tables']['announcements']['Update']
  ) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', announcementId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update announcement',
      };
    }
  }

  // Delete announcement (teacher/admin only)
  static async deleteAnnouncement(announcementId: string) {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete announcement',
      };
    }
  }

  // Get announcement details
  static async getAnnouncementDetails(announcementId: string) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles(full_name, avatar_url)
        `)
        .eq('id', announcementId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get announcement details',
      };
    }
  }

  // Get announcements by type
  static async getAnnouncementsByType(type: string, limit?: number) {
    try {
      let query = supabase
        .from('announcements')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get announcements by type',
        data: [],
      };
    }
  }
}