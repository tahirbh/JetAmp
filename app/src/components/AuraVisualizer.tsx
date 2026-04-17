import { useEffect, useRef, useCallback } from 'react';

interface AuraVisualizerProps {
  getVisualizerData: () => { frequencies: Uint8Array; waveform: Uint8Array } | null;
  isPlaying: boolean;
  barCount?: number;
  mode?: 'sanyo' | 'oscilloscope' | 'gunmetal' | 'rainbow';
}

const STACK_SEGMENTS = 12;
const GAP_SIZE = 2;

export function AuraVisualizer({ 
  getVisualizerData, 
  isPlaying, 
  barCount = 24,
  mode = 'sanyo'
}: AuraVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const smoothedDataRef = useRef<number[]>(new Array(64).fill(0));

  const getSegmentColor = (segmentIndex: number, totalSegments: number, visualizerMode: string): { color: string; glow: string } => {
    const ratio = segmentIndex / totalSegments;
    
    if (visualizerMode === 'gunmetal') {
       if (ratio < 0.6) {
         const lightness = 20 + ratio * 20; 
         return { color: `hsl(230, 10%, ${lightness}%)`, glow: 'rgba(255, 255, 255, 0.1)' };
       }
       if (ratio < 0.85) {
         const lightness = 40 + (ratio - 0.6) * 40;
         return { color: `hsl(230, 5%, ${lightness}%)`, glow: 'rgba(255, 255, 255, 0.2)' };
       }
       return { color: '#991111', glow: '#660000' };
    }

    if (visualizerMode === 'rainbow') {
       const hue = (segmentIndex / totalSegments) * 360;
       return { color: `hsl(${hue}, 80%, 50%)`, glow: `hsla(${hue}, 80%, 50%, 0.5)` };
    }

    // Default Sanyo Rainbow (Green -> Yellow -> Red)
    if (ratio < 0.6) return { color: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' }; // Green
    if (ratio < 0.85) return { color: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' }; // Yellow
    return { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' }; // Red
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

    if (mode === 'sanyo' || mode === 'gunmetal' || mode === 'rainbow') {
      const frequencies = data?.frequencies;
      const paddingX = 10;
      const availableWidth = width - paddingX * 2;
      const barWidth = (availableWidth - (barCount - 1) * 4) / barCount;
      const barGap = 4;
      const smoothing = 0.75;

      for (let i = 0; i < barCount; i++) {
        const logIndex = Math.pow(i / barCount, 1.8);
        const freqIndex = Math.floor(logIndex * (frequencies ? frequencies.length * 0.6 : 0));
        
        let rawValue = 0;
        if (frequencies && freqIndex < frequencies.length) {
          rawValue = frequencies[freqIndex];
        }

        smoothedDataRef.current[i] = smoothedDataRef.current[i] * smoothing + rawValue * (1 - smoothing);
        const value = smoothedDataRef.current[i];
        const intensity = value / 255;
        const segmentsToShow = Math.floor(intensity * STACK_SEGMENTS);
        const x = paddingX + i * (barWidth + barGap);
        const segmentHeight = (height - 20) / (STACK_SEGMENTS + 1);
        
        for (let s = 0; s < STACK_SEGMENTS; s++) {
          const segmentY = height - 10 - (s + 1) * (segmentHeight + GAP_SIZE);
          const { color, glow } = getSegmentColor(s, STACK_SEGMENTS, mode);
          if (s < segmentsToShow) {
            ctx.shadowBlur = s < segmentsToShow - 1 ? 0 : 15; // Only glow the top segment
            ctx.shadowColor = glow;
            ctx.fillStyle = color;
            ctx.fillRect(x, segmentY, barWidth, segmentHeight);
          } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(40, 40, 50, 0.15)';
            ctx.fillRect(x, segmentY, barWidth, segmentHeight);
          }
        }
      }
    } else {
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
    }
  }, [getVisualizerData, isPlaying, barCount, mode]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [draw]);

  return (
    <div className="relative w-full h-full spectrum-container overflow-hidden rounded-xl border border-white/5">
      <canvas ref={canvasRef} width={640} height={180} className="w-full h-full" style={{ imageRendering: 'crisp-edges' }} />
      <div className="absolute top-2 left-4 text-[10px] text-[var(--glow-cyan)]/60 font-black tracking-[0.4em] uppercase">
        {mode === 'sanyo' ? 'Signal Spectrum' : mode === 'gunmetal' ? 'Pro Analyzer' : mode === 'rainbow' ? 'Dynamic Rainbow' : 'Aura Oscilloscope'}
      </div>
    </div>
  );
}
