import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SubmissionRequest {
  lesson_id: string;
  storage_path: string;
  duration_seconds?: number;
  title?: string;
  description?: string;
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
    const { lesson_id, storage_path, duration_seconds, title, description }: SubmissionRequest = await req.json();

    if (!lesson_id || !storage_path) {
      return new Response(
        JSON.stringify({ error: 'lesson_id and storage_path are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get lesson information
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select(`
        *,
        levels(title, level_number)
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

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Create submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .insert({
        user_id: user.id,
        lesson_id: lesson_id,
        storage_path: storage_path,
        duration_seconds: duration_seconds,
        title: title || `${lesson.title} - Practice Submission`,
        description: description,
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError) {
      throw submissionError;
    }

    // Notify all teachers about the new submission
    const { data: teachers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'teacher');

    if (teachers && teachers.length > 0) {
      const notifications = teachers.map(teacher => ({
        user_id: teacher.id,
        type: 'assignment' as const,
        title: 'New Practice Submission',
        message: `${profile?.full_name || user.email} submitted practice for ${lesson.title}`,
        data: { 
          submission_id: submission.id,
          lesson_id: lesson_id,
          lesson_title: lesson.title,
          level_title: lesson.levels?.title,
          student_name: profile?.full_name || user.email
        }
      }));

      await supabaseAdmin
        .from('notifications')
        .insert(notifications);
    }

    // Create success notification for student
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'assignment',
        title: 'Submission Received',
        message: `Your practice submission for "${lesson.title}" has been received and will be reviewed soon.`,
        data: { 
          submission_id: submission.id,
          lesson_title: lesson.title
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        submission: submission,
        message: 'Practice submission created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error submitting practice:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to submit practice',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});