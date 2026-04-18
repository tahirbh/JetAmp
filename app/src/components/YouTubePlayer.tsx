
import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  volume: number;
  seekTime?: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export function YouTubePlayer({ 
  videoId, 
  isPlaying, 
  volume, 
  seekTime,
  onProgress,
  onEnded 
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);
  const progressInterval = useRef<any>(null);

  // Load YouTube API
  useEffect(() => {
    if (window.YT) {
      setApiReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true);
    };
  }, []);

  // Initialize Player
  useEffect(() => {
    if (!apiReady || !videoId || !containerRef.current) return;

    if (playerRef.current) {
       playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event: any) => {
          event.target.setVolume(volume * 100);
          if (isPlaying) {
             event.target.playVideo();
          } else {
             event.target.pauseVideo();
          }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.ENDED) {
            onEnded?.();
          }
        }
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [apiReady, videoId]);

  // Sync Play/Pause
  useEffect(() => {
    if (playerRef.current?.playVideo) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  // Sync Volume
  useEffect(() => {
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(volume * 100);
    }
  }, [volume]);

  // Handle External Seek
  useEffect(() => {
    if (seekTime !== undefined && playerRef.current?.seekTo) {
      playerRef.current.seekTo(seekTime, true);
    }
  }, [seekTime]);

  // Progress Tracker
  useEffect(() => {
    if (isPlaying && playerRef.current?.getCurrentTime) {
      progressInterval.current = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        onProgress?.(currentTime, duration);
      }, 500);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, onProgress]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5 relative">
      <div ref={containerRef} className="w-full h-full pointer-events-none"></div>
      {/* Overlay to catch clicks and avoid YouTube redirection */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 to-transparent"></div>
    </div>
  );
}
