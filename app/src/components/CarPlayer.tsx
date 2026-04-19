import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Volume2
} from 'lucide-react';
import { RotatingCD } from './RotatingCD';
import { YouTubePlayer } from './YouTubePlayer';
import { AuraVisualizer } from './AuraVisualizer';
import type { Track } from '@/types';

interface CarPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffleMode: boolean;
  playlist: Track[];
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleShuffle: () => void;
  onToggleEqualizer: () => void;
  getVisualizerData: () => { frequencies: Uint8Array; waveform: Uint8Array } | null;
  visualizerStyle?: 'sanyo' | 'sony' | 'panasonic' | 'akai' | 'oscilloscope' | 'gunmetal' | 'rainbow';
  seekTime?: number;
  onYouTubeProgress?: (currentTime: number, duration: number) => void;
}

export function CarPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffleMode,
  playlist,
  onPlay,
  onPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleEqualizer,
  getVisualizerData,
  visualizerStyle = 'sanyo',
  seekTime,
  onYouTubeProgress,
}: CarPlayerProps) {
  const [bassLevel, setBassLevel] = useState(0);
  const [forceDashMode, setForceDashMode] = useState(false);
  const frameRef = useRef<number | undefined>(undefined);

  const isYouTube = currentTrack?.source === 'youtube';
  const isCinemaMode = isYouTube && !forceDashMode;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // REACTIVE BASS CALCULATION & SIMULATED SPECTRUM
  useEffect(() => {
    const update = () => {
      const isYouTube = currentTrack?.source === 'youtube';
      
      if (isPlaying) {
        if (!isYouTube && getVisualizerData) {
          const data = getVisualizerData();
          if (data?.frequencies) {
            let sum = 0;
            for (let i = 0; i < 8; i++) sum += data.frequencies[i] || 0;
            setBassLevel(sum / (8 * 255));
          }
        } else if (isYouTube) {
          // Simulated bass/beat detection for YouTube - scaled by VOLUME
          const time = Date.now() / 1000;
          const simulatedBass = (Math.sin(time * 8) * 0.5 + 0.5) * 0.4 * volume; // Pulse scaled by volume
          setBassLevel(simulatedBass);
        }
      } else {
        setBassLevel(0);
      }
      frameRef.current = requestAnimationFrame(update);
    };
    frameRef.current = requestAnimationFrame(update);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [getVisualizerData, isPlaying, currentTrack, volume]);

  // Enhanced visualizer data source (Pulse Simulation)
  const getCombinedVisualizerData = () => {
    const isYouTube = currentTrack?.source === 'youtube';
    if (isYouTube) {
      const frequencies = new Uint8Array(256);
      const waveform = new Uint8Array(256);
      const time = Date.now() / 100;
      for (let i = 0; i < 256; i++) {
        frequencies[i] = (Math.sin(time + i * 0.1) * 0.5 + 0.5) * 150 * (1 - i/256) * volume;
        waveform[i] = 128 + Math.sin(time * 2 + i * 0.05) * 50 * volume;
      }
      return { frequencies, waveform };
    }
    return getVisualizerData();
  };

  return (
    <div className={`grid ${isCinemaMode ? 'grid-rows-[auto_1fr]' : 'grid-rows-[auto_1fr_auto]'} h-full w-full bg-gradient-to-b from-transparent to-[var(--bg-dark)]/40 relative overflow-hidden transition-all duration-700`}>
      
      {/* 1. TOP ROW: Fixed Spectrum Analyzer (Always visible in Top Spectrum Area) */}
      <div className="w-full bg-[var(--bg-dark)]/90 backdrop-blur-md border-b border-[var(--metal-dark)]/50 pt-2 pb-1 px-4 shadow-[0_5px_15px_rgba(0,0,0,0.6)] z-20 overflow-hidden top-spectrum-area">
        <div className="h-16 sm:h-20 lg:h-32 relative">
          <div className="absolute top-0 left-0 w-full rainbow-line-horizontal !opacity-30" />
          <AuraVisualizer
            getVisualizerData={getCombinedVisualizerData}
            isPlaying={isPlaying}
            barCount={24}
            mode={visualizerStyle}
            isSimulated={isYouTube}
          />
          <div className="absolute bottom-0 left-0 w-full rainbow-line-horizontal !opacity-30" />
        </div>
      </div>

      {/* 2. MIDDLE ROW: Content Area (CD or YouTube Player) */}
      <div className={`w-full flex items-center justify-center px-4 mb-2 min-h-0 relative ${!isCinemaMode ? '-mt-2' : ''}`}>
        
        {/* Layered Content Container */}
        <div className={`relative rotating-cd-container w-full h-full flex items-center justify-center ${!isCinemaMode ? 'max-w-[340px] max-h-[340px] aspect-square mt-6 mx-auto' : 'max-w-none mt-0 w-full'} ${isYouTube ? 'landscape-full-height' : ''}`}>
          
          {/* Layer 1: Content (CD or Video) */}
          <div className={`z-10 w-full h-full flex flex-col items-center justify-center ${isYouTube ? 'landscape-full-height' : ''} ${!isCinemaMode ? '' : 'rounded-xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]'}`}>
            
            {isYouTube && !isCinemaMode && (
              <div className="w-full text-center mb-4 animate-in fade-in slide-in-from-top duration-700 landscape-hide">
                <h2 className="text-sm sm:text-lg lg:text-2xl font-black rainbow-text truncate px-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] uppercase">
                  {currentTrack?.title}
                </h2>
                <div className="h-[2px] w-24 mx-auto bg-gradient-to-r from-transparent via-[var(--glow-cyan)] to-transparent opacity-50 mb-2"></div>
              </div>
            )}

            <div className="flex-1 w-full flex items-center justify-center relative">
              {isYouTube ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <YouTubePlayer 
                    videoId={currentTrack?.path || ''} 
                    isPlaying={isPlaying} 
                    volume={volume}
                    seekTime={seekTime}
                    onProgress={onYouTubeProgress}
                    onEnded={onNext}
                    showNativeControls={isCinemaMode} 
                  />
                  {!isCinemaMode && <div className="absolute inset-0 z-10" />}
                </div>
              ) : (
                <RotatingCD
                  coverUrl={currentTrack?.cover}
                  isPlaying={isPlaying}
                  size={undefined} 
                  bassLevel={bassLevel}
                />
              )}
            </div>
          </div>

          {/* Layer 2: Dashboard Overlays (Hidden in Cinema Mode) */}
          {!isCinemaMode && (
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
          )}

          {/* Cinema Floating Dash Toggle */}
          {isYouTube && (
            <button 
              onClick={() => setForceDashMode(!forceDashMode)}
              className="absolute bottom-4 right-4 z-50 bg-black/60 backdrop-blur-md border border-white/20 text-[8px] sm:text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full hover:bg-[var(--glow-cyan)]/20 hover:text-[var(--glow-cyan)] transition-all pointer-events-auto shadow-2xl"
            >
              {isCinemaMode ? 'VIEW DASH' : 'VIEW CINEMA'}
            </button>
          )}
        </div>

        {/* BOTTOM RESPONSIVE SPECTRUM (Visible only in bottom spectrum area) */}
        <div className="absolute bottom-0 left-0 w-full h-10 z-50 pointer-events-none hidden bottom-spectrum-area">
           <AuraVisualizer
              getVisualizerData={getCombinedVisualizerData}
              isPlaying={isPlaying}
              barCount={32}
              mode={visualizerStyle}
              isSimulated={isYouTube}
            />
        </div>
      </div>

      {/* 3. BOTTOM ROW: Transport Controls (HIDDEN IN CINEMA or LANDSCAPE FOR YT) */}
      {!isCinemaMode && (
        <div className={`flex flex-col bg-transparent backdrop-blur-none -mx-4 px-4 pb-2 z-20 relative -mt-8 ${isYouTube ? 'landscape-hide' : ''}`}>
          
          {/* Progress Bar Container */}
          <div className="w-full max-w-lg self-center px-4 flex-shrink-0 mt-0.5 mb-0.5">
            <div className="flex items-center justify-between text-[7px] sm:text-[10px] font-mono text-gray-400 scale-75 sm:scale-90 relative">
              <span>{formatTime(currentTime)}</span>
              {(duration > 28 && duration < 32) && (
                <span className="absolute left-1/2 -translate-x-1/2 text-[6px] sm:text-[8px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-bold tracking-widest animate-pulse">
                  30s PREVIEW
                </span>
              )}
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0.01}
              step="0.1"
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full aura-slider h-6 my-1"
            />
          </div>

          {/* Transport Controls - CLAYMORPHISM STYLE */}
          <div className="flex items-center justify-center gap-1 sm:gap-4 md:gap-6 flex-shrink-0 scale-[0.65] sm:scale-[0.85] 2xl:scale-100 origin-center transition-transform duration-300 py-0 pb-1">
            <button
              onClick={onToggleShuffle}
              className={`clay-btn btn-short p-3 rounded-xl transition-all duration-300 ${shuffleMode ? 'clay-btn-active' : ''}`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={onPrev}
              className="clay-btn btn-short p-4 rounded-xl active:scale-90"
            >
              <SkipBack className="w-5 h-5 sm:w-6 h-6" />
            </button>

            <button
              onClick={isPlaying ? onPause : onPlay}
              className="clay-btn p-5 sm:p-6 rounded-full active:scale-95 group transition-all duration-300 bg-gradient-to-br from-[var(--glow-green)] to-[#0088ff] text-black shadow-[0_0_30px_rgba(0,255,136,0.5)] border-none"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 translate-x-1" />
              )}
            </button>

            <button
              onClick={onNext}
              className="clay-btn btn-short p-4 rounded-xl active:scale-90"
            >
              <SkipForward className="w-5 h-5 sm:w-6 h-6" />
            </button>

            <button
              onClick={onToggleEqualizer}
              className={`clay-btn btn-short p-3 rounded-xl relative group overflow-hidden ${currentTrack?.source === 'youtube' ? 'opacity-30 grayscale pointer-events-none' : ''}`}
            >
               <div className="text-[10px] font-black group-hover:scale-110 transition-transform">EQ</div>
               {currentTrack?.source !== 'youtube' && <div className="absolute inset-0 bg-[var(--glow-cyan)]/10 animate-pulse" />}
            </button>
          </div>

          {/* Volume Row */}
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
                className="flex-1 aura-slider h-5"
              />
            </div>

            <div className="flex-shrink-0 text-right">
               <span className="text-[8px] sm:text-[10px] font-black rainbow-text uppercase tracking-widest">
                 {playlist.length} TRACKS
               </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
