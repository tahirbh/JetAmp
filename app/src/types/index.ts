export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  url: string;
  cover?: string;
  path?: string;
  isOnline?: boolean;
  source?: 'local' | 'deezer' | 'spotify' | 'youtube' | 'audius' | 'itunes' | 'network' | 'jamendo';
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  picture?: {
    data: Uint8Array;
    format: string;
  };
}

export type RepeatMode = 'none' | 'one' | 'all';

export interface VisualizerConfig {
  barCount: number;
  smoothing: number;
}
