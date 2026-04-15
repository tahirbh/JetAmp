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
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-transparent to-[var(--bg-dark)]/40 relative overflow-hidden">
      
      {/* 1. TOP SECTION: Fixed Spectrum Analyzer */}
      <div className="flex-shrink-0 w-full bg-[var(--bg-dark)]/80 backdrop-blur-md border-b border-[var(--metal-dark)]/50 pt-4 pb-2 px-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-20">
        <div className="h-14 sm:h-20 lg:h-24 relative">
          <div className="absolute top-0 left-0 w-full rainbow-line-horizontal" />
          <SanyoSpectrum
            getVisualizerData={getVisualizerData}
            isPlaying={isPlaying}
            barCount={16}
          />
          <div className="absolute bottom-0 left-0 w-full rainbow-line-horizontal" />
        </div>
      </div>

      {/* 2. MIDDLE/BOTTOM SECTION: Track Info + Rotating CD (Fluid) */}
      <div className="flex-1 w-full flex flex-col items-center justify-end min-h-0 relative pb-4 px-4">
        
        {/* Track Info - Now above the CD */}
        <div className="text-center w-full px-4 mb-4 flex-shrink-0 animate-in fade-in slide-in-from-top duration-700">
          <h2 className="text-xl sm:text-3xl lg:text-5xl font-black rainbow-text truncate marquee-on-hover px-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            {currentTrack?.title || 'No Track Selected'}
          </h2>
          <p className="text-sm sm:text-lg lg:text-xl text-gray-400 glow-text-white/80 truncate tracking-[0.3em] uppercase mt-1">
            {currentTrack?.artist || 'Select a track from menu'}
          </p>
        </div>

        {/* Rotating CD - Positioned at the Bottom center of this section */}
        <div className="rotating-cd-container transition-all duration-700 hover:scale-[1.02] z-10 p-2 sm:p-4 mb-2">
          <RotatingCD
            coverUrl={currentTrack?.cover}
            isPlaying={isPlaying}
            size={undefined} 
          />
        </div>

        {/* Progress Bar Container */}
        <div className="w-full max-w-xl flex-shrink-0">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-gray-400 mb-1">
            <span className="glow-text-white/50">{formatTime(currentTime)}</span>
            <span className="glow-text-white/50">{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="1"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1 sm:h-2"
          />
        </div>
      </div>

      {/* 4. FIXED BOTTOM: Transport Controls */}
      <div className="flex-shrink-0 flex flex-col gap-2 pt-2 bg-[var(--bg-dark)]/90 backdrop-blur-md border-t border-[var(--metal-dark)]/50 -mx-4 px-4 pb-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
        <div className="flex items-center justify-center gap-1 sm:gap-4 md:gap-6 flex-shrink-0 py-1 scale-[0.9] sm:scale-100 origin-center transition-transform duration-300">
          <button
            onClick={onToggleShuffle}
            className={`glow-btn p-2 sm:p-2.5 rounded-full transition-all duration-300 ${shuffleMode ? 'bg-[var(--glow-cyan)]/20 text-[var(--glow-cyan)]' : 'text-gray-400'}`}
          >
            <Shuffle className="w-4 h-4 sm:w-5 h-5 lg:w-6 h-6" />
          </button>

          <button
            onClick={onPrev}
            className="glow-btn p-2.5 sm:p-3 lg:p-4 rounded-full active:scale-90"
          >
            <SkipBack className="w-4 h-4 sm:w-5 h-5 lg:w-6 h-6" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="glow-btn glow-btn-play p-3 sm:p-4 lg:p-6 rounded-full active:scale-95 group transition-all duration-300"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 sm:w-7 h-7 lg:w-8 h-8" />
            ) : (
              <Play className="w-5 h-5 sm:w-7 h-7 lg:w-8 h-8 ml-1 group-hover:drop-shadow-[0_0_15px_white]" />
            )}
          </button>

          <button
            onClick={onNext}
            className="glow-btn p-2.5 sm:p-3 lg:p-4 rounded-full active:scale-90"
          >
            <SkipForward className="w-4 h-4 sm:w-5 h-5 lg:w-6 h-6" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`glow-btn p-2 sm:p-2.5 rounded-full relative transition-all duration-300 ${repeatMode !== 'none' ? 'bg-[var(--glow-cyan)]/20 text-[var(--glow-cyan)]' : 'text-gray-400'}`}
          >
            <Repeat className="w-4 h-4 sm:w-5 h-5 lg:w-6 h-6" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-[var(--glow-cyan)] text-black rounded-full w-4 h-4 flex items-center justify-center font-bold">
                1
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 px-2 flex-shrink-0 mt-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Volume2 className="w-3 h-3 sm:w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 h-1 sm:h-2"
            />
          </div>

          <div className="flex-shrink-0 text-right">
             <span className="text-[10px] sm:text-[11px] font-black rainbow-text uppercase tracking-widest leading-none">
               {playlist.length} TRACKS
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
