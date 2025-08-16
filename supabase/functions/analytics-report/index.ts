import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

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

    // Get query parameters
    const url = new URL(req.url);
    const reportType = url.searchParams.get('type') || 'overview';
    const days = parseInt(url.searchParams.get('days') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let reportData: any = {};

    switch (reportType) {
      case 'overview':
        // Get platform overview
        const { data: userCount } = await supabaseClient
          .from('profiles')
          .select('role', { count: 'exact' });

        const { data: activeUsers } = await supabaseClient
          .from('student_progress')
          .select('user_id', { count: 'exact' })
          .gte('last_accessed', startDate.toISOString());

        const { data: completionData } = await supabaseClient
          .from('student_progress')
          .select('completed', { count: 'exact' })
          .eq('completed', true);

        reportData = {
          totalUsers: userCount?.length || 0,
          activeUsers: activeUsers || 0,
          completedLessons: completionData || 0,
          reportPeriod: `${days} days`,
        };
        break;

      case 'engagement':
        // Get engagement metrics
        const { data: dailyActivity } = await supabaseClient
          .from('student_progress')
          .select('last_accessed, user_id')
          .gte('last_accessed', startDate.toISOString());

        const dailyStats: { [key: string]: Set<string> } = {};
        dailyActivity?.forEach(activity => {
          if (activity.last_accessed) {
            const date = new Date(activity.last_accessed).toDateString();
            if (!dailyStats[date]) {
              dailyStats[date] = new Set();
            }
            dailyStats[date].add(activity.user_id!);
          }
        });

        reportData = {
          dailyActiveUsers: Object.entries(dailyStats).map(([date, users]) => ({
            date,
            activeUsers: users.size,
          })),
          averageDailyUsers: Object.values(dailyStats).reduce((sum, users) => sum + users.size, 0) / Object.keys(dailyStats).length,
        };
        break;

      case 'progress':
        // Get progress analytics
        const { data: progressData } = await supabaseClient
          .from('student_progress')
          .select(`
            user_id,
            completed,
            completion_percentage,
            time_spent,
            lessons(levels(title))
          `);

        const levelProgress: { [key: string]: any } = {};
        progressData?.forEach(progress => {
          const levelTitle = progress.lessons?.levels?.title || 'Unknown';
          if (!levelProgress[levelTitle]) {
            levelProgress[levelTitle] = {
              totalStudents: new Set(),
              completedLessons: 0,
              totalLessons: 0,
              totalTimeSpent: 0,
            };
          }
          levelProgress[levelTitle].totalStudents.add(progress.user_id);
          levelProgress[levelTitle].totalLessons++;
          levelProgress[levelTitle].totalTimeSpent += progress.time_spent || 0;
          if (progress.completed) {
            levelProgress[levelTitle].completedLessons++;
          }
        });

        reportData = {
          levelProgress: Object.entries(levelProgress).map(([level, stats]: [string, any]) => ({
            level,
            studentsEnrolled: stats.totalStudents.size,
            completionRate: stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0,
            averageTimeSpent: stats.totalStudents.size > 0 ? Math.round(stats.totalTimeSpent / stats.totalStudents.size) : 0,
          })),
        };
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid report type' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        reportType,
        generatedAt: new Date().toISOString(),
        data: reportData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error generating analytics report:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate analytics report',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});