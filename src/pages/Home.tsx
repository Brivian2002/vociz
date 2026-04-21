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

interface HomeProps {
  session: Session | null;
}

export default function Home({ session }: HomeProps) {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [displayName, setDisplayName] = useState(session?.user?.user_metadata?.full_name || '');
  const [isCreating, setIsCreating] = useState(false);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans overflow-hidden relative flex flex-col items-center justify-center p-6">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 w-full max-w-md backdrop-blur-xl bg-white/5 rounded-3xl border border-red-500/30 p-8 shadow-2xl text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/50 mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Configuration Required</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Supabase environment variables are missing. To use VoiceMeet, please add the following secrets in the AI Studio sidebar:
            </p>
          </div>
          <div className="text-left bg-black/40 p-4 rounded-xl font-mono text-xs text-red-400 border border-red-500/20 space-y-2">
            <p>VITE_SUPABASE_URL</p>
            <p>VITE_SUPABASE_ANON_KEY</p>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold pt-4">Check console for details</p>
        </motion.div>
      </div>
    );
  }

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error('Failed to sign in with Google');
  };

  const handleCreateMeeting = async () => {
    if (!displayName.trim()) {
      toast.error('Identity required', { description: 'Please enter your name before starting a meeting.' });
      return;
    }

    setIsCreating(true);
    const code = nanoid(10).toLowerCase();
    
    try {
      // Try to save to DB, but don't block if it fails or if user is anonymous
      if (isConfigured) {
        await supabase
          .from('meetings')
          .insert({
            code,
            is_active: true,
          });
      }
      
      navigate(`/meet/${code}?name=${encodeURIComponent(displayName)}&host=true`);
    } catch (error: any) {
      console.warn('Meeting creation DB notice:', error);
      // Still navigate even if DB save fails - the room exists in LiveKit dynamically
      navigate(`/meet/${code}?name=${encodeURIComponent(displayName)}&host=true`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) {
      toast.error('Please enter a meeting code');
      return;
    }
    if (!displayName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    navigate(`/meet/${meetingCode.trim().toLowerCase()}?name=${encodeURIComponent(displayName)}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans overflow-hidden relative flex flex-col items-center justify-center p-6">
      {/* Background Mesh Gradient Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 shadow-xl shadow-blue-500/20 mb-4 mx-auto">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">VoiceMeet</h1>
          <p className="text-slate-400 text-lg font-medium">Secure, high-fidelity audio conferencing.</p>
        </div>

        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <Button 
                onClick={handleCreateMeeting} 
                disabled={isCreating}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 gap-2"
              >
                <Plus className="w-6 h-6" />
                {isCreating ? 'Initializing...' : 'Start New Meeting'}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
                <span className="relative z-10 px-4 bg-[#0a0a0f] text-[10px] uppercase tracking-widest font-bold text-slate-600 left-1/2 -translate-x-1/2 transition-colors">OR JOIN EXISTING</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Meeting Code</label>
                  <Input 
                    placeholder="e.g. abc-xyz-123" 
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Your Name</label>
                  <Input 
                    placeholder="Enter your display name" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600"
                  />
                </div>
                <Button 
                  onClick={handleJoinMeeting}
                  disabled={!meetingCode || !displayName}
                  variant="outline"
                  className="w-full h-12 border-white/10 hover:bg-white/5 text-white rounded-xl font-bold"
                >
                  Join Room
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 text-slate-500">
           <div className="flex flex-col items-center gap-1">
              <span className="text-xl">🔒</span>
              <span className="text-[10px] uppercase font-bold tracking-tighter">SECURE</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <span className="text-xl">📡</span>
              <span className="text-[10px] uppercase font-bold tracking-tighter">LOW LATENCY</span>
           </div>
           <div className="flex flex-col items-center gap-1">
              <span className="text-xl">💎</span>
              <span className="text-[10px] uppercase font-bold tracking-tighter">48KHZ AUDIO</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
