import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { 
  Plus, 
  Video, 
  Keyboard, 
  Radio, 
  Globe, 
  Settings, 
  HelpCircle, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Monitor,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isConfigured } from '@/lib/supabase';
import Avatar from "boring-avatars";
import { cn } from '@/lib/utils';
import { useLocalStorage } from '../hooks/use-local-storage';

interface HomeProps {
  session: Session | null;
}

const CAROUSEL_ITEMS = [
  {
    title: "The Architecture",
    headline: "Peer-to-Peer Mesh Networking",
    description: "Direct device-to-device tunneling that bypasses central surveillance. Your data never touches a server, moving through a globally distributed relay of trusted nodes.",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=600&h=600",
    benefit: "Extreme Resilience",
    how: "Through local WebRTC negotiation and relay fallback."
  },
  {
    title: "The Performance",
    headline: "Ultra-Low Latency Nexus",
    description: "Sub-50ms synchronization across all participants. Experience true 'presence' with spatial audio that feels as immediate as a physical briefing room.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?auto=format&fit=crop&q=80&w=600&h=600",
    benefit: "Zero Lag",
    how: "Optimized Opus-Mesh codec with adaptive bit-mapping."
  },
  {
    title: "The Security",
    headline: "Post-Quantum Cryptography",
    description: "Every audio packet is fragmented and encrypted with AES-256-GCM. Indecipherable to anyone outside your specific mesh terminal.",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600&h=600",
    benefit: "Absolute Privacy",
    how: "Hardware-level encryption keys rotated every session."
  }
];

export default function Home({ session }: HomeProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useLocalStorage<'desktop' | 'mobile'>('voicemeet_view_mode', 'desktop');
  const [meetingCode, setMeetingCode] = useState('');
  const [displayName, setDisplayName] = useState(() => {
    return session?.user?.user_metadata?.full_name || localStorage.getItem('voicemeet_identity') || '';
  });
  const [isCreating, setIsCreating] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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

  const nextCarousel = () => setCarouselIndex((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
  const prevCarousel = () => setCarouselIndex((prev) => (prev - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length);

  return (
    <div className="min-h-screen bg-[#00040A] text-white font-sans flex flex-col overflow-hidden relative">
      {/* Background Visuals */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Header */}
      <header className="h-[72px] px-4 md:px-8 flex items-center justify-between border-b border-white/5 relative z-10 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-all">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black uppercase tracking-tighter italic hidden xs:block">VoiceMeet</span>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => setViewMode(viewMode === 'desktop' ? 'mobile' : 'desktop')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white"
          >
            {viewMode === 'desktop' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
            <span className="hidden sm:inline">{viewMode === 'desktop' ? 'Mobile View' : 'Desktop View'}</span>
          </button>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-[11px] font-black text-white leading-none">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          <div className="h-6 w-px bg-white/10 hidden md:block" />

          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full border border-white/10 overflow-hidden ring-2 ring-transparent hover:ring-[var(--accent-primary)]/50 transition-all duration-300">
              <Avatar size={40} name={displayName || 'Guest'} variant="bauhaus" colors={["#121212", "#3B82F6", "#14B8A6"]} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col items-center justify-center px-6 md:px-10 gap-12 lg:gap-20 relative z-10 py-12 transition-all duration-500",
        viewMode === 'mobile' ? "max-w-md mx-auto" : "lg:flex-row"
      )}>
        {/* Left Side: Actions */}
        <div className={cn("flex-1 w-full space-y-12 transition-all", viewMode === 'mobile' ? "text-center" : "max-w-xl")}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("space-y-6 transition-all", viewMode === 'mobile' && "text-center")}
          >
            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-2", viewMode === 'mobile' && "mx-auto")}>
               <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
               <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Protocol v4.2 Security Stack</span>
            </div>
            
            <div className="space-y-4">
              <h1 className={cn("text-5xl md:text-7xl font-black text-white leading-[0.85] italic uppercase tracking-tighter transition-all", viewMode === 'mobile' && "text-4xl")}>
                Deploy. <br/>
                <span className="text-blue-500 underline decoration-white/10 underline-offset-8">Converge.</span> <br/>
                Command.
              </h1>

              <div className={cn("flex flex-col gap-4 pt-2", viewMode === 'mobile' ? "items-center" : "items-start")}>
                <p className={cn("text-lg md:text-xl text-slate-300 leading-tight font-medium transition-all", viewMode === 'mobile' ? "max-w-xs text-center" : "max-w-md text-left")}>
                  The world's most secure 
                  <span className="text-blue-400 font-bold px-1">Decentralized Audio Mesh</span> 
                  for high-stakes tactical coordination.
                </p>

                {/* Feature Images Row */}
                <div className={cn("flex gap-2 pt-2", viewMode === 'mobile' ? "justify-center" : "justify-start")}>
                  {[
                    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=200&h=200",
                    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=200&h=200",
                    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=200&h=200"
                  ].map((src, i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="w-12 h-12 md:w-16 md:h-16 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative"
                    >
                      <img src={src} alt="Protocol Feature" className="w-full h-full object-cover grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all duration-500 cursor-crosshair" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 mt-8", viewMode === 'mobile' ? "text-center" : "text-left max-w-lg")}>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">The "How"</span>
                <p className="text-xs text-slate-500 leading-relaxed">Direct device-to-device tunneling bypassing central surveillance.</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">The Benefit</span>
                <p className="text-xs text-slate-500 leading-relaxed">Zero server costs, zero data logs, total operational sovereignty.</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn("flex flex-col items-stretch gap-4", viewMode !== 'mobile' && "sm:flex-row")}
          >
            <Button 
               onClick={handleCreateMeeting}
               disabled={isCreating}
               className="h-16 px-10 bg-white text-black hover:bg-slate-200 rounded-2xl flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(255,255,255,0.1)] transition-all font-black uppercase text-xs tracking-widest shrink-0"
            >
              <Video className="w-5 h-5" />
              Start New Mesh
            </Button>

            <div className="flex-1 relative flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-1 focus-within:border-blue-500/50 transition-all">
              <div className="pl-4 text-slate-500">
                <Keyboard className="w-5 h-5" />
              </div>
              <form onSubmit={handleJoinMeeting} className="flex-1 flex items-center">
                <Input 
                  placeholder="CODE_OR_RELAY_LINK"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  className="h-14 bg-transparent border-none rounded-xl text-white placeholder:text-slate-800 focus-visible:ring-0 font-black uppercase tracking-widest text-xs"
                />
                <button 
                  type="submit"
                  disabled={!meetingCode.trim()}
                  className="h-14 px-6 bg-blue-600/20 text-blue-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600/30 disabled:opacity-0 transition-all"
                >
                  Join
                </button>
              </form>
            </div>
          </motion.div>

          <div className="h-px bg-white/5 w-full" />
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
             <div className={cn("flex items-center justify-between px-1", viewMode === 'mobile' ? "mx-auto max-w-[200px]" : "max-w-sm")}>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Identity Identifier</span>
                <span className="text-[8px] font-mono text-slate-800">VOICEMEET_ID_v4</span>
             </div>
             <Input 
               placeholder="ENTER UNIQUE CODENAME..." 
               value={displayName}
               onChange={(e) => setDisplayName(e.target.value)}
               className={cn("h-14 bg-white/[0.02] border-white/5 rounded-2xl text-white placeholder:text-slate-900 font-black uppercase tracking-[0.2em] text-xs border focus-visible:ring-1 focus-visible:ring-blue-500/30 transition-all text-center mx-auto lg:mx-0", viewMode === 'mobile' ? "w-full" : "max-w-sm")}
             />
          </motion.div>
        </div>

        {/* Right Side: Carousel */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className={cn(
            "flex-1 w-full flex-col items-center gap-12 transition-all duration-500",
            viewMode === 'mobile' ? "flex" : "max-w-md hidden lg:flex"
          )}
        >
          <div className="relative w-full aspect-square flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={carouselIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center gap-8 text-center"
              >
                <div className="w-72 h-72 rounded-[3.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center relative overflow-hidden backdrop-blur-3xl shadow-2xl group transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-50 z-10" />
                  <img 
                    src={CAROUSEL_ITEMS[carouselIndex].image} 
                    alt={CAROUSEL_ITEMS[carouselIndex].title}
                    className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.3] group-hover:scale-110 group-hover:brightness-[0.5] transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent z-20" />
                  <motion.div
                    key={carouselIndex}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative z-30 flex flex-col items-center gap-2"
                  >
                    <div className="px-3 py-1 rounded-full bg-blue-500 text-[8px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                      {CAROUSEL_ITEMS[carouselIndex].benefit}
                    </div>
                  </motion.div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter">{CAROUSEL_ITEMS[carouselIndex].title}</h2>
                  <div className="space-y-2">
                    <p className="text-xs font-black text-blue-500 uppercase tracking-widest">{CAROUSEL_ITEMS[carouselIndex].headline}</p>
                    <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-xs mx-auto">{CAROUSEL_ITEMS[carouselIndex].description}</p>
                    <div className="pt-2">
                      <span className="text-[8px] font-black text-slate-700 uppercase tracking-[0.2em]">{CAROUSEL_ITEMS[carouselIndex].how}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-x-0 bottom-[-60px] flex items-center justify-between">
               <button onClick={prevCarousel} className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group">
                  <ChevronLeft className="w-6 h-6 text-slate-500 group-hover:text-white" />
               </button>
               <div className="flex gap-3">
                 {CAROUSEL_ITEMS.map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ width: i === carouselIndex ? 32 : 8 }}
                      className={cn("h-2 rounded-full transition-all", i === carouselIndex ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" : "bg-white/10")} 
                    />
                 ))}
               </div>
               <button onClick={nextCarousel} className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group">
                  <ChevronRight className="w-6 h-6 text-slate-500 group-hover:text-white" />
               </button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className={cn(
        "px-10 flex items-center gap-10 text-[9px] font-black uppercase tracking-widest text-slate-600 border-t border-white/5 relative z-10 bg-black/20 backdrop-blur-md transition-all",
        viewMode === 'mobile' ? "h-auto py-6 flex-col gap-4" : "h-[80px]"
      )}>
        <div className={cn("flex gap-8", viewMode === 'mobile' && "flex-col items-center gap-2")}>
           <span className="hover:text-white cursor-pointer transition-colors">Protocol v4.2.0</span>
           <span className="hover:text-white cursor-pointer transition-colors">Mesh Statistics</span>
           <span className="hover:text-white cursor-pointer transition-colors">Node Explorer</span>
        </div>
        <div className={cn("flex items-center gap-6", viewMode === 'mobile' ? "w-full justify-between" : "ml-auto")}>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-500/60 leading-none">Global Backbone Online</span>
           </div>
           <div className="h-4 w-px bg-white/10" />
           <span className="text-slate-800">TRANS_LEVEL_OMEGA</span>
        </div>
      </footer>
    </div>
  );
}

