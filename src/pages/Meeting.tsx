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
import { Loader2, AlertCircle, ShieldAlert, MessageSquare, Users, X, Video, Download, MessageCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { RoomEvent } from 'livekit-client';

import { cn } from '@/lib/utils';

function RoomEventListener({ onNewMessage }: { onNewMessage: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

  useEffect(() => {
    const onDataReceived = (payload: Uint8Array, participant?: any) => {
      const decoder = new TextDecoder();
      const str = decoder.decode(payload);
      try {
        const data = JSON.parse(str);
        
        // Handle signals (Chime/Hand Raise)
        if (data.type === 'signal') {
          if (data.action === 'chime') {
             toast(`Attention: Chime from ${data.sender || 'Host'}`, {
               icon: '🔔',
               className: 'bg-blue-600 text-white font-black'
             });
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
             audio.play().catch(e => console.error('Audio play blocked:', e));
          }
          if (data.action === 'handRaise') {
             if (data.state) {
               toast(`${data.sender || 'Peer'} raised their hand`, {
                 icon: '✋',
                 className: 'bg-amber-500 text-black font-black'
               });
               // Expert Sound Alert for Hand Raise
               const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2633/2633-preview.mp3');
               audio.play().catch(e => console.error('Audio play blocked:', e));
             }
          }
        }

        // Global Chat Detection for Unread Counts
        if (data.type === 'chat') {
          const isFromMe = (data.display_name === localParticipant.identity);
          if (!isFromMe) {
            onNewMessage();
          }
        }

        if (data.action === 'mute' && data.targetSid === localParticipant.sid) {
          localParticipant.setMicrophoneEnabled(false);
          toast.warning('Host muted your microphone', {
            description: 'The host has requested privacy or noise reduction.',
            icon: <ShieldAlert className="w-4 h-4 text-red-500" />
          });
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
  }, [room, localParticipant, onNewMessage]);

  return null;
}

function MeetingTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
       <span className="text-[10px] font-black font-mono text-white tracking-widest">{format(seconds)}</span>
    </div>
  );
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
  const [joinTime, setJoinTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const normalizedCode = code?.trim().toLowerCase();

  // Responsive state
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'none'>('none');
  const [unreadCount, setUnreadCount] = useState(0);

  const [displayName, setDisplayName] = useState(searchParams.get('name') || '');
  const isCreator = searchParams.get('host') === 'true';

  useEffect(() => {
    if (activeTab === 'chat') setUnreadCount(0);
  }, [activeTab]);

  const handleNewMessage = () => {
    if (activeTab !== 'chat') {
      setUnreadCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) {
       toast.info("Application already installed or link established.", {
         description: "Check your home screen or desktop for VoiceMeet."
       });
       return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  useEffect(() => {
    const validateMeeting = async () => {
      if (!normalizedCode) return;

      if (!isConfigured) {
        setIsLoading(false);
        setIsHost(isCreator);
        return;
      }

      try {
        const { data: meeting } = await supabase
          .from('meetings')
          .select('*')
          .eq('code', normalizedCode)
          .maybeSingle();

        setIsHost(isCreator || (Boolean(_session?.user?.id) && _session?.user?.id === meeting?.host_id));
      } catch (err) {
        setIsHost(isCreator);
      } finally {
        setIsLoading(false);
      }
    };

    validateMeeting();
  }, [code, _session?.user?.id]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const roomToJoin = normalizedCode;
      const endpoints = ['/api/livekit/token', '/api/token'];
      let res = null;
      let lastError = '';

      for (const endpoint of endpoints) {
        try {
          const attempt = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: roomToJoin, identity: displayName, isHost }),
          });
          if (attempt.ok) {
            res = attempt;
            break;
          }
        } catch (e) {
          lastError = 'Server unreachable';
        }
      }

      if (!res) throw new Error(lastError || 'Join failed');
      const data = await res.json();
      setJoinTime(new Date());
      setToken(data.token || data);
      if (data.url) setLiveKitUrl(data.url);
      setHasJoined(true);
    } catch (err: any) {
      toast.error(err.message || 'Connection failed');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-6 overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <h2 className="text-xl font-black text-white/50 uppercase tracking-[0.4em] animate-pulse">Establishing Node</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-surface-heavy rounded-3xl p-12 max-w-sm border border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">{error}</h2>
          <Button onClick={() => navigate('/')} className="w-full mt-6 bg-white text-black font-black uppercase tracking-widest text-xs h-12 rounded-xl">Return to Base</Button>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        
        <div className="z-10 w-full max-w-md space-y-8">
           {/* Expert Brand Header with PWA prompt */}
          <div className="flex flex-col items-center gap-6">
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-blue-500/50" />
            <div className="flex items-center gap-4">
               <Video className="w-8 h-8 text-blue-500" />
               <h2 className="text-xl font-black uppercase tracking-[0.3em] text-white">VoiceMeet</h2>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-surface-heavy rounded-[2.5rem] p-10 shadow-3xl text-center space-y-8 mt-8 border border-white/5 bg-black/40"
          >
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/80 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 animate-pulse">Establishing Node Link</span>
              <h1 className="text-3xl font-black text-white tracking-tighter mt-4 italic">PRE-FLIGHT CHECK</h1>
              <p className="text-slate-500 font-mono text-xs">ENCRYPTED ID: <span className="text-blue-400 font-bold">{code?.toUpperCase()}</span></p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="w-28 h-28 rounded-full border border-white/5 flex items-center justify-center p-1 bg-white/[0.02]">
                   <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shadow-inner relative group overflow-hidden">
                      <span className="text-4xl font-black text-white/90 drop-shadow-2xl z-10">{displayName ? displayName.slice(0, 1).toUpperCase() : '?'}</span>
                      <div className="absolute inset-0 bg-blue-400/20 mix-blend-overlay group-hover:scale-110 transition-transform" />
                   </div>
                </div>
                <div className="space-y-4 w-full">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-600 ml-1">Identity Override</label>
                    <Input 
                      placeholder="ENTER NODE IDENTITY" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-14 bg-black/40 border-white/5 rounded-2xl text-white placeholder:text-slate-800 text-center font-black tracking-widest focus:ring-blue-500/30 text-lg border-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleJoin}
                  disabled={isJoining || !displayName.trim()}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 active:scale-[0.98] transition-all border-none"
                >
                  {isJoining ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Engaging...
                    </div>
                  ) : 'INITIATE JOIN'}
                </Button>

                {/* Intelligent PWA Download Button */}
                <Button
                  onClick={handlePWAInstall}
                  variant="outline"
                  className="w-full h-14 bg-white/5 border-white/5 text-slate-400 rounded-[1.2rem] flex items-center justify-center gap-3 hover:text-white hover:bg-white/10 group transition-all"
                >
                   <Download className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em]">Add to Home Base (Android/iOS/PC)</span>
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-between items-center px-4">
             <div className="flex flex-col gap-1 items-start">
                <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">System Version</span>
                <span className="text-[10px] font-black text-slate-500 font-mono">NODE_OS v4.2.1-STABLE</span>
             </div>
             <div className="flex flex-col gap-1 items-end">
                <span className="text-[8px] font-black text-slate-700 uppercase tracking-tighter">Encrypted Via</span>
                <span className="text-[10px] font-black text-blue-500 font-mono">QUANTUM_LIT v2</span>
             </div>
          </div>
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
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none z-0"></div>

      <RoomHeader roomCode={normalizedCode!} joinTime={joinTime!} />

      <main className="flex-1 flex overflow-hidden lg:p-4 gap-4 z-10 relative">
        {/* Main Stage */}
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-0 relative flex flex-col">
           <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
           <div className="absolute top-4 right-6 z-40 hidden md:block">
              <MeetingTimer />
           </div>
           <ParticipantStage />
        </div>

        {/* Floating Draggable Chat Toggle (Expert Mode) */}
        <AnimatePresence>
          {activeTab !== 'chat' && (
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.05}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed right-6 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
            >
               <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveTab('chat')}
                className="w-14 h-14 rounded-2xl bg-[#090b14]/80 backdrop-blur-xl border-white/10 shadow-2xl hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all group relative cursor-grab active:cursor-grabbing"
              >
                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl group-hover:bg-blue-500/20 transition-all" />
                <MessageCircle className="w-6 h-6 relative z-10" />
                
                {unreadCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-lg min-w-[20px] h-5 px-1 flex items-center justify-center border-2 border-black z-20 shadow-lg"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar / Pop-up Overlay (Integrated Chat & Directory) */}
        <AnimatePresence>
          {activeTab !== 'none' && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed lg:relative right-0 top-0 bottom-0 z-50 lg:z-10",
                "w-full sm:w-80 xl:w-96 flex flex-col",
                "bg-[#050508]/80 backdrop-blur-2xl lg:bg-transparent lg:backdrop-blur-none"
              )}
            >
              <div className="flex-1 glass-surface-heavy rounded-none lg:rounded-[2.5rem] overflow-hidden flex flex-col border-none lg:border lg:border-white/5 shadow-3xl lg:bg-[#090b14]/40 h-full">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
                  {/* Expert Tab Header (Hidden on overlay close) */}
                  <div className="flex items-center justify-between bg-white/[0.02] border-b border-white/5 h-16 px-6">
                    <TabsList className="bg-transparent h-full p-0 gap-8">
                      <TabsTrigger 
                        value="chat" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 data-[state=active]:text-white shadow-none transition-all px-0 h-full"
                      >
                        Node Comms
                      </TabsTrigger>
                      <TabsTrigger 
                        value="participants"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 data-[state=active]:text-white shadow-none transition-all px-0 h-full"
                      >
                        Directory
                      </TabsTrigger>
                    </TabsList>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setActiveTab('none')}
                      className="w-10 h-10 rounded-full hover:bg-white/10"
                    >
                      <X className="w-5 h-5 text-slate-500" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="chat" className="h-full m-0">
                      <ChatPanel 
                        roomCode={normalizedCode!} 
                        displayName={displayName} 
                        onClose={() => setActiveTab('none')}
                        onNewMessage={handleNewMessage}
                      />
                    </TabsContent>
                    <TabsContent value="participants" className="h-full m-0">
                      <ParticipantsPanel isHost={isHost} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      <RoomAudioRenderer />
      <AudioControlBar 
        isHost={isHost} 
        onToggleTab={(tab) => setActiveTab(prev => prev === tab ? 'none' : tab as any)}
        activeTab={activeTab}
      />
      <RoomEventListener onNewMessage={handleNewMessage} />
    </LiveKitRoom>
  );
}
