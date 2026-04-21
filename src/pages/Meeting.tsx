import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { supabase, isConfigured } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import RoomHeader from '@/components/meeting/RoomHeader';
import ParticipantsPanel from '@/components/meeting/ParticipantsPanel';
import ChatPanel from '@/components/meeting/ChatPanel';
import AudioControlBar from '@/components/meeting/AudioControlBar';
import { Loader2, AlertCircle, ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';

interface MeetingProps {
  session: Session | null;
}

export default function Meeting({ session: _session }: MeetingProps) {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const displayName = searchParams.get('name') || 'Guest';
  const isCreator = searchParams.get('host') === 'true';

  useEffect(() => {
    const validateMeeting = async () => {
      if (!code) return;

      // If Supabase isn't configured, we skip DB validation and trust the room code
      if (!isConfigured) {
        console.warn('Supabase not configured. Skipping room validation.');
        setIsLoading(false);
        setIsHost(isCreator);
        return;
      }

      try {
        // Attempt to validate meeting exists in DB
        const { data: meeting, error: fetchError } = await supabase
          .from('meetings')
          .select('*')
          .eq('code', code)
          .maybeSingle();

        if (fetchError) {
          console.warn('Supabase fetch notice (ignoring):', fetchError);
          // Don't throw, just allow joining if DB is acting up
        }

        // Host is either the creator (from URL) or the DB record says so
        setIsHost(isCreator || (Boolean(_session?.user?.id) && _session?.user?.id === meeting?.host_id));
      } catch (err: any) {
        console.warn('Validation notice (ignoring):', err);
        setIsHost(isCreator);
      } finally {
        setIsLoading(false);
      }
    };

    validateMeeting();
  }, [code, navigate]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      // Prioritize the external Render backend provided by the user
      const endpoints = [
        'https://vociz.onrender.com/api/token',
        'https://vociz.onrender.com/token',
        '/api/token', 
        '/api/livekit/token'
      ];
      let res = null;
      let lastError = '';

      for (const endpoint of endpoints) {
        try {
          const attempt = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: code, identity: displayName }),
          });
          if (attempt.ok) {
            res = attempt;
            break;
          } else {
            const errBody = await attempt.json().catch(() => ({}));
            lastError = errBody.error || `Error ${attempt.status} from ${endpoint}`;
          }
        } catch (e) {
          lastError = `Endpoint ${endpoint} unreachable`;
        }
      }

      if (!res) throw new Error(lastError || 'Failed to get join token from server');

      const data = await res.json();
      const joinToken = data.token || data; // Handle different API response shapes
      
      if (typeof joinToken !== 'string') {
        throw new Error('Invalid token format received from server');
      }

      setToken(joinToken);
      setHasJoined(true);
    } catch (err: any) {
      console.error('Join error:', err);
      toast.error('Connection failed: ' + (err.message || 'Could not connect to voice server'));
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center gap-6 overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-500/10 rounded-full" />
          <Loader2 className="w-24 h-24 text-blue-500 animate-spin absolute top-0" />
        </div>
        <div className="text-center space-y-2 z-10">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest font-mono">
            Initializing Link
          </h2>
          <p className="text-slate-500 font-mono text-sm animate-pulse">VERIFYING CODE: {code?.toUpperCase()}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
        <div className="z-10 backdrop-blur-xl bg-white/5 rounded-3xl border border-red-500/30 p-12 max-w-md shadow-2xl space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/50">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white tracking-tight">{error}</h2>
            <p className="text-slate-400 leading-relaxed font-medium">
              {errorDetails || "We couldn't get you into the room. Please check the code and your configuration."}
            </p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full h-12 bg-white text-black hover:bg-slate-200 rounded-xl font-bold transition-all"
          >
            Return to Base
          </button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        
        <div className="z-10 w-full max-w-md space-y-8">
          <RoomHeader roomCode={code!} />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-10 shadow-2xl text-center space-y-8 mt-8"
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Ready to join?</h1>
              <p className="text-slate-400 font-medium tracking-tight">Meeting code: <span className="text-blue-400 font-mono">{code}</span></p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-3xl font-bold border-4 border-white/10 shadow-xl uppercase">
                  {displayName.slice(0, 2)}
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Joining as</p>
                  <p className="text-xl font-semibold text-white">{displayName}</p>
                </div>
              </div>

              <Button 
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20"
              >
                {isJoining ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connecting...
                  </div>
                ) : 'Join Now'}
              </Button>
            </div>
          </motion.div>

          <p className="text-center text-slate-500 text-xs font-medium italic">
            Make sure your microphone is ready.
          </p>
        </div>
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
                  <ChatPanel roomCode={code!} displayName={displayName} />
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
