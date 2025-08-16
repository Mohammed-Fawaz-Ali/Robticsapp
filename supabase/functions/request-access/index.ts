import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AccessRequest {
  level_id: string;
  message?: string;
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

    // Verify user token
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

    // Parse request body
    const { level_id, message }: AccessRequest = await req.json();

    if (!level_id) {
      return new Response(
        JSON.stringify({ error: 'level_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single();

    // Get level information
    const { data: level } = await supabaseAdmin
      .from('levels')
      .select('title, level_number')
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

    // Check if user already has access
    const { data: existingAccess } = await supabaseAdmin
      .from('level_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('level_id', level_id)
      .single();

    if (existingAccess) {
      return new Response(
        JSON.stringify({ 
          error: 'You already have access to this level',
          has_access: true
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await supabaseAdmin
      .from('level_access_requests')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('level_id', level_id)
      .single();

    if (existingRequest && existingRequest.status === 'pending') {
      return new Response(
        JSON.stringify({ 
          error: 'You already have a pending request for this level',
          request_id: existingRequest.id
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create access request
    const { data: accessRequest, error: requestError } = await supabaseAdmin
      .from('level_access_requests')
      .insert({
        user_id: user.id,
        level_id: level_id,
        message: message || `Request access to ${level.title}`,
        status: 'pending'
      })
      .select()
      .single();

    if (requestError) {
      throw requestError;
    }

    // Notify all teachers about the access request
    const { data: teachers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'teacher');

    if (teachers && teachers.length > 0) {
      const notifications = teachers.map(teacher => ({
        user_id: teacher.id,
        type: 'announcement' as const,
        title: 'New Access Request',
        message: `${profile?.full_name || user.email} has requested access to ${level.title}`,
        data: { 
          request_id: accessRequest.id,
          user_id: user.id,
          level_id: level_id,
          level_title: level.title,
          student_name: profile?.full_name || user.email
        }
      }));

      await supabaseAdmin
        .from('notifications')
        .insert(notifications);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        request: accessRequest,
        message: `Access request submitted for ${level.title}. You will be notified when it's reviewed.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error requesting access:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to request access',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});