import { Search, Loader2, Music, Library, Disc2, Video, HardDrive } from 'lucide-react';
import { MusicService } from '@/lib/musicService';
import { YouTubeService } from '@/lib/youtubeService';
import type { Album } from '@/lib/musicService';
import type { Track } from '@/types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { AuthService } from '@/lib/authService';
import type { UserProfile } from '@/lib/authService';
import { useEffect, useState } from 'react';

interface DiscoveryHubProps {
  user: UserProfile | null;
  currentTrack: Track | null;
  onLoadAlbum: (tracks: Track[]) => void;
  onAddTrack: (track: Track) => void;
  onPlayTrack: (track: Track) => void;
  onOpenLogin: () => void;
  onClose?: () => void;
}

export function DiscoveryHub({ 
  user, currentTrack, onLoadAlbum, onAddTrack, 
  onPlayTrack, onOpenLogin, onClose 
}: DiscoveryHubProps) {
  const [query, setQuery] = useState('modrec');
  const [searchMode, setSearchMode] = useState<'album' | 'track' | 'video' | 'mp3'>('video');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);

  const handleSearch = async (isInitial = false) => {
    // If initial, we always want the default 'modrec' video/track results
    const searchQuery = isInitial ? 'modrec' : query;
    const currentMode = isInitial ? 'video' : searchMode;
    
    if (!searchQuery) return;
    
    setLoading(true);
    setError(null);
    setSelectedAlbum(null);
    
    try {
      if (currentMode === 'album' && !isInitial) {
        if (!user) {
          // If not logged in, we search Audius for playlists
          const results = await MusicService.searchAlbums(searchQuery);
          setAlbums(results);
          setTracks([]);
        } else {
          // For now keep existing behavior for authenticated album search
          const ytAlbums = await YouTubeService.fetchMyPlaylists();
          setAlbums(ytAlbums.map(p => ({
            id: p.id,
            title: p.title,
            artist: 'My Playlist',
            cover: p.thumbnails?.high?.url || p.thumbnails?.default?.url || '',
            source: 'youtube'
          })));
        }
      } else if (currentMode === 'mp3') {
        // FORCE search from APIs that provide full length audio
        const results = await Promise.allSettled([
          MusicService.searchJamendoTracks(searchQuery),
          MusicService.searchTracks(searchQuery), // Audius
          MusicService.searchJamendoAlbums(searchQuery),
        ]);
        
        const jamendoTracks = results[0].status === 'fulfilled' ? results[0].value as Track[] : [];
        const audiusTracks = results[1].status === 'fulfilled' ? results[1].value as Track[] : [];
        const jamendoAlbums = results[2].status === 'fulfilled' ? results[2].value as Album[] : [];
        
        setTracks([...jamendoTracks, ...audiusTracks]);
        setAlbums(jamendoAlbums);
      } else if (currentMode === 'track' || currentMode === 'video') {
        // USE FALLBACK PROXY if not logged in or for best reliability
        if (!user || currentMode === 'video') {
          const results = await MusicService.searchYouTube(searchQuery);
          setTracks(results);
          setAlbums([]); // Force clear albums for Video mode
        } else {
          // Use authenticated YT Music search
          const results = await YouTubeService.searchTracks(searchQuery, 'music');
          setTracks(results);
          setAlbums([]);
        }
      }
    } catch (e: any) {
      if (e.message === 'AUTH_EXPIRED') {
        setError('AUTH_EXPIRED');
        // Auto-fallback on auth error?
        if (searchMode !== 'album') {
           const results = await MusicService.searchYouTube(searchQuery);
           setTracks(results);
           setError(null);
        }
      } else if (e.message === 'QUOTA_EXCEEDED') {
        setError('QUOTA_EXCEEDED');
      } else {
        setError('SEARCH_FAILED');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      const loadInitial = async () => {
        setLoading(true);
        try {
          const pts = await YouTubeService.fetchMyPlaylists();
          setAlbums(pts.map(p => ({
            id: p.id,
            title: p.title,
            artist: 'My Playlist',
            cover: p.thumbnails?.high?.url || p.thumbnails?.default?.url || '',
            source: 'youtube'
          })));
          // Also show initial trending/modrec results
          handleSearch(true);
        } catch (e: any) {
          if (e.message === 'AUTH_EXPIRED') setError('AUTH_EXPIRED');
        } finally {
          setLoading(false);
        }
      };
      loadInitial();
    } else {
      // Load initial modrec results even for guest
      handleSearch(true);
    }
  }, [user]);

  const handleSelectAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setLoading(true);
    setError(null);
    try {
      let tracks: Track[] = [];
      if (album.source === 'youtube') {
        tracks = await YouTubeService.fetchPlaylistTracks(album.id);
      } else if (album.source === 'itunes') {
        tracks = await MusicService.getMP3AlbumTracks(album);
      } else if (album.source === 'jamendo') {
        tracks = await MusicService.getJamendoAlbumTracks(album.id, album.title);
      } else if (album.source === 'deezer') {
        tracks = await MusicService.getDeezerAlbumTracks(album.id, album.title);
      } else {
        tracks = await MusicService.getAlbumTracks(album.id);
      }
      setAlbumTracks(tracks);
    } catch (e: any) {
      if (e.message === 'AUTH_EXPIRED') setError('AUTH_EXPIRED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl border-l border-[var(--metal-dark)]/30 text-white overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-gradient-to-r from-blue-900/20 to-purple-900/20 landscape:hidden">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
            <Search className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-blue-50">Discovery Hub</h2>
            <p className="text-xs text-blue-300/60 font-medium">YouTube & Online Content</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
             {onClose && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-[10px] text-blue-400 hover:text-blue-300 uppercase font-black tracking-widest px-2 h-7 bg-blue-500/10"
                  onClick={onClose}
                >
                  ← Playlist
                </Button>
             )}
             {user ? (
               <Button 
                 size="sm" 
                 variant="ghost" 
                 className="text-[10px] text-white/40 hover:text-red-400 uppercase font-black tracking-widest px-2 h-7"
                 onClick={() => {
                   AuthService.logout();
                   window.location.reload(); 
                 }}
               >
                 Logout
               </Button>
             ) : (
               <Button 
                 size="sm" 
                 className="bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest px-3 h-7 rounded-sm shadow-[0_4px_12px_rgba(37,99,235,0.3)] transition-all active:scale-95 border-t border-white/20"
                 onClick={onOpenLogin}
               >
                 Sign In
               </Button>
             )}
          </div>
        </div>
      </div>

      <div className="p-4 pt-0 landscape:pt-2 border-b border-white/5 bg-gradient-to-r from-blue-900/5 to-purple-900/5">
        <div className="flex gap-2 mb-4 landscape:mb-2">
          <Button 
            size="sm"
            variant={searchMode === 'album' ? 'default' : 'outline'}
            onClick={() => {
              setSearchMode('album');
              if (query) setTimeout(() => handleSearch(), 0);
            }}
            className={`clay-btn btn-short ${searchMode === 'album' ? 'clay-btn-active' : ''}`}
            title="Albums"
          >
            <Disc2 className="w-5 h-5" />
          </Button>
          <Button 
            size="sm"
            variant={searchMode === 'track' ? 'default' : 'outline'}
            onClick={() => {
              setSearchMode('track');
              if (query) setTimeout(() => handleSearch(), 0);
            }}
            className={`clay-btn btn-short ${searchMode === 'track' ? 'clay-btn-active' : ''}`}
            title="Songs"
          >
            <Music className="w-5 h-5" />
          </Button>
          <Button 
            size="sm"
            variant={searchMode === 'video' ? 'default' : 'outline'}
            onClick={() => {
              setSearchMode('video');
              // FORCE search video from YT
              if (query) setTimeout(() => handleSearch(), 0);
            }}
            className={`clay-btn btn-short ${searchMode === 'video' ? 'clay-btn-active' : ''}`}
            title="Videos from YouTube"
          >
            <Video className="w-5 h-5" />
          </Button>
          <Button 
            size="sm"
            variant={searchMode === 'mp3' ? 'default' : 'outline'}
            onClick={() => {
              setSearchMode('mp3');
              // FORCE it to search only MP3 albums
              if (query) setTimeout(() => handleSearch(), 0);
            }}
            className={`clay-btn btn-short ${searchMode === 'mp3' ? 'clay-btn-active' : ''}`}
            title="Search MP3 Albums Only"
          >
            <HardDrive className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="search-query"
              name="search-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                searchMode === 'album' ? "Search playlists..." : 
                searchMode === 'mp3' ? "Search MP3 Albums..." :
                searchMode === 'track' ? "Search songs..." : "Search any video..."
              }
              className="bg-black/40 border-white/10 text-white h-10 pl-10 focus:ring-blue-500/50"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
          <Button onClick={() => handleSearch()} disabled={loading} className="clay-btn btn-short px-4 transition-all active:scale-95">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
                <Music className="w-12 h-12 text-red-400 opacity-50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-red-200">
                  {error === 'AUTH_EXPIRED' ? 'Session Expired' : error === 'QUOTA_EXCEEDED' ? 'Quota Exceeded' : 'Search failed'}
                </h3>
                <p className="text-sm text-gray-400 max-w-[250px] mx-auto">
                  {error === 'AUTH_EXPIRED' 
                    ? 'Your Google session has expired. Please log in again to continue searching.' 
                    : error === 'QUOTA_EXCEEDED' 
                    ? 'The YouTube API quota has been exceeded for today. Please try again later.' 
                    : 'Something went wrong while searching. Please check your connection and try again.'}
                </p>
              </div>
              {error === 'AUTH_EXPIRED' && (
                <Button onClick={() => AuthService.login()} className="bg-white text-black hover:bg-gray-200 rounded-full px-6 font-bold">
                  Re-login with Google
                </Button>
              )}
            </div>
          ) : !selectedAlbum ? (
            <>
               {searchMode === 'album' || searchMode === 'mp3' ? (
                 (albums.length > 0 || (searchMode === 'mp3' && tracks.length > 0)) ? (
                   <div className="space-y-6">
                     {/* Immediate Tracks (Only for HDD/MP3 mode) */}
                     {searchMode === 'mp3' && tracks.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase text-blue-400/60 pb-1 border-b border-blue-500/10 tracking-[0.2em] px-2 italic">Direct API Audio</h4>
                          <div className="space-y-1">
                            {tracks.slice(0, 10).map((track) => {
                              const isCurrent = currentTrack?.url === track.url;
                              return (
                                <div key={track.id} className={`flex items-center gap-3 p-2 rounded-lg transition-all group relative cursor-pointer border ${isCurrent ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`} onClick={() => onPlayTrack(track)}>
                                  <div className="relative w-8 h-8 flex-shrink-0 overflow-hidden rounded bg-black/40">
                                    {track.cover && <img src={track.cover} className="w-full h-full object-cover" alt="" />}
                                    <div className={`absolute inset-0 flex items-center justify-center ${isCurrent ? 'opacity-100' : 'opacity-0'}`}>
                                      <Music className="w-3 h-3 text-blue-400 animate-pulse" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-bold truncate ${isCurrent ? 'text-blue-400' : 'text-white/80'}`}>{track.title}</div>
                                    <div className="text-[9px] text-white/40 truncate">{track.artist} • {track.source?.toUpperCase() || 'AUDIO'}</div>
                                  </div>
                                  <Badge variant="outline" className="h-4 text-[7px] border-blue-500/30 text-blue-400">FULL</Badge>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                     )}

                     {/* Grid results (Albums) */}
                     {albums.length > 0 && (
                       <div className="grid grid-cols-2 gap-4">
                         {albums.map((album) => (
                           <div 
                             key={album.id}
                             onClick={() => handleSelectAlbum(album)}
                             className="group cursor-pointer space-y-2 hover:bg-white/5 p-2 rounded-xl transition-all border border-transparent hover:border-white/10"
                           >
                             <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg">
                               {album.cover && (
                                 <img src={album.cover} alt={album.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                               )}
                               
                               {/* Always visible source badge on top right */}
                               <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                                 {album.source === 'jamendo' && (
                                   <Badge className="bg-blue-600/80 hover:bg-blue-600 text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 border-none shadow-lg backdrop-blur-md">API FULL-LENGTH</Badge>
                                 )}
                                 {album.source === 'deezer' && (
                                   <Badge className="bg-purple-600/80 hover:bg-purple-600 text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 border-none shadow-lg backdrop-blur-md">Deezer [30s]</Badge>
                                 )}
                                 {album.source === 'itunes' && (
                                   <Badge className="bg-pink-600/80 hover:bg-pink-600 text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 border-none shadow-lg backdrop-blur-md">iTunes [30s]</Badge>
                                 )}
                                 {album.source === 'audius' && (
                                   <Badge className="bg-purple-600/80 hover:bg-purple-600 text-[8px] font-black uppercase tracking-tighter px-1.5 h-4 border-none shadow-lg backdrop-blur-md">AUDIUS HQ</Badge>
                                 )}
                               </div>
 
                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Music className="w-8 h-8 text-white animate-pulse" />
                               </div>
                             </div>
                             <div className="px-1">
                               <h3 className="text-sm font-semibold truncate leading-tight group-hover:text-blue-200">{album.title}</h3>
                               <div className="flex items-center justify-between">
                                 <p className="text-xs text-white/40 truncate">{album.artist}</p>
                                 {album.year && <span className="text-[10px] text-white/20">{album.year}</span>}
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                     <Library className="w-16 h-16 mb-4 stroke-[1]" />
                     <p className="text-sm">Search for an artist or album<br/>to start exploring MP3s.</p>
                   </div>
                 )
               ) : (
                 tracks.length > 0 ? (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between px-2 mb-2">
                       <span className="text-[10px] font-bold uppercase text-white/40 tracking-[0.2em]">{tracks.length} Results</span>
                       <Button size="sm" variant="link" className="text-[10px] text-blue-400 font-black uppercase tracking-widest h-auto p-0 hover:text-blue-300" onClick={() => onLoadAlbum(tracks)}>
                         + Add All to Playlist
                       </Button>
                     </div>
                     <div className={searchMode === 'video' ? "grid grid-cols-1 gap-4" : "space-y-1"}>
                       {tracks.map((track) => {
                         const isCurrent = currentTrack?.url === track.url || (currentTrack?.title === track.title && currentTrack?.artist === track.artist);
                         if (searchMode === 'video') {
                           return (
                             <div key={track.id} className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all ${isCurrent ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/5 hover:border-white/20 bg-white/5'}`} onClick={() => onPlayTrack(track)}>
                               <div className="aspect-video relative overflow-hidden">
                                 {track.cover && (
                                   <img src={track.cover} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" alt="" />
                                 )}
                                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                                   <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[9px] font-bold text-white uppercase tracking-wider">
                                     {track.id.startsWith('yt-search') ? 'Search' : 'HD'}
                                   </div>
                                 </div>
                                 <div className="p-3 space-y-1">
                                   <div className="flex items-start justify-between gap-2">
                                     <h3 className={`text-xs font-bold leading-tight line-clamp-2 ${isCurrent ? 'text-blue-400' : 'group-hover:text-blue-100'}`}>{track.title}</h3>
                                     <div className="p-1 rounded bg-white/5">
                                        <Music className={`w-3 h-3 ${isCurrent ? 'animate-pulse text-blue-400' : 'text-white/20'}`} />
                                     </div>
                                   </div>
                                   <p className="text-[10px] text-white/40 font-medium">
                                     {track.id.startsWith('yt-search') ? 'Click to search on YouTube' : track.artist}
                                   </p>
                                 </div>
                             </div>
                           );
                         }
                         return (
                           <div key={track.id} className={`flex items-center gap-3 p-2 rounded-lg transition-all group relative cursor-pointer border ${isCurrent ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`} onClick={() => onPlayTrack(track)}>
                             <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded">
                               {track.cover && (
                                 <img src={track.cover} className="w-full h-full object-cover" alt="" />
                               )}
                               <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isCurrent ? 'bg-blue-500/40 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}>
                                 <Music className={`w-4 h-4 text-white ${isCurrent ? 'animate-bounce' : ''}`} />
                               </div>
                             </div>
                             <div className="flex-1 min-w-0">
                               <div className={`text-sm font-medium truncate ${isCurrent ? 'text-blue-400' : 'group-hover:text-blue-100'}`}>{track.title}</div>
                               <div className="text-[10px] text-white/40 truncate flex items-center gap-2">
                                 <span>{track.artist} • {track.album}</span>
                                {track.source === 'jamendo' && <Badge variant="outline" className="px-1 py-0 h-3.5 text-[8px] border-blue-500/50 text-blue-400 bg-blue-500/10 font-bold">API FULL-LENGTH</Badge>}
                                {track.source === 'audius' && <Badge variant="outline" className="px-1 py-0 h-3.5 text-[8px] border-purple-500/50 text-purple-400 bg-purple-500/10 font-bold">AUDIUS HQ</Badge>}
                              </div>
                             </div>
                             <div className="flex items-center gap-2">
                                {track.duration > 0 && <span className="text-[10px] font-mono text-white/30">{Math.floor(track.duration / 60)}:{(track.duration % 60).toFixed(0).padStart(2, '0')}</span>}
                                <Button size="icon" variant="ghost" className={`w-8 h-8 ${isCurrent ? 'opacity-100 text-blue-400' : 'opacity-0 group-hover:opacity-100 text-white/40'} hover:text-blue-400`} onClick={(e) => { e.stopPropagation(); onAddTrack(track); }}>
                                 <Library className="w-4 h-4" />
                               </Button>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
                     <div className="p-4 bg-white/5 rounded-full border border-white/10 opacity-40">
                       <Music className="w-16 h-16 stroke-[1]" />
                     </div>
                     <div className="space-y-1">
                       <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Guest Mode</p>
                       <p className="text-xs text-white/30">Search results are limited. <br/> Sign in for your full library.</p>
                     </div>
                     {!user && (
                       <Button 
                         variant="link" 
                         className="text-[10px] text-blue-400 font-black uppercase tracking-widest h-auto p-0 hover:text-blue-300"
                         onClick={onOpenLogin}
                       >
                         Sign in with Google
                       </Button>
                     )}
                   </div>
                 )
               )}
            </>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <button onClick={() => setSelectedAlbum(null)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mb-2 bg-blue-500/10 px-2 py-1 rounded">
                ← Back to Search
              </button>
              <div className="flex gap-4 items-end">
                {selectedAlbum.cover && (
                  <img src={selectedAlbum.cover} className="w-32 h-32 rounded-lg shadow-2xl border border-white/10" alt="" />
                )}
                <div className="flex-1 space-y-1">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-blue-500/50 text-blue-400">Album</Badge>
                  <h2 className="text-xl font-bold leading-tight line-clamp-2">{selectedAlbum.title}</h2>
                  <p className="text-sm text-white/60">{selectedAlbum.artist}</p>
                  <Button size="sm" className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-xs h-8" onClick={() => onLoadAlbum(albumTracks)}>
                    Add All Tracks
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold uppercase text-white/40 mb-3 tracking-widest px-2">Tracklist</h4>
                {albumTracks.map((track, idx) => {
                  const isCurrent = currentTrack?.url === track.url || (currentTrack?.title === track.title && currentTrack?.artist === track.artist);
                  return (
                    <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg transition-all group relative cursor-pointer border ${isCurrent ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-white/5 border-transparent hover:border-white/5'}`} onClick={() => onPlayTrack(track)}>
                      <div className="w-6 text-[10px] text-white/30 font-mono text-center">
                        {isCurrent ? <Music className="w-3 h-3 text-blue-400 mx-auto animate-pulse" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isCurrent ? 'text-blue-400' : 'group-hover:text-blue-100'}`}>{track.title}</div>
                        <div className="text-[10px] text-white/40 truncate flex items-center gap-1">
                          {track.duration > 0 && <span className="flex items-center gap-1 opacity-60">{Math.floor(track.duration / 60)}:{(track.duration % 60).toFixed(0).padStart(2, '0')}</span>}
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
