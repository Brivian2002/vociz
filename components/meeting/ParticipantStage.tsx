import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { Mic, MicOff, ShieldCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import MetalAvatar from './MetalAvatar';

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
               <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full animate-pulse" />
               <div className="relative glass-surface-heavy w-32 h-32 rounded-full flex items-center justify-center border border-white/5 shadow-3xl">
                  <ShieldCheck className="w-16 h-16 text-blue-400 opacity-60" />
               </div>
            </div>
            <div className="space-y-2 max-w-xs">
               <h3 className="text-xl font-black text-white tracking-[0.1em] uppercase uppercase">Link Active</h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  Encryption established. Scanning for peer nodes.
               </p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 animate-pulse">
               <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
               <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] leading-none">Scanning encrypted path...</span>
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
              
              // Handle metadata name
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
                    "glass-surface rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 min-h-[220px] md:min-h-[300px] p-6 text-center border border-white/5 shadow-2xl",
                    isSpeaking ? "border-emerald-500/30 bg-emerald-500/[0.03] shadow-[0_0_50px_-10px_rgba(16,185,129,0.15)]" : "hover:bg-white/[0.02]",
                    isLocal && "ring-1 ring-blue-500/20 bg-blue-500/[0.02]"
                  )}
                >
                  {/* Atmospheric Glow */}
                  {isSpeaking && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/5 to-transparent opacity-50" />
                    </div>
                  )}

                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    {isMuted ? (
                      <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 backdrop-blur-sm shadow-xl">
                        <MicOff className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm shadow-xl",
                        isSpeaking ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/40" : "bg-white/5 text-slate-500 border border-white/5"
                      )}>
                        <Mic className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
                      </div>
                    )}
                  </div>

                  <div className="relative mb-8">
                    <MetalAvatar 
                      name={displayName} 
                      size={96} 
                      isSpeaking={isSpeaking}
                      className="ring-1 ring-white/10"
                    />
                    
                    {isSpeaking && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-0.5 items-end h-3">
                           {[1, 2, 3, 4, 5].map(i => (
                              <motion.div 
                                key={i} 
                                animate={{ height: [4, 12, 4] }}
                                transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                                className={cn("w-0.5 rounded-full bg-emerald-400", i%2===0 ? "opacity-40" : "opacity-100")} 
                              />
                           ))}
                        </div>
                    )}
                  </div>

                  <div className="space-y-2 z-10">
                    <h3 className="text-base md:text-lg font-black text-white truncate max-w-[150px] md:max-w-[200px] tracking-tight uppercase">
                      {displayName}
                    </h3>
                    <div className="flex items-center justify-center gap-2">
                       {isLocal ? (
                          <span className="text-[8px] text-blue-400 font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/10">
                             Node (You)
                          </span>
                       ) : (
                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-white/5 bg-white/5">
                             Peer Connection
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
