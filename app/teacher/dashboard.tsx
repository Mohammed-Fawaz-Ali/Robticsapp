import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, BookOpen, Clock, CircleCheck as CheckCircle, CircleAlert as AlertCircle, TrendingUp, Plus, Settings, Bell } from 'lucide-react-native';
import { TeacherGuard } from '@/components/AuthGuard';
import { AnalyticsService } from '@/services/analytics';
import { SubmissionsService } from '@/services/submissions';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalStudents: number;
  pendingSubmissions: number;
  completedLessons: number;
  activeToday: number;
}

interface RecentSubmission {
  id: string;
  title: string;
  student_name: string;
  lesson_title: string;
  created_at: string;
  status: string;
}

export default function TeacherDashboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingSubmissions: 0,
    completedLessons: 0,
    activeToday: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load analytics data
      const analyticsResult = await AnalyticsService.getPlatformAnalytics();
      if (analyticsResult.success) {
        setStats({
          totalStudents: analyticsResult.data.userStats?.students || 0,
          pendingSubmissions: 0, // Will be updated below
          completedLessons: analyticsResult.data.completionStats?.completed || 0,
          activeToday: analyticsResult.data.activeUsers?.count || 0,
        });
      }

      // Load recent submissions
      const submissionsResult = await SubmissionsService.getAllSubmissions('pending');
      if (submissionsResult.success) {
        setStats(prev => ({ ...prev, pendingSubmissions: submissionsResult.data.length }));
        setRecentSubmissions(submissionsResult.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const StatCard = ({ icon, title, value, color }: {
    icon: React.ReactNode;
    title: string;
    value: number;
    color: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        {React.cloneElement(icon as React.ReactElement, { size: 24, color })}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const SubmissionCard = ({ submission }: { submission: RecentSubmission }) => (
    <TouchableOpacity 
      style={styles.submissionCard}
      onPress={() => router.push(`/teacher/submissions/${submission.id}`)}
    >
      <View style={styles.submissionHeader}>
        <Text style={styles.submissionTitle}>{submission.title}</Text>
        <View style={styles.submissionStatus}>
          <Clock size={12} color="#F59E0B" />
          <Text style={styles.submissionStatusText}>Pending</Text>
        </View>
      </View>
      <Text style={styles.submissionStudent}>by {submission.student_name}</Text>
      <Text style={styles.submissionLesson}>{submission.lesson_title}</Text>
      <Text style={styles.submissionDate}>
        {new Date(submission.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <TeacherGuard>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.teacherName}>{profile?.full_name || 'Teacher'}</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => router.push('/teacher/settings')}
            >
              <Settings size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                icon={<Users />}
                title="Total Students"
                value={stats.totalStudents}
                color="#3B82F6"
              />
              <StatCard
                icon={<Clock />}
                title="Pending Reviews"
                value={stats.pendingSubmissions}
                color="#F59E0B"
              />
              <StatCard
                icon={<CheckCircle />}
                title="Completed Lessons"
                value={stats.completedLessons}
                color="#10B981"
              />
              <StatCard
                icon={<TrendingUp />}
                title="Active Today"
                value={stats.activeToday}
                color="#8B5CF6"
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/teacher/levels/create')}
              >
                <Plus size={20} color="#3B82F6" />
                <Text style={styles.quickActionText}>Create Level</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/teacher/lessons/create')}
              >
                <BookOpen size={20} color="#10B981" />
                <Text style={styles.quickActionText}>Add Lesson</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/teacher/access-management')}
              >
                <Users size={20} color="#F59E0B" />
                <Text style={styles.quickActionText}>Manage Access</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickAction}
                onPress={() => router.push('/teacher/announcements/create')}
              >
                <Bell size={20} color="#8B5CF6" />
                <Text style={styles.quickActionText}>New Announcement</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Submissions */}
          <View style={styles.submissionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Submissions</Text>
              <TouchableOpacity onPress={() => router.push('/teacher/submissions')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            
            {recentSubmissions.length > 0 ? (
              recentSubmissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Clock size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No pending submissions</Text>
                <Text style={styles.emptyStateMessage}>
                  Student submissions will appear here for review
                </Text>
              </View>
            )}
          </View>

          {/* Navigation Shortcuts */}
          <View style={styles.navigationSection}>
            <Text style={styles.sectionTitle}>Manage</Text>
            <View style={styles.navigationGrid}>
              <TouchableOpacity 
                style={styles.navigationCard}
                onPress={() => router.push('/teacher/levels')}
              >
                <BookOpen size={24} color="#3B82F6" />
                <Text style={styles.navigationTitle}>Course Levels</Text>
                <Text style={styles.navigationSubtitle}>Manage course structure</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navigationCard}
                onPress={() => router.push('/teacher/students')}
              >
                <Users size={24} color="#10B981" />
                <Text style={styles.navigationTitle}>Students</Text>
                <Text style={styles.navigationSubtitle}>View student progress</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navigationCard}
                onPress={() => router.push('/teacher/analytics')}
              >
                <TrendingUp size={24} color="#F59E0B" />
                <Text style={styles.navigationTitle}>Analytics</Text>
                <Text style={styles.navigationSubtitle}>Platform insights</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  teacherName: {
    fontSize: 28,
    color: '#1F2937',
    fontWeight: '700',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
  },
  submissionsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submissionTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  submissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  submissionStatusText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
  submissionStudent: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  submissionLesson: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  submissionDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  navigationSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  navigationGrid: {
    gap: 12,
  },
  navigationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  navigationTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginLeft: 16,
  },
  navigationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 16,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});