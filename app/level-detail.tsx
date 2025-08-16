import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Play, BookOpen, CircleCheck as CheckCircle, Lock, Clock, Download, Star, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface LessonItemProps {
  id: number;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz';
  completed: boolean;
  locked: boolean;
}

const LessonItem: React.FC<LessonItemProps> = ({
  id,
  title,
  duration,
  type,
  completed,
  locked,
}) => {
  const router = useRouter();
  
  const getIcon = () => {
    if (locked) return <Lock size={20} color="#9CA3AF" />;
    if (completed) return <CheckCircle size={20} color="#10B981" />;
    
    switch (type) {
      case 'video':
        return <Play size={20} color="#3B82F6" />;
      case 'reading':
        return <BookOpen size={20} color="#8B5CF6" />;
      case 'quiz':
        return <Star size={20} color="#F59E0B" />;
      default:
        return <Play size={20} color="#3B82F6" />;
    }
  };

  const getBackgroundColor = () => {
    if (locked) return '#F9FAFB';
    if (completed) return '#F0FDF4';
    return '#FFFFFF';
  };

  const getBorderColor = () => {
    if (completed) return '#10B981';
    if (locked) return '#E5E7EB';
    return '#E5E7EB';
  };

  return (
    <TouchableOpacity 
      style={[
        styles.lessonItem,
        { 
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        }
      ]}
      onPress={() => !locked && type === 'video' && router.push('/video-player')}
      disabled={locked}
    >
      <View style={styles.lessonIcon}>{getIcon()}</View>
      <View style={styles.lessonContent}>
        <Text style={[styles.lessonTitle, locked && styles.lessonTitleLocked]}>
          {title}
        </Text>
        <View style={styles.lessonMeta}>
          <Text style={[styles.lessonDuration, locked && styles.lessonMetaLocked]}>
            {duration}
          </Text>
          <Text style={[styles.lessonType, locked && styles.lessonMetaLocked]}>
            • {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        </View>
      </View>
      {completed && (
        <View style={styles.completedBadge}>
          <CheckCircle size={16} color="#10B981" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function LevelDetailScreen() {
  const router = useRouter();
  
  const lessons: LessonItemProps[] = [
    {
      id: 1,
      title: 'Introduction to Intermediate Concepts',
      duration: '12 min',
      type: 'video',
      completed: true,
      locked: false,
    },
    {
      id: 2,
      title: 'Understanding Complex Systems',
      duration: '15 min',
      type: 'video',
      completed: true,
      locked: false,
    },
    {
      id: 3,
      title: 'Reading: System Architecture',
      duration: '8 min',
      type: 'reading',
      completed: true,
      locked: false,
    },
    {
      id: 4,
      title: 'Knowledge Check: Basics',
      duration: '5 min',
      type: 'quiz',
      completed: true,
      locked: false,
    },
    {
      id: 5,
      title: 'Advanced Data Structures',
      duration: '18 min',
      type: 'video',
      completed: true,
      locked: false,
    },
    {
      id: 6,
      title: 'Algorithms and Efficiency',
      duration: '20 min',
      type: 'video',
      completed: true,
      locked: false,
    },
    {
      id: 7,
      title: 'Practical Applications',
      duration: '14 min',
      type: 'video',
      completed: true,
      locked: false,
    },
    {
      id: 8,
      title: 'Advanced Problem Solving',
      duration: '15 min',
      type: 'video',
      completed: false,
      locked: false,
    },
    {
      id: 9,
      title: 'Practical Problem Solving',
      duration: '18 min',
      type: 'video',
      completed: false,
      locked: false,
    },
    {
      id: 10,
      title: 'Reading: Case Studies',
      duration: '10 min',
      type: 'reading',
      completed: false,
      locked: false,
    },
    {
      id: 11,
      title: 'Level Assessment',
      duration: '30 min',
      type: 'quiz',
      completed: false,
      locked: false,
    },
    {
      id: 12,
      title: 'Final Project',
      duration: '45 min',
      type: 'quiz',
      completed: false,
      locked: true,
    },
  ];

  const completedLessons = lessons.filter(lesson => lesson.completed).length;
  const totalLessons = lessons.length;
  const progressPercentage = (completedLessons / totalLessons) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Level 3</Text>
            <Text style={styles.headerSubtitle}>Intermediate Concepts</Text>
          </View>
        </View>

        {/* Level Overview */}
        <View style={styles.overviewCard}>
          <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.overviewGradient}>
            <View style={styles.overviewContent}>
              <Text style={styles.overviewTitle}>Intermediate Concepts</Text>
              <Text style={styles.overviewDescription}>
                Explore more complex topics and applications. Build upon your foundational 
                knowledge to tackle real-world challenges.
              </Text>
              
              <View style={styles.overviewStats}>
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatNumber}>{totalLessons}</Text>
                  <Text style={styles.overviewStatLabel}>Total Lessons</Text>
                </View>
                <View style={styles.overviewStatDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatNumber}>{Math.floor(progressPercentage)}%</Text>
                  <Text style={styles.overviewStatLabel}>Complete</Text>
                </View>
                <View style={styles.overviewStatDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.overviewStatNumber}>3.5h</Text>
                  <Text style={styles.overviewStatLabel}>Total Time</Text>
                </View>
              </View>
              
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {completedLessons} of {totalLessons} lessons completed
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/video-player')}
          >
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Continue Learning</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={styles.secondaryButton}>
              <Download size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Users size={20} color="#3B82F6" />
              <Text style={styles.secondaryButtonText}>Discuss</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lessons List */}
        <View style={styles.lessonsSection}>
          <Text style={styles.lessonsTitle}>Course Content</Text>
          {lessons.map((lesson) => (
            <LessonItem key={lesson.id} {...lesson} />
          ))}
        </View>

        {/* Course Information */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About This Level</Text>
          <Text style={styles.infoDescription}>
            Level 3 introduces intermediate concepts that build upon the foundational 
            knowledge from previous levels. You'll learn about complex systems, advanced 
            data structures, and problem-solving methodologies that prepare you for 
            real-world applications.
          </Text>
          
          <View style={styles.infoPoints}>
            <View style={styles.infoPoint}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.infoPointText}>
                Master advanced data structures and algorithms
              </Text>
            </View>
            <View style={styles.infoPoint}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.infoPointText}>
                Learn systematic problem-solving approaches
              </Text>
            </View>
            <View style={styles.infoPoint}>
              <CheckCircle size={16} color="#10B981" />
              <Text style={styles.infoPointText}>
                Apply concepts to practical scenarios
              </Text>
            </View>
          </View>
        </View>

        {/* Prerequisites */}
        <View style={styles.prerequisitesSection}>
          <Text style={styles.prerequisitesTitle}>Prerequisites</Text>
          <View style={styles.prerequisiteItem}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.prerequisiteText}>Level 1: Introduction to Basics</Text>
          </View>
          <View style={styles.prerequisiteItem}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.prerequisiteText}>Level 2: Building Foundations</Text>
          </View>
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
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#3B82F6',
  },
  backButton: {
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
  overviewContent: {
    gap: 20,
  },
  overviewTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  overviewDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
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
  primaryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#3B82F6',
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
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
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonDuration: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  lessonType: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  lessonMetaLocked: {
    color: '#9CA3AF',
  },
  completedBadge: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 12,
  },
  infoDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  infoPoints: {
    gap: 12,
  },
  infoPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoPointText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  prerequisitesSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  prerequisitesTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 16,
  },
  prerequisiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  prerequisiteText: {
    fontSize: 16,
    color: '#1F2937',
  },
});