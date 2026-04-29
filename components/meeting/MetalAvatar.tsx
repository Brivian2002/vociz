import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { ShieldCheck, MicOff, Fingerprint, Lock } from 'lucide-react';
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
  // Industrial Color Palette (Slate, Titanium, Cobalt)
  const colors = ["#0F172A", "#334155", "#475569", "#1E293B", "#3B82F6"];

  return (
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {/* Dynamic Speaking Aura */}
      {isSpeaking && (
        <motion.div
           initial={{ opacity: 0, scale: 1 }}
           animate={{ opacity: [0, 0.4, 0], scale: 1.5 }}
           transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
           className="absolute inset-0 rounded-full border-2 border-[var(--accent-primary)]/40 z-0"
        />
      )}

      {/* Main Composite Structure */}
      <div className="absolute inset-x-0 inset-y-0 rounded-full bg-[#050508] border border-white/10 shadow-2xl overflow-hidden group">
         <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent z-10 pointer-events-none" />
         
         {/* Identity Hash Visualization */}
         <div className="absolute inset-0 flex items-center justify-center opacity-90">
            <Avatar
              size={size}
              name={name}
              variant="bauhaus"
              colors={colors}
            />
         </div>

         {/* Scanning Phase Shift Overlay */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent)] z-20" />
         <motion.div 
           animate={{ top: ['-100%', '200%'] }}
           transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
           className="absolute left-0 right-0 h-full bg-gradient-to-b from-white/[0.03] to-transparent z-20 pointer-events-none"
         />
      </div>

      {/* Authority Badges */}
      <div className="absolute inset-x-0 -bottom-1 flex justify-center gap-1 z-30">
        {isHost && (
          <div className="px-1.5 py-0.5 bg-[var(--accent-primary)] rounded-md shadow-2xl border border-white/20 flex items-center justify-center">
             <ShieldCheck className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {isMuted && (
          <div className="px-1.5 py-0.5 bg-red-600 rounded-md shadow-2xl border border-white/20 flex items-center justify-center">
             <MicOff className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {!isMuted && !isHost && (
           <div className="px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md shadow-2xl border border-white/5 flex items-center justify-center">
              <Lock className="w-2 h-2 text-slate-500" />
           </div>
        )}
      </div>

      {/* Outer Shell Refraction */}
      <div className="absolute inset-0 rounded-full border border-white/10 z-30 pointer-events-none" />
    </div>
  );
}
