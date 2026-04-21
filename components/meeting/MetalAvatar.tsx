import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface MetalAvatarProps {
  name: string;
  size?: number;
  className?: string;
  isSpeaking?: boolean;
}

export default function MetalAvatar({ name, size = 100, className, isSpeaking }: MetalAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a deterministic color based on the name from the requested palette
  const getColors = (str: string) => {
    const palette = [
      { main: '#0a0a0a', accent: '#404040', shine: '#ffffff', name: 'black' },
      { main: '#262626', accent: '#737373', shine: '#d4d4d4', name: 'grey' },
      { main: '#0f172a', accent: '#3b82f6', shine: '#93c5fd', name: 'blue-black' },
      { main: '#422006', accent: '#eab308', shine: '#fde047', name: 'yellow' },
      { main: '#450a0a', accent: '#ef4444', shine: '#fca5a5', name: 'red' },
      { main: '#1e3a8a', accent: '#3b82f6', shine: '#bfdbfe', name: 'blue' },
      { main: '#500724', accent: '#ec4899', shine: '#fbcfe8', name: 'pink' },
      { main: '#064e3b', accent: '#10b981', shine: '#d1fae5', name: 'green' },
      { main: '#451a03', accent: '#92400e', shine: '#fcd34d', name: 'brown' },
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palette.length;
    const color = palette[index];

    return {
      main: color.main,
      accent: color.accent,
      shine: color.shine,
    };
  };

  const colors = getColors(name);

  return (
    <div 
      className={cn("relative flex items-center justify-center rounded-full overflow-hidden shadow-2xl", className)}
      style={{ width: size, height: size }}
    >
      {/* Metallic Base Layer */}
      <div 
        className="absolute inset-0 bg-neutral-900"
        style={{ 
          background: `linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)`, 
          border: '1px solid rgba(255,255,255,0.05)'
        }} 
      />

      {/* Frosted / Glass Layer */}
      <div 
        className="absolute inset-0 backdrop-blur-xl bg-opacity-20 flex items-center justify-center"
        style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 70%)` }}
      />

      {/* Metallic Gradient Mesh */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{ 
          background: `linear-gradient(215deg, ${colors.accent} 0%, transparent 50%), linear-gradient(35deg, ${colors.main} 0%, transparent 50%)` 
        }} 
      />

      {/* Glossy Reflection */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{ 
          background: `linear-gradient(to bottom right, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)`,
          clipPath: 'circle(50% at 50% 50%)'
        }}
      />

      {/* Speaking Glow Ring */}
      {isSpeaking && (
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
           transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
           className="absolute inset-[-4px] rounded-full ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] z-0"
        />
      )}

      {/* Initials Text with Metallic Look */}
      <span 
        className="relative z-10 font-bold select-none tracking-tight text-white drop-shadow-md"
        style={{ fontSize: size * 0.35 }}
      >
        {initials}
      </span>

      {/* Rim Light / Edge Highlights */}
      <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />
      <div className="absolute inset-0 rounded-full border-t border-l border-white/20 pointer-events-none" />
    </div>
  );
}
