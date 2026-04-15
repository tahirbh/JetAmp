import { useState } from 'react';
import { Music, Trash2, Search, Disc } from 'lucide-react';
import type { Track } from '@/types';

interface CarPlaylistProps {
  tracks: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
  onRemoveTrack: (trackId: string) => void;
}

export function CarPlaylist({ 
  tracks, 
  currentTrack, 
  onSelectTrack, 
  onRemoveTrack 
}: CarPlaylistProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'artist' | 'album'>('all');

  const filteredTracks = tracks.filter(track => {
    const query = searchQuery.toLowerCase();
    if (filter === 'artist') {
      return track.artist?.toLowerCase().includes(query);
    } else if (filter === 'album') {
      return track.album?.toLowerCase().includes(query);
    }
    return (
      track.title?.toLowerCase().includes(query) ||
      track.artist?.toLowerCase().includes(query) ||
      track.album?.toLowerCase().includes(query)
    );
  });

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full glass-panel">


      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <Music className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-sm">No tracks found</p>
            <p className="text-xs">Select a music folder to add tracks</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--metal-dark)]/50">
            {filteredTracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className={`
                    flex items-center gap-3 p-3 cursor-pointer
                    transition-all duration-200
                    ${isCurrent 
                      ? 'bg-[var(--glow-cyan)]/10 border-l-4 border-[var(--glow-cyan)]' 
                      : 'hover:bg-[var(--metal-dark)]/30 border-l-4 border-transparent'
                    }
                  `}
                >
                  {/* Track Number / Playing Indicator */}
                  <div className="w-6 flex-shrink-0 text-center">
                    {isCurrent ? (
                      <div className="flex items-end justify-center gap-0.5 h-4">
                        <div className="w-1 bg-[var(--glow-green)] animate-pulse" style={{ height: '60%' }} />
                        <div className="w-1 bg-[var(--glow-green)] animate-pulse" style={{ height: '100%', animationDelay: '0.1s' }} />
                        <div className="w-1 bg-[var(--glow-green)] animate-pulse" style={{ height: '40%', animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 font-mono">{index + 1}</span>
                    )}
                  </div>

                  {/* Cover Thumbnail */}
                  <div className="w-10 h-10 flex-shrink-0 rounded bg-[var(--bg-dark)] flex items-center justify-center overflow-hidden">
                    {track.cover ? (
                      <img 
                        src={track.cover} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Music className="w-5 h-5 text-gray-600" />
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      isCurrent ? 'glow-text-cyan' : 'text-white'
                    }`}>
                      {track.title || 'Unknown Track'}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {track.artist || 'Unknown Artist'}
                      {track.album && ` • ${track.album}`}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-xs text-gray-500 font-mono">
                    {formatDuration(track.duration)}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTrack(track.id);
                    }}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
