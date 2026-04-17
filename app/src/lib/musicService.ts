import { generateId } from './utils';
import type { Track } from '@/types';

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  source: 'itunes' | 'deezer';
}

export const MusicService = {
  /**
   * Search for albums using iTunes and Deezer APIs
   */
  searchAlbums: async (query: string): Promise<Album[]> => {
    if (!query || query.length < 2) return [];

    try {
      const term = encodeURIComponent(query);
      
      // iTunes Search API (Albums)
      const itunesResponse = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=10`);
      const itunesData = await itunesResponse.json();
      
      const itunesAlbums: Album[] = (itunesData.results || []).map((album: any) => ({
        id: album.collectionId.toString(),
        title: album.collectionName,
        artist: album.artistName,
        cover: album.artworkUrl100.replace('100x100bb', '600x600bb'),
        source: 'itunes'
      }));

      // Deezer Search API (Albums)
      // Note: Deezer often requires a proxy due to CORS, but their search sometimes works directly or via specific headers
      // For this implementation, we'll focus on iTunes as it's the most reliable without a custom proxy.
      
      return itunesAlbums;
    } catch (e) {
      console.error('Album search failed:', e);
      return [];
    }
  },

  /**
   * Get tracklist for a specific album from iTunes
   */
  getAlbumTracks: async (albumId: string): Promise<Track[]> => {
    try {
      // iTunes Lookup API
      const response = await fetch(`https://itunes.apple.com/lookup?id=${albumId}&entity=song`);
      const data = await response.json();
      
      // First result is the album, subsequent are the songs
      const songs = data.results.slice(1);
      
      return songs.map((song: any) => ({
        id: generateId(), // Track instance ID
        title: song.trackName,
        artist: song.artistName,
        album: song.collectionName,
        duration: song.trackTimeMillis / 1000,
        url: song.previewUrl, // 30s preview URL
        cover: song.artworkUrl100.replace('100x100bb', '600x600bb'),
        isOnline: true,
        source: 'itunes'
      }));
    } catch (e) {
      console.error('Failed to fetch album tracks:', e);
      return [];
    }
  },

  /**
   * Universal search for tracks (top results)
   */
  searchTracks: async (query: string): Promise<Track[]> => {
    try {
      const term = encodeURIComponent(query);
      const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=30`);
      const data = await response.json();
      
      return (data.results || []).map((song: any) => ({
        id: generateId(),
        title: song.trackName,
        artist: song.artistName,
        album: song.collectionName,
        duration: song.trackTimeMillis / 1000,
        url: song.previewUrl,
        cover: song.artworkUrl100.replace('100x100bb', '600x600bb'),
        isOnline: true,
        source: 'itunes'
      }));
    } catch (e) {
      console.error('Track search failed:', e);
      return [];
    }
  }
};
