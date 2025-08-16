import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Users, CircleCheck as CheckCircle, Circle as XCircle, Clock, UserPlus } from 'lucide-react-native';
import { TeacherGuard } from '@/components/AuthGuard';
import { LevelsService } from '@/services/levels';
import { AuthService } from '@/services/auth';

interface AccessRequest {
  id: string;
  user_id: string;
  level_id: string;
  message: string;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
  };
  levels: {
    title: string;
    level_number: number;
  };
}

interface Student {
  id: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function AccessManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'students'>('requests');
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load access requests
      const requestsResult = await LevelsService.getAccessRequests();
      if (requestsResult.success) {
        setAccessRequests(requestsResult.data);
      }

      // Load students (this would need to be implemented in AuthService)
      // For now, we'll use a placeholder
      setStudents([]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const result = await LevelsService.reviewAccessRequest(requestId, 'approved', 'current_user_id');
      
      if (result.success) {
        Alert.alert('Success', 'Access request approved successfully');
        setAccessRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        Alert.alert('Error', result.error || 'Failed to approve request');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this access request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await LevelsService.reviewAccessRequest(requestId, 'rejected', 'current_user_id');
              
              if (result.success) {
                Alert.alert('Success', 'Access request rejected');
                setAccessRequests(prev => prev.filter(req => req.id !== requestId));
              } else {
                Alert.alert('Error', result.error || 'Failed to reject request');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };

  const RequestCard = ({ request }: { request: AccessRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <Text style={styles.requestStudent}>{request.profiles.full_name}</Text>
          <Text style={styles.requestLevel}>
            Level {request.levels.level_number}: {request.levels.title}
          </Text>
        </View>
        <View style={styles.requestDate}>
          <Clock size={12} color="#6B7280" />
          <Text style={styles.requestDateText}>
            {new Date(request.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.requestMessage}>{request.message}</Text>
      
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectRequest(request.id)}
        >
          <XCircle size={16} color="#EF4444" />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApproveRequest(request.id)}
        >
          <CheckCircle size={16} color="#FFFFFF" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredRequests = accessRequests.filter(request =>
    request.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.levels.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TeacherGuard>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Access Management</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
            onPress={() => setActiveTab('requests')}
          >
            <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
              Access Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'students' && styles.activeTab]}
            onPress={() => setActiveTab('students')}
          >
            <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
              Students
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'requests' ? 'Search requests...' : 'Search students...'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
          {activeTab === 'requests' ? (
            <View style={styles.section}>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <UserPlus size={48} color="#D1D5DB" />
                  <Text style={styles.emptyStateTitle}>No pending requests</Text>
                  <Text style={styles.emptyStateMessage}>
                    Student access requests will appear here for review
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.section}>
              <View style={styles.emptyState}>
                <Users size={48} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>Student Management</Text>
                <Text style={styles.emptyStateMessage}>
                  Student management features coming soon
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </TeacherGuard>
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
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestStudent: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  requestLevel: {
    fontSize: 14,
    color: '#6B7280',
  },
  requestDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requestDateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  requestMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  approveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '600',
    marginTop: 16,
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