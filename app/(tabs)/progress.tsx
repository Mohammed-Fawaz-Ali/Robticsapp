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
import { Trophy, Star, Award, Target, TrendingUp, Calendar, BookOpen, CircleCheck as CheckCircle } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface BadgeProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
}

const Badge: React.FC<BadgeProps> = ({ icon, title, description, earned, earnedDate }) => (
  <View style={[styles.badge, earned ? styles.badgeEarned : styles.badgeLocked]}>
    <View style={[styles.badgeIcon, earned ? styles.badgeIconEarned : styles.badgeIconLocked]}>
      {icon}
    </View>
    <Text style={[styles.badgeTitle, earned ? styles.badgeTitleEarned : styles.badgeTitleLocked]}>
      {title}
    </Text>
    <Text style={[styles.badgeDescription, earned ? styles.badgeDescriptionEarned : styles.badgeDescriptionLocked]}>
      {description}
    </Text>
    {earned && earnedDate && (
      <Text style={styles.badgeDate}>Earned {earnedDate}</Text>
    )}
  </View>
);

interface ProgressStatProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}

const ProgressStat: React.FC<ProgressStatProps> = ({ icon, value, label, color }) => (
  <View style={styles.progressStat}>
    <View style={[styles.progressStatIcon, { backgroundColor: color + '20' }]}>
      {React.cloneElement(icon as React.ReactElement, { size: 24, color })}
    </View>
    <Text style={styles.progressStatValue}>{value}</Text>
    <Text style={styles.progressStatLabel}>{label}</Text>
  </View>
);

export default function ProgressScreen() {
  const badges = [
    {
      icon: <Star size={24} color="#F59E0B" />,
      title: 'First Steps',
      description: 'Complete your first lesson',
      earned: true,
      earnedDate: '2 months ago',
    },
    {
      icon: <BookOpen size={24} color="#3B82F6" />,
      title: 'Dedicated Learner',
      description: 'Complete 10 lessons',
      earned: true,
      earnedDate: '1 month ago',
    },
    {
      icon: <Target size={24} color="#10B981" />,
      title: 'Goal Crusher',
      description: 'Complete Level 1',
      earned: true,
      earnedDate: '1 month ago',
    },
    {
      icon: <TrendingUp size={24} color="#8B5CF6" />,
      title: 'Rising Star',
      description: 'Complete Level 2',
      earned: true,
      earnedDate: '3 weeks ago',
    },
    {
      icon: <Trophy size={24} color="#F97316" />,
      title: 'Persistent',
      description: 'Study for 7 days straight',
      earned: true,
      earnedDate: '2 weeks ago',
    },
    {
      icon: <Award size={24} color="#EF4444" />,
      title: 'Video Master',
      description: 'Watch 20 video lessons',
      earned: false,
    },
    {
      icon: <CheckCircle size={24} color="#06B6D4" />,
      title: 'Halfway Hero',
      description: 'Complete Level 3',
      earned: false,
    },
    {
      icon: <Calendar size={24} color="#84CC16" />,
      title: 'Monthly Champion',
      description: 'Study every day for a month',
      earned: false,
    },
  ];

  const progressStats = [
    {
      icon: <BookOpen size={24} color="#3B82F6" />,
      value: '28',
      label: 'Lessons Completed',
      color: '#3B82F6',
    },
    {
      icon: <Trophy size={24} color="#F59E0B" />,
      value: '5',
      label: 'Badges Earned',
      color: '#F59E0B',
    },
    {
      icon: <Target size={24} color="#10B981" />,
      value: '2',
      label: 'Levels Completed',
      color: '#10B981',
    },
    {
      icon: <Calendar size={24} color="#8B5CF6" />,
      value: '45',
      label: 'Days Studying',
      color: '#8B5CF6',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
          <Text style={styles.subtitle}>Track your learning journey</Text>
        </View>

        {/* Overall Progress Card */}
        <View style={styles.overallProgressCard}>
          <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.overallProgressGradient}>
            <View style={styles.overallProgressHeader}>
              <Text style={styles.overallProgressTitle}>Learning Progress</Text>
              <View style={styles.overallProgressBadge}>
                <Text style={styles.overallProgressLevel}>Level 3</Text>
              </View>
            </View>
            
            <View style={styles.progressCircleContainer}>
              <View style={styles.progressCircle}>
                <View style={styles.progressCircleInner}>
                  <Text style={styles.progressPercentage}>65%</Text>
                  <Text style={styles.progressLabel}>Complete</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.progressDetails}>
              <Text style={styles.progressDetailText}>
                8 out of 12 lessons completed in Level 3
              </Text>
              <Text style={styles.progressSubText}>
                Keep going! You're doing great.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Progress Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            {progressStats.map((stat, index) => (
              <ProgressStat key={index} {...stat} />
            ))}
          </View>
        </View>

        {/* Recent Achievements */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.recentAchievements}>
            <View style={styles.recentAchievement}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.recentAchievementIcon}>
                <Trophy size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.recentAchievementContent}>
                <Text style={styles.recentAchievementTitle}>Persistent Learner</Text>
                <Text style={styles.recentAchievementDate}>Earned 2 weeks ago</Text>
              </View>
            </View>
            <View style={styles.recentAchievement}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.recentAchievementIcon}>
                <TrendingUp size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.recentAchievementContent}>
                <Text style={styles.recentAchievementTitle}>Rising Star</Text>
                <Text style={styles.recentAchievementDate}>Earned 3 weeks ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* All Badges */}
        <View style={styles.badgesSection}>
          <View style={styles.badgesHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <Text style={styles.badgesCount}>5 of 8 earned</Text>
          </View>
          <View style={styles.badgesGrid}>
            {badges.map((badge, index) => (
              <Badge key={index} {...badge} />
            ))}
          </View>
        </View>

        {/* Weekly Goal */}
        <View style={styles.goalSection}>
          <Text style={styles.sectionTitle}>Weekly Goal</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>Complete 5 Lessons</Text>
                <Text style={styles.goalProgress}>3 of 5 completed</Text>
              </View>
              <View style={styles.goalIcon}>
                <Target size={24} color="#3B82F6" />
              </View>
            </View>
            <View style={styles.goalProgressBar}>
              <View style={[styles.goalProgressFill, { width: '60%' }]} />
            </View>
            <Text style={styles.goalTimeLeft}>2 days left</Text>
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
  overallProgressCard: {
    marginHorizontal: 20,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overallProgressGradient: {
    padding: 24,
    alignItems: 'center',
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  overallProgressTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  overallProgressBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  overallProgressLevel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressCircleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '45deg' }],
  },
  progressCircleInner: {
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  progressDetails: {
    alignItems: 'center',
  },
  progressDetailText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressSubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  progressStat: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  progressStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStatValue: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '700',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  recentAchievements: {
    gap: 12,
  },
  recentAchievement: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recentAchievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentAchievementContent: {
    flex: 1,
  },
  recentAchievementTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  recentAchievementDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  badgesSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgesCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    width: (width - 60) / 2,
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
  badgeEarned: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  badgeLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIconEarned: {
    backgroundColor: '#F0FDF4',
  },
  badgeIconLocked: {
    backgroundColor: '#F3F4F6',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeTitleEarned: {
    color: '#1F2937',
  },
  badgeTitleLocked: {
    color: '#9CA3AF',
  },
  badgeDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeDescriptionEarned: {
    color: '#6B7280',
  },
  badgeDescriptionLocked: {
    color: '#9CA3AF',
  },
  badgeDate: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 8,
  },
  goalSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  goalProgress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 12,
  },
  goalProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  goalTimeLeft: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '500',
  },
});