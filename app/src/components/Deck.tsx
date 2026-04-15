import { Play, Pause, Square, SkipBack, SkipForward, Upload } from 'lucide-react';
import type { Track } from '@/types';
import { formatTime } from '@/lib/utils';

interface DeckProps {
  deckId: 'A' | 'B';
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onVolumeChange: (volume: number) => void;
  onLoadTrack: () => void;
}

export function Deck({
  deckId,
  currentTrack,
  isPlaying,
  currentTime,
  volume,
  onPlay,
  onPause,
  onStop,
  onPrev,
  onNext,
  onVolumeChange,
  onLoadTrack
}: DeckProps) {
  const duration = currentTrack?.duration || 0;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 p-3 bg-[var(--ja-bg-panel)] panel-border rounded-lg">
      {/* Deck Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded flex items-center justify-center text-sm font-bold ${
            isPlaying ? 'bg-[var(--ja-accent-blue)] text-white' : 'bg-[var(--ja-metal-dark)] text-gray-400'
          }`}>
            {deckId}
          </div>
          <span className="text-xs text-gray-400 uppercase tracking-wider">Deck {deckId}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-[10px] text-gray-500">{isPlaying ? 'PLAY' : 'STOP'}</span>
        </div>
      </div>

      {/* LCD Display */}
      <div className="lcd-screen rounded p-3 min-h-[100px]">
        {/* Track Info */}
        <div className="mb-2">
          <div className="lcd-text text-[var(--ja-lcd-text)] text-sm truncate">
            {currentTrack?.title || 'NO TRACK LOADED'}
          </div>
          <div className="lcd-text text-[var(--ja-lcd-dim)] text-xs truncate">
            {currentTrack?.artist || 'Waiting for audio...'}
          </div>
        </div>

        {/* Time Display */}
        <div className="flex items-center justify-between">
          <div className="lcd-text text-[var(--ja-lcd-text)] text-lg">
            {formatTime(currentTime)}
          </div>
          <div className="lcd-text text-[var(--ja-lcd-dim)] text-sm">
            / {formatTime(duration)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 h-2 bg-[#1a1a1f] rounded overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[var(--ja-lcd-dim)] to-[var(--ja-lcd-text)] transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-1">
        <button 
          onClick={onPrev}
          className="metal-btn w-10 h-10 rounded flex items-center justify-center text-gray-300 hover:text-white"
        >
          <SkipBack size={18} />
        </button>
        <button 
          onClick={onStop}
          className="metal-btn w-10 h-10 rounded flex items-center justify-center text-gray-300 hover:text-white"
        >
          <Square size={16} />
        </button>
        <button 
          onClick={isPlaying ? onPause : onPlay}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${
            isPlaying 
              ? 'bg-gradient-to-b from-amber-600 to-amber-800 shadow-lg shadow-amber-900/50' 
              : 'bg-gradient-to-b from-green-600 to-green-800 shadow-lg shadow-green-900/50'
          }`}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
        </button>
        <button 
          onClick={onNext}
          className="metal-btn w-10 h-10 rounded flex items-center justify-center text-gray-300 hover:text-white"
        >
          <SkipForward size={18} />
        </button>
        <button 
          onClick={onLoadTrack}
          className="metal-btn w-10 h-10 rounded flex items-center justify-center text-gray-300 hover:text-white"
        >
          <Upload size={16} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] text-gray-500 w-8">VOL</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="flex-1 volume-slider"
        />
        <span className="text-[10px] text-gray-500 w-8 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
}
