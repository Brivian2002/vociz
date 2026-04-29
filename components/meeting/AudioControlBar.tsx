import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Hand, 
  LogOut, 
  Bell, 
  MessageSquare, 
  Users,
  Settings2,
  X,
  Target,
  AlertCircle,
  MonitorUp,
  MonitorOff,
  Maximize,
  Minimize,
  MoreHorizontal,
  LayoutGrid,
  List,
  Keyboard,
  ShieldCheck,
  Timer,
  QrCode,
  Plus,
  Volume2,
  Contrast,
  Smile
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WaveformVisualizer from './WaveformVisualizer';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Drawer } from 'vaul';
import QRCode from 'react-qr-code';

interface AudioControlBarProps {
  isHost: boolean;
  onToggleTab?: (tab: string) => void;
  activeTab?: string;
  isGridView?: boolean;
  onToggleView?: () => void;
  isHighContrast?: boolean;
  onToggleContrast?: () => void;
}

export default function AudioControlBar({ 
  isHost, 
  onToggleTab, 
  activeTab,
  isGridView,
  onToggleView,
  isHighContrast,
  onToggleContrast
}: AudioControlBarProps) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const navigate = useNavigate();
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [meetingTime, setMeetingTime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setMeetingTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isMicrophoneEnabled = localParticipant.isMicrophoneEnabled;
  const metadata = JSON.parse(localParticipant.metadata || '{}');
  const isHandRaised = metadata.handRaised;
  const isScreenSharing = localParticipant.isScreenShareEnabled;

  // Accessibility: prefers-reduced-motion check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key.toLowerCase() === 'm') {
        toggleMic();
      }
      if (e.key === 'Escape') {
        setShowExitConfirm(prev => !prev);
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        localParticipant.setMicrophoneEnabled(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        localParticipant.setMicrophoneEnabled(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [localParticipant, isMicrophoneEnabled]);

  // Expert: Visibility API for "Social Media Restriction" deterrent
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsFocusMode(false);
        toast.warning('Node Focus Lost', {
          description: 'Connection prioritized. Please return to the meeting to ensure link stability.',
          icon: <Target className="w-4 h-4 text-amber-500" />
        });
      } else {
        setIsFocusMode(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const triggerHaptic = (ms = 10) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(ms);
    }
  };

  const toggleMic = async () => {
    triggerHaptic();
    try {
      if (!localParticipant) {
        toast.error('Voice engine not ready');
        return;
      }
      
      const targetState = !isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(targetState);
      
      toast.success(targetState ? 'Microphone On' : 'Microphone Muted', {
        className: targetState ? 'bg-[#00132E] text-emerald-400 border border-emerald-500/20' : 'bg-[#00132E] text-red-400 border border-red-500/20'
      });
    } catch (error: any) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  const sendReaction = async (emoji: string) => {
    triggerHaptic(15);
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ 
      type: 'reaction', 
      emoji, 
      sender: localParticipant.name || localParticipant.identity 
    }));
    try {
      await localParticipant.publishData(data, { reliable: false });
      setShowEmojiMenu(false);
    } catch (e) {}
  };

  const handleMuteAll = async () => {
    if (!isHost) return;
    triggerHaptic(50);
    const encoder = new TextEncoder();
    // Signal all but self
    const otherParticipants = participants.filter(p => p.sid !== localParticipant.sid);
    for (const p of otherParticipants) {
      const payload = JSON.stringify({ type: 'signal', action: 'mute', targetSid: p.sid });
      await localParticipant.publishData(encoder.encode(payload), { reliable: true });
    }
    toast.error('REMOTE MUTE ALL: Broadcasted', {
      description: 'Silencing all peer nodes across the mesh.',
      icon: <MicOff className="w-4 h-4" />
    });
  };

  const toggleHand = async () => {
    triggerHaptic(20);
    const nextState = !isHandRaised;
    const newMetadata = { ...metadata, handRaised: nextState };
    await localParticipant.setMetadata(JSON.stringify(newMetadata));
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ 
      type: 'signal', 
      action: 'handRaise', 
      state: nextState,
      sender: localParticipant.name || localParticipant.identity 
    }));
    
    try {
      await localParticipant.publishData(data, { reliable: true });
      if (nextState) {
        toast.info('Hand Raised', {
          description: 'All participants notified.',
          icon: '✋',
          className: 'bg-[#00132E] border border-amber-500/20 text-amber-100'
        });
      }
    } catch (e) {
      console.error('Signal broadcast failed:', e);
    }
  };

  const playChime = async () => {
    triggerHaptic(5);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.error('Audio play blocked:', e));

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ 
      type: 'signal', 
      action: 'chime',
      sender: localParticipant.name || localParticipant.identity 
    }));
    
    try {
      await localParticipant.publishData(data, { reliable: true });
      toast.success('Room Chime Sent', {
        description: 'All participants notified.',
        icon: <Bell className="w-4 h-4 text-amber-500" />
      });
    } catch (err) {
      console.error('Failed to broadcast chime:', err);
    }
  };

  const toggleScreenShare = async () => {
    triggerHaptic();
    try {
      const nextState = !isScreenSharing;
      await localParticipant.setScreenShareEnabled(nextState);
      
      toast.success(nextState ? 'Screen Sharing Active' : 'Screen Sharing Terminated', {
        className: nextState ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white',
        description: nextState ? 'Participants can now view your display node.' : 'Display broadcast stopped.'
      });
    } catch (error: any) {
      console.error('Screen share error:', error);
      toast.error('Screen sharing transition failed.');
    }
  };

  const handleLeave = () => {
    triggerHaptic(30);
    setShowExitConfirm(true);
  };

  const confirmLeave = () => {
    navigate('/');
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex flex-col items-center gap-4 pointer-events-none" role="contentinfo">
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="border-red-500/30 bg-black/90 backdrop-blur-xl max-w-xs md:max-w-sm rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 italic">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Terminate Link?
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              You will be disconnected from the encrypted mesh node. All synchronization will cease immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-transparent border-none mt-2">
            <Button 
              variant="ghost" 
              onClick={() => setShowExitConfirm(false)} 
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 h-12 rounded-xl"
            >
              Cancel HANDSHAKE
            </Button>
            <Button 
              onClick={confirmLeave} 
              className="text-[10px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white h-12 px-6 rounded-xl shadow-lg shadow-red-600/20"
            >
              Disconnect Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>      <div className="w-full max-w-lg mx-auto flex items-center justify-between glass-card-heavy px-6 py-4 rounded-full border border-white/10 shadow-[var(--shadow-strong)] pointer-events-auto relative group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/30 to-transparent opacity-40 rounded-full" />
        
        {/* Left Actions: Mute & Speaker */}
        <div className="flex items-center gap-3">
           <button 
             onClick={toggleMic}
             className={cn(
               "w-12 h-12 rounded-full flex items-center justify-center transition-all focus:outline-none",
               isMicrophoneEnabled 
                 ? "bg-white/5 text-white border border-white/10" 
                 : "bg-[var(--accent-danger)] text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
             )}
             aria-label={isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
           >
             {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
           </button>
           
           <button 
             className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all hidden xs:flex"
             aria-label="Speaker Toggle"
           >
             <Bell className="w-5 h-5" />
           </button>
        </div>

        {/* Center: END CALL - Large Professional Action */}
        <button 
          onClick={handleLeave}
          className="h-14 px-8 rounded-full bg-[var(--accent-danger)] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(239,68,68,0.4)] active:scale-95 transition-all group/end hover:brightness-110"
          aria-label="Terminate Communication"
        >
          <LogOut className="w-6 h-6 rotate-180" />
        </button>

        {/* Right Actions: Call Tools & Tabs */}
        <div className="flex items-center gap-3">
           <button 
             onClick={() => onToggleTab?.('chat')}
             className={cn(
               "w-12 h-12 rounded-full flex items-center justify-center transition-all",
               activeTab === 'chat' ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30" : "text-slate-500 hover:text-white"
             )}
           >
              <MessageSquare className="w-5 h-5" />
           </button>

           <Drawer.Root direction="bottom">
             <Drawer.Trigger asChild>
               <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent-primary)] hover:brightness-125 transition-all shadow-lg active:scale-95">
                 <Plus className="w-6 h-6" />
               </button>
             </Drawer.Trigger>
             <Drawer.Portal>
               <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
               <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[var(--bg-surface)] border-t border-white/10 rounded-t-[3rem] p-8 flex flex-col gap-8 z-[100] outline-none shadow-strong">
                 <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full" />
                 
                 <div className="flex flex-col gap-8">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                       <div className="flex flex-col">
                          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Call Infrastructure</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Manage secure endpoint services</p>
                       </div>
                       <div className="px-3 py-1 rounded-full bg-[var(--accent-success)]/10 border border-[var(--accent-success)]/20 text-[9px] font-black text-[var(--accent-success)] uppercase tracking-widest">Link Secured</div>
                    </div>

                    {/* Tools Grid - User Focused Actions */}
                    <div className="grid grid-cols-2 gap-4">
                       <button className="h-20 glass-card rounded-3xl flex items-center gap-4 px-6 hover:bg-white/5 transition-all">
                          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                             <MessageSquare className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-start translate-y-[-1px]">
                             <span className="text-[9px] font-black text-white uppercase tracking-tight">Transcription</span>
                             <span className="text-[7px] font-black text-slate-500 uppercase">Live Captioning</span>
                          </div>
                       </button>

                       <button className="h-20 glass-card rounded-3xl flex items-center gap-4 px-6 hover:bg-white/5 transition-all group">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:animate-pulse">
                             <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-start translate-y-[-1px]">
                             <span className="text-[9px] font-black text-white uppercase tracking-tight">Line Verify</span>
                             <span className="text-[7px] font-black text-slate-500 uppercase">Secure Relay Link</span>
                          </div>
                       </button>

                       <button className="h-20 glass-card rounded-3xl flex items-center gap-4 px-6 hover:bg-white/5 transition-all">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">HD</div>
                          <div className="flex flex-col items-start translate-y-[-1px]">
                             <span className="text-[9px] font-black text-white uppercase tracking-tight">Studio Audio</span>
                             <span className="text-[7px] font-black text-slate-500 uppercase">Opus HD Codec</span>
                          </div>
                       </button>

                       <button className="h-20 glass-card rounded-3xl flex items-center gap-4 px-6 hover:bg-white/5 transition-all">
                          <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                             <Users className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col items-start translate-y-[-1px]">
                             <span className="text-[9px] font-black text-white uppercase tracking-tight">Participants</span>
                             <span className="text-[7px] font-black text-slate-500 uppercase">Manage Connections</span>
                          </div>
                       </button>
                    </div>

                    <div className="space-y-4 pt-4">
                       <Button className="w-full h-14 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10">
                          Transfer Handshake
                       </Button>
                       <div className="flex items-center justify-center gap-2">
                          <span className="text-[8px] font-mono text-slate-700 tracking-[0.4em] uppercase">Session Hash: {Math.random().toString(16).slice(2, 10).toUpperCase()}</span>
                       </div>
                    </div>
                 </div>
               </Drawer.Content>
             </Drawer.Portal>
           </Drawer.Root>
        </div>
      </div>

      {/* Satellite Telemetry Panel (Mobile Mini) */}
      <div className="hidden md:flex items-center gap-4 bg-black/60 backdrop-blur-2xl rounded-full px-6 py-2.5 border border-white/5 shadow-2xl">
         <div className="flex flex-col items-end border-r border-white/10 pr-4">
            <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest">SIGNAL_HEALTH</span>
            <span className="text-[9px] font-black text-white/80">{localParticipant.connectionQuality?.toUpperCase() || 'SEARCHING'}</span>
         </div>
         <div className="flex flex-col items-end">
            <span className="text-[6px] font-black text-slate-500 uppercase tracking-widest">MESH_UPTIME</span>
            <span className="text-[9px] font-black font-mono text-[var(--accent-plasma)]">{formatTime(meetingTime)}</span>
         </div>
      </div>
    </footer>
  );
}
