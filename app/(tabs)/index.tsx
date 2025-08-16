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
import {
  BookOpen,
  Play,
  Bell,
  Package,
  ChevronRight,
  Calendar,
  Users,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: readonly [string, string, ...string[]];
  onPress: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ icon, title, subtitle, gradient, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.quickActionContainer}>
    <LinearGradient colors={gradient} style={styles.quickAction}>
      <View style={styles.quickActionIcon}>{icon}</View>
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#FFFFFF" />
    </LinearGradient>
  </TouchableOpacity>
);

interface AnnouncementCardProps {
  title: string;
  description: string;
  date: string;
  type: 'info' | 'warning' | 'success';
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ title, description, date, type }) => {
  const getTypeColor = () => {
    switch (type) {
      case 'warning': return '#F97316';
      case 'success': return '#10B981';
      default: return '#3B82F6';
    }
  };

  return (
    <View style={[styles.announcementCard, { borderLeftColor: getTypeColor() }]}>
      <View style={styles.announcementHeader}>
        <Text style={styles.announcementTitle}>{title}</Text>
        <Text style={styles.announcementDate}>{date}</Text>
      </View>
      <Text style={styles.announcementDescription}>{description}</Text>
    </View>
  );
};

export default function DashboardScreen() {
  const router = useRouter();

  const quickActions = [
    {
      icon: <BookOpen size={24} color="#FFFFFF" />,
      title: 'Continue Learning',
      subtitle: 'Level 3 - Lesson 5',
      gradient: ['#3B82F6', '#1E40AF'] as const,
      onPress: () => router.push('/courses'),
    },
    {
      icon: <Play size={24} color="#FFFFFF" />,
      title: 'Watch Videos',
      subtitle: '3 new lessons available',
      gradient: ['#10B981', '#047857'] as const,
      onPress: () => router.push('/video-player'),
    },
    {
      icon: <Package size={24} color="#FFFFFF" />,
      title: 'Kit Orders',
      subtitle: 'Request materials',
      gradient: ['#F97316', '#EA580C'] as const,
      onPress: () => router.push('/kit-orders'),
    },
    {
      icon: <Bell size={24} color="#FFFFFF" />,
      title: 'Announcements',
      subtitle: '2 new updates',
      gradient: ['#8B5CF6', '#7C3AED'] as const,
      onPress: () => router.push('/announcements'),
    },
  ];

  const announcements = [
    {
      title: 'New Video Assignment',
      description: 'Submit your Level 3 project video by Friday',
      date: 'Today',
      type: 'warning' as const,
    },
    {
      title: 'Achievement Unlocked!',
      description: 'Congratulations on completing Level 2',
      date: '1 day ago',
      type: 'success' as const,
    },
    {
      title: 'Upcoming Event',
      description: 'Science Fair preparation meeting tomorrow',
      date: '2 days ago',
      type: 'info' as const,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.studentName}>Alex Johnson</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>AJ</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <LinearGradient
            colors={['#3B82F6', '#1E40AF']}
            style={styles.progressGradient}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Current Progress</Text>
              <Text style={styles.progressLevel}>Level 3</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '65%' }]} />
              </View>
              <Text style={styles.progressText}>65% Complete</Text>
            </View>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatNumber}>24</Text>
                <Text style={styles.progressStatLabel}>Lessons Done</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatNumber}>8</Text>
                <Text style={styles.progressStatLabel}>Videos Watched</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatNumber}>5</Text>
                <Text style={styles.progressStatLabel}>Badges Earned</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </View>
        </View>

        {/* Recent Announcements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            <TouchableOpacity onPress={() => router.push('/announcements')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          {announcements.map((announcement, index) => (
            <AnnouncementCard key={index} {...announcement} />
          ))}
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <TouchableOpacity style={styles.eventCard}>
            <View style={styles.eventIcon}>
              <Calendar size={20} color="#3B82F6" />
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>Science Fair</Text>
              <Text style={styles.eventDate}>Friday, 2:00 PM</Text>
            </View>
            <View style={styles.eventParticipants}>
              <Users size={16} color="#6B7280" />
              <Text style={styles.eventParticipantsText}>24 attending</Text>
            </View>
          </TouchableOpacity>
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
  studentName: {
    fontSize: 28,
    color: '#1F2937',
    fontWeight: '700',
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  progressCard: {
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
  progressGradient: {
    padding: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressLevel: {
    fontSize: 16,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatNumber: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#E0E7FF',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  quickActionsGrid: {
    gap: 12,
  },
  quickActionContainer: {
    marginBottom: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  announcementDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  announcementDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  eventCard: {
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
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  eventParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventParticipantsText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
});