import { useParticipants, useLocalParticipant, VideoTrack } from '@livekit/components-react';
import { Mic, MicOff, ShieldCheck, Wifi, WifiOff, Activity, Clock, Lock, CheckCircle2, Video, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ConnectionQuality, Track } from 'livekit-client';
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
                  className={cn(
                    "relative aspect-video rounded-3xl overflow-hidden bg-[#1E1E1E] transition-all duration-300 border-2",
                    isSpeaking ? "border-[var(--accent-success)] shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "border-white/5",
                    isLocal && "ring-1 ring-white/10"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {p.isCameraEnabled && p.getTrackPublication(Track.Source.Camera) ? (
                      <motion.div 
                        key="video"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                      >
                         <VideoTrack 
                           trackRef={{ 
                             participant: p, 
                             source: Track.Source.Camera,
                             publication: p.getTrackPublication(Track.Source.Camera)!
                           }}
                           className="w-full h-full object-cover" 
                         />
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="avatar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0A0A0F] to-[#1A1A25]"
                      >
                        <MetalAvatar 
                          name={displayName} 
                          size={80} 
                          isSpeaking={isSpeaking}
                          isMuted={isMuted}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Overlays */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
                    <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                       <span className="text-[11px] font-bold text-white tracking-tight">{displayName} {isLocal && '(You)'}</span>
                       <div className="w-1 h-1 rounded-full bg-white/20" />
                       <div className="flex gap-0.5 items-end h-2">
                          {[1,2,3].map(i => (
                            <div key={i} className={cn("w-0.5 rounded-full", i <= conn.bars ? "bg-white" : "bg-white/20", i===1 ? "h-1" : i===2 ? "h-1.5" : "h-2")} />
                          ))}
                       </div>
                    </div>
                    
                    {isMuted && (
                      <div className="w-8 h-8 rounded-xl bg-red-500/80 backdrop-blur-md flex items-center justify-center border border-red-400/20">
                        <MicOff className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Tech Details Overlay (Corner) */}
                  <div className="absolute top-4 right-4 pointer-events-none">
                     <span className="text-[8px] font-mono text-white/20 uppercase tracking-tighter">NODE_{p.sid.slice(0, 4)}</span>
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
