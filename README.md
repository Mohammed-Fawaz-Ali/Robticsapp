# Educational Platform - Complete Backend Integration

A comprehensive educational platform with role-based access, course management, progress tracking, and real-time features built with React Native, Expo, and Supabase. This platform provides a complete learning management system with video lessons, progress tracking, submissions, and teacher management tools.

## 🚀 Features

### Authentication & User Management
- **Role-based authentication** (Student, Teacher, Admin)
- **JWT token-based security** with automatic refresh
- **Email/password authentication** with password reset
- **Profile management** with avatar support
- **Session management** with persistent login
- **Automatic profile creation** on user registration

### Course Management
- **Multi-level course structure** with prerequisites
- **Video lessons** with progress tracking
- **HLS video streaming** with signed URLs
- **Interactive content** with notes and resources
- **Access control** for restricted content
- **Real-time progress updates**
- **Level access management** with teacher approval

### Student Features
- **Personal dashboard** with progress overview
- **Video player** with note-taking capabilities
- **Practice video submissions** with teacher feedback
- **Achievement system** with badges and points
- **Real-time notifications**
- **Access request system** for locked levels

### Teacher/Admin Features
- **Student progress monitoring**
- **Submission review system**
- **Course content management**
- **Level access management**
- **Analytics dashboard**
- **Bulk notification system**
- **Video upload and management**

## 🛠 Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with RLS
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **Video Streaming**: HLS with signed URLs
- **Push Notifications**: Integration hooks provided

## 📋 Prerequisites

- Node.js 18+ and npm
- Expo CLI
- Supabase account
- iOS Simulator or Android Emulator (for testing)

## ⚡ Quick Start

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Click "Connect to Supabase" in the top right of this Bolt project
4. The database schema will be automatically applied

### 2. Environment Configuration

1. Copy `.env.example` to `.env`
2. Update with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Demo Data

Run the setup script to create demo users and data:

```bash
node scripts/create-demo-users.js
node scripts/upload-demo-videos.js
```

### 5. Create Teacher Account

1. Sign up normally through the app with email/password
2. Get your user ID from the Supabase dashboard (auth.users table)
3. Run the teacher setup script:

```sql
-- In Supabase SQL Editor, replace USER_ID_HERE with actual ID
UPDATE profiles 
SET role = 'teacher', updated_at = now()
WHERE id = 'USER_ID_HERE';
```

### 4. Start Development Server

```bash
npm run dev
```

## 🧪 Testing Guide

### Authentication Flow Testing
1. **Registration**: Create new account → verify profile created with 'student' role
2. **Login**: Sign in with demo credentials → verify dashboard loads
3. **Password Reset**: Test reset flow with valid email

### Student Flow Testing
1. **Course Access**: Visit `/courses` → see 7 levels with access indicators
2. **Locked Content**: Click locked level → see access request modal
3. **Video Playback**: Click accessible lesson → video loads with signed URL
4. **Progress Tracking**: Watch video → progress updates automatically
5. **Submissions**: Submit practice video → appears in teacher dashboard

### Teacher Flow Testing
1. **Dashboard**: Login as teacher → see student stats and pending submissions
2. **Access Management**: Grant access to student → student sees level unlocked immediately
3. **Submission Review**: Review student submission → student gets real-time feedback
4. **Content Management**: Create/edit levels and lessons

### Real-time Features Testing
1. **Notifications**: Teacher action → student sees notification immediately
2. **Submissions**: Student submits → teacher dashboard updates in real-time
3. **Announcements**: Teacher creates → all users see announcement

### Security Testing
1. **RLS Enforcement**: Unauthenticated requests → return 403
2. **Role Restrictions**: Student tries teacher action → access denied
3. **Video Access**: Request video without access → returns 403

## 🗄 Database Schema

The platform uses a comprehensive PostgreSQL schema with the following main tables:

### Core Tables
- **profiles** - Extended user profiles with roles
- **levels** - Course levels with access control
- **lessons** - Individual lessons with content
- **level_access** - Access control for restricted levels
- **level_access_requests** - Student access requests
- **student_progress** - Detailed progress tracking

### Feature Tables
- **submissions** - Student video submissions
- **announcements** - System announcements
- **notifications** - Real-time notification system
- **badges** & **user_badges** - Achievement system
- **playback_events** - Video analytics and tracking

### Security Features
- **Row Level Security (RLS)** enabled on all tables
- **Role-based access policies** for data protection
- **Automatic user profile creation** on registration
- **Secure API endpoints** with authentication
- **Signed URLs** for secure video access

## 🎥 Video System

### Video Storage
- **Private Storage**: All videos stored in private Supabase Storage buckets
- **Signed URLs**: Temporary access URLs with 1-hour expiry
- **Access Control**: Video access based on level permissions
- **HLS Support**: HTTP Live Streaming for optimal playback

### Video Upload Flow
1. **Teacher Upload**: Get signed upload URL → upload video → update lesson
2. **Student Submission**: Upload practice video → create submission record
3. **Access Control**: All uploads validated by user role and permissions

## 🔐 Authentication Flow

### Registration
```typescript
const result = await AuthService.register(email, password, fullName);
if (result.success) {
  // User registered successfully
  // Profile automatically created with 'student' role
}
```

### Login
```typescript
const result = await AuthService.login(email, password);
if (result.success) {
  // User logged in successfully
  // Profile data available in result.profile
}
```

### Role Checking
```typescript
const isTeacher = await AuthService.hasRole(userId, 'teacher');
const profile = await AuthService.getUserProfile(userId);
const isTeacher = profile.data?.role === 'teacher';
```

## 🔗 API Integration

### Edge Functions
All secure operations use Supabase Edge Functions:

```typescript
// Get video playback URL
const result = await EdgeFunctionAPI.getPlaybackUrl(lessonId);

// Grant level access (teacher only)
const result = await EdgeFunctionAPI.grantAccess(userId, levelId);

// Submit practice video
const result = await EdgeFunctionAPI.submitPractice(lessonId, storagePath);

// Review submission (teacher only)
const result = await EdgeFunctionAPI.reviewSubmission(submissionId, status, feedback);
```

### Real-time Subscriptions
```typescript
// Subscribe to announcements
const announcements = useRealtimeAnnouncements();

// Subscribe to submissions
const submissions = useRealtimeSubmissions();

// Subscribe to notifications
const notifications = useRealtimeNotifications();
```

## 📚 API Services

### CoursesService
- `getLevelsWithAccess(userId)` - Get levels with access status
- `getLevelDetails(levelId, userId)` - Get level with lessons and progress
- `updateProgress(userId, lessonId, progress)` - Track learning progress
- `getPlaybackUrl(lessonId)` - Get signed video URL
- `submitPractice(lessonId, file, title, description)` - Submit practice video

### LevelsService
- `getLevelsWithAccess(userId)` - Get levels with access information
- `requestAccess(levelId, message)` - Request access to locked level
- `grantAccess(userId, levelId, expiresAt, reason)` - Grant access (teacher only)
- `getAccessRequests()` - Get pending access requests (teacher only)
- `reviewAccessRequest(requestId, status, reviewerId)` - Approve/reject requests
### SubmissionsService
- `getUserSubmissions(userId)` - Get user's submissions
- `getAllSubmissions(status)` - Get all submissions (teacher only)
- `reviewSubmission(submissionId, status, feedback)` - Review submissions (teacher only)
- `getSubmissionDetails(submissionId)` - Get detailed submission info

### NotificationsService
- `getUserNotifications(userId)` - Get user notifications
- `markAsRead(notificationId, userId)` - Mark notification as read
- `createNotification(notificationData)` - Create new notification
- `subscribeToNotifications(userId, callback)` - Real-time subscription

### AnnouncementsService
- `getAnnouncements(userId)` - Get announcements for user
- `createAnnouncement(announcementData)` - Create new announcement (teacher/admin)
- `updateAnnouncement(announcementId, updates)` - Update announcement

## 🔧 Edge Functions

### get-signed-playback-url
Generates secure video playback URLs with access control:

```bash
curl -X POST 'your-supabase-url/functions/v1/get-signed-playback-url' \
  -H 'Authorization: Bearer your-access-token' \
  -H 'Content-Type: application/json' \
  -d '{"lesson_id": "lesson-uuid"}'
```

### grant-access
Grants level access to students (teacher only):

```bash
curl -X POST 'your-supabase-url/functions/v1/grant-access' \
  -H 'Authorization: Bearer your-access-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "student-uuid",
    "level_id": "level-uuid",
    "expires_at": "2024-12-31T23:59:59Z"
  }'
```

### submit-practice
Handles practice video submissions:

```bash
curl -X POST 'your-supabase-url/functions/v1/submit-practice' \
  -H 'Authorization: Bearer your-access-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "lesson_id": "lesson-uuid",
    "storage_path": "user-id/video.mp4",
    "title": "My Practice Video"
  }'
```

### review-submission
Reviews student submissions (teacher only):

```bash
curl -X POST 'your-supabase-url/functions/v1/review-submission' \
  -H 'Authorization: Bearer your-access-token' \
  -H 'Content-Type: application/json' \
  -d '{
    "submission_id": "submission-uuid",
    "status": "approved",
    "teacher_feedback": "Great work!"
  }'
```

## 🎯 Usage Examples

### Tracking Lesson Progress
```typescript
import { LessonsService } from '@/services/lessons';

// Update lesson progress
await LessonsService.updateProgress(userId, lessonId, {
  completed: true,
  completion_percentage: 100,
  notes: 'Great lesson on advanced concepts!'
});
```

### Requesting Level Access
```typescript
import { LevelsService } from '@/services/levels';

// Student requests access to a level
const result = await LevelsService.requestAccess(levelId, 'I need access for my project');

// Teacher grants access
const result = await LevelsService.grantAccess(studentId, levelId);
```

### Video Playback
```typescript
import { EdgeFunctionAPI } from '@/lib/api';

// Get secure video URL
const result = await EdgeFunctionAPI.getPlaybackUrl(lessonId);
if (result.success) {
  // Use result.data.url for video playback
}
```

### Submitting Practice Videos
```typescript
import { LessonsService } from '@/services/lessons';

// Submit practice video
const result = await LessonsService.submitPractice(
  lessonId,
  videoFile,
  'My Practice Submission',
  'This is my attempt at the lesson exercise'
);
```

### Teacher Submission Review
```typescript
import { EdgeFunctionAPI } from '@/lib/api';

// Review student submission
const result = await EdgeFunctionAPI.reviewSubmission(
  submissionId,
  'approved',
  'Excellent work! Well done on demonstrating the concepts.'
);
```

### Creating Announcements
```typescript
import { EdgeFunctionAPI } from '@/lib/api';

// Create announcement for all users
const result = await EdgeFunctionAPI.createAnnouncement(
  'New Content Available',
  'Level 4 has been updated with new lessons',
  'Check out the latest content in Level 4...',
  'all',
  false
});
```

### Real-time Notifications
```typescript
import { useRealtimeNotifications } from '@/hooks/useRealtime';

const notifications = useRealtimeNotifications();

// Notifications automatically update in real-time
// Use with NotificationsService to mark as read
```

## 📱 Demo Accounts

Use these accounts for testing:

**Teacher Account:**
- Email: `teacher@eduplatform.com`
- Password: `teacher123`
- Features: Full access to all teacher tools

**Student Accounts:**
- Email: `student1@eduplatform.com` / Password: `student123`
- Email: `student2@eduplatform.com` / Password: `student123`
- Features: Access to first 3 levels, can request access to higher levels

## 🔒 Security Implementation

### Row Level Security Policies

**Profiles Table:**
- Users can view/update their own profile
- Teachers can view all profiles
- Only service role can update user roles

**Levels Table:**
- All authenticated users can view levels
- Only teachers can create/modify levels

**Lessons Table:**
- Users can view lessons if:
  - Level is public, OR
  - User has level access, OR
  - User is a teacher
- Only teachers can manage lessons

**Submissions Table:**
- Students can create and view their own submissions
- Teachers can view and review all submissions

**Level Access Table:**
- Teachers can grant/revoke access
- Users can view their own access records

### Video Security
- All videos stored in private buckets
- Signed URLs with 1-hour expiry
- Access validated before URL generation
- Playback events logged for analytics

## 🚀 Deployment

### Supabase Deployment
1. Database migrations are automatically applied
2. Edge functions are automatically deployed
3. RLS policies are automatically configured
4. Storage buckets are created with proper policies

### Mobile App Deployment
1. **Development Build**:
   ```bash
   expo install --fix
   npx expo run:ios
   npx expo run:android
   ```

2. **Production Build**:
   ```bash
   expo build:ios
   expo build:android
   ```

## 🧪 Manual Testing Checklist

### ✅ Authentication
- [ ] User registration creates profile with 'student' role
- [ ] Login redirects to appropriate dashboard
- [ ] Password reset sends email and works
- [ ] Session persists across app restarts

### ✅ Student Features
- [ ] Dashboard shows progress and announcements
- [ ] Course list shows 7 levels with access status
- [ ] Locked levels show request access modal
- [ ] Video playback works with signed URLs
- [ ] Progress tracking updates automatically
- [ ] Practice submission uploads and creates record
- [ ] Real-time notifications appear immediately

### ✅ Teacher Features
- [ ] Teacher dashboard shows student stats
- [ ] Access management shows pending requests
- [ ] Grant access unlocks level for student immediately
- [ ] Submission review updates student record in real-time
- [ ] Announcement creation notifies target users
- [ ] Video upload generates signed URLs

### ✅ Security
- [ ] Unauthenticated users cannot access protected content
- [ ] Students cannot access teacher-only functions
- [ ] Video URLs require proper authentication
- [ ] RLS policies prevent unauthorized data access

### ✅ Real-time Features
- [ ] Announcements appear immediately for all users
- [ ] Submission status updates show in real-time
- [ ] Notifications update without page refresh
- [ ] Access grants unlock content immediately

## 📊 Analytics & Monitoring

### Platform Analytics
- User registration and activity metrics
- Course completion rates
- Popular content identification
- Video engagement patterns

### Student Analytics
- Individual progress tracking
- Learning time analysis
- Achievement history
- Submission performance

### Teacher Dashboard
- Class overview and progress
- Pending submissions
- Student performance metrics
- Engagement insights

## 🔧 Development Tools

### Database Management
```bash
# Apply migrations
supabase db reset

# Generate types
supabase gen types typescript --local > types/database.ts

# View logs
supabase functions logs
```

### Testing Edge Functions
```bash
# Test locally
supabase functions serve

# Deploy functions
supabase functions deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📞 Support

For technical support or questions:
- Email: support@eduplatform.com
- Documentation: [Link to full docs]
- Community: [Link to community forum]

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

### send-notification
Handles bulk notification sending to multiple users:

```bash
curl -X POST 'your-supabase-url/functions/v1/send-notification' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "userIds": ["user-1", "user-2"],
    "title": "New Lesson Available",
    "message": "Check out the latest lesson in Level 3!",
    "type": "lesson"
  }'
```

### process-video-upload
Handles video upload processing and notifications:

```bash
curl -X POST 'your-supabase-url/functions/v1/process-video-upload' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "submissionId": "submission-id",
    "videoUrl": "https://storage.url/video.mp4",
    "userId": "user-id"
  }'
```

### analytics-report
Generates comprehensive analytics reports:

```bash
curl 'your-supabase-url/functions/v1/analytics-report?type=overview&days=30' \
  -H 'Authorization: Bearer your-anon-key'
```

## 🎨 Frontend Integration

### Auth Provider Setup
Wrap your app with the AuthProvider:

```typescript
import { AuthProvider } from '@/hooks/useAuth';

export default function App() {
  return (
    <AuthProvider>
      <YourAppContent />
    </AuthProvider>
  );
}
```

### Protected Routes
Use AuthGuard components for role-based access:

```typescript
import { TeacherGuard, AdminGuard } from '@/components/AuthGuard';

// Teacher-only content
<TeacherGuard>
  <TeacherDashboard />
</TeacherGuard>

// Admin-only content
<AdminGuard>
  <AdminPanel />
</AdminGuard>
```

## 📊 Analytics & Monitoring

### Platform Analytics
- User registration and activity metrics
- Course completion rates
- Popular content identification
- Engagement patterns

### Student Analytics
- Individual progress tracking
- Learning time analysis
- Achievement history
- Submission performance

### Teacher Dashboard
- Class overview and progress
- Pending submissions
- Student performance metrics
- Engagement insights

## 🔒 Security Features

### Row Level Security (RLS)
- All tables protected with RLS policies
- Role-based data access control
- Automatic user isolation

### Input Validation
- Comprehensive validation utilities
- SQL injection prevention
- XSS protection
- Rate limiting on auth endpoints

### Data Privacy
- GDPR-compliant data handling
- Secure file upload and storage
- Encrypted sensitive data
- Audit logging for admin actions

## 🚀 Deployment

### Supabase Deployment
1. Database migrations are automatically applied
2. Edge functions are automatically deployed
3. RLS policies are automatically configured

### Mobile App Deployment
1. **Development Build**:
   ```bash
   expo install --fix
   npx expo run:ios
   npx expo run:android
   ```

2. **Production Build**:
   ```bash
   expo build:ios
   expo build:android
   ```

## 🧪 Testing

### API Testing
Use the provided Postman collection or test with curl:

```bash
# Test authentication
curl -X POST 'your-supabase-url/auth/v1/signup' \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com", "password": "password123"}'

# Test protected endpoint
curl 'your-supabase-url/rest/v1/levels' \
  -H 'Authorization: Bearer your-jwt-token'
```

### Database Testing
```sql
-- Test RLS policies
SELECT * FROM levels; -- Should only return accessible levels
SELECT * FROM submissions WHERE user_id = 'test-user-id';
```

## 📱 Mobile App Features

### Real-time Updates
- Live progress synchronization
- Instant notifications
- Real-time submission status updates

### Offline Support
- Cached course content
- Offline progress tracking
- Sync when connection restored

### Performance Optimization
- Lazy loading of course content
- Image optimization and caching
- Efficient data pagination

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📞 Support

For technical support or questions:
- Email: support@eduplatform.com
- Documentation: [Link to full docs]
- Community: [Link to community forum]

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.