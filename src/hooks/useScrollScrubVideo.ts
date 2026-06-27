"use client";

import { useEffect, useRef, useState, RefObject } from "react";

interface ScrollScrubOptions {
  speed?: number;
  smoothing?: number;
}

interface ScrollScrubResult {
  progress: number;
  isPinned: boolean;
}

export function useScrollScrubVideo(
  trackRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  options: ScrollScrubOptions = {}
): ScrollScrubResult {
  const { smoothing = 0 } = options;

  const [progress, setProgress] = useState(0);
  const [isPinned, setIsPinned] = useState(false);

  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const readyRef = useRef(false);

  const handleScrollRef = useRef<() => void>(() => {});

  useEffect(() => {
    handleScrollRef.current = function handleScroll() {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const scrollableDistance = rect.height - viewportHeight;

      if (scrollableDistance <= 0) {
        setProgress(0);
        setIsPinned(false);
        return;
      }

      const scrolledPast = -rect.top;
      const rawProgress = scrolledPast / scrollableDistance;
      const clamped = Math.min(1, Math.max(0, rawProgress));

      const pinned = rect.top <= 0 && rect.bottom >= viewportHeight;

      setProgress(clamped);
      setIsPinned(pinned);
      targetTimeRef.current = clamped * (durationRef.current || 0);
    };
  }, [trackRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function onLoadedMetadata() {
      if (video) {
        durationRef.current = video.duration || 0;
        readyRef.current = true;
        handleScrollRef.current();
      }
    }

    if (video.readyState >= 1 && video.duration) {
      durationRef.current = video.duration;
      readyRef.current = true;
      handleScrollRef.current();
    } else {
      video.addEventListener("loadedmetadata", onLoadedMetadata);
    }

    return () => video.removeEventListener("loadedmetadata", onLoadedMetadata);
  }, [videoRef]);

  useEffect(() => {
    function onScrollOrResize() {
      handleScrollRef.current();
    }

    onScrollOrResize();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  useEffect(() => {
    function tick() {
      const video = videoRef.current;
      if (video && readyRef.current && durationRef.current > 0) {
        if (smoothing > 0) {
          currentTimeRef.current +=
            (targetTimeRef.current - currentTimeRef.current) * smoothing;
        } else {
          currentTimeRef.current = targetTimeRef.current;
        }

        const next = currentTimeRef.current;
        if (Math.abs(video.currentTime - next) > 0.01) {
          video.currentTime = Math.min(
            Math.max(next, 0),
            durationRef.current - 0.05
          );
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef, smoothing]);

  return { progress, isPinned };
}
