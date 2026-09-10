// Brave Shield Engine & Telemetry Service

const SHIELD_STORAGE_KEY = 'zivo_brave_shield_stats';
const SHIELD_PREFS_KEY = 'zivo_brave_shield_prefs';

const DEFAULT_PREFS = {
  enabled: true,
  blockTrackers: true,
  autoSkipSponsors: true,
  httpsUpgrade: true,
  playbackMode: 'stream' // 'stream' (Pure direct stream) or 'embed' (Privacy Embed)
};

const DEFAULT_STATS = {
  adsBlocked: 142,
  sponsorsSkipped: 38,
  trackersBlocked: 89,
  bandwidthSavedMB: 64.5,
  timeSavedSec: 840
};

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

export function recordShieldEvent(type, count = 1, extra = {}) {
  const stats = getShieldStats();
  if (type === 'ad') {
    stats.adsBlocked += count;
    stats.bandwidthSavedMB += count * 0.45; // ~0.45 MB per blocked ad resource
  } else if (type === 'sponsor') {
    stats.sponsorsSkipped += count;
    const duration = extra.duration || 30; // default 30s
    stats.timeSavedSec += duration;
    stats.bandwidthSavedMB += (duration / 60) * 8.5; // ~8.5MB per minute saved video stream
  } else if (type === 'tracker') {
    stats.trackersBlocked += count;
  }
  
  try {
    localStorage.setItem(SHIELD_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {}
  return stats;
}

export function formatTimeSaved(seconds) {
  if (!seconds || seconds <= 0) return '0 seconds';
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = (minutes / 60).toFixed(1);
  return `${hours} hrs`;
}
