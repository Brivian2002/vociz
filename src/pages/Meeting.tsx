import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import RoomHeader from '@/components/meeting/RoomHeader';
import ParticipantsPanel from '@/components/meeting/ParticipantsPanel';
import ChatPanel from '@/components/meeting/ChatPanel';
import AudioControlBar from '@/components/meeting/AudioControlBar';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MeetingProps {
  session: Session | null;
}

export default function Meeting({ session }: MeetingProps) {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = searchParams.get('name') || session?.user?.user_metadata?.full_name || 'Guest';

  useEffect(() => {
    const validateAndJoin = async () => {
      if (!code) return;

      try {
        // Validate meeting exists
        const { data: meeting, error: fetchError } = await supabase
          .from('meetings')
          .select('*')
          .eq('code', code)
          .single();

        if (fetchError || !meeting) {
          setError('Meeting not found');
          toast.error('This meeting code does not exist.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        setIsHost(session?.user?.id === meeting.host_id);

        // Get LiveKit token from our server
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            room: code, 
            identity: displayName 
          }),
        });

        if (!res.ok) throw new Error('Failed to get join token');

        const { token } = await res.json();
        setToken(token);
      } catch (err: any) {
        console.error('Join error:', err);
        setError('Connection failed');
        toast.error('Could not connect to the voice server.');
      } finally {
        setIsLoading(false);
      }
    };

    validateAndJoin();
  }, [code, session, displayName, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-primary/20 rounded-full" />
          <Loader2 className="w-24 h-24 text-primary animate-spin absolute top-0" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest font-mono">
            Initializing Link
          </h2>
          <p className="text-white/40 font-mono text-sm">SECURE TUNNEL: {code?.toUpperCase()}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 bg-red-500/10 rounded-full mb-6">
          <div className="w-12 h-12 text-red-500 flex items-center justify-center text-4xl font-bold">!</div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">{error}</h2>
        <p className="text-white/50 mb-8 max-w-sm">
          We couldn't get you into the room. Please check the code and your connection.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10 font-bold tracking-tight"
        >
          Return to Base
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token!}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL}
      connect={true}
      className="flex flex-col h-screen bg-[#0a0a0f] text-slate-100 font-sans overflow-hidden relative"
    >
      {/* Background Mesh Gradient Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none z-0"></div>

      <RoomHeader roomCode={code!} />

      <main className="flex-1 flex overflow-hidden p-6 gap-6 z-10">
        {/* Main Stage (Participant Stage) */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4">
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-4 right-4 flex gap-2">
              {isHost && <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase">Host</span>}
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
            <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold border-4 border-white/10 shadow-2xl mb-4 uppercase">
              {displayName.slice(0, 2)}
            </div>
            <div className="text-lg font-medium">{displayName} (You)</div>
            
            <div className="mt-8 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1 bg-emerald-400 rounded-full animate-wave-${i}`} />
              ))}
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center relative">
            <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center text-3xl font-bold border-4 border-white/10 mb-4 opacity-50">
              LK
            </div>
            <div className="text-lg font-medium text-slate-400">AudioSFU Engine</div>
            <div className="absolute bottom-4 text-[10px] uppercase tracking-widest text-white/20">Optimizing Stream...</div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center relative col-span-2">
             <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white/80">Room Capacity: 500+</h3>
                <p className="text-sm text-slate-400">High-fidelity spatial audio link active</p>
             </div>
          </div>
        </div>

        {/* Sidebar: Chat & Participants */}
        <aside className="w-80 flex flex-col gap-4">
          <div className="flex-1 backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 flex flex-col overflow-hidden">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-white/10 h-12 p-0 px-4 gap-4">
                <TabsTrigger 
                  value="chat" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-white/5 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-white shadow-none"
                >
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="participants"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-white/5 text-xs font-bold uppercase tracking-widest text-slate-400 data-[state=active]:text-white shadow-none"
                >
                  Users
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="chat" className="h-full m-0">
                  <ChatPanel roomCode={code!} displayName={displayName} session={session} />
                </TabsContent>
                <TabsContent value="participants" className="h-full m-0">
                  <ParticipantsPanel />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </aside>
      </main>

      <RoomAudioRenderer />
      <AudioControlBar isHost={isHost} />
    </LiveKitRoom>
  );
}
