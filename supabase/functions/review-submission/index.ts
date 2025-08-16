import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ReviewRequest {
  submission_id: string;
  status: 'reviewed' | 'approved' | 'rejected';
  teacher_feedback?: string;
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
    const { submission_id, status, teacher_feedback }: ReviewRequest = await req.json();

    if (!submission_id || !status) {
      return new Response(
        JSON.stringify({ error: 'submission_id and status are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate status
    if (!['reviewed', 'approved', 'rejected'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Invalid status. Must be: reviewed, approved, or rejected' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get submission details
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        profiles(full_name),
        lessons(title, levels(title))
      `)
      .eq('id', submission_id)
      .single();

    if (submissionError || !submission) {
      return new Response(
        JSON.stringify({ error: 'Submission not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update submission with review
    const { data: updatedSubmission, error: updateError } = await supabaseAdmin
      .from('submissions')
      .update({
        status: status,
        teacher_feedback: teacher_feedback,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', submission_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create notification for student
    const statusMessages = {
      reviewed: 'Your submission has been reviewed.',
      approved: 'Congratulations! Your submission has been approved.',
      rejected: 'Your submission needs revision. Please check the feedback and resubmit.'
    };

    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: submission.user_id,
        type: 'assignment',
        title: 'Submission Review Complete',
        message: statusMessages[status],
        data: { 
          submission_id: submission_id,
          status: status,
          teacher_feedback: teacher_feedback,
          lesson_title: submission.lessons?.title,
          reviewer_name: profile.full_name
        }
      });

    // If approved, update student progress
    if (status === 'approved') {
      await supabaseAdmin
        .from('student_progress')
        .upsert({
          user_id: submission.user_id,
          lesson_id: submission.lesson_id,
          completed: true,
          completion_percentage: 100,
          last_accessed: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        submission: updatedSubmission,
        message: `Submission ${status} successfully`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error reviewing submission:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to review submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});