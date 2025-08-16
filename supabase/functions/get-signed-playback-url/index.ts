import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PlaybackRequest {
  lesson_id: string;
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

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize client for user verification
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
    const { lesson_id }: PlaybackRequest = await req.json();

    if (!lesson_id) {
      return new Response(
        JSON.stringify({ error: 'lesson_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get lesson and level information
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select(`
        *,
        levels(
          id,
          access_policy,
          level_number
        )
      `)
      .eq('id', lesson_id)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: 'Lesson not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if lesson is published
    if (!lesson.published) {
      return new Response(
        JSON.stringify({ error: 'Lesson not available' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Check access permissions
    let hasAccess = false;

    // Teachers have access to all content
    if (profile?.role === 'teacher') {
      hasAccess = true;
    }
    // Public levels are accessible to all authenticated users
    else if (lesson.levels?.access_policy === 'public') {
      hasAccess = true;
    }
    // Check if user has specific access to this level
    else {
      const { data: access } = await supabaseAdmin
        .from('level_access')
        .select('id')
        .eq('user_id', user.id)
        .eq('level_id', lesson.levels?.id)
        .single();

      hasAccess = !!access;
    }

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ 
          error: 'Access denied',
          message: 'You do not have access to this lesson. Please request access or upgrade your plan.'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate signed URL for video playback (1 hour TTL)
    let signedUrl = null;
    if (lesson.hls_path) {
      const { data: urlData } = await supabaseAdmin.storage
        .from('lesson-videos')
        .createSignedUrl(lesson.hls_path, 3600); // 1 hour

      signedUrl = urlData?.signedUrl;
    }

    // Log playback event
    await supabaseAdmin
      .from('playback_events')
      .insert({
        user_id: user.id,
        lesson_id: lesson_id,
        event_type: 'view_start',
        user_agent: req.headers.get('User-Agent'),
        ip_address: req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For'),
      });

    // Return signed URL and lesson metadata
    return new Response(
      JSON.stringify({ 
        success: true,
        url: signedUrl,
        lesson: {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          duration: lesson.duration,
          level: lesson.levels?.level_number
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating playback URL:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate playback URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});