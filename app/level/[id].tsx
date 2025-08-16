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
import { ChevronLeft, Play, BookOpen, Lock, CircleCheck as CheckCircle, Clock, Users, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LevelsService } from '@/services/levels';
import { AccessRequestModal } from '@/components/AccessRequestModal';
import { useAuth } from '@/hooks/useAuth';

export default function LevelDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [levelData, setLevelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAccessModal, setShowAccessModal] = useState(false);

  useEffect(() => {
    if (id && user) {
      loadLevelDetails();
    }
  }, [id, user]);

  const loadLevelDetails = async () => {
    if (!user || !id) return;

    try {
      const result = await LevelsService.getLevelDetails(id as string, user.id);
      if (result.success) {
        setLevelData(result.data);
      } else {
        Alert.alert('Error', result.error || 'Failed to load level');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load level details');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonPress = (lesson: any) => {
    if (!levelData?.has_access) {
      setShowAccessModal(true);
      return;
    }
    router.push(`/lesson/${lesson.id}`);
  };

  const handleRequestAccess = () => {
    setShowAccessModal(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading level...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!levelData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Level not found</Text>
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

  const { level, lessons, has_access, progress } = levelData;

  const LessonItem = ({ lesson, index }: { lesson: any; index: number }) => {
    const lessonProgress = lesson.student_progress?.[0];
    const isCompleted = lessonProgress?.completed;
    const isLocked = !has_access;

    return (
      <TouchableOpacity 
        style={[
          styles.lessonItem,
          isCompleted && styles.lessonCompleted,
          isLocked && styles.lessonLocked
        ]}
        onPress={() => handleLessonPress(lesson)}
        disabled={isLocked}
      >
        <View style={styles.lessonIcon}>
          {isLocked ? (
            <Lock size={20} color="#9CA3AF" />
          ) : isCompleted ? (
            <CheckCircle size={20} color="#10B981" />
          ) : (
            <Play size={20} color="#3B82F6" />
          )}
        </View>
        
        <View style={styles.lessonContent}>
          <Text style={[
            styles.lessonTitle,
            isLocked && styles.lessonTitleLocked
          ]}>
            {lesson.title}
          </Text>
          {lesson.description && (
            <Text style={[
              styles.lessonDescription,
              isLocked && styles.lessonDescriptionLocked
            ]}>
              {lesson.description}
            </Text>
          )}
          <View style={styles.lessonMeta}>
            <Text style={[
              styles.lessonDuration,
              isLocked && styles.lessonMetaLocked
            ]}>
              {lesson.duration ? `${Math.ceil(lesson.duration / 60)} min` : 'Duration varies'}
            </Text>
          </View>
        </View>
        
        {isCompleted && (
          <View style={styles.completedBadge}>
            <CheckCircle size={16} color="#10B981" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Level {level.level_number}</Text>
            <Text style={styles.headerSubtitle}>{level.title}</Text>
          </View>
        </View>

        {/* Level Overview */}
        <View style={styles.overviewCard}>
          <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.overviewGradient}>
            <Text style={styles.overviewTitle}>{level.title}</Text>
            {level.description && (
              <Text style={styles.overviewDescription}>{level.description}</Text>
            )}
            
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNumber}>{lessons.length}</Text>
                <Text style={styles.overviewStatLabel}>Total Lessons</Text>
              </View>
              <View style={styles.overviewStatDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNumber}>{progress.progress_percentage}%</Text>
                <Text style={styles.overviewStatLabel}>Complete</Text>
              </View>
              <View style={styles.overviewStatDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.overviewStatNumber}>
                  {Math.ceil(lessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0) / 60)}m
                </Text>
                <Text style={styles.overviewStatLabel}>Total Time</Text>
              </View>
            </View>
            
            {has_access && (
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress.progress_percentage}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {progress.completed_lessons} of {progress.total_lessons} lessons completed
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Access Status */}
        {!has_access && (
          <View style={styles.accessSection}>
            <View style={styles.accessCard}>
              <Lock size={24} color="#EF4444" />
              <Text style={styles.accessTitle}>Access Required</Text>
              <Text style={styles.accessMessage}>
                This level requires special access. Request access to unlock all lessons.
              </Text>
              <TouchableOpacity 
                style={styles.requestAccessButton}
                onPress={handleRequestAccess}
              >
                <Text style={styles.requestAccessText}>Request Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Lessons List */}
        <View style={styles.lessonsSection}>
          <Text style={styles.lessonsTitle}>Course Content</Text>
          {lessons.map((lesson: any, index: number) => (
            <LessonItem key={lesson.id} lesson={lesson} index={index} />
          ))}
        </View>
      </ScrollView>

      <AccessRequestModal
        visible={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        levelId={level.id}
        levelTitle={level.title}
        levelNumber={level.level_number}
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
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#3B82F6',
  },
  headerBackButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
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
  backButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overviewCard: {
    marginHorizontal: 20,
    marginTop: -12,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overviewGradient: {
    padding: 24,
  },
  overviewTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  overviewDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: 20,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewStatNumber: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  overviewStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  overviewStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  accessSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  accessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  accessTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  accessMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  requestAccessButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  requestAccessText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lessonsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  lessonsTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 16,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lessonCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  lessonLocked: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  lessonIcon: {
    marginRight: 12,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginBottom: 4,
  },
  lessonTitleLocked: {
    color: '#9CA3AF',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  lessonDescriptionLocked: {
    color: '#9CA3AF',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonDuration: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  lessonMetaLocked: {
    color: '#9CA3AF',
  },
  completedBadge: {
    marginLeft: 12,
  },
});