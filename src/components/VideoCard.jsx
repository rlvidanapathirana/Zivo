import { useState } from 'react';
import { Bookmark, Check, Play, Share2 } from 'lucide-react';
import { toggleWatchLater, isInWatchLater } from '../services/libraryService';

export default function VideoCard({ video, onSelectVideo }) {
  const [saved, setSaved] = useState(() => isInWatchLater(video.id));
  const [copied, setCopied] = useState(false);

  const handleSaveToggle = (e) => {
    e.stopPropagation();
    const newState = toggleWatchLater(video);
    setSaved(newState);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://youtu.be/${video.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={() => onSelectVideo(video)}
      className="group flex flex-col cursor-pointer rounded-3xl overflow-hidden bg-[var(--surface-card)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/60">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
          }}
        />

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-2xl purple-gradient-btn text-white flex items-center justify-center shadow-lg shadow-purple-600/50 transform scale-90 group-hover:scale-100 transition-transform">
            <Play size={22} className="fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-white text-xs font-semibold tracking-wide border border-white/10">
            {video.duration}
          </div>
        )}

        {/* Save & Share Quick Actions */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleSaveToggle}
            title={saved ? 'Remove from Watch Later' : 'Save to Watch Later'}
            className={`p-2 rounded-xl backdrop-blur-md transition-colors ${
              saved ? 'purple-gradient-btn text-white' : 'bg-black/60 text-white hover:bg-black/80'
            }`}
          >
            {saved ? <Check size={14} /> : <Bookmark size={14} />}
          </button>
          <button
            onClick={handleShare}
            title="Copy YouTube Link"
            className="p-2 rounded-xl bg-black/60 backdrop-blur-md text-white hover:bg-black/80 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
          </button>
        </div>
      </div>

      {/* Details Container */}
      <div className="p-4 flex gap-3 flex-1">
        {/* Channel Avatar */}
        <div className="flex-shrink-0">
          <img
            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(video.channelTitle || 'channel')}`}
            alt={video.channelTitle}
            className="w-9 h-9 rounded-full object-cover border border-[var(--border-strong)]"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2 leading-snug group-hover:text-purple-400 transition-colors">
            {video.title}
          </h3>
          
          <div className="mt-2 text-xs text-[var(--text-2)] space-y-0.5">
            <p className="font-medium hover:text-[var(--text)] truncate">{video.channelTitle}</p>
            <div className="flex items-center gap-1.5 text-[var(--text-3)] text-[11px]">
              <span>{video.viewCountFormatted || 'Views'}</span>
              <span>•</span>
              <span>{video.publishedText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
