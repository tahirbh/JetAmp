import { useEffect, useRef } from 'react';
import { Disc } from 'lucide-react';

interface RotatingCDProps {
  coverUrl?: string;
  isPlaying: boolean;
  size?: number;
  bassLevel?: number; // 0 to 1
}

export function RotatingCD({ coverUrl, isPlaying, size = 200, bassLevel = 0 }: RotatingCDProps) {
  const cdRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);

  // Reactive Aura Scaling
  const auraScale = isPlaying ? 1 + (bassLevel * 0.4) : 1;
  const auraOpacity = isPlaying ? 0.3 + (bassLevel * 0.5) : 0.2;
  const auraBlur = isPlaying ? 20 + (bassLevel * 30) : 15;

  useEffect(() => {
    if (!isPlaying) {
      if (cdRef.current) cdRef.current.style.transition = 'transform 0.5s ease-out';
      return;
    }

    if (cdRef.current) cdRef.current.style.transition = 'none';

    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      
      // Rotate at ~33 RPM (vinyl speed)
      rotationRef.current = (rotationRef.current + delta * 0.18) % 360;
      
      if (cdRef.current) {
        cdRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <div 
      className="relative flex items-center justify-center transition-all duration-500"
      style={{ width: size, height: size }}
    >
      {/* Outer reactive aura ring */}
      <div 
        className="absolute inset-0 rounded-full transition-all duration-75"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 70%)',
          filter: `blur(${auraBlur}px)`,
          opacity: auraOpacity,
          transform: `scale(${auraScale})`,
        }}
      />
      
      {/* Bass Shockwave (only visible on heavy peaks) */}
      <div 
        className="absolute inset-0 rounded-full border-4 border-[var(--glow-cyan)] opacity-0 transition-all duration-75"
        style={{
          opacity: bassLevel > 0.8 ? (bassLevel - 0.8) * 2 : 0,
          transform: `scale(${1 + (bassLevel * 0.8)})`,
          filter: 'blur(10px)',
        }}
      />
      
      {/* CD Container */}
      <div 
        ref={cdRef}
        className="relative rounded-full overflow-hidden will-change-transform"
        style={{
          width: size * 1.0,
          height: size * 1.0,
        }}
      >
        {/* CD Base */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: coverUrl 
              ? `url(${coverUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, #1a1a2e 0%, #0a0a15 50%, #1a1a2e 100%)',
            boxShadow: `
              inset 0 0 40px rgba(0,0,0,0.6),
              0 0 20px rgba(0,212,255,0.2)
            `,
            border: coverUrl ? 'none' : '2px solid rgba(255,255,255,0.05)'
          }}
        />
        
        {/* CD Grooves (concentric rings) */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          viewBox="0 0 100 100"
        >
          {[...Array(8)].map((_, i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={15 + i * 5}
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="0.3"
            />
          ))}
        </svg>
        
        {/* Center hole */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            background: 'linear-gradient(135deg, #0a0a15 0%, #1a1a2e 100%)',
            boxShadow: `
              inset 0 2px 4px rgba(0,0,0,0.8),
              0 1px 2px rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Inner label */}
          <div className="absolute inset-2 rounded-full bg-[var(--bg-dark)] flex items-center justify-center">
            <Disc 
              size={size * 0.06} 
              className={`${isPlaying ? 'text-[var(--glow-green)]' : 'text-gray-600'}`}
            />
          </div>
        </div>
        
        {/* Light reflection */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            transform: 'rotate(-30deg)',
          }}
        />
      </div>
      
      {/* Playing indicator ring */}
      {isPlaying && (
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'var(--glow-green)',
            borderRightColor: 'var(--glow-cyan)',
            borderBottomColor: 'var(--glow-green)',
            borderLeftColor: 'var(--glow-cyan)',
            animation: 'spin-cd 2s linear infinite',
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
}
