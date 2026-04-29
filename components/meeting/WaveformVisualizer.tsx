import React from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function WaveformVisualizer({ 
  className 
}: { 
  className?: string 
}) {
  const { localParticipant } = useLocalParticipant();
  const isSpeaking = localParticipant.isSpeaking;
  const isMicEnabled = localParticipant.isMicrophoneEnabled;
  const level = localParticipant.audioLevel;

  const bars = [0, 1, 2, 3, 4];

  return (
    <div className={cn("flex items-center justify-center gap-1 h-6", className)}>
      {bars.map((i) => (
        <motion.div
           key={i}
           animate={{
             height: isMicEnabled ? (isSpeaking ? [8, 24, 12, 20, 10][i % 5] : 4) : 2,
             opacity: isMicEnabled ? (isSpeaking ? 1 : 0.4) : 0.1
           }}
           transition={{
             duration: 0.4 + (i * 0.1),
             repeat: Infinity,
             repeatType: "reverse",
             ease: "easeInOut"
           }}
           className={cn(
             "w-1 rounded-full bg-[var(--accent-success)] shadow-[0_0_10px_rgba(20,184,166,0.3)]",
             !isMicEnabled && "bg-slate-700"
           )}
        />
      ))}
    </div>
  );
}
