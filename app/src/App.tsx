import { useState, useRef, useCallback, useEffect } from 'react';
import { CarPlayer } from '@/components/CarPlayer';
import { CarPlaylist } from '@/components/CarPlaylist';
import { Speaker } from '@/components/Speaker';
import { Equalizer } from '@/components/Equalizer';
import { TopMenu } from '@/components/TopMenu';
import { URLDialog } from '@/components/URLDialog';
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
  // Remove extension
  const name = filename.replace(/\.[^/.]+$/, '');
  
  // Try to split by common separators
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

  // State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [shuffleMode, setShuffleMode] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [filters, setFilters] = useState<BiquadFilterNode[]>([]);
  const [isURLDialogOpen, setIsURLDialogOpen] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('car-audio-library');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Note: URL.createObjectURL for local files won't work across reloads 
        // unless they are re-scanned, so we clear the URLs or handle them.
        setPlaylist(parsed.map((t: Track) => ({ ...t, url: '' })));
      } catch (e) {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem('car-audio-library', JSON.stringify(playlist.map(t => ({
        ...t, url: '' // Don't save transient URLs
      }))));
    }
  }, [playlist]);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // Create analyzer
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyserRef.current = analyser;

      // Create gain node
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = volume;
      gainNodeRef.current = gainNode;
    }
  }, [volume]);

  // Setup audio graph
  const setupAudioGraph = useCallback((audio: HTMLAudioElement) => {
    if (!audioContextRef.current || !analyserRef.current || !gainNodeRef.current) return;

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
        filters.forEach(f => f.disconnect());
      } catch (e) {}
    }

    const context = audioContextRef.current;
    
    // Create EQ filters if they don't exist
    let currentFilters = filters;
    if (filters.length === 0) {
      const freqs = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      currentFilters = freqs.map(freq => {
        const filter = context.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });
      setFilters(currentFilters);
    }

    sourceNodeRef.current = context.createMediaElementSource(audio);
    
    // Connect chain: Source -> Filters[0...N] -> Gain -> Analyser -> Destination
    let lastNode: AudioNode = sourceNodeRef.current;
    currentFilters.forEach(filter => {
      lastNode.connect(filter);
      lastNode = filter;
    });

    lastNode.connect(gainNodeRef.current);
    gainNodeRef.current.connect(analyserRef.current);
    analyserRef.current.connect(context.destination);
  }, [filters]);

  // Load track
  const loadTrack = useCallback(async (track: Track) => {
    initAudio();

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    if (!track.url) {
      console.warn('Track URL is missing. This usually happens after a refresh. Please re-load your folder.');
      return;
    }

    const audio = new Audio(track.url);
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audioElementRef.current = audio;

    setupAudioGraph(audio);

    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      handleTrackEnd();
    });

    setCurrentTrack(track);
    setCurrentTime(0);
  }, [initAudio, setupAudioGraph]);

  // Handle track end
  const handleTrackEnd = useCallback(() => {
    if (repeatMode === 'one' && currentTrack) {
      if (audioElementRef.current) {
        audioElementRef.current.currentTime = 0;
        audioElementRef.current.play();
      }
    } else if (playlist.length > 0) {
      playNext();
    }
  }, [repeatMode, currentTrack, playlist.length]);

  // Play
  const play = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    
    if (audioElementRef.current && !audioElementRef.current.src) {
       console.warn('No audio source loaded. Attempting to reload first track.');
       if (playlist.length > 0) await loadTrack(playlist[0]);
    }
    
    try {
      await audioElementRef.current?.play();
    } catch (e) {
      console.error('Playback failed:', e);
    }
  }, [currentTrack, playlist, loadTrack]);

  // Pause
  const pause = useCallback(() => {
    audioElementRef.current?.pause();
  }, []);

  // Seek
  const seek = useCallback((time: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Volume change
  const changeVolume = useCallback((vol: number) => {
    setVolume(vol);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = vol;
    }
  }, []);

  // EQ change
  const handleGainChange = useCallback((index: number, gain: number) => {
    if (filters[index]) {
      filters[index].gain.value = gain;
    }
  }, [filters]);

  // Play next
  const playNext = useCallback(async () => {
    if (!currentTrack || playlist.length === 0) return;

    let nextIndex: number;
    if (shuffleMode) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
      nextIndex = (currentIndex + 1) % playlist.length;
    }

    await loadTrack(playlist[nextIndex]);
    play();
  }, [currentTrack, playlist, shuffleMode, loadTrack, play]);

  // Play previous
  const playPrev = useCallback(async () => {
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex <= 0 ? playlist.length - 1 : currentIndex - 1;

    await loadTrack(playlist[prevIndex]);
    play();
  }, [currentTrack, playlist, loadTrack, play]);

  // Toggle repeat
  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none');
  }, []);

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setShuffleMode(prev => !prev);
  }, []);

  // Handle folder files selected
  const handleFilesSelected = useCallback(async (files: File[]) => {
    // Clear previous playlist for a fresh load
    setPlaylist([]);
    setCurrentTrack(null);
    pause();

    const newTracks: Track[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Scanning removed from UI

      const { title, artist } = parseFilename(file.name);
      const metadata = await parseAudioMetadata(file);
      const cover = await fetchAlbumArt(artist, title);

      const track: Track = {
        id: generateId(),
        title,
        artist,
        album: 'Unknown Album',
        duration: metadata.duration || 0,
        url: URL.createObjectURL(file),
        path: file.webkitRelativePath || file.name,
        cover: cover || undefined
      };

      newTracks.push(track);
    }

    setPlaylist(prev => [...prev, ...newTracks]);

    // Auto-play first track if none playing
    if (!isPlaying && newTracks.length > 0) {
      if (!currentTrack) {
        await loadTrack(newTracks[0]);
      }
      play();
    }
  }, [currentTrack, isPlaying, loadTrack, play]);

  // Handle URL submitted
  const handleURLSubmit = useCallback(async (url: string) => {
    // Basic title from URL
    const title = url.split('/').pop() || 'Network Stream';
    
    const track: Track = {
      id: generateId(),
      title,
      artist: 'Network Stream',
      album: 'Online',
      duration: 0,
      url: url,
      path: url,
    };

    setPlaylist(prev => [track, ...prev]);
    loadTrack(track);
  }, [loadTrack]);

  // New Menu Handlers
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

  // Remove track from playlist
  const removeTrack = useCallback((trackId: string) => {
    setPlaylist(prev => prev.filter(t => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      pause();
      setCurrentTrack(null);
    }
  }, [currentTrack, pause]);

  // Get visualizer data
  const getVisualizerData = useCallback(() => {
    if (!analyserRef.current) return null;

    const frequencyBinCount = analyserRef.current.frequencyBinCount;
    const frequencies = new Uint8Array(frequencyBinCount);
    const waveform = new Uint8Array(frequencyBinCount);

    analyserRef.current.getByteFrequencyData(frequencies);
    analyserRef.current.getByteTimeDomainData(waveform);

    return { frequencies, waveform };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      audioElementRef.current?.pause();
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-[var(--bg-dark)] flex flex-col overflow-hidden">
      <TopMenu 
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onOpenURL={() => setIsURLDialogOpen(true)}
        onPlay={play}
        onPause={pause}
        onStop={() => { pause(); seek(0); }}
        onPrev={playPrev}
        onNext={playNext}
        isPlaying={isPlaying}
      />

      {/* Hi-Fi 4-Column Layout */}
      <div className="flex-1 flex car-layout">
        
        {/* Column 1: Speaker Left - Responsive Width */}
        <div className="hidden md:block md:w-[18%] lg:w-[20%] xl:w-[22%] h-full overflow-hidden border-r border-[var(--metal-dark)]/50 speaker-column">
          <Speaker 
            side="left" 
            isPlaying={isPlaying} 
            getVisualizerData={getVisualizerData} 
          />
        </div>

        {/* Column 2: Player Core - 100% Mobile, Fluid Desktop */}
        <div className="w-full md:flex-1 flex flex-col h-full overflow-hidden border-r border-[var(--metal-dark)] relative z-10 bg-[var(--bg-panel)]/30 backdrop-blur-sm">
          <CarPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            repeatMode={repeatMode}
            shuffleMode={shuffleMode}
            playlist={playlist}
            onPlay={play}
            onPause={pause}
            onPrev={playPrev}
            onNext={playNext}
            onSeek={seek}
            onVolumeChange={changeVolume}
            onToggleRepeat={toggleRepeat}
            onToggleShuffle={toggleShuffle}
            getVisualizerData={getVisualizerData}
          />
        </div>

        {/* Column 3: Playlist & Equalizer - Responsive Width */}
        <div className="hidden md:flex md:w-[22%] lg:w-[25%] xl:w-[28%] h-full flex-col overflow-hidden border-r border-[var(--metal-dark)]/50">
          {/* Playlist - Top 50% */}
          <div className="h-1/2 overflow-hidden border-b border-[var(--metal-dark)]/50">
            <CarPlaylist
              tracks={playlist}
              currentTrack={currentTrack}
              onSelectTrack={(track) => {
                loadTrack(track);
                play();
              }}
              onRemoveTrack={removeTrack}
            />
          </div>
          {/* Equalizer - Bottom 50% */}
          <div className="h-1/2 overflow-hidden bg-[var(--bg-card)]/50 p-4">
            <Equalizer onGainChange={handleGainChange} trackCount={playlist.length} />
          </div>
        </div>

        {/* Column 4: Speaker Right - Responsive Width */}
        <div className="hidden md:block md:w-[18%] lg:w-[20%] xl:w-[22%] h-full overflow-hidden speaker-column">
          <Speaker 
            side="right" 
            isPlaying={isPlaying} 
            getVisualizerData={getVisualizerData} 
          />
        </div>
      </div>

      <URLDialog 
        isOpen={isURLDialogOpen}
        onClose={() => setIsURLDialogOpen(false)}
        onSubmit={handleURLSubmit}
      />
    </div>
  );
}

export default App;
