import React, { useEffect, useState } from 'react';
import { Radio, Download, ShieldCheck, X, Link as LinkIcon, Copy, Check, Smartphone, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface RoomHeaderProps {
  roomCode: string;
  joinTime?: Date;
  viewMode?: 'desktop' | 'mobile';
  onToggleViewMode?: () => void;
}

export default function RoomHeader({ roomCode, joinTime, viewMode, onToggleViewMode }: RoomHeaderProps) {
  const [now, setNow] = useState(new Date());
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDuration = () => {
    if (!joinTime) return "00:00";
    const diff = Math.floor((now.getTime() - joinTime.getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyInvite = () => {
    const url = window.location.origin + '/meeting/' + roomCode;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('INVITE LINK COPIED', {
      description: 'Handshake URL secured to clipboard.',
      icon: <LinkIcon className="w-4 h-4 text-[var(--accent-primary)]" />
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const isMobile = viewMode === 'mobile';

  return (
    <header className={cn(
      "h-14 md:h-16 border-b border-white/5 bg-[var(--bg-void)]/90 backdrop-blur-md flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-50 transition-all",
      isMobile && "h-11 px-2"
    )}>
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
         <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-[var(--accent-primary)] to-blue-700 rounded-lg md:rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all">
               <Radio className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <h1 className="text-sm md:text-base font-black uppercase tracking-tighter italic text-white hidden xs:block">VoiceMeet</h1>
         </div>
         
         {!isMobile && <div className="h-4 w-[1px] bg-white/10 mx-2 hidden sm:block" />}
         
         <div className={cn("flex items-center gap-3 px-2 md:px-4 py-1 rounded-lg md:rounded-xl bg-white/[0.03] border border-white/5", isMobile && "px-1.5 py-0.5 border-none bg-transparent")}>
            <div className="flex flex-col">
               <span className="text-[6px] md:text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Elapsed</span>
               <span className="text-[10px] md:text-[11px] font-mono text-[var(--accent-primary)] leading-none font-bold">{getDuration()}</span>
            </div>
         </div>
      </div>

      {!isMobile && (
        <div className="hidden lg:flex items-center gap-6">
           <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl border border-white/5 bg-black/20 group/id relative overflow-hidden">
              <div className="flex flex-col">
                 <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">SESSION_ID</span>
                 <span className="text-[11px] font-mono text-white/50 leading-none">{roomCode?.toUpperCase()}</span>
              </div>
              <button 
                onClick={copyInvite}
                className="ml-4 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90"
                aria-label="Copy Invite Link"
              >
                 {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
           </div>
        </div>
      )}

      <div className={cn("flex items-center gap-2 flex-1 justify-center", isMobile ? "scale-90" : "hidden md:flex")}>
         <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/20">
            <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3 text-[var(--accent-success)]" />
            <span className="text-[7px] md:text-[8px] font-black text-[var(--accent-success)] uppercase tracking-widest">Secure</span>
         </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="flex items-center gap-2">
           <button 
             onClick={onToggleViewMode}
             className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
             title={viewMode === 'desktop' ? 'Switch to Mobile View' : 'Switch to Desktop View'}
           >
             {viewMode === 'desktop' ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
           </button>
           
           <InstallPWAHeader />
           <button 
             onClick={() => navigate('/')}
             className="w-8 h-8 rounded-lg md:rounded-xl flex items-center justify-center text-slate-500 hover:text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 transition-all focus:outline-none"
             aria-label="Exit Call"
           >
             <X className="w-4 h-4 md:w-5 md:h-5" />
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
