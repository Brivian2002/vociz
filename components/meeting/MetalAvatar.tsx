import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { Crown, MicOff } from 'lucide-react';

interface MetalAvatarProps {
  name: string;
  size?: number;
  className?: string;
  isSpeaking?: boolean;
  isHost?: boolean;
  isMuted?: boolean;
}

export default function MetalAvatar({ 
  name, 
  size = 100, 
  className, 
  isSpeaking, 
  isHost, 
  isMuted 
}: MetalAvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Professional smartphone-first color palette
  const getColors = (str: string) => {
    const palette = [
      { main: '#1A1A1A', accent: '#333333', shine: '#FFFFFF' },
      { main: '#0F172A', accent: '#3B82F6', shine: '#BBD6FF' },
      { main: '#1E1B4B', accent: '#6366F1', shine: '#D9D9FF' },
      { main: '#064E3B', accent: '#10B981', shine: '#D1FAE5' },
      { main: '#450A0A', accent: '#EF4444', shine: '#FEE2E2' },
      { main: '#2D1B69', accent: '#818CF8', shine: '#E0E7FF' },
      { main: '#134E4A', accent: '#14B8A6', shine: '#CCFBF1' },
      { main: '#581C87', accent: '#A855F7', shine: '#F3E8FF' },
    ];

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palette.length;
    return palette[index];
  };

  const colors = getColors(name);

  return (
    <div 
      className={cn("relative flex items-center justify-center rounded-full shadow-2xl transition-all duration-300", className)}
      style={{ width: size, height: size }}
    >
      {/* Speaking Glow Ring */}
      {isSpeaking && (
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ 
             opacity: [0.3, 0.6, 0.3],
             scale: [1, 1.15, 1],
           }}
           transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
           className="absolute -inset-1 rounded-full bg-emerald-500/30 blur-md z-0"
        />
      )}

      {/* Main Surface */}
      <div 
        className="absolute inset-0 rounded-full overflow-hidden border border-white/10"
        style={{ 
          background: `linear-gradient(145deg, ${colors.accent}, ${colors.main})`,
        }}
      >
        {/* Shine Overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ 
            background: `radial-gradient(circle at 30% 30%, ${colors.shine}, transparent 70%)` 
          }}
        />
      </div>

      {/* Initials */}
      <span 
        className="relative z-10 font-black tracking-tighter text-white"
        style={{ fontSize: size * 0.4 }}
      >
        {initials}
      </span>

      {/* Host Crown Badge */}
      {isHost && (
        <div className="absolute -top-1 -right-1 z-20 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border border-black/20">
          <Crown className="w-3 h-3 text-white fill-white" />
        </div>
      )}

      {/* Mute Status Badge */}
      {isMuted && (
        <div className="absolute -bottom-1 -right-1 z-20 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border border-black/20">
          <MicOff className="w-3 h-3 text-white" />
        </div>
      )}

      {/* High-Lustre Polish */}
      <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-black/5 opacity-50" />
    </div>
  );
}
