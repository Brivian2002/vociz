import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  MicOff, 
  Hand, 
  LogOut, 
  Bell, 
  MoreVertical,
  Settings2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AudioControlBar({ isHost }: { isHost: boolean }) {
  const { localParticipant } = useLocalParticipant();
  const navigate = useNavigate();
  const participants = useParticipants();

  const isMuted = !localParticipant.isMicrophoneEnabled;
  const metadata = JSON.parse(localParticipant.metadata || '{}');
  const isHandRaised = metadata.handRaised;

  const toggleMic = async () => {
    await localParticipant.setMicrophoneEnabled(isMuted);
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
    // In a real app, you'd send a data message to all participants
    // For now, we'll just show a toast and simulate the intent
    toast('Host triggered a chime 🔔', {
      description: 'Attention requested from all participants.',
      duration: 3000,
    });
    
    // Simulate playing sound (this would be better implemented with LiveKit Data messages)
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.error('Audio play blocked:', e));
  };

  return (
    <div className="h-20 flex items-center justify-center gap-4 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 relative shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
      <div className="absolute left-6 text-white/30 text-[10px] font-mono tracking-[0.2em] uppercase hidden md:block">
        VoiceMeet — Secure Audio Link
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="icon"
          onClick={toggleMic}
          className="w-12 h-12 rounded-full transition-all duration-300"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          variant={isHandRaised ? "default" : "outline"}
          size="icon"
          onClick={toggleHand}
          className={`w-12 h-12 rounded-full transition-all duration-300 ${isHandRaised ? 'bg-yellow-500 hover:bg-yellow-600 border-none' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
        >
          <Hand className={`w-5 h-5 ${isHandRaised ? 'animate-bounce text-black' : ''}`} />
        </Button>

        {isHost && (
          <Button
            variant="outline"
            size="icon"
            onClick={playChime}
            className="w-12 h-12 rounded-full bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-primary transition-all duration-300"
          >
            <Bell className="w-5 h-5" />
          </Button>
        )}

        <div className="w-[1px] h-8 bg-white/10 mx-2" />

        <Button
          variant="destructive"
          onClick={handleLeave}
          className="h-12 px-6 rounded-full font-bold tracking-tight gap-2 shadow-lg shadow-red-500/20"
        >
          <LogOut className="w-5 h-5" />
          Leave Call
        </Button>
      </div>

      <div className="absolute right-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-white/30 hover:text-white/60">
          <Settings2 className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white/30 hover:text-white/60">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
