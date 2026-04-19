import { useEffect, useState } from 'react';
import { Music, Disc2, Zap } from 'lucide-react';

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [status, setStatus] = useState('Initializing Core Engine...');

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setOpacity(0), 500);
            setTimeout(onComplete, 1200);
            return 100;
          }
          const next = prev + Math.random() * 15;
          if (next > 30) setStatus('Calibrating Audio Visualizers...');
          if (next > 60) setStatus('Syncing Discovery Hub...');
          if (next > 85) setStatus('Ready to Aura');
          return next;
        });
      }, 100);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-1000 ease-in-out"
      style={{ opacity }}
    >
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full" />
      
      <div className="relative flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-1000">
        {/* Animated Logo Container */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-110 animate-pulse" />
          <div className="relative clay-card p-8 rounded-full border border-white/10 shadow-[0_0_50px_rgba(0,100,255,0.2)]">
            <div className="relative animate-spin-slow">
              <Disc2 className="w-24 h-24 text-blue-400 stroke-[1.5]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <Music className="w-8 h-8 text-white stroke-[2] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
          </div>
          
          {/* Decorative Sparks */}
          <div className="absolute -top-4 -right-4 animate-bounce">
            <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />
          </div>
        </div>

        {/* Text and Progress */}
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-1">
             <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
               Jet<span className="rainbow-text">Amp</span>
             </h1>
             <p className="text-[10px] font-black tracking-[0.4em] text-blue-400/60 uppercase">
               Hi-Fi Audio Visualizer
             </p>
          </div>

          <div className="w-64 space-y-2">
            <div className="flex justify-between items-end px-1">
              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest animate-pulse">
                {status}
              </span>
              <span className="text-[10px] font-mono text-blue-400">{Math.floor(progress)}%</span>
            </div>
            <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(0,150,255,0.5)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 text-white/10 text-[9px] font-bold tracking-[0.5em] uppercase">
        V1.0.3 Digital Audio Workstation
      </div>
    </div>
  );
}
