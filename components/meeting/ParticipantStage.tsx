import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { Mic, MicOff, ShieldCheck, Wifi, WifiOff, Activity, Clock, Lock, CheckCircle2 } from 'lucide-react';
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
        return { color: "text-emerald-500", label: "OPTIMAL", bars: 4 };
      case ConnectionQuality.Good:
        return { color: "text-blue-500", label: "STABLE", bars: 3 };
      default:
        return { color: "text-amber-500", label: "JITTER", bars: 1 };
    }
  };

  return (
    <div className="h-full w-full flex flex-col scrollbar-hide overflow-y-auto">
      <AnimatePresence mode="popLayout">
        {participants.length <= 1 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-8"
          >
            <div className="relative">
               <div className="absolute inset-0 bg-[var(--accent-primary)]/10 blur-[100px] rounded-full" />
               <div className="relative glass-card-heavy w-40 h-40 rounded-[3rem] flex items-center justify-center border border-white/10 shadow-strong">
                  <Lock className="w-16 h-16 text-slate-800" />
               </div>
            </div>
            <div className="space-y-4 max-w-sm">
               <h3 className="text-3xl font-black text-white tracking-widest uppercase italic leading-none">Safe Mode</h3>
               <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.5em] leading-relaxed">
                  Cryptographic barrier active. Awaiting verified endpoints to engage transmission.
               </p>
            </div>
          </motion.div>
        ) : (
          <div className={cn(
             "p-4 md:p-12",
             isGridView ? (
                "grid gap-4 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-[1600px] mx-auto w-full"
             ) : "flex flex-col gap-4 max-w-4xl mx-auto w-full"
          )}>
            {participants.map((p) => {
              const isLocal = p.sid === localParticipant?.sid;
              const isSpeaking = p.isSpeaking;
              const isMuted = !p.isMicrophoneEnabled;
              
              const metadata = JSON.parse(p.metadata || '{}');
              const displayName = metadata.name || p.identity || 'Anonymous';
              const conn = getConnectionInfo(p.connectionQuality);

              return (
                <motion.div
                  key={p.sid}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: isSpeaking ? 1.01 : 1,
                  }}
                  className={cn(
                    "glass-card rounded-[2.5rem] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 min-h-[300px] p-8 text-center border border-white/5 shadow-strong group/card",
                    isSpeaking ? "border-[var(--accent-success)]/30 bg-[var(--accent-success)]/[0.02]" : "hover:bg-white/[0.01]",
                    isLocal && "ring-1 ring-white/5"
                  )}
                >
                  {/* Decorative Industrial Corners */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/10 rounded-tl-[2.5rem] p-1">
                     <div className="w-full h-full border-t border-l border-white/5 rounded-tl-[2rem]" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/10 rounded-br-[2.5rem] p-1">
                     <div className="w-full h-full border-b border-r border-white/5 rounded-br-[2rem]" />
                  </div>
                  
                  {/* Status Overlay */}
                  <div className="absolute top-6 inset-x-8 flex items-center justify-between">
                     <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest leading-none">ENCRYPT</span>
                        <span className="text-[8px] font-mono text-emerald-500/40 uppercase tracking-tighter leading-none">AES_256</span>
                     </div>
                     <div className="flex items-center gap-3">
                        {isMuted ? (
                           <div className="p-2 rounded-xl bg-red-900/10 border border-red-900/20 text-red-500">
                              <MicOff className="w-3.5 h-3.5" />
                           </div>
                        ) : (
                           <div className={cn("p-2 rounded-xl transition-all", isSpeaking ? "bg-[var(--accent-success)] text-white" : "bg-white/5 border border-white/10 text-slate-700")}>
                              <Mic className={cn("w-3.5 h-3.5", isSpeaking && "animate-pulse")} />
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Avatar Section */}
                  <div className="relative mb-6">
                    <MetalAvatar 
                      name={displayName} 
                      size={110} 
                      isSpeaking={isSpeaking}
                      isMuted={isMuted}
                      isHost={isLocal}
                    />
                    {isSpeaking && (
                       <div className="absolute inset-[-10px] rounded-full border border-[var(--accent-success)]/20 animate-pulse" />
                    )}
                  </div>

                  {/* Information Section */}
                  <div className="space-y-4">
                    <div className="flex flex-col items-center">
                       <h3 className={cn(
                         "text-lg font-black italic uppercase tracking-tighter transition-colors",
                         isSpeaking ? "text-[var(--accent-success)]" : "text-white/90"
                       )}>
                         {displayName}
                       </h3>
                       <div className="flex items-center gap-2 mt-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span className="text-[7px] font-mono text-slate-500 tracking-[0.2em]">VERIFIED_{p.sid.slice(0, 6).toUpperCase()}</span>
                       </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 pt-2">
                       <div className="flex items-center gap-4 px-4 py-2 bg-black/20 rounded-2xl border border-white/5">
                          <div className="flex flex-col items-start">
                             <span className="text-[6px] font-black text-slate-700 uppercase tracking-widest leading-none">Stability</span>
                             <span className={cn("text-[8px] font-mono leading-none mt-1", conn.color)}>{conn.label}</span>
                          </div>
                          <div className="w-px h-5 bg-white/5" />
                          <div className="flex flex-col items-start pr-2">
                             <span className="text-[6px] font-black text-slate-700 uppercase tracking-widest leading-none mb-1">Latency</span>
                             <div className="flex gap-0.5 h-1.5 items-end">
                                {[1,2,3,4].map(i => <div key={i} className={cn("w-0.5 rounded-full", i <= conn.bars ? "bg-blue-500" : "bg-white/5", i === 1 ? "h-1" : i === 2 ? "h-1.5" : i === 3 ? "h-2" : "h-2.5")} />)}
                             </div>
                          </div>
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
