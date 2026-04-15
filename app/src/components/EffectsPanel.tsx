import { useState } from 'react';
import { Volume2, Speaker, Radio, Zap, Wind } from 'lucide-react';

interface EffectsState {
  reverb: boolean;
  surround: boolean;
  xBass: boolean;
  wide: boolean;
}

interface EffectsPanelProps {
  onEffectsChange?: (effects: EffectsState) => void;
}

export function EffectsPanel({ onEffectsChange }: EffectsPanelProps) {
  const [effects, setEffects] = useState<EffectsState>({
    reverb: false,
    surround: false,
    xBass: false,
    wide: false
  });

  const toggleEffect = (key: keyof EffectsState) => {
    const newEffects = { ...effects, [key]: !effects[key] };
    setEffects(newEffects);
    onEffectsChange?.(newEffects);
  };

  const effectButtons = [
    { key: 'reverb' as const, label: 'REVERB', icon: Wind },
    { key: 'surround' as const, label: 'SURROUND', icon: Speaker },
    { key: 'xBass' as const, label: 'X-BASS', icon: Volume2 },
    { key: 'wide' as const, label: 'WIDE', icon: Zap },
  ];

  return (
    <div className="flex flex-col gap-2 p-3 bg-[var(--ja-bg-panel)] panel-border rounded-lg">
      <span className="text-xs text-gray-400 uppercase tracking-wider">Sound Effects</span>
      
      <div className="grid grid-cols-2 gap-2">
        {effectButtons.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => toggleEffect(key)}
            className={`flex flex-col items-center gap-1 p-2 rounded transition-all ${
              effects[key]
                ? 'bg-gradient-to-b from-[var(--ja-accent-blue)] to-[var(--ja-accent-blue)]/70 text-white shadow-lg shadow-blue-500/30'
                : 'bg-[var(--ja-metal-dark)] text-gray-400 hover:bg-[var(--ja-metal-mid)]'
            }`}
          >
            <Icon size={16} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Additional Controls */}
      <div className="mt-2 pt-2 border-t border-[var(--ja-bg-dark)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-gray-500">BALANCE</span>
          <input
            type="range"
            min="-100"
            max="100"
            defaultValue="0"
            className="w-20"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500">PITCH</span>
          <input
            type="range"
            min="-10"
            max="10"
            defaultValue="0"
            className="w-20"
          />
        </div>
      </div>

      {/* Radio Mode */}
      <div className="mt-2 pt-2 border-t border-[var(--ja-bg-dark)]">
        <button className="w-full flex items-center justify-center gap-2 p-2 bg-[var(--ja-metal-dark)] text-gray-400 rounded hover:bg-[var(--ja-metal-mid)] transition-colors">
          <Radio size={14} />
          <span className="text-[10px]">INTERNET RADIO</span>
        </button>
      </div>
    </div>
  );
}
