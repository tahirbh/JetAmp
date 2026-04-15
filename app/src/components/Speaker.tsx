import { useEffect, useRef } from 'react';

interface SpeakerProps {
  side: 'left' | 'right';
  getVisualizerData: () => { frequencies: Uint8Array; waveform: Uint8Array } | null;
  isPlaying: boolean;
}

export function Speaker({ side, getVisualizerData, isPlaying }: SpeakerProps) {
  const midRangeRef = useRef<HTMLDivElement>(null);
  const wooferRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (midRangeRef.current) midRangeRef.current.style.transform = 'scale(1)';
      if (wooferRef.current) wooferRef.current.style.transform = 'scale(1)';
      return;
    }

    const update = () => {
      const data = getVisualizerData();
      if (data) {
        let bassSum = 0;
        let midSum = 0;
        
        for (let i = 0; i < 10; i++) bassSum += data.frequencies[i];
        for (let i = 20; i < 60; i++) midSum += data.frequencies[i];

        const bassAvg = bassSum / 10;
        const midAvg = midSum / 40;

        if (wooferRef.current) {
          wooferRef.current.style.transform = `scale(${1 + (bassAvg / 255) * 0.12})`;
        }
        if (midRangeRef.current) {
          midRangeRef.current.style.transform = `scale(${1 + (midAvg / 255) * 0.08})`;
        }
      }
      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, getVisualizerData]);

  return (
    <div className={`flex flex-col h-full glass-panel relative overflow-hidden speaker-column ${side === 'left' ? 'border-r-0 rounded-r-none' : 'border-l-0 rounded-l-none'}`}>
      
      <div className="flex-1 flex flex-col p-2 gap-4 2xl:gap-8 items-center justify-center relative overflow-y-auto w-full">
        <div className="text-xs sm:text-sm 2xl:text-xl font-bold tracking-[0.2em] uppercase mb-1 glow-text-pink text-center">
          ROYAL HI-FI / {side}
        </div>

        {/* Royal Tweeter */}
        <div className="w-10 h-10 sm:w-14 sm:h-14 2xl:w-24 2xl:h-24 rounded-full bg-gradient-to-br from-[#1a1a25] to-[#0a0a10] border-2 border-double border-[#cb9b51] relative flex items-center justify-center shadow-[0_0_15px_rgba(203,155,81,0.3)] group transition-all duration-500">
          <div className="absolute -inset-0.5 rounded-full border border-[#f6e27a]/40 rainbow-glow opacity-90" />
          <div className="w-[60%] h-[60%] rounded-full bg-gradient-to-br from-[#2a2a3a] to-[#12121a] border border-[var(--glow-pink)]/40 z-10" />
          <div className="absolute inset-0 rounded-full border border-white/10 pointer-events-none z-20" />
        </div>

        {/* Royal Mid-range */}
        <div 
          ref={midRangeRef}
          className="w-20 h-20 sm:w-28 sm:h-28 2xl:w-48 2xl:h-48 rounded-full bg-gradient-to-br from-[#12121e] to-[#050508] border-4 border-double border-[#cb9b51] relative flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-all duration-[40ms] ease-out will-change-transform group"
        >
          <div className="absolute -inset-1 rounded-full border-2 border-[#f6e27a]/30 rainbow-glow opacity-80" />
          <div className="w-[70%] h-[70%] rounded-full bg-[#0a0a0f] border-2 border-[#3a3a4a] flex items-center justify-center z-10 shadow-inner">
              <div className="w-[40%] h-[40%] rounded-full bg-gradient-to-br from-[var(--glow-pink)]/20 to-transparent border border-[var(--glow-pink)]/40" />
          </div>
        </div>

        {/* Royal Woofer */}
        <div 
          ref={wooferRef}
          className="w-32 h-32 sm:w-44 sm:h-44 2xl:w-80 2xl:h-80 rounded-full bg-gradient-to-br from-[#0f0f15] to-[#020204] border-[8px] border-double border-[#cb9b51] relative flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.9)] transition-all duration-[40ms] ease-out will-change-transform group"
        >
          <div className="absolute -inset-2 rounded-full border-2 border-[#f6e27a]/20 rainbow-glow opacity-70" />
          <div className="w-[75%] h-[75%] rounded-full bg-[#050508] border-4 border-[#2a2a3a] flex items-center justify-center relative overflow-hidden z-10 shadow-[inset_0_0_30px_rgba(0,0,0,1)]">
              <div className="absolute inset-0 opacity-20 bg-[conic-gradient(from_0deg,_transparent,_rgba(203,155,81,0.2)_45deg,_transparent_90deg)]" />
              <div className="w-[40%] h-[40%] rounded-full bg-gradient-to-br from-[#1a1a25] to-[#050508] border-2 border-[#cb9b51]/40 shadow-inner relative">
                <div className="absolute inset-0 rounded-full border border-[var(--glow-pink)]/20 animate-pulse" />
              </div>
          </div>
          <div className="absolute -inset-1 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] pointer-events-none z-20" />
        </div>
      </div>
    </div>
  );
}
