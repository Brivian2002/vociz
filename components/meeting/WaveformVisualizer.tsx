import React, { useEffect, useRef } from 'react';
import { useLocalParticipant } from '@livekit/components-react';

export default function WaveformVisualizer({ 
  className 
}: { 
  className?: string 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { localParticipant } = useLocalParticipant();
  const animationRef = useRef<number>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!localParticipant.isMicrophoneEnabled) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      // LiveKit's localParticipant exposes audioLevel [0, 1]
      const level = localParticipant.audioLevel;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw 3-4 bars that react to volume
      const barCount = 4;
      const spacing = 4;
      const barWidth = 2;
      const totalWidth = (barCount * barWidth) + ((barCount - 1) * spacing);
      let startX = centerX - (totalWidth / 2);

      ctx.fillStyle = '#10b981'; // emerald-500
      
      for (let i = 0; i < barCount; i++) {
        // Vary height based on index and current level
        const baseHeight = 4;
        const reactiveHeight = level * 20;
        const noise = Math.random() * 2;
        const h = Math.max(baseHeight, reactiveHeight + (i % 2 === 0 ? noise : -noise));
        
        ctx.beginPath();
        // Use roundRect or clearRect/fillRect logic
        const y = centerY - (h / 2);
        ctx.roundRect(startX, y, barWidth, h, 2);
        ctx.fill();
        
        startX += barWidth + spacing;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [localParticipant]);

  return (
    <canvas 
      ref={canvasRef} 
      width={40} 
      height={24} 
      className={className}
      aria-hidden="true"
    />
  );
}
