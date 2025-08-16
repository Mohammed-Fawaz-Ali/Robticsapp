import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize } from 'lucide-react-native';
import { LessonsService } from '@/services/lessons';

interface VideoPlayerProps {
  lessonId: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function VideoPlayer({ lessonId, onProgress, onComplete }: VideoPlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadVideoUrl();
  }, [lessonId]);

  const loadVideoUrl = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await LessonsService.getPlaybackUrl(lessonId);
      
      if (result.success && result.data.url) {
        setVideoUrl(result.data.url);
      } else {
        setError(result.error || 'Failed to load video');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (webViewRef.current) {
      const script = isPlaying 
        ? 'if(window.player) window.player.pause();'
        : 'if(window.player) window.player.play();';
      
      webViewRef.current.postMessage(script);
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (seconds: number) => {
    if (webViewRef.current) {
      const script = `
        if(window.player) {
          const currentTime = window.player.currentTime || 0;
          window.player.currentTime = Math.max(0, currentTime + ${seconds});
        }
      `;
      webViewRef.current.postMessage(script);
    }
  };

  // HTML content for video player
  const getVideoPlayerHTML = (url: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #000;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <video 
        id="video-player"
        controls
        preload="metadata"
        crossorigin="anonymous"
      >
        <source src="${url}" type="application/x-mpegURL">
        <source src="${url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      
      <script>
        const video = document.getElementById('video-player');
        window.player = video;
        
        video.addEventListener('loadedmetadata', () => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'loaded',
            duration: video.duration
          }));
        });
        
        video.addEventListener('timeupdate', () => {
          const progress = (video.currentTime / video.duration) * 100;
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'progress',
            currentTime: video.currentTime,
            duration: video.duration,
            progress: progress
          }));
        });
        
        video.addEventListener('ended', () => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'ended'
          }));
        });
        
        video.addEventListener('play', () => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'play'
          }));
        });
        
        video.addEventListener('pause', () => {
          window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'pause'
          }));
        });
        
        // Handle messages from React Native
        window.addEventListener('message', (event) => {
          try {
            eval(event.data);
          } catch (e) {
            console.error('Error executing script:', e);
          }
        });
      </script>
    </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      switch (message.type) {
        case 'progress':
          onProgress?.(message.progress);
          break;
        case 'ended':
          onComplete?.();
          setIsPlaying(false);
          break;
        case 'play':
          setIsPlaying(true);
          break;
        case 'pause':
          setIsPlaying(false);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVideoUrl}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!videoUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No video available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: getVideoPlayerHTML(videoUrl) }}
        style={styles.webView}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onMessage={handleWebViewMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
      />
      
      {/* Custom Controls Overlay */}
      <View style={styles.controlsOverlay}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => handleSeek(-10)}
        >
          <SkipBack size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.playButton}
          onPress={handlePlayPause}
        >
          {isPlaying ? (
            <Pause size={32} color="#FFFFFF" />
          ) : (
            <Play size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => handleSeek(10)}
        >
          <SkipForward size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});