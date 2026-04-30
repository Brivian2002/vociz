import { useParticipants, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Shield, 
  X,
  Activity,
  ShieldAlert,
  UserMinus,
  UserCheck,
  UserX,
  CheckCircle2,
  Lock,
  Video,
  VideoOff
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ConnectionQuality } from 'livekit-client';
import { toast } from 'sonner';
import MetalAvatar from './MetalAvatar';

export default function ParticipantsPanel({ 
  isHost,
  waitingParticipants = [],
  onApprove,
  onDeny,
  onExport
}: { 
  isHost: boolean,
  waitingParticipants?: any[],
  onApprove?: (id: string) => void,
  onDeny?: (id: string) => void,
  onExport?: () => void
}) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleMuteParticipant = async (p: any) => {
    if (!isHost) return;
    try {
      const encoder = new TextEncoder();
      const payload = JSON.stringify({ type: 'signal', action: 'mute', targetSid: p.sid });
      await localParticipant.publishData(encoder.encode(payload), { reliable: true });
      toast.success(`Mute command sent to ${p.identity}`);
    } catch (err) {
      toast.error('Failed to send mute command');
    }
  };

  const getConnectionInfo = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return { label: 'OPTIMAL', color: 'text-emerald-500' };
      case ConnectionQuality.Good:
        return { label: 'STABLE', color: 'text-blue-500' };
      default:
        return { label: 'DEGRADED', color: 'text-amber-500' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] overflow-hidden">
      {/* Panel Header */}
      <div className="p-6 border-b border-white/5 bg-black/20">
         <div className="flex items-center justify-between mb-1">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.25em] flex items-center gap-2">
               <Lock className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
               Verified Endpoints
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-slate-500 border border-white/5">
              {participants.length.toString().padStart(2, '0')}
            </span>
         </div>
         <div className="flex items-center justify-between mt-2">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">AES-256 Mesh Active</p>
            {isHost && onExport && (
               <button 
                 onClick={onExport}
                 className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 rounded-md border border-white/5 hover:bg-white/10 transition-colors group"
               >
                  <Activity className="w-2.5 h-2.5 text-blue-500" />
                  <span className="text-[8px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest leading-none">Audit PDF</span>
               </button>
            )}
         </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Admission Protocol */}
          {isHost && waitingParticipants.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 px-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                Admission Protocol
              </h3>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {waitingParticipants.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10"
                    >
                      <span className="text-[10px] font-black text-white uppercase italic truncate max-w-[140px]">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onApprove?.(p.id)}
                          className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeny?.(p.id)}
                          className="w-8 h-8 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Active Participants List */}
          <div className="space-y-3">
            <h3 className="text-[9px] font-black text-slate-700 uppercase tracking-widest px-2 group">
              Active Connection Stream
            </h3>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {participants.map((p) => {
                  const isLocal = p.sid === localParticipant?.sid;
                  const metadata = JSON.parse(p.metadata || '{}');
                  const displayName = metadata.name || p.identity || 'Anonymous';
                  const isMuted = !p.isMicrophoneEnabled;
                  const isCameraOn = p.isCameraEnabled;
                  const isSpeaking = p.isSpeaking;
                  const conn = getConnectionInfo(p.connectionQuality);

                  return (
                    <motion.div 
                      key={p.sid}
                      layout
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-3xl transition-all border group relative",
                        isLocal ? "bg-white/[0.04] border-white/5" : "border-transparent bg-white/[0.01]",
                        isSpeaking && "border-[var(--accent-success)]/30 bg-[var(--accent-success)]/[0.03]"
                      )}
                    >
                      <div className="shrink-0 relative">
                        <MetalAvatar 
                          name={displayName} 
                          size={44} 
                          isSpeaking={isSpeaking} 
                          isMuted={isMuted} 
                        />
                        {isSpeaking && (
                          <div className="absolute inset-0 rounded-full border-2 border-[var(--accent-success)] animate-ping opacity-20" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <h4 className={cn(
                             "text-xs font-black uppercase tracking-tight truncate italic",
                             isSpeaking ? "text-[var(--accent-success)]" : "text-white/80"
                           )}>
                             {displayName}
                           </h4>
                           {isLocal && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shadow-[0_0_5px_rgba(59,130,246,1)]" />}
                           {isCameraOn ? <Video className="w-2.5 h-2.5 text-blue-500" /> : <VideoOff className="w-2.5 h-2.5 text-slate-800" />}
                           {isMuted ? <MicOff className="w-2.5 h-2.5 text-red-500" /> : <Mic className="w-2.5 h-2.5 text-emerald-500" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                           <span className={cn("text-[7px] font-black uppercase tracking-widest", conn.color)}>{conn.label}</span>
                           <span className="text-[7px] font-mono text-slate-800 tracking-tighter">ID: {p.sid.slice(0, 6)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isHost && !isLocal && (
                           <button 
                             onClick={() => handleMuteParticipant(p)}
                             className={cn(
                               "w-9 h-9 rounded-xl flex items-center justify-center border transition-all",
                               isMuted ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
                             )}
                           >
                             {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                           </button>
                        )}
                        <CheckCircle2 className={cn("w-4 h-4 transition-opacity", isLocal ? "text-[var(--accent-primary)] opacity-100" : "text-slate-800 opacity-20 group-hover:opacity-40")} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
