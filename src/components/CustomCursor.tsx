import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CustomCursor({ themeMode }: { themeMode: "select" | "creative" | "engineering" }) {
  const [isHovering, setIsHovering] = useState(false);
  
  const cursorX = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const cursorY = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 0);
  
  // Spring physics for smooth trailing
  const springX = useSpring(cursorX, { stiffness: 400, damping: 28 });
  const springY = useSpring(cursorY, { stiffness: 400, damping: 28 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // Check if we are hovering over an interactive element
      const target = e.target as HTMLElement;
      if (
        window.getComputedStyle(target).cursor === "pointer" ||
        window.getComputedStyle(target).cursor === "crosshair" ||
        target.tagName.toLowerCase() === 'a' ||
        target.tagName.toLowerCase() === 'button'
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorX, cursorY]);

  // If mobile/touch, usually you don't want a custom cursor
  if (typeof window !== "undefined" && window.matchMedia("(hover: none)").matches) {
    return null;
  }

  // Hide the native cursor globally when this is mounted
  useEffect(() => {
    document.body.style.cursor = "none";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  const size = isHovering ? 36 : 12;
  const isEngineering = themeMode === "engineering";
  
  // Default to creative warm color if not engineering
  const bgColor = isEngineering 
    ? "rgba(106,159,216,0.6)" 
    : "rgba(210,175,100,0.6)";
  
  const borderColor = isEngineering
    ? "rgba(106,159,216,0.2)"
    : "rgba(210,175,100,0.2)";

  return (
    <motion.div
      className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
      style={{
        x: springX,
        y: springY,
        width: size,
        height: size,
        translateX: "-50%",
        translateY: "-50%",
        backgroundColor: bgColor,
        boxShadow: `0 0 10px ${borderColor}`,
        border: `1px solid ${borderColor}`,
      }}
      animate={{
        width: size,
        height: size,
      }}
      transition={{
        duration: 0.15,
        ease: "easeOut",
      }}
    />
  );
}
