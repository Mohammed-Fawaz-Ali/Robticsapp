import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Bell, Calendar, Video, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock, Upload, X, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface Announcement {
  id: string;
  type: 'general' | 'assignment' | 'event' | 'achievement';
  title: string;
  message: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
  dueDate?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  requiresVideo?: boolean;
  videoSubmitted?: boolean;
}

const AnnouncementCard: React.FC<{ announcement: Announcement }> = ({ announcement }) => {
  const getIcon = () => {
    switch (announcement.type) {
      case 'assignment':
        return <AlertCircle size={20} color="#F97316" />;
      case 'event':
        return <Calendar size={20} color="#8B5CF6" />;
      case 'achievement':
        return <CheckCircle size={20} color="#10B981" />;
      default:
        return <Bell size={20} color="#3B82F6" />;
    }
  };

  const getIconBackground = () => {
    switch (announcement.type) {
      case 'assignment':
        return '#FFF7ED';
      case 'event':
        return '#F5F3FF';
      case 'achievement':
        return '#F0FDF4';
      default:
        return '#EFF6FF';
    }
  };

  const getPriorityColor = () => {
    switch (announcement.priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
  };

  return (
    <View style={[styles.announcementCard, { borderLeftColor: getPriorityColor() }]}>
      <View style={styles.announcementHeader}>
        <View style={[styles.announcementIcon, { backgroundColor: getIconBackground() }]}>
          {getIcon()}
        </View>
        <View style={styles.announcementMeta}>
          <Text style={styles.announcementDate}>{announcement.date}</Text>
          {announcement.actionRequired && (
            <View style={styles.actionRequiredBadge}>
              <Text style={styles.actionRequiredText}>Action Required</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.announcementTitle}>{announcement.title}</Text>
      <Text style={styles.announcementMessage}>{announcement.message}</Text>
      {announcement.dueDate && (
        <View style={styles.dueDateContainer}>
          <Clock size={16} color="#F97316" />
          <Text style={styles.dueDateText}>Due: {announcement.dueDate}</Text>
        </View>
      )}
    </View>
  );
};

const EventCard: React.FC<{ 
  event: Event; 
  onVideoSubmission: (eventId: string) => void;
}> = ({ event, onVideoSubmission }) => (
  <View style={styles.eventCard}>
    <View style={styles.eventHeader}>
      <View style={styles.eventIcon}>
        <Calendar size={20} color="#3B82F6" />
      </View>
      <View style={styles.eventMeta}>
        <Text style={styles.eventDate}>{event.date} • {event.time}</Text>
        <Text style={styles.eventLocation}>{event.location}</Text>
      </View>
    </View>
    <Text style={styles.eventTitle}>{event.title}</Text>
    <Text style={styles.eventDescription}>{event.description}</Text>
    
    {event.requiresVideo && (
      <View style={styles.videoSubmissionSection}>
        {event.videoSubmitted ? (
          <View style={styles.videoSubmittedIndicator}>
            <CheckCircle size={16} color="#10B981" />
            <Text style={styles.videoSubmittedText}>Video submitted</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.videoSubmissionButton}
            onPress={() => onVideoSubmission(event.id)}
          >
            <Video size={16} color="#3B82F6" />
            <Text style={styles.videoSubmissionText}>Submit Video</Text>
          </TouchableOpacity>
        )}
      </View>
    )}
  </View>
);

const VideoSubmissionModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => void;
}> = ({ visible, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your video');
      return;
    }
    onSubmit(title, description);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Submit Event Video</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Video Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter a title for your video"
              value={title}
              onChangeText={setTitle}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Add a description or notes about your video"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.uploadSection}>
            <TouchableOpacity style={styles.uploadButton}>
              <Camera size={24} color="#3B82F6" />
              <Text style={styles.uploadButtonText}>Record Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadButton}>
              <Upload size={24} color="#3B82F6" />
              <Text style={styles.uploadButtonText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Video</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function AnnouncementsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'announcements' | 'events'>('announcements');
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Science Fair Preparation',
      description: 'Join us for a preparation meeting to discuss your Science Fair projects and get helpful tips.',
      date: 'Tomorrow',
      time: '2:00 PM',
      location: 'Room 205',
      requiresVideo: false,
    },
    {
      id: '2',
      title: 'Level 3 Project Showcase',
      description: 'Present your Level 3 final project to your peers and instructors. Video submission required.',
      date: 'This Friday',
      time: '10:00 AM',
      location: 'Main Auditorium',
      requiresVideo: true,
      videoSubmitted: false,
    },
    {
      id: '3',
      title: 'Study Group Session',
      description: 'Collaborative study session for upcoming Level 4 entrance exam.',
      date: 'Next Monday',
      time: '4:00 PM',
      location: 'Library Study Room',
      requiresVideo: false,
    },
  ]);

  const announcements: Announcement[] = [
    {
      id: '1',
      type: 'assignment',
      title: 'Level 3 Project Video Due Soon',
      message: 'Your Level 3 project video is due this Friday. Please make sure to submit your video through the events section.',
      date: 'Today',
      priority: 'high',
      actionRequired: true,
      dueDate: 'Friday, 2:00 PM',
    },
    {
      id: '2',
      type: 'achievement',
      title: 'Congratulations on Your Progress!',
      message: 'You\'ve successfully completed 65% of Level 3. Keep up the excellent work!',
      date: '1 day ago',
      priority: 'medium',
    },
    {
      id: '3',
      type: 'event',
      title: 'Science Fair Meeting Tomorrow',
      message: 'Don\'t forget about the Science Fair preparation meeting tomorrow at 2 PM in Room 205.',
      date: '1 day ago',
      priority: 'medium',
    },
    {
      id: '4',
      type: 'general',
      title: 'New Learning Materials Available',
      message: 'Additional study materials for Level 3 have been added to your course materials.',
      date: '3 days ago',
      priority: 'low',
    },
  ];

  const handleVideoSubmission = (eventId: string) => {
    setSelectedEventId(eventId);
    setVideoModalVisible(true);
  };

  const handleVideoSubmissionComplete = (title: string, description: string) => {
    setEvents(prev => prev.map(event => 
      event.id === selectedEventId 
        ? { ...event, videoSubmitted: true }
        : event
    ));
    Alert.alert('Success', 'Your video has been submitted successfully!');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
          onPress={() => setActiveTab('announcements')}
        >
          <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]}>
            Announcements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            Events
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {activeTab === 'announcements' ? (
          <View style={styles.section}>
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onVideoSubmission={handleVideoSubmission}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <VideoSubmissionModal
        visible={videoModalVisible}
        onClose={() => setVideoModalVisible(false)}
        onSubmit={handleVideoSubmissionComplete}
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
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  announcementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  announcementIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementMeta: {
    alignItems: 'flex-end',
  },
  announcementDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionRequiredBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  actionRequiredText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
  },
  announcementTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 8,
  },
  announcementMessage: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dueDateText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '600',
    marginLeft: 4,
  },
  eventCard: {
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
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventMeta: {
    flex: 1,
  },
  eventDate: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  eventLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  eventTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 12,
  },
  videoSubmissionSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  videoSubmissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  videoSubmissionText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  videoSubmittedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  videoSubmittedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    minHeight: 100,
  },
  uploadSection: {
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});