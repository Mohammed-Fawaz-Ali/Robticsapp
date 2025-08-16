import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AnnouncementRequest {
  title: string;
  content: string;
  body?: string;
  target?: string; // 'all' | 'level:<id>' | 'users:<csv>'
  pinned?: boolean;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase clients
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify user token and check teacher role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is a teacher
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'teacher') {
      return new Response(
        JSON.stringify({ error: 'Access denied. Teacher role required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { title, content, body, target, pinned }: AnnouncementRequest = await req.json();

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'title and content are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create announcement
    const { data: announcement, error: announcementError } = await supabaseAdmin
      .from('announcements')
      .insert({
        title: title,
        content: content,
        body: body || content,
        target: target || 'all',
        created_by: user.id,
        pinned: pinned || false
      })
      .select()
      .single();

    if (announcementError) {
      throw announcementError;
    }

    // Determine target users for notifications
    let targetUsers: string[] = [];

    if (target === 'all' || !target) {
      // Get all users
      const { data: allUsers } = await supabaseAdmin
        .from('profiles')
        .select('id');
      targetUsers = allUsers?.map(u => u.id) || [];
    } else if (target.startsWith('level:')) {
      // Get users with access to specific level
      const levelId = target.replace('level:', '');
      const { data: levelUsers } = await supabaseAdmin
        .from('level_access')
        .select('user_id')
        .eq('level_id', levelId);
      targetUsers = levelUsers?.map(u => u.user_id) || [];
    } else if (target.startsWith('users:')) {
      // Specific user IDs
      targetUsers = target.replace('users:', '').split(',').map(id => id.trim());
    }

    // Create notifications for target users (excluding the creator)
    if (targetUsers.length > 0) {
      const notifications = targetUsers
        .filter(userId => userId !== user.id)
        .map(userId => ({
          user_id: userId,
          type: 'announcement' as const,
          title: 'New Announcement',
          message: title,
          data: { 
            announcement_id: announcement.id,
            created_by: profile.full_name || user.email
          }
        }));

      if (notifications.length > 0) {
        await supabaseAdmin
          .from('notifications')
          .insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        announcement: announcement,
        notifications_sent: targetUsers.length,
        message: 'Announcement created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating announcement:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create announcement',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});