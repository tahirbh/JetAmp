
import { generateId } from './utils';
import type { Track } from '@/types';
import { AuthService } from './authService';

export interface YouTubePlaylist {
  id: string;
  title: string;
  thumbnails: { 
    default: { url: string },
    medium?: { url: string },
    high?: { url: string }
  };
  itemCount: number;
}

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const YouTubeService = {
  fetchMyPlaylists: async (): Promise<YouTubePlaylist[]> => {
    const user = AuthService.getUser();
    if (!user || !user.token) return [];

    try {
      const response = await fetch(`${BASE_URL}/playlists?part=snippet,contentDetails&mine=true&maxResults=20`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      
      return (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        thumbnails: item.snippet.thumbnails,
        itemCount: item.contentDetails.itemCount
      }));
    } catch (e) {
      console.error('Failed to fetch YouTube playlists:', e);
      return [];
    }
  },

  fetchPlaylistTracks: async (playlistId: string): Promise<Track[]> => {
    const user = AuthService.getUser();
    if (!user || !user.token) return [];

    try {
      const response = await fetch(`${BASE_URL}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      
      return (data.items || []).map((item: any) => ({
        id: generateId(),
        title: item.snippet.title,
        artist: item.snippet.videoOwnerChannelTitle || 'YouTube Music',
        album: item.snippet.title,
        duration: 0, // YouTube Data API doesn't give duration in playlistItems easily
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        path: item.snippet.resourceId.videoId, // Use videoId as path for player
        cover: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
        isOnline: true,
        source: 'youtube'
      }));
    } catch (e) {
      console.error('Failed to fetch YouTube tracks:', e);
      return [];
    }
  },

  searchTracks: async (query: string, type: 'music' | 'video' = 'music'): Promise<Track[]> => {
    const user = AuthService.getUser();
    if (!user || !user.token) {
      console.warn('YouTube search requested without token');
      return [];
    }

    try {
      const categoryFilter = type === 'music' ? '&videoCategoryId=10' : '';
      const response = await fetch(`${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video${categoryFilter}&maxResults=30`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (response.status === 401) {
        console.error('YouTube API: 401 Unauthorized - Session expired');
        AuthService.logout(); // Clear expired token
        throw new Error('AUTH_EXPIRED');
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('YouTube API Error:', data.error);
        if (data.error.code === 403) throw new Error('QUOTA_EXCEEDED');
        throw new Error(data.error.message || 'SEARCH_FAILED');
      }

      return (data.items || []).map((item: any) => ({
        id: generateId(),
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        album: type === 'music' ? 'YouTube Music' : 'YouTube Video',
        duration: 0,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        path: item.id.videoId,
        cover: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
        isOnline: true,
        source: 'youtube'
      }));
    } catch (e: any) {
      if (e.message === 'AUTH_EXPIRED' || e.message === 'QUOTA_EXCEEDED') throw e;
      console.error('YouTube search failed:', e);
      return [];
    }
  }

};
