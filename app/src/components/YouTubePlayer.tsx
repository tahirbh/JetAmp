
import { useEffect, useRef } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
}

export function YouTubePlayer({ videoId, isPlaying }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // We use postMessage to communicate with the YouTube IFrame API if needed,
    // but for a simple implementation, we just update the src with autoplay.
    // However, to toggle play/pause without reloading, we'd need the full API.
    // For now, let's use the simplest embed.
  }, [isPlaying]);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5 relative">
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full pointer-events-none"
        allow="autoplay; encrypted-media"
        allowFullScreen
      ></iframe>
      {/* Overlay to catch clicks if we want to custom handle them, but kept simple for now */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 to-transparent"></div>
    </div>
  );
}
