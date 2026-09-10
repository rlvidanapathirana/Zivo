// User Library & Offline Persistence Service (Watch Later, History, Likes, Subscriptions)

const KEYS = {
  HISTORY: 'zivo_history',
  WATCH_LATER: 'zivo_watch_later',
  LIKES: 'zivo_liked_videos',
  SUBSCRIPTIONS: 'zivo_subscriptions'
};

function getItem(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function setItem(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {}
}

export function getHistory() {
  return getItem(KEYS.HISTORY);
}

export function addToHistory(video) {
  if (!video || !video.id) return;
  const history = getHistory().filter(v => v.id !== video.id);
  history.unshift({ ...video, watchedAt: new Date().toISOString() });
  setItem(KEYS.HISTORY, history.slice(0, 100)); // Keep last 100 videos
}

export function clearHistory() {
  setItem(KEYS.HISTORY, []);
}

export function getWatchLater() {
  return getItem(KEYS.WATCH_LATER);
}

export function toggleWatchLater(video) {
  if (!video || !video.id) return false;
  let items = getWatchLater();
  const exists = items.some(v => v.id === video.id);
  if (exists) {
    items = items.filter(v => v.id !== video.id);
  } else {
    items.unshift(video);
  }
  setItem(KEYS.WATCH_LATER, items);
  return !exists;
}

export function isInWatchLater(videoId) {
  return getWatchLater().some(v => v.id === videoId);
}

export function getLikedVideos() {
  return getItem(KEYS.LIKES);
}

export function toggleLikeVideo(video) {
  if (!video || !video.id) return false;
  let items = getLikedVideos();
  const exists = items.some(v => v.id === video.id);
  if (exists) {
    items = items.filter(v => v.id !== video.id);
  } else {
    items.unshift(video);
  }
  setItem(KEYS.LIKES, items);
  return !exists;
}

export function isVideoLiked(videoId) {
  return getLikedVideos().some(v => v.id === videoId);
}

export function getSubscriptions() {
  return getItem(KEYS.SUBSCRIPTIONS);
}

export function toggleSubscription(channel) {
  if (!channel || (!channel.channelId && !channel.id)) return false;
  const channelId = channel.channelId || channel.id;
  let subs = getSubscriptions();
  const exists = subs.some(s => (s.channelId || s.id) === channelId);
  if (exists) {
    subs = subs.filter(s => (s.channelId || s.id) !== channelId);
  } else {
    subs.unshift({
      channelId,
      channelTitle: channel.channelTitle || channel.author || 'Creator',
      channelAvatar: channel.channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(channelId)}`
    });
  }
  setItem(KEYS.SUBSCRIPTIONS, subs);
  return !exists;
}

export function isSubscribed(channelId) {
  return getSubscriptions().some(s => (s.channelId || s.id) === channelId);
}
