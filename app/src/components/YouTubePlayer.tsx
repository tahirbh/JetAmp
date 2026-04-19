
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
  showNativeControls?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
}

export function YouTubePlayer({ 
  videoId, 
  isPlaying, 
  volume, 
  seekTime,
  showNativeControls = false,
  onProgress,
  onEnded 
}: YouTubePlayerProps) {
  const containerId = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);
  const playerRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const progressInterval = useRef<any>(null);

  // Load YouTube API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
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
    if (!apiReady || !videoId) return;

    // Wait a tiny bit for the container to be in the DOM if it was just rendered
    const timer = setTimeout(() => {
      if (!document.getElementById(containerId.current)) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
      setPlayerReady(false);

      const isSearch = typeof videoId === 'string' && videoId.startsWith('yt-search');
      const actualId = isSearch ? '' : videoId;
      const searchQuery = isSearch ? decodeURIComponent(videoId.split(':').slice(1).join(':')) : '';

      const playerOptions: any = {
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          controls: showNativeControls ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
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
          },
          onError: () => {
            setPlayerReady(false);
          }
        }
      };

      if (isSearch) {
        playerOptions.playerVars.listType = 'search';
        playerOptions.playerVars.list = searchQuery;
      } else {
        playerOptions.videoId = actualId;
      }

      try {
        playerRef.current = new window.YT.Player(containerId.current, playerOptions);
      } catch (e) {
        console.error('Failed to create YT Player:', e);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
      setPlayerReady(false);
    };
  }, [apiReady, videoId]);

  // Sync Play/Pause
  useEffect(() => {
    if (playerReady && playerRef.current?.playVideo) {
      try {
        if (isPlaying) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (e) {
        // ignore
      }
    }
  }, [isPlaying, playerReady]);

  // Sync Volume
  useEffect(() => {
    if (playerReady && playerRef.current?.setVolume) {
      try {
        playerRef.current.setVolume(volume * 100);
      } catch (e) {
        // ignore
      }
    }
  }, [volume, playerReady]);

  // Handle External Seek
  useEffect(() => {
    if (playerReady && seekTime !== undefined && playerRef.current?.seekTo) {
      try {
        playerRef.current.seekTo(seekTime, true);
      } catch (e) {
        // ignore
      }
    }
  }, [seekTime, playerReady]);

  // Progress Tracker
  useEffect(() => {
    if (playerReady && isPlaying && playerRef.current?.getCurrentTime) {
      progressInterval.current = setInterval(() => {
        try {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            const currentTime = playerRef.current.getCurrentTime();
            const duration = playerRef.current.getDuration();
            onProgress?.(currentTime, duration);
          }
        } catch (e) {
          // Silent catch for potential cross-origin races
        }
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
  }, [isPlaying, playerReady, onProgress]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5 relative">
      <div id={containerId.current} className={`w-full h-full ${showNativeControls ? '' : 'pointer-events-none'}`}></div>
      {/* Overlay to catch clicks and avoid YouTube redirection */}
      <div className={`absolute inset-0 pointer-events-none ${showNativeControls ? 'opacity-0' : 'bg-gradient-to-t from-black/20 to-transparent'}`}></div>
    </div>
  );
}
