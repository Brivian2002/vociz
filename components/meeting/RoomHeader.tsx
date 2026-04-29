import React, { useEffect, useState } from 'react';
import { Radio, Download, Clock, Hash, Mic } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function RoomHeader({ roomCode, joinTime }: { roomCode: string, joinTime: Date }) {
  const [time, setTime] = useState(new Date());
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const angleTimer = setInterval(() => setAngle(prev => (prev + 2) % 360), 50);
    return () => {
      clearInterval(timer);
      clearInterval(angleTimer);
    };
  }, []);

  return (
    <header className="h-20 flex items-center justify-between px-8 backdrop-blur-3xl bg-[var(--bg-void)]/80 border-b border-white/5 z-[50] shadow-2xl relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-plasma)]/30 to-transparent" />
      
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4 group">
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Animated Signal Border */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-40 transition-opacity group-hover:opacity-100"
              style={{
                background: `conic-gradient(from ${angle}deg, transparent, var(--accent-plasma), transparent)`,
                padding: '2px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'destination-out',
                maskComposite: 'exclude',
              }}
            />
            
            <div className="relative z-10 w-9 h-9 bg-[var(--bg-strata-1)] rounded-xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
              <div className="absolute inset-0 mesh-shimmer opacity-20" />
              <Mic className="w-5 h-5 text-white" />
            </div>
            
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[var(--bg-void)] shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
               <span className="font-black text-lg uppercase tracking-tighter text-white italic leading-none">VoiceMeet</span>
               <span className="text-[8px] font-mono font-black py-0.5 px-1.5 rounded bg-[var(--accent-plasma)]/10 text-[var(--accent-plasma)] border border-[var(--accent-plasma)]/20 uppercase tracking-widest">v2.0</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 opacity-40">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               <span className="text-[7px] font-mono font-black text-white uppercase tracking-[0.3em]">SECURE_NODE: LND-EDGE-01</span>
            </div>
          </div>
        </div>

        {/* Security Chips - Interactive */}
        <div className="hidden lg:flex items-center gap-2">
           {[
             { label: 'AES-256', color: 'var(--accent-plasma)' },
             { label: '48KHZ', color: 'var(--accent-plasma)' },
             { label: 'QUIC-TP', color: 'var(--accent-plasma)' }
           ].map(chip => (
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               key={chip.label} 
               className="px-3 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center gap-2 hover:bg-white/[0.06] transition-all group"
             >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: chip.color }} />
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest group-hover:text-white transition-colors">{chip.label}</span>
             </motion.button>
           ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Telemetry Block */}
        <div className="hidden md:flex items-center gap-6 pr-6 border-r border-white/5">
           <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">BRIDGE_ID</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-white">
                 <Hash className="w-3 h-3 text-[var(--accent-plasma)] opacity-60" />
                 {roomCode?.toUpperCase()}
              </div>
           </div>
           
           <div className="flex flex-col items-end">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">LOCAL_TIME</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-white">
                 <Clock className="w-3 h-3 text-[var(--accent-plasma)] opacity-60" />
                 {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
           </div>
        </div>

        <InstallPWAHeader />
      </div>
    </header>
  );
}

function InstallPWAHeader() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstall, setShowInstall] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowInstall(false);
    setDeferredPrompt(null);
  };

  if (!showInstall) return null;

  return (
    <button 
      onClick={handleInstall}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-white"
    >
      <Download className="w-5 h-5 text-blue-400" />
      <span className="text-sm font-medium">Install App</span>
    </button>
  );
}
