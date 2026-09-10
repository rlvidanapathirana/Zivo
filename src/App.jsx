import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { BraveShieldProvider } from './context/BraveShieldContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoCard from './components/VideoCard';
import WatchPage from './components/WatchPage';
import UpdatePrompt from './components/UpdatePrompt';
import { getTrendingVideos, searchVideos } from './services/invidiousService';
import { getHistory, getWatchLater, getLikedVideos, clearHistory } from './services/libraryService';
import { Home, Flame, Compass, Bookmark, Clock, ThumbsUp, Trash2, Sparkles, RefreshCw } from 'lucide-react';

function ZivoApp() {
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        if (currentTab === 'home' || currentTab === 'trending') {
          const list = await getTrendingVideos('LK', selectedCategory);
          if (isMounted) setVideos(list);
        } else if (currentTab === 'search') {
          const list = await searchVideos(searchQuery);
          if (isMounted) setVideos(list);
        } else if (currentTab === 'history') {
          if (isMounted) setVideos(getHistory());
        } else if (currentTab === 'watchLater') {
          if (isMounted) setVideos(getWatchLater());
        } else if (currentTab === 'liked') {
          if (isMounted) setVideos(getLikedVideos());
        }
      } catch (err) {
        console.error('Error loading videos:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (currentTab !== 'watch') {
      loadData();
    }
  }, [currentTab, selectedCategory, searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentTab('search');
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setCurrentTab('home');
  };

  const handleSelectVideo = (video) => {
    setActiveVideo(video);
    setCurrentTab('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (tab) => {
    setCurrentTab(tab);
    if (tab === 'home') setSelectedCategory('All');
  };

  const handleClearHistory = () => {
    clearHistory();
    setVideos([]);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] transition-colors flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onSearch={handleSearch}
        onSelectCategory={handleSelectCategory}
        onNavigate={handleNavigate}
        currentTab={currentTab}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Left Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onNavigate={handleNavigate}
          onSelectCategory={handleSelectCategory}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-24 lg:pb-12">
          {/* Watch Page */}
          {currentTab === 'watch' && activeVideo ? (
            <WatchPage video={activeVideo} onSelectVideo={handleSelectVideo} />
          ) : (
            <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6 animate-fade-in">
              {/* Category Pills Bar */}
              {(currentTab === 'home' || currentTab === 'trending') && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {['All', 'Music', 'Gaming', 'Tech & Science', 'News', 'Movies & Trailers'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleSelectCategory(cat)}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'purple-gradient-btn text-white shadow-lg shadow-purple-600/30'
                          : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--border)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* View Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {currentTab === 'home' && <Flame className="text-purple-400" size={24} />}
                  {currentTab === 'trending' && <Compass className="text-pink-400" size={24} />}
                  {currentTab === 'search' && <Sparkles className="text-purple-400" size={24} />}
                  {currentTab === 'history' && <Clock className="text-indigo-400" size={24} />}
                  {currentTab === 'watchLater' && <Bookmark className="text-purple-400" size={24} />}
                  {currentTab === 'liked' && <ThumbsUp className="text-pink-400" size={24} />}

                  <h2 className="text-xl font-black tracking-tight text-[var(--text)] capitalize">
                    {currentTab === 'search' ? `Results for "${searchQuery}"` : currentTab}
                  </h2>
                </div>

                {currentTab === 'history' && videos.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={14} /> Clear History
                  </button>
                )}
              </div>

              {/* Video Grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-video bg-[var(--surface-2)] rounded-3xl" />
                  ))}
                </div>
              ) : videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {videos.map(video => (
                    <VideoCard key={video.id} video={video} onSelectVideo={handleSelectVideo} />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="py-20 text-center space-y-3 bg-[var(--surface-2)]/40 rounded-3xl border border-[var(--border)]">
                  <RefreshCw size={36} className="mx-auto text-[var(--text-3)] animate-spin-slow" />
                  <p className="text-sm font-semibold text-[var(--text-2)]">No videos found in {currentTab}</p>
                  <button
                    onClick={() => handleNavigate('home')}
                    className="px-5 py-2 rounded-full purple-gradient-btn text-white text-xs font-bold transition-all shadow-md"
                  >
                    Back to Home Feed
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Ultra Mobile Responsive) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[var(--surface-header)] border-t border-[var(--border)] backdrop-blur-xl flex items-center justify-around px-2 lg:hidden shadow-2xl">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'trending', label: 'Trending', icon: Flame },
          { id: 'watchLater', label: 'Saved', icon: Bookmark },
          { id: 'history', label: 'History', icon: Clock }
        ].map(nav => {
          const Icon = nav.icon;
          const active = currentTab === nav.id;
          return (
            <button
              key={nav.id}
              onClick={() => handleNavigate(nav.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${
                active ? 'text-purple-400 font-bold' : 'text-[var(--text-3)] hover:text-[var(--text)]'
              }`}
            >
              <Icon size={20} className={active ? 'text-purple-400 scale-110' : ''} />
              <span className="text-[10px]">{nav.label}</span>
            </button>
          );
        })}
      </nav>

      {/* PWA Update Toast Notification with Refresh Button */}
      <UpdatePrompt />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BraveShieldProvider>
        <ZivoApp />
      </BraveShieldProvider>
    </ThemeProvider>
  );
}
