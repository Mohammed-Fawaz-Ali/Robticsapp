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
import { ChevronLeft, Video, Clock, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Plus, Eye } from 'lucide-react-native';
import { SubmissionsService } from '@/services/submissions';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSubmissions } from '@/hooks/useRealtime';

interface Submission {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  teacher_feedback: string;
  created_at: string;
  reviewed_at: string;
  lessons: {
    title: string;
    levels: {
      title: string;
    };
  };
}

export default function SubmissionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use real-time submissions
  const realtimeSubmissions = useRealtimeSubmissions();

  useEffect(() => {
    if (realtimeSubmissions.length > 0) {
      setSubmissions(realtimeSubmissions);
      setLoading(false);
    } else {
      loadSubmissions();
    }
  }, [realtimeSubmissions]);

  const loadSubmissions = async () => {
    if (!user) return;

    try {
      const result = await SubmissionsService.getUserSubmissions(user.id);
      if (result.success) {
        setSubmissions(result.data);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSubmissions();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} color="#10B981" />;
      case 'rejected':
        return <XCircle size={16} color="#EF4444" />;
      case 'reviewed':
        return <Eye size={16} color="#3B82F6" />;
      default:
        return <Clock size={16} color="#F59E0B" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'reviewed':
        return '#3B82F6';
      default:
        return '#F59E0B';
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'approved':
        return '#F0FDF4';
      case 'rejected':
        return '#FEF2F2';
      case 'reviewed':
        return '#EFF6FF';
      default:
        return '#FFF7ED';
    }
  };

  const SubmissionCard = ({ submission }: { submission: Submission }) => (
    <TouchableOpacity 
      style={styles.submissionCard}
      onPress={() => router.push(`/submissions/${submission.id}`)}
    >
      <View style={styles.submissionHeader}>
        <View style={styles.submissionInfo}>
          <Text style={styles.submissionTitle}>{submission.title}</Text>
          <Text style={styles.submissionLesson}>
            {submission.lessons?.levels?.title} • {submission.lessons?.title}
          </Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getStatusBackground(submission.status) }
        ]}>
          {getStatusIcon(submission.status)}
          <Text style={[
            styles.statusText, 
            { color: getStatusColor(submission.status) }
          ]}>
            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
          </Text>
        </View>
      </View>
      
      {submission.description && (
        <Text style={styles.submissionDescription} numberOfLines={2}>
          {submission.description}
        </Text>
      )}
      
      <View style={styles.submissionMeta}>
        <Text style={styles.submissionDate}>
          Submitted {new Date(submission.created_at).toLocaleDateString()}
        </Text>
        {submission.reviewed_at && (
          <Text style={styles.reviewDate}>
            Reviewed {new Date(submission.reviewed_at).toLocaleDateString()}
          </Text>
        )}
      </View>
      
      {submission.teacher_feedback && (
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackLabel}>Teacher Feedback:</Text>
          <Text style={styles.feedbackText}>{submission.teacher_feedback}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Submissions</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/submissions/create')}
        >
          <Plus size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.section}>
          {submissions.length > 0 ? (
            submissions.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Video size={48} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No submissions yet</Text>
              <Text style={styles.emptyStateMessage}>
                Submit practice videos for your lessons to get feedback from teachers
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => router.push('/submissions/create')}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Submission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    flex: 1,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  submissionInfo: {
    flex: 1,
    marginRight: 12,
  },
  submissionTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  submissionLesson: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submissionDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  submissionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  submissionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  feedbackSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  feedbackLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});