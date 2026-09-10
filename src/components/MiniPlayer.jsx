import { usePlayer } from '../context/PlayerContext';
import { useBraveShield } from '../context/BraveShieldContext';
import { Play, Pause, Maximize2, X, ShieldCheck, Radio } from 'lucide-react';

export default function MiniPlayer({ onExpand }) {
  const { currentVideo, isPlaying, isMiniPlayer, togglePlayPause, closePlayer } = usePlayer();
  const { prefs } = useBraveShield();

  if (!currentVideo || !isMiniPlayer) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-3 lg:right-6 z-50 w-80 max-w-[calc(100vw-1.5rem)] bg-[var(--surface-modal)] border border-purple-500/40 rounded-3xl p-3 shadow-2xl backdrop-blur-2xl animate-slide-up purple-glow select-none">
      <div className="flex items-center gap-3">
        {/* Clickable Thumbnail to Expand */}
        <div 
          onClick={onExpand}
          className="relative w-16 h-12 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer group"
        >
          <img
            src={currentVideo.thumbnail || `https://i.ytimg.com/vi/${currentVideo.id}/hqdefault.jpg`}
            alt={currentVideo.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          {isPlaying && (
            <span className="absolute bottom-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          )}
        </div>

        {/* Video Info (Click to Expand) */}
        <div 
          onClick={onExpand}
          className="flex-1 min-w-0 cursor-pointer space-y-0.5"
        >
          <h4 className="text-xs font-bold text-[var(--text)] line-clamp-1 group-hover:text-purple-400 transition-colors">
            {currentVideo.title}
          </h4>
          <p className="text-[10px] text-[var(--text-3)] truncate flex items-center gap-1">
            <span>{currentVideo.channelTitle}</span>
            {prefs.enabled && (
              <span className="inline-flex items-center text-emerald-400">
                • <ShieldCheck size={11} className="inline ml-0.5" />
              </span>
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="p-2 rounded-xl purple-gradient-btn text-white shadow-md shadow-purple-600/30 hover:scale-105 transition-transform"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={14} className="fill-white" /> : <Play size={14} className="fill-white ml-0.5" />}
          </button>

          {/* Expand Button */}
          <button
            onClick={onExpand}
            className="p-2 rounded-xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            title="Expand to Full Player"
          >
            <Maximize2 size={15} />
          </button>

          {/* Close Button */}
          <button
            onClick={closePlayer}
            className="p-1.5 rounded-xl text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Close Player"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
