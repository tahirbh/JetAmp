import { useState } from 'react';

interface EqualizerProps {
  onGainChange: (bandIndex: number, gain: number) => void;
  trackCount?: number;
}

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, '1K', '2K', '4K', '8K', '16K'];

export function Equalizer({ onGainChange, trackCount = 0 }: EqualizerProps) {
  const [gains, setGains] = useState<number[]>(new Array(10).fill(0));
  const [isEnabled, setIsEnabled] = useState(true);

  const handleGainChange = (index: number, value: number) => {
    const newGains = [...gains];
    newGains[index] = value;
    setGains(newGains);
    onGainChange(index, isEnabled ? value : 0);
  };

  const resetEQ = () => {
    setGains(new Array(10).fill(0));
    EQ_FREQUENCIES.forEach((_, i) => onGainChange(i, 0));
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

  return (
    <div className="flex flex-col gap-1.5 p-3 bg-[var(--bg-panel)]/50 panel-border rounded-lg h-full transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs font-black rainbow-text uppercase tracking-widest">10-Band Equalizer</span>
          <span className="text-[9px] text-gray-400 font-mono tracking-tighter opacity-70">PROFESSIONAL HI-FI</span>
        </div>
        
        <div className="flex items-center gap-2">
           {/* New Playlist Counter in EQ */}
           <div className="hidden lg:flex flex-col items-end mr-2 pr-2 border-r border-white/10">
              <span className="text-[8px] text-gray-500 font-bold uppercase">Tracks</span>
              <span className="text-xs sm:text-sm font-black rainbow-text leading-none">{trackCount.toString().padStart(2, '0')}</span>
           </div>

          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`px-2 py-0.5 text-[10px] rounded transition-all font-bold ${
              isEnabled 
                ? 'bg-gradient-to-b from-cyan-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 ring-1 ring-white/20' 
                : 'bg-[var(--metal-dark)] text-gray-500'
            }`}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={resetEQ}
            className="px-2 py-0.5 text-[10px] bg-[var(--metal-dark)] text-gray-300 rounded hover:bg-[var(--metal-mid)] transition-colors border border-white/5 active:scale-95"
          >
            RESET
          </button>
        </div>
      </div>

      {/* EQ Sliders Container with Rainbow Background Lines */}
      <div className="relative flex-1 flex items-end justify-between gap-1 py-4 px-1 rainbow-lines-bg rounded bg-[var(--bg-dark)]/40 overflow-hidden border border-white/5">
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
          {[...Array(9)].map((_, i) => (
             <div key={i} className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          ))}
        </div>

        {gains.map((gain, index) => (
          <div key={index} className="flex flex-col items-center gap-1 z-10 flex-1">
            <div className="relative h-full flex items-center justify-center w-full">
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={gain}
                onChange={(e) => handleGainChange(index, parseInt(e.target.value))}
                className="eq-slider w-full h-full appearance-none bg-transparent"
                style={{
                  writingMode: 'vertical-lr',
                  direction: 'rtl'
                }}
                disabled={!isEnabled}
              />
            </div>
            <span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-tighter transform scale-90">{EQ_FREQUENCIES[index]}</span>
          </div>
        ))}
      </div>

      {/* Gain Scale Summary - Compact */}
      <div className="flex justify-between text-[7px] sm:text-[8px] text-gray-500 font-bold px-1 flex-shrink-0 uppercase tracking-tighter bg-black/20 rounded-full">
        <span>+12dB</span>
        <span>0dBCENTER</span>
        <span>-12dB</span>
      </div>

      {/* Presets - Fluid Scaling */}
      <div className="flex flex-wrap gap-1 mt-0.5 flex-shrink-0">
        {presets.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyPreset(preset.gains)}
            className="px-2 py-0.5 text-[9px] sm:text-[10px] bg-[var(--metal-dark)]/80 text-gray-300 rounded-sm hover:bg-[var(--glow-cyan)] hover:text-black font-black uppercase transition-all duration-300 hover:-translate-y-0.5"
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
