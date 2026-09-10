// Advanced Background & Screen-Off Playback Engine for Zivo
// Enables continuous audio playback on mobile browsers (iOS Safari, Android Chrome)
// when the screen is turned off, phone is locked, or user switches tabs.

// 1-second silent stereo WAV base64 data URI (valid audio track that keeps audio pipeline active)
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

class BackgroundPlaybackEngine {
  constructor() {
    this.keepAliveAudio = null;
    this.wakeLock = null;
    this.isPlaying = false;
    this.currentMetadata = null;
    this.playerCallbacks = null;
    this.keepScreenAwake = false;
    this.screenOffPlayback = true;

    this.initAudioKeepAlive();
    this.setupVisibilityListener();
  }

  // Initializes lightweight silent audio element
  initAudioKeepAlive() {
    if (typeof window === 'undefined') return;
    try {
      this.keepAliveAudio = new Audio(SILENT_AUDIO_URI);
      this.keepAliveAudio.loop = true;
      this.keepAliveAudio.volume = 0.01; // tiny volume so mobile OS does not pause audio session
      this.keepAliveAudio.setAttribute('playsinline', 'true');
      this.keepAliveAudio.setAttribute('webkit-playsinline', 'true');
    } catch (e) {
      console.warn('Silent audio keep-alive init failed:', e);
    }
  }

  // Attach player instance and control callbacks
  registerPlayer(callbacks) {
    this.playerCallbacks = callbacks;
  }

  unregisterPlayer() {
    this.playerCallbacks = null;
    this.stopKeepAlive();
    this.releaseWakeLock();
  }

  // Update MediaSession lock-screen widget
  updateMediaSession(metadata) {
    if (!('mediaSession' in navigator)) return;
    this.currentMetadata = metadata;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: metadata.title || 'Zivo Ad-Free Player',
        artist: metadata.channelTitle || metadata.artist || 'Zivo Music & Video',
        album: 'Zivo Ad-Free (Background Play)',
        artwork: [
          { src: metadata.thumbnail || 'icons/pwa-192x192.png', sizes: '96x96', type: 'image/jpeg' },
          { src: metadata.thumbnail || 'icons/pwa-192x192.png', sizes: '128x128', type: 'image/jpeg' },
          { src: metadata.thumbnail || 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/jpeg' },
          { src: metadata.thumbnailMax || metadata.thumbnail || 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/jpeg' }
        ]
      });

      // Register Lock Screen & Notification Action Handlers
      navigator.mediaSession.setActionHandler('play', () => {
        this.startKeepAlive();
        if (this.playerCallbacks?.onPlay) {
          this.playerCallbacks.onPlay();
        }
        navigator.mediaSession.playbackState = 'playing';
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.stopKeepAlive();
        if (this.playerCallbacks?.onPause) {
          this.playerCallbacks.onPause();
        }
        navigator.mediaSession.playbackState = 'paused';
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (this.playerCallbacks?.onSeek && details.seekTime !== undefined) {
          this.playerCallbacks.onSeek(details.seekTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || 10;
        if (this.playerCallbacks?.onSkip) {
          this.playerCallbacks.onSkip(-skipTime);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || 10;
        if (this.playerCallbacks?.onSkip) {
          this.playerCallbacks.onSkip(skipTime);
        }
      });

      navigator.mediaSession.setActionHandler('stop', () => {
        this.stopKeepAlive();
        if (this.playerCallbacks?.onStop) {
          this.playerCallbacks.onStop();
        }
      });

      if (this.playerCallbacks?.onPrevious) {
        navigator.mediaSession.setActionHandler('previoustrack', () => this.playerCallbacks.onPrevious());
      }
      if (this.playerCallbacks?.onNext) {
        navigator.mediaSession.setActionHandler('nexttrack', () => this.playerCallbacks.onNext());
      }
    } catch (e) {
      console.warn('Error updating MediaSession metadata:', e);
    }
  }

  // Update lock-screen scrubber position
  updatePositionState(duration, currentTime, playbackRate = 1) {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    if (isNaN(duration) || isNaN(currentTime) || duration <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(0, duration),
        playbackRate: Math.max(0.5, Math.min(2, playbackRate)),
        position: Math.max(0, Math.min(currentTime, duration))
      });
    } catch (e) {}
  }

  // Called when video starts playing
  onPlayStateChanged(isPlaying) {
    this.isPlaying = isPlaying;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }

    if (isPlaying) {
      this.startKeepAlive();
      if (this.keepScreenAwake) {
        this.requestWakeLock();
      }
    } else {
      this.stopKeepAlive();
    }
  }

  // Keep mobile OS audio pipeline alive in background
  startKeepAlive() {
    if (!this.screenOffPlayback) return;
    try {
      if (this.keepAliveAudio) {
        this.keepAliveAudio.play().catch(() => {
          // Retry on user interaction if autoplay restricted
        });
      }
    } catch (e) {}
  }

  stopKeepAlive() {
    try {
      if (this.keepAliveAudio && !this.keepAliveAudio.paused) {
        this.keepAliveAudio.pause();
      }
    } catch (e) {}
  }

  // Wake Lock API to keep screen turned on if user enables it
  async requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      if (!this.wakeLock) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        this.wakeLock.addEventListener('release', () => {
          this.wakeLock = null;
        });
      }
    } catch (e) {
      this.wakeLock = null;
    }
  }

  async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch (e) {}
      this.wakeLock = null;
    }
  }

  setPreferences(prefs) {
    this.screenOffPlayback = prefs.screenOffPlayback !== false;
    this.keepScreenAwake = !!prefs.keepScreenAwake;

    if (this.keepScreenAwake && this.isPlaying) {
      this.requestWakeLock();
    } else if (!this.keepScreenAwake) {
      this.releaseWakeLock();
    }
  }

  // Setup tab switch & screen off visibility listener
  setupVisibilityListener() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Device locked or tab switched: ensure background audio keep-alive is active
        if (this.isPlaying && this.screenOffPlayback) {
          this.startKeepAlive();
          // Notify player to avoid throttling / maintain background stream
          if (this.playerCallbacks?.onBackgroundStateChange) {
            this.playerCallbacks.onBackgroundStateChange(true);
          }
        }
      } else if (document.visibilityState === 'visible') {
        // Tab brought back to foreground
        if (this.keepScreenAwake && this.isPlaying) {
          this.requestWakeLock();
        }
        if (this.playerCallbacks?.onBackgroundStateChange) {
          this.playerCallbacks.onBackgroundStateChange(false);
        }
      }
    });
  }
}

export const backgroundEngine = new BackgroundPlaybackEngine();
