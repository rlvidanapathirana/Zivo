import { useState, useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { getSponsorSegments } from '../services/sponsorBlockService';
import { recordShieldEvent } from '../services/braveShieldService';
import { Zap, ShieldCheck } from 'lucide-react';

export default function VideoPlayer({ videoId, title }) {
  const [sponsorSegments, setSponsorSegments] = useState([]);
  const [sponsorToast, setSponsorToast] = useState(null);
  const containerRef = useRef(null);
  const plyrInstanceRef = useRef(null);
  const lastSkippedUUID = useRef(null);

  // Fetch SponsorBlock segments for instant background skipping
  useEffect(() => {
    let isMounted = true;
    getSponsorSegments(videoId).then(segments => {
      if (isMounted) setSponsorSegments(segments);
    });
    return () => { isMounted = false; };
  }, [videoId]);

  // Initialize Plyr Custom HTML5 Video Player with Ad-Block Parameters
  useEffect(() => {
    if (!containerRef.current) return;

    if (plyrInstanceRef.current) {
      plyrInstanceRef.current.destroy();
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

    plyrInstanceRef.current = instance;

    return () => {
      if (plyrInstanceRef.current) {
        plyrInstanceRef.current.destroy();
        plyrInstanceRef.current = null;
      }
    };
  }, [videoId]);

  // High-Frequency Ad Detector & Instant Skipper (Brave Engine)
  useEffect(() => {
    const adInterval = setInterval(() => {
      const player = plyrInstanceRef.current;
      if (!player) return;

      try {
        // Find iframe inside Plyr container
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe) {
          // Send JS API commands to bypass YouTube ads instantly
          iframe.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'setAdFlags', args: [0] }),
            '*'
          );
        }
      } catch (e) {}
    }, 250);

    return () => clearInterval(adInterval);
  }, [videoId]);

  // Monitor SponsorBlock segments for instant skipping
  useEffect(() => {
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
          setSponsorToast(`Skipped Sponsor Segment (${formatTime(seg.start)} - ${formatTime(seg.end)})`);
          recordShieldEvent('sponsor', 1, { duration: segDuration });

          setTimeout(() => setSponsorToast(null), 3000);
          break;
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [sponsorSegments]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-black border border-[var(--border-strong)] shadow-2xl purple-glow group">
      {/* Sponsor Skip Toast Notification */}
      {sponsorToast && (
        <div className="absolute top-4 left-4 z-40 flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600/90 text-white font-semibold text-xs shadow-lg backdrop-blur-md animate-bounce">
          <Zap size={16} className="text-amber-300 fill-amber-300" />
          <span>{sponsorToast}</span>
        </div>
      )}

      {/* Plyr YouTube Player Container */}
      <div className="w-full h-full [&_.plyr]:w-full [&_.plyr]:h-full [&_.plyr]:rounded-3xl [&_.plyr--full-ui]:bg-black [&_.plyr__control--overlaid]:bg-purple-600 [&_.plyr--video_.plyr__control:hover]:bg-purple-600">
        <div 
          ref={containerRef}
          data-plyr-provider="youtube" 
          data-plyr-embed-id={videoId}
        />
      </div>
    </div>
  );
}
