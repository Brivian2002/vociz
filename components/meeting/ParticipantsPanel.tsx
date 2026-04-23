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
  Activity,
  ShieldAlert,
  UserMinus,
  UserCheck,
  UserX
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
  onDeny
}: { 
  isHost: boolean,
  waitingParticipants?: any[],
  onApprove?: (id: string) => void,
  onDeny?: (id: string) => void
}) {
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
      const payload = JSON.stringify({ type: 'signal', action: 'mute', targetSid: p.sid });
      await localParticipant.publishData(encoder.encode(payload), { reliable: true });
      toast.success(`Mute command sent to ${p.identity}`);
    } catch (err) {
      toast.error('Failed to send mute command');
    }
  };

  const handleUnmuteParticipant = async (p: any) => {
    if (!isHost) return;
    try {
      const encoder = new TextEncoder();
      const payload = JSON.stringify({ type: 'signal', action: 'unmute-request', targetSid: p.sid });
      await localParticipant.publishData(encoder.encode(payload), { reliable: true });
      toast.info(`Unmute request sent to ${p.identity}`);
    } catch (err) {
      toast.error('Failed to transmit request');
    }
  };

  const handleRemoveParticipant = async (p: any) => {
    if (!isHost) return;
    if (!confirm(`Are you sure you want to terminate link for node ${p.identity}?`)) return;
    
    try {
      const encoder = new TextEncoder();
      const payload = JSON.stringify({ type: 'signal', action: 'remove', targetSid: p.sid });
      await localParticipant.publishData(encoder.encode(payload), { reliable: true });
      toast.error(`Node ${p.identity} removal command broadcast.`);
    } catch (err) {
      toast.error('Failed to broadcast removal command');
    }
  };

  const handleLowerHand = async (p: any) => {
    if (!isHost) return;
    try {
      const encoder = new TextEncoder();
      const payload = JSON.stringify({ type: 'signal', action: 'lowerHand', targetSid: p.sid });
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
          <button 
            type="button"
            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 transition-colors"
            aria-label="Search participants"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Encrypted Peer Mesh</p>
      </div>

      <ScrollArea className="flex-1" role="region" aria-label="Participant List" aria-live="polite">
        <div className="p-4 space-y-4">
          {/* Waiting Room Section */}
          {isHost && waitingParticipants.length > 0 && (
            <div className="space-y-2 mb-6">
              <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldAlert className="w-3 h-3" />
                Admission Queue ({waitingParticipants.length})
              </h3>
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {waitingParticipants.map((p) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/10"
                    >
                      <span className="text-[10px] font-black text-white uppercase truncate max-w-[120px]">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onApprove?.(p.id)}
                          aria-label={`Approve ${p.name}`}
                          className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeny?.(p.id)}
                          aria-label={`Deny ${p.name}`}
                          className="w-6 h-6 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Active Peers</h3>
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
                      "flex items-center gap-4 p-4 rounded-[2rem] transition-all duration-500 group relative border",
                      isLocal ? "bg-white/[0.04] border-white/10" : "hover:bg-white/[0.02] border-transparent hover:border-white/5",
                      isActiveSpeaker && "border-emerald-500/30 bg-emerald-500/[0.03] shadow-[0_0_20px_rgba(16,185,129,0.1)]",
                      isHandRaised && "border-amber-500/30 bg-amber-500/[0.03]"
                    )}
                  >
                    <div className="relative z-10 shrink-0">
                      <MetalAvatar 
                        name={displayName} 
                        size={52} 
                        isSpeaking={isActiveSpeaker} 
                        isHost={p.metadata?.includes('host')}
                        isMuted={isMuted}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                         <h3 className={cn(
                           "text-[13px] font-black uppercase tracking-tight truncate",
                           isActiveSpeaker ? "text-emerald-400" : "text-white"
                         )}>
                           {displayName}
                         </h3>
                         {isLocal && <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest border border-blue-500/20 px-2 py-0.5 rounded-full bg-blue-500/5">Local Node</span>}
                      </div>
                      
                      <div className="flex flex-col gap-0.5 mt-1">
                         <div className={cn("flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest", conn.color)}>
                           {conn.icon}
                           <span className="opacity-80">{conn.label}</span>
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-10">
                      {/* Individual Mute/Suppress Button - Large for Mobile */}
                      <button 
                        onClick={() => {
                          if (isHost && !isLocal) {
                            if (isMuted) handleUnmuteParticipant(p);
                            else handleMuteParticipant(p);
                          } else {
                            // Local-only UX feedback for non-hosts
                            toast.info("Local suppressing not supported in mesh mode.", {
                               description: "Only hosts can regulate mesh audio nodes."
                            });
                          }
                        }}
                        aria-label={isMuted ? "Unmute node" : "Suppress node"}
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-90",
                          isMuted 
                            ? "bg-red-500/20 border-red-500/40 text-red-500" 
                            : "bg-emerald-500/20 border-emerald-500/40 text-emerald-500",
                          isActiveSpeaker && "bg-emerald-500 text-white border-emerald-500 shadow-xl"
                        )}
                      >
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className={cn("w-5 h-5", isActiveSpeaker && "animate-pulse")} />}
                      </button>

                      {isHost && !isLocal && (
                        <button 
                          onClick={() => handleRemoveParticipant(p)}
                          aria-label={`Terminate node link: Remove ${displayName}`}
                          className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                        >
                          <UserMinus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
