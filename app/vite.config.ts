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
            const instances = [
              `https://pipedapi.kavin.rocks/search?q=${term}&filter=videos`,
              `https://piped-api.lunar.icu/search?q=${term}&filter=videos`,
              `https://api.piped.privacydev.net/search?q=${term}&filter=videos`,
              `https://pipedapi.nosecrecy.moe/search?q=${term}&filter=videos`,
              `https://invidious.projectsegfau.lt/api/v1/search?q=${term}&type=video`,
              `https://iv.ggtyler.dev/api/v1/search?q=${term}&type=video`,
              `https://invidious.snopyta.org/api/v1/search?q=${term}&type=video`,
              `https://invidious.privacydev.net/api/v1/search?q=${term}&type=video`
            ];

            let success = false;
            for (const searchUrl of instances) {
              try {
                const response = await fetch(searchUrl, { signal: AbortSignal.timeout(3000) });
                if (!response.ok) continue;
                
                const json: any = await response.json();
                const items = json.items || (Array.isArray(json) ? json : []);
                
                if (items.length === 0) continue;

                const tracks = items
                  .filter((item: any) => item.type === 'video' || (!item.type && item.videoId))
                  .map((item: any) => {
                    const videoId = item.videoId || item.url?.split('v=')[1] || item.url?.split('/').pop();
                    return {
                      id: videoId,
                      title: item.title,
                      artist: item.uploaderName || item.author || 'YouTube',
                      album: 'YouTube',
                      duration: item.duration || item.lengthSeconds || 0,
                      url: `https://www.youtube.com/watch?v=${videoId}`,
                      cover: item.thumbnail || item.videoThumbnails?.[0]?.url || '',
                      isOnline: true,
                      source: 'youtube'
                    };
                  });
                
                if (tracks.length === 0) continue;

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(tracks));
                success = true;
                break;
              } catch (e) {
                continue;
              }
            }

            if (!success) {
              // FINAL FALLBACK: iTunes API (very stable)
              try {
                const itunesUrl = `https://itunes.apple.com/search?term=${term}&entity=song&limit=20`;
                const response = await fetch(itunesUrl);
                const data: any = await response.json();
                
                const tracks = (data.results || []).map((item: any) => ({
                  // Use iTunes' unique trackId to avoid duplicate key collisions
                  id: `yt-search-${item.trackId}:${encodeURIComponent(`${item.artistName} ${item.trackName}`)}`,
                  title: item.trackName,
                  artist: item.artistName,
                  album: item.collectionName || 'YouTube Match',
                  duration: Math.floor(item.trackTimeMillis / 1000),
                  url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artistName} ${item.trackName}`)}`,
                  cover: item.artworkUrl100.replace('100x100bb', '600x600bb'),
                  isOnline: true,
                  source: 'youtube'
                }));

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(tracks));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'All search proxies and fallbacks failed' }));
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
