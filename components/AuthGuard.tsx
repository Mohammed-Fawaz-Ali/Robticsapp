import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Database } from '@/types/database';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: Database['public']['Enums']['user_role'];
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user || !profile) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please sign in to continue</Text>
      </View>
    );
  }

  if (requiredRole && profile.role !== requiredRole) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Access denied. This feature requires {requiredRole} privileges.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

export function TeacherGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return fallback || (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Access denied. This feature requires teacher or admin privileges.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

export function AdminGuard({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="admin" fallback={fallback}>
      {children}
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
});