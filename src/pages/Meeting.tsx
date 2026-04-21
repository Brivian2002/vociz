import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { supabase, isConfigured } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import RoomHeader from '@/components/meeting/RoomHeader';
import ParticipantsPanel from '@/components/meeting/ParticipantsPanel';
import ChatPanel from '@/components/meeting/ChatPanel';
import AudioControlBar from '@/components/meeting/AudioControlBar';
import ParticipantStage from '@/components/meeting/ParticipantStage';
import { Loader2, AlertCircle, ShieldAlert, MessageSquare, Users, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'motion/react';
import { RoomEvent } from 'livekit-client';

function RoomEventListener() {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  useEffect(() => {
    const onDataReceived = (payload: Uint8Array, participant?: any) => {
      const decoder = new TextDecoder();
      const str = decoder.decode(payload);
      try {
        const data = JSON.parse(str);
        if (data.action === 'mute' && data.targetSid === localParticipant.sid) {
          localParticipant.setMicrophoneEnabled(false);
          toast.warning('Host muted your microphone');
        }
        if (data.action === 'lowerHand' && data.targetSid === localParticipant.sid) {
          const metadata = JSON.parse(localParticipant.metadata || '{}');
          const newMetadata = { ...metadata, handRaised: false };
          localParticipant.setMetadata(JSON.stringify(newMetadata));
          toast.info('Host lowered your hand');
        }
      } catch (e) {
        // Ignore non-json
      }
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [room, localParticipant]);

  return null;
}

interface MeetingProps {
  session: Session | null;
}

export default function Meeting({ session: _session }: MeetingProps) {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string>(
    import.meta.env.VITE_LIVEKIT_URL || 
    import.meta.env.NEXT_PUBLIC_LIVEKIT_URL || 
    ''
  );
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const normalizedCode = code?.trim().toLowerCase();

  // Responsive state
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'none'>('none');

  const [displayName, setDisplayName] = useState(searchParams.get('name') || '');
  const isCreator = searchParams.get('host') === 'true';

  useEffect(() => {
    // Sync URL name to state once
    const nameFromUrl = searchParams.get('name');
    if (nameFromUrl && !displayName) {
      setDisplayName(nameFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const validateMeeting = async () => {
      if (!normalizedCode) return;

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
          .eq('code', normalizedCode)
          .maybeSingle();

        if (fetchError) {
          console.warn('Supabase fetch notice (ignoring):', fetchError);
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
  }, [code, navigate, _session?.user?.id]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const roomToJoin = normalizedCode;
      
      // Prioritize the local backend first to ensure consistency in the same environment
      const endpoints = [
        '/api/livekit/token', 
        '/api/token',
        'https://vociz-47v8.onrender.com/api/token',
        'https://vociz.onrender.com/api/token'
      ];
      let res = null;
      let lastError = '';

      for (const endpoint of endpoints) {
        try {
          const attempt = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              room: roomToJoin, 
              identity: displayName,
              isHost: isHost // Pass host status to backend
            }),
          });
          if (attempt.ok) {
            res = attempt;
            console.log(`Connected via API: ${endpoint}`);
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
      const returnedUrl = data.url || data.serverUrl; // Some backends return the URL

      if (typeof joinToken !== 'string') {
        throw new Error('Invalid token format received from server');
      }

      if (returnedUrl) {
        setLiveKitUrl(returnedUrl);
        console.log(`Using LiveKit Server: ${returnedUrl}`);
      }
      
      toast.success('Bridge Established', { 
        description: `Connected to room ${roomToJoin} on ${returnedUrl || liveKitUrl || 'default cluster'}` 
      });

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
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-6 overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
        <div className="relative">
          <div className="w-24 h-24 border-4 border-blue-500/10 rounded-full" />
          <Loader2 className="w-24 h-24 text-blue-500 animate-spin absolute top-0" />
        </div>
        <div className="text-center space-y-2 z-10">
          <h2 className="text-2xl font-bold text-white uppercase tracking-widest font-mono">
            Initializing Link
          </h2>
          <p className="text-slate-500 font-mono text-sm animate-pulse">ESTABLISHING ENCRYPTED CONNECTION: {code?.toUpperCase()}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
        <div className="z-10 glass-surface-heavy rounded-3xl p-12 max-w-md shadow-2xl space-y-6">
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
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        
        <div className="z-10 w-full max-w-md space-y-8">
          <RoomHeader roomCode={code!} />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-surface rounded-3xl p-10 shadow-2xl text-center space-y-8 mt-8 border border-white/10"
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">Ready to join?</h1>
              <p className="text-slate-400 font-medium">Room Code: <span className="text-blue-400 font-mono font-bold">{code}</span></p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold border-4 border-white/10 shadow-2xl uppercase transition-all">
                  {displayName ? displayName.slice(0, 2) : '?'}
                </div>
                <div className="space-y-3 w-full">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-1">Your Identity</label>
                    <Input 
                      placeholder="Who are you?" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-slate-600 text-center font-medium focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleJoin}
                disabled={isJoining || !displayName.trim()}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all"
              >
                {isJoining ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Establishing Link...
                  </div>
                ) : 'Join Meeting'}
              </Button>
            </div>
          </motion.div>

          <p className="text-center text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
            Secured end-to-end voice link
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
      serverUrl={liveKitUrl}
      connect={true}
      className="flex flex-col h-screen bg-[#050508] text-slate-100 font-sans overflow-hidden relative"
    >
      {/* Immersive Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none z-0"></div>

      <RoomHeader roomCode={normalizedCode!} />

      <main className="flex-1 flex overflow-hidden p-4 md:p-6 gap-6 z-10 relative">
        {/* Main Stage */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-0">
          <ParticipantStage />
        </div>

        {/* Sidebar (Desktop Only) */}
        <aside className="hidden lg:flex w-80 xl:w-96 flex-col gap-4">
          <div className="flex-1 glass-surface rounded-3xl overflow-hidden flex flex-col">
            <Tabs defaultValue="chat" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start rounded-none bg-white/5 border-b border-white/5 h-14 p-0 px-4 gap-6">
                <TabsTrigger 
                  value="chat" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs font-bold uppercase tracking-widest text-slate-500 data-[state=active]:text-white shadow-none transition-all px-2"
                >
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="participants"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-xs font-bold uppercase tracking-widest text-slate-500 data-[state=active]:text-white shadow-none transition-all px-2"
                >
                  Users
                </TabsTrigger>
              </TabsList>
              <div className="flex-1 overflow-hidden">
                <TabsContent value="chat" className="h-full m-0">
                  <ChatPanel roomCode={normalizedCode!} displayName={displayName} />
                </TabsContent>
                <TabsContent value="participants" className="h-full m-0">
                  <ParticipantsPanel isHost={isHost} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </aside>

        {/* Mobile Overlays */}
        {activeTab === 'chat' && (
          <div className="fixed inset-0 z-50 lg:hidden glass-surface-heavy animate-in slide-in-from-bottom duration-300">
            <div className="flex flex-col h-full pt-16">
               <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <h2 className="text-xl font-bold">Chat</h2>
                  <Button variant="ghost" size="icon" onClick={() => setActiveTab('none')}><X /></Button>
               </div>
               <div className="flex-1 overflow-hidden">
                <ChatPanel roomCode={normalizedCode!} displayName={displayName} />
               </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div className="fixed inset-0 z-50 lg:hidden glass-surface-heavy animate-in slide-in-from-bottom duration-300">
             <div className="flex flex-col h-full pt-16">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <h2 className="text-xl font-bold">Participants</h2>
                  <Button variant="ghost" size="icon" onClick={() => setActiveTab('none')}><X /></Button>
               </div>
               <div className="flex-1 overflow-hidden">
                <ParticipantsPanel isHost={isHost} />
               </div>
            </div>
          </div>
        )}
      </main>

      <RoomAudioRenderer />
      <AudioControlBar 
        isHost={isHost} 
        onToggleTab={(tab) => setActiveTab(prev => prev === tab ? 'none' : tab as any)}
        activeTab={activeTab}
      />
      <RoomEventListener />
    </LiveKitRoom>
  );
}
