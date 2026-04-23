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
  Contrast,
  Smile
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WaveformVisualizer from './WaveformVisualizer';
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
        className: targetState ? 'bg-[#0a0a0f] text-emerald-400 border border-emerald-500/20' : 'bg-[#0a0a0f] text-red-400 border border-red-500/20'
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
          className: 'bg-[#090b14] border border-blue-500/20'
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
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-surface-heavy p-4 rounded-2xl border border-red-500/30 mb-2 pointer-events-auto flex items-center gap-4 bg-black/80"
            role="alertdialog"
            aria-labelledby="exit-confirm-title"
          >
            <div className="flex flex-col gap-1">
              <span id="exit-confirm-title" className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                Terminate Link?
              </span>
              <span className="text-[8px] text-slate-500 uppercase font-bold">You will be disconnected from the mesh.</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowExitConfirm(false)} className="text-[8px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 h-8">Cancel</Button>
              <Button size="sm" onClick={confirmLeave} className="text-[8px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white h-8 px-4 rounded-lg">Disconnect</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 md:gap-4 glass-surface-heavy px-4 md:px-8 py-3 rounded-full border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto relative">
        {/* Toggle Chat */}
        <button 
          type="button"
          onClick={() => onToggleTab?.('chat')}
          aria-label={activeTab === 'chat' ? "Close Messages" : "Open Messages"}
          aria-pressed={activeTab === 'chat'}
          className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none",
            activeTab === 'chat' ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
          )}
        >
          {activeTab === 'chat' ? <X className="w-5 h-5" aria-hidden="true" /> : <MessageSquare className="w-5 h-5" aria-hidden="true" />}
        </button>

        {/* Toggle Users Directory */}
        <button 
          type="button"
          onClick={() => onToggleTab?.('participants')}
          aria-label={activeTab === 'participants' ? "Close Participant Directory" : "Open Participant Directory"}
          aria-pressed={activeTab === 'participants'}
          className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none",
            activeTab === 'participants' ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
          )}
        >
          {activeTab === 'participants' ? <X className="w-5 h-5" aria-hidden="true" /> : <Users className="w-5 h-5" aria-hidden="true" />}
        </button>

        {/* Mute */}
        <div className="relative group">
          <button 
            type="button"
            onClick={toggleMic}
            aria-label={isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
            aria-pressed={!isMicrophoneEnabled}
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden focus:ring-2 focus:ring-emerald-500 focus:outline-none",
              isMicrophoneEnabled 
                ? "bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30" 
                : "bg-red-600/20 border border-red-500/30 hover:bg-red-600/30"
            )}
          >
            {isMicrophoneEnabled ? <Mic className="w-6 h-6 text-emerald-400" aria-hidden="true" /> : <MicOff className="w-6 h-6 text-red-400" aria-hidden="true" />}
            {isMicrophoneEnabled && !prefersReducedMotion && (
               <motion.div 
                 animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0, 0.1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="absolute inset-0 bg-emerald-500 rounded-full"
                 aria-hidden="true"
               />
            )}
          </button>
          
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
             <WaveformVisualizer className="scale-75" />
          </div>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1 md:mx-2" aria-hidden="true" />
        
        {/* More Options Drawer Trigger */}
        <Drawer.Root direction="bottom">
          <Drawer.Trigger asChild>
            <button 
              type="button"
              aria-label="More Meeting Options"
              className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 focus:ring-2 focus:ring-blue-500 shadow-xl"
            >
              <MoreHorizontal className="w-6 h-6 text-white" />
            </button>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#090b14] border-t border-white/10 rounded-t-[3rem] p-8 flex flex-col gap-8 z-[100] outline-none shadow-[0_-20px_100px_rgba(0,0,0,0.8)]">
              <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mb-2" />
              
              <div className="space-y-8 overflow-y-auto pb-8">
                {/* Header with Invite & Stats */}
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Mesh Link Status</span>
                    <span className="text-xl font-black italic uppercase text-white flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-emerald-400" />
                       Active {formatTime(meetingTime)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-2xl">
                    <QRCode value={window.location.href} size={64} />
                  </div>
                </div>

                {/* Grid Layout for Tools - 2 Lines */}
                <div className="space-y-8">
                   <div className="grid grid-cols-4 gap-4">
                      {/* Priority Line: Functional Tools */}
                      <button onClick={toggleHand} className={cn("flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border", isHandRaised ? "bg-amber-500/20 border-amber-500/30" : "bg-white/5 border-white/5 hover:bg-white/10")}>
                         <Hand className={cn("w-6 h-6", isHandRaised ? "text-amber-400" : "text-slate-400")} />
                         <span className="text-[9px] font-black uppercase tracking-widest">Hand</span>
                      </button>
                      <button onClick={toggleScreenShare} className={cn("flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border", isScreenSharing ? "bg-blue-500/20 border-blue-500/30" : "bg-white/5 border-white/5 hover:bg-white/10")}>
                         <MonitorUp className={cn("w-6 h-6", isScreenSharing ? "text-blue-400" : "text-slate-400")} />
                         <span className="text-[9px] font-black uppercase tracking-widest">Share</span>
                      </button>
                      <button onClick={playChime} className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                         <Bell className="w-6 h-6 text-slate-400" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Chime</span>
                      </button>
                      <button 
                         onClick={() => {
                           if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                           else document.exitFullscreen();
                         }}
                         className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all"
                      >
                         <Maximize className="w-6 h-6 text-slate-400" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Full</span>
                      </button>

                      {/* Visibility Line: Environment Config */}
                      <button onClick={onToggleView} className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                         <LayoutGrid className="w-6 h-6 text-slate-400" />
                         <span className="text-[9px] font-black uppercase tracking-widest">View</span>
                      </button>
                      <button onClick={onToggleContrast} className={cn("flex flex-col items-center gap-3 p-4 rounded-3xl transition-all border", isHighContrast ? "bg-white text-black" : "bg-white/5 border-white/5 hover:bg-white/10")}>
                         <Contrast className={cn("w-6 h-6", isHighContrast ? "text-black" : "text-slate-400")} />
                         <span className="text-[9px] font-black uppercase tracking-widest">Contrast</span>
                      </button>
                      <button onClick={() => setShowEmojiMenu(!showEmojiMenu)} className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                         <Smile className="w-6 h-6 text-slate-400" />
                         <span className="text-[9px] font-black uppercase tracking-widest">React</span>
                      </button>
                      {isHost && (
                        <button onClick={handleMuteAll} className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all group">
                           <MicOff className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                           <span className="text-[9px] font-black uppercase tracking-widest text-red-500">Silence</span>
                        </button>
                      )}
                   </div>
                </div>

                {/* Footer Invite Action */}
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Mesh Invite Cloned", { description: "Link copied to clipboard." });
                  }}
                  className="w-full h-16 bg-white hover:bg-zinc-200 text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98]"
                >
                   <QrCode className="w-5 h-5 mr-3" />
                   Clone Mesh Node Access Link
                </Button>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Leave */}
        <button 
          type="button"
          onClick={handleLeave}
          aria-label="Leave Meeting Session"
          className="px-4 md:px-6 h-10 md:h-12 rounded-full bg-red-600/10 border border-red-600/30 flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:bg-red-600/20 transition-all active:scale-95 focus:ring-2 focus:ring-red-500 focus:outline-none"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
          <span className="hidden md:inline">Exit Session</span>
        </button>
      </div>
      
      {/* Realtime Network Status Indicator */}
      <div className="hidden md:flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500" aria-live="polite">
         <div className={cn(
           "flex items-center gap-3 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border transition-all duration-500",
           isFocusMode ? "border-white/5" : "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
         )}>
            <div className="flex flex-col text-right">
               <span className="text-[7px] uppercase font-black text-slate-500 tracking-tighter leading-none mb-0.5">Link Path: 256-BIT AES</span>
               <div className="flex items-center gap-2">
                 <span className={cn("text-[10px] font-black font-mono leading-none", 
                   localParticipant.connectionQuality === 'excellent' ? "text-emerald-400" :
                   localParticipant.connectionQuality === 'good' ? "text-blue-400" : "text-amber-500"
                 )}>
                   {isFocusMode ? (localParticipant.connectionQuality?.toUpperCase() || 'CONNECTING') : 'FOCUS LOST'}
                 </span>
                 <div className="flex gap-0.5 items-end h-2.5" aria-hidden="true">
                    {[...Array(4)].map((_, i) => {
                      const quality = localParticipant.connectionQuality;
                      const bars = quality === 'excellent' ? 4 : quality === 'good' ? 3 : quality === 'poor' ? 1 : 0;
                      return (
                        <div 
                          key={i} 
                          className={cn(
                            "w-0.5 rounded-full transition-all duration-500",
                            i === 0 ? "h-1" : i === 1 ? "h-1.5" : i === 2 ? "h-2" : "h-2.5",
                            i < bars ? (bars > 2 ? "bg-emerald-500" : "bg-amber-500") : "bg-white/10"
                          )} 
                        />
                      );
                    })}
                 </div>
               </div>
            </div>
         </div>
      </div>
    </footer>
  );
}
