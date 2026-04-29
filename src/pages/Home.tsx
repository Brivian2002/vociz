import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { LogIn, Plus, UserCircle2, AlertTriangle, Mic, Users, MessageSquare, Radio } from 'lucide-react';
import { motion } from 'motion/react';
import { isConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface HomeProps {
  session: Session | null;
}

function StaticAppPreview() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden opacity-10 hidden lg:block pointer-events-none select-none">
      <div className="flex h-screen w-screen p-8 gap-6 bg-[var(--bg-void)]">
        {/* Stage Content Mock - Mission Control Style */}
        <div className="flex-1 flex flex-col gap-6">
           <div className="flex-1 glass-surface-heavy rounded-[3rem] border border-white/5 p-12 flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-3xl">
              <div className="absolute top-8 left-12 flex flex-col gap-1">
                 <span className="text-[8px] font-black uppercase text-slate-500 tracking-[0.3em]">Operator Terminal</span>
                 <span className="text-xs font-mono font-black text-white italic">NODE_ALPHA_01 // SECURE</span>
              </div>
              
              <div className="absolute top-8 right-12 flex items-center gap-4">
                 <div className="flex flex-col items-end gap-1">
                    <span className="text-[7px] font-black uppercase text-emerald-500/60 tracking-widest">Signal Health</span>
                    <span className="text-[10px] font-mono text-emerald-400">99.8% UPTIME</span>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-emerald-400" />
                 </div>
              </div>

              <div className="relative mb-8">
                 <div className="absolute -inset-8 bg-[var(--accent-plasma)]/10 blur-3xl rounded-full animate-pulse" />
                 <div className="w-48 h-48 rounded-[3rem] bg-gradient-to-br from-[var(--bg-strata-2)] to-[var(--bg-void)] border-2 border-white/10 flex items-center justify-center text-6xl font-black text-white italic shadow-[0_0_100px_rgba(37,99,235,0.1)] relative z-10 overflow-hidden">
                    <div className="absolute inset-0 mesh-shimmer opacity-20" />
                    AX
                 </div>
              </div>

              <div className="text-center space-y-4">
                 <div className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <h3 className="text-3xl font-black text-white tracking-widest uppercase italic font-mono">AXEL_NODE</h3>
                 </div>
                 <div className="flex items-center gap-4 justify-center">
                    <span className="text-[9px] font-black uppercase text-[var(--accent-plasma)] tracking-[0.2em] border border-[var(--accent-plasma)]/20 px-4 py-2 rounded-lg bg-[var(--accent-plasma)]/5 backdrop-blur-md">Transmitting Signal</span>
                    <span className="text-[9px] font-mono font-black uppercase text-slate-500 tracking-[0.2em]">SEQ: 2490-X-42</span>
                 </div>
              </div>
           </div>

           <div className="flex justify-center h-24">
              <div className="h-full px-12 rounded-[2.5rem] glass-surface-heavy border border-white/5 flex items-center gap-8 shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                 {[1, 2, 3, 4].map(i => (
                   <div key={i} className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
                      <div className="w-6 h-1 bg-white/10 rounded-full" />
                   </div>
                 ))}
                 <div className="w-px h-10 bg-white/5 mx-2" />
                 <div className="w-40 h-10 rounded-xl bg-[var(--signal-crimson)]/10 border border-[var(--signal-crimson)]/20 animate-pulse" />
              </div>
           </div>
        </div>

        {/* Sidebar Mock - Telemetry Density */}
        <div className="w-96 flex flex-col gap-6">
           <div className="flex-1 glass-surface-heavy rounded-[3rem] border border-white/5 p-8 flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">Mesh Topology</span>
                    <span className="text-sm font-mono text-white">4 NODES ACTIVE</span>
                 </div>
                 <Users className="w-5 h-5 text-[var(--accent-plasma)]" />
              </div>
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-5 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.01] border border-white/10 flex items-center justify-center text-xs font-mono">0{i}</div>
                     <div className="space-y-2 flex-1">
                        <div className="flex justify-between items-center">
                           <div className="w-24 h-2 bg-white/20 rounded-full" />
                           <span className="text-[8px] font-mono text-emerald-400">12ms</span>
                        </div>
                        <div className="w-16 h-1 bg-white/10 rounded-full" />
                     </div>
                  </div>
                ))}
              </div>
           </div>
           
           <div className="h-1/3 glass-surface-heavy rounded-[3rem] border border-white/5 p-8 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-plasma)] to-transparent opacity-20" />
              <div className="flex items-center gap-2 mb-auto">
                 <div className="w-3 h-3 bg-[var(--accent-plasma)] rounded-full animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Telemetry Feed</span>
              </div>
              <div className="space-y-3 font-mono text-[8px] text-slate-500 italic">
                 <p>[CRYPTO] New session key generated: 8f2a...11c4</p>
                 <p>[MESH] Peer 0x4B connected via London POP</p>
                 <p>[SIGNAL] Jitter stabilized at 4.2ms</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function Home({ session }: HomeProps) {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [displayName, setDisplayName] = useState(() => {
    return session?.user?.user_metadata?.full_name || localStorage.getItem('voicemeet_identity') || '';
  });
  const [isCreating, setIsCreating] = useState(false);

  React.useEffect(() => {
    if (displayName) {
      localStorage.setItem('voicemeet_identity', displayName);
    }
  }, [displayName]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#000B1A] text-slate-100 font-sans overflow-hidden relative flex flex-col items-center justify-center p-6">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 w-full max-md backdrop-blur-xl bg-white/5 rounded-3xl border border-red-500/30 p-8 shadow-2xl text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/50 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Configuration Required</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Supabase environment variables are missing. To use VoiceMeet, please add the following secrets in the AI Sidebar.
            </p>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold pt-4">Check environment settings</p>
        </motion.div>
      </div>
    );
  }

  const handleCreateMeeting = async () => {
    if (!displayName.trim()) {
      toast.error('Identity required', { description: 'Please enter your name before starting a meeting.' });
      return;
    }

    setIsCreating(true);
    const code = nanoid(10).toLowerCase();
    
    try {
      const inviteLink = `${window.location.origin}/meet/${code}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success('INVITE LINK COPIED', { 
        description: 'Auto-cloned to clipboard for sharing.',
        icon: '🔗'
      });

      if (isConfigured) {
        await supabase.from('meetings').insert({ code, is_active: true });
      }
      
      navigate(`/meet/${code}?name=${encodeURIComponent(displayName)}&host=true`);
    } catch (error: any) {
      navigate(`/meet/${code}?name=${encodeURIComponent(displayName)}&host=true`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim() || !displayName.trim()) {
      toast.error('All fields required');
      return;
    }
    navigate(`/meet/${meetingCode.trim().toLowerCase()}?name=${encodeURIComponent(displayName)}`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-slate-100 font-sans overflow-hidden relative flex flex-col items-center justify-center p-6">
      <StaticAppPreview />
      
      <main className="z-10 w-full max-w-sm flex flex-col gap-10" role="main">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[var(--accent-plasma)] to-[var(--bg-void)] flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(37,99,235,0.3)] border-2 border-white/20 relative group"
          >
            <div className="absolute inset-0 mesh-shimmer opacity-30" />
            <Radio className="w-10 h-10 text-white relative z-10 animate-pulse" />
          </motion.div>
          <div className="space-y-1">
             <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic leading-none drop-shadow-2xl">VoiceMeet</h1>
             <p className="text-slate-500 text-[9px] uppercase tracking-[0.4em] font-black">Secure Mesh Network Protocol</p>
          </div>
        </div>

        <section className="glass-surface-heavy rounded-[3rem] border border-white/5 p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] space-y-10 relative overflow-hidden" aria-labelledby="join-heading">
          <div className="absolute top-0 right-0 p-4">
             <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white/20" />)}
             </div>
          </div>
          
          <h2 id="join-heading" className="sr-only">Join or Create a Meeting</h2>
          <div className="space-y-10">
            <Button 
                onClick={handleCreateMeeting} 
                disabled={isCreating}
                className="w-full h-16 bg-[var(--accent-plasma)] hover:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-[0_20px_40px_rgba(37,99,235,0.2)] active:scale-95 flex items-center justify-center gap-4 border-b-4 border-black/20"
              >
                {isCreating ? 'SYNCING...' : <>
                  <Plus className="w-5 h-5" />
                  INITIATE NEW MESH
                </>}
            </Button>
              
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/5" />
              <span className="relative z-10 px-4 bg-[var(--bg-strata-1)] text-[7px] uppercase tracking-[0.4em] font-black text-slate-600 left-1/2 -translate-x-1/2">LINK EXISTING NODE</span>
            </div>

            <form onSubmit={handleJoinMeeting} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label htmlFor="display-name" className="text-[7px] uppercase tracking-[0.3em] font-black text-slate-600">Identity Identifier</label>
                   <span className="text-[7px] font-mono text-white/20">RW_ACCESS</span>
                </div>
                <Input 
                  id="display-name"
                  placeholder="IDENTIFY AS..." 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-14 bg-black/60 border-white/5 rounded-2xl text-white placeholder:text-slate-800 font-bold text-center uppercase tracking-widest text-xs border-2 focus-visible:ring-[var(--accent-plasma)] focus-visible:border-[var(--accent-plasma)]/50"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label htmlFor="meeting-code" className="text-[7px] uppercase tracking-[0.3em] font-black text-slate-600">Mesh Access Key</label>
                   <span className="text-[7px] font-mono text-white/20">SHA-256</span>
                </div>
                <Input 
                  id="meeting-code"
                  placeholder="ENTER ACCESS HASH..." 
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="h-14 bg-black/60 border-white/5 rounded-2xl text-white placeholder:text-slate-800 font-bold text-center uppercase tracking-widest text-xs border-2 focus-visible:ring-[var(--accent-plasma)] focus-visible:border-[var(--accent-plasma)]/50"
                />
              </div>
              <button 
                type="submit"
                disabled={!meetingCode || !displayName}
                className="w-full h-12 text-slate-500 hover:text-[var(--accent-plasma)] rounded-xl font-black text-[9px] uppercase tracking-[0.4em] transition-all bg-white/[0.02] border border-white/5 hover:bg-[var(--accent-plasma)]/5 hover:border-[var(--accent-plasma)]/20 active:scale-95"
              >
                Engage Signal
              </button>
            </form>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
           {[ 
             { icon: "01", label: "AES-MOD", desc: "ENCRYPTED" }, 
             { icon: "02", label: "QUIC-TP", desc: "LOW_LATENCY" }, 
             { icon: "03", label: "OPUS-HD", desc: "48KHZ_RAW" } 
           ].map(item => (
             <div key={item.label} className="bg-black/40 p-4 flex flex-col items-center gap-2 border border-white/5 transition-all hover:bg-white/[0.05] group">
                <span className="text-[10px] font-mono text-[var(--accent-plasma)] font-black group-hover:scale-110 transition-transform">{item.icon}</span>
                <div className="text-center">
                   <p className="text-[7px] font-black tracking-widest text-white uppercase italic leading-none mb-1">{item.label}</p>
                   <p className="text-[5px] font-black text-slate-600 uppercase tracking-tighter">{item.desc}</p>
                </div>
             </div>
           ))}
        </div>
      </main>
    </div>
  );
}
