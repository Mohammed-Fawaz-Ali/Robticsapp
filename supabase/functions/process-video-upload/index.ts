import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface VideoUploadRequest {
  submissionId: string;
  videoUrl: string;
  userId: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { submissionId, videoUrl, userId }: VideoUploadRequest = await req.json();

    // Validate input
    if (!submissionId || !videoUrl || !userId) {
      return new Response(
        JSON.stringify({ error: 'submissionId, videoUrl, and userId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update submission with video URL
    const { data: submission, error: updateError } = await supabaseClient
      .from('submissions')
      .update({ 
        video_url: videoUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .eq('user_id', userId)
      .select(`
        *,
        lessons(title, levels(title))
      `)
      .single();

    if (updateError) {
      throw updateError;
    }

    // Notify teachers about the video upload
    const { data: teachers } = await supabaseClient
      .from('profiles')
      .select('id')
      .in('role', ['teacher', 'admin']);

    if (teachers && teachers.length > 0) {
      const notifications = teachers.map(teacher => ({
        user_id: teacher.id,
        type: 'assignment' as const,
        title: 'Video Submission Updated',
        message: `${submission.title} video has been uploaded and is ready for review.`,
        data: { 
          submission_id: submissionId,
          lesson_title: submission.lessons?.title,
          level_title: submission.lessons?.levels?.title
        },
      }));

      await supabaseClient
        .from('notifications')
        .insert(notifications);
    }

    // Create success notification for student
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'assignment',
        title: 'Video Uploaded Successfully',
        message: `Your video for "${submission.title}" has been uploaded and submitted for review.`,
        data: { submission_id: submissionId },
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        submission,
        message: 'Video uploaded and submission updated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing video upload:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process video upload',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});