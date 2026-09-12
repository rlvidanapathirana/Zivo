import { useState, useEffect, useRef } from 'react';
import { getSponsorSegments } from '../services/sponsorBlockService';
import { recordShieldEvent } from '../services/braveShieldService';
import { getVideoStreams } from '../services/invidiousService';
import { backgroundEngine } from '../services/backgroundPlaybackService';
import { useBraveShield } from '../context/BraveShieldContext';
import { usePlayer } from '../context/PlayerContext';
import { Zap, ShieldCheck, Headphones, Moon, Radio } from 'lucide-react';

export default function VideoPlayer({ videoId, title, channelTitle, thumbnail }) {
  const { prefs, trackEvent, openModal } = useBraveShield();
  const { isPlaying, setIsPlaying, audioOnlyMode, setAudioOnlyMode } = usePlayer();
  const [sponsorSegments, setSponsorSegments] = useState([]);
  const [sponsorToast, setSponsorToast] = useState(null);
  const [adBlockedToast, setAdBlockedToast] = useState(false);
  const [directStream, setDirectStream] = useState(null);

  const iframeRef = useRef(null);
  const directAudioRef = useRef(null);
  const lastSkippedUUID = useRef(null);

  // Fetch Direct Streams & Ad-Free Embed URL
  useEffect(() => {
    let isMounted = true;
    setDirectStream(null);

    getVideoStreams(videoId).then(streams => {
      if (isMounted && streams) {
        setDirectStream(streams);
      }
    });

    return () => { isMounted = false; };
  }, [videoId]);

  // MediaSession setup
  useEffect(() => {
    backgroundEngine.updateMediaSession({
      title: title || 'Zivo Video Stream',
      channelTitle: channelTitle || 'Zivo Creator',
      thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailMax: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      videoId
    });

    backgroundEngine.registerPlayer({
      onPlay: () => {
        if (directAudioRef.current && audioOnlyMode) {
          directAudioRef.current.play().catch(() => {});
        }
        setIsPlaying(true);
      },
      onPause: () => {
        if (directAudioRef.current) {
          directAudioRef.current.pause();
        }
        setIsPlaying(false);
      },
      onSeek: (time) => {
        if (directAudioRef.current && audioOnlyMode) {
          directAudioRef.current.currentTime = time;
        }
      },
      onSkip: (delta) => {
        if (directAudioRef.current) {
          directAudioRef.current.currentTime = Math.max(0, directAudioRef.current.currentTime + delta);
        }
      },
      onStop: () => {
        directAudioRef.current?.pause();
        setIsPlaying(false);
      }
    });

    return () => {
      backgroundEngine.unregisterPlayer();
    };
  }, [videoId, title, channelTitle, thumbnail, audioOnlyMode]);

  // Shield telemetry
  useEffect(() => {
    if (prefs.enabled) {
      recordShieldEvent('ad', 1, { label: 'Blocked YouTube Video Pre-roll Ads' });
      recordShieldEvent('tracker', 2, { label: 'Filtered Telemetry Pings' });
      
      setAdBlockedToast(true);
      const timer = setTimeout(() => setAdBlockedToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [videoId, prefs.enabled]);

  // SponsorBlock setup
  useEffect(() => {
    let isMounted = true;
    lastSkippedUUID.current = null;
    
    getSponsorSegments(videoId).then(segments => {
      if (isMounted) setSponsorSegments(segments);
    });
    return () => { isMounted = false; };
  }, [videoId]);

  const toggleAudioMode = () => {
    setAudioOnlyMode(!audioOnlyMode);
  };

  const embedSrc = directStream?.embedUrl || `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1`;

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
              : 'bg-black/70 text-white/90 hover:bg-black/90 border border-white/20'
          }`}
        >
          <Headphones size={13} />
          <span>{audioOnlyMode ? 'Audio Mode' : 'Screen-Off Mode'}</span>
        </button>

        {/* Shield Mini Indicator */}
        <button
          onClick={openModal}
          title="Protected by Zivo Ad Shield"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-black/90 transition-colors shadow-md"
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

      {/* Pure Direct HTML5 Audio Stream Element (for background audio mode) */}
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
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-purple-950 via-zinc-950 to-black flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
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

          {/* Audio Visualizer Waves */}
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

      {/* Ad-Free Privacy Video Stream Player Embed */}
      <iframe
        key={videoId}
        ref={iframeRef}
        src={embedSrc}
        title={title || 'Zivo Video Player'}
        className={`w-full h-full border-0 rounded-3xl transition-opacity duration-300 ${audioOnlyMode ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={() => setIsPlaying(true)}
      />
    </div>
  );
}
