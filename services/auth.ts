import { supabase, signUp, signIn, signOut, getCurrentUser, resetPassword } from '@/lib/supabase';
import { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

export class AuthService {
  // Register new user
  static async register(email: string, password: string, fullName: string) {
    try {
      const { data, error } = await signUp(email, password, fullName);
      
      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        user: data.user,
        message: 'Registration successful! Please check your email to verify your account.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  // Login user
  static async login(email: string, password: string) {
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        throw new Error(error.message);
      }

      // Get user profile
      const profile = await this.getUserProfile(data.user.id);

      return {
        success: true,
        user: data.user,
        profile: profile.data,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  // Logout user
  static async logout() {
    try {
      const { error } = await signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const { user, error } = await getCurrentUser();
      
      if (error) {
        throw new Error(error.message);
      }

      if (!user) {
        return { success: false, user: null };
      }

      const profile = await this.getUserProfile(user.id);

      return {
        success: true,
        user,
        profile: profile.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get current user',
      };
    }
  }

  // Reset password
  static async resetPassword(email: string) {
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Password reset email sent! Check your inbox.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed',
      };
    }
  }

  // Get user profile
  static async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get profile',
        data: null,
      };
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      };
    }
  }

  // Check if user has specific role
  static async hasRole(userId: string, role: 'student' | 'teacher' | 'admin') {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        return false;
      }

      return data.role === role;
    } catch (error) {
      return false;
    }
  }

  // Check if user is teacher or admin
  static async isTeacherOrAdmin(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        return false;
      }

      return data.role === 'teacher' || data.role === 'admin';
    } catch (error) {
      return false;
    }
  }
}