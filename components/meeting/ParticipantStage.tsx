import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { Mic, MicOff, ShieldCheck, Users, Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ConnectionQuality } from 'livekit-client';
import MetalAvatar from './MetalAvatar';

interface ParticipantStageProps {
  isGridView?: boolean;
}

export default function ParticipantStage({ isGridView = true }: ParticipantStageProps) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getConnectionInfo = (quality: ConnectionQuality) => {
    switch (quality) {
      case ConnectionQuality.Excellent:
        return { color: "text-emerald-500", label: "Ultra", icon: <Wifi className="w-2.5 h-2.5" />, bars: 4 };
      case ConnectionQuality.Good:
        return { color: "text-blue-500", label: "Stable", icon: <Wifi className="w-2.5 h-2.5" />, bars: 3 };
      case ConnectionQuality.Poor:
        return { color: "text-amber-500", label: "Jitter", icon: <Activity className="w-2.5 h-2.5" />, bars: 1 };
      default:
        return { color: "text-red-500", label: "Offline", icon: <WifiOff className="w-2.5 h-2.5" />, bars: 0 };
    }
  };

  return (
    <div className="h-full w-full flex flex-col scrollbar-hide overflow-y-auto">
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
               <h3 className="text-xl font-black text-white tracking-[0.1em] uppercase">PEER-TO-PEER MESH</h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  Encrypted Bridge Established. Awaiting peer synchronization.
               </p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
               <div className="w-1.5 h-1.5 bg-blue-500 animate-ping rounded-full" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none">IDLE: Listening for neighbors</span>
            </div>
          </motion.div>
        ) : (
          <div className={cn(
             "p-4 md:p-8",
             isGridView ? (
               cn(
                 "grid gap-4 md:gap-6 items-center justify-center",
                 participants.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto" : 
                 participants.length <= 4 ? "grid-cols-2" : 
                 "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
               )
             ) : "flex flex-col gap-3 max-w-4xl mx-auto w-full"
          )}>
            {participants.map((p) => {
              const isLocal = p.sid === localParticipant?.sid;
              const isSpeaking = p.isSpeaking;
              const isMuted = !p.isMicrophoneEnabled;
              
              const metadata = JSON.parse(p.metadata || '{}');
              const displayName = metadata.name || p.identity || 'Anonymous';
              const joinTs = metadata.joinTimestamp || Date.now();
              const durationMins = Math.floor((now - joinTs) / 60000);

              const conn = getConnectionInfo(p.connectionQuality);

              if (!isGridView) {
                return (
                  <motion.div
                    key={p.sid}
                    layout
                    className={cn(
                      "flex items-center gap-4 p-4 md:px-8 rounded-full border border-white/5 backdrop-blur-xl transition-all",
                      isSpeaking ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/5 hover:bg-white/[0.08]",
                      isLocal && "ring-1 ring-blue-500/10"
                    )}
                  >
                    <MetalAvatar name={displayName} size={52} isSpeaking={isSpeaking} isMuted={isMuted} isHost={isLocal} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black uppercase text-white truncate">{displayName}</h4>
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5">
                         {isLocal ? <span className="text-blue-400">Host Link</span> : <span>Peer Node</span>}
                         <span className="opacity-30">•</span>
                         <span>Joined {durationMins}m Ago</span>
                      </div>
                    </div>
                    <div className={cn("px-3 py-1 rounded-lg bg-black/40 border border-white/5 flex items-center gap-2", conn.color)}>
                      <span className="text-[8px] font-black uppercase">{conn.label}</span>
                      <div className="flex gap-0.5">
                        {[...Array(4)].map((_, i) => (
                           <div key={i} className={cn("w-0.5 h-2 rounded-full", i < conn.bars ? "bg-current" : "bg-white/10")} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              }

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
                    "glass-surface rounded-[4rem] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 min-h-[240px] md:min-h-[320px] p-8 text-center border border-white/5 shadow-2xl",
                    isSpeaking ? "border-emerald-500/30 bg-emerald-500/[0.03] shadow-[0_0_60px_-15px_rgba(16,185,129,0.2)]" : "hover:bg-white/[0.02]",
                    isLocal && "ring-1 ring-blue-500/20 bg-blue-500/[0.02]"
                  )}
                >
                  <div className="absolute top-4 right-4 md:top-6 md:right-6 flex flex-col items-end gap-2">
                    {isMuted ? (
                      <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 backdrop-blur-sm">
                        <MicOff className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm",
                        isSpeaking ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/40" : "bg-white/5 text-slate-500 border border-white/5"
                      )}>
                        <Mic className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
                      </div>
                    )}
                    <div className="px-2 py-1 bg-black/40 rounded-lg border border-white/5 backdrop-blur-md">
                        <div className={cn("flex flex-col items-center gap-0.5", conn.color)}>
                          <span className="text-[6px] font-black uppercase tracking-tighter opacity-70">{conn.label}</span>
                          <div className="flex gap-0.5 mt-0.5">
                            {[...Array(4)].map((_, i) => (
                              <div 
                                key={i} 
                                className={cn(
                                  "w-0.5 rounded-full",
                                  i === 0 ? "h-1" : i === 1 ? "h-1.5" : i === 2 ? "h-2" : "h-2.5",
                                  i < conn.bars ? "bg-current" : "bg-white/10"
                                )} 
                              />
                            ))}
                          </div>
                        </div>
                    </div>
                  </div>

                  <div className="relative mb-6">
                    <MetalAvatar 
                      name={displayName} 
                      size={110} 
                      isSpeaking={isSpeaking}
                      isMuted={isMuted}
                      isHost={isLocal}
                      className="ring-2 ring-white/10 shadow-3xl"
                    />
                  </div>

                  <div className="space-y-3 z-10">
                    <h3 className="text-base md:text-lg font-black text-white truncate max-w-[150px] md:max-w-[200px] tracking-tight uppercase italic">
                      {displayName}
                    </h3>
                    <div className="flex flex-col items-center gap-1.5">
                       <div className="flex items-center gap-2">
                          {isLocal ? (
                            <span className="text-[7px] text-blue-400 font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-blue-500/20 bg-blue-500/10">
                               Node Host Link
                            </span>
                          ) : (
                            <span className="text-[7px] text-slate-500 font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border border-white/5 bg-white/5">
                               Peer Transmission
                            </span>
                          )}
                       </div>
                       <div className="flex items-center gap-2 opacity-50">
                          <Clock className="w-2.5 h-2.5 text-slate-500" />
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">
                             Joined {durationMins}m Ago
                          </span>
                       </div>
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
