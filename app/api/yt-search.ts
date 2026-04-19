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

  const term = encodeURIComponent(query);
  
  try {
    // 1. Fetch the raw YouTube results page (Video filter)
    const ytUrl = `https://www.youtube.com/results?search_query=${term}&sp=EgIQAQ%253D%253D`;
    const response = await fetchWithTimeout(ytUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      }
    }, 6000);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();

    // 2. Extract ytInitialData
    const dataRegex = /var ytInitialData = ({.*?});<\/script>/s;
    const match = html.match(dataRegex);
    let ytData;
    
    if (match) {
      ytData = JSON.parse(match[1]);
    } else {
      const altMatch = html.match(/>window\["ytInitialData"\] = ({.*?});<\/script>/s);
      if (!altMatch) throw new Error('Data segment not found');
      ytData = JSON.parse(altMatch[1]);
    }

    const sectionList = ytData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    const itemSection = sectionList?.find((s: any) => s.itemSectionRenderer)?.itemSectionRenderer?.contents;

    if (itemSection && itemSection.length > 0) {
      const filtered = itemSection
        .map((item: any) => {
          const video = item.videoRenderer;
          if (!video) return null;

          const videoId = video.videoId;
          return {
            id: videoId,
            title: video.title?.runs?.[0]?.text || 'Untitled Video',
            artist: video.ownerText?.runs?.[0]?.text || 'YouTube',
            album: 'YouTube',
            duration: video.lengthText?.simpleText || '0:00',
            url: `https://www.youtube.com/watch?v=${videoId}`,
            cover: video.thumbnail?.thumbnails?.sort((a: any, b: any) => b.width - a.width)[0]?.url || 
                   `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            isOnline: true,
            source: 'youtube'
          };
        })
        .filter(Boolean);

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
    }
    throw new Error('No items found in section');

  } catch (err: any) {
    console.error('Direct Scrape failed:', err.message);

    // LAYER 2: Highly stable Piped/Invidious Fallback
    const PROXIES = [
      `https://pipedapi.leptons.xyz/search?q=${term}&filter=videos`,
      `https://invidious.projectsegfau.lt/api/v1/search?q=${term}&type=video`,
    ];

    for (const proxyUrl of PROXIES) {
      try {
        const response = await fetchWithTimeout(proxyUrl, {}, 4000);
        if (!response.ok) continue;
        const json: any = await response.json();
        const items = json.items || (Array.isArray(json) ? json : []);
        const filtered = items.map((item: any) => ({
          id: item.videoId || item.id,
          title: item.title,
          artist: item.uploaderName || item.author || 'YouTube',
          album: 'YouTube',
          duration: item.duration || 0,
          url: `https://www.youtube.com/watch?v=${item.videoId || item.id}`,
          cover: item.thumbnail || `https://img.youtube.com/vi/${item.videoId || item.id}/hqdefault.jpg`,
          isOnline: true,
          source: 'youtube'
        })).filter((t: any) => t.id);

        if (filtered.length > 0) {
          return new Response(JSON.stringify(filtered), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          });
        }
      } catch (e) { continue; }
    }

    // FINAL FALLBACK: Direct Search Card
    const fallbackTrack = {
      id: `yt-search:${term}`,
      title: `Search YouTube: "${query}"`,
      artist: 'YouTube',
      album: 'Direct Search Fallback',
      duration: 0,
      url: `https://www.youtube.com/results?search_query=${term}`,
      cover: 'https://www.youtube.com/img/desktop/yt_1200.png',
      isOnline: true,
      source: 'youtube'
    };
    
    return new Response(JSON.stringify([fallbackTrack]), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
