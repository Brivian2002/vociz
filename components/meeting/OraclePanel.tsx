import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Cpu, Hash, MessageSquare, Zap, Activity, BrainCircuit, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OracleInsight {
  id: string;
  type: 'keyword' | 'sentiment' | 'action' | 'summary';
  content: string;
  timestamp: string;
  confidence: number;
}

export default function OraclePanel() {
  const [insights, setInsights] = useState<OracleInsight[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  // Simulated live analysis engine
  useEffect(() => {
    const mockInsights: OracleInsight[] = [
      { id: '1', type: 'keyword', content: 'END-TO-END ENCRYPTION', timestamp: '14:22:01', confidence: 0.98 },
      { id: '2', type: 'sentiment', content: 'HIGH RESOLVE DETECTED', timestamp: '14:22:15', confidence: 0.85 },
      { id: '3', type: 'action', content: 'UPDATE MESH TOPOLOGY', timestamp: '14:22:30', confidence: 0.92 },
    ];

    setInsights(mockInsights);

    const interval = setInterval(() => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 800);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-void)] border-l border-white/5 overflow-hidden">
      {/* Oracle Header */}
      <div className="p-8 border-b border-white/5 bg-black/40">
        <div className="flex items-center justify-between mb-6">
           <div className="flex flex-col">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Oracle Co-Pilot</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Linguistic Processor [v4.2]</p>
           </div>
           <div className={cn(
             "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
             isScanning ? "bg-[var(--accent-quantum)] text-white shadow-[0_0_30px_rgba(244,63,94,0.4)]" : "bg-white/5 text-slate-500 border border-white/10"
           )}>
              <BrainCircuit className={cn("w-6 h-6", isScanning && "animate-pulse")} />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
              <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">SENTIMENT_AXIS</span>
              <div className="flex items-center gap-2">
                 <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: '75%' }} 
                      className="h-full bg-[var(--accent-quantum)]" 
                    />
                 </div>
                 <span className="text-[10px] font-mono text-[var(--accent-quantum)]">POS</span>
              </div>
           </div>
           <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-1">
              <span className="text-[6px] font-black text-slate-600 uppercase tracking-widest">DATA_FLUX</span>
              <div className="flex items-center gap-2">
                 <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      animate={{ width: ['40%', '90%', '60%'] }} 
                      transition={{ duration: 3, repeat: Infinity }}
                      className="h-full bg-blue-500" 
                    />
                 </div>
                 <span className="text-[10px] font-mono text-blue-400">NOM</span>
              </div>
           </div>
        </div>
      </div>

      {/* Spectral Display Area */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-hide space-y-10">
        <div>
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
                 <Activity className="w-2.5 h-2.5" />
                 Spectral Analysis
              </h4>
              <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[6px] font-mono text-blue-400">
                 DDP_ENABLED
              </div>
           </div>
           
           <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-[var(--accent-quantum)]/30 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 opacity-20">
                       <span className="text-[8px] font-mono font-black text-white">{insight.timestamp}</span>
                    </div>
                    
                    <div className="flex items-start gap-4">
                       <div className={cn(
                         "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                         insight.type === 'keyword' ? "bg-blue-500/10 text-blue-500" :
                         insight.type === 'sentiment' ? "bg-[var(--accent-quantum)]/10 text-[var(--accent-quantum)]" :
                         "bg-emerald-500/10 text-emerald-500"
                       )}>
                          {insight.type === 'keyword' && <Hash className="w-5 h-5" />}
                          {insight.type === 'sentiment' && <Sparkles className="w-5 h-5" />}
                          {insight.type === 'action' && <Zap className="w-5 h-5" />}
                       </div>
                       
                       <div className="flex-1 flex flex-col gap-1 pr-6">
                          <span className="text-[6px] font-black uppercase tracking-widest text-slate-600 leading-none">
                             {insight.type}_PROTOCOL
                          </span>
                          <p className="text-[11px] font-black text-white/90 leading-relaxed tracking-wider uppercase italic">
                             {insight.content}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                             <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-white/20" style={{ width: `${insight.confidence * 100}%` }} />
                             </div>
                             <span className="text-[8px] font-mono text-slate-500">{(insight.confidence * 100).toFixed(0)}%_CONF</span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>

        {/* Real-time Comms Log (Transcription) */}
        <div>
           <h4 className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
              <MessageSquare className="w-2.5 h-2.5" />
              Neural Comms Log [EN_SYNC]
           </h4>
           <div className="space-y-2 font-mono">
              {[
                { user: 'AXEL', text: 'Initiating recursive handshake on sector 7.', time: '14:24:10' },
                { user: 'NEXUS', text: 'Link established. Merkle integrity verified.', time: '14:24:15' },
                { user: 'VOID', text: 'Awaiting secondary node authorization.', time: '14:24:22' },
              ].map((log, i) => (
                <div key={i} className="flex gap-3 text-[9px] group/log">
                   <span className="text-slate-700 shrink-0">[{log.time}]</span>
                   <span className={cn("font-black shrink-0", i % 2 === 0 ? "text-[var(--accent-plasma)]" : "text-[var(--accent-quantum)]")}>{log.user}:</span>
                   <span className="text-white/60 group-hover/log:text-white transition-colors uppercase tracking-tight">{log.text}</span>
                   <div className="flex-1 border-b border-white/[0.02] border-dotted mb-1" />
                   <span className="text-[6px] text-slate-800 self-center">HASH_{Math.random().toString(16).slice(2, 6).toUpperCase()}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Dynamic Context Card (Obsidian Style) */}
        <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-[var(--accent-quantum)]/20 to-transparent border border-[var(--accent-quantum)]/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-quantum)]/10 blur-[60px] rounded-full" />
           <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-[var(--accent-quantum)] flex items-center justify-center text-white shadow-xl">
                    <Target className="w-4 h-4" />
                 </div>
                 <h4 className="text-xs font-black text-white uppercase italic tracking-tighter">Executive Brief</h4>
              </div>
              <p className="text-[10px] font-black text-[var(--accent-quantum)] uppercase tracking-widest opacity-80 leading-relaxed">
                 Mission objectives aligned. Secure mesh integrity verified at 99.99%. Awaiting secondary confirmation of node handshake.
              </p>
              <button className="w-full h-10 rounded-2xl bg-[var(--accent-quantum)]/20 border border-[var(--accent-quantum)]/40 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-[var(--accent-quantum)]/40 transition-all">
                 Generate MERKLE_PROOFS
              </button>
           </div>
        </div>
      </div>

      {/* Footer Telemetry */}
      <div className="p-8 border-t border-white/5 bg-black/20 flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">ORACLE_UPTIME</span>
            <span className="text-[10px] font-mono text-white/50 leading-none">00:44:12:05</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-0.5 h-1">
               {[...Array(24)].map((_, i) => (
                  <div key={i} className={cn("flex-1 rounded-full bg-white/5", i % 4 === 0 && "bg-[var(--accent-quantum)]/40")} />
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
