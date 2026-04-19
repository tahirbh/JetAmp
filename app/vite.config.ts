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

            // --- Piped instances (return { items: [...] } with type:'video') ---
            const pipedInstances = [
              `https://pipedapi.kavin.rocks/search?q=${term}&filter=videos`,
              `https://piped-api.lunar.icu/search?q=${term}&filter=videos`,
              `https://api.piped.privacydev.net/search?q=${term}&filter=videos`,
              `https://piped.smnz.de/search?q=${term}&filter=videos`,
              `https://pipedapi.nosecandy.com/search?q=${term}&filter=videos`,
              `https://pipedapi.leptons.xyz/search?q=${term}&filter=videos`,
              `https://piped-api.privacy.com.de/search?q=${term}&filter=videos`,
            ];

            // --- Invidious instances (return plain array with videoId) ---
            const invidiousInstances = [
              `https://invidious.io.lol/api/v1/search?q=${term}&type=video`,
              `https://yt.artemislena.eu/api/v1/search?q=${term}&type=video`,
              `https://invidious.fdn.fr/api/v1/search?q=${term}&type=video`,
              `https://invidious.projectsegfau.lt/api/v1/search?q=${term}&type=video`,
              `https://iv.ggtyler.dev/api/v1/search?q=${term}&type=video`,
              `https://invidious.privacydev.net/api/v1/search?q=${term}&type=video`,
            ];

            const allInstances = [...pipedInstances, ...invidiousInstances];

            let success = false;
            for (const searchUrl of allInstances) {
              try {
                const response = await fetch(searchUrl, { signal: AbortSignal.timeout(4000) });
                if (!response.ok) continue;
                
                const json: any = await response.json();
                const items = json.items || (Array.isArray(json) ? json : []);
                
                if (items.length === 0) continue;

                const tracks = items
                  .filter((item: any) => item.type === 'video' || (!item.type && item.videoId))
                  .map((item: any) => {
                    const videoId = item.videoId || item.url?.split('v=')[1] || item.url?.split('/').pop();
                    if (!videoId) return null;
                    return {
                      id: videoId,
                      title: item.title,
                      artist: item.uploaderName || item.author || 'YouTube',
                      album: 'YouTube',
                      duration: item.duration || item.lengthSeconds || 0,
                      url: `https://www.youtube.com/watch?v=${videoId}`,
                      path: videoId,
                      cover: item.thumbnail || item.videoThumbnails?.[0]?.url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                      isOnline: true,
                      source: 'youtube'
                    };
                  })
                  .filter(Boolean);
                
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
              // FINAL FALLBACK: Return a single YouTube-search track using the
              // user's ORIGINAL query. YouTubePlayer handles 'yt-search:*' ids
              // via listType:'search' — searches YouTube directly, no iTunes mismatch.
              const fallbackTrack = {
                id: `yt-search:${term}`,
                title: `"${query}" — YouTube Search`,
                artist: 'YouTube',
                album: 'YouTube Search',
                duration: 0,
                url: `https://www.youtube.com/results?search_query=${term}`,
                path: `yt-search:${term}`,
                cover: '',
                isOnline: true,
                source: 'youtube'
              };
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify([fallbackTrack]));
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
