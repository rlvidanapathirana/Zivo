import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Periodically check for new PWA app updates every 60 seconds
        setInterval(() => {
          r.update().catch(() => {});
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('Zivo SW registration note:', error);
    },
  });

  const handleRefresh = () => {
    updateServiceWorker(true);
  };

  const handleClose = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 left-4 sm:left-auto z-50 max-w-md bg-[var(--surface-modal)] border border-purple-500/40 rounded-3xl p-4 shadow-2xl backdrop-blur-xl animate-bounce-short purple-glow">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-2xl purple-gradient-btn text-white shadow-md flex-shrink-0">
          <Sparkles size={20} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
            New Update Available!
          </h4>
          <p className="text-xs text-[var(--text-2)] mt-0.5 leading-snug">
            A new version of Zivo is ready. Click refresh to load the latest features.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl purple-gradient-btn text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-transform"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
              <span>Refresh Now</span>
            </button>

            <button
              onClick={handleClose}
              className="px-3 py-2 rounded-xl bg-[var(--surface-2)] text-[var(--text-2)] text-xs font-semibold hover:text-[var(--text)] transition-colors"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-1 rounded-full text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
