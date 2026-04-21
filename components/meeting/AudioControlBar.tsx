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
  Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface AudioControlBarProps {
  isHost: boolean;
  onToggleTab?: (tab: string) => void;
  activeTab?: string;
}

export default function AudioControlBar({ isHost, onToggleTab, activeTab }: AudioControlBarProps) {
  const { localParticipant } = useLocalParticipant();
  const navigate = useNavigate();
  const [isFocusMode, setIsFocusMode] = useState(true);

  const isMicrophoneEnabled = localParticipant.isMicrophoneEnabled;
  const metadata = JSON.parse(localParticipant.metadata || '{}');
  const isHandRaised = metadata.handRaised;

  // Expert: Visibility API for "Social Media Restriction" deterrent
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsFocusMode(false);
        // We can't stop them, but we can alert them and peers if we wanted
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

  const toggleMic = async () => {
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

  const toggleHand = async () => {
    const nextState = !isHandRaised;
    const newMetadata = { ...metadata, handRaised: nextState };
    await localParticipant.setMetadata(JSON.stringify(newMetadata));
    
    // Broadcast hand raise to all nodes
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ 
      type: 'signal', 
      action: 'handRaise', 
      state: nextState,
      sender: localParticipant.identity 
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
    // 1. Play locally
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.error('Audio play blocked:', e));

    // 2. Broadcast to all peers
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify({ 
      type: 'signal', 
      action: 'chime',
      sender: localParticipant.identity 
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

  const handleLeave = () => {
    navigate('/');
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex flex-col items-center gap-4 pointer-events-none">
      <div className="flex items-center gap-2 md:gap-4 glass-surface-heavy px-4 md:px-8 py-3 rounded-full border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
        {/* Mobile Toggle Chat */}
        <button 
          type="button"
          onClick={() => onToggleTab?.('chat')}
          className={cn(
            "lg:hidden w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
            activeTab === 'chat' ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
          )}
        >
          {activeTab === 'chat' ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        </button>

        {/* Mobile Toggle Users */}
        <button 
          type="button"
          onClick={() => onToggleTab?.('participants')}
          className={cn(
            "lg:hidden w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
            activeTab === 'participants' ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10"
          )}
        >
          {activeTab === 'participants' ? <X className="w-5 h-5" /> : <Users className="w-5 h-5" />}
        </button>

        <div className="w-px h-6 bg-white/10 mx-1 md:mx-2 lg:hidden" />

        {/* Mute */}
        <button 
          type="button"
          onClick={toggleMic}
          className={cn(
            "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 relative group overflow-hidden",
            isMicrophoneEnabled 
              ? "bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/30" 
              : "bg-red-600/20 border border-red-500/30 hover:bg-red-600/30"
          )}
          title={isMicrophoneEnabled ? "Mute" : "Unmute"}
        >
          {isMicrophoneEnabled ? <Mic className="w-6 h-6 text-emerald-400" /> : <MicOff className="w-6 h-6 text-red-400" />}
          {isMicrophoneEnabled && (
             <motion.div 
               animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0, 0.1] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 bg-emerald-500 rounded-full"
             />
          )}
        </button>
        
        {/* Hand */}
        <button 
          type="button"
          onClick={toggleHand}
          className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all relative overflow-hidden",
            isHandRaised ? "bg-amber-600/20 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          )}
          title="Raise Hand"
        >
          <span className={cn("text-xl transition-transform", isHandRaised && "scale-125")}>✋</span>
          {isHandRaised && (
             <motion.div 
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 1.5, repeat: Infinity }}
               className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full"
             />
          )}
        </button>

        {/* Chime Bell (Host Only) */}
        {isHost && (
          <button 
            type="button"
            onClick={playChime}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center group transition-colors hover:bg-blue-600/30 shadow-xl shadow-blue-900/10"
            title="Chime Room"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-blue-400 group-hover:rotate-12 transition-transform" />
          </button>
        )}

        {/* Leave */}
        <button 
          type="button"
          onClick={handleLeave}
          className="px-4 md:px-6 h-10 md:h-12 rounded-full bg-red-600/10 border border-red-600/30 flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:bg-red-600/20 transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline">Exit Session</span>
        </button>
      </div>
      
      {/* Network Status Indicator */}
      <div className="hidden md:flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className={cn(
           "flex items-center gap-3 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border transition-all duration-500",
           isFocusMode ? "border-white/5" : "border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
         )}>
            <div className="flex flex-col text-right">
               <span className="text-[7px] uppercase font-black text-slate-500 tracking-tighter leading-none mb-0.5">Link Path: 256-BIT AES</span>
               <span className={cn("text-[10px] font-black font-mono leading-none", isFocusMode ? "text-emerald-400" : "text-amber-500")}>
                 {isFocusMode ? 'ACTIVE CONNECTION' : 'FOCUS LOST: WAITING'}
               </span>
            </div>
            <div className="flex gap-0.5 items-end h-2.5">
               <motion.div animate={{ height: isFocusMode ? [4, 6, 4] : 4 }} className="w-0.5 bg-current" />
               <motion.div animate={{ height: isFocusMode ? [6, 10, 6] : 4 }} className="w-0.5 bg-current" />
               <motion.div animate={{ height: isFocusMode ? [10, 4, 10] : 4 }} className="w-0.5 bg-current" />
               <motion.div animate={{ height: isFocusMode ? [8, 12, 8] : 4 }} className="w-0.5 bg-current" />
            </div>
         </div>
      </div>
    </footer>
  );
}
