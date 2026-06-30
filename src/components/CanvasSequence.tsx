import { useEffect, useRef, useState } from "react";

interface CanvasSequenceProps {
  folderPath: string;
  frameCount: number;
  fps?: number;
  width: number;
  height: number;
  className?: string;
  scrollScrub?: boolean;
  prefix?: string;
  extension?: string;
  blendMode?: GlobalCompositeOperation;
  onReady?: () => void;
}

export function CanvasSequence({
  folderPath,
  frameCount,
  fps = 30,
  width,
  height,
  className = "",
  scrollScrub = false,
  prefix = "frame_",
  extension = "jpg",
  blendMode = "source-over",
  onReady,
}: CanvasSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const frameIndexRef = useRef(0);
  const reqRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const loadedImages: HTMLImageElement[] = new Array(frameCount);
    let isCancelled = false;

    // 1. Load the very first frame immediately so we can show something on screen!
    const firstImg = new Image();
    const firstFrameNum = (1).toString().padStart(3, "0");
    firstImg.src = `${folderPath}/${prefix}${firstFrameNum}.${extension}`;
    
    firstImg.onload = () => {
      if (isCancelled) return;
      loadedImages[0] = firstImg;
      setImages([...loadedImages]);
      onReady?.(); // Unblock the UI instantly!

      // 2. Load the remaining frames in small background chunks so we don't freeze the browser
      let currentIndex = 2;
      const chunkSize = 10;

      const loadNextChunk = () => {
        if (isCancelled || currentIndex > frameCount) return;

        let chunkLoaded = 0;
        const targetChunk = Math.min(chunkSize, frameCount - currentIndex + 1);

        for (let j = 0; j < targetChunk; j++) {
          const idx = currentIndex + j;
          const img = new Image();
          const frameNum = idx.toString().padStart(3, "0");
          img.src = `${folderPath}/${prefix}${frameNum}.${extension}`;
          
          const handleComplete = () => {
            if (isCancelled) return;
            chunkLoaded++;
            if (chunkLoaded === targetChunk) {
              setImages([...loadedImages]);
              currentIndex += chunkSize;
              requestAnimationFrame(loadNextChunk); // Yield to browser rendering
            }
          };

          img.onload = () => {
            if (!isCancelled) loadedImages[idx - 1] = img;
            handleComplete();
          };
          img.onerror = handleComplete; // graceful fallback
        }
      };

      requestAnimationFrame(loadNextChunk);
    };

    return () => {
      isCancelled = true;
    };
  }, [folderPath, frameCount, prefix, extension, onReady]);

  useEffect(() => {
    if (images.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw initial frame
    const drawFrame = (index: number) => {
      if (!ctx) return;
      
      // If exact frame isn't loaded yet, try to find the nearest previous loaded frame to show
      let imgToDraw = images[index];
      if (!imgToDraw) {
        for (let i = index - 1; i >= 0; i--) {
          if (images[i]) {
            imgToDraw = images[i];
            break;
          }
        }
      }
      
      if (!imgToDraw) return; // If nothing loaded yet, do nothing

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = blendMode;
      ctx.drawImage(imgToDraw, 0, 0, width, height);
    };

    drawFrame(0);

    if (scrollScrub) {
      // Scroll-linked scrubbing
      const handleScroll = () => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        // Calculate progress of canvas through viewport
        const scrollProgress = 1 - rect.bottom / (window.innerHeight + rect.height);
        const clamped = Math.max(0, Math.min(1, scrollProgress));

        let newIndex = Math.floor(clamped * frameCount);
        if (newIndex >= frameCount) newIndex = frameCount - 1;

        if (newIndex !== frameIndexRef.current) {
          frameIndexRef.current = newIndex;
          drawFrame(newIndex);
        }
      };

      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      // Autoplay mode
      let lastTime = 0;
      const frameDuration = 1000 / fps;

      const animate = (time: number) => {
        if (time - lastTime >= frameDuration) {
          frameIndexRef.current = (frameIndexRef.current + 1) % frameCount;
          drawFrame(frameIndexRef.current);
          lastTime = time;
        }
        reqRef.current = requestAnimationFrame(animate);
      };

      reqRef.current = requestAnimationFrame(animate);
      return () => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
      };
    }
  }, [images, frameCount, fps, width, height, scrollScrub, blendMode]);

  return <canvas ref={canvasRef} width={width} height={height} className={`block ${className}`} />;
}
