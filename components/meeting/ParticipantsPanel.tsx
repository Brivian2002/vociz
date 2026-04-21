import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import Avatar from "boring-avatars";
import { Hand, Mic, MicOff, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export default function ParticipantsPanel() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

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

            return (
              <motion.div 
                key={p.sid} 
                animate={{
                  scale: isActiveSpeaker ? [1, 1.01, 1] : 1,
                  backgroundColor: isActiveSpeaker ? "rgba(59, 130, 246, 0.15)" : isLocal ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0)"
                }}
                transition={{ duration: 2, repeat: isActiveSpeaker ? Infinity : 0 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 group relative",
                  isLocal ? "border border-white/10" : "hover:bg-white/5 border border-transparent",
                  isActiveSpeaker && "border-blue-600/30 ring-1 ring-blue-500/20"
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
                        color: isActiveSpeaker ? "#60a5fa" : "#ffffff",
                        textShadow: isActiveSpeaker ? "0 0 8px rgba(96,165,250,0.5)" : "none"
                      }}
                      className="text-sm font-semibold truncate"
                    >
                      {p.identity}
                    </motion.span>
                    {isLocal && <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">(You)</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {isActiveSpeaker ? 'Speaking...' : isMuted ? 'Muted' : 'Listening'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isHandRaised && (
                    <motion.span 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      className="text-lg drop-shadow-sm"
                    >
                      ✋
                    </motion.span>
                  )}
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

                {/* Subtle highlight for speaking state */}
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
