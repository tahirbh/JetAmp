import { useState, useRef, useCallback, useEffect } from 'react';
import { CarPlayer } from '@/components/CarPlayer';
import { CarPlaylist } from '@/components/CarPlaylist';
import { Speaker } from '@/components/Speaker';
import { Equalizer } from '@/components/Equalizer';
import { TopMenu } from '@/components/TopMenu';
import { URLDialog } from '@/components/URLDialog';
import { HelpPage } from '@/components/HelpPage';
import { DiscoveryHub } from '@/components/DiscoveryHub';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, ListMusic } from 'lucide-react';
import type { Track } from '@/types';
import { generateId } from '@/lib/utils';

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
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);
  const [isURLDialogOpen, setIsURLDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'player' | 'equalizer' | 'help'>('player');
  const [visualizerStyle, setVisualizerStyle] = useState<'sanyo' | 'oscilloscope' | 'gunmetal' | 'rainbow'>('sanyo');
  const [rightPanelTab, setRightPanelTab] = useState<'playlist' | 'discovery'>('playlist');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('car-audio-library');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPlaylist(parsed.map((t: Track) => ({ ...t, url: '' })));
      } catch (e) {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem('car-audio-library', JSON.stringify(playlist.map(t => ({
        ...t, url: '' 
      }))));
    }
  }, [playlist]);

  // Audio Engine Core
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
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
    
    // Ensure Source Node exists (ONE TIME)
    if (!sourceNodeRef.current) {
      try {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElementRef.current);
      } catch (e) {
        console.error('Failed to create source node:', e);
      }
    }
    
    // Ensure connection to current filter chain
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current.connect(filters[0]);
      } catch (e) {}
    }
  }, [filters]); // Run when filters are initialized or changed

  // Stable Playback Callbacks
  const loadTrack = useCallback(async (track: Track) => {
    initAudio();

    if (!audioElementRef.current) {
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audioElementRef.current = audio;
      
      // Manual trigger for source node creation if needed
      if (audioContextRef.current && !sourceNodeRef.current) {
         sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
         sourceNodeRef.current.connect(filters[0] || audioContextRef.current.destination);
      }
    }

    const audio = audioElementRef.current;
    if (!audio) return;

    audio.pause();
    
    if (!track.url) return;

    // Reset state before load
    setCurrentTime(0);
    audio.currentTime = 0; // Hardware reset
    setDuration(track.duration || 0);
    
    audio.src = track.url || '';
    audio.load();

    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
        // Update the track info if it had no duration
        if (!track.duration) {
          track.duration = audio.duration;
        }
      }
    };
    audio.onended = () => {
      setIsPlaying(false);
      playNext();
    };

    setCurrentTrack(track);
  }, [initAudio, filters]); 

  // Helper to find track in playlist (robust matching)
  const findTrackIndex = useCallback((track: Track | null) => {
    if (!track || playlist.length === 0) return -1;
    // Match by ID
    const idxById = playlist.findIndex(t => t.id === track.id);
    if (idxById !== -1) return idxById;
    // Match by URL
    const idxByUrl = playlist.findIndex(t => t.url === track.url);
    if (idxByUrl !== -1) return idxByUrl;
    // Match by Title + Artist
    return playlist.findIndex(t => t.title === track.title && t.artist === track.artist);
  }, [playlist]);

  const play = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    if (audioElementRef.current && !audioElementRef.current.src) {
       if (playlist.length > 0) await loadTrack(playlist[0]);
    }
    
    try {
      await audioElementRef.current?.play();
    } catch (e) {
      console.error('Playback failed:', e);
    }
  }, [playlist, loadTrack]);

  // Sync refs
  useEffect(() => {
    loadTrackRef.current = loadTrack;
    playRef.current = play;
  }, [loadTrack, play]);

  const pause = useCallback(() => {
    audioElementRef.current?.pause();
  }, []);

  const seek = useCallback((time: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

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
    const newTracks: Track[] = [];
    for (const file of files) {
      const { title, artist } = parseFilename(file.name);
      const metadata = await parseAudioMetadata(file);
      const cover = await fetchAlbumArt(artist, title);
      newTracks.push({
        id: generateId(),
        title, artist, album: 'Unknown Album',
        duration: metadata.duration || 0,
        url: URL.createObjectURL(file),
        path: file.name,
        cover: cover || undefined
      });
    }
    setPlaylist(newTracks);
    if (newTracks.length > 0) {
      await loadTrack(newTracks[0]);
      play();
    }
  }, [loadTrack, play, pause]);

  const handleURLSubmit = useCallback(async (url: string) => {
    const track: Track = {
      id: generateId(),
      title: url.split('/').pop() || 'Stream',
      artist: 'Network',
      album: 'Online',
      duration: 0,
      url: url,
      path: url,
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
    if (!analyserRef.current) return null;
    const frequencies = new Uint8Array(analyserRef.current.frequencyBinCount);
    const waveform = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(frequencies);
    analyserRef.current.getByteTimeDomainData(waveform);
    return { frequencies, waveform };
  }, []);

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
        onSetVisualizerStyle={setVisualizerStyle} isPlaying={isPlaying} currentStyle={visualizerStyle}
      />

      <div className="flex-1 flex car-layout">
        <div className="hidden md:block md:w-[15%] lg:w-[18%] xl:w-[20%] h-full overflow-hidden border-r border-[var(--metal-dark)]/50 speaker-column">
          <Speaker side="left" isPlaying={isPlaying} getVisualizerData={getVisualizerData} />
        </div>

        <div className="w-full md:flex-1 flex flex-col h-full overflow-hidden border-r border-[var(--metal-dark)] relative z-10 bg-[var(--bg-panel)]/30 backdrop-blur-sm">
          <CarPlayer
            currentTrack={currentTrack} isPlaying={isPlaying} currentTime={currentTime} duration={duration}
            volume={volume} shuffleMode={shuffleMode} playlist={playlist}
            onPlay={play} onPause={pause} onPrev={playPrev} onNext={playNext}
            onSeek={seek} onVolumeChange={changeVolume} onToggleShuffle={toggleShuffle}
            onToggleEqualizer={() => setCurrentView('equalizer')}
            getVisualizerData={getVisualizerData} visualizerStyle={visualizerStyle}
          />
        </div>

        <div className="hidden md:flex md:w-[26%] lg:w-[26%] xl:w-[28%] h-full flex-col overflow-hidden border-r border-[var(--metal-dark)]/50 bg-[var(--bg-panel)]/10">
          <Tabs value={rightPanelTab} onValueChange={(val) => setRightPanelTab(val as any)} className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b border-white/5 bg-black/20">
              <TabsList className="w-full bg-white/5 border border-white/10 h-10 p-1">
                <TabsTrigger value="playlist" className="flex-1 gap-2 text-xs data-[state=active]:bg-blue-600 transition-all font-bold">
                  <ListMusic className="w-3 h-3" /> Playlist
                </TabsTrigger>
                <TabsTrigger value="discovery" className="flex-1 gap-2 text-xs data-[state=active]:bg-purple-600 transition-all font-bold">
                  <Globe className="w-3 h-3" /> Discovery
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {rightPanelTab === 'playlist' ? (
                 <CarPlaylist tracks={playlist} currentTrack={currentTrack} onSelectTrack={(t) => { loadTrack(t); play(); }} onRemoveTrack={removeTrack} />
              ) : (
                 <DiscoveryHub 
                   currentTrack={currentTrack}
                   onLoadAlbum={(tracks) => { setPlaylist(tracks); setRightPanelTab('playlist'); }} 
                   onPlayTrack={(t) => {
                     const existingIdx = findTrackIndex(t);
                     if (existingIdx === -1) {
                       setPlaylist(prev => [t, ...prev]);
                     }
                     loadTrack(t);
                     play();
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
          <Equalizer 
            onGainChange={handleGainChange} onBassChange={handleBassChange} onTrebleChange={handleTrebleChange}
            onVolumeChange={changeVolume} currentVolume={volume} isFullScreen={true}
            onBack={() => setCurrentView('player')} getVisualizerData={getVisualizerData}
          />
        </div>
      )}

      {currentView === 'help' && (
        <div className="fixed inset-0 z-[110] bg-[var(--bg-dark)]">
          <HelpPage onBack={() => setCurrentView('player')} />
        </div>
      )}
    </div>
  );
}

export default App;
