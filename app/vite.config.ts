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
      name: 'yt-search-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/yt-search')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const query = url.searchParams.get('q');
            
            if (!query) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing query' }));
              return;
            }

            const term = encodeURIComponent(query);

            console.log(`\n--- YouTube Search (Direct Scrape): "${query}" ---`);

            try {
              // 1. Fetch the raw YouTube results page
              const ytUrl = `https://www.youtube.com/results?search_query=${term}&sp=EgIQAQ%253D%253D`; // EgIQAQ%3D%3D = Video filter
              const response = await fetch(ytUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                  'Accept-Language': 'en-US,en;q=0.9',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
                },
                signal: AbortSignal.timeout(6000)
              });

              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const html = await response.text();

              // 2. Extract ytInitialData using regex
              const dataRegex = /var ytInitialData = ({.*?});<\/script>/s;
              const match = html.match(dataRegex);
              
              if (!match) {
                // Fallback regex if variable name changed
                const altMatch = html.match(/>window\["ytInitialData"\] = ({.*?});<\/script>/s);
                if (!altMatch) throw new Error('Could not find ytInitialData in HTML');
                var ytData = JSON.parse(altMatch[1]);
              } else {
                var ytData = JSON.parse(match[1]);
              }

              // 3. Drill down into the search results
              // Path: contents -> twoColumnSearchResultsRenderer -> primaryContents -> sectionListRenderer -> contents
              const sectionList = ytData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
              if (!sectionList) throw new Error('Unexpected JSON structure');

              // Find the itemSectionRenderer that contains the videos
              const itemSection = sectionList.find((s: any) => s.itemSectionRenderer)?.itemSectionRenderer?.contents;
              if (!itemSection) throw new Error('No video section found');

              const tracks = itemSection
                .map((item: any) => {
                  const video = item.videoRenderer;
                  if (!video) return null;

                  const videoId = video.videoId;
                  if (!videoId) return null;

                  return {
                    id: videoId,
                    title: video.title?.runs?.[0]?.text || 'Untitled Video',
                    artist: video.ownerText?.runs?.[0]?.text || 'YouTube',
                    album: 'YouTube',
                    duration: video.lengthText?.simpleText || '0:00',
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    path: videoId,
                    cover: video.thumbnail?.thumbnails?.sort((a: any, b: any) => b.width - a.width)[0]?.url || 
                           `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    isOnline: true,
                    source: 'youtube'
                  };
                })
                .filter(Boolean);

              if (tracks.length === 0) throw new Error('No video results parsed from scraper');

              console.log(`Success! Found ${tracks.length} videos directly from YouTube.`);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(tracks));
              return;

            } catch (err: any) {
              console.log(`Scraper failed: ${err.message}. Falling back to proxies.`);
              
              const allInstances = [
                `https://pipedapi.leptons.xyz/search?q=${term}&filter=videos`,
                `https://invidious.projectsegfau.lt/api/v1/search?q=${term}&type=video`,
                `https://pipedapi.lunar.icu/search?q=${term}&filter=videos`,
                `https://invidious.privacydev.net/api/v1/search?q=${term}&type=video`,
              ];

              let success = false;
              for (const searchUrl of allInstances) {
                try {
                  const response = await fetch(searchUrl, { 
                    signal: AbortSignal.timeout(4000),
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                  });
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
                    success = true;
                    break;
                  }
                } catch (e) { continue; }
              }

              if (!success) {
                console.log(`Total Failure. Returning fallback.`);
                const fallbackTrack = {
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
                };
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify([fallbackTrack]));
              }
            }
            return;
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
