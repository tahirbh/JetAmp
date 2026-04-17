import { useState } from 'react';
import { Search, Loader2, Music, ExternalLink, Library } from 'lucide-react';
import { MusicService } from '@/lib/musicService';
import type { Album } from '@/lib/musicService';
import type { Track } from '@/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface DiscoveryHubProps {
  currentTrack: Track | null;
  onLoadAlbum: (tracks: Track[]) => void;
  onPlayTrack: (track: Track) => void;
}

export function DiscoveryHub({ currentTrack, onLoadAlbum, onPlayTrack }: DiscoveryHubProps) {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'album' | 'track'>('album');
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setSelectedAlbum(null);
    
    if (searchMode === 'album') {
      const results = await MusicService.searchAlbums(query);
      setAlbums(results);
      setTracks([]);
    } else {
      const results = await MusicService.searchTracks(query);
      setTracks(results);
      setAlbums([]);
    }
    setLoading(false);
  };

  const handleSelectAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setLoading(true);
    const tracks = await MusicService.getAlbumTracks(album.id);
    setAlbumTracks(tracks);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl border-l border-[var(--metal-dark)]/30 text-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <Search className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-blue-50">Content Hub</h2>
            <p className="text-xs text-blue-300/60 font-medium">Browse Global Music</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button 
            size="sm"
            variant={searchMode === 'album' ? 'default' : 'outline'}
            onClick={() => setSearchMode('album')}
            className={`flex-1 h-8 text-[10px] uppercase font-bold tracking-widest ${searchMode === 'album' ? 'bg-blue-600' : 'border-white/10 hover:bg-white/5'}`}
          >
            Albums
          </Button>
          <Button 
            size="sm"
            variant={searchMode === 'track' ? 'default' : 'outline'}
            onClick={() => setSearchMode('track')}
            className={`flex-1 h-8 text-[10px] uppercase font-bold tracking-widest ${searchMode === 'track' ? 'bg-blue-600' : 'border-white/10 hover:bg-white/5'}`}
          >
            Songs
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={searchMode === 'album' ? "Search artist or album..." : "Search song name..."}
              className="bg-black/40 border-white/10 text-white h-10 pl-10 focus:ring-blue-500/50"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 h-10 px-4 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          {!selectedAlbum ? (
            <>
              {searchMode === 'album' ? (
                // Album Grid
                albums.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {albums.map((album) => (
                      <div 
                        key={album.id}
                        onClick={() => handleSelectAlbum(album)}
                        className="group cursor-pointer space-y-2 hover:bg-white/5 p-2 rounded-xl transition-all border border-transparent hover:border-white/10"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg">
                          <img 
                            src={album.cover} 
                            alt={album.title}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Music className="w-8 h-8 text-white animate-pulse" />
                          </div>
                        </div>
                        <div className="px-1">
                          <h3 className="text-sm font-semibold truncate leading-tight group-hover:text-blue-200">{album.title}</h3>
                          <p className="text-xs text-white/40 truncate">{album.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <Library className="w-16 h-16 mb-4 stroke-[1]" />
                    <p className="text-sm">Search for an artist or album<br/>to start exploring.</p>
                  </div>
                )
              ) : (
                // Track List
                tracks.length > 0 ? (
                  <div className="space-y-1">
                    {tracks.map((track) => {
                      const isCurrent = currentTrack?.url === track.url || (currentTrack?.title === track.title && currentTrack?.artist === track.artist);
                      return (
                        <div 
                          key={track.id}
                          className={`flex items-center gap-3 p-2 rounded-lg transition-all group relative cursor-pointer border ${
                            isCurrent 
                              ? 'bg-blue-500/10 border-blue-500/30' 
                              : 'hover:bg-white/5 border-transparent hover:border-white/5'
                          }`}
                          onClick={() => onPlayTrack(track)}
                        >
                          <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded">
                            <img src={track.cover} className="w-full h-full object-cover" alt="" />
                            <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isCurrent ? 'bg-blue-500/40 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                              <Music className={`w-4 h-4 text-white ${isCurrent ? 'animate-bounce' : ''}`} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate ${isCurrent ? 'text-blue-400' : 'group-hover:text-blue-100'}`}>{track.title}</div>
                            <div className="text-[10px] text-white/40 truncate">{track.artist} • {track.album}</div>
                          </div>
                          <div className="flex items-center gap-2">
                             {track.duration > 0 && (
                               <span className="text-[10px] font-mono text-white/30">{Math.floor(track.duration / 60)}:{(track.duration % 60).toFixed(0).padStart(2, '0')}</span>
                             )}
                             <Button 
                              size="icon" 
                              variant="ghost" 
                              className={`w-8 h-8 ${isCurrent ? 'opacity-100 text-blue-400' : 'opacity-0 group-hover:opacity-100 text-white/40'} hover:text-blue-400`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onLoadAlbum([track]);
                              }}
                            >
                              <Library className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <Music className="w-16 h-16 mb-4 stroke-[1]" />
                    <p className="text-sm">Search for any song name<br/>to discover individual tracks.</p>
                  </div>
                )
              )}
            </>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              {/* Album Header */}
              <button 
                onClick={() => setSelectedAlbum(null)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2 bg-blue-500/10 px-2 py-1 rounded"
              >
                ← Back to Search
              </button>
              
              <div className="flex gap-4 items-end">
                <img src={selectedAlbum.cover} className="w-32 h-32 rounded-lg shadow-2xl border border-white/10" alt="" />
                <div className="flex-1 space-y-1">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-blue-500/50 text-blue-400">Album</Badge>
                  <h2 className="text-xl font-bold leading-tight line-clamp-2">{selectedAlbum.title}</h2>
                  <p className="text-sm text-white/60">{selectedAlbum.artist}</p>
                  <Button 
                    size="sm" 
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-xs h-8"
                    onClick={() => onLoadAlbum(albumTracks)}
                  >
                    Add All Tracks
                  </Button>
                </div>
              </div>

              {/* Tracks */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest px-2">Tracklist</h4>
                {albumTracks.map((track, idx) => {
                  const isCurrent = currentTrack?.url === track.url || (currentTrack?.title === track.title && currentTrack?.artist === track.artist);
                  return (
                    <div 
                      key={idx}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all group relative cursor-pointer border ${
                        isCurrent 
                          ? 'bg-blue-500/10 border-blue-500/30' 
                          : 'hover:bg-white/5 border-transparent hover:border-white/5'
                      }`}
                      onClick={() => onPlayTrack(track)}
                    >
                      <div className="w-6 text-[10px] text-white/30 font-mono text-center">
                        {isCurrent ? <Music className="w-3 h-3 text-blue-400 mx-auto animate-pulse" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isCurrent ? 'text-blue-400' : 'group-hover:text-blue-100'}`}>{track.title}</div>
                        <div className="text-[10px] text-white/40 truncate flex items-center gap-1">
                          {track.source === 'itunes' ? (
                            <span className="text-blue-400 font-bold bg-blue-500/10 px-1 rounded flex items-center gap-1">
                              <ExternalLink className="w-2 h-2" /> 30s PREVIEW
                            </span>
                          ) : track.duration > 0 && (
                            <span className="flex items-center gap-1 opacity-60">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toFixed(0).padStart(2, '0')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
