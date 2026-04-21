import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Hand, 
  LogOut, 
  Bell, 
  Settings2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AudioControlBar({ isHost }: { isHost: boolean }) {
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
        duration: 1500,
        position: 'top-center'
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
      toast.info('You raised your hand');
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
    <footer className="h-24 flex items-center justify-center gap-4 px-8 z-20 pb-4">
      <div className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl px-8 py-3 rounded-full border border-white/10 shadow-2xl">
        {/* Mute */}
        <button 
          onClick={toggleMic}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center text-white transition-all duration-300",
            isMicrophoneEnabled 
              ? "bg-emerald-500 shadow-lg shadow-emerald-500/20 hover:scale-105" 
              : "bg-red-500 shadow-lg shadow-red-500/20 hover:scale-105"
          )}
        >
          {isMicrophoneEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
        
        {/* Hand */}
        <button 
          onClick={toggleHand}
          className={cn(
            "w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-colors",
            isHandRaised ? "bg-amber-500 text-black border-amber-500" : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          <span className="text-xl">✋</span>
        </button>

        {/* Chime Bell (Host Only) */}
        {isHost && (
          <button 
            onClick={playChime}
            className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center group"
          >
            <Bell className="w-6 h-6 text-amber-400 group-hover:rotate-12 transition-transform" />
          </button>
        )}

        {/* Leave */}
        <button 
          onClick={handleLeave}
          className="px-6 h-12 rounded-full bg-red-600 flex items-center gap-2 text-white font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Leave
        </button>
      </div>
      
      <div className="absolute right-8 hidden md:flex items-center gap-4">
         <div className="flex items-center gap-4 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <div className="flex flex-col text-right">
               <span className="text-[10px] uppercase font-bold text-slate-500">Signal</span>
               <span className="text-[10px] text-emerald-400 font-mono">Excellent</span>
            </div>
            <div className="flex gap-0.5 items-end h-3">
               <div className="w-1 h-0.5 bg-emerald-500"></div>
               <div className="w-1 h-1 bg-emerald-500"></div>
               <div className="w-1 h-2 bg-emerald-500"></div>
               <div className="w-1 h-3 bg-emerald-500"></div>
            </div>
         </div>
      </div>
    </footer>
  );
}
