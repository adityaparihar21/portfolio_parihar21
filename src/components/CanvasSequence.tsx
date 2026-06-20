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
    // Preload all images
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const frameNum = i.toString().padStart(3, "0");
      img.src = `${folderPath}/${prefix}${frameNum}.${extension}`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === frameCount) {
          setImages(loadedImages);
          onReady?.();
        }
      };
      loadedImages.push(img);
    }
    
    // In case they load instantly from cache
    if (loadedCount === frameCount) {
      setImages(loadedImages);
      onReady?.();
    }
  }, [folderPath, frameCount, prefix, extension, onReady]);

  useEffect(() => {
    if (images.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw initial frame
    const drawFrame = (index: number) => {
      if (!ctx || !images[index]) return;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = blendMode;
      ctx.drawImage(images[index], 0, 0, width, height);
    };

    drawFrame(0);

    if (scrollScrub) {
      // Scroll-linked scrubbing
      const handleScroll = () => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        // Calculate progress of canvas through viewport
        const scrollProgress = 1 - (rect.bottom / (window.innerHeight + rect.height));
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

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`block ${className}`}
    />
  );
}
