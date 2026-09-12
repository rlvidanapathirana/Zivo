import { usePlayer } from '../context/PlayerContext';
import { useBraveShield } from '../context/BraveShieldContext';
import { Maximize2, X, ShieldCheck } from 'lucide-react';
import VideoPlayer from './VideoPlayer';

export default function MiniPlayer({ onExpand }) {
  const { currentVideo, isMiniPlayer, closePlayer } = usePlayer();
  const { prefs } = useBraveShield();

  if (!currentVideo || !isMiniPlayer) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-3 lg:right-6 z-50 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-[var(--surface-modal)] border border-purple-500/50 rounded-3xl p-2.5 shadow-2xl backdrop-blur-2xl animate-slide-up purple-glow select-none">
      {/* Floating Aspect Video Stream Box */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-white/10 bg-black">
        <VideoPlayer
          videoId={currentVideo.id}
          title={currentVideo.title}
          channelTitle={currentVideo.channelTitle}
          thumbnail={currentVideo.thumbnail}
          isMini={true}
        />
      </div>

      {/* Floating Control Bar below live video */}
      <div className="flex items-center justify-between gap-2 px-2 pt-2">
        <div 
          onClick={onExpand}
          className="flex-1 min-w-0 cursor-pointer space-y-0.5 group"
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
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Expand to Full Watch Page Button */}
          <button
            onClick={onExpand}
            className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-all shadow-sm"
            title="Expand to Full Player"
          >
            <Maximize2 size={15} />
          </button>

          {/* Close Player Button */}
          <button
            onClick={closePlayer}
            className="p-2 rounded-xl text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Close Player"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
