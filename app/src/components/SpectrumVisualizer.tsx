import { useEffect, useRef, useCallback } from 'react';

interface SpectrumVisualizerProps {
  getVisualizerData: () => { frequencies: Uint8Array; waveform: Uint8Array } | null;
  isPlaying: boolean;
  barCount?: number;
}

// Frequency bands for logarithmic distribution (like studio equalizers)
// Lower frequencies get more bands
const getFrequencyBands = (barCount: number): { start: number; end: number }[] => {
  const bands: { start: number; end: number }[] = [];
  
  // Logarithmic distribution - more bands for lower frequencies
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount;
    // Use exponential curve to emphasize lower frequencies
    const logT = Math.pow(t, 2.5);
    const nextLogT = Math.pow((i + 1) / barCount, 2.5);
    
    bands.push({
      start: logT,
      end: nextLogT
    });
  }
  
  return bands;
};

export function SpectrumVisualizer({ 
  getVisualizerData, 
  isPlaying, 
  barCount = 28 
}: SpectrumVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const smoothedDataRef = useRef<number[]>(new Array(barCount).fill(0));
  const frequencyBands = useRef(getFrequencyBands(barCount));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const data = getVisualizerData();

    // Clear canvas with dark background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, width, height);

    // Draw background grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Get frequency data
    let frequencies: Uint8Array | null = null;
    if (data?.frequencies) {
      frequencies = data.frequencies;
    }

    // Calculate bar dimensions
    const padding = 4;
    const availableWidth = width - padding * 2;
    const barWidth = (availableWidth - (barCount - 1) * 2) / barCount;
    const barGap = 2;

    // Draw spectrum bars
    const smoothing = 0.7; // Smoothing factor for bar movement
    
    for (let i = 0; i < barCount; i++) {
      const band = frequencyBands.current[i];
      
      // Calculate average frequency value for this band
      let sum = 0;
      let count = 0;
      
      if (frequencies) {
        const startIdx = Math.floor(band.start * (frequencies.length - 1));
        const endIdx = Math.floor(band.end * (frequencies.length - 1));
        
        for (let j = startIdx; j <= endIdx && j < frequencies.length; j++) {
          // Apply Hamming window-like weighting (emphasize middle of band)
          const bandT = (j - startIdx) / (endIdx - startIdx + 1);
          const windowWeight = 0.54 - 0.46 * Math.cos(2 * Math.PI * bandT);
          sum += frequencies[j] * windowWeight;
          count++;
        }
      }
      
      const rawValue = count > 0 ? sum / count : 0;
      
      // Smooth the value
      smoothedDataRef.current[i] = smoothedDataRef.current[i] * smoothing + rawValue * (1 - smoothing);
      const value = smoothedDataRef.current[i];
      
      // Calculate bar height
      const maxBarHeight = height - 24;
      const barHeight = (value / 255) * maxBarHeight;
      
      const x = padding + i * (barWidth + barGap);
      const y = height - barHeight - 4;

      // Create gradient for bar
      const gradient = ctx.createLinearGradient(0, height - 4, 0, y);
      
      // Color based on amplitude (classic visualizer colors)
      const intensity = value / 255;
      if (intensity > 0.85) {
        // Red for high intensity
        gradient.addColorStop(0, '#00ff44');
        gradient.addColorStop(0.5, '#ffff00');
        gradient.addColorStop(1, '#ff4444');
      } else if (intensity > 0.6) {
        // Yellow for medium-high
        gradient.addColorStop(0, '#00ff66');
        gradient.addColorStop(0.7, '#ffff00');
        gradient.addColorStop(1, '#ffaa00');
      } else if (intensity > 0.3) {
        // Green-yellow
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#88ff00');
      } else {
        // Green for low
        gradient.addColorStop(0, '#008844');
        gradient.addColorStop(1, '#00ff88');
      }

      // Draw bar with glow effect
      ctx.shadowBlur = intensity > 0.5 ? 12 : 6;
      ctx.shadowColor = intensity > 0.7 ? '#ffaa00' : '#00ff88';
      ctx.fillStyle = gradient;
      
      // Draw rounded bar
      const cornerRadius = Math.min(3, barWidth / 2);
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [cornerRadius, cornerRadius, 0, 0]);
      ctx.fill();
      
      ctx.shadowBlur = 0;

      // Draw peak indicator (small line at top)
      if (intensity > 0.8) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y - 2, barWidth, 2);
      }
    }

    // Draw waveform overlay at the bottom
    if (data?.waveform) {
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const waveform = data.waveform;
      const sliceWidth = width / waveform.length;
      const waveHeight = height * 0.25;
      const waveY = height - waveHeight / 2;
      
      for (let i = 0; i < waveform.length; i++) {
        const v = (waveform[i] - 128) / 128;
        const y = waveY + v * waveHeight / 2;
        
        if (i === 0) {
          ctx.moveTo(0, y);
        } else {
          ctx.lineTo(i * sliceWidth, y);
        }
      }
      ctx.stroke();
    }

    // Draw frequency labels at bottom
    ctx.fillStyle = '#444466';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('32Hz', padding + barWidth / 2, height - 2);
    ctx.fillText('16kHz', width - padding - barWidth / 2, height - 2);
    ctx.fillText('1kHz', width / 2, height - 2);

  }, [getVisualizerData, isPlaying, barCount]);

  useEffect(() => {
    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={600}
        height={150}
        className="w-full h-full rounded"
        style={{ imageRendering: 'crisp-edges' }}
      />
      {/* Title overlay */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] text-[#00ff88]/50 font-mono tracking-widest">
        SPECTRUM ANALYZER
      </div>
    </div>
  );
}
