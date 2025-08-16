import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useRealtimeAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Load initial announcements
    const loadAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setAnnouncements(data);
      }
    };

    loadAnnouncements();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          setAnnouncements(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return announcements;
}

export function useRealtimeSubmissions() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Load initial submissions based on role
    const loadSubmissions = async () => {
      let query = supabase
        .from('submissions')
        .select(`
          *,
          profiles(full_name),
          lessons(title, levels(title))
        `)
        .order('created_at', { ascending: false });

      // Students see only their submissions
      if (profile?.role === 'student') {
        query = query.eq('user_id', user.id);
      }

      const { data } = await query;

      if (data) {
        setSubmissions(data);
      }
    };

    loadSubmissions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('submissions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSubmissions(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSubmissions(prev =>
              prev.map(submission =>
                submission.id === payload.new.id ? payload.new : submission
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile]);

  return submissions;
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Load initial notifications
    const loadNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data);
      }
    };

    loadNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev =>
            prev.map(notification =>
              notification.id === payload.new.id ? payload.new : notification
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return notifications;
}