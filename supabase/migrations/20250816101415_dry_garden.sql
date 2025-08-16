/*
  # Seed Initial Data for Educational Platform

  Sample Data:
  - 7 course levels with proper numbering
  - 2 sample lessons per level (14 total lessons)
  - Default badges for achievement system
  - Sample announcements
  - Demo video paths for testing

  Note: Auth users must be created separately via Supabase Auth
*/

-- Insert 7 course levels
INSERT INTO levels (title, description, level_number, access_policy, position) VALUES
  ('Introduction to Basics', 'Start your learning journey with fundamental concepts and core principles', 1, 'public', 1),
  ('Building Foundations', 'Develop essential skills and deepen your understanding of key topics', 2, 'invite', 2),
  ('Intermediate Concepts', 'Explore more complex topics and their practical applications', 3, 'invite', 3),
  ('Advanced Applications', 'Apply your knowledge to real-world scenarios and complex problems', 4, 'invite', 4),
  ('Expert Techniques', 'Master advanced methodologies and specialized approaches', 5, 'invite', 5),
  ('Professional Mastery', 'Achieve professional-level expertise and leadership skills', 6, 'invite', 6),
  ('Innovation & Leadership', 'Lead innovation projects and mentor others in the field', 7, 'invite', 7)
ON CONFLICT (level_number) DO NOTHING;

-- Insert sample lessons (2 per level)
INSERT INTO lessons (level_id, title, description, duration, position, published, hls_path, order_index) VALUES
  -- Level 1 lessons
  ((SELECT id FROM levels WHERE level_number = 1), 'Welcome & Getting Started', 'Introduction to the platform and basic concepts', 600, 1, true, 'lessons/level1/lesson1.m3u8', 1),
  ((SELECT id FROM levels WHERE level_number = 1), 'Fundamental Principles', 'Core principles that form the foundation of learning', 720, 2, true, 'lessons/level1/lesson2.m3u8', 2),
  
  -- Level 2 lessons
  ((SELECT id FROM levels WHERE level_number = 2), 'Building Your Skills', 'Developing essential skills for progression', 900, 1, true, 'lessons/level2/lesson1.m3u8', 1),
  ((SELECT id FROM levels WHERE level_number = 2), 'Practical Applications', 'Applying what you have learned in real scenarios', 840, 2, true, 'lessons/level2/lesson2.m3u8', 2),
  
  -- Level 3 lessons
  ((SELECT id FROM levels WHERE level_number = 3), 'Advanced Problem Solving', 'Systematic approaches to complex problems', 1080, 1, true, 'lessons/level3/lesson1.m3u8', 1),
  ((SELECT id FROM levels WHERE level_number = 3), 'Critical Thinking Methods', 'Developing analytical and critical thinking skills', 960, 2, true, 'lessons/level3/lesson2.m3u8', 2),
  
  -- Level 4 lessons
  ((SELECT id FROM levels WHERE level_number = 4), 'Real-World Projects', 'Working on actual industry projects and case studies', 1200, 1, true, 'lessons/level4/lesson1.m3u8', 1),
  ((SELECT id FROM levels WHERE level_number = 4), 'Advanced Methodologies', 'Sophisticated approaches to complex challenges', 1140, 2, true, 'lessons/level4/lesson2.m3u8', 2),
  
  -- Level 5 lessons
  ((SELECT id FROM levels WHERE level_number = 5), 'Expert Strategies', 'Advanced strategies used by industry experts', 1320, 1, true, 'lessons/level5/lesson1.m3u8', 1),
  ((SELECT id FROM levels WHERE level_number = 5), 'Specialized Techniques', 'Specialized approaches for specific domains', 1260, 2, true, 'lessons/level5/lesson2.m3u8', 2),
  
  -- Level 6 lessons
  ((SELECT id FROM levels WHERE level_number = 6), 'Professional Excellence', 'Achieving professional-level mastery', 1440, 1, true, 'lessons/level6/lesson1.m3u8', 1),
  ((SELECT id FROM levels WHERE level_number = 6), 'Leadership Fundamentals', 'Basic leadership principles and practices', 1380, 2, true, 'lessons/level6/lesson2.m3u8', 2),
  
  -- Level 7 lessons
  ((SELECT id FROM levels WHERE level_number = 7), 'Innovation Strategies', 'Leading innovation and driving change', 1560, 1, true, 'lessons/level7/lesson1.m3u8', 1),
  ((SELECT id FROM levels WHERE level_number = 7), 'Mentoring & Teaching', 'Sharing knowledge and mentoring others', 1500, 2, true, 'lessons/level7/lesson2.m3u8', 2)
ON CONFLICT DO NOTHING;

-- Insert default badges
INSERT INTO badges (name, description, icon, points, type, criteria) VALUES
  ('First Steps', 'Complete your first lesson', '🌟', 10, 'completion', '{"lessons_completed": 1}'),
  ('Dedicated Learner', 'Complete 10 lessons', '📚', 50, 'completion', '{"lessons_completed": 10}'),
  ('Level 1 Graduate', 'Complete all lessons in Level 1', '🎓', 100, 'completion', '{"levels_completed": 1}'),
  ('Level 2 Graduate', 'Complete all lessons in Level 2', '🏆', 200, 'completion', '{"levels_completed": 2}'),
  ('Level 3 Graduate', 'Complete all lessons in Level 3', '👑', 300, 'completion', '{"levels_completed": 3}'),
  ('Week Streak', 'Study for 7 consecutive days', '🔥', 75, 'streak', '{"consecutive_days": 7}'),
  ('Month Champion', 'Study for 30 consecutive days', '💪', 250, 'streak', '{"consecutive_days": 30}'),
  ('Video Master', 'Watch 20 video lessons', '🎬', 150, 'achievement', '{"videos_watched": 20}'),
  ('Quick Learner', 'Complete a lesson in under 10 minutes', '⚡', 25, 'achievement', '{"quick_completion": true}'),
  ('Persistent', 'Complete a difficult lesson after multiple attempts', '🎯', 40, 'achievement', '{"persistence": true}')
ON CONFLICT (name) DO NOTHING;

-- Insert sample announcements
INSERT INTO announcements (title, content, body, target, created_by, pinned) VALUES
  ('Welcome to the Platform!', 'Welcome to our educational platform. Start your learning journey today!', 'We are excited to have you join our learning community. Explore the courses, track your progress, and achieve your learning goals.', 'all', NULL, true),
  ('New Level 4 Content Available', 'Advanced content has been added to Level 4', 'We have added new lessons and materials to Level 4. Check out the latest content to continue your learning journey.', 'level:4', NULL, false),
  ('Weekly Study Tips', 'Tips for effective learning and time management', 'Here are some proven strategies to maximize your learning: 1) Set specific goals, 2) Take regular breaks, 3) Practice active recall, 4) Join study groups.', 'all', NULL, false)
ON CONFLICT DO NOTHING;

-- Create storage bucket for videos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-videos',
  'lesson-videos',
  false,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/quicktime', 'application/x-mpegURL']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for submissions (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  false,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for lesson videos
CREATE POLICY "Teachers can upload lesson videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'lesson-videos' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Authenticated users can view lesson videos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'lesson-videos');

-- Storage policies for submissions
CREATE POLICY "Students can upload submissions"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own submissions"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Teachers can view all submissions"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'submissions' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );