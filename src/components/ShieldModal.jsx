import { useBraveShield } from '../context/BraveShieldContext';
import { formatTimeSaved, formatBandwidth } from '../services/braveShieldService';
import { 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  Zap, 
  EyeOff, 
  Radio, 
  Clock, 
  HardDrive, 
  RotateCcw, 
  CheckCircle2, 
  Moon, 
  SunMedium,
  Lock
} from 'lucide-react';

export default function ShieldModal() {
  const { 
    prefs, 
    stats, 
    logs, 
    isModalOpen, 
    closeModal, 
    toggleShield, 
    updatePref, 
    resetStats 
  } = useBraveShield();

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {/* Modal Dialog Card */}
      <div 
        className="relative w-full max-w-lg bg-[var(--surface-modal)] border border-[var(--border-modal)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header with Gradient */}
        <div className="relative p-6 bg-gradient-to-br from-purple-900/40 via-indigo-950/30 to-purple-950/20 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              prefs.enabled 
                ? 'bg-purple-600 text-white shadow-purple-600/40 ring-4 ring-purple-500/20' 
                : 'bg-zinc-800 text-zinc-400'
            }`}>
              {prefs.enabled ? <ShieldCheck size={26} /> : <ShieldAlert size={26} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-[var(--text)]">Zivo Ad Shield</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  prefs.enabled 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                }`}>
                  {prefs.enabled ? 'Active & Protecting' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                Real-time Ad Blocker & Background Play Engine
              </p>
            </div>
          </div>

          <button
            onClick={closeModal}
            className="p-2 rounded-full text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body with Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Master Shield Toggle Banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-[var(--text)]">Shields Protection</span>
              <p className="text-xs text-[var(--text-3)]">
                {prefs.enabled ? 'Blocking ads, trackers & sponsor segments' : 'Protection temporarily disabled'}
              </p>
            </div>

            <button
              onClick={toggleShield}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                prefs.enabled ? 'bg-purple-600' : 'bg-zinc-600'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 shadow-md ${
                  prefs.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Real-time Telemetry Stats Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)] mb-3 flex items-center gap-1.5">
              <Radio size={14} className="text-purple-400 animate-pulse" />
              <span>Real-Time Protection Telemetry</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Ads Blocked */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <span className="text-[11px] font-medium text-[var(--text-3)]">Ads Blocked</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-purple-400 font-mono">
                    {stats.adsBlocked || 0}
                  </span>
                </div>
              </div>

              {/* Trackers Blocked */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <span className="text-[11px] font-medium text-[var(--text-3)]">Trackers Blocked</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-indigo-400 font-mono">
                    {stats.trackersBlocked || 0}
                  </span>
                </div>
              </div>

              {/* Sponsors Skipped */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <span className="text-[11px] font-medium text-[var(--text-3)]">Sponsors Skipped</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {stats.sponsorsSkipped || 0}
                  </span>
                </div>
              </div>

              {/* Bandwidth Saved */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between">
                <span className="text-[11px] font-medium text-[var(--text-3)] flex items-center gap-1">
                  <HardDrive size={12} /> Data Saved
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono mt-1">
                  {formatBandwidth(stats.bandwidthSavedMB)}
                </span>
              </div>

              {/* Time Saved */}
              <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-col justify-between sm:col-span-2">
                <span className="text-[11px] font-medium text-[var(--text-3)] flex items-center gap-1">
                  <Clock size={12} /> Time Saved (No Ads/Sponsors)
                </span>
                <span className="text-lg font-bold text-pink-400 font-mono mt-1">
                  {formatTimeSaved(stats.timeSavedSec)}
                </span>
              </div>
            </div>
          </div>

          {/* Granular Feature Toggles */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)]">
              Advanced Protection & Background Engine
            </h4>

            {/* Background & Screen-Off Playback Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400">
                  <Moon size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[var(--text)]">Screen-Off Background Play</h5>
                  <p className="text-[11px] text-[var(--text-3)]">Continue playing audio when screen is locked or app is minimized</p>
                </div>
              </div>
              <button
                onClick={() => updatePref('screenOffPlayback', !prefs.screenOffPlayback)}
                className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                  prefs.screenOffPlayback !== false ? 'bg-purple-600' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.screenOffPlayback !== false ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Screen WakeLock (Keep Awake) */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <SunMedium size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[var(--text)]">Keep Screen Awake (WakeLock)</h5>
                  <p className="text-[11px] text-[var(--text-3)]">Prevent phone screen from sleeping during video playback</p>
                </div>
              </div>
              <button
                onClick={() => updatePref('keepScreenAwake', !prefs.keepScreenAwake)}
                className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                  prefs.keepScreenAwake ? 'bg-purple-600' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.keepScreenAwake ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* SponsorBlock Auto-Skip */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <Zap size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[var(--text)]">SponsorBlock Auto-Skip</h5>
                  <p className="text-[11px] text-[var(--text-3)]">Automatically skip embedded creator sponsors & promos</p>
                </div>
              </div>
              <button
                onClick={() => updatePref('autoSkipSponsors', !prefs.autoSkipSponsors)}
                className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                  prefs.autoSkipSponsors !== false ? 'bg-purple-600' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.autoSkipSponsors !== false ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Ad & Tracker Blocker */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                  <EyeOff size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[var(--text)]">Block Trackers & Telemetry</h5>
                  <p className="text-[11px] text-[var(--text-3)]">Strip tracking cookies and telemetry beacons</p>
                </div>
              </div>
              <button
                onClick={() => updatePref('blockTrackers', !prefs.blockTrackers)}
                className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                  prefs.blockTrackers !== false ? 'bg-purple-600' : 'bg-zinc-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    prefs.blockTrackers !== false ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Real-time Event Activity Log */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-3)] mb-2 flex items-center justify-between">
              <span>Live Shield Activity Log</span>
              <span className="text-[10px] text-purple-400 font-normal">Real-Time Stream</span>
            </h4>

            <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
              {logs && logs.length > 0 ? (
                logs.slice(0, 8).map(log => (
                  <div key={log.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-[var(--surface)] transition-colors">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        log.type === 'ad' ? 'bg-purple-400' : log.type === 'sponsor' ? 'bg-amber-400' : 'bg-emerald-400'
                      }`} />
                      <span className="truncate text-[var(--text)]">{log.label}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-3)] flex-shrink-0 ml-2">{log.time}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-[var(--text-3)]">
                  Shield active. Watching for ad networks & sponsor segments...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[var(--surface-2)]/50 border-t border-[var(--border)] flex items-center justify-between gap-3">
          <button
            onClick={resetStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset Stats</span>
          </button>

          <button
            onClick={closeModal}
            className="px-6 py-2 rounded-full purple-gradient-btn text-white text-xs font-bold transition-all shadow-md shadow-purple-600/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
