import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import Avatar from "boring-avatars";
import { Hand, Mic, MicOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function ParticipantsPanel() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-bold text-white">Participants ({participants.length})</h3>
        <button className="p-1 hover:bg-white/10 rounded-md">
          <Search className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {participants.map((p) => {
            const isLocal = p.sid === localParticipant?.sid;
            const metadata = JSON.parse(p.metadata || '{}');
            const isHandRaised = metadata.handRaised;
            const isMuted = !p.isMicrophoneEnabled;

            return (
              <div 
                key={p.sid} 
                className={cn(
                  "flex items-center gap-3 p-2 rounded-xl transition-all duration-300 group",
                  isLocal ? "bg-white/10 border border-white/10" : "hover:bg-white/5"
                )}
              >
                <div className="relative">
                  <Avatar
                    size={32}
                    name={p.identity}
                    variant="beam"
                  />
                  {p.isSpeaking && (
                    <div className="absolute -inset-1 border-2 border-emerald-500 rounded-full animate-pulse z-0" />
                  )}
                </div>
                
                <div className="flex-1 text-sm font-medium text-white/90 truncate">
                  {p.identity} {isLocal && '(You)'}
                </div>

                <div className="flex items-center gap-2">
                  {isHandRaised && <span className="text-sm">✋</span>}
                  {isMuted ? (
                    <MicOff className="w-4 h-4 text-red-500" />
                  ) : (
                    <Mic className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

import { Search } from 'lucide-react';
