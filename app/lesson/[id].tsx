import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Play, BookOpen, Upload, Clock, CircleCheck as CheckCircle, Lock } from 'lucide-react-native';
import { LessonsService } from '@/services/lessons';
import { VideoPlayer } from '@/components/VideoPlayer';
import { SubmissionModal } from '@/components/SubmissionModal';
import { AccessRequestModal } from '@/components/AccessRequestModal';
import { useAuth } from '@/hooks/useAuth';

export default function LessonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadLessonDetails();
    }
  }, [id, user]);

  const loadLessonDetails = async () => {
    if (!user || !id) return;

    try {
      const result = await LessonsService.getLessonDetails(id as string, user.id);
      if (result.success) {
        setLesson(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to load lesson');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load lesson details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = () => {
    if (!lesson?.has_access) {
      setShowAccessModal(true);
      return;
    }
    setShowVideoPlayer(true);
  };

  const handleSubmitPractice = () => {
    if (!lesson?.has_access) {
      setShowAccessModal(true);
      return;
    }
    setShowSubmissionModal(true);
  };

  const handleVideoProgress = async (progress: number) => {
    if (!user || !lesson) return;

    // Update progress every 10%
    if (progress % 10 === 0) {
      await LessonsService.updateProgress(user.id, lesson.id, {
        completion_percentage: progress,
        last_accessed: new Date().toISOString(),
      });
    }
  };

  const handleVideoComplete = async () => {
    if (!user || !lesson) return;

    await LessonsService.updateProgress(user.id, lesson.id, {
      completed: true,
      completion_percentage: 100,
      last_accessed: new Date().toISOString(),
    });

    Alert.alert('Lesson Complete!', 'Great job completing this lesson!');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Lesson not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (showVideoPlayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.videoHeader}>
          <TouchableOpacity 
            style={styles.videoBackButton}
            onPress={() => setShowVideoPlayer(false)}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.videoTitle}>{lesson.title}</Text>
        </View>
        <VideoPlayer
          lessonId={lesson.id}
          onProgress={handleVideoProgress}
          onComplete={handleVideoComplete}
        />
      </SafeAreaView>
    );
  }

  const progress = lesson.student_progress?.[0];
  const isCompleted = progress?.completed;
  const completionPercentage = progress?.completion_percentage || 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lesson Details</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Lesson Info */}
        <View style={styles.lessonInfo}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              {lesson.levels?.title}
            </Text>
          </View>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          {lesson.description && (
            <Text style={styles.lessonDescription}>{lesson.description}</Text>
          )}
          
          <View style={styles.lessonMeta}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.metaText}>
                {lesson.duration ? `${Math.ceil(lesson.duration / 60)} min` : 'Duration varies'}
              </Text>
            </View>
            {isCompleted && (
              <View style={styles.metaItem}>
                <CheckCircle size={16} color="#10B981" />
                <Text style={[styles.metaText, { color: '#10B981' }]}>Completed</Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          {completionPercentage > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${completionPercentage}%` }]} />
              </View>
              <Text style={styles.progressText}>{completionPercentage}% complete</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.primaryButton, !lesson.has_access && styles.lockedButton]}
            onPress={handlePlayVideo}
          >
            {lesson.has_access ? (
              <>
                <Play size={20} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Watch Lesson</Text>
              </>
            ) : (
              <>
                <Lock size={20} color="#6B7280" />
                <Text style={[styles.primaryButtonText, { color: '#6B7280' }]}>
                  Request Access
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryButton, !lesson.has_access && styles.lockedButton]}
            onPress={handleSubmitPractice}
            disabled={!lesson.has_access}
          >
            <Upload size={20} color={lesson.has_access ? "#3B82F6" : "#9CA3AF"} />
            <Text style={[
              styles.secondaryButtonText, 
              !lesson.has_access && { color: '#9CA3AF' }
            ]}>
              Submit Practice
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lesson Content */}
        {lesson.content && (
          <View style={styles.contentSection}>
            <Text style={styles.contentTitle}>Lesson Materials</Text>
            <View style={styles.contentCard}>
              <BookOpen size={20} color="#3B82F6" />
              <Text style={styles.contentText}>
                Additional materials and resources for this lesson
              </Text>
            </View>
          </View>
        )}

        {/* Notes Section */}
        {progress?.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Your Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{progress.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <SubmissionModal
        visible={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        onSubmissionComplete={() => {
          // Refresh lesson data
          loadLessonDetails();
        }}
      />

      <AccessRequestModal
        visible={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        levelId={lesson.levels?.id}
        levelTitle={lesson.levels?.title}
        levelNumber={lesson.levels?.level_number}
      />
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
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000000',
  },
  videoBackButton: {
    padding: 8,
    marginRight: 12,
  },
  videoTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  lessonInfo: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  levelBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  lessonTitle: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  lockedButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  contentSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  contentTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 12,
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  contentText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  notesSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  notesTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 12,
  },
  notesCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
});