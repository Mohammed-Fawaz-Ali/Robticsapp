import React, { useState, useEffect } from 'react';
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
import { BookOpen, Play, CircleCheck as CheckCircle, Lock, Clock, Star, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LevelsService } from '@/services/levels';
import { useAuth } from '@/hooks/useAuth';
import { AccessRequestModal } from '@/components/AccessRequestModal';

const { width } = Dimensions.get('window');

interface LevelCardProps {
  level: number;
  title: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  isUnlocked: boolean;
  isActive: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const LevelCard: React.FC<LevelCardProps> = ({
  level,
  title,
  description,
  progress,
  totalLessons,
  completedLessons,
  isUnlocked,
  isActive,
  difficulty,
}) => {
  const router = useRouter();
  
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F97316';
      case 'Advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getGradientColors = () => {
    if (!isUnlocked) return ['#9CA3AF', '#6B7280'];
    if (isActive) return ['#3B82F6', '#1E40AF'];
    if (progress === 100) return ['#10B981', '#047857'];
    return ['#FFFFFF', '#F8FAFC'];
  };

  return (
    <TouchableOpacity 
      style={styles.levelCard}
      onPress={() => isUnlocked && router.push('/level-detail')}
      disabled={!isUnlocked}
    >
      <LinearGradient colors={getGradientColors()} style={styles.levelGradient}>
        <View style={styles.levelHeader}>
          <View style={styles.levelNumber}>
            <Text style={[styles.levelNumberText, { color: isUnlocked ? (isActive ? '#FFFFFF' : '#3B82F6') : '#FFFFFF' }]}>
              {level}
            </Text>
          </View>
          <View style={styles.levelStatus}>
            {!isUnlocked && <Lock size={20} color="#FFFFFF" />}
            {isUnlocked && progress === 100 && <CheckCircle size={20} color={isActive ? '#FFFFFF' : '#10B981'} />}
            {isUnlocked && progress < 100 && progress > 0 && <Clock size={20} color={isActive ? '#FFFFFF' : '#3B82F6'} />}
          </View>
        </View>
        
        <View style={styles.levelContent}>
          <Text style={[styles.levelTitle, { color: isUnlocked ? (isActive ? '#FFFFFF' : '#1F2937') : '#FFFFFF' }]}>
            {title}
          </Text>
          <Text style={[styles.levelDescription, { color: isUnlocked ? (isActive ? 'rgba(255, 255, 255, 0.8)' : '#6B7280') : 'rgba(255, 255, 255, 0.8)' }]}>
            {description}
          </Text>
          
          <View style={styles.levelMeta}>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() }]}>
              <Text style={styles.difficultyText}>{difficulty}</Text>
            </View>
            <Text style={[styles.lessonCount, { color: isUnlocked ? (isActive ? 'rgba(255, 255, 255, 0.8)' : '#6B7280') : 'rgba(255, 255, 255, 0.8)' }]}>
              {completedLessons}/{totalLessons} lessons
            </Text>
          </View>
          
          {isUnlocked && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: isActive ? '#FFFFFF' : '#3B82F6' }]} />
              </View>
              <Text style={[styles.progressText, { color: isActive ? 'rgba(255, 255, 255, 0.8)' : '#6B7280' }]}>
                {progress}% complete
              </Text>
            </View>
          )}
        </View>
        
        {isUnlocked && (
          <ChevronRight size={20} color={isActive ? '#FFFFFF' : '#6B7280'} style={styles.chevron} />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function CoursesScreen() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadLevels();
    }
  }, [user]);

  const loadLevels = async () => {
    if (!user) return;

    try {
      const result = await LevelsService.getLevelsWithAccess(user.id);
      if (result.success) {
        setLevels(result.data);
      }
    } catch (error) {
      console.error('Error loading levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLevelPress = (level: any) => {
    if (level.has_access) {
      router.push(`/level/${level.id}`);
    } else {
      setSelectedLevel(level);
      setShowAccessModal(true);
    }
  };

  // Fallback data if API fails or no data is loaded
  const fallbackLevels = [
    {
      level: 1,
      title: 'Introduction to Basics',
      description: 'Start your learning journey with fundamental concepts',
      progress: 100,
      totalLessons: 8,
      completedLessons: 8,
      isUnlocked: true,
      isActive: false,
      difficulty: 'Beginner' as const,
    },
    {
      level: 2,
      title: 'Building Foundations',
      description: 'Develop core skills and understanding',
      progress: 100,
      totalLessons: 10,
      completedLessons: 10,
      isUnlocked: true,
      isActive: false,
      difficulty: 'Beginner' as const,
    },
    {
      level: 3,
      title: 'Intermediate Concepts',
      description: 'Explore more complex topics and applications',
      progress: 65,
      totalLessons: 12,
      completedLessons: 8,
      isUnlocked: true,
      isActive: true,
      difficulty: 'Intermediate' as const,
    },
    {
      level: 4,
      title: 'Advanced Applications',
      description: 'Apply knowledge to real-world scenarios',
      progress: 0,
      totalLessons: 15,
      completedLessons: 0,
      isUnlocked: true,
      isActive: false,
      difficulty: 'Intermediate' as const,
    },
    {
      level: 5,
      title: 'Expert Techniques',
      description: 'Master advanced methodologies',
      progress: 0,
      totalLessons: 18,
      completedLessons: 0,
      isUnlocked: false,
      isActive: false,
      difficulty: 'Advanced' as const,
    },
    {
      level: 6,
      title: 'Professional Mastery',
      description: 'Achieve professional-level expertise',
      progress: 0,
      totalLessons: 20,
      completedLessons: 0,
      isUnlocked: false,
      isActive: false,
      difficulty: 'Advanced' as const,
    },
    {
      level: 7,
      title: 'Innovation & Leadership',
      description: 'Lead innovation and teach others',
      progress: 0,
      totalLessons: 25,
      completedLessons: 0,
      isUnlocked: false,
      isActive: false,
      difficulty: 'Advanced' as const,
    },
  ];

  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Course Levels</Text>
          <Text style={styles.subtitle}>Progress through 7 comprehensive levels</Text>
        </View>

        {/* Current Level Highlight */}
        <View style={styles.currentLevelSection}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          <TouchableOpacity style={styles.currentLevelCard} onPress={() => router.push('/level-detail')}>
            <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.currentLevelGradient}>
              <View style={styles.currentLevelContent}>
                <View style={styles.currentLevelHeader}>
                  <Text style={styles.currentLevelTitle}>Level 3: Intermediate Concepts</Text>
                  <View style={styles.currentLevelBadge}>
                    <Text style={styles.currentLevelBadgeText}>ACTIVE</Text>
                  </View>
                </View>
                <Text style={styles.currentLevelDescription}>
                  Lesson 8: Advanced Problem Solving
                </Text>
                <View style={styles.currentLevelActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/video-player')}>
                    <Play size={16} color="#3B82F6" />
                    <Text style={styles.actionButtonText}>Continue Video</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButtonSecondary}>
                    <BookOpen size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonSecondaryText}>View Materials</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* All Levels */}
        <View style={styles.allLevelsSection}>
          <Text style={styles.sectionTitle}>All Course Levels</Text>
          {(levels.length > 0 ? levels : fallbackLevels).map((level, index) => (
            <LevelCard key={index} {...level} />
          ))}
        </View>

        {/* Achievement Summary */}
        <View style={styles.achievementSection}>
          <Text style={styles.sectionTitle}>Your Achievements</Text>
          <View style={styles.achievementGrid}>
            <View style={styles.achievementCard}>
              <Star size={24} color="#F59E0B" />
              <Text style={styles.achievementNumber}>5</Text>
              <Text style={styles.achievementLabel}>Badges Earned</Text>
            </View>
            <View style={styles.achievementCard}>
              <CheckCircle size={24} color="#10B981" />
              <Text style={styles.achievementNumber}>28</Text>
              <Text style={styles.achievementLabel}>Lessons Complete</Text>
            </View>
            <View style={styles.achievementCard}>
              <Play size={24} color="#3B82F6" />
              <Text style={styles.achievementNumber}>15</Text>
              <Text style={styles.achievementLabel}>Videos Watched</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <AccessRequestModal
        visible={showAccessModal}
        levelId={selectedLevel?.id}
        levelTitle={selectedLevel?.title}
        levelNumber={selectedLevel?.level}
        onClose={() => setShowAccessModal(false)}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    color: '#1F2937',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  currentLevelSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 16,
  },
  currentLevelCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  currentLevelGradient: {
    padding: 24,
  },
  currentLevelContent: {
    gap: 16,
  },
  currentLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  currentLevelTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  currentLevelBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentLevelBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  currentLevelDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currentLevelActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonSecondaryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  allLevelsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  levelCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  levelNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelNumberText: {
    fontSize: 18,
    fontWeight: '700',
  },
  levelStatus: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  levelContent: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  levelDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  levelMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lessonCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chevron: {
    marginLeft: 8,
  },
  achievementSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  achievementGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  achievementNumber: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '700',
    marginTop: 8,
  },
  achievementLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
});