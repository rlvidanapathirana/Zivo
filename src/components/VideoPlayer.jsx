import { useState, useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { getSponsorSegments } from '../services/sponsorBlockService';
import { recordShieldEvent } from '../services/braveShieldService';
import { getVideoStreams } from '../services/invidiousService';
import { backgroundEngine } from '../services/backgroundPlaybackService';
import { useBraveShield } from '../context/BraveShieldContext';
import { usePlayer } from '../context/PlayerContext';
import { Zap, ShieldCheck, Headphones, Moon, Radio, Volume2, Maximize2 } from 'lucide-react';

export default function VideoPlayer({ videoId, title, channelTitle, thumbnail, onMinimize }) {
  const { prefs, trackEvent, openModal } = useBraveShield();
  const { isPlaying, setIsPlaying, audioOnlyMode, setAudioOnlyMode } = usePlayer();
  const [sponsorSegments, setSponsorSegments] = useState([]);
  const [sponsorToast, setSponsorToast] = useState(null);
  const [adBlockedToast, setAdBlockedToast] = useState(false);
  const [directStream, setDirectStream] = useState(null);

  const containerRef = useRef(null);
  const plyrInstanceRef = useRef(null);
  const directAudioRef = useRef(null);
  const lastSkippedUUID = useRef(null);

  // Fetch Direct Streams (Direct Audio / Video) for 100% Ad-Free & Screen-Off Playback
  useEffect(() => {
    let isMounted = true;
    getVideoStreams(videoId).then(streams => {
      if (isMounted && streams) {
        setDirectStream(streams);
      }
    });
    return () => { isMounted = false; };
  }, [videoId]);

  // Background MediaSession & Lock Screen Playback Engine Setup
  useEffect(() => {
    backgroundEngine.updateMediaSession({
      title: title || 'Zivo Audio Stream',
      channelTitle: channelTitle || 'Zivo Creator',
      thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailMax: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      videoId
    });

    backgroundEngine.registerPlayer({
      onPlay: () => {
        if (directAudioRef.current && audioOnlyMode) {
          directAudioRef.current.play().catch(() => {});
        } else {
          plyrInstanceRef.current?.play();
        }
        setIsPlaying(true);
      },
      onPause: () => {
        if (directAudioRef.current) {
          directAudioRef.current.pause();
        }
        plyrInstanceRef.current?.pause();
        setIsPlaying(false);
      },
      onSeek: (time) => {
        if (directAudioRef.current && audioOnlyMode) {
          directAudioRef.current.currentTime = time;
        }
        if (plyrInstanceRef.current) {
          plyrInstanceRef.current.currentTime = time;
        }
      },
      onSkip: (delta) => {
        if (plyrInstanceRef.current) {
          plyrInstanceRef.current.currentTime = Math.max(0, plyrInstanceRef.current.currentTime + delta);
        }
        if (directAudioRef.current) {
          directAudioRef.current.currentTime = Math.max(0, directAudioRef.current.currentTime + delta);
        }
      },
      onStop: () => {
        directAudioRef.current?.pause();
        plyrInstanceRef.current?.pause();
        setIsPlaying(false);
      },
      onBackgroundStateChange: (isBackground) => {
        // When tab is hidden / device locked, keep playing audio seamlessly
        if (isBackground && isPlaying) {
          setTimeout(() => {
            if (plyrInstanceRef.current && plyrInstanceRef.current.paused) {
              plyrInstanceRef.current.play().catch(() => {});
            }
          }, 200);
        }
      }
    });

    return () => {
      backgroundEngine.unregisterPlayer();
    };
  }, [videoId, title, channelTitle, thumbnail, audioOnlyMode, isPlaying]);

  // Record initial ad/tracker block telemetry
  useEffect(() => {
    if (prefs.enabled) {
      trackEvent('ad', 1, { label: 'Filtered YouTube Video Pre-roll Ads' });
      trackEvent('tracker', 2, { label: 'Stripped Analytics & Telemetry Pixels' });
      
      setAdBlockedToast(true);
      const timer = setTimeout(() => setAdBlockedToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [videoId, prefs.enabled]);

  // Fetch SponsorBlock segments
  useEffect(() => {
    let isMounted = true;
    lastSkippedUUID.current = null;
    
    getSponsorSegments(videoId).then(segments => {
      if (isMounted) setSponsorSegments(segments);
    });
    return () => { isMounted = false; };
  }, [videoId]);

  // Initialize Plyr Custom HTML5 Video Player
  useEffect(() => {
    if (!containerRef.current) return;

    if (plyrInstanceRef.current) {
      try { plyrInstanceRef.current.destroy(); } catch (e) {}
    }

    const instance = new Plyr(containerRef.current, {
      autoplay: true,
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'duration',
        'mute',
        'volume',
        'settings',
        'pip',
        'fullscreen'
      ],
      settings: ['quality', 'speed'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1
      }
    });

    instance.on('play', () => {
      setIsPlaying(true);
      backgroundEngine.onPlayStateChanged(true);
    });

    instance.on('pause', () => {
      setIsPlaying(false);
      backgroundEngine.onPlayStateChanged(false);
    });

    instance.on('timeupdate', () => {
      if (instance.duration) {
        backgroundEngine.updatePositionState(instance.duration, instance.currentTime, instance.speed);
      }
    });

    instance.on('ended', () => {
      setIsPlaying(false);
      backgroundEngine.onPlayStateChanged(false);
    });

    plyrInstanceRef.current = instance;

    return () => {
      if (plyrInstanceRef.current) {
        try {
          plyrInstanceRef.current.destroy();
        } catch (e) {}
        plyrInstanceRef.current = null;
      }
    };
  }, [videoId]);

  // Monitor SponsorBlock segments for instant auto-skipping
  useEffect(() => {
    if (!prefs.autoSkipSponsors && !prefs.enabled) return;

    const interval = setInterval(() => {
      const player = plyrInstanceRef.current;
      if (!player || !sponsorSegments.length) return;

      const currentTime = player.currentTime;

      for (const seg of sponsorSegments) {
        if (currentTime >= seg.start && currentTime < seg.end && lastSkippedUUID.current !== seg.UUID) {
          lastSkippedUUID.current = seg.UUID;
          const targetTime = seg.end + 0.2;
          
          player.currentTime = targetTime;

          const segDuration = Math.round(seg.end - seg.start);
          setSponsorToast(`Skipped In-Video Sponsor (${formatTime(seg.start)} - ${formatTime(seg.end)})`);
          trackEvent('sponsor', 1, { duration: segDuration, label: `Skipped Sponsor Segment (${segDuration}s)` });

          setTimeout(() => setSponsorToast(null), 3000);
          break;
        }
      }
    }, 350);

    return () => clearInterval(interval);
  }, [sponsorSegments, prefs.autoSkipSponsors, prefs.enabled]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleAudioMode = () => {
    const nextMode = !audioOnlyMode;
    setAudioOnlyMode(nextMode);

    if (nextMode && directStream?.audioUrl) {
      if (directAudioRef.current) {
        directAudioRef.current.currentTime = plyrInstanceRef.current?.currentTime || 0;
        directAudioRef.current.play().catch(() => {});
      }
      plyrInstanceRef.current?.pause();
    } else if (!nextMode && directAudioRef.current) {
      if (plyrInstanceRef.current) {
        plyrInstanceRef.current.currentTime = directAudioRef.current.currentTime || 0;
        plyrInstanceRef.current.play().catch(() => {});
      }
      directAudioRef.current.pause();
    }
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black border border-[var(--border-strong)] shadow-2xl purple-glow group">
      {/* Top Floating Shields & Status Overlay */}
      <div className="absolute top-3 right-3 z-40 flex items-center gap-2">
        {/* Background Audio Mode Quick Toggle */}
        <button
          onClick={toggleAudioMode}
          title="Toggle Screen-Off Background Audio Mode"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-all shadow-md ${
            audioOnlyMode
              ? 'bg-purple-600 text-white shadow-purple-600/50 ring-2 ring-purple-400'
              : 'bg-black/60 text-white/80 hover:bg-black/80 hover:text-white border border-white/20'
          }`}
        >
          <Headphones size={13} />
          <span>{audioOnlyMode ? 'Audio Mode' : 'Screen-Off Mode'}</span>
        </button>

        {/* Shield Mini Indicator */}
        <button
          onClick={openModal}
          title="Protected by Zivo Ad Shield"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-black/80 transition-colors shadow-md"
        >
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-[10px] text-white">Shield Active</span>
        </button>
      </div>

      {/* Ad Blocked Notification Toast */}
      {adBlockedToast && prefs.enabled && (
        <div className="absolute top-3 left-3 z-40 flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-600/90 text-white font-semibold text-xs shadow-lg backdrop-blur-md animate-fade-in">
          <ShieldCheck size={15} className="text-white" />
          <span>Ad-Free Stream Protected</span>
        </div>
      )}

      {/* Sponsor Skip Toast Notification */}
      {sponsorToast && (
        <div className="absolute top-12 left-3 z-40 flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-purple-600/95 text-white font-semibold text-xs shadow-lg backdrop-blur-md animate-bounce">
          <Zap size={16} className="text-amber-300 fill-amber-300" />
          <span>{sponsorToast}</span>
        </div>
      )}

      {/* Pure Direct HTML5 Audio Stream Element (for guaranteed background play) */}
      {directStream?.audioUrl && (
        <audio
          ref={directAudioRef}
          src={directStream.audioUrl}
          playsInline
          webkit-playsinline="true"
          className="hidden"
          onPlay={() => { setIsPlaying(true); backgroundEngine.onPlayStateChanged(true); }}
          onPause={() => { setIsPlaying(false); backgroundEngine.onPlayStateChanged(false); }}
        />
      )}

      {/* Audio-Only / Screen-Off Mode Visualization View */}
      {audioOnlyMode && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-purple-950 via-slate-950 to-black flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
          <div className="relative">
            <img
              src={thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={title}
              className="w-28 h-28 rounded-3xl object-cover shadow-2xl border-2 border-purple-500/40 ring-4 ring-purple-500/20"
            />
            {isPlaying && (
              <span className="absolute -bottom-2 -right-2 p-2 rounded-full bg-purple-600 text-white shadow-lg animate-pulse">
                <Radio size={16} />
              </span>
            )}
          </div>

          <div className="max-w-md">
            <h4 className="font-black text-white text-base line-clamp-1">{title}</h4>
            <p className="text-xs text-purple-300 mt-0.5">{channelTitle}</p>
          </div>

          {/* Audio Visualizer Waves Indicator */}
          <div className="flex items-center gap-1.5 h-6">
            {[40, 75, 100, 60, 90, 45, 80, 50, 95, 70, 30].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-purple-500 to-pink-400 rounded-full transition-all duration-300"
                style={{
                  height: isPlaying ? `${h}%` : '20%',
                  opacity: isPlaying ? 1 : 0.4
                }}
              />
            ))}
          </div>

          <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
            <Moon size={12} className="text-purple-400" />
            <span>Screen-off background playback active. You can lock your device.</span>
          </p>
        </div>
      )}

      {/* Plyr YouTube Player Container */}
      <div 
        key={videoId} 
        className={`w-full h-full [&_.plyr]:w-full [&_.plyr]:h-full [&_.plyr]:rounded-3xl [&_.plyr--full-ui]:bg-black [&_.plyr__control--overlaid]:bg-purple-600 [&_.plyr--video_.plyr__control:hover]:bg-purple-600 ${audioOnlyMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div 
          ref={containerRef}
          data-plyr-provider="youtube" 
          data-plyr-embed-id={videoId}
        />
      </div>
    </div>
  );
}
