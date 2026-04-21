import { useParticipants, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import Avatar from "boring-avatars";
import { Hand, Mic, MicOff, Search, Signal, Wifi, WifiOff, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { ConnectionQuality } from 'livekit-client';
import { toast } from 'sonner';

export default function ParticipantsPanel({ isHost }: { isHost: boolean }) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  const handleMuteParticipant = async (p: any) => {
    if (!isHost) return;
    try {
      // In LiveKit, you can't force someone's mic off directly from client 
      // UNLESS you use server SDK. From client, you can send a data packet
      // or if you have specific permissions. 
      // However, usually "Mute" in these apps sends a command.
      const encoder = new TextEncoder();
      const payload = JSON.stringify({ action: 'mute', targetSid: p.sid });
      await localParticipant.publishData(encoder.encode(payload), {
        reliable: true
      });
      toast.success(`Mute request sent to ${p.identity}`);
    } catch (err) {
      toast.error('Failed to send mute request');
    }
  };

  const handleLowerHand = async (p: any) => {
    if (!isHost) return;
    try {
      const encoder = new TextEncoder();
      const payload = JSON.stringify({ action: 'lowerHand', targetSid: p.sid });
      await localParticipant.publishData(encoder.encode(payload), {
        reliable: true
      });
      toast.info(`Lower hand request sent to ${p.identity}`);
    } catch (err) {
      toast.error('Failed to lower hand');
    }
  };

  const getConnectionInfo = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return { label: 'Excellent', color: 'text-emerald-400', icon: <Wifi className="w-3 h-3" /> };
      case ConnectionQuality.Good:
        return { label: 'Good', color: 'text-blue-400', icon: <Wifi className="w-3 h-3" /> };
      case ConnectionQuality.Poor:
        return { label: 'Poor', color: 'text-amber-400', icon: <Wifi className="w-3 h-3 opacity-70" /> };
      case ConnectionQuality.Lost:
        return { label: 'Lost', color: 'text-red-400', icon: <WifiOff className="w-3 h-3" /> };
      default:
        return { label: 'Unknown', color: 'text-slate-500', icon: <Signal className="w-3 h-3" /> };
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white tracking-tight">Participants</h3>
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px] px-1.5 h-4 min-w-[20px] flex items-center justify-center">
            {participants.length}
          </Badge>
        </div>
        <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {participants.map((p) => {
            const isLocal = p.sid === localParticipant?.sid;
            const metadata = JSON.parse(p.metadata || '{}');
            const isHandRaised = metadata.handRaised;
            const isMuted = !p.isMicrophoneEnabled;
            const isActiveSpeaker = p.isSpeaking;
            const conn = getConnectionInfo(p.connectionQuality);

            return (
              <motion.div 
                key={p.sid} 
                animate={{
                  scale: isActiveSpeaker ? [1, 1.01, 1] : 1,
                  backgroundColor: isHandRaised ? "rgba(245, 158, 11, 0.1)" : isActiveSpeaker ? "rgba(59, 130, 246, 0.15)" : isLocal ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0)"
                }}
                transition={{ duration: 2, repeat: isActiveSpeaker ? Infinity : 0 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group relative",
                  isLocal ? "border border-white/10" : "hover:bg-white/5 border border-transparent",
                  isActiveSpeaker && "border-blue-600/30 ring-1 ring-blue-500/20",
                  isHandRaised && "border-amber-500/30 ring-1 ring-amber-500/20"
                )}
              >
                <div className="relative z-10">
                  <motion.div 
                    animate={{
                      scale: isActiveSpeaker ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 1.5, repeat: isActiveSpeaker ? Infinity : 0 }}
                    className={cn(
                      "rounded-full p-0.5 transition-all duration-500",
                      isActiveSpeaker ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#0a0a0f] shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "ring-1 ring-white/10"
                    )}
                  >
                    <Avatar
                      size={36}
                      name={p.identity}
                      variant="beam"
                    />
                  </motion.div>
                  {isActiveSpeaker && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }} 
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#0a0a0f] rounded-full" 
                    />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <motion.span 
                      animate={{
                        color: isActiveSpeaker ? "#60a5fa" : isHandRaised ? "#f59e0b" : "#ffffff",
                        textShadow: isActiveSpeaker ? "0 0 8px rgba(96,165,250,0.5)" : "none"
                      }}
                      className="text-sm font-semibold truncate"
                    >
                      {p.identity}
                    </motion.span>
                    {isLocal && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">(You)</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={cn("flex items-center gap-1 text-[9px] font-mono uppercase", conn.color)}>
                      {conn.icon}
                      {conn.label}
                    </div>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <div className="text-[10px] text-slate-500 font-medium">
                      {isActiveSpeaker ? 'Speaking' : isMuted ? 'Muted' : 'Listening'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {isHandRaised && (
                    <div className="flex items-center">
                       <motion.span 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        className="text-lg drop-shadow-sm pr-1"
                      >
                        ✋
                      </motion.span>
                      {isHost && !isLocal && (
                        <button 
                          onClick={() => handleLowerHand(p)}
                          className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black flex items-center justify-center transition-colors mr-2"
                          title="Lower Hand"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 opacity-0 bg-white/5 p-1 rounded-full group-hover:opacity-100 transition-opacity">
                    {isHost && !isLocal && (
                       <button 
                        onClick={() => handleMuteParticipant(p)}
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                          isMuted ? "bg-slate-700 text-slate-400" : "bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                        )}
                        title={isMuted ? "Already Muted" : "Mute Participant"}
                        disabled={isMuted}
                      >
                        {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isMuted ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {isMuted ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Subtle highlight for states */}
                {isActiveSpeaker && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent rounded-2xl pointer-events-none" />
                )}
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
