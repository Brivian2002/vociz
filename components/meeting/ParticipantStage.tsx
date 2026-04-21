import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import Avatar from "boring-avatars";
import { Mic, MicOff, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ParticipantStage() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  const remoteParticipants = participants.filter(p => p.sid !== localParticipant?.sid);

  return (
    <div className="h-full w-full flex flex-col">
      <AnimatePresence mode="popLayout">
        {participants.length <= 1 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6"
          >
            <div className="relative">
               <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
               <div className="relative glass-surface-heavy w-32 h-32 rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                  <ShieldCheck className="w-16 h-16 text-blue-400 opacity-80" />
               </div>
            </div>
            <div className="space-y-2 max-w-xs">
               <h3 className="text-xl font-bold text-white tracking-tight">Secure Link Active</h3>
               <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  You are the only node in this room. Share your link to start the encrypted session.
               </p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 animate-pulse">
               <div className="w-2 h-2 bg-blue-500 rounded-full" />
               <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">Scanning for peers...</span>
            </div>
          </motion.div>
        ) : (
          <div className={cn(
             "grid gap-4 md:gap-6 items-center justify-center p-2 md:p-4",
             participants.length === 2 ? "grid-cols-1 md:grid-cols-2" : 
             participants.length <= 4 ? "grid-cols-2" : 
             "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {participants.map((p) => {
              const isLocal = p.sid === localParticipant?.sid;
              const isSpeaking = p.isSpeaking;
              const isMuted = !p.isMicrophoneEnabled;
              
              // Handle metadata name as expert suggested
              const metadata = JSON.parse(p.metadata || '{}');
              const displayName = metadata.name || p.identity || 'Anonymous';

              return (
                <motion.div
                  key={p.sid}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isSpeaking ? 1.02 : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "glass-surface rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 min-h-[220px] md:min-h-[280px] p-6 text-center",
                    isSpeaking ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_50px_-10px_rgba(59,130,246,0.3)]" : "hover:bg-white/5",
                    isLocal && "ring-1 ring-white/10"
                  )}
                >
                  {/* Atmospheric Glow */}
                  {isSpeaking && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent opacity-50" />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 4 }}
                        className="absolute inset-0 m-auto w-full h-full bg-blue-500/5 blur-3xl rounded-full"
                      />
                    </div>
                  )}

                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    {isMuted ? (
                      <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 backdrop-blur-sm">
                        <MicOff className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm",
                        isSpeaking ? "bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/40" : "bg-white/5 text-white/30 border border-white/5"
                      )}>
                        <Mic className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
                      </div>
                    )}
                  </div>

                  <div className="relative mb-6">
                    <motion.div
                      animate={{
                        scale: isSpeaking ? [1, 1.1, 1] : 1,
                      }}
                      transition={{
                        duration: 2,
                        repeat: isSpeaking ? Infinity : 0,
                        ease: "easeInOut"
                      }}
                      className={cn(
                        "rounded-full p-1.5 transition-all duration-500",
                        isSpeaking ? "ring-4 ring-blue-500 shadow-2xl shadow-blue-500/40" : "ring-1 ring-white/10"
                      )}
                    >
                      <Avatar
                        size={84}
                        name={displayName}
                        variant="beam"
                      />
                    </motion.div>
                    
                    {isSpeaking && (
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-0.5 items-end h-3">
                           {[1, 2, 3].map(i => (
                              <div key={i} className={cn("w-1 rounded-full bg-blue-400 group-hover:bg-blue-300", i===2 ? "h-3" : "h-1.5")} />
                           ))}
                        </div>
                    )}
                  </div>

                  <div className="space-y-1.5 z-10">
                    <h3 className="text-lg md:text-xl font-bold text-white truncate max-w-[150px] md:max-w-[200px] tracking-tight">
                      {displayName}
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                       {isLocal ? (
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border border-white/5 bg-white/5">
                             Local Node
                          </span>
                       ) : (
                          <span className="text-[9px] text-blue-400/80 font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border border-blue-500/10 bg-blue-500/5">
                             Peer Client
                          </span>
                       )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
