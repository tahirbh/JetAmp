import { useEffect, useRef, useCallback } from 'react';

interface SanyoSpectrumProps {
  getVisualizerData: () => { frequencies: Uint8Array; waveform: Uint8Array } | null;
  isPlaying: boolean;
  barCount?: number;
}

// Sanyo-style spectrum: Each "bar" is actually a stack of segments with gaps
// Bottom: Light Green -> Middle: Cyan Blue -> Top: Red -> Gap -> White peak bar
const STACK_SEGMENTS = 12; // Number of segments per bar stack
const GAP_SIZE = 2; // Gap between segments

export function SanyoSpectrum({ 
  getVisualizerData, 
  isPlaying, 
  barCount = 20 
}: SanyoSpectrumProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const smoothedDataRef = useRef<number[]>(new Array(barCount).fill(0));

  // Get color for segment based on its position in the stack
  const getSegmentColor = (segmentIndex: number, totalSegments: number): { color: string; glow: string } => {
    const ratio = segmentIndex / totalSegments;
    
    // Bottom 40%: Light Green
    if (ratio < 0.4) {
      return { 
        color: `hsl(${120 + ratio * 50}, 100%, ${50 + ratio * 20}%)`,
        glow: '#00ff88'
      };
    }
    // Middle 35%: Cyan to Blue
    else if (ratio < 0.75) {
      const cyanRatio = (ratio - 0.4) / 0.35;
      return { 
        color: `hsl(${180 - cyanRatio * 40}, 100%, 50%)`,
        glow: '#00d4ff'
      };
    }
    // Top 25%: Red
    else {
      return { 
        color: `hsl(0, 100%, ${40 + (1 - ratio) * 20}%)`,
        glow: '#ff4444'
      };
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const data = getVisualizerData();

    // Clear with dark background
    ctx.fillStyle = '#020204';
    ctx.fillRect(0, 0, width, height);

    // Get frequency data
    let frequencies: Uint8Array | null = null;
    if (data?.frequencies) {
      frequencies = data.frequencies;
    }

    // Calculate bar dimensions
    const paddingX = 10;
    const availableWidth = width - paddingX * 2;
    const barWidth = (availableWidth - (barCount - 1) * 4) / barCount;
    const barGap = 4;

    const smoothing = 0.75;

    for (let i = 0; i < barCount; i++) {
      // Map to frequency with emphasis on lower frequencies
      const logIndex = Math.pow(i / barCount, 1.8);
      const freqIndex = Math.floor(logIndex * (frequencies ? frequencies.length * 0.6 : 0));
      
      let rawValue = 0;
      if (frequencies && freqIndex < frequencies.length) {
        // Average a few bins for smoother response
        const bins = 3;
        let sum = 0;
        let count = 0;
        for (let b = 0; b < bins; b++) {
          const idx = freqIndex + b;
          if (idx < frequencies.length) {
            sum += frequencies[idx];
            count++;
          }
        }
        rawValue = count > 0 ? sum / count : 0;
      }

      // Smooth the value
      smoothedDataRef.current[i] = smoothedDataRef.current[i] * smoothing + rawValue * (1 - smoothing);
      const value = smoothedDataRef.current[i];
      
      // Calculate how many segments to light up
      const intensity = value / 255;
      const segmentsToShow = Math.floor(intensity * STACK_SEGMENTS);
      
      const x = paddingX + i * (barWidth + barGap);
      const segmentHeight = (height - 20) / (STACK_SEGMENTS + 1); // +1 for peak bar
      
      // Draw segment stack
      for (let s = 0; s < STACK_SEGMENTS; s++) {
        const segmentY = height - 10 - (s + 1) * (segmentHeight + GAP_SIZE);
        const { color, glow } = getSegmentColor(s, STACK_SEGMENTS);
        
        // Determine if this segment should be lit
        const isLit = s < segmentsToShow;
        const isPeakSegment = s === segmentsToShow - 1 && intensity > 0.85;
        
        if (isLit) {
          // Lit segment with glow
          ctx.shadowBlur = isPeakSegment ? 25 : 15;
          ctx.shadowColor = isPeakSegment ? '#ffffff' : glow;
          ctx.fillStyle = isPeakSegment ? '#ffffff' : color;
          ctx.fillRect(x, segmentY, barWidth, segmentHeight);
          ctx.shadowBlur = 0;
          
          // Inner highlight
          ctx.fillStyle = isPeakSegment ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
          ctx.fillRect(x, segmentY, barWidth, 2);
        } else {
          // Unlit segment (dim)
          ctx.fillStyle = 'rgba(40, 40, 50, 0.5)';
          ctx.fillRect(x, segmentY, barWidth, segmentHeight);
          
          // Subtle border
          ctx.strokeStyle = 'rgba(60, 60, 70, 0.3)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, segmentY, barWidth, segmentHeight);
        }
      }
      
      // Draw white peak bar at top (with gap)
      const peakY = height - 10 - (STACK_SEGMENTS + 1) * (segmentHeight + GAP_SIZE);
      const showPeak = intensity > 0.9;
      
      if (showPeak) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, peakY, barWidth, segmentHeight);
        ctx.shadowBlur = 0;
        
        // Glow around peak
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x - 2, peakY - 2, barWidth + 4, segmentHeight + 4);
        ctx.shadowBlur = 0;
      } else {
        // Dim peak bar
        ctx.fillStyle = 'rgba(60, 60, 70, 0.3)';
        ctx.fillRect(x, peakY, barWidth, segmentHeight);
      }
    }

    // Draw frequency labels
    ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('60Hz', paddingX + barWidth / 2, height - 2);
    ctx.fillText('16kHz', width - paddingX - barWidth / 2, height - 2);

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
    <div className="relative w-full h-full spectrum-container overflow-hidden">
      <canvas
        ref={canvasRef}
        width={500}
        height={180}
        className="w-full h-full"
        style={{ imageRendering: 'crisp-edges' }}
      />
      {/* Title */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-[var(--glow-green)]/60 font-mono tracking-[0.3em] glow-text-green">
        SPECTRUM ANALYZER
      </div>
    </div>
  );
}
