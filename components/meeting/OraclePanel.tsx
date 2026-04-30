import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Cpu, Hash, MessageSquare, Zap, Activity, BrainCircuit, Sparkles, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IntelligentInsight {
  id: string;
  type: 'keyword' | 'sentiment' | 'action' | 'summary' | 'risk' | 'opportunity';
  content: string;
  timestamp: string;
  confidence: number;
}

export default function OraclePanel({ roomCode }: { roomCode?: string }) {
  const [insights, setInsights] = useState<IntelligentInsight[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [transcript, setTranscript] = useState<{id: string, text: string, user: string, time: string}[]>([
    { id: 't1', text: 'Engaging mesh node authorization...', user: 'SYSTEM', time: '14:24' },
    { id: 't2', text: 'Linguistic buffers at 100%', user: 'SYSTEM', time: '14:24' },
    { id: 't3', text: 'Initiating recursive handshake on sector 7.', user: 'LEAD', time: '14:24' },
    { id: 't4', text: 'Link established. Integrity verified.', user: 'PEER', time: '14:24' },
  ]);

  useEffect(() => {
    // Add periodic mock transcript items
    const interval = setInterval(() => {
      const phrases = [
        "Analyzing verbal velocity...",
        "Cryptographic handshake stable.",
        "Keyword 'Redundancy' detected in stream.",
        "Sentiment shift: High Confidence.",
        "Syncing secondary relay nodes.",
        "Resource allocation optimized.",
        "Network topology map updated."
      ];
      const users = ['SYSTEM', 'AI_ORACLE', 'LEAD', 'PEER'];
      setTranscript(prev => [
        ...prev.slice(-8), 
        { 
          id: Math.random().toString(), 
          text: phrases[Math.floor(Math.random() * phrases.length)], 
          user: users[Math.floor(Math.random() * users.length)],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      
      // Brief processing flicker
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 800);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const mockInsights: IntelligentInsight[] = [
      { id: '1', type: 'keyword', content: 'INFRASTRUCTURE_REDUNDANCY', timestamp: '14:22:01', confidence: 0.98 },
      { id: '2', type: 'sentiment', content: 'HIGH_VERBAL_VELOCITY', timestamp: '14:22:15', confidence: 0.85 },
      { id: '3', type: 'action', content: 'SCALING_PROTOCOLS_V4', timestamp: '14:22:30', confidence: 0.92 },
      { id: '4', type: 'risk', content: 'LATENCY_SPIKE_DETECTED', timestamp: '14:23:05', confidence: 0.72 },
      { id: '5', type: 'opportunity', content: 'AI_AUGMENTATION_ENABLED', timestamp: '14:23:45', confidence: 0.95 },
    ];

    setInsights(mockInsights);
    const timer = setTimeout(() => setIsProcessing(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] overflow-hidden">
      {/* Session Intelligence Header */}
      <div className="p-6 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between">
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
      </div>

      {/* Intelligence Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {/* Transmission Log / Live Transcript */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                 <MessageSquare className="w-3 h-3" />
                 Transmission Log
              </h4>
              <div className="flex items-center gap-1.5">
                 <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[7px] font-mono text-emerald-500/60 uppercase">Live_Feed</span>
              </div>
           </div>
           
           <div className="space-y-2.5 max-h-48 overflow-y-auto scrollbar-hide flex flex-col-reverse">
              <AnimatePresence initial={false}>
                {[...transcript].reverse().map((log) => (
                  <motion.div 
                    key={log.id} 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2 text-[9px] py-1 border-b border-white/[0.02]"
                  >
                     <span className="text-slate-800 font-mono shrink-0">[{log.time}]</span>
                     <span className={cn(
                       "font-black uppercase tracking-tighter shrink-0",
                       log.user === 'SYSTEM' || log.user === 'AI_ORACLE' ? "text-[var(--accent-primary)]" : "text-white/40"
                     )}>
                       {log.user}:
                     </span>
                     <span className="text-slate-400 uppercase tracking-tight">{log.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* AI High-Confidence Insights */}
        <div>
           <div className="flex items-center justify-between mb-4">
              <h4 className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                 <Sparkles className="w-3 h-3" />
                 Intelligence Vectors
              </h4>
           </div>
           
           <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {insights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-4">
                       <div className={cn(
                         "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner",
                         insight.type === 'keyword' ? "bg-blue-500/10 text-blue-500" :
                         insight.type === 'sentiment' ? "bg-emerald-500/10 text-emerald-500" :
                         insight.type === 'action' ? "bg-amber-500/10 text-amber-500" :
                         insight.type === 'risk' ? "bg-red-500/10 text-red-500" :
                         "bg-purple-500/10 text-purple-500"
                       )}>
                          {insight.type === 'keyword' && <Hash className="w-4 h-4" />}
                          {insight.type === 'sentiment' && <Sparkles className="w-4 h-4" />}
                          {insight.type === 'action' && <Zap className="w-4 h-4" />}
                          {insight.type === 'risk' && <ShieldAlert className="w-4 h-4" />}
                          {insight.type === 'opportunity' && <Cpu className="w-4 h-4" />}
                       </div>
                       
                       <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                             <span className="text-[7px] font-black uppercase tracking-widest text-slate-700">
                                {insight.type}_VECTOR
                             </span>
                             <span className="text-[6px] font-mono text-slate-700">{insight.timestamp}</span>
                          </div>
                          <p className="text-[10px] font-black text-white uppercase tracking-tight italic truncate">
                             {insight.content}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                             <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${insight.confidence * 100}%` }}
                                  className="h-full bg-blue-500/30" 
                                />
                             </div>
                             <span className="text-[6px] font-mono text-slate-700">{Math.round(insight.confidence * 100)}% CONF</span>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
           </div>
        </div>

        {/* Action Center / Summary */}
        <div className="p-5 rounded-3xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10 relative overflow-hidden group/audit">
           <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent opacity-0 group-hover/audit:opacity-100 transition-opacity" />
           <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center gap-3">
                 <ShieldCheck className="w-4 h-4 text-[var(--accent-primary)]" />
                 <h4 className="text-[11px] font-black text-white uppercase italic tracking-tighter">Session Audit Logic</h4>
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                 Diagnostic complete. All communication vectors analyzed for semantic integrity.
              </p>
              <button className="w-full h-11 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                 <Activity className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                 Generate Mesh Summary
              </button>
           </div>
        </div>
      </div>

      {/* Persistence State */}
      <div className="p-4 bg-black/40 border-t border-white/5">
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.2em]">Hash Integrity: Optimal</span>
           </div>
           <span className="text-[7px] font-mono text-slate-800">{roomCode?.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
