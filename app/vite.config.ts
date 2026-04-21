import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    inspectAttr(), 
    react(),
    {
      name: 'api-proxy-plugin',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const url = req.url ? new URL(req.url, `http://${req.headers.host}`) : null;
          
          if (url && url.pathname.startsWith('/api/yt-search')) {
            const query = url.searchParams.get('q');
            if (!query) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing query' }));
              return;
            }

            const term = encodeURIComponent(query);
            console.log(`\n--- YouTube Search: "${query}" ---`);

            try {
              const ytUrl = `https://www.youtube.com/results?search_query=${term}&sp=EgIQAQ%253D%253D`;
              const response = await fetch(ytUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Accept': 'text/html',
                },
                signal: AbortSignal.timeout(6000)
              });

              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const html = await response.text();
              const dataRegex = /var ytInitialData = ({.*?});<\/script>/s;
              const match = html.match(dataRegex);
              
              let ytData;
              if (!match) {
                const altMatch = html.match(/>window\["ytInitialData"\] = ({.*?});<\/script>/s);
                if (!altMatch) throw new Error('Could not find ytInitialData');
                ytData = JSON.parse(altMatch[1]);
              } else {
                ytData = JSON.parse(match[1]);
              }

              const sectionList = ytData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
              const itemSection = sectionList?.find((s: any) => s.itemSectionRenderer)?.itemSectionRenderer?.contents;
              
              if (!itemSection) throw new Error('No video section found');

              const tracks = itemSection
                .map((item: any) => {
                  const video = item.videoRenderer;
                  if (!video) return null;
                  return {
                    id: video.videoId,
                    title: video.title?.runs?.[0]?.text || 'Untitled',
                    artist: video.ownerText?.runs?.[0]?.text || 'YouTube',
                    album: 'YouTube',
                    duration: video.lengthText?.simpleText || '0:00',
                    url: `https://www.youtube.com/watch?v=${video.videoId}`,
                    path: video.videoId,
                    cover: video.thumbnail?.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
                    isOnline: true,
                    source: 'youtube'
                  };
                })
                .filter(Boolean);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(tracks));
              return;

            } catch (err: any) {
              console.log(`Scraper failed: ${err.message}. Falling back to proxies.`);
              const allInstances = [
                `https://pipedapi.leptons.xyz/search?q=${term}&filter=videos`,
                `https://invidious.projectsegfau.lt/api/v1/search?q=${term}&type=video`,
              ];

              for (const searchUrl of allInstances) {
                try {
                  const response = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
                  if (!response.ok) continue;
                  const json: any = await response.json();
                  const items = json.items || (Array.isArray(json) ? json : []);
                  const tracks = items.map((item: any) => ({
                    id: item.videoId || item.id,
                    title: item.title,
                    artist: item.uploaderName || item.author || 'YouTube',
                    album: 'YouTube',
                    duration: item.duration || 0,
                    url: `https://www.youtube.com/watch?v=${item.videoId || item.id}`,
                    path: item.videoId || item.id,
                    cover: item.thumbnail || `https://img.youtube.com/vi/${item.videoId || item.id}/hqdefault.jpg`,
                    isOnline: true,
                    source: 'youtube'
                  })).filter((t: any) => t.id);

                  if (tracks.length > 0) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(tracks));
                    return;
                  }
                } catch (e) { continue; }
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify([{
                id: `yt-search:${term}`,
                title: `Search YouTube: "${query}"`,
                artist: 'YouTube',
                album: 'Direct Search Fallback',
                duration: 0,
                url: `https://www.youtube.com/results?search_query=${term}`,
                path: `yt-search:${term}`,
                cover: 'https://www.youtube.com/img/desktop/yt_1200.png',
                isOnline: true,
                source: 'youtube'
              }]));
              return;
            }
          }

          if (url && url.pathname.startsWith('/api/deezer-proxy')) {
            const targetUrl = url.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing target url' }));
              return;
            }

            console.log(`\n--- Proxying Deezer: ${targetUrl} ---`);
            try {
              const response = await fetch(targetUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
                signal: AbortSignal.timeout(5000)
              });
              if (!response.ok) throw new Error(`Deezer API returned ${response.status}`);
              const data = await response.json();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return;
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }

          if (url && url.pathname.startsWith('/api/itunes-proxy')) {
            const targetUrl = url.searchParams.get('url');
            if (!targetUrl) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing target url' }));
              return;
            }

            console.log(`\n--- Proxying iTunes: ${targetUrl} ---`);
            try {
              const response = await fetch(targetUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                signal: AbortSignal.timeout(5000)
              });
              if (!response.ok) throw new Error(`iTunes API returned ${response.status}`);
              const data = await response.json();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
              return;
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          }

          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
