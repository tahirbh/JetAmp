import { useRef, useCallback, useEffect, useState } from 'react';
import type { Track } from '@/types';

interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  
  const [state, setState] = useState<AudioEngineState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7
  });

  // Initialize audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create analyzer for visualizer
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Create gain node for volume
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = state.volume;
      gainNodeRef.current = gainNode;

      // Create EQ bands (10-band equalizer)
      const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      eqNodesRef.current = frequencies.map(freq => {
        const filter = audioContextRef.current!.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });
    }
  }, [state.volume]);

  // Load track
  const loadTrack = useCallback((track: Track) => {
    initAudioContext();
    
    if (audioElementRef.current) {
      audioElementRef.current.src = track.url;
      audioElementRef.current.load();
    } else {
      const audio = new Audio(track.url);
      audio.crossOrigin = 'anonymous';
      audioElementRef.current = audio;

      // Connect audio element to context
      if (audioContextRef.current && !sourceNodeRef.current) {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audio);
        
        // Connect: source -> EQ chain -> gain -> analyser -> destination
        let lastNode: AudioNode = sourceNodeRef.current;
        
        // Connect EQ nodes in series
        eqNodesRef.current.forEach(eqNode => {
          lastNode.connect(eqNode);
          lastNode = eqNode;
        });
        
        lastNode.connect(gainNodeRef.current!);
        gainNodeRef.current!.connect(analyserRef.current!);
        analyserRef.current!.connect(audioContextRef.current.destination);
      }

      // Event listeners
      audio.addEventListener('play', () => {
        setState(prev => ({ ...prev, isPlaying: true }));
      });
      
      audio.addEventListener('pause', () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      });
      
      audio.addEventListener('timeupdate', () => {
        setState(prev => ({ 
          ...prev, 
          currentTime: audio.currentTime,
          duration: audio.duration || 0
        }));
      });
      
      audio.addEventListener('loadedmetadata', () => {
        setState(prev => ({ ...prev, duration: audio.duration }));
      });
      
      audio.addEventListener('ended', () => {
        setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      });
    }
  }, [initAudioContext]);

  // Playback controls
  const play = useCallback(() => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    audioElementRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioElementRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clampedVolume;
    }
    setState(prev => ({ ...prev, volume: clampedVolume }));
  }, []);

  const setEQGain = useCallback((bandIndex: number, gain: number) => {
    if (eqNodesRef.current[bandIndex]) {
      eqNodesRef.current[bandIndex].gain.value = gain;
    }
  }, []);

  // Get visualizer data
  const getVisualizerData = useCallback(() => {
    if (!analyserRef.current) return null;
    
    const frequencies = new Uint8Array(analyserRef.current.frequencyBinCount);
    const waveform = new Uint8Array(analyserRef.current.frequencyBinCount);
    
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

  return {
    ...state,
    loadTrack,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setEQGain,
    getVisualizerData
  };
}
