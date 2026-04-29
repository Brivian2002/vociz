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
      </Dialog>      <div className="flex items-center gap-3 md:gap-6 glass-surface-heavy px-6 md:px-10 py-5 rounded-[2.5rem] border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] pointer-events-auto relative group">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[var(--accent-plasma)] to-transparent opacity-40" />
        
        {/* Toggle Chat */}
        <button 
          type="button"
          onClick={() => onToggleTab?.('chat')}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all focus:ring-2 focus:ring-[var(--accent-plasma)]/50 focus:outline-none relative group/btn",
            activeTab === 'chat' ? "bg-[var(--accent-plasma)]/20 text-[var(--accent-plasma)] border border-[var(--accent-plasma)]/30" : "bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white"
          )}
        >
          <MessageSquare className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--accent-plasma)] opacity-0 group-hover/btn:opacity-100 transition-opacity" />
        </button>

        {/* Directory Toggle */}
        <button 
          type="button"
          onClick={() => onToggleTab?.('participants')}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all focus:ring-2 focus:ring-[var(--accent-plasma)]/50 focus:outline-none relative",
            activeTab === 'participants' ? "bg-[var(--accent-plasma)]/20 text-[var(--accent-plasma)] border border-[var(--accent-plasma)]/30" : "bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white"
          )}
        >
          <Users className="w-5 h-5" />
        </button>

        <div className="w-px h-10 bg-white/5 mx-2" />

        {/* PUSH-TO-WHISPER Main Engine */}
        <div className="flex items-center gap-3 px-6 py-2 bg-black/40 rounded-[2rem] border border-white/5">
           <div className="flex flex-col items-center">
              <span className="text-[6px] font-black uppercase text-slate-600 tracking-[0.3em] mb-1 leading-none">SIGNAL ENGINE</span>
              <button 
                onMouseDown={() => localParticipant.setMicrophoneEnabled(true)}
                onMouseUp={() => localParticipant.setMicrophoneEnabled(isMicrophoneEnabled)} // Revert to toggle state
                className={cn(
                  "w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all duration-500 relative group/mic",
                  isMicrophoneEnabled 
                    ? "bg-[var(--accent-plasma)] shadow-[0_0_40px_rgba(37,99,235,0.4)]" 
                    : "bg-white/[0.03] hover:bg-white/[0.06] border border-stone-800"
                )}
              >
                {isMicrophoneEnabled ? (
                  <Mic className="w-8 h-8 text-white animate-pulse" />
                ) : (
                  <MicOff className="w-8 h-8 text-slate-600 group-hover/mic:text-slate-400" />
                )}
                
                {isMicrophoneEnabled && (
                  <div className="absolute inset-[-8px] rounded-[2.5rem] border-2 border-[var(--accent-plasma)] animate-ping opacity-20" />
                )}
              </button>
           </div>
           
           <div className="flex flex-col gap-1">
              <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">PTW_PROTOCOL</div>
              <div className="flex items-center gap-1.5 h-6">
                 {[1,2,3,4,5,6].map(i => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-1 rounded-full transition-all duration-300",
                        isMicrophoneEnabled ? "bg-[var(--accent-plasma)]" : "bg-white/5",
                        isMicrophoneEnabled ? (i % 2 === 0 ? "h-4" : "h-2") : "h-1"
                      )} 
                    />
                 ))}
              </div>
              <span className="text-[6px] font-mono text-[var(--accent-plasma)]/60 uppercase tracking-widest">{isMicrophoneEnabled ? 'LINK_ENGAGED' : 'QUIET_MODE'}</span>
           </div>
        </div>

        <div className="w-px h-10 bg-white/5 mx-2" />

        {/* Oracle / Settings Toggle */}
        <button 
          onClick={() => onToggleTab?.('oracle')}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all focus:ring-2 focus:outline-none relative group",
            activeTab === 'oracle' 
              ? "bg-[var(--accent-quantum)]/20 text-[var(--accent-quantum)] border border-[var(--accent-quantum)]/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]" 
              : "bg-white/[0.03] border border-white/5 text-slate-500 hover:text-[var(--accent-quantum)] hover:border-[var(--accent-quantum)]/40"
          )}
        >
          <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <div className={cn(
            "absolute -top-1 -left-1 w-2 h-2 rounded-full bg-[var(--accent-quantum)] transition-opacity",
            activeTab === 'oracle' ? "opacity-100" : "opacity-0 group-hover:opacity-40"
          )} />
        </button>

        {/* More Actions */}
        <Drawer.Root direction="bottom">
          <Drawer.Trigger asChild>
            <button className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all">
              <Settings2 className="w-5 h-5" />
            </button>
          </Drawer.Trigger>
          {/* Drawer content keeps its existing logic but styled with Obsidian */}
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[var(--bg-void)] border-t border-white/5 rounded-t-[4rem] p-10 flex flex-col gap-8 z-[100] outline-none shadow-[0_-40px_100px_rgba(0,0,0,1)]">
              <div className="mx-auto w-16 h-1 bg-white/10 rounded-full" />
              <div className="space-y-10 overflow-y-auto pb-12">
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                       <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Command Deck</h3>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adjust persistent mesh parameters</p>
                    </div>
                    <div className="p-2 bg-white rounded-xl shadow-2xl">
                       <QRCode value={window.location.href} size={48} />
                    </div>
                 </div>

                 <div className="grid grid-cols-4 gap-4">
                    <button onClick={toggleHand} className={cn("aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 border transition-all", isHandRaised ? "bg-amber-500/20 border-amber-500/40 text-amber-500" : "bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/[0.05]")}>
                       <Hand className="w-8 h-8" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Signal</span>
                    </button>
                    <button onClick={toggleScreenShare} className={cn("aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 border transition-all", isScreenSharing ? "bg-blue-500/20 border-blue-500/40 text-blue-500" : "bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/[0.05]")}>
                       <MonitorUp className="w-8 h-8" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Cast</span>
                    </button>
                    <button onClick={playChime} className="aspect-square rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-white transition-all">
                       <Bell className="w-8 h-8" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Alert</span>
                    </button>
                    <button onClick={onToggleView} className="aspect-square rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-white transition-all">
                       <LayoutGrid className="w-8 h-8" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Map</span>
                    </button>
                 </div>

                 <div className="flex gap-4">
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success('BRIDGE_LINK_COPIED');
                      }}
                      variant="ghost" 
                      className="flex-1 h-14 bg-white/[0.03] text-white/40 border border-white/5 text-[9px] font-black uppercase tracking-[0.4em] rounded-2xl"
                    >
                       <QrCode className="w-4 h-4 mr-3 opacity-30" />
                       Clone Access Link
                    </Button>
                    <Button 
                      onClick={handleLeave}
                      variant="ghost" 
                      className="flex-1 h-14 bg-red-950/20 text-red-500 border border-red-900/30 text-[9px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-red-900/40"
                    >
                       <LogOut className="w-4 h-4 mr-3" />
                       Sever Handshake
                    </Button>
                 </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
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
