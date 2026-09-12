import { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import VideoCard from './VideoCard';
import { getVideoDetails, getVideoComments } from '../services/invidiousService';
import { 
  addToHistory, 
  toggleLikeVideo, 
  isVideoLiked, 
  toggleWatchLater, 
  isInWatchLater
} from '../services/libraryService';
import { usePlayer } from '../context/PlayerContext';
import { ThumbsUp, Bookmark, Share2, Check, ChevronDown, ChevronUp, MessageSquare, Minimize2 } from 'lucide-react';

export default function WatchPage({ video, onSelectVideo }) {
  const { minimizePlayer } = usePlayer();
  const [details, setDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!video || !video.id) return;
    
    addToHistory(video);
    setLiked(isVideoLiked(video.id));
    setSaved(isInWatchLater(video.id));
    setDetails(null);
    setComments([]);

    let isMounted = true;
    setLoading(true);

    getVideoDetails(video.id).then(res => {
      if (isMounted && res) {
        setDetails(res);
        setLoading(false);
      }
    });

    getVideoComments(video.id).then(res => {
      if (isMounted) setComments(res || []);
    });

    return () => { isMounted = false; };
  }, [video?.id]);

  if (!video) return null;

  const handleLikeToggle = () => {
    const newState = toggleLikeVideo(video);
    setLiked(newState);
  };

  const handleSaveToggle = () => {
    const newState = toggleWatchLater(video);
    setSaved(newState);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?v=${video.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {/* Left Column: Player & Video Info */}
      <div className="lg:col-span-2 space-y-5">
        {/* Main Video Player with unique key for instant reset on video switch */}
        <VideoPlayer 
          key={video.id}
          videoId={video.id} 
          title={video.title} 
          channelTitle={video.channelTitle} 
          thumbnail={video.thumbnail} 
        />

        {/* Video Title & Minimize Button */}
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl lg:text-2xl font-black text-[var(--text)] leading-snug flex-1">
            {video.title}
          </h1>

          <button
            onClick={minimizePlayer}
            title="Minimize to Floating Mini-Player"
            className="p-2.5 rounded-2xl bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--border)] transition-all flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 shadow-sm"
          >
            <Minimize2 size={16} />
            <span className="hidden sm:inline">Mini Player</span>
          </button>
        </div>

        {/* Channel Info & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[var(--border)]">
          {/* Creator Profile */}
          <div className="flex items-center gap-3">
            <img
              src={details?.channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(video.channelTitle || 'channel')}`}
              alt={video.channelTitle}
              className="w-11 h-11 rounded-full object-cover border border-[var(--border-strong)] shadow-sm"
            />
            <div>
              <h3 className="font-bold text-sm text-[var(--text)] flex items-center gap-1">
                {video.channelTitle}
              </h3>
              <p className="text-xs text-[var(--text-3)]">{details?.subCountText || 'YouTube Creator'}</p>
            </div>
          </div>

          {/* Action Buttons: Like, Save, Share */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                liked 
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' 
                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <ThumbsUp size={16} className={liked ? 'fill-purple-400' : ''} />
              <span>{liked ? 'Liked' : 'Like'}</span>
            </button>

            <button
              onClick={handleSaveToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                saved 
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' 
                  : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <Bookmark size={16} className={saved ? 'fill-purple-400' : ''} />
              <span>{saved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text)] transition-all"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Video Description Box */}
        <div className="p-4 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] text-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-2)]">
            <span>{video.viewCountFormatted || 'Views'}</span>
            <span>•</span>
            <span>{video.publishedText}</span>
          </div>

          <p className={`text-[var(--text-2)] text-xs leading-relaxed whitespace-pre-wrap ${!showFullDesc ? 'line-clamp-3' : ''}`}>
            {details?.description || 'No description available for this video.'}
          </p>

          {details?.description && (
            <button
              onClick={() => setShowFullDesc(!showFullDesc)}
              className="flex items-center gap-1 text-xs font-semibold text-purple-400 hover:underline pt-1"
            >
              <span>{showFullDesc ? 'Show Less' : 'Show More'}</span>
              {showFullDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        {/* Comments Section */}
        <div className="space-y-4 pt-4 border-t border-[var(--border)]">
          <h3 className="font-black text-lg text-[var(--text)] flex items-center gap-2">
            <MessageSquare size={20} className="text-purple-400" />
            <span>Comments ({comments.length})</span>
          </h3>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {comments.length > 0 ? (
              comments.slice(0, 15).map(c => (
                <div key={c.commentId || c.author} className="flex gap-3 p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <img
                    src={c.authorThumbnails?.[0]?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(c.author || 'user')}`}
                    alt={c.author}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                      <span>{c.author}</span>
                      <span className="text-[10px] text-[var(--text-3)]">{c.publishedText}</span>
                    </div>
                    <p className="text-[var(--text-2)] whitespace-pre-wrap leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-3)] py-4 text-center">
                {loading ? 'Comments loading...' : 'No comments yet'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Up Next / Recommended Videos */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--text-2)]">Up Next</h3>
        
        <div className="space-y-4">
          {details?.recommendedVideos?.length > 0 ? (
            details.recommendedVideos.map(rec => (
              <VideoCard key={rec.id} video={rec} onSelectVideo={onSelectVideo} />
            ))
          ) : (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-32 h-20 bg-[var(--surface-2)] rounded-2xl flex-shrink-0" />
                  <div className="space-y-2 flex-1 pt-1">
                    <div className="h-3 bg-[var(--surface-2)] rounded w-full" />
                    <div className="h-2.5 bg-[var(--surface-2)] rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
