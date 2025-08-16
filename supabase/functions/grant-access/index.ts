import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GrantAccessRequest {
  user_id: string;
  level_id: string;
  expires_at?: string;
  reason?: string;
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
      .select('role')
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
    const { user_id, level_id, expires_at, reason }: GrantAccessRequest = await req.json();

    if (!user_id || !level_id) {
      return new Response(
        JSON.stringify({ error: 'user_id and level_id are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the target user exists
    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'Target user not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the level exists
    const { data: level } = await supabaseAdmin
      .from('levels')
      .select('id, title, level_number')
      .eq('id', level_id)
      .single();

    if (!level) {
      return new Response(
        JSON.stringify({ error: 'Level not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Grant access (upsert to handle duplicates)
    const { data: accessGrant, error: accessError } = await supabaseAdmin
      .from('level_access')
      .upsert({
        user_id,
        level_id,
        granted_by: user.id,
        expires_at,
        reason: reason || 'manual'
      }, {
        onConflict: 'user_id,level_id'
      })
      .select()
      .single();

    if (accessError) {
      throw accessError;
    }

    // Create notification for the student
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user_id,
        type: 'announcement',
        title: 'New Level Unlocked!',
        message: `You now have access to ${level.title}. Start learning today!`,
        data: { 
          level_id: level_id,
          level_title: level.title,
          granted_by: user.id
        }
      });

    // Create audit log via announcement
    await supabaseAdmin
      .from('announcements')
      .insert({
        title: 'Access Granted',
        content: `Access granted to ${targetUser.full_name} for ${level.title}`,
        body: `Teacher granted access to Level ${level.level_number}: ${level.title}`,
        target: `users:${user.id}`, // Only visible to granting teacher
        created_by: user.id
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        access_grant: accessGrant,
        message: `Access granted to ${targetUser.full_name} for ${level.title}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error granting access:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to grant access',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});