import { useEffect, useRef, useCallback } from 'react';

interface AuraVisualizerProps {
  getVisualizerData: () => { frequencies: Uint8Array; waveform: Uint8Array } | null;
  isPlaying: boolean;
  barCount?: number;
  mode?: 'sanyo' | 'sony' | 'panasonic' | 'akai' | 'oscilloscope' | 'gunmetal' | 'rainbow';
  isSimulated?: boolean;
}

const STACK_SEGMENTS = 12;
const GAP_SIZE = 2;
const GRAVITY = 0.5; // Controls how fast the peak drops

export function AuraVisualizer({ 
  getVisualizerData, 
  isPlaying, 
  barCount = 24,
  mode = 'sanyo',
  isSimulated = false
}: AuraVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const smoothedDataRef = useRef<number[]>(new Array(64).fill(0));
  const peakHoldRef = useRef<number[]>(new Array(64).fill(0));
  const simulationSeedRef = useRef<number[]>(new Array(64).fill(0).map(() => Math.random()));

  const generateSimulatedData = useCallback(() => {
    const frequencies = new Uint8Array(64);
    const waveform = new Uint8Array(64);
    const time = Date.now() / 1000;

    for (let i = 0; i < 64; i++) {
      if (!isPlaying) {
        frequencies[i] = 0;
        waveform[i] = 128;
        continue;
      }

      // Create a complex pulse using sine waves and noise
      const base = Math.sin(time * 2 + i * 0.2) * 0.5 + 0.5;
      const noise = Math.sin(time * 10 + simulationSeedRef.current[i] * 20) * 0.3;
      const pulse = Math.max(0, (base + noise) * 200);
      
      // Add 'beat' spikes randomly
      const beat = Math.sin(time * 4) > 0.8 ? Math.random() * 50 : 0;
      
      frequencies[i] = Math.min(255, pulse + beat);
      waveform[i] = 128 + Math.sin(time * 20 + i * 0.5) * 50;
    }

    return { frequencies, waveform };
  }, [isPlaying]);

  const getSegmentColor = (segmentIndex: number, totalSegments: number, visualizerMode: string): { color: string; glow: string; peakBase: string } => {
    // ... existing color logic ...
    const ratio = segmentIndex / totalSegments;
    const invRatio = 1 - ratio; // For BGR logic
    
    // Default peak color is bright white
    let peakBase = '#ffffff';

    if (visualizerMode === 'gunmetal') {
       if (ratio < 0.6) {
         const lightness = 20 + ratio * 20; 
         return { color: `hsl(230, 10%, ${lightness}%)`, glow: 'rgba(255, 255, 255, 0.1)', peakBase };
       }
       if (ratio < 0.85) {
         const lightness = 40 + (ratio - 0.6) * 40;
         return { color: `hsl(230, 5%, ${lightness}%)`, glow: 'rgba(255, 255, 255, 0.2)', peakBase };
       }
       return { color: '#991111', glow: '#660000', peakBase: '#ff0000' };
    }

    if (visualizerMode === 'rainbow') {
       const hue = (invRatio) * 360; // Invert to BGR
       return { color: `hsl(${hue}, 80%, 50%)`, glow: `hsla(${hue}, 80%, 50%, 0.5)`, peakBase };
    }

    if (visualizerMode === 'sony') {
      const lightness = 40 + ratio * 40;
      peakBase = '#e0ffff';
      return { color: `hsl(190, 100%, ${lightness}%)`, glow: `hsla(190, 100%, ${lightness}%, 0.4)`, peakBase };
    }

    if (visualizerMode === 'panasonic') {
      const op = 0.6 + ratio * 0.4;
      peakBase = '#ffddaa';
      return { color: `rgba(255, 170, 0, ${op})`, glow: `rgba(255, 170, 0, ${op * 0.5})`, peakBase };
    }

    if (visualizerMode === 'akai') {
      const r = 150 + ratio * 105;
      peakBase = '#ffaaaa';
      return { color: `rgb(${r}, 0, 0)`, glow: `rgba(${r}, 0, 0, 0.5)`, peakBase };
    }

    if (ratio < 0.33) return { color: '#0088ff', glow: 'rgba(0, 136, 255, 0.4)', peakBase }; // Blue
    if (ratio < 0.75) return { color: '#00ff00', glow: 'rgba(0, 255, 0, 0.4)', peakBase }; // Green
    return { color: '#ff0000', glow: 'rgba(255, 0, 0, 0.4)', peakBase }; // Red
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const data = getVisualizerData();

    // Clear background
    ctx.fillStyle = '#020204';
    ctx.fillRect(0, 0, width, height);

    if (mode === 'oscilloscope') {
      // DIGITAL OSCILLOSCOPE
      const waveform = data?.waveform;
      if (!waveform) return;

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00f2ff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00f2ff';
      ctx.beginPath();

      const sliceWidth = width / (waveform.length / 2); // Show only half for clarity
      let x = 0;

      for (let i = 0; i < waveform.length / 2; i++) {
        const v = waveform[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();

      // Scanline effect
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 242, 255, 0.03)';
      for(let i = 0; i < height; i += 4) ctx.fillRect(0, i, width, 1);
    } else {
      // STACKED BARS (All other modes)
      const frequencies = data?.frequencies;
      const paddingX = 10;
      const availableWidth = width - paddingX * 2;
      const barWidth = mode === 'sony' ? (availableWidth - (barCount - 1) * 6) / barCount : (availableWidth - (barCount - 1) * 4) / barCount;
      const barGap = mode === 'sony' ? 6 : 4;
      const smoothing = isSimulated ? 0.3 : 0.75; // Less smoothing for simulation to feel punchy

      for (let i = 0; i < barCount; i++) {
        const logIndex = Math.pow(i / barCount, 1.8);
        const freqIndex = Math.floor(logIndex * (frequencies ? frequencies.length * 0.6 : 0));
        
        let rawValue = 0;
        if (frequencies && freqIndex < frequencies.length) {
          rawValue = frequencies[freqIndex];
        }

        smoothedDataRef.current[i] = smoothedDataRef.current[i] * smoothing + rawValue * (1 - smoothing);
        const value = smoothedDataRef.current[i];
        
        // Peak Logic
        if (value >= peakHoldRef.current[i]) {
          peakHoldRef.current[i] = value;
        } else {
          peakHoldRef.current[i] = Math.max(0, peakHoldRef.current[i] - GRAVITY);
        }

        const intensity = value / 255;
        const peakIntensity = peakHoldRef.current[i] / 255;
        
        const segmentsToShow = Math.floor(intensity * STACK_SEGMENTS);
        const peakSegment = Math.min(STACK_SEGMENTS - 1, Math.floor(peakIntensity * STACK_SEGMENTS));
        
        const x = paddingX + i * (barWidth + barGap);
        const segmentHeight = (height - 20) / (STACK_SEGMENTS + 1);
        

        ctx.shadowBlur = 0; // Disable shadow for background segments
        for (let s = 0; s < STACK_SEGMENTS; s++) {
          const segmentY = height - 10 - (s + 1) * (segmentHeight + GAP_SIZE);
          const { color } = getSegmentColor(s, STACK_SEGMENTS, mode);

          if (s < segmentsToShow) {
            ctx.fillStyle = color;
            ctx.fillRect(x, segmentY, barWidth, segmentHeight);
          } else {
             // Unlit background segments
            ctx.fillStyle = 'rgba(40, 40, 50, 0.15)';
            ctx.fillRect(x, segmentY, barWidth, segmentHeight);
          }
        }

        // Apply GLOW only to the TOP-most lit segment for performance
        if (segmentsToShow > 0) {
          const s = segmentsToShow - 1;
          const segmentY = height - 10 - (s + 1) * (segmentHeight + GAP_SIZE);
          const { color, glow } = getSegmentColor(s, STACK_SEGMENTS, mode);
          ctx.shadowBlur = 15;
          ctx.shadowColor = glow;
          ctx.fillStyle = color;
          ctx.fillRect(x, segmentY, barWidth, segmentHeight);
        }

        // Draw gravity peak bar with glow (only 1 shadow op here)
        if (peakSegment > 0) {
           const peakY = height - 10 - (peakSegment + 1) * (segmentHeight + GAP_SIZE);
           const { peakBase } = getSegmentColor(peakSegment, STACK_SEGMENTS, mode);
           ctx.shadowBlur = 12;
           ctx.shadowColor = peakBase;
           ctx.fillStyle = peakBase;
           ctx.fillRect(x, peakY, barWidth, Math.max(2, segmentHeight / 3));
        }
        ctx.shadowBlur = 0; // Reset for next bar
      }
    }
  }, [getVisualizerData, isPlaying, barCount, mode, isSimulated, generateSimulatedData]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [draw]);

  const displayModes = {
    sanyo: 'Sanyo Spectrum',
    sony: 'Sony Crystal',
    panasonic: 'Panasonic VFD',
    akai: 'AKAI Pro Analog',
    gunmetal: 'Pro Analyzer',
    rainbow: 'Dynamic Rainbow',
    oscilloscope: 'Aura Oscilloscope'
  };

  return (
    <div className="relative w-full h-full spectrum-container overflow-hidden rounded-xl border border-white/5">
      <canvas ref={canvasRef} width={640} height={180} className="w-full h-full" style={{ imageRendering: 'crisp-edges' }} />
      <div className="absolute top-2 left-4 text-[10px] text-[var(--glow-cyan)]/60 font-black tracking-[0.4em] uppercase">
        {displayModes[mode as keyof typeof displayModes] || mode} 
        {isSimulated && <span className="ml-2 text-[8px] opacity-40">(Simulated)</span>}
      </div>
    </div>
  );
}
