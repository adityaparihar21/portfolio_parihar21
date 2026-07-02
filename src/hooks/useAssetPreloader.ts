import { useState, useEffect } from 'react';

/**
 * Preloads an array of media URLs (images and videos).
 * @param urls Array of URLs to preload
 * @param timeoutMs Maximum time to wait before forcing a loaded state (default 35s)
 * @returns boolean indicating if the assets are sufficiently loaded
 */
export function useAssetPreloader(urls: string[], timeoutMs: number = 35000) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (urls.length === 0) {
      setLoaded(true);
      return;
    }

    let loadedCount = 0;
    const total = urls.length;
    let isFinished = false;

    const checkDone = () => {
      if (isFinished) return;
      loadedCount++;
      if (loadedCount >= total) {
        isFinished = true;
        setLoaded(true);
      }
    };

    // Safety fallback: if network is incredibly slow, unlock after timeout
    const fallbackTimer = setTimeout(() => {
      if (!isFinished) {
        console.warn(`Asset preloader timed out after ${timeoutMs}ms. Forcing unlock.`);
        isFinished = true;
        setLoaded(true);
      }
    }, timeoutMs);

    const createdVideos: HTMLVideoElement[] = [];

    urls.forEach((url) => {
      const isVideo = url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm');
      
      if (isVideo) {
        // Preload video until it can play through without buffering
        const video = document.createElement('video');
        createdVideos.push(video);
        video.src = url;
        video.preload = 'auto';
        video.muted = true;
        
        const onReady = () => {
          video.oncanplaythrough = null;
          video.onerror = null;
          checkDone();
        };

        video.oncanplaythrough = onReady;
        // If it errors (e.g., 404), don't block the site forever
        video.onerror = onReady;
        
        video.load();
      } else {
        // Preload image
        const img = new Image();
        const onReady = () => {
          img.onload = null;
          img.onerror = null;
          checkDone();
        };
        img.onload = onReady;
        img.onerror = onReady;
        img.src = url;
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      isFinished = true;
      // OOM Fix: Force Safari to garbage collect videos
      createdVideos.forEach(v => {
        v.pause();
        v.removeAttribute('src');
        v.load();
      });
    };
  }, [urls, timeoutMs]);

  return loaded;
}
