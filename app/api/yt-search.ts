export const config = {
  runtime: 'edge',
};

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
    'https://invidious.drgns.space',
    'https://invidious.privacydev.net'
  ];

  const term = encodeURIComponent(query);
  
  for (const instance of YOUTUBE_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/search?q=${term}&type=video`, {
        headers: {
          'User-Agent': 'JetAmp/1.0 (Mobile; VercelProxy)',
        },
      });

      if (!response.ok) continue;
      
      const data = await response.json();
      if (!data || !Array.isArray(data)) continue;

      // Filter and map to our internal format immediately on the server
      const filtered = data
        .filter((item: any) => item.type === 'video')
        .map((video: any) => ({
          id: video.videoId,
          title: video.title,
          artist: video.author,
          album: 'YouTube',
          duration: video.lengthSeconds,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          cover: video.videoThumbnails?.[0]?.url || '',
          isOnline: true,
          source: 'youtube'
        }));

      return new Response(JSON.stringify(filtered), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 's-maxage=3600, stale-while-revalidate'
        },
      });
    } catch (e) {
      console.error(`Backend search failed on ${instance}:`, e);
      continue;
    }
  }

  return new Response(JSON.stringify([]), {
    status: 200,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
  });
}
