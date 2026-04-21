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
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AudioControlBarProps {
  isHost: boolean;
  onToggleTab?: (tab: string) => void;
  activeTab?: string;
}

export default function AudioControlBar({ isHost, onToggleTab, activeTab }: AudioControlBarProps) {
  const { localParticipant } = useLocalParticipant();
  const navigate = useNavigate();

  const isMicrophoneEnabled = localParticipant.isMicrophoneEnabled;
  const metadata = JSON.parse(localParticipant.metadata || '{}');
  const isHandRaised = metadata.handRaised;

  const toggleMic = async () => {
    try {
      if (!localParticipant) {
        toast.error('Voice engine not ready');
        return;
      }
      
      const targetState = !isMicrophoneEnabled;
      await localParticipant.setMicrophoneEnabled(targetState);
      
      toast.success(targetState ? 'Microphone On' : 'Microphone Muted', {
        duration: 2000,
        position: 'bottom-center',
        className: targetState ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
      });
    } catch (error: any) {
      console.error('Failed to toggle microphone:', error);
      toast.error('Microphone Error', {
        description: 'Please check your browser permissions or hardware connection.'
      });
    }
  };

  const toggleHand = async () => {
    const newMetadata = { ...metadata, handRaised: !isHandRaised };
    await localParticipant.setMetadata(JSON.stringify(newMetadata));
    if (!isHandRaised) {
      toast.info('Hand Raised', {
        icon: '✋',
        position: 'bottom-center'
      });
    }
  };

  const handleLeave = () => {
    navigate('/');
  };

  const playChime = () => {
    toast('Host triggered a chime 🔔', {
      description: 'Attention requested from all participants.',
      duration: 3000,
    });
    
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.error('Audio play blocked:', e));
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex flex-col items-center gap-4 pointer-events-none">
      <div className="flex items-center gap-2 md:gap-4 glass-surface-heavy px-4 md:px-8 py-3 rounded-full border border-white/10 shadow-3xl pointer-events-auto">
        {/* Mobile Toggle Chat */}
        <button 
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
          onClick={toggleMic}
          className={cn(
            "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white transition-all duration-300",
            isMicrophoneEnabled 
              ? "bg-emerald-500 shadow-xl shadow-emerald-500/20 hover:scale-105" 
              : "bg-red-500 shadow-xl shadow-red-500/20 hover:scale-105"
          )}
          title={isMicrophoneEnabled ? "Mute" : "Unmute"}
        >
          {isMicrophoneEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        {/* Hand */}
        <button 
          onClick={toggleHand}
          className={cn(
            "w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center transition-all",
            isHandRaised ? "bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/30" : "bg-white/10 text-white hover:bg-white/20"
          )}
          title="Raise Hand"
        >
          <span className="text-xl">✋</span>
        </button>

        {/* Chime Bell (Host Only) */}
        {isHost && (
          <button 
            onClick={playChime}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group transition-colors hover:bg-amber-500/30"
            title="Chime Room"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-amber-400 group-hover:rotate-12 transition-transform" />
          </button>
        )}

        {/* Leave */}
        <button 
          onClick={handleLeave}
          className="px-4 md:px-6 h-10 md:h-12 rounded-full bg-red-600 flex items-center gap-2 text-white font-bold shadow-xl shadow-red-600/30 hover:bg-red-700 transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline">Leave</span>
        </button>
      </div>
      
      {/* Network Status Indicator */}
      <div className="hidden md:flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="flex items-center gap-3 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
            <div className="flex flex-col text-right">
               <span className="text-[8px] uppercase font-bold text-slate-500 tracking-tighter leading-none mb-0.5">Secure Node</span>
               <span className="text-[9px] text-emerald-400 font-mono leading-none">CONNECTED</span>
            </div>
            <div className="flex gap-0.5 items-end h-2.5">
               <div className="w-0.5 h-1 bg-emerald-500 opacity-50"></div>
               <div className="w-0.5 h-1.5 bg-emerald-500"></div>
               <div className="w-0.5 h-2 bg-emerald-500"></div>
               <div className="w-0.5 h-2.5 bg-emerald-500"></div>
            </div>
         </div>
      </div>
    </footer>
  );
}
