import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Calendar, BookOpen, Trophy, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock, Settings } from 'lucide-react-native';

interface NotificationProps {
  id: string;
  type: 'lesson' | 'achievement' | 'reminder' | 'announcement' | 'assignment';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const NotificationCard: React.FC<NotificationProps & { onPress: () => void }> = ({
  type,
  title,
  message,
  time,
  read,
  onPress,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'lesson':
        return <BookOpen size={20} color="#3B82F6" />;
      case 'achievement':
        return <Trophy size={20} color="#F59E0B" />;
      case 'reminder':
        return <Clock size={20} color="#F97316" />;
      case 'announcement':
        return <Bell size={20} color="#8B5CF6" />;
      case 'assignment':
        return <AlertCircle size={20} color="#EF4444" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const getIconBackground = () => {
    switch (type) {
      case 'lesson':
        return '#EFF6FF';
      case 'achievement':
        return '#FFFBEB';
      case 'reminder':
        return '#FFF7ED';
      case 'announcement':
        return '#F5F3FF';
      case 'assignment':
        return '#FEF2F2';
      default:
        return '#F9FAFB';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.notificationCard, !read && styles.notificationUnread]} 
      onPress={onPress}
    >
      <View style={[styles.notificationIcon, { backgroundColor: getIconBackground() }]}>
        {getIcon()}
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !read && styles.notificationTitleUnread]}>
            {title}
          </Text>
          <Text style={styles.notificationTime}>{time}</Text>
        </View>
        <Text style={styles.notificationMessage}>{message}</Text>
      </View>
      {!read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const [pushEnabled, setPushEnabled] = React.useState(true);
  const [emailEnabled, setEmailEnabled] = React.useState(false);
  const [lessonReminders, setLessonReminders] = React.useState(true);
  const [achievements, setAchievements] = React.useState(true);

  const notifications: NotificationProps[] = [
    {
      id: '1',
      type: 'assignment',
      title: 'Assignment Due Soon',
      message: 'Level 3 project video is due in 2 days. Don\'t forget to submit!',
      time: '2h ago',
      read: false,
    },
    {
      id: '2',
      type: 'achievement',
      title: 'New Badge Earned!',
      message: 'Congratulations! You earned the "Persistent Learner" badge.',
      time: '1d ago',
      read: false,
    },
    {
      id: '3',
      type: 'lesson',
      title: 'New Lesson Available',
      message: 'Level 3, Lesson 9: "Advanced Problem Solving" is now available.',
      time: '2d ago',
      read: true,
    },
    {
      id: '4',
      type: 'reminder',
      title: 'Study Reminder',
      message: 'Time for your daily learning session! Keep up the great work.',
      time: '2d ago',
      read: true,
    },
    {
      id: '5',
      type: 'announcement',
      title: 'Science Fair Event',
      message: 'Join us for the Science Fair preparation meeting tomorrow at 2 PM.',
      time: '3d ago',
      read: true,
    },
    {
      id: '6',
      type: 'lesson',
      title: 'Weekly Progress Report',
      message: 'Great job this week! You completed 3 lessons and watched 5 videos.',
      time: '1w ago',
      read: true,
    },
  ];

  const handleNotificationPress = (id: string) => {
    // Handle notification tap - could navigate to specific content or mark as read
    console.log('Notification pressed:', id);
  };

  const handleMarkAllRead = () => {
    // Handle marking all notifications as read
    console.log('Mark all as read');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Settings */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingsButton}>
            <View style={styles.settingsIcon}>
              <Settings size={20} color="#3B82F6" />
            </View>
            <Text style={styles.settingsText}>Notification Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Settings */}
        <View style={styles.quickSettings}>
          <Text style={styles.quickSettingsTitle}>Quick Settings</Text>
          <View style={styles.quickSettingsGrid}>
            <View style={styles.quickSetting}>
              <View style={styles.quickSettingContent}>
                <Bell size={16} color="#3B82F6" />
                <Text style={styles.quickSettingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
                thumbColor={pushEnabled ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
            <View style={styles.quickSetting}>
              <View style={styles.quickSettingContent}>
                <Clock size={16} color="#F97316" />
                <Text style={styles.quickSettingLabel}>Lesson Reminders</Text>
              </View>
              <Switch
                value={lessonReminders}
                onValueChange={setLessonReminders}
                trackColor={{ false: '#D1D5DB', true: '#F97316' }}
                thumbColor={lessonReminders ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              {...notification}
              onPress={() => handleNotificationPress(notification.id)}
            />
          ))}
        </View>

        {/* Empty State (when no notifications) */}
        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Bell size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyStateTitle}>No notifications yet</Text>
            <Text style={styles.emptyStateMessage}>
              We'll notify you about lessons, achievements, and important updates.
            </Text>
          </View>
        )}
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
  title: {
    fontSize: 32,
    color: '#1F2937',
    fontWeight: '700',
  },
  markAllRead: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  quickSettings: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  quickSettingsTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 16,
  },
  quickSettingsGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quickSettingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickSettingLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    marginLeft: 12,
  },
  notificationsSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  notificationUnread: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  notificationTitleUnread: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    right: 12,
    top: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});