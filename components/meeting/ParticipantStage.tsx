import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import Avatar from "boring-avatars";
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function ParticipantStage() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  return (
    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
      <AnimatePresence>
        {participants.map((p) => {
          const isLocal = p.sid === localParticipant?.sid;
          const isSpeaking = p.isSpeaking;
          const isMuted = !p.isMicrophoneEnabled;

          return (
            <motion.div
              key={p.sid}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: isSpeaking ? 1.02 : 1,
                boxShadow: isSpeaking ? '0 0 40px -10px rgba(59, 130, 246, 0.5)' : 'none'
              }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden transition-colors px-4 py-8 text-center",
                isSpeaking ? "border-blue-500/50 bg-blue-500/10" : "hover:bg-white/10",
                isLocal && "ring-1 ring-white/20"
              )}
            >
              {/* Speaking Indicator Rings */}
              {isSpeaking && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 m-auto w-40 h-40 border-2 border-blue-500/30 rounded-full"
                  />
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0.3 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeOut", delay: 0.5 }}
                    className="absolute inset-0 m-auto w-40 h-40 border-2 border-blue-500/20 rounded-full"
                  />
                </div>
              )}

              <div className="absolute top-4 right-4 flex gap-2">
                {isMuted ? (
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                    <MicOff className="w-4 h-4" />
                  </div>
                ) : (
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transform transition-transform",
                    isSpeaking ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/40" : "bg-white/10 text-white/40"
                  )}>
                    <Mic className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className="relative mb-6">
                <motion.div
                  animate={{
                    scale: isSpeaking ? [1, 1.1, 1] : 1,
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: isSpeaking ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  className={cn(
                    "rounded-full p-1 transition-all duration-300",
                    isSpeaking ? "ring-4 ring-blue-500 shadow-2xl shadow-blue-500/50" : "ring-2 ring-white/10"
                  )}
                >
                  <Avatar
                    size={80}
                    name={p.identity}
                    variant="beam"
                  />
                </motion.div>
                
                {isSpeaking && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                      Speaking
                    </div>
                )}
              </div>

              <div className="space-y-1 z-10">
                <h3 className="text-xl font-bold text-white truncate max-w-[180px]">
                  {p.identity}
                </h3>
                {isLocal && (
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    Main Node (You)
                  </span>
                )}
                {!isLocal && (
                   <span className="text-[10px] text-blue-400/60 font-bold uppercase tracking-tighter">
                    Peer Connected
                  </span>
                )}
              </div>

              {/* Wave Animation when speaking */}
              <div className="mt-6 flex justify-center gap-1.5 h-4 items-end">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <motion.div
                    key={i}
                    animate={{
                      height: isSpeaking ? [4, 16, 4] : 4,
                      opacity: isSpeaking ? 1 : 0.3
                    }}
                    transition={{
                      duration: 0.5 + (i * 0.1),
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={cn(
                      "w-1 rounded-full",
                      isSpeaking ? "bg-blue-400" : "bg-slate-500"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
