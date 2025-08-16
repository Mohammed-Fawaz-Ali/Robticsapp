import { useState, useEffect } from 'react';
import { CoursesService } from '@/services/courses';
import { Database } from '@/types/database';
import { useAuth } from './useAuth';

type Level = Database['public']['Tables']['levels']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

export function useCourses() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLevels();
    } else {
      setLevels([]);
      setLoading(false);
    }
  }, [user]);

  const loadLevels = async () => {
    if (!user) return;

    try {
      const result = await CoursesService.getLevels(user.id);
      if (result.success) {
        setLevels(result.data);
      }
    } catch (error) {
      console.error('Error loading levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelDetails = async (levelId: string) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      return await CoursesService.getLevelDetails(levelId, user.id);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get level details',
      };
    }
  };

  const getLessonDetails = async (lessonId: string) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      return await CoursesService.getLessonDetails(lessonId, user.id);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get lesson details',
      };
    }
  };

  const updateLessonProgress = async (
    lessonId: string,
    progress: {
      completed?: boolean;
      completion_percentage?: number;
      time_spent?: number;
      notes?: string;
    }
  ) => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      return await CoursesService.updateLessonProgress(user.id, lessonId, progress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update progress',
      };
    }
  };

  const getUserProgress = async () => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      return await CoursesService.getUserProgress(user.id);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user progress',
      };
    }
  };

  const getDashboardData = async () => {
    if (!user) return { success: false, error: 'No user logged in' };

    try {
      return await CoursesService.getDashboardData(user.id);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get dashboard data',
      };
    }
  };

  return {
    levels,
    loading,
    getLevelDetails,
    getLessonDetails,
    updateLessonProgress,
    getUserProgress,
    getDashboardData,
    refresh: loadLevels,
  };
}