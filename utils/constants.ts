// App constants and configuration

export const APP_CONFIG = {
  name: 'EduPlatform',
  version: '1.0.0',
  supportEmail: 'support@eduplatform.com',
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedVideoFormats: ['mp4', 'mov', 'avi', 'mkv'],
  maxVideoLength: 30 * 60, // 30 minutes in seconds
};

export const NOTIFICATION_TYPES = {
  LESSON: 'lesson',
  ACHIEVEMENT: 'achievement',
  REMINDER: 'reminder',
  ANNOUNCEMENT: 'announcement',
  ASSIGNMENT: 'assignment',
} as const;

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const BADGE_CRITERIA = {
  FIRST_LESSON: { lessons_completed: 1 },
  DEDICATED_LEARNER: { lessons_completed: 10 },
  LEVEL_1_COMPLETE: { levels_completed: 1 },
  LEVEL_2_COMPLETE: { levels_completed: 2 },
  LEVEL_3_COMPLETE: { levels_completed: 3 },
  WEEK_STREAK: { consecutive_days: 7 },
  MONTH_STREAK: { consecutive_days: 30 },
  VIDEO_MASTER: { videos_watched: 20 },
};

export const COLORS = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/auth/register',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  RESET_PASSWORD: '/auth/reset-password',
  
  // Courses
  LEVELS: '/courses/levels',
  LEVEL_DETAILS: '/courses/levels/:id',
  LESSONS: '/courses/lessons',
  LESSON_DETAILS: '/courses/lessons/:id',
  
  // Progress
  USER_PROGRESS: '/progress/user',
  UPDATE_PROGRESS: '/progress/lesson/:id',
  
  // Submissions
  SUBMISSIONS: '/submissions',
  SUBMISSION_DETAILS: '/submissions/:id',
  
  // Kit Orders
  KIT_ITEMS: '/kit/items',
  ORDERS: '/kit/orders',
  ORDER_DETAILS: '/kit/orders/:id',
  
  // Announcements
  ANNOUNCEMENTS: '/announcements',
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  MARK_READ: '/notifications/:id/read',
  
  // Analytics
  ANALYTICS: '/analytics',
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
};

export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_RESET: 'Password reset email sent!',
  ORDER_PLACED: 'Order placed successfully!',
  SUBMISSION_CREATED: 'Submission created successfully!',
  PROGRESS_SAVED: 'Progress saved!',
  NOTIFICATION_SENT: 'Notification sent successfully!',
};