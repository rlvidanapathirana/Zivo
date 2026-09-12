import { Home, Flame, Music, Gamepad2, Cpu, Newspaper, Film, Bookmark, Clock, ThumbsUp, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function Sidebar({ currentTab, onNavigate, onSelectCategory, isOpen, onClose }) {
  const { isInstalled, promptInstall } = usePWAInstall();

  const mainNav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'trending', label: 'Trending', icon: Flame },
    { id: 'watchLater', label: 'Watch Later', icon: Bookmark },
    { id: 'history', label: 'Watch History', icon: Clock },
    { id: 'liked', label: 'Liked Videos', icon: ThumbsUp }
  ];

  const categories = [
    { label: 'All', icon: Home },
    { label: 'Music', icon: Music },
    { label: 'Gaming', icon: Gamepad2 },
    { label: 'Tech & Science', icon: Cpu },
    { label: 'News', icon: Newspaper },
    { label: 'Movies & Trailers', icon: Film }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-[var(--surface-header)] border-r border-[var(--border)]
        flex flex-col justify-between overflow-y-auto p-4 transition-transform duration-300 backdrop-blur-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-[var(--text-3)] mb-2">Explore</h4>
            {mainNav.map(item => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                    active 
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 font-semibold border border-purple-500/30 shadow-sm' 
                      : 'text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-purple-400' : ''} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Categories */}
          <div className="space-y-1 pt-4 border-t border-[var(--border)]">
            <h4 className="px-3 text-xs font-bold uppercase tracking-wider text-[var(--text-3)] mb-2">Categories</h4>
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.label}
                  onClick={() => { onSelectCategory(cat.label); onClose(); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-2xl text-sm text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all"
                >
                  <Icon size={16} className="text-purple-400" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer Link & Install Button */}
        <div className="pt-4 mt-6 border-t border-[var(--border)] space-y-3 text-[11px] text-[var(--text-3)]">
          {!isInstalled && (
            <button
              onClick={promptInstall}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl purple-gradient-btn text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-102 transition-transform"
            >
              <Download size={15} />
              <span>Install Zivo App</span>
            </button>
          )}

          <p className="leading-relaxed">
            Developed with ❤️ by{' '}
            <a
              href="https://lakshan.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-purple-400 hover:text-purple-300 hover:underline transition-colors block mt-0.5"
            >
              V.P.R. Lakshan Vidanapathirana
            </a>
          </p>
        </div>
      </aside>
    </>
  );
}
