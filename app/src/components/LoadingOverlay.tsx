import { Loader2, Music } from 'lucide-react';

interface LoadingOverlayProps {
  current: number;
  total: number;
  fileName: string;
}

export function LoadingOverlay({ current, total, fileName }: LoadingOverlayProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="clay-card p-8 rounded-3xl border border-white/10 w-full max-w-sm mx-4 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/30">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white tracking-tight">Importing Media</h3>
            <p className="text-[10px] text-white/40 font-mono truncate uppercase tracking-widest">
              {fileName || 'Processing...'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end text-[10px] font-black tracking-widest uppercase">
            <span className="text-blue-400/80">
              Batch Progress
            </span>
            <span className="text-white/60">
              {current} <span className="text-white/20">/</span> {total}
            </span>
          </div>

          <div className="h-4 w-full bg-black/40 rounded-full p-1 border border-white/5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 transition-all duration-500 rounded-full relative group"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse pointer-events-none" />
              <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-r from-transparent to-white/30 blur-sm" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 grayscale opacity-30">
           <Music className="w-3 h-3 text-blue-400" />
           <span className="text-[8px] font-bold text-white uppercase tracking-[0.3em]">Disco Aura Hi-Fi</span>
        </div>
      </div>
    </div>
  );
}
