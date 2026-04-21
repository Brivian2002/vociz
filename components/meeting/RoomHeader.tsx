import React, { useEffect, useState } from 'react';
import { Video, Download, Clock, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function RoomHeader({ roomCode, joinTime }: { roomCode: string, joinTime: Date }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 backdrop-blur-xl bg-black/60 border-b border-white/5 z-20 shadow-2xl">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 group px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all cursor-pointer">
          <div className="relative w-8 h-8 flex items-center justify-center">
            {/* Circulating colors around the logo */}
            <div className="absolute inset-[-4px]">
               <motion.div
                 animate={{ rotate: 360 }}
                 transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 className="w-full h-full rounded-full"
                 style={{
                   background: 'conic-gradient(from 0deg, #ffffff 0%, #fbbf24 45%, #ef4444 65%, #ffffff 100%)',
                   maskImage: 'radial-gradient(circle, transparent 65%, black 70%)',
                   WebkitMaskImage: 'radial-gradient(circle, transparent 65%, black 70%)',
                 }}
               />
            </div>
            <div className="relative z-10 w-7 h-7 bg-black rounded-lg flex items-center justify-center shadow-lg">
              <Video className="w-4 h-4 text-white" />
            </div>
            
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div className="flex flex-col">
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-black text-sm uppercase tracking-[0.2em] bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent leading-none"
            >
              VoiceMeet
            </motion.span>
            {joinTime && (
              <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 leading-none">
                Joined At: {joinTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Meeting Code Placeholder - Blue Black Styled */}
        <div className="hidden sm:flex items-center gap-2.5 px-4 h-10 rounded-xl bg-[#090b14] border border-blue-900/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)] transition-all hover:border-blue-700/50 group">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Hash className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[11px] font-black text-blue-100 uppercase tracking-widest font-mono">
            {roomCode?.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Time Placeholder - Blue Black Styled */}
        <div className="hidden md:flex items-center gap-2.5 px-4 h-10 rounded-xl bg-[#090b14] border border-blue-900/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]">
           <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
             <Clock className="w-3.5 h-3.5 text-blue-400" />
           </div>
           <div className="flex flex-col text-right">
              <span className="text-[7px] font-black text-blue-500/60 uppercase tracking-tighter leading-none mb-0.5">Global Link</span>
              <span className="text-[11px] font-black text-white font-mono leading-none tracking-tight">
                {time.toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
           </div>
        </div>

        <div className="h-6 w-[1px] bg-white/5 hidden md:block"></div>
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
