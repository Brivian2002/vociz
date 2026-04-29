import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { Mic, MicOff, ShieldCheck, Wifi, WifiOff, Activity, Clock } from 'lucide-react';
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
               <div className="absolute inset-0 bg-[var(--accent-plasma)]/10 blur-3xl rounded-full animate-pulse" />
               <div className="relative glass-surface-heavy w-32 h-32 rounded-[2.5rem] flex items-center justify-center border border-white/5 shadow-3xl">
                  <ShieldCheck className="w-16 h-16 text-[var(--accent-plasma)] opacity-60" />
               </div>
            </div>
            <div className="space-y-3 max-w-xs">
               <h3 className="text-2xl font-black text-white tracking-tighter uppercase italic">Mesh Isolated</h3>
               <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed">
                  Cryptographic Bridge Active. Awaiting peer nodes to engage linkage.
               </p>
            </div>
          </motion.div>
        ) : (
          <div className={cn(
             "p-4 md:p-8",
             isGridView ? (
               cn(
                 "grid gap-6 md:gap-8 items-center justify-center",
                 participants.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-6xl mx-auto" : 
                 participants.length <= 4 ? "grid-cols-2" : 
                 "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
               )
             ) : "flex flex-col gap-4 max-w-4xl mx-auto w-full"
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
                      "flex items-center gap-6 p-5 px-8 rounded-[2rem] border border-white/5 bg-white/[0.02] backdrop-blur-3xl transition-all",
                      isSpeaking ? "bg-[var(--accent-plasma)]/10 border-[var(--accent-plasma)]/20 shadow-[0_0_40px_rgba(37,99,235,0.1)]" : "hover:bg-white/[0.05]",
                      isLocal && "ring-1 ring-[var(--accent-plasma)]/30"
                    )}
                  >
                    <MetalAvatar name={displayName} size={60} isSpeaking={isSpeaking} isMuted={isMuted} isHost={isLocal} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                         <h4 className="text-base font-black uppercase text-white truncate italic tracking-tighter">{displayName}</h4>
                         {isLocal && <span className="text-[7px] font-black uppercase tracking-widest text-[var(--accent-plasma)] px-2 py-0.5 rounded bg-[var(--accent-plasma)]/10 border border-[var(--accent-plasma)]/20">MASTER</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mt-1">
                         <span>NODE_ID: {p.sid.slice(0, 8)}</span>
                         <span className="opacity-30">•</span>
                         <Clock className="w-2.5 h-2.5" />
                         <span>SYNC_{durationMins}M</span>
                      </div>
                    </div>
                    <div className={cn("px-4 py-2 rounded-xl bg-black/40 border border-white/5 flex items-center gap-3", conn.color)}>
                       <div className="flex flex-col items-end">
                          <span className="text-[6px] font-black uppercase tracking-widest opacity-50">LATENCY</span>
                          <span className="text-[10px] font-mono leading-none">{conn.label}</span>
                       </div>
                       <div className="flex gap-1 h-3 items-end">
                         {[...Array(4)].map((_, i) => (
                            <div key={i} className={cn("w-0.5 rounded-full", i < conn.bars ? "bg-current" : "bg-white/10", i === 0 ? "h-1" : i === 1 ? "h-1.5" : i === 2 ? "h-2" : "h-3")} />
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
                    "glass-surface-heavy rounded-[3rem] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 min-h-[280px] md:min-h-[360px] p-10 text-center border border-white/5 shadow-2xl group/card",
                    isSpeaking ? "border-[var(--accent-plasma)]/30 bg-[var(--accent-plasma)]/[0.03] shadow-[0_0_80px_-20px_rgba(37,99,235,0.2)]" : "hover:bg-white/[0.01]",
                    isLocal && "ring-1 ring-[var(--accent-plasma)]/20"
                  )}
                >
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/10 rounded-tl-[3rem] transition-colors group-hover/card:border-[var(--accent-plasma)]/40" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/10 rounded-br-[3rem] transition-colors group-hover/card:border-[var(--accent-plasma)]/40" />
                  
                  <div className="absolute top-6 inset-x-8 flex items-center justify-between">
                     <div className="flex flex-col items-start gap-1">
                        <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest leading-none">NODE_POS</span>
                        <span className="text-[8px] font-mono text-white/30 uppercase tracking-tighter leading-none italic">
                           [{(Math.random() * 100).toFixed(1)}, {(Math.random() * 100).toFixed(1)}, {(Math.random() * 10).toFixed(1)}]
                        </span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                           <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">STABILITY</span>
                           <div className="flex gap-0.5 h-1.5 items-end">
                              {[1,2,3,4].map(i => <div key={i} className={cn("w-0.5 rounded-full", i <= conn.bars ? "bg-[var(--accent-plasma)]" : "bg-white/5", i === 1 ? "h-1" : i === 2 ? "h-1.5" : "h-2")} />)}
                           </div>
                        </div>
                        {isMuted ? (
                           <div className="p-2 rounded-xl bg-red-950/20 border border-red-900/30 text-red-500 shadow-lg">
                              <MicOff className="w-3.5 h-3.5" />
                           </div>
                        ) : (
                           <div className={cn("p-2 rounded-xl transition-all shadow-xl", isSpeaking ? "bg-[var(--accent-plasma)] text-white scale-110" : "bg-white/5 border border-white/10 text-slate-500")}>
                              <Mic className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="relative mb-8">
                    {isSpeaking && (
                       <div className="absolute inset-[-20px] rounded-full border-2 border-[var(--accent-plasma)]/20 animate-ping" />
                    )}
                    <MetalAvatar 
                      name={displayName} 
                      size={130} 
                      isSpeaking={isSpeaking}
                      isMuted={isMuted}
                      isHost={isLocal}
                    />
                  </div>

                  <div className="space-y-4 z-10">
                    <div className="flex flex-col items-center">
                       <h3 className="text-xl font-black text-white italic uppercase tracking-tighter transition-colors group-hover/card:text-[var(--accent-plasma)]">
                         {displayName}
                       </h3>
                       <div className="flex items-center gap-2 mt-1 opacity-40">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                          <span className="text-[7px] font-mono text-white tracking-[0.2em]">VERIFIED_HASH: {p.sid.slice(0, 8).toUpperCase()}</span>
                       </div>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                       <div className="flex gap-1.5">
                          {isLocal ? (
                            <span className="text-[8px] text-[var(--accent-plasma)] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg border border-[var(--accent-plasma)]/30 bg-[var(--accent-plasma)]/10">
                               MASTER_NODE
                            </span>
                          ) : (
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg border border-white/5 bg-white/5">
                               PEER_LINK
                            </span>
                          )}
                       </div>
                       
                       <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                          <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">FLUX:</span>
                          <div className="flex gap-0.5 items-end h-3">
                             {[1,4,2,6,3,8,4].map((h, i) => (
                                <motion.div 
                                  key={i} 
                                  animate={{ height: isSpeaking ? [h*1.5, h*2.5, h*1.5] : h }}
                                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                  className={cn("w-0.5 rounded-full", isSpeaking ? "bg-[var(--accent-plasma)]" : "bg-white/10")}
                                  style={{ height: `${h}px` }} 
                                />
                             ))}
                          </div>
                          <span className="text-[7px] font-mono text-white/30 uppercase">{isSpeaking ? '44.1KB/S' : 'IDLE'}</span>
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
