import { useState, useRef, useCallback, useEffect } from 'react';
import { CarPlayer } from '@/components/CarPlayer';
import { CarPlaylist } from '@/components/CarPlaylist';
import { Speaker } from '@/components/Speaker';
import { Equalizer } from '@/components/Equalizer';
import { TopMenu } from '@/components/TopMenu';
import { URLDialog } from '@/components/URLDialog';
import { HelpPage } from '@/components/HelpPage';
import { DiscoveryHub } from '@/components/DiscoveryHub';
import { SettingsPage } from '@/components/SettingsPage';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Disc2, ListMusic } from 'lucide-react';
import { SplashScreen } from '@/components/SplashScreen';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { UserGuideModal } from '@/components/UserGuideModal';

import type { Track } from '@/types';
import { generateId } from '@/lib/utils';
import { AuthService } from '@/lib/authService';
import type { UserProfile } from '@/lib/authService';

// Parse metadata from audio files
const parseAudioMetadata = async (file: File): Promise<Partial<Track>> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';
    
    audio.onloadedmetadata = () => {
      resolve({
        duration: audio.duration,
      });
    };
    
    audio.onerror = () => {
      resolve({ duration: 0 });
    };
    
    audio.src = URL.createObjectURL(file);
  });
};

// Extract basic info from filename
const parseFilename = (filename: string): { title: string; artist: string } => {
  const name = filename.replace(/\.[^/.]+$/, '');
  const separators = [' - ', ' – ', '-', '_'];
  for (const sep of separators) {
    const parts = name.split(sep);
    if (parts.length >= 2) {
      return {
        artist: parts[0].trim(),
        title: parts.slice(1).join(' - ').trim()
      };
    }
  }
  return { title: name, artist: 'Unknown Artist' };
};

// Fetch album art from iTunes Search API
const fetchAlbumArt = async (artist: string, title: string): Promise<string | null> => {
  try {
    const term = `${artist} ${title}`.replace(/\s+/g, '+');
    const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
    }
  } catch (e) {
    console.error('Failed to fetch album art:', e);
  }
  return null;
};

function App() {
  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const simDataRef = useRef<{ frequencies: Uint8Array; waveform: Uint8Array } | null>(null);
  const simBeatRef = useRef<number>(0);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  
  // Callback Refs to break circular dependencies
  const loadTrackRef = useRef<((track: Track) => Promise<void>) | null>(null);
  const playRef = useRef<(() => Promise<void>) | null>(null);

  // State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const hasLoadedRef = useRef(false);
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);
  const [isURLDialogOpen, setIsURLDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'player' | 'equalizer' | 'help' | 'settings'>('player');
  const [mobileTab, setMobileTab] = useState<'player' | 'dvd'>('player');
  const [showSplash, setShowSplash] = useState(true);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [importStatus, setImportStatus] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [visualizerStyle, setVisualizerStyle] = useState<'sanyo' | 'sony' | 'panasonic' | 'akai' | 'oscilloscope' | 'gunmetal' | 'rainbow'>('sanyo');
  const [rightPanelTab, setRightPanelTab] = useState<'playlist' | 'discovery'>('playlist');
  const [user, setUser] = useState<UserProfile | null>(AuthService.getUser());
  const [seekTime, setSeekTime] = useState<number | undefined>(undefined);

  // Load from localStorage & Handle OAuth Callback
  useEffect(() => {
    // Check for OAuth callback in URL hash
    if (window.location.hash) {
      const newUser = AuthService.handleCallback();
      if (newUser) {
        AuthService.saveUser(newUser);
        setUser(newUser); // Update React state immediately
        window.location.hash = ''; // Clear hash
      }
    }

    const saved = localStorage.getItem('car-audio-library');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // URLs for local files expire, but YouTube/Online URLs should be kept
        setPlaylist(parsed.map((t: Track) => ({ 
          ...t, 
          url: t.source === 'local' ? '' : t.url 
        })));
      } catch (e) {}
    }
    hasLoadedRef.current = true;
  }, []);

  // Save to localStorage with safety
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    try {
      localStorage.setItem('car-audio-library', JSON.stringify(playlist.map(t => {
        if (!t) return null;
        return {
          ...t, 
          url: t.source === 'local' ? '' : t.url 
        };
      }).filter(Boolean)));
    } catch (e) {
      console.error('Failed to save library:', e);
    }
  }, [playlist]);

  // Audio Engine Core
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContext();
      audioContextRef.current = context;

      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;

      const gainNode = context.createGain();
      gainNode.gain.value = volume;
      gainNodeRef.current = gainNode;

      const freqs = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      const eqFilters = freqs.map(freq => {
        const f = context.createBiquadFilter();
        f.type = 'peaking';
        f.frequency.value = freq;
        f.Q.value = 1;
        f.gain.value = 0;
        return f;
      });
      setFilters(eqFilters);

      const bassFilter = context.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 200;
      bassFilterRef.current = bassFilter;

      const trebleFilter = context.createBiquadFilter();
      trebleFilter.type = 'highshelf';
      trebleFilter.frequency.value = 3000;
      trebleFilterRef.current = trebleFilter;

      // Internal Chain
      let lastNode: AudioNode = eqFilters[0];
      for (let i = 1; i < eqFilters.length; i++) {
        lastNode.connect(eqFilters[i]);
        lastNode = eqFilters[i];
      }
      lastNode.connect(bassFilter);
      bassFilter.connect(trebleFilter);
      trebleFilter.connect(gainNode);
      gainNode.connect(analyser);
      analyser.connect(context.destination);
    }
  }, [volume]);

  // Setup/Maintenance of Audio Graph
  useEffect(() => {
    if (!audioContextRef.current || !audioElementRef.current || filters.length === 0) return;
    
    if (!sourceNodeRef.current) {
      try {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
      } catch (e) {
        console.error('Failed to create source node:', e);
      }
    }
    
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current.connect(filters[0]);
      } catch (e) {}
    }
  }, [filters]);

  const loadTrack = useCallback(async (track: Track) => {
    initAudio();

    if (!audioElementRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audioElementRef.current = audio;
      
      if (audioContextRef.current && !sourceNodeRef.current) {
         sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
         sourceNodeRef.current.connect(filters[0] || audioContextRef.current.destination);
      }
    }

    const audio = audioElementRef.current;
    if (!audio) return;

    audio.pause();
    
    if (track.source === 'youtube') {
      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(track.duration || 0);
      setIsPlaying(true);
      return;
    }
    
    if (!track.url) return;

    setCurrentTime(0);
    audio.currentTime = 0; 
    setDuration(track.duration || 0);
    
    audio.src = track.url || '';
    audio.load();

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
        if (!track.duration) track.duration = audio.duration;
      }
    };
    audio.onended = () => {
      setIsPlaying(false);
      playNext();
    };

    setCurrentTrack(track);
  }, [initAudio, filters]); 

  const findTrackIndex = useCallback((track: Track | null) => {
    if (!track || playlist.length === 0) return -1;
    const idxById = playlist.findIndex(t => t.id === track.id);
    if (idxById !== -1) return idxById;
    const idxByUrl = playlist.findIndex(t => t.url === track.url);
    if (idxByUrl !== -1) return idxByUrl;
    return playlist.findIndex(t => t.title === track.title && t.artist === track.artist);
  }, [playlist]);

  const play = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    if (audioElementRef.current && !audioElementRef.current.src && currentTrack?.source !== 'youtube') {
       if (playlist.length > 0) await loadTrack(playlist[0]);
    }
    
    if (currentTrack?.source === 'youtube') {
      setIsPlaying(true);
    } else {
      try {
        await audioElementRef.current?.play();
      } catch (e: any) {
        // AbortError is benign — it means play() was interrupted by pause() (e.g. rapid track switching)
        if (e?.name !== 'AbortError') {
          console.error('Playback failed:', e);
        }
      }
    }
  }, [playlist, loadTrack, currentTrack]);

  useEffect(() => {
    loadTrackRef.current = loadTrack;
    playRef.current = play;
  }, [loadTrack, play]);

  const pause = useCallback(() => {
    if (currentTrack?.source === 'youtube') {
      setIsPlaying(false);
    } else {
      audioElementRef.current?.pause();
    }
  }, [currentTrack]);

  const seek = useCallback((time: number) => {
    if (currentTrack?.source === 'youtube') {
      setSeekTime(time);
      setTimeout(() => setSeekTime(undefined), 100);
      setCurrentTime(time);
    } else if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, [currentTrack]);

  const changeVolume = useCallback((vol: number) => {
    setVolume(vol);
    if (gainNodeRef.current) gainNodeRef.current.gain.value = vol;
  }, []);

  const handleGainChange = useCallback((index: number, gain: number) => {
    if (filters[index]) filters[index].gain.value = gain;
  }, [filters]);

  const handleBassChange = useCallback((gain: number) => {
    if (bassFilterRef.current) bassFilterRef.current.gain.value = gain;
  }, []);

  const handleTrebleChange = useCallback((gain: number) => {
    if (trebleFilterRef.current) trebleFilterRef.current.gain.value = gain;
  }, []);

  const playNext = useCallback(async () => {
    if (playlist.length === 0) return;
    const currentIdx = findTrackIndex(currentTrack);
    let nextIdx = (currentIdx + 1) % playlist.length;
    if (shuffleMode) nextIdx = Math.floor(Math.random() * playlist.length);
    
    if (loadTrackRef.current) await loadTrackRef.current(playlist[nextIdx]);
    if (playRef.current) await playRef.current();
  }, [currentTrack, playlist, shuffleMode, findTrackIndex]);

  const playPrev = useCallback(async () => {
    if (playlist.length === 0) return;
    const currentIdx = findTrackIndex(currentTrack);
    const prevIdx = (currentIdx <= 0) ? playlist.length - 1 : currentIdx - 1;
    
    if (loadTrackRef.current) await loadTrackRef.current(playlist[prevIdx]);
    if (playRef.current) await playRef.current();
  }, [currentTrack, playlist, findTrackIndex]);

  const toggleShuffle = useCallback(() => setShuffleMode(prev => !prev), []);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    pause();
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.webm'];
    const audioFiles = files.filter(f => audioExtensions.some(ext => f.name.toLowerCase().endsWith(ext)));
    if (audioFiles.length === 0) return;

    const initialTracks: Track[] = audioFiles.map(file => {
      const { title, artist } = parseFilename(file.name);
      return {
        id: generateId(),
        title, artist, album: 'Unknown Album',
        duration: 0,
        url: URL.createObjectURL(file),
        path: file.name,
        source: 'local'
      };
    });

    setPlaylist(initialTracks);
    setImportStatus({ current: 0, total: audioFiles.length, fileName: 'Initializing...' });

    if (initialTracks.length > 0) {
      await loadTrack(initialTracks[0]);
      play();
    }

    const BATCH_SIZE = 5;
    for (let i = 0; i < initialTracks.length; i += BATCH_SIZE) {
      const batch = audioFiles.slice(i, i + BATCH_SIZE);
      
      const enrichmentResults = await Promise.all(batch.map(async (file, idx) => {
        const globalIdx = i + idx;
        const { title, artist } = initialTracks[globalIdx];
        
        // Update status for each file in batch
        setImportStatus(prev => prev ? { ...prev, current: globalIdx + 1, fileName: file.name } : null);

        try {
          const metadata = await parseAudioMetadata(file);
          const cover = globalIdx < 20 ? await fetchAlbumArt(artist, title) : null;
          return { index: globalIdx, duration: metadata.duration || 0, cover: cover || undefined };
        } catch (e) { return null; }
      }));

      setPlaylist(prev => {
        const next = [...prev];
        enrichmentResults.forEach(res => {
          if (res) {
            next[res.index] = { ...next[res.index], duration: res.duration, cover: res.cover };
          }
        });
        return next;
      });
    }

    // Small delay for the progress to feel natural
    setTimeout(() => setImportStatus(null), 800);
  }, [loadTrack, play, pause]);

  const handleURLSubmit = useCallback(async (url: string) => {
    const isYT = url.includes('youtube.com') || url.includes('youtu.be');
    const track: Track = {
      id: generateId(),
      title: url.split('/').pop() || 'Stream',
      artist: isYT ? 'YouTube' : 'Network',
      album: isYT ? 'YouTube Stream' : 'Online',
      duration: 0,
      url: url,
      path: url,
      source: isYT ? 'youtube' : undefined
    };
    setPlaylist(prev => [track, ...prev]);
    loadTrack(track);
  }, [loadTrack]);

  const handleOpenFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleFilesSelected(Array.from(files));
    };
    input.click();
  }, [handleFilesSelected]);

  const handleOpenFolder = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    (input as any).webkitdirectory = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) handleFilesSelected(Array.from(files));
    };
    input.click();
  }, [handleFilesSelected]);

  const removeTrack = useCallback((trackId: string) => {
    setPlaylist(prev => prev.filter(t => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      pause();
      setCurrentTrack(null);
    }
  }, [currentTrack, pause]);

  const getVisualizerData = useCallback(() => {
    if (currentTrack?.source === 'youtube' && isPlaying) {
      if (!simDataRef.current) {
        simDataRef.current = {
          frequencies: new Uint8Array(256),
          waveform: new Uint8Array(256)
        };
      }
      const { frequencies, waveform } = simDataRef.current;
      const time = performance.now() / 1000;
      simBeatRef.current += 0.05;
      const beat = Math.sin(simBeatRef.current) * 0.5 + 0.5;
      for (let i = 0; i < frequencies.length; i++) {
        const base = 40 + Math.sin(time * 2 + i * 0.1) * 20;
        const pulse = beat * (255 - i * 0.8) * (0.3 + Math.random() * 0.2);
        frequencies[i] = Math.min(255, base + pulse);
        waveform[i] = 128 + Math.sin(time * 10 + i * 0.2) * 50 * beat;
      }
      return { frequencies, waveform };
    }

    if (!analyserRef.current) return null;
    const frequencies = new Uint8Array(analyserRef.current.frequencyBinCount);
    const waveform = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(frequencies);
    analyserRef.current.getByteTimeDomainData(waveform);
    return { frequencies, waveform };
  }, [currentTrack, isPlaying]);

  // Auto-open User Guide on first visit
  useEffect(() => {
    if (!showSplash) {
      const timer = setTimeout(() => {
        const hasSeenGuide = localStorage.getItem('hasSeenGuide');
        if (!hasSeenGuide) {
          setShowUserGuide(true);
        }
      }, 1500); // 1.5s after splash ends
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const handleCloseGuide = () => {
    setShowUserGuide(false);
    localStorage.setItem('hasSeenGuide', 'true');
  };

  useEffect(() => {
    return () => {
      audioElementRef.current?.pause();
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-[var(--bg-dark)] flex flex-col overflow-hidden">
      <TopMenu 
        onOpenFile={handleOpenFile} onOpenFolder={handleOpenFolder} onOpenURL={() => setIsURLDialogOpen(true)}
        onPlay={play} onPause={pause} onStop={() => { pause(); seek(0); }}
        onPrev={playPrev} onNext={playNext} onShowHelp={() => setCurrentView('help')}
        onShowSettings={() => setCurrentView('settings')}
        onShowGuide={() => setShowUserGuide(true)}
        onSetVisualizerStyle={setVisualizerStyle} isPlaying={isPlaying} currentStyle={visualizerStyle}
      />

      <div className="flex-1 flex car-layout overflow-hidden relative">
        <div className="hidden md:block md:w-[15%] lg:w-[18%] xl:w-[20%] h-full overflow-hidden border-r border-[var(--metal-dark)]/50 speaker-column">
          <Speaker side="left" isPlaying={isPlaying} getVisualizerData={getVisualizerData} />
        </div>

        <div className={`w-full md:flex-1 flex flex-col h-full overflow-hidden border-r border-[var(--metal-dark)] relative z-10 bg-[var(--bg-panel)]/30 backdrop-blur-sm ${mobileTab !== 'player' ? 'hidden md:flex' : 'flex'}`}>
          <CarPlayer
            currentTrack={currentTrack} isPlaying={isPlaying} currentTime={currentTime} duration={duration}
            volume={volume} shuffleMode={shuffleMode} playlist={playlist}
            onPlay={play} onPause={pause} onPrev={playPrev} onNext={playNext}
            onSeek={seek} onVolumeChange={changeVolume} onToggleShuffle={toggleShuffle}
            onToggleEqualizer={() => setCurrentView('equalizer')}
            getVisualizerData={getVisualizerData} visualizerStyle={visualizerStyle}
            seekTime={seekTime}
            onYouTubeProgress={(curr, dur) => { setCurrentTime(curr); setDuration(dur); }}
          />
        </div>

        <div className={`w-full md:w-[26%] lg:w-[26%] xl:w-[28%] h-full flex-col overflow-hidden border-r border-[var(--metal-dark)]/50 bg-[var(--bg-panel)]/10 ${mobileTab !== 'dvd' ? 'hidden md:flex' : 'flex'}`}>
          <Tabs value={rightPanelTab} onValueChange={(val) => setRightPanelTab(val as any)} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-white/5 bg-black/20">
              <TabsList className="w-full bg-white/5 border border-white/10 h-10 p-1">
                <TabsTrigger value="playlist" className="flex-1 gap-2 text-xs data-[state=active]:bg-blue-600 transition-all font-bold">
                  <ListMusic className="w-3 h-3" /> Playlist
                </TabsTrigger>
                <TabsTrigger value="discovery" className="flex-1 gap-2 text-xs data-[state=active]:bg-purple-600 transition-all font-bold">
                  <Disc2 className="w-3 h-3" /> DVD
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {rightPanelTab === 'playlist' ? (
                 <CarPlaylist tracks={playlist} currentTrack={currentTrack} onSelectTrack={(t) => { loadTrack(t); play(); }} onRemoveTrack={removeTrack} />
              ) : (
                 <DiscoveryHub 
                   user={user}
                   currentTrack={currentTrack}
                   onLoadAlbum={async (tracks) => { 
                     setPlaylist(tracks); 
                     setRightPanelTab('playlist');
                     if (tracks.length > 0) { await loadTrack(tracks[0]); play(); }
                   }} 
                   onAddTrack={(t) => {
                     setPlaylist(prev => {
                       const exists = prev.some(item => item.id === t.id || (item.title === t.title && item.artist === t.artist));
                       if (exists) return prev;
                       return [...prev, t];
                     });
                   }}
                   onPlayTrack={(t) => {
                     setPlaylist(prev => {
                       const exists = prev.some(item => item.id === t.id || (item.title === t.title && item.artist === t.artist));
                       if (exists) return prev;
                       return [t, ...prev];
                     });
                     loadTrack(t); play();
                      setMobileTab('player'); // auto-switch to player on mobile
                   }} 
                 />
              )}
            </div>
          </Tabs>
        </div>

        <div className="hidden md:block md:w-[15%] lg:w-[18%] xl:w-[20%] h-full overflow-hidden speaker-column">
          <Speaker side="right" isPlaying={isPlaying} getVisualizerData={getVisualizerData} />
        </div>
      </div>

      <URLDialog isOpen={isURLDialogOpen} onClose={() => setIsURLDialogOpen(false)} onSubmit={handleURLSubmit} />
      
      {currentView === 'equalizer' && (
        <div className="fixed inset-0 z-[100] bg-[var(--bg-dark)]">
          <Equalizer onGainChange={handleGainChange} onBassChange={handleBassChange} onTrebleChange={handleTrebleChange} onVolumeChange={changeVolume} currentVolume={volume} isFullScreen={true} onBack={() => setCurrentView('player')} getVisualizerData={getVisualizerData} />
        </div>
      )}
      {currentView === 'help' && (
        <div className="fixed inset-0 z-[110] bg-[var(--bg-dark)]">
          <HelpPage onBack={() => setCurrentView('player')} />
        </div>
      )}
      {currentView === 'settings' && (
        <div className="fixed inset-0 z-[110] bg-[var(--bg-dark)]">
          <SettingsPage onBack={() => setCurrentView('player')} />
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden flex items-center justify-around h-16 bg-[var(--bg-dark)] border-t border-white/10 px-4 z-[120] relative">
        <button onClick={() => setMobileTab('player')} className={`flex flex-col items-center gap-1 transition-all ${mobileTab === 'player' ? 'text-blue-400' : 'text-gray-500'}`}>
          <div className={`p-1.5 rounded-lg ${mobileTab === 'player' ? 'bg-blue-400/20' : ''}`}>
             <div className="w-5 h-5 bg-current" style={{ WebkitMask: 'url("/icons/car.svg") no-repeat center', mask: 'url("/icons/car.svg") no-repeat center' }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Player</span>
        </button>
        <button onClick={() => setMobileTab('dvd')} className={`flex flex-col items-center gap-1 transition-all ${mobileTab === 'dvd' ? 'text-purple-400' : 'text-gray-500'}`}>
          <div className={`p-1.5 rounded-lg ${mobileTab === 'dvd' ? 'bg-purple-400/20' : ''}`}> <Disc2 className="w-5 h-5" /> </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Discovery</span>
        </button>
      </div>

      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {importStatus && (
        <LoadingOverlay 
          current={importStatus.current} 
          total={importStatus.total} 
          fileName={importStatus.fileName} 
        />
      )}
      <UserGuideModal isOpen={showUserGuide} onClose={handleCloseGuide} />
    </div>
  );
}

export default App;
