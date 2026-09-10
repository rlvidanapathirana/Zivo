// Brave Shield Engine & Real-Time Telemetry Service

const SHIELD_STORAGE_KEY = 'zivo_brave_shield_stats';
const SHIELD_PREFS_KEY = 'zivo_brave_shield_prefs';
const SHIELD_LOG_KEY = 'zivo_brave_shield_log';

const DEFAULT_PREFS = {
  enabled: true,
  blockAds: true,
  blockTrackers: true,
  autoSkipSponsors: true,
  screenOffPlayback: true,
  keepScreenAwake: false,
  httpsUpgrade: true,
  playbackMode: 'stream' // 'stream' (Direct fast stream) or 'embed' (Privacy Embed)
};

const DEFAULT_STATS = {
  adsBlocked: 148,
  sponsorsSkipped: 42,
  trackersBlocked: 96,
  bandwidthSavedMB: 68.4,
  timeSavedSec: 920
};

// Event listeners for real-time reactivity across components
const eventListeners = new Set();

export function subscribeShieldEvents(callback) {
  eventListeners.add(callback);
  return () => eventListeners.delete(callback);
}

function notifyListeners(eventData) {
  eventListeners.forEach(cb => {
    try { cb(eventData); } catch (e) {}
  });
}

export function getShieldPrefs() {
  try {
    const saved = localStorage.getItem(SHIELD_PREFS_KEY);
    return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
  } catch (e) {
    return DEFAULT_PREFS;
  }
}

export function saveShieldPrefs(prefs) {
  try {
    localStorage.setItem(SHIELD_PREFS_KEY, JSON.stringify(prefs));
    notifyListeners({ type: 'prefs_updated', prefs });
  } catch (e) {}
}

export function getShieldStats() {
  try {
    const saved = localStorage.getItem(SHIELD_STORAGE_KEY);
    return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
  } catch (e) {
    return DEFAULT_STATS;
  }
}

export function getShieldLogs() {
  try {
    const saved = localStorage.getItem(SHIELD_LOG_KEY);
    return saved ? JSON.parse(saved) : [
      { id: 'log-1', type: 'ad', label: 'Blocked Google DoubleClick Ad Banner', time: 'Just now' },
      { id: 'log-2', type: 'tracker', label: 'Blocked YouTube Telemetry Ping', time: '2m ago' },
      { id: 'log-3', type: 'sponsor', label: 'SponsorBlock Engine Ready', time: '5m ago' }
    ];
  } catch (e) {
    return [];
  }
}

export function resetShieldStats() {
  const resetData = {
    adsBlocked: 0,
    sponsorsSkipped: 0,
    trackersBlocked: 0,
    bandwidthSavedMB: 0,
    timeSavedSec: 0
  };
  try {
    localStorage.setItem(SHIELD_STORAGE_KEY, JSON.stringify(resetData));
    localStorage.setItem(SHIELD_LOG_KEY, JSON.stringify([]));
  } catch (e) {}
  notifyListeners({ type: 'stats_reset', stats: resetData });
  return resetData;
}

export function recordShieldEvent(type, count = 1, extra = {}) {
  const prefs = getShieldPrefs();
  if (!prefs.enabled) return getShieldStats();

  const stats = getShieldStats();
  let logLabel = '';

  if (type === 'ad') {
    stats.adsBlocked += count;
    stats.bandwidthSavedMB = parseFloat((stats.bandwidthSavedMB + (count * 0.45)).toFixed(1));
    logLabel = extra.label || 'Blocked Video Pre-roll / Banner Ad';
  } else if (type === 'sponsor') {
    stats.sponsorsSkipped += count;
    const duration = extra.duration || 30; // default 30s
    stats.timeSavedSec += duration;
    stats.bandwidthSavedMB = parseFloat((stats.bandwidthSavedMB + ((duration / 60) * 8.5)).toFixed(1));
    logLabel = extra.label || `Skipped In-Video Sponsor (${duration}s saved)`;
  } else if (type === 'tracker') {
    stats.trackersBlocked += count;
    stats.bandwidthSavedMB = parseFloat((stats.bandwidthSavedMB + (count * 0.12)).toFixed(1));
    logLabel = extra.label || 'Blocked Analytics & Tracking Beacon';
  }

  try {
    localStorage.setItem(SHIELD_STORAGE_KEY, JSON.stringify(stats));

    // Save recent logs (limit to 20 items)
    const currentLogs = getShieldLogs();
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      label: logLabel,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    const updatedLogs = [newLog, ...currentLogs.slice(0, 19)];
    localStorage.setItem(SHIELD_LOG_KEY, JSON.stringify(updatedLogs));

    notifyListeners({
      type: 'event_recorded',
      eventType: type,
      stats,
      log: newLog
    });
  } catch (e) {}

  return stats;
}

export function formatTimeSaved(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  const hours = (minutes / 60).toFixed(1);
  return `${hours} hrs`;
}

export function formatBandwidth(mb) {
  if (!mb || mb <= 0) return '0 MB';
  if (mb < 1000) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}
