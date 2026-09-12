import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getSearchSuggestions } from '../services/invidiousService';
import { Search, Sun, Moon, Play, Menu, X, Clock, Bookmark, ThumbsUp, ArrowLeft } from 'lucide-react';
import ShieldButton from './ShieldButton';

export default function Header({ onSearch, onSelectCategory, onNavigate, currentTab, toggleSidebar }) {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const mobileInputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        const list = await getSearchSuggestions(query);
        setSuggestions(list);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      setMobileSearchOpen(false);
      onSearch(query.trim());
    }
  };

  const handleSelectSuggestion = (sug) => {
    setQuery(sug);
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    onSearch(sug);
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[var(--surface-header)] backdrop-blur-xl border-b border-[var(--border)] px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 transition-colors shadow-sm">
      {/* Mobile Search Overlay Bar */}
      {mobileSearchOpen ? (
        <div className="absolute inset-0 z-50 bg-[var(--surface-header)] backdrop-blur-2xl px-3 flex items-center gap-2 animate-fade-in">
          <button
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Back"
            className="p-2 rounded-2xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={22} />
          </button>
          
          <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search YouTube videos on Zivo..."
              className="w-full h-11 pl-10 pr-9 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-3)] text-sm focus:outline-none focus:border-purple-500"
            />
            <Search size={16} className="absolute left-3.5 text-purple-400" />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 rounded-full text-[var(--text-3)]"
              >
                <X size={16} />
              </button>
            )}
          </form>

          {/* Suggestions Dropdown for Mobile */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-[var(--surface-modal)] border-b border-[var(--border-modal)] shadow-2xl overflow-hidden z-50">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(sug)}
                  className="flex items-center gap-3 px-5 py-3 text-sm border-b border-[var(--border)] hover:bg-[var(--surface-2)] active:bg-[var(--surface-2)] cursor-pointer text-[var(--text)]"
                >
                  <Search size={14} className="text-purple-400" />
                  <span>{sug}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Left section: Logo & Drawer toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle menu"
          className="p-2 rounded-2xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div 
          onClick={() => onNavigate('home')} 
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl purple-gradient-btn flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-300">
            <Play size={18} className="fill-white text-white ml-0.5" />
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight purple-gradient-text">
            Zivo
          </span>
        </div>
      </div>

      {/* Middle section: Fast Search Bar (Desktop / Tablet) */}
      <div ref={searchRef} className="hidden md:block relative flex-1 max-w-2xl">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.trim().length > 1 && setShowSuggestions(true)}
            placeholder="Search videos, music, channels on Zivo..."
            className="w-full h-11 pl-11 pr-10 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-3)] text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
          <Search size={18} className="absolute left-4 text-[var(--text-3)]" />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); }}
              className="absolute right-3.5 p-1 rounded-full text-[var(--text-3)] hover:text-[var(--text)]"
            >
              <X size={16} />
            </button>
          )}
        </form>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface-modal)] border border-[var(--border-modal)] rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
            {suggestions.map((sug, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(sug)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[var(--surface-2)] cursor-pointer text-[var(--text)] transition-colors"
              >
                <Search size={14} className="text-purple-400" />
                <span>{sug}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right section: Shortcuts, Shield, Mobile Search & Theme Switcher */}
      <div className="flex items-center gap-1">
        {/* Mobile Search Button */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Open search"
          className="md:hidden p-2.5 rounded-2xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all"
        >
          <Search size={20} className="text-purple-400" />
        </button>

        {/* Real-time Brave Ad Shield */}
        <ShieldButton />

        <button
          onClick={() => onNavigate('watchLater')}
          title="Watch Later"
          className={`p-2.5 rounded-2xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all ${currentTab === 'watchLater' ? 'bg-[var(--surface-2)] text-purple-400' : ''}`}
        >
          <Bookmark size={20} />
        </button>

        <button
          onClick={() => onNavigate('liked')}
          title="Liked Videos"
          className={`hidden sm:flex p-2.5 rounded-2xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all ${currentTab === 'liked' ? 'bg-[var(--surface-2)] text-purple-400' : ''}`}
        >
          <ThumbsUp size={20} />
        </button>

        <button
          onClick={() => onNavigate('history')}
          title="Watch History"
          className={`p-2.5 rounded-2xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all ${currentTab === 'history' ? 'bg-[var(--surface-2)] text-purple-400' : ''}`}
        >
          <Clock size={20} />
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark/light theme"
          className="p-2.5 rounded-2xl text-[var(--text-2)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-all"
        >
          {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-purple-600" />}
        </button>
      </div>
    </header>
  );
}
