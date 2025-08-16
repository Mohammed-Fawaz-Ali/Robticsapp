/**
 * Script to create demo users for testing
 * Run this script after setting up your Supabase project
 * 
 * Usage: node scripts/create-demo-users.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const demoUsers = [
  {
    email: 'teacher@eduplatform.com',
    password: 'teacher123',
    full_name: 'Sarah Wilson',
    role: 'teacher'
  },
  {
    email: 'student1@eduplatform.com',
    password: 'student123',
    full_name: 'Alex Johnson',
    role: 'student'
  },
  {
    email: 'student2@eduplatform.com',
    password: 'student123',
    full_name: 'Maria Garcia',
    role: 'student'
  }
];

async function createDemoUsers() {
  console.log('Creating demo users...');

  for (const user of demoUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.full_name
        }
      });

      if (authError) {
        console.error(`Failed to create auth user ${user.email}:`, authError.message);
        continue;
      }

      console.log(`✓ Created auth user: ${user.email}`);

      // Update profile role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: user.role,
          full_name: user.full_name 
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error(`Failed to update profile for ${user.email}:`, profileError.message);
        continue;
      }

      console.log(`✓ Updated profile role for: ${user.email} (${user.role})`);

      // Grant access to first 3 levels for students
      if (user.role === 'student') {
        const { data: levels } = await supabase
          .from('levels')
          .select('id')
          .lte('level_number', 3);

        if (levels) {
          for (const level of levels) {
            await supabase
              .from('level_access')
              .insert({
                user_id: authData.user.id,
                level_id: level.id,
                granted_by: authData.user.id,
                reason: 'demo_setup'
              });
          }
          console.log(`✓ Granted access to first 3 levels for: ${user.email}`);
        }
      }

    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  }

  console.log('\nDemo users created successfully!');
  console.log('\nLogin credentials:');
  console.log('Teacher: teacher@eduplatform.com / teacher123');
  console.log('Student 1: student1@eduplatform.com / student123');
  console.log('Student 2: student2@eduplatform.com / student123');
}

createDemoUsers().catch(console.error);