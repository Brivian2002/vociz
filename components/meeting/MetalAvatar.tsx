import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { Crown, MicOff, Binary } from 'lucide-react';
import Avatar from "boring-avatars";

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
  // Geometric Identicon Colors (Obsidian Matrix)
  const colors = ["#000000", "#101010", "#2563eb", "#0ea5e9", "#1e1b4b"];

  return (
    <div 
      className={cn("relative flex items-center justify-center transition-all duration-500", className)}
      style={{ width: size, height: size }}
    >
      {/* Speaking Pulse Rings (Tactical) */}
      {isSpeaking && (
        <>
          <motion.div
             initial={{ opacity: 0, scale: 1 }}
             animate={{ opacity: [0, 0.5, 0], scale: 1.4 }}
             transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
             className="absolute inset-0 rounded-full border border-[var(--accent-plasma)]/30 z-0"
          />
          <motion.div
             initial={{ opacity: 0, scale: 1 }}
             animate={{ opacity: [0, 0.3, 0], scale: 1.8 }}
             transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "linear" }}
             className="absolute inset-0 rounded-full border border-[var(--accent-plasma)]/10 z-0"
          />
        </>
      )}

      {/* Main Tactical Casing */}
      <div className="absolute inset-0 rounded-full bg-black border border-white/10 shadow-2xl overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent z-10 pointer-events-none" />
         
         {/* GPG Identicon Node */}
         <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
            <Avatar
              size={size}
              name={name}
              variant="bauhaus"
              colors={colors}
            />
         </div>

         {/* Scanning Overlay (Obsidian) */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent)] z-20" />
         <motion.div 
           animate={{ top: ['-100%', '200%'] }}
           transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
           className="absolute left-0 right-0 h-1/2 bg-gradient-to-b from-white/[0.03] to-transparent z-20 pointer-events-none"
         />
      </div>

      {/* Bridge Identity Badges */}
      <div className="absolute inset-x-0 -bottom-1 flex justify-center gap-1.5 z-30">
        {isHost && (
          <div className="px-2 py-0.5 bg-amber-500 rounded-md shadow-xl border border-white/20 flex items-center gap-1">
             <Crown className="w-2.5 h-2.5 text-white fill-white" />
          </div>
        )}
        {isMuted && (
          <div className="px-2 py-0.5 bg-red-600 rounded-md shadow-xl border border-white/20 flex items-center gap-1">
             <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {!isMuted && !isHost && (
           <div className="px-2 py-0.5 bg-black/80 backdrop-blur-md rounded-md shadow-xl border border-white/10 flex items-center gap-1">
              <Binary className="w-2.5 h-2.5 text-[var(--accent-plasma)]" />
           </div>
        )}
      </div>

      {/* Lustre Frame */}
      <div className="absolute inset-0 rounded-full border-2 border-white/5 z-25 pointer-events-none" />
    </div>
  );
}
