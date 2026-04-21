import { generateId } from './utils';
import type { Track } from '@/types';

export interface Album {
  id: string;
  title: string;
  artist: string;
  cover: string;
  source: 'audius' | 'itunes' | 'youtube' | 'jamendo' | 'deezer';
  year?: string;
}

const JAMENDO_CLIENT_ID = '50de9141';

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
  },

  /**
   * Search for high-quality MP3 Albums using iTunes Search API (CORS friendly metadata)
   */
  searchMP3Albums: async (query: string): Promise<Album[]> => {
    if (!query || query.length < 2) return [];

    try {
      const term = encodeURIComponent(query);
      const targetUrl = encodeURIComponent(`https://itunes.apple.com/search?term=${term}&entity=album&limit=20`);
      const response = await fetch(`/api/itunes-proxy?url=${targetUrl}`);
      const data = await response.json();
      
      return (data.results || []).map((album: any) => ({
        id: album.collectionId.toString(),
        title: album.collectionName,
        artist: album.artistName,
        cover: album.artworkUrl100.replace('100x100', '600x600'),
        source: 'itunes',
        year: album.releaseDate?.split('-')[0]
      }));
    } catch (e) {
      console.error('MP3 Album search failed:', e);
      return [];
    }
  },

  /**
   * Get tracklist for an iTunes album and resolve to playable YouTube/Audius streams
   */
  getMP3AlbumTracks: async (album: Album): Promise<Track[]> => {
    try {
      const targetUrl = encodeURIComponent(`https://itunes.apple.com/lookup?id=${album.id}&entity=song`);
      const response = await fetch(`/api/itunes-proxy?url=${targetUrl}`);
      const data = await response.json();
      
      // First item is the album, rest are songs
      const songs = (data.results || []).filter((item: any) => item.wrapperType === 'track');
      
      return songs.map((song: any) => ({
        id: generateId(),
        title: song.trackName,
        artist: song.artistName,
        album: album.title,
        duration: song.trackTimeMillis / 1000,
        // RESOLVE: We use a search hint for our player to resolve the actual stream
        url: `itunes-resolve:${song.artistName} - ${song.trackName}`, 
        previewUrl: song.previewUrl,
        cover: album.cover,
        isOnline: true,
        source: 'itunes' 
      }));
    } catch (e) {
      console.error('Failed to resolve MP3 album tracks:', e);
      return [];
    }
  },

  /**
   * Search for tracks on YouTube via our own serverless proxy (bypasses CORS)
   */
  searchYouTube: async (query: string): Promise<Track[]> => {
    try {
      const term = encodeURIComponent(query);
      const response = await fetch(`/api/yt-search?q=${term}`);
      
      if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
      
      const data = await response.json();
      return data;
    } catch (e: any) {
      console.error('YouTube Proxy Search failed:', e.message);
      return [];
    }
  },

  /**
   * Search tracks on Jamendo (Free MP3)
   */
  searchJamendoTracks: async (query: string): Promise<Track[]> => {
    try {
      const term = encodeURIComponent(query);
      // Using namesearch instead of search for better relevance on Jamendo
      const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&namesearch=${term}&limit=30&include=musicinfo&has_audio=true`);
      const data = await response.json();
      
      return (data.results || []).map((song: any) => ({
        id: generateId(),
        title: song.name,
        artist: song.artist_name,
        album: song.album_name || 'Jamendo Track',
        duration: song.duration,
        url: song.audio,
        cover: song.image || song.album_image || '',
        isOnline: true,
        source: 'jamendo'
      }));
    } catch (e) {
      console.error('Jamendo track search failed:', e);
      return [];
    }
  },

  /**
   * Search albums on Jamendo
   */
  searchJamendoAlbums: async (query: string): Promise<Album[]> => {
    try {
      const term = encodeURIComponent(query);
      const response = await fetch(`https://api.jamendo.com/v3.0/albums/?client_id=${JAMENDO_CLIENT_ID}&format=json&namesearch=${term}&limit=20`);
      const data = await response.json();
      
      return (data.results || []).map((album: any) => ({
        id: album.id,
        title: album.name,
        artist: album.artist_name,
        cover: album.image || '',
        source: 'jamendo',
        year: album.releasedate?.split('-')[0]
      }));
    } catch (e) {
      console.error('Jamendo album search failed:', e);
      return [];
    }
  },

  /**
   * Get tracks for a Jamendo album
   */
  getJamendoAlbumTracks: async (albumId: string, albumTitle: string): Promise<Track[]> => {
    try {
      const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&album_id=${albumId}`);
      const data = await response.json();
      
      return (data.results || []).map((song: any) => ({
        id: generateId(),
        title: song.name,
        artist: song.artist_name,
        album: albumTitle,
        duration: song.duration,
        url: song.audio,
        cover: song.image || song.album_image || '',
        isOnline: true,
        source: 'jamendo'
      }));
    } catch (e) {
      console.error('Failed to fetch Jamendo album tracks:', e);
      return [];
    }
  },

  /**
   * Search tracks on Deezer (30s Previews)
   */
  searchDeezerTracks: async (query: string): Promise<Track[]> => {
    try {
      const term = encodeURIComponent(query);
      const targetUrl = encodeURIComponent(`https://api.deezer.com/search?q=${term}&limit=20`);
      const response = await fetch(`/api/deezer-proxy?url=${targetUrl}`);
      const data = await response.json();
      
      return (data.data || []).map((song: any) => ({
        id: generateId(),
        title: song.title,
        artist: song.artist.name,
        album: song.album.title,
        duration: song.duration,
        // RESOLVE: Use a hint to find full track
        url: `deezer-resolve:${song.artist.name} - ${song.title}`,
        previewUrl: song.preview,
        cover: song.album.cover_big || song.album.cover_medium || '',
        isOnline: true,
        source: 'deezer'
      }));
    } catch (e) {
      console.error('Deezer track search failed:', e);
      return [];
    }
  },

  /**
   * Search albums on Deezer
   */
  searchDeezerAlbums: async (query: string): Promise<Album[]> => {
    try {
      const term = encodeURIComponent(query);
      const targetUrl = encodeURIComponent(`https://api.deezer.com/search/album?q=${term}&limit=15`);
      const response = await fetch(`/api/deezer-proxy?url=${targetUrl}`);
      const data = await response.json();
      
      return (data.data || []).map((album: any) => ({
        id: album.id.toString(),
        title: album.title,
        artist: album.artist.name,
        cover: album.cover_big || album.cover_medium || '',
        source: 'deezer'
      }));
    } catch (e) {
      console.error('Deezer album search failed:', e);
      return [];
    }
  },

  /**
   * Get tracks for a Deezer album
   */
  getDeezerAlbumTracks: async (albumId: string, albumTitle: string): Promise<Track[]> => {
    try {
      const targetUrl = encodeURIComponent(`https://api.deezer.com/album/${albumId}`);
      const response = await fetch(`/api/deezer-proxy?url=${targetUrl}`);
      const data = await response.json();
      
      return (data.tracks?.data || []).map((song: any) => ({
        id: generateId(),
        title: song.title,
        artist: song.artist.name,
        album: song.albumTitle || albumTitle,
        duration: song.duration,
        // RESOLVE: Use a hint to find full track
        url: `deezer-resolve:${song.artist.name} - ${song.title}`,
        previewUrl: song.preview,
        cover: data.cover_big || data.cover_medium || '',
        isOnline: true,
        source: 'deezer'
      }));
    } catch (e) {
      console.error('Failed to fetch Deezer album tracks:', e);
      return [];
    }
  }
};
