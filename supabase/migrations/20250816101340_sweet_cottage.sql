/*
  # Complete Educational Platform Database Schema

  1. New Tables
    - Enhanced existing schema with missing fields
    - Added level_access_requests for access management
    - Added playback_events for video analytics
    - Updated profiles with push_token support

  2. Security
    - Enable RLS on all tables
    - Role-based access policies for students, teachers, and admins
    - Secure video access controls

  3. Features
    - Complete user management with roles
    - Course and lesson management with access control
    - Progress tracking and analytics
    - Video submission and review system
    - Real-time notifications
    - Achievement/badge system
*/

-- Update profiles table to include push_token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'push_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN push_token text;
  END IF;
END $$;

-- Create level_access_requests table for access management
CREATE TABLE IF NOT EXISTS level_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  level_id uuid REFERENCES levels(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  UNIQUE(user_id, level_id)
);

-- Create playback_events table for video analytics
CREATE TABLE IF NOT EXISTS playback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view_start', 'view_end', 'pause', 'resume', 'seek')),
  timestamp_seconds integer,
  user_agent text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Update lessons table to include HLS path and published status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'hls_path'
  ) THEN
    ALTER TABLE lessons ADD COLUMN hls_path text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'published'
  ) THEN
    ALTER TABLE lessons ADD COLUMN published boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE lessons ADD COLUMN order_index integer DEFAULT 0;
  END IF;
END $$;

-- Update levels table to include level_number and access_policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'levels' AND column_name = 'level_number'
  ) THEN
    ALTER TABLE levels ADD COLUMN level_number integer;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'levels' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE levels ADD COLUMN created_by uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Update submissions table to include storage_path and duration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'storage_path'
  ) THEN
    ALTER TABLE submissions ADD COLUMN storage_path text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'duration_seconds'
  ) THEN
    ALTER TABLE submissions ADD COLUMN duration_seconds integer;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'submissions' AND column_name = 'teacher_feedback'
  ) THEN
    ALTER TABLE submissions ADD COLUMN teacher_feedback text;
  END IF;
END $$;

-- Update announcements table structure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'body'
  ) THEN
    ALTER TABLE announcements ADD COLUMN body text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'target'
  ) THEN
    ALTER TABLE announcements ADD COLUMN target text DEFAULT 'all';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'pinned'
  ) THEN
    ALTER TABLE announcements ADD COLUMN pinned boolean DEFAULT false;
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE playback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Teachers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Teachers can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for levels
DROP POLICY IF EXISTS "Anyone can view levels" ON levels;
DROP POLICY IF EXISTS "Teachers can manage levels" ON levels;

CREATE POLICY "Anyone can view levels"
  ON levels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can manage levels"
  ON levels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- RLS Policies for lessons
DROP POLICY IF EXISTS "Users can view accessible lessons" ON lessons;
DROP POLICY IF EXISTS "Teachers can manage lessons" ON lessons;

CREATE POLICY "Users can view accessible lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (
    published = true AND (
      EXISTS (
        SELECT 1 FROM levels
        WHERE id = lessons.level_id AND access_policy = 'public'
      ) OR
      EXISTS (
        SELECT 1 FROM level_access
        WHERE user_id = auth.uid() AND level_id = lessons.level_id
      ) OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'teacher'
      )
    )
  );

CREATE POLICY "Teachers can manage lessons"
  ON lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- RLS Policies for level_access
DROP POLICY IF EXISTS "Teachers can manage access" ON level_access;
DROP POLICY IF EXISTS "Users can view own access" ON level_access;

CREATE POLICY "Teachers can manage access"
  ON level_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Users can view own access"
  ON level_access FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for level_access_requests
CREATE POLICY "Users can create own requests"
  ON level_access_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own requests"
  ON level_access_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can view and manage all requests"
  ON level_access_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- RLS Policies for submissions
DROP POLICY IF EXISTS "Users can create own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can view and manage all submissions" ON submissions;

CREATE POLICY "Users can create own submissions"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own submissions"
  ON submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Teachers can view and manage all submissions"
  ON submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- RLS Policies for announcements
DROP POLICY IF EXISTS "Anyone can view announcements" ON announcements;
DROP POLICY IF EXISTS "Teachers can create announcements" ON announcements;

CREATE POLICY "Anyone can view announcements"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can create announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- RLS Policies for playback_events
CREATE POLICY "Users can create own playback events"
  ON playback_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers can view all playback events"
  ON playback_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- Update level numbers for existing levels
UPDATE levels SET level_number = position WHERE level_number IS NULL;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();