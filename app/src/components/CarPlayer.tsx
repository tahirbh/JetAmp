import {
  Play, Pause, SkipBack, SkipForward,
  Repeat, Shuffle, Volume2
} from 'lucide-react';
import { RotatingCD } from './RotatingCD';
import { SanyoSpectrum } from './SanyoSpectrum';
import type { Track } from '@/types';

interface CarPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: 'none' | 'one' | 'all';
  shuffleMode: boolean;
  playlist: Track[];
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleRepeat: () => void;
  onToggleShuffle: () => void;
  getVisualizerData: () => { frequencies: Uint8Array; waveform: Uint8Array } | null;
}

export function CarPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  repeatMode,
  shuffleMode,
  playlist,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleRepeat,
  onToggleShuffle,
  getVisualizerData,
}: CarPlayerProps) {
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-full w-full bg-gradient-to-b from-transparent to-[var(--bg-dark)]/40 relative overflow-hidden">
      
      {/* 1. TOP ROW: Fixed Spectrum Analyzer (Strict Height) */}
      <div className="w-full bg-[var(--bg-dark)]/90 backdrop-blur-md border-b border-[var(--metal-dark)]/50 pt-2 pb-1 px-4 shadow-[0_5px_15px_rgba(0,0,0,0.6)] z-20 overflow-hidden">
        <div className="h-10 sm:h-12 lg:h-20 relative">
          <div className="absolute top-0 left-0 w-full rainbow-line-horizontal !opacity-30" />
          <SanyoSpectrum
            getVisualizerData={getVisualizerData}
            isPlaying={isPlaying}
            barCount={20}
          />
          <div className="absolute bottom-0 left-0 w-full rainbow-line-horizontal !opacity-30" />
        </div>
      </div>

      {/* 2. MIDDLE ROW: Content Area (Text-Over-CD Overlay) */}
      <div className="w-full flex items-center justify-center px-4 -mt-4 mb-2 min-h-0 relative">
        
        {/* Layered Content Container */}
        <div className="relative rotating-cd-container w-full h-full flex items-center justify-center max-h-[300px] aspect-square">
          
          {/* Layer 1: Rotating CD (Behind) */}
          <div className="z-10 w-full h-full flex items-center justify-center">
            <RotatingCD
              coverUrl={currentTrack?.cover}
              isPlaying={isPlaying}
              size={undefined} 
            />
          </div>

          {/* Layer 2: Track Info Overlay (Front & Centered) */}
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center pointer-events-none px-6">
            <div className="bg-black/20 backdrop-blur-[2px] p-4 rounded-full border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
              <h2 className="text-xs sm:text-xl lg:text-3xl font-black rainbow-text truncate max-w-[200px] sm:max-w-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {currentTrack?.title || 'No Track Selected'}
              </h2>
              <p className="text-[6px] sm:text-[9px] lg:text-sm text-white font-bold glow-text-white/80 truncate tracking-[0.3em] uppercase mt-1">
                {currentTrack?.artist || 'Select a track'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: Ultra-Transparent Transport Controls */}
      <div className="flex flex-col bg-transparent backdrop-blur-none -mx-4 px-4 pb-2 z-20 relative -mt-8">
        
        {/* Progress Bar Container - Ultra Tight */}
        <div className="w-full max-w-lg self-center px-4 flex-shrink-0 mt-0.5 mb-0.5">
          <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono text-gray-400 scale-75 sm:scale-90">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="1"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-0.5 my-0.5 opacity-60"
          />
        </div>

        {/* Transport Controls - COMPACT SCALING for Smartphones */}
        <div className="flex items-center justify-center gap-1 sm:gap-4 md:gap-6 flex-shrink-0 scale-[0.55] sm:scale-[0.75] 2xl:scale-100 origin-center transition-transform duration-300 py-0 pb-1">
          <button
            onClick={onToggleShuffle}
            className={`glow-btn p-3 rounded-full transition-all duration-300 ${shuffleMode ? 'bg-[var(--glow-cyan)]/20 text-[var(--glow-cyan)]' : 'text-gray-400'}`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={onPrev}
            className="glow-btn p-4 rounded-full active:scale-90"
          >
            <SkipBack className="w-5 h-5 sm:w-6 h-6" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="glow-btn glow-btn-play p-4 sm:p-5 rounded-full active:scale-95 group transition-all duration-300"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1 group-hover:drop-shadow-[0_0_15px_white]" />
            )}
          </button>

          <button
            onClick={onNext}
            className="glow-btn p-4 rounded-full active:scale-90"
          >
            <SkipForward className="w-5 h-5 sm:w-6 h-6" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`glow-btn p-3 rounded-full relative transition-all duration-300 ${repeatMode !== 'none' ? 'bg-[var(--glow-cyan)]/20 text-[var(--glow-cyan)]' : 'text-gray-400'}`}
          >
            <Repeat className="w-5 h-5" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-[var(--glow-cyan)] text-black rounded-full w-4 h-4 flex items-center justify-center font-bold">
                1
              </span>
            )}
          </button>
        </div>

        {/* Volume & Details Row (Micro/Compact View) */}
        <div className="flex items-center gap-4 px-4 flex-shrink-0 -mt-2 scale-90 sm:scale-100">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Volume2 className="w-3 h-3 text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-0.5"
            />
          </div>

          <div className="flex-shrink-0 text-right">
             <span className="text-[8px] sm:text-[10px] font-black rainbow-text uppercase tracking-widest">
               {playlist.length} TRACKS
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
