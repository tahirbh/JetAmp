import { generateId } from './utils';
import type { Track } from '@/types';

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  source: 'audius' | 'itunes' | 'deezer' | 'youtube';
}

export const MusicService = {
  /**
   * Search for playlists/albums using Audius API
   */
  searchAlbums: async (query: string): Promise<Album[]> => {
    if (!query || query.length < 2) return [];

    try {
      const term = encodeURIComponent(query);
      
      const response = await fetch(`https://discoveryprovider.audius.co/v1/playlists/search?query=${term}&app_name=JetAmp`);
      const data = await response.json();
      
      return (data.data || []).map((album: any) => ({
        id: album.id,
        title: album.playlist_name,
        artist: album.user?.name || 'Unknown',
        cover: album.artwork?.['480x480'] || album.artwork?.['150x150'] || '',
        source: 'audius'
      }));
    } catch (e) {
      console.error('Album search failed:', e);
      return [];
    }
  },

  /**
   * Get tracklist for a specific playlist/album from Audius
   */
  getAlbumTracks: async (albumId: string): Promise<Track[]> => {
    try {
      const response = await fetch(`https://discoveryprovider.audius.co/v1/playlists/${albumId}/tracks?app_name=JetAmp`);
      const data = await response.json();
      
      return (data.data || []).map((song: any) => ({
        id: generateId(), 
        title: song.title,
        artist: song.user?.name || 'Unknown Artist',
        album: 'Audius Collection',
        duration: song.duration,
        url: `https://discoveryprovider.audius.co/v1/tracks/${song.id}/stream?app_name=JetAmp`,
        cover: song.artwork?.['480x480'] || song.artwork?.['150x150'] || '',
        isOnline: true,
        source: 'audius'
      }));
    } catch (e) {
      console.error('Failed to fetch album tracks:', e);
      return [];
    }
  },

  /**
   * Universal search for tracks (top results) from Audius
   */
  searchTracks: async (query: string): Promise<Track[]> => {
    try {
      const term = encodeURIComponent(query);
      const response = await fetch(`https://discoveryprovider.audius.co/v1/tracks/search?query=${term}&app_name=JetAmp`);
      const data = await response.json();
      
      return (data.data || []).map((song: any) => ({
        id: generateId(),
        title: song.title,
        artist: song.user?.name || 'Unknown Artist',
        album: 'Audius Track',
        duration: song.duration,
        url: `https://discoveryprovider.audius.co/v1/tracks/${song.id}/stream?app_name=JetAmp`,
        cover: song.artwork?.['480x480'] || song.artwork?.['150x150'] || '',
        isOnline: true,
        source: 'audius'
      }));
    } catch (e) {
      console.error('Track search failed:', e);
      return [];
    }
  }
};
