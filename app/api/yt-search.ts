export const config = {
  runtime: 'edge',
};

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const YOUTUBE_INSTANCES = [
    'https://invidious.projectsegfau.lt',
    'https://iv.ggtyler.dev',
    'https://invidious.lunar.icu',
    'https://invidious.snopyta.org',
    'https://invidious.privacydev.net'
  ];

  const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://piped-api.lunar.icu',
    'https://api-piped.mha.fi'
  ];

  const term = encodeURIComponent(query);
  
  // LAYER 1: Invidious Proxy
  for (const instance of YOUTUBE_INSTANCES) {
    try {
      const response = await fetchWithTimeout(`${instance}/api/v1/search?q=${term}&type=video`);
      if (!response.ok) continue;
      
      const data = await response.json();
      if (!data || !Array.isArray(data) || data.length === 0) continue;

      const filtered = data
        .filter((item: any) => item.type === 'video')
        .map((video: any) => ({
          id: video.videoId,
          title: video.title,
          artist: video.author,
          album: 'YouTube',
          duration: video.lengthSeconds,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          cover: video.videoThumbnails?.find((t: any) => t.quality === 'high')?.url || video.videoThumbnails?.[0]?.url || '',
          isOnline: true,
          source: 'youtube'
        }));

      if (filtered.length > 0) {
        return new Response(JSON.stringify(filtered), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate'
          },
        });
      }
    } catch (e) {
      continue;
    }
  }

  // LAYER 2: Piped API Proxy
  for (const instance of PIPED_INSTANCES) {
    try {
      const response = await fetchWithTimeout(`${instance}/search?q=${term}&filter=videos`);
      if (!response.ok) continue;

      const data = await response.json();
      if (!data || !data.items || !Array.isArray(data.items) || data.items.length === 0) continue;

      const filtered = data.items
        .filter((item: any) => item.type === 'video')
        .map((video: any) => ({
          id: video.url.split('v=')[1] || video.url.split('/').pop(),
          title: video.title,
          artist: video.uploaderName,
          album: 'YouTube',
          duration: video.duration,
          url: `https://www.youtube.com/watch?v=${video.url.split('v=')[1] || video.url.split('/').pop()}`,
          cover: video.thumbnail,
          isOnline: true,
          source: 'youtube'
        }));

      if (filtered.length > 0) {
        return new Response(JSON.stringify(filtered), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate'
          },
        });
      }
    } catch (e) {
      continue;
    }
  }

  // LAYER 3: iTunes Backup (The "Safety Net")
  try {
    const response = await fetchWithTimeout(`https://itunes.apple.com/search?term=${term}&entity=song&limit=15`);
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const filtered = data.results.map((item: any) => ({
          id: `itunes-${item.trackId}`,
          title: item.trackName,
          artist: item.artistName,
          album: item.collectionName || 'YouTube (Match)',
          duration: Math.floor(item.trackTimeMillis / 1000),
          // Construct a search-redirect URL for YouTube
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artistName} ${item.trackName}`)}`,
          cover: item.artworkUrl100.replace('100x100bb', '600x600bb'),
          isOnline: true,
          source: 'youtube'
        }));

        return new Response(JSON.stringify(filtered), {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 's-maxage=86400'
          },
        });
      }
    }
  } catch (e) {}

  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
