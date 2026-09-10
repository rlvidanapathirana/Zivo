import { useState, useEffect } from 'react';
import { useBraveShield } from '../context/BraveShieldContext';
import { ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

export default function ShieldButton() {
  const { prefs, stats, openModal, lastBlockEvent } = useBraveShield();
  const [pulse, setPulse] = useState(false);

  // Trigger real-time pulse glow animation whenever a block event occurs
  useEffect(() => {
    if (lastBlockEvent) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [lastBlockEvent]);

  const totalBlocked = (stats.adsBlocked || 0) + (stats.sponsorsSkipped || 0) + (stats.trackersBlocked || 0);

  return (
    <button
      onClick={openModal}
      aria-label="Open Zivo Ad Shield"
      title="Zivo Real-time Ad Shield Protection"
      className={`relative group flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all duration-300 select-none ${
        prefs.enabled
          ? 'bg-purple-600/15 border-purple-500/40 text-purple-300 hover:bg-purple-600/25 hover:border-purple-400'
          : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text)]'
      } ${pulse ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-black scale-105 shadow-lg shadow-purple-500/50' : ''}`}
    >
      {/* Real-time pulse ripple */}
      {pulse && (
        <span className="absolute -inset-0.5 rounded-2xl bg-purple-500/30 animate-ping pointer-events-none" />
      )}

      {/* Shield Icon */}
      <div className="relative">
        {prefs.enabled ? (
          <ShieldCheck
            size={19}
            className={`text-purple-400 transition-transform group-hover:scale-110 ${
              pulse ? 'text-emerald-400 animate-bounce' : ''
            }`}
          />
        ) : (
          <ShieldAlert size={19} className="text-amber-500/70" />
        )}

        {/* Live Protection Sparkle Indicator */}
        {prefs.enabled && (
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </div>

      {/* Block Count Counter Badge */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold font-mono tracking-tight text-[var(--text)] group-hover:text-purple-300">
          {prefs.enabled ? totalBlocked : 'OFF'}
        </span>
      </div>
    </button>
  );
}
