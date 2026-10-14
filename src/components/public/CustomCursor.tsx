"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [cursorText, setCursorText] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if touch device
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsMobile(true);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      // Target hover detection
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const mediaHover = target.closest("[data-cursor-media]");
      const projectHover = target.closest("[data-cursor-project]");
      const buttonHover = target.closest("button, a, select, input, textarea, [data-cursor-button]");

      if (mediaHover) {
        setIsHovered(true);
        setCursorText("VIEW");
      } else if (projectHover) {
        setIsHovered(true);
        setCursorText("OPEN");
      } else if (buttonHover) {
        setIsHovered(true);
        setCursorText("→");
      } else {
        setIsHovered(false);
        setCursorText("");
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  if (isMobile) return null;

  return (
    <div
      className="fixed pointer-events-none z-[999] transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 ease-out"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        className={`flex items-center justify-center font-mono text-[10px] font-bold tracking-widest transition-all duration-300 ${
          isHovered
            ? "w-16 h-16 rounded-full bg-[#C9A66B] text-[#08090B] shadow-lg shadow-[#C9A66B]/30 scale-100"
            : "w-4 h-4 rounded-full bg-white/60 border border-white/80 backdrop-blur-sm"
        }`}
      >
        {isHovered && cursorText}
      </div>
    </div>
  );
}
