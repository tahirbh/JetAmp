import { useState } from 'react';
import { Folder, Music, Trash2, Plus, List } from 'lucide-react';
import type { Track } from '@/types';

interface PlaylistProps {
  tracks: Track[];
  currentTrack: Track | null;
  onSelectTrack: (track: Track) => void;
  onRemoveTrack: (trackId: string) => void;
  onAddTracks: () => void;
}

export function Playlist({ 
  tracks, 
  currentTrack, 
  onSelectTrack, 
  onRemoveTrack,
  onAddTracks 
}: PlaylistProps) {
  const [activeTab, setActiveTab] = useState<'playlist' | 'files'>('playlist');

  return (
    <div className="flex flex-col h-full bg-[var(--ja-bg-panel)] panel-border rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--ja-bg-dark)]">
        <button
          onClick={() => setActiveTab('playlist')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-colors ${
            activeTab === 'playlist' 
              ? 'bg-[var(--ja-accent-blue)] text-white' 
              : 'text-gray-400 hover:text-white hover:bg-[var(--ja-metal-dark)]'
          }`}
        >
          <List size={14} />
          Playlist
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-colors ${
            activeTab === 'files' 
              ? 'bg-[var(--ja-accent-blue)] text-white' 
              : 'text-gray-400 hover:text-white hover:bg-[var(--ja-metal-dark)]'
          }`}
        >
          <Folder size={14} />
          Files
        </button>
        <div className="flex-1" />
        <button
          onClick={onAddTracks}
          className="flex items-center gap-1 px-2 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'playlist' ? (
          <div className="divide-y divide-[var(--ja-bg-dark)]">
            {tracks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Music size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tracks in playlist</p>
                <p className="text-xs mt-1">Click "Add" to load MP3 files</p>
              </div>
            ) : (
              tracks.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track)}
                  className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-[var(--ja-metal-dark)] transition-colors ${
                    currentTrack?.id === track.id ? 'bg-[var(--ja-accent-blue)]/20' : ''
                  }`}
                >
                  <span className="text-[10px] text-gray-500 w-6 text-center">
                    {index + 1}
                  </span>
                  <Music size={14} className="text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm truncate ${
                      currentTrack?.id === track.id ? 'text-[var(--ja-accent-cyan)]' : 'text-gray-300'
                    }`}>
                      {track.title}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {track.artist}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">
                    {formatDuration(track.duration)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTrack(track.id);
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <Folder size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">File Browser</p>
            <p className="text-xs mt-1">Select files to add to playlist</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-2 bg-[var(--ja-bg-dark)] text-[10px] text-gray-500">
        <span>{tracks.length} tracks</span>
        <span>{formatTotalDuration(tracks)}</span>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTotalDuration(tracks: Track[]): string {
  const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const mins = Math.floor(total / 60);
  const hours = Math.floor(mins / 60);
  if (hours > 0) {
    return `${hours}h ${mins % 60}m`;
  }
  return `${mins}m`;
}
