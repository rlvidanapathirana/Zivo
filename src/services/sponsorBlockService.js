// SponsorBlock Service for automatic detection & skipping of sponsors, intros, and self-promotions

const SPONSORBLOCK_API = 'https://sponsor.ajay.app/api/skipSegments';

export async function getSponsorSegments(videoId) {
  if (!videoId) return [];
  
  const categories = JSON.stringify(['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview']);
  const url = `${SPONSORBLOCK_API}?videoID=${videoId}&categories=${encodeURIComponent(categories)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 404) return []; // No segments found for video
      throw new Error(`SponsorBlock status ${res.status}`);
    }

    const segments = await res.json();
    return Array.isArray(segments) ? segments.map(s => ({
      category: s.category,
      start: s.segment[0],
      end: s.segment[1],
      UUID: s.UUID
    })) : [];
  } catch (error) {
    // Graceful error fallback
    return [];
  }
}

export const CATEGORY_NAMES = {
  sponsor: 'Sponsor segment',
  selfpromo: 'Self promotion',
  interaction: 'Subscription reminder',
  intro: 'Intro / Animatic',
  outro: 'Outro / Credits',
  preview: 'Recap / Preview'
};
