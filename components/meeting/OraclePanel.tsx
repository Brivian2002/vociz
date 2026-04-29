import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Cpu, Hash, MessageSquare, Zap, Activity, BrainCircuit, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntelligentInsight {
  id: string;
  type: 'keyword' | 'sentiment' | 'action' | 'summary';
  content: string;
  timestamp: string;
  confidence: number;
}

export default function OraclePanel({ roomCode }: { roomCode?: string }) {
  const [insights, setInsights] = useState<IntelligentInsight[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const mockInsights: IntelligentInsight[] = [
      { id: '1', type: 'keyword', content: 'INFRASTRUCTURE_UPDATE', timestamp: '14:22:01', confidence: 0.98 },
      { id: '2', type: 'sentiment', content: 'POSITIVE_ENGAGEMENT', timestamp: '14:22:15', confidence: 0.85 },
      { id: '3', type: 'action', content: 'DELEGATE_TASK_ROUTING', timestamp: '14:22:30', confidence: 0.92 },
    ];

    setInsights(mockInsights);

    const interval = setInterval(() => {
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 1200);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] overflow-hidden">
      {/* Session Intelligence Header */}
      <div className="p-6 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between mb-6">
           <div className="flex flex-col">
              <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Diagnostic Engine</h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">Linguistic Analysis Node [PRO-v2]</p>
           </div>
           <div className={cn(
             "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-700",
             isProcessing ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] shadow-[0_0_20px_rgba(59,130,246,0.3)]" : "bg-white/5 text-slate-700 border border-white/5"
           )}>
              <Activity className={cn("w-5 h-5", isProcessing && "animate-pulse")} />
           </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
           <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block mb-2">TONE_ANALYSIS</span>
              <div className="flex items-center gap-2">
                 <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div animate={{ width: '82%' }} className="h-full bg-emerald-500" />
                 </div>
                 <span className="text-[9px] font-mono text-emerald-500">OPT</span>
              </div>
           </div>
           <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block mb-2">ENGAGEMENT</span>
              <div className="flex items-center gap-2">
                 <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div animate={{ width: '64%' }} className="h-full bg-blue-500" />
                 </div>
                 <span className="text-[9px] font-mono text-blue-500">HIGH</span>
              </div>
           </div>
        </div>
      </div>

      {/* Intelligence Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
        <div>
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                 <Sparkles className="w-3 h-3" />
                 Session Highlights
              </h4>
              <div className="px-2 py-0.5 rounded bg-blue-900/10 border border-blue-900/20 text-[7px] font-mono text-blue-400">
                 RT_STREAM_ENABLED
              </div>
           </div>
           
           <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-4">
                       <div className={cn(
                         "w-8 h-8 rounded-lg flex items-center justify-center",
                         insight.type === 'keyword' ? "bg-blue-500/10 text-blue-500" :
                         insight.type === 'sentiment' ? "bg-emerald-500/10 text-emerald-500" :
                         "bg-amber-500/10 text-amber-500"
                       )}>
                          {insight.type === 'keyword' && <Hash className="w-4 h-4" />}
                          {insight.type === 'sentiment' && <Sparkles className="w-4 h-4" />}
                          {insight.type === 'action' && <Zap className="w-4 h-4" />}
                       </div>
                       
                       <div className="flex-1 flex flex-col gap-1">
                          <span className="text-[7px] font-black uppercase tracking-widest text-slate-700">
                             {insight.type}_PROTOCOL
                          </span>
                          <p className="text-[10px] font-black text-white uppercase tracking-tight italic">
                             {insight.content}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                             <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-white/10" style={{ width: `${insight.confidence * 100}%` }} />
                             </div>
                             <span className="text-[7px] font-mono text-slate-600">{insight.timestamp}</span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>

        {/* Transmission Log */}
        <div>
           <h4 className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              Live Transcript Log
           </h4>
           <div className="space-y-2.5">
              {[
                { user: 'LEAD', text: 'Initiating recursive handshake on sector 7.', time: '14:24' },
                { user: 'PEER', text: 'Link established. Integrity verified.', time: '14:24' },
              ].map((log, i) => (
                <div key={i} className="flex gap-2 text-[9px]">
                   <span className="text-slate-800 font-mono">[{log.time}]</span>
                   <span className="font-black text-white/40 uppercase tracking-tighter">{log.user}:</span>
                   <span className="text-slate-400 uppercase tracking-tight">{log.text}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Action Center */}
        <div className="p-5 rounded-3xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 relative overflow-hidden">
           <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                 <h4 className="text-[11px] font-black text-white uppercase italic tracking-tighter">Executive Objective</h4>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                 Session targets identified. Cryptographic integrity confirmed. Ready for protocol escalation.
              </p>
              <button className="w-full h-10 rounded-xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[9px] font-black uppercase tracking-widest text-white hover:bg-[var(--accent-primary)]/20 transition-all">
                 Generate Summary Report
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
