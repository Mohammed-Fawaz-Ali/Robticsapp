import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Settings,
  BookOpen,
  PenTool,
  Share,
  ChevronLeft,
  Clock,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function VideoPlayerScreen() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(180); // 3 minutes in seconds
  const [duration, setDuration] = useState(900); // 15 minutes in seconds
  const [volume, setVolume] = useState(80);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (direction: 'forward' | 'backward') => {
    const newTime = direction === 'forward' 
      ? Math.min(currentTime + 10, duration)
      : Math.max(currentTime - 10, 0);
    setCurrentTime(newTime);
  };

  const handleSaveNotes = () => {
    Alert.alert('Notes Saved', 'Your notes have been saved successfully.');
  };

  const progressPercentage = (currentTime / duration) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Level 3 - Lesson 8</Text>
            <Text style={styles.headerSubtitle}>Advanced Problem Solving</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          <View style={styles.videoPlaceholder}>
            <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
              {isPlaying ? (
                <Pause size={32} color="#FFFFFF" />
              ) : (
                <Play size={32} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Video Controls */}
          <View style={styles.controls}>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${progressPercentage}%` }]} 
                />
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.controlButtons}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleSeek('backward')}
              >
                <SkipBack size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mainControlButton}
                onPress={handlePlayPause}
              >
                {isPlaying ? (
                  <Pause size={28} color="#FFFFFF" />
                ) : (
                  <Play size={28} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => handleSeek('forward')}
              >
                <SkipForward size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Video Information */}
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle}>Advanced Problem Solving Techniques</Text>
          <Text style={styles.videoDescription}>
            In this lesson, we'll explore advanced problem-solving methodologies 
            and learn how to apply them to real-world scenarios. You'll discover 
            systematic approaches to breaking down complex problems.
          </Text>
          
          <View style={styles.videoMeta}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.metaText}>15 min</Text>
            </View>
            <View style={styles.metaItem}>
              <BookOpen size={16} color="#6B7280" />
              <Text style={styles.metaText}>Level 3</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, showNotes && styles.actionButtonActive]}
            onPress={() => setShowNotes(!showNotes)}
          >
            <PenTool size={20} color={showNotes ? "#FFFFFF" : "#3B82F6"} />
            <Text style={[styles.actionButtonText, showNotes && styles.actionButtonTextActive]}>
              Notes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <BookOpen size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Materials</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Notes Section */}
        {showNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Your Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Take notes while watching..."
              multiline
              numberOfLines={6}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
            <TouchableOpacity style={styles.saveNotesButton} onPress={handleSaveNotes}>
              <Text style={styles.saveNotesText}>Save Notes</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Related Content */}
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Related Lessons</Text>
          
          <TouchableOpacity style={styles.relatedItem}>
            <View style={styles.relatedThumbnail}>
              <Play size={16} color="#FFFFFF" />
            </View>
            <View style={styles.relatedContent}>
              <Text style={styles.relatedItemTitle}>Introduction to Problem Solving</Text>
              <Text style={styles.relatedItemMeta}>Level 3 • Lesson 7 • 12 min</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.relatedItem}>
            <View style={styles.relatedThumbnail}>
              <Play size={16} color="#FFFFFF" />
            </View>
            <View style={styles.relatedContent}>
              <Text style={styles.relatedItemTitle}>Practical Problem Solving</Text>
              <Text style={styles.relatedItemMeta}>Level 3 • Lesson 9 • 18 min</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Next Lesson */}
        <View style={styles.nextLessonSection}>
          <TouchableOpacity style={styles.nextLessonButton}>
            <Text style={styles.nextLessonText}>Next Lesson</Text>
            <Text style={styles.nextLessonTitle}>Practical Problem Solving</Text>
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  videoContainer: {
    backgroundColor: '#000000',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  controlButton: {
    padding: 8,
  },
  mainControlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  videoTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 8,
  },
  videoDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 16,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 16,
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  actionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  notesSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  notesTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    marginBottom: 12,
  },
  saveNotesButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveNotesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  relatedSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  relatedTitle: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 16,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  relatedThumbnail: {
    width: 48,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  relatedContent: {
    flex: 1,
  },
  relatedItemTitle: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  relatedItemMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  nextLessonSection: {
    padding: 20,
  },
  nextLessonButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  nextLessonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  nextLessonTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
});