import { useParticipants, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { useState, useEffect } from 'react';
import { 
  Hand, 
  Mic, 
  MicOff, 
  Search, 
  Shield, 
  Wifi, 
  WifiOff, 
  X,
  Target,
  MoreVertical,
  Activity
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ConnectionQuality } from 'livekit-client';
import { toast } from 'sonner';
import MetalAvatar from './MetalAvatar';

export default function ParticipantsPanel({ isHost }: { isHost: boolean }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleMuteParticipant = async (p: any) => {
    if (!isHost) return;
    try {
      const encoder = new TextEncoder();
      const payload = JSON.stringify({ action: 'mute', targetSid: p.sid });
      await localParticipant.publishData(encoder.encode(payload), { reliable: true });
      toast.success(`Mute command sent to ${p.identity}`);
    } catch (err) {
      toast.error('Failed to send mute command');
    }
  };

  const handleLowerHand = async (p: any) => {
    if (!isHost) return;
    try {
      const encoder = new TextEncoder();
      const payload = JSON.stringify({ action: 'lowerHand', targetSid: p.sid });
      await localParticipant.publishData(encoder.encode(payload), { reliable: true });
      toast.info(`Lower hand signal sent`);
    } catch (err) {
      toast.error('Failed to transmit signal');
    }
  };

  const getConnectionInfo = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return { label: 'OPTIMAL', color: 'text-emerald-400', icon: <Activity className="w-3 h-3" /> };
      case ConnectionQuality.Good:
        return { label: 'STABLE', color: 'text-blue-400', icon: <Activity className="w-3 h-3" /> };
      case ConnectionQuality.Poor:
        return { label: 'DEGRADED', color: 'text-amber-400', icon: <Activity className="w-3 h-3" /> };
      case ConnectionQuality.Lost:
        return { label: 'OFFLINE', color: 'text-red-400', icon: <Activity className="w-3 h-3" /> };
      default:
        return { label: 'STANDBY', color: 'text-slate-500', icon: <Activity className="w-3 h-3" /> };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050508] overflow-hidden border-l border-white/5">
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Node Directory
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[9px] font-black text-blue-400 border border-blue-500/10">
              {participants.length}
            </span>
          </div>
          <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Encrypted Peer Mesh</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {participants.map((p) => {
              const isLocal = p.sid === localParticipant?.sid;
              const metadata = JSON.parse(p.metadata || '{}');
              const displayName = metadata.name || p.identity || 'Anonymous';
              const isHandRaised = metadata.handRaised;
              const isMuted = !p.isMicrophoneEnabled;
              const isActiveSpeaker = p.isSpeaking;
              const conn = getConnectionInfo(p.connectionQuality);

              return (
                <motion.div 
                  key={p.sid}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-2xl transition-all duration-500 group relative border",
                    isLocal ? "bg-white/[0.04] border-white/10" : "hover:bg-white/[0.02] border-transparent hover:border-white/5",
                    isActiveSpeaker && "border-emerald-500/30 bg-emerald-500/[0.03] shadow-[0_0_20px_rgba(16,185,129,0.1)]",
                    isHandRaised && "border-amber-500/30 bg-amber-500/[0.03]"
                  )}
                >
                  <div className="relative z-10 shrink-0">
                    <MetalAvatar name={displayName} size={42} isSpeaking={isActiveSpeaker} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <span className={cn(
                         "text-xs font-black uppercase tracking-tight truncate",
                         isActiveSpeaker ? "text-emerald-400" : "text-white"
                       )}>
                         {displayName}
                       </span>
                       {isLocal && <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 px-1.5 py-0.5 rounded-full bg-blue-500/5">You</span>}
                    </div>
                    
                    <div className="flex flex-col gap-0.5 mt-0.5">
                       <div className={cn("flex items-center gap-1 text-[8px] font-black uppercase tracking-widest", conn.color)}>
                         {conn.icon}
                         {conn.label}
                         {metadata.joinTimestamp && (
                            <span className="text-slate-600 ml-0.5 opacity-50">• {Math.floor((now - metadata.joinTimestamp)/60000)}m Ago</span>
                         )}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 relative z-10">
                    {isHandRaised && (
                       <button
                         onClick={() => isHost && handleLowerHand(p)}
                         className={cn(
                           "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                           isHost ? "bg-amber-500/20 border border-amber-500/40 text-amber-500 hover:bg-amber-500 hover:text-black" : "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                         )}
                       >
                         <Hand className="w-4 h-4" />
                       </button>
                    )}
                    
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center border transition-all",
                      isMuted ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                      isActiveSpeaker && "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20"
                    )}>
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className={cn("w-4 h-4", isActiveSpeaker && "animate-pulse")} />}
                    </div>

                    {isHost && !isLocal && (
                       <button 
                        onClick={() => handleMuteParticipant(p)}
                        className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-red-500 scale-95 hover:scale-100 hover:text-white hover:border-red-500 transition-all ml-0.5"
                        title="Remote Mute"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
