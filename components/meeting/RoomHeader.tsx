import React, { useEffect, useState } from 'react';
import { Radio, Download, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RoomHeader({ roomCode }: { roomCode: string }) {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-[48px] border-b border-white/5 bg-[var(--bg-void)]/90 backdrop-blur-md flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
         <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center shadow-lg">
               <Radio className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-sm font-black uppercase tracking-tighter italic text-white">VoiceMeet</h1>
         </div>
         
         <div className="h-4 w-[1px] bg-white/10 mx-2 hidden sm:block" />
         
         <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Relay Cluster:</span>
            <span className="text-[9px] font-mono text-[var(--accent-success)] leading-none uppercase animate-pulse">US-EAST_SECURE</span>
         </div>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-center hidden md:flex">
         <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/20">
            <ShieldCheck className="w-3 h-3 text-[var(--accent-success)]" />
            <span className="text-[8px] font-black text-[var(--accent-success)] uppercase tracking-widest">End-to-End Encryption Active</span>
         </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-3 px-3 py-1 rounded-lg border border-white/5 bg-black/20">
           <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">SESSION_ID</span>
           <span className="text-[10px] font-mono text-white/50">{roomCode?.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-2">
           <InstallPWAHeader />
           <button 
             onClick={() => navigate('/')}
             className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 transition-all focus:outline-none"
             aria-label="Exit Call"
           >
             <X className="w-4 h-4" />
           </button>
        </div>
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
      className="flex items-center gap-2 px-3 py-1 text-slate-500 hover:text-white transition-colors"
    >
      <Download className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-[9px] font-black uppercase tracking-widest">Install</span>
    </button>
  );
}
