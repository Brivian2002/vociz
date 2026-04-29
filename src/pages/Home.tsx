import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { Plus, Radio, Users, ShieldCheck, ArrowRight, Settings, History, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Avatar from "boring-avatars";

interface HomeProps {
  session: Session | null;
}

export default function Home({ session }: HomeProps) {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [displayName, setDisplayName] = useState(() => {
    return session?.user?.user_metadata?.full_name || localStorage.getItem('voicemeet_identity') || '';
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);

  React.useEffect(() => {
    if (displayName) {
      localStorage.setItem('voicemeet_identity', displayName);
    }
  }, [displayName]);

  const handleCreateMeeting = async () => {
    if (!displayName.trim()) {
      toast.error('Identity Required', { description: 'Please enter your identifier before starting.' });
      return;
    }

    setIsCreating(true);
    const code = nanoid(10).toLowerCase();
    
    try {
      const inviteLink = `${window.location.origin}/meet/${code}`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success('BRIDGE LINK COPIED', { description: 'Share this link to allow peers to join.' });

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

  const handleJoinMeeting = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!meetingCode.trim() || !displayName.trim()) {
      toast.error('Input required');
      return;
    }
    navigate(`/meet/${meetingCode.trim().toLowerCase()}?name=${encodeURIComponent(displayName)}`);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center p-6">
        <div className="glass-card-heavy p-10 rounded-[3rem] border border-red-500/20 text-center max-w-sm w-full space-y-6">
           <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
              <Globe className="w-8 h-8 text-red-500" />
           </div>
           <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">System Link Offline</h2>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Cryptographic handshake failed. Database connection not established.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] font-sans flex flex-col items-center selection:bg-[var(--accent-primary)]/30 overflow-x-hidden">
      {/* Mobile Profile & Status Header */}
      <header className="w-full max-w-lg flex items-center justify-between p-6 pt-10">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <Avatar size={48} name={displayName || 'Guest'} variant="bauhaus" colors={["#121212", "#3B82F6", "#14B8A6"]} />
            </div>
            <div className="flex flex-col">
               <h3 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none">{displayName || 'Anonymous User'}</h3>
               <div className="flex items-center gap-2 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-success)] animate-pulse" />
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Active Relay Link</span>
               </div>
            </div>
         </div>
         <button 
           onClick={() => navigate('/settings')}
           className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all"
         >
            <Settings className="w-5 h-5" />
         </button>
      </header>

      <main className="w-full max-w-lg px-6 flex flex-col gap-10 pb-20">
         {/* Identity Section (Professional Biometrics) */}
         <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">Identity Protocol</span>
               <span className="text-[7px] font-mono text-[var(--accent-primary)] opacity-40">AUTO_X25519</span>
            </div>
            <div className="relative group">
               <Input 
                 placeholder="ENTER OPERATOR ID..." 
                 value={displayName}
                 onChange={(e) => setDisplayName(e.target.value)}
                 className="h-16 bg-white/[0.02] border-white/5 rounded-3xl text-white placeholder:text-slate-800 text-center font-bold tracking-[0.3em] text-xs border-2 focus-visible:ring-0 focus-visible:border-[var(--accent-primary)] transition-all shadow-xl"
               />
               <div className="absolute top-1/2 right-6 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <ShieldCheck className={cn("w-4 h-4 transition-colors", displayName ? "text-emerald-500" : "text-slate-800")} />
               </div>
            </div>
         </div>

         {/* Hero Actions (Primary Buttons) */}
         <div className="grid grid-cols-1 gap-4">
            <button 
               onClick={handleCreateMeeting}
               disabled={isCreating}
               className="h-24 rounded-[2.5rem] bg-[var(--accent-primary)] text-white p-1 shadow-[0_20px_60px_-10px_rgba(59,130,246,0.5)] active:scale-95 transition-all relative overflow-hidden group"
            >
               <div className="absolute inset-0 mesh-shimmer opacity-20 pointer-events-none" />
               <div className="h-full w-full rounded-[2.2rem] flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-3">
                     <Plus className="w-6 h-6 stroke-[3px]" />
                     <span className="text-xl font-black uppercase italic tracking-tighter leading-none">Instant Call</span>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60">Initialize Relay Link</span>
               </div>
            </button>

            <div className="flex flex-col gap-3">
               <button 
                  onClick={() => setShowJoinInput(!showJoinInput)}
                  className={cn(
                    "h-24 rounded-[2.5rem] border-2 border-white/5 bg-white/[0.02] text-white p-1 hover:border-[var(--accent-success)]/40 transition-all group overflow-hidden relative",
                    showJoinInput && "border-[var(--accent-success)]/40 bg-[var(--accent-success)]/[0.03]"
                  )}
               >
                  <div className="h-full w-full rounded-[2.2rem] flex flex-col items-center justify-center gap-1">
                     <div className="flex items-center gap-3">
                        <ArrowRight className="w-6 h-6 text-[var(--accent-success)]" />
                        <span className="text-xl font-black uppercase italic tracking-tighter leading-none">Join Session</span>
                     </div>
                     <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Access Existing Bridge</span>
                  </div>
               </button>

               <AnimatePresence>
                  {showJoinInput && (
                    <motion.form 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleJoinMeeting}
                      className="flex gap-2 p-2 bg-white/[0.03] border border-white/5 rounded-3xl"
                    >
                      <Input 
                        placeholder="SESSION_HASH" 
                        value={meetingCode}
                        onChange={(e) => setMeetingCode(e.target.value)}
                        className="bg-transparent border-none focus-visible:ring-0 text-white font-mono placeholder:text-slate-800 tracking-widest text-xs h-12"
                        autoFocus
                      />
                      <Button type="submit" className="h-12 w-12 rounded-2xl bg-[var(--accent-success)] text-white shadow-xl">
                         <Radio className="w-5 h-5" />
                      </Button>
                    </motion.form>
                  )}
               </AnimatePresence>
            </div>
         </div>

         {/* Bento Grid: Recent Sessions & Analytics */}
         <div className="grid grid-cols-2 gap-4">
            <div className="p-8 rounded-[2.5rem] glass-card border border-white/5 flex flex-col gap-4 relative group">
               <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500">
                  <History className="w-5 h-5" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Recent Node</span>
                  <p className="text-xs font-black text-white italic uppercase tracking-tight">Main HQ Sync</p>
               </div>
               <div className="absolute top-8 right-8 w-1.5 h-1.5 rounded-full bg-slate-800" />
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[var(--accent-success)]/10 to-transparent border border-[var(--accent-success)]/10 flex flex-col gap-4">
               <div className="w-10 h-10 rounded-2xl bg-[var(--accent-success)]/20 flex items-center justify-center text-[var(--accent-success)]">
                  <Radio className="w-5 h-5" />
               </div>
               <div className="flex flex-col">
                  <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Active Peers</span>
                  <p className="text-xs font-black text-white italic uppercase tracking-tight">1,248 Online</p>
               </div>
            </div>

            <div className="col-span-2 p-6 rounded-[2.5rem] glass-card border border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="flex -space-x-4">
                     {[1,2,3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--bg-void)] bg-slate-800 flex items-center justify-center overflow-hidden">
                           <Avatar size={40} name={`peer-${i}`} variant="beam" colors={["#1E1E1E", "#3B82F6"]} />
                        </div>
                     ))}
                  </div>
                  <span className="text-[10px] font-black text-white uppercase italic">Active Contacts</span>
               </div>
               <ArrowRight className="w-5 h-5 text-slate-500" />
            </div>
         </div>

         {/* Footer Meta */}
         <footer className="mt-auto py-10 border-t border-white/5 flex flex-col items-center gap-6">
            <div className="flex gap-4">
               {['SIP', 'QUIC', 'AES'].map(tech => (
                  <span key={tech} className="text-[7px] font-black font-mono text-slate-700 tracking-[.5em] px-3 py-1 rounded-full border border-white/5">{tech}</span>
               ))}
            </div>
            <p className="text-[8px] font-black text-slate-800 uppercase tracking-widest">VoiceMeet Industrial Infrastructure v4.2.0</p>
         </footer>
      </main>
    </div>
  );
}
