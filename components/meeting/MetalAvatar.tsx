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

  // Generate a deterministic Figma-inspired professional color palette
  const getColors = (str: string) => {
    const palette = [
      { main: '#1A1A1A', accent: '#333333', shine: '#FFFFFF', name: 'onyx' },
      { main: '#0F172A', accent: '#1E293B', shine: '#3B82F6', name: 'slate' },
      { main: '#1E1B4B', accent: '#312E81', shine: '#6366F1', name: 'indigo' },
      { main: '#064E3B', accent: '#065F46', shine: '#10B981', name: 'emerald' },
      { main: '#450A0A', accent: '#7F1D1D', shine: '#EF4444', name: 'rose' },
      { main: '#2D1B69', accent: '#4338CA', shine: '#818CF8', name: 'violet' },
      { main: '#134E4A', accent: '#115E59', shine: '#14B8A6', name: 'teal' },
      { main: '#581C87', accent: '#7E22CE', shine: '#A855F7', name: 'purple' },
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palette.length;
    const color = palette[index];

    return color;
  };

  const colors = getColors(name);

  return (
    <div 
      className={cn("relative flex items-center justify-center rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300", className)}
      style={{ width: size, height: size }}
    >
      {/* Figma Pro Gradient Base */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{ 
          background: `linear-gradient(145deg, ${colors.accent} 0%, ${colors.main} 100%)`,
          boxShadow: `inset 0 2px 4px rgba(255,255,255,0.05), inset 0 -2px 4px rgba(0,0,0,0.1)`
        }} 
      />

      {/* Subtle Inner Glow */}
      <div 
        className="absolute inset-[1px] rounded-full opacity-20"
        style={{ 
          background: `radial-gradient(circle at 30% 30%, ${colors.shine} 0%, transparent 80%)` 
        }}
      />

      {/* Speaking Aura */}
      {isSpeaking && (
        <motion.div
           initial={{ opacity: 0, scale: 1 }}
           animate={{ 
             opacity: [0.2, 0.4, 0.2],
             scale: [1, 1.15, 1],
           }}
           transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
           className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl z-0"
        />
      )}

      {/* Perfectly Round Inner Border (The 'Inner One' refinement) */}
      <div className="absolute inset-0 rounded-full border border-white/10 z-10" />
      <div className="absolute inset-[1px] rounded-full border border-white/[0.05] z-10" />

      {/* Initials with Professional Typography */}
      <span 
        className="relative z-20 font-black select-none tracking-tight text-white/90"
        style={{ 
          fontSize: size * 0.38,
          textShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
      >
        {initials}
      </span>

      {/* Top Edge Highlight for Figma Depth */}
      <div 
        className="absolute top-0 inset-x-0 h-1/2 rounded-full opacity-10 pointer-events-none"
        style={{ 
          background: `linear-gradient(to bottom, #FFFFFF 0%, transparent 100%)`,
          clipPath: 'circle(50% at 50% 10%)'
        }}
      />
    </div>
  );
}
