import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

export default function RoomHeader({ roomCode }: { roomCode: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-md border border-white/10">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-mono tracking-wider font-semibold text-white/90 uppercase">
            Live
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight text-white/90">
          Meeting: <span className="font-mono text-primary">{roomCode}</span>
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-white/50 font-mono text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          <Clock className="w-4 h-4" />
          {time.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
          })}
        </div>
      </div>
    </header>
  );
}
