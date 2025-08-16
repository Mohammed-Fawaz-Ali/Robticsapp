import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UploadRequest {
  file_path: string;
  bucket: 'lesson-videos' | 'submissions';
  content_type?: string;
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
    const { file_path, bucket, content_type }: UploadRequest = await req.json();

    if (!file_path || !bucket) {
      return new Response(
        JSON.stringify({ error: 'file_path and bucket are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate bucket
    if (!['lesson-videos', 'submissions'].includes(bucket)) {
      return new Response(
        JSON.stringify({ error: 'Invalid bucket. Must be lesson-videos or submissions' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check permissions based on bucket
    if (bucket === 'lesson-videos') {
      // Only teachers can upload lesson videos
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || profile.role !== 'teacher') {
        return new Response(
          JSON.stringify({ error: 'Access denied. Teacher role required for lesson video uploads.' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else if (bucket === 'submissions') {
      // For submissions, ensure the path includes the user ID
      if (!file_path.startsWith(`${user.id}/`)) {
        return new Response(
          JSON.stringify({ error: 'Invalid file path. Submissions must be in your user folder.' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Generate signed upload URL (1 hour expiry)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(file_path, {
        expiresIn: 3600, // 1 hour
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Generate a signed URL for later playback (for verification)
    const { data: playbackData } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(file_path, 3600);

    return new Response(
      JSON.stringify({ 
        success: true,
        upload_url: uploadData.signedUrl,
        file_path: file_path,
        bucket: bucket,
        expires_in: 3600,
        playback_url: playbackData?.signedUrl // For immediate verification
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error creating signed upload URL:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create signed upload URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});