/**
 * Script to upload demo videos to Supabase Storage
 * This creates placeholder video files for testing
 * 
 * Usage: node scripts/upload-demo-videos.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create a simple HLS manifest for demo purposes
function createDemoHLSManifest(duration = 600) {
  return `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD

#EXTINF:10.0,
https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

#EXT-X-ENDLIST`;
}

async function uploadDemoVideos() {
  console.log('Setting up demo video content...');

  try {
    // Get all lessons that need video content
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        hls_path,
        levels(level_number)
      `)
      .order('id');

    if (error) {
      throw error;
    }

    console.log(`Found ${lessons?.length || 0} lessons to process`);

    for (const lesson of lessons || []) {
      if (lesson.hls_path) {
        try {
          // Create demo HLS manifest
          const manifest = createDemoHLSManifest();
          const manifestBuffer = Buffer.from(manifest, 'utf8');

          // Upload HLS manifest
          const { error: uploadError } = await supabase.storage
            .from('lesson-videos')
            .upload(lesson.hls_path, manifestBuffer, {
              contentType: 'application/x-mpegURL',
              upsert: true
            });

          if (uploadError) {
            console.error(`Failed to upload ${lesson.hls_path}:`, uploadError.message);
            continue;
          }

          console.log(`✓ Uploaded demo content for: ${lesson.title}`);
        } catch (error) {
          console.error(`Error processing lesson ${lesson.id}:`, error);
        }
      }
    }

    console.log('\nDemo video setup complete!');
    console.log('\nNote: The demo videos use a sample MP4 file from Google Cloud Storage.');
    console.log('For production, replace with actual HLS streams or MP4 files.');

  } catch (error) {
    console.error('Error setting up demo videos:', error);
  }
}

uploadDemoVideos().catch(console.error);