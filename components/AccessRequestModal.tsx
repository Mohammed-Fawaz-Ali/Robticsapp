import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Lock, Send } from 'lucide-react-native';
import { LevelsService } from '@/services/levels';

interface AccessRequestModalProps {
  visible: boolean;
  onClose: () => void;
  levelId: string;
  levelTitle: string;
  levelNumber: number;
}

export function AccessRequestModal({
  visible,
  onClose,
  levelId,
  levelTitle,
  levelNumber,
}: AccessRequestModalProps) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitRequest = async () => {
    if (!message.trim()) {
      Alert.alert('Message Required', 'Please provide a reason for requesting access.');
      return;
    }

    setLoading(true);
    try {
      const result = await LevelsService.requestAccess(levelId, message);
      
      if (result.success) {
        Alert.alert(
          'Request Submitted',
          'Your access request has been submitted. You will be notified when it\'s reviewed.',
          [{ text: 'OK', onPress: onClose }]
        );
        setMessage('');
      } else {
        Alert.alert('Error', result.error || 'Failed to submit request');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Request Access</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.levelInfo}>
            <View style={styles.lockIcon}>
              <Lock size={32} color="#EF4444" />
            </View>
            <Text style={styles.levelTitle}>Level {levelNumber}</Text>
            <Text style={styles.levelName}>{levelTitle}</Text>
            <Text style={styles.levelDescription}>
              This level requires special access. Please provide a reason for your request.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Reason for Request</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Why do you need access to this level?"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitRequest}
            disabled={loading}
          >
            <Send size={16} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  levelInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  lockIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: '700',
    marginBottom: 4,
  },
  levelName: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 12,
  },
  levelDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  footer: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});