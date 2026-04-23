import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { LogIn, Video, Plus, UserCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { isConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface HomeProps {
  session: Session | null;
}

function StaticAppPreview() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden opacity-30 grayscale-[0.2] blur-[1px] select-none pointer-events-none hidden lg:block">
      <div className="flex h-screen w-screen p-8 gap-6 bg-[#050508]">
        {/* Main Stage Preview */}
        <div className="flex-1 flex flex-col gap-6">
           {/* Participants Grid Mock */}
           <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
              {[
                { name: 'PEER_001', color: 'bg-emerald-500/20', init: 'P1' },
                { name: 'GUEST_NODE', color: 'bg-blue-500/20', init: 'GN' },
                { name: 'ALPHA_MESH', color: 'bg-purple-500/20', init: 'AM' },
                { name: 'SECURE_LINK', color: 'bg-amber-500/20', init: 'SL' }
              ].map((p, i) => (
                <div key={i} className="bg-white/5 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
                   <div className={cn("w-20 h-20 rounded-full flex items-center justify-center font-black text-xl text-white/40", p.color)}>
                      {p.init}
                   </div>
                   <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">{p.name}</span>
                   </div>
                </div>
              ))}
           </div>
           
           {/* Control Bar Mock */}
           <div className="flex justify-center h-20">
              <div className="flex items-center gap-4 bg-white/5 px-8 rounded-full border border-white/10 shadow-2xl">
                 {[1, 2, 3, 4, 5].map(i => (
                   <div key={i} className="w-10 h-10 rounded-full bg-white/5 border border-white/10" />
                 ))}
                 <div className="w-px h-6 bg-white/10 mx-2" />
                 <div className="w-24 h-10 rounded-full bg-red-500/10 border border-red-500/20" />
              </div>
           </div>
        </div>

        {/* Sidebar Mock */}
        <div className="w-80 flex flex-col gap-6">
           <div className="h-1/2 bg-white/5 rounded-[3rem] border border-white/5 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-24 h-2 bg-white/10 rounded-full" />
                <div className="w-4 h-4 bg-blue-500/20 rounded-full" />
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-white/10" />
                   <div className="flex flex-col gap-1.5 flex-1">
                      <div className="w-16 h-2 bg-white/5 rounded-full" />
                      <div className="w-10 h-1 bg-white/5 rounded-full" />
                   </div>
                   <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                </div>
              ))}
           </div>
           <div className="flex-1 bg-white/5 rounded-[3rem] border border-white/5 p-8 flex flex-col gap-4">
              <div className="mb-auto space-y-4">
                <div className="w-3/4 h-3 bg-white/10 rounded-full" />
                <div className="w-1/2 h-2.5 bg-white/5 rounded-full" />
                <div className="w-2/3 h-2.5 bg-white/10 rounded-full" />
                <div className="w-full h-12 bg-white/5 rounded-2xl mt-6" />
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1 h-10 bg-white/5 rounded-2xl" />
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
      <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans overflow-hidden relative flex flex-col items-center justify-center p-6">
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
    <div className="min-h-screen bg-[#050508] text-slate-100 font-sans overflow-hidden relative flex flex-col items-center justify-center p-6">
      <StaticAppPreview />
      
      <main className="z-10 w-full max-w-sm flex flex-col gap-10" role="main">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center mx-auto shadow-[0_20px_40px_rgba(255,255,255,0.15)]"
          >
            <Video className="w-8 h-8 text-black" />
          </motion.div>
          <div className="space-y-1">
             <h1 className="text-3xl font-black uppercase tracking-tight text-white italic">VoiceMeet</h1>
             <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">Encrypted Audio Mesh Node</p>
          </div>
        </div>

        <section className="glass-surface-heavy rounded-[2rem] border border-white/10 p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] space-y-8" aria-labelledby="join-heading">
          <h2 id="join-heading" className="sr-only">Join or Create a Meeting</h2>
          <div className="space-y-8">
            <Button 
                onClick={handleCreateMeeting} 
                disabled={isCreating}
                className="w-full h-14 bg-white hover:bg-zinc-200 text-black rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-[0_10px_20px_rgba(255,255,255,0.05)] active:scale-95"
              >
                {isCreating ? 'SYNCING...' : 'INITIATE NEW MESH'}
            </Button>
              
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/5" />
              <span className="relative z-10 px-4 bg-[#0a0d14] text-[8px] uppercase tracking-[0.2em] font-black text-slate-700 left-1/2 -translate-x-1/2">LINK EXISTING NODE</span>
            </div>

            <form onSubmit={handleJoinMeeting} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="display-name" className="text-[8px] uppercase tracking-[0.2em] font-black text-slate-600 ml-1">Node Identity</label>
                <Input 
                  id="display-name"
                  placeholder="AUTHORIZE AS..." 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 bg-black/40 border-white/5 rounded-xl text-white placeholder:text-zinc-800 font-bold text-center uppercase tracking-widest text-xs"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="meeting-code" className="text-[8px] uppercase tracking-[0.2em] font-black text-slate-600 ml-1">Mesh Key</label>
                <Input 
                  id="meeting-code"
                  placeholder="EX: ALPHA-MESH-42" 
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="h-12 bg-black/40 border-white/5 rounded-xl text-white placeholder:text-zinc-800 font-bold text-center uppercase tracking-widest text-xs"
                />
              </div>
              <Button 
                type="submit"
                disabled={!meetingCode || !displayName}
                variant="ghost"
                className="w-full h-12 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-black text-[9px] uppercase tracking-[0.3em] transition-all"
              >
                Join Signal
              </Button>
            </form>
          </div>
        </section>

        <div className="flex justify-center gap-8 py-4 bg-white/[0.02] rounded-2xl border border-white/5">
           {[ 
             { icon: "🔒", label: "AES-256" }, 
             { icon: "📡", label: "LOW-LATENCY" }, 
             { icon: "💎", label: "48KHZ" } 
           ].map(item => (
             <div key={item.label} className="flex flex-col items-center gap-1.5 grayscale opacity-30">
                <span className="text-sm">{item.icon}</span>
                <span className="text-[7px] uppercase font-black tracking-widest text-white italic">{item.label}</span>
             </div>
           ))}
        </div>
      </main>
    </div>
  );
}
