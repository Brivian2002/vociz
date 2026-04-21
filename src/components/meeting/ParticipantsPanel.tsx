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
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/5 shadow-2xl">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-bold text-white/90 tracking-tight flex items-center gap-2">
          Participants
          <Badge variant="secondary" className="bg-white/5 text-white/70 border-none font-mono">
            {participants.length}
          </Badge>
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {participants.map((p) => {
            const isLocal = p.sid === localParticipant.sid;
            const metadata = JSON.parse(p.metadata || '{}');
            const isHandRaised = metadata.handRaised;
            const isMuted = !p.isMicrophoneEnabled;

            return (
              <div 
                key={p.sid} 
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all duration-300 group hover:shadow-xl",
                  isLocal ? "bg-white/10 border border-white/10" : "bg-white/5 border border-transparent hover:border-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      size={40}
                      name={p.identity}
                      variant="beam"
                      colors={["#92A1C6", "#14647D", "#F0C27B", "#F2F2F2", "#848484"]}
                    />
                    {isHandRaised && (
                      <div className="absolute -top-1 -right-1 p-1 bg-yellow-500 rounded-full shadow-lg animate-bounce">
                        <Hand className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90 flex items-center gap-2">
                      {p.identity}
                      {isLocal && <span className="text-[10px] uppercase tracking-widest text-primary font-bold">(You)</span>}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/40 font-mono">
                      {isHandRaised ? 'Hand Raised' : 'Active'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isMuted ? (
                    <MicOff className="w-4 h-4 text-red-500/80" />
                  ) : (
                    <Mic className="w-4 h-4 text-green-500/80 animate-pulse" />
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
