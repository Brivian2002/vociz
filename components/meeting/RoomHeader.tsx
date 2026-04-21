import React, { useEffect, useState } from 'react';
import { Video, Download } from 'lucide-react';

export default function RoomHeader({ roomCode }: { roomCode: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 backdrop-blur-md bg-white/5 border-b border-white/10 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Video className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">VoiceMeet</span>
        <div className="ml-4 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-mono text-slate-400">
          {roomCode}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Current Time</div>
          <div className="text-sm font-mono text-white">
            {time.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })} UTC
          </div>
        </div>
        <div className="h-8 w-[1px] bg-white/10"></div>
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
