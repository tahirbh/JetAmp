import { useState } from 'react';
import { ArrowLeft, RotateCcw, Zap, Shield } from 'lucide-react';

interface EqualizerProps {
  onGainChange: (bandIndex: number, gain: number) => void;
  onBassChange: (gain: number) => void;
  onTrebleChange: (gain: number) => void;
  onVolumeChange: (volume: number) => void;
  currentVolume?: number;
  isFullScreen?: boolean;
  onBack?: () => void;
}

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, '1K', '2K', '4K', '8K', '16K'];

export function Equalizer({ 
  onGainChange, 
  onBassChange,
  onTrebleChange,
  onVolumeChange,
  currentVolume = 0.7,
  isFullScreen = false,
  onBack 
}: EqualizerProps) {
  const [gains, setGains] = useState<number[]>(new Array(10).fill(0));
  const [bass, setBass] = useState(0);
  const [treble, setTreble] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);

  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
    onGainChange(index, isEnabled ? value : 0);
  };

  const handleBassChange = (value: number) => {
    setBass(value);
    onBassChange(isEnabled ? value : 0);
  };

  const handleTrebleChange = (value: number) => {
    setTreble(value);
    onTrebleChange(isEnabled ? value : 0);
  };

  const resetEQ = () => {
    setGains(new Array(10).fill(0));
    setBass(0);
    setTreble(0);
    EQ_FREQUENCIES.forEach((_, i) => onGainChange(i, 0));
    onBassChange(0);
    onTrebleChange(0);
  };

  const presets = [
    { name: 'FLAT', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    { name: 'POP', gains: [2, 3, 4, 3, 1, 0, 1, 3, 4, 3] },
    { name: 'ROCK', gains: [4, 3, 2, 1, 0, 0, 2, 4, 5, 5] },
    { name: 'JAZZ', gains: [3, 4, 3, 2, 1, 2, 3, 4, 3, 2] },
    { name: 'CLASSIC', gains: [5, 4, 3, 2, 1, 1, 2, 3, 4, 5] },
    { name: 'BASS', gains: [6, 5, 4, 3, 2, 1, 0, 0, 0, 0] },
  ];

  const applyPreset = (presetGains: number[]) => {
    setGains(presetGains);
    presetGains.forEach((gain, i) => onGainChange(i, isEnabled ? gain : 0));
  };

  // Helper for Knob UI
  const Knob = ({ label, value, min, max, onChange, colorClass = "from-cyan-500 to-blue-600" }: any) => {
    const percentage = ((value - min) / (max - min)) * 100;
    const rotation = (percentage * 270 / 100) - 135; // -135deg to +135deg

    return (
      <div className="flex flex-col items-center gap-3">
        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{label}</span>
        <div 
          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[var(--metal-dark)] to-black border-4 border-gray-800 shadow-[2px_4px_10px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.05)] cursor-pointer active:scale-95 transition-transform"
          onClick={() => {
             // Basic click logic for demo/fallback or use actual rotation event
          }}
        >
          {/* Indicator light */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-black shadow-[0_0_5px_cyan]" />
          
          {/* Knob handle */}
          <div 
            className="absolute inset-0 transition-transform duration-200"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div className={`absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-6 rounded-full bg-gradient-to-b ${colorClass} shadow-[0_0_10px_rgba(0,0,0,0.5)]`} />
          </div>

          {/* Value Display Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 flex items-center justify-center">
                <span className="text-xs font-mono font-black text-white">{value > 0 ? `+${value}` : value}</span>
             </div>
          </div>
        </div>

        {/* Input slider hidden or below for actual control */}
        <input 
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-20 sm:w-24 h-1 appearance-none bg-gray-800 rounded-full overflow-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-0 [&::-webkit-slider-thumb]:shadow-[-100vw_0_0_100vw_var(--glow-cyan)]"
        />
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-[var(--bg-dark)] ${isFullScreen ? 'p-4 sm:p-8 lg:p-10' : 'p-3'} overflow-hidden`}>
      
      {/* 1. LAYERED HEADER */}
      <div className="flex items-center justify-between mb-4 sm:mb-8 flex-shrink-0">
        <div className="flex items-center gap-4 sm:gap-6">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 sm:p-3 bg-[var(--metal-dark)] rounded-full hover:bg-[var(--metal-mid)] border border-white/10 active:scale-90 transition-all shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 h-6 text-white" />
            </button>
          )}
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-3xl font-black rainbow-text uppercase tracking-tighter">Signal Laboratory</h1>
            <div className="flex items-center gap-2">
               <Shield className="w-2.5 h-2.5 text-[var(--glow-cyan)]" />
               <span className="text-[8px] sm:text-[10px] text-gray-500 font-mono tracking-widest uppercase">Disco Aura Signal Processing</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 scale-90 sm:scale-100 origin-right">
           <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`group relative overflow-hidden px-4 sm:px-8 py-2 sm:py-3 rounded-xl transition-all font-black uppercase tracking-tighter text-[10px] sm:text-base ${
              isEnabled 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-800 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)]' 
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            <div className="relative z-10 flex items-center gap-2">
              <Zap className={`w-3 h-3 sm:w-4 h-4 ${isEnabled ? 'text-yellow-400 animate-pulse' : ''}`} />
              {isEnabled ? 'SYSTEM ACTIVE' : 'BYPASS'}
            </div>
          </button>

          <button
            onClick={resetEQ}
            className="p-2 sm:p-3 bg-gray-800 text-gray-400 rounded-full hover:text-white border border-white/5 active:rotate-180 transition-all duration-500"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTROL GRID - OPTIMIZED FOR HORIZONTAL */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_350px] gap-4 sm:gap-8 min-h-0 overflow-hidden">
        
        {/* LEFT PANEL: PRECISION SLIDERS */}
        <div className="flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 rainbow-line-horizontal !opacity-50" />
          
          <div className="flex items-center justify-between mb-4 px-1 sm:px-2">
             <span className="text-[10px] sm:text-xs font-black text-gray-500 tracking-[0.2em] sm:tracking-[0.4em] uppercase">10-Band Graphic EQ</span>
             <div className="flex gap-2 text-[8px] sm:text-[10px] font-mono text-cyan-500/50">
                <span>DIGITAL MASTER</span>
             </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-1 sm:gap-4 relative px-1 sm:px-2">
             {/* Dynamic Scale Line */}
             <div className="absolute inset-0 flex flex-col justify-between py-10 sm:py-12 pointer-events-none">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="w-full h-[1px] bg-white/5" />
                ))}
             </div>

             {gains.map((gain, index) => (
               <div key={index} className="flex flex-col items-center gap-2 sm:gap-4 h-full z-10 flex-1">
                 <div className="relative h-full flex items-center justify-center w-full group">
                   <input
                     type="range"
                     min="-12"
                     max="12"
                     step="1"
                     value={gain}
                     onChange={(e) => handleGainChange(index, parseInt(e.target.value))}
                     className="eq-slider-vertical w-4 sm:w-6 h-full appearance-none bg-transparent cursor-pointer"
                     style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                     disabled={!isEnabled}
                   />
                   <div className="absolute -top-6 sm:-top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-500 text-black text-[8px] sm:text-[10px] font-black px-1 rounded-sm">
                      {gain > 0 ? `+${gain}` : gain}
                   </div>
                 </div>
                 <span className="text-[8px] sm:text-xs text-gray-500 font-mono tracking-tighter truncate w-full text-center">
                   {EQ_FREQUENCIES[index]}
                 </span>
               </div>
             ))}
          </div>
        </div>

        {/* RIGHT PANEL: POWER KNOBS (SCALED FOR LANDSCAPE) */}
        <div className="flex flex-col gap-4 sm:gap-6 overflow-y-auto pr-1">
           {/* Knobs Section */}
           <div className="bg-gradient-to-b from-gray-900 to-black border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-8 flex flex-col gap-6 sm:gap-8 shadow-2xl">
              <div className="flex justify-between items-center px-1 sm:px-2 gap-2">
                 <Knob label="BASS" value={bass} min={0} max={15} onChange={handleBassChange} colorClass="from-orange-500 to-red-600" />
                 <Knob label="TREBLE" value={treble} min={0} max={15} onChange={handleTrebleChange} colorClass="from-green-500 to-emerald-600" />
              </div>
              <div className="flex justify-center border-t border-white/5 pt-6 sm:pt-8">
                 <Knob label="MASTER" value={Math.round(currentVolume * 100)} min={0} max={100} onChange={(v: number) => onVolumeChange(v/100)} colorClass="from-cyan-400 to-blue-500" />
              </div>
           </div>

           {/* Preset Lab */}
           <div className="bg-black/60 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-white/5">
              <span className="text-[10px] sm:text-xs font-black text-gray-500 tracking-[0.2em] uppercase mb-3 block">Presets</span>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.gains)}
                    className="px-2 py-2 sm:py-3 text-[9px] sm:text-[10px] bg-gray-800/50 text-gray-300 rounded-lg sm:rounded-xl hover:bg-[var(--glow-cyan)] hover:text-black font-black uppercase transition-all duration-300 active:scale-95 border border-white/5"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
