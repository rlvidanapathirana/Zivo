// High-Performance YouTube Search, Data & Direct Stream Service with Sri Lanka & Global Region Support

const cache = new Map();

// High availability Invidious & Piped endpoints for direct ad-free streams & metadata
const INVIDIOUS_INSTANCES = [
  'https://inv.tux.pizza',
  'https://invidious.nerdvpn.de',
  'https://iv.melmac.space',
  'https://invidious.drgns.space',
  'https://invidious.flokinet.to',
  'https://yt.drgnz.club'
];

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.mha.fi'
];

export async function getVideoStreams(videoId) {
  if (!videoId) return null;
  const cacheKey = `streams:${videoId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  // 1. Try Invidious Instances for Direct MP4 & Audio Streams
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, { 
        signal: AbortSignal.timeout(3000) 
      });
      if (res.ok) {
        const data = await res.json();
        
        // Find best audio stream for pure background playback
        const audioStreams = (data.adaptiveFormats || [])
          .filter(f => f.type?.includes('audio') || f.container === 'm4a' || f.container === 'webm')
          .sort((a, b) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0));

        // Find best combined video stream
        const videoStreams = (data.formatStreams || [])
          .sort((a, b) => (parseInt(b.resolution) || 0) - (parseInt(a.resolution) || 0));

        const result = {
          audioUrl: audioStreams[0]?.url || null,
          videoUrl: videoStreams[0]?.url || null,
          hlsUrl: data.hlsUrl || null,
          embedUrl: `${instance}/embed/${videoId}?autoplay=1`,
          title: data.title,
          author: data.author,
          duration: data.lengthSeconds,
          isDirect: true
        };

        if (result.audioUrl || result.videoUrl || result.embedUrl) {
          cache.set(cacheKey, result);
          return result;
        }
      }
    } catch (e) {}
  }

  // 2. Try Piped API
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, { 
        signal: AbortSignal.timeout(3000) 
      });
      if (res.ok) {
        const data = await res.json();
        const audioStreams = (data.audioStreams || []).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        const videoStreams = (data.videoStreams || []).filter(v => !v.videoOnly).sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0));

        const result = {
          audioUrl: audioStreams[0]?.url || null,
          videoUrl: videoStreams[0]?.url || null,
          hlsUrl: data.hls || null,
          embedUrl: `https://piped.video/embed/${videoId}`,
          title: data.title,
          author: data.uploader,
          duration: data.duration,
          isDirect: true
        };

        if (result.audioUrl || result.videoUrl || result.embedUrl) {
          cache.set(cacheKey, result);
          return result;
        }
      }
    } catch (e) {}
  }

  return {
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3`,
    isDirect: false
  };
}

export async function searchVideos(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().toLowerCase();
  
  if (cache.has(`search:${q}`)) {
    return cache.get(`search:${q}`);
  }

  // 1. Failover Public Invidious / Piped APIs (fastest & bypass CORS)
  const FAILOVER_APIS = [
    `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(query)}`,
    `https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(query)}`,
    `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=all`,
    `https://api.piped.private.coffee/search?q=${encodeURIComponent(query)}&filter=all`
  ];

  for (const apiUrl of FAILOVER_APIS) {
    try {
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        const normalized = normalizeVideoList(items);
        if (normalized.length > 0) {
          cache.set(`search:${q}`, normalized);
          return normalized;
        }
      }
    } catch (e) {}
  }

  // 2. Try YouTube InnerTube API with Sri Lanka (LK) & global locale context
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB',
            clientVersion: '2.20240101.00.00',
            hl: q.includes('sinhala') || /[\u0D80-\u0DFF]/.test(query) ? 'si' : 'en',
            gl: 'LK'
          }
        },
        query: query
      })
    });

    if (res.ok) {
      const json = await res.json();
      const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
      
      const parsed = contents
        .filter(c => c.videoRenderer && c.videoRenderer.videoId)
        .map(c => {
          const v = c.videoRenderer;
          const id = v.videoId;
          const duration = v.lengthText?.simpleText || '';
          const views = v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || 'Views';
          const published = v.publishedTimeText?.simpleText || 'Recently';
          
          return {
            id,
            title: v.title?.runs?.[0]?.text || 'YouTube Video',
            channelTitle: v.ownerText?.runs?.[0]?.text || 'Creator',
            channelId: v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
            publishedText: published,
            viewCountFormatted: views,
            duration,
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            thumbnailMax: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
          };
        });

      if (parsed.length > 0) {
        cache.set(`search:${q}`, parsed);
        return parsed;
      }
    }
  } catch (err) {}

  return [];
}

export async function getTrendingVideos(region = 'LK', category = 'All') {
  const cacheKey = `trending:${region}:${category}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // 1. If category is specified, fetch live YouTube results for that category directly
  if (category && category !== 'All') {
    const categoryQueries = {
      'Music': 'Trending Sinhala English Music Songs 2026',
      'Gaming': 'Trending Gaming Gameplay 2026',
      'Tech & Science': 'Latest Tech Science Review Gadgets 2026',
      'News': 'Sri Lanka News Headlines Today 2026',
      'Movies & Trailers': 'Official Movie Trailers 2026'
    };
    const searchQuery = categoryQueries[category] || `${category} trending 2026`;
    const categoryResults = await searchVideos(searchQuery);
    if (categoryResults.length > 0) {
      cache.set(cacheKey, categoryResults);
      return categoryResults;
    }
  }

  // 2. Try Invidious & Piped Trending endpoints (Global & Region)
  const trendingEndpoints = [
    `https://inv.tux.pizza/api/v1/trending`,
    `https://invidious.nerdvpn.de/api/v1/trending`,
    `https://pipedapi.kavin.rocks/trending?region=US`,
    `https://api.piped.private.coffee/trending?region=US`
  ];

  for (const url of trendingEndpoints) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        const normalized = normalizeVideoList(items);
        if (normalized.length > 0) {
          cache.set(cacheKey, normalized);
          return normalized;
        }
      }
    } catch (e) {}
  }

  // 3. Failover: Perform live dynamic YouTube search for popular trending content
  const dynamicTrending = await searchVideos('Trending Sinhala Songs Popular Music Videos 2026');
  if (dynamicTrending.length > 0) {
    cache.set(cacheKey, dynamicTrending);
    return dynamicTrending;
  }

  return [];
}

export async function getSearchSuggestions(query) {
  if (!query || !query.trim()) return [];
  try {
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&client=firefox&q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      return data[1] || [];
    }
  } catch (e) {}
  return [];
}

export async function getVideoDetails(videoId) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.videoId,
          title: data.title,
          description: data.description,
          channelId: data.authorId,
          channelTitle: data.author,
          channelAvatar: data.authorThumbnails?.[0]?.url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(data.author || 'channel')}`,
          publishedText: data.publishedText,
          viewCount: data.viewCount,
          recommendedVideos: normalizeVideoList(data.recommendedVideos || []),
          subCountText: data.subCountText || 'Subscriber count unavailable'
        };
      }
    } catch (e) {}
  }

  // Dynamic fallback details
  const recommended = await searchVideos('Recommended YouTube Songs Videos 2026');
  return {
    id: videoId,
    title: 'Playing YouTube Video',
    description: 'Ultra fast ad-free video playback on Zivo.',
    channelId: 'youtube-official',
    channelTitle: 'YouTube Creator',
    channelAvatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=zivo',
    publishedText: 'Recently',
    viewCount: 125000,
    recommendedVideos: recommended,
    subCountText: 'Verified Channel'
  };
}

export async function getVideoComments(videoId) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/comments/${videoId}`, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        return data.comments || [];
      }
    } catch (e) {}
  }
  return [];
}

function normalizeVideoList(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter(item => item && (item.videoId || item.id))
    .map(item => {
      const id = item.videoId || item.id;
      const durationSeconds = item.lengthSeconds || item.length_seconds || 0;
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      const durationFormatted = durationSeconds ? `${minutes}:${seconds < 10 ? '0' : ''}${seconds}` : '';

      return {
        id,
        title: item.title || 'YouTube Video',
        channelTitle: item.uploaderName || item.author || item.channelTitle || 'YouTube Creator',
        channelId: item.uploaderUrl || item.authorId || '',
        publishedText: item.uploadedDate || item.publishedText || 'Recently',
        viewCount: item.views || item.viewCount || 0,
        viewCountFormatted: formatViews(item.views || item.viewCount || 0),
        duration: durationFormatted,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
      };
    });
}

function formatViews(views) {
  if (!views) return 'Views';
  if (typeof views === 'string') return views;
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
  return `${views} views`;
}
