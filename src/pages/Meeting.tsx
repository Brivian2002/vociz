import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useRoomContext, useParticipants } from '@livekit/components-react';
import { supabase, isConfigured } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import RoomHeader from '@/components/meeting/RoomHeader';
import ParticipantsPanel from '@/components/meeting/ParticipantsPanel';
import ChatPanel from '@/components/meeting/ChatPanel';
import AudioControlBar from '@/components/meeting/AudioControlBar';
import ParticipantStage from '@/components/meeting/ParticipantStage';
import { 
  Loader2, 
  AlertCircle, 
  ShieldAlert, 
  MessageSquare, 
  Users, 
  X, 
  Video, 
  Download, 
  MessageCircle, 
  Clock, 
  Globe, 
  Zap, 
  Info, 
  ShieldCheck, 
  Scale, 
  MousePointer2,
  Bell,
  MicOff,
  UserPlus,
  Target
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { RoomEvent } from 'livekit-client';
import { cn } from '@/lib/utils';
import { Drawer } from 'vaul';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Global Room Event Listener for Expert Signaling
function RoomEventListener({ 
  onNewMessage, 
  onReaction,
  onChatMessage,
  roomCode,
  displayName
}: { 
  onNewMessage: () => void,
  onReaction: (emoji: string, sender: string) => void,
  onChatMessage: (msg: Message) => void,
  roomCode: string,
  displayName: string
}) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const navigate = useNavigate();

  useEffect(() => {
    const onDataReceived = (payload: Uint8Array, participant?: any) => {
      const decoder = new TextDecoder();
      const str = decoder.decode(payload);
      try {
        const data = JSON.parse(str);

        // Emoji Burst logic
        if (data.type === 'reaction') {
          onReaction(data.emoji, data.sender);
        }
        
        // Universal Signaling (Everyone hears this)
        if (data.type === 'signal') {
          if (data.action === 'chime') {
             toast(`ATTENTION: Chime from ${data.sender || 'Participant'}`, {
               icon: <Bell className="w-4 h-4 text-amber-500" />,
               className: 'bg-indigo-600 text-white font-black uppercase tracking-tighter'
             });
             const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
             audio.play().catch(e => console.error('Audio play blocked:', e));
          }
          
          if (data.action === 'handRaise') {
             if (data.state) {
               toast(`HAND RAISED: ${data.sender || 'Peer'}`, {
                 icon: '✋',
                 className: 'bg-amber-600 text-white font-black uppercase tracking-tighter'
               });
               const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
               audio.play().catch(e => console.error('Audio play blocked:', e));
             }
          }

          // Host Intelligence Logic
          if (data.action === 'mute' && data.targetSid === localParticipant.sid) {
            localParticipant.setMicrophoneEnabled(false);
            toast.error('REMOTE MUTE: Applied by Host', {
              description: 'Your microphone has been disabled for meeting order.',
              icon: <ShieldAlert className="w-4 h-4 text-red-500" />
            });
          }

          if (data.action === 'lowerHand' && data.targetSid === localParticipant.sid) {
            const metadata = JSON.parse(localParticipant.metadata || '{}');
            localParticipant.setMetadata(JSON.stringify({ ...metadata, handRaised: false }));
            toast.info('Host lowered your hand.');
          }

          if (data.action === 'unmute-request' && data.targetSid === localParticipant.sid) {
            toast('Host requested you to unmute', {
              description: 'Click the microphone icon to enable your audio node.',
              icon: <Zap className="w-4 h-4 text-blue-400" />,
              action: {
                label: 'Unmute',
                onClick: () => localParticipant.setMicrophoneEnabled(true)
              }
            });
          }

          if (data.action === 'remove' && data.targetSid === localParticipant.sid) {
            toast.error('LINK TERMINATED: Removed by Host', {
              description: 'Your connection to this node has been forcefully closed.'
            });
            setTimeout(() => navigate('/'), 2000);
          }
        }

        // Chat Data Sync Target
        if (data.type === 'chat') {
          const incomingMsg: Message = {
            id: data.id || Math.random().toString(),
            meeting_code: roomCode,
            user_id: data.user_id || null,
            display_name: data.display_name || participant?.identity || 'Anonymous',
            message: data.message,
            attachments: data.attachments || [],
            created_at: data.created_at || new Date().toISOString(),
          };
          
          if (incomingMsg.display_name !== displayName) {
            onNewMessage();
          }
          onChatMessage(incomingMsg);
        }
      } catch (e) {}
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => { room.off(RoomEvent.DataReceived, onDataReceived); };
  }, [room, localParticipant, onNewMessage, onChatMessage, roomCode, displayName]);

  return null;
}

function MeetingTimer() {
  const [seconds, setSeconds] = useState(0);
  const [gmtTime, setGmtTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
      setGmtTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const format = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-2 items-end">
      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5 backdrop-blur-md">
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse outline outline-4 outline-emerald-500/20" />
         <span className="text-[10px] font-black font-mono text-white tracking-widest">{format(seconds)}</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.02] rounded-lg border border-white/5 opacity-60">
         <Globe className="w-2.5 h-2.5 text-blue-500" />
         <span className="text-[8px] font-black text-slate-400 font-mono uppercase tracking-tighter">{gmtTime.slice(-12)} GMT</span>
      </div>
    </div>
  );
}

interface MeetingProps {
  session?: any;
}

interface Message {
  id: string;
  meeting_code: string;
  user_id: string | null;
  display_name: string;
  message: string;
  attachments: any[];
  created_at: string;
}

export default function Meeting({ session: _session }: MeetingProps) {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const normalizedCode = code?.trim().toLowerCase();
  const [displayName, setDisplayName] = useState(() => {
    return searchParams.get('name') || localStorage.getItem('voicemeet_identity') || '';
  });
  const isCreator = searchParams.get('host') === 'true';

  const [token, setToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string>(import.meta.env.VITE_LIVEKIT_URL || import.meta.env.NEXT_PUBLIC_LIVEKIT_URL || '');
  const [isHost, setIsHost] = useState(isCreator);
  const [isLoading, setIsLoading] = useState(true);
  const [waitingParticipants, setWaitingParticipants] = useState<any[]>([]);
  const [isWaiting, setIsWaiting] = useState(false);
  const [myRequestId, setMyRequestId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinTime, setJoinTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'none'>('none');
  const [unreadCount, setUnreadCount] = useState(0);
  const [reactions, setReactions] = useState<{id: string, emoji: string, sender: string}[]>([]);
  const [isGridView, setIsGridView] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [preJoinNotif, setPreJoinNotif] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showGuide, setShowGuide] = useState(() => !localStorage.getItem('voicemeet_guided'));

  const closeGuide = () => {
    setShowGuide(false);
    localStorage.setItem('voicemeet_guided', 'true');
  };

  // Pre-join signaling (Broadcast typing/intent)
  useEffect(() => {
    if (!normalizedCode) return;
    const channel = supabase.channel(`signal:${normalizedCode}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'intent' }, ({ payload }) => {
        setPreJoinNotif(payload.message);
        setTimeout(() => setPreJoinNotif(null), 3000);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [normalizedCode]);

  // Broadcast intent as user types or lands
  useEffect(() => {
    if (!normalizedCode || !displayName || hasJoined) return;
    const channel = supabase.channel(`signal:${normalizedCode}`);
    channel.send({
      type: 'broadcast',
      event: 'intent',
      payload: { message: `${displayName.split(' ')[0]} is preparing to join...` }
    });
  }, [displayName, normalizedCode, hasJoined]);

  // Persistent Registry
  useEffect(() => {
    if (displayName) {
      localStorage.setItem('voicemeet_identity', displayName);
    }
  }, [displayName]);

  // Reactions Cleanup
  useEffect(() => {
    if (reactions.length > 0) {
      const timer = setTimeout(() => {
        setReactions(prev => prev.slice(1));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reactions]);

  // Intent & Waiting Room Logic
  useEffect(() => {
    if (!normalizedCode) return;

    const channel = supabase.channel(`waiting:${normalizedCode}`)
      .on('broadcast', { event: 'join-request' }, (payload) => {
        if (isHost && hasJoined) {
          setWaitingParticipants(prev => {
            if (prev.some(p => p.id === payload.payload.id)) return prev;
            return [...prev, payload.payload];
          });
          toast(`LINK REQUEST: ${payload.payload.name}`, {
            description: 'New node requesting admission to the mesh.',
            icon: <UserPlus className="w-4 h-4 text-amber-500" />
          });
        }
      })
      .on('broadcast', { event: 'join-response' }, (payload) => {
        const { targetId, status } = payload.payload;
        if (targetId === myRequestId) {
          if (status === 'approved') {
            setIsWaiting(false);
            handleJoin();
            toast.success('ADMISSION GRANTED', { icon: <ShieldCheck className="w-4 h-4" /> });
          } else if (status === 'denied') {
            setIsWaiting(false);
            setMyRequestId(null);
            toast.error('ADMISSION DENIED', { description: 'The host has rejected your link request.', icon: <ShieldAlert className="w-4 h-4" /> });
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [normalizedCode, isHost, hasJoined, myRequestId]);

  const requestAdmission = async () => {
    if (!displayName.trim()) return;
    
    if (isHost) {
      handleJoin();
      return;
    }

    const requestId = crypto.randomUUID();
    setMyRequestId(requestId);
    setIsWaiting(true);
    
    const channel = supabase.channel(`waiting:${normalizedCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'join-request',
      payload: { id: requestId, name: displayName }
    });
    
    toast.info('REQUEST BROADCAST', { description: 'Admission request sent to the mesh host.' });
  };

  const handleApprove = async (id: string) => {
    const channel = supabase.channel(`waiting:${normalizedCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'join-response',
      payload: { targetId: id, status: 'approved' }
    });
    setWaitingParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleDeny = async (id: string) => {
    const channel = supabase.channel(`waiting:${normalizedCode}`);
    await channel.send({
      type: 'broadcast',
      event: 'join-response',
      payload: { targetId: id, status: 'denied' }
    });
    setWaitingParticipants(prev => prev.filter(p => p.id !== id));
  };

  useEffect(() => {
    if (activeTab === 'chat') setUnreadCount(0);
  }, [activeTab]);

  const handleNewMessage = () => { if (activeTab !== 'chat') setUnreadCount(prev => prev + 1); };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const roomToJoin = normalizedCode;
      const res = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomToJoin, identity: displayName, isHost }),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }
      
      const data = await res.json();
      const now = new Date();
      setJoinTime(now);
      
      if (data.url && !liveKitUrl) {
        setLiveKitUrl(data.url);
      }
      
      setToken(data.token || data);
      setHasJoined(true);
      
      // Attendance Start
      setAttendance(prev => [...prev, { name: displayName, joinAt: now.toLocaleTimeString(), leaveAt: 'ACTIVE' }]);
    } catch (err: any) {
      console.error('Join error:', err);
      setError(err.message || 'Mesh connectivity timeout');
    } finally {
      setIsJoining(false);
    }
  };

  // Persistent Chat Sync
  useEffect(() => {
    if (!hasJoined || !normalizedCode) return;

    const fetchMessages = async () => {
      if (!isConfigured) return;
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('meeting_code', normalizedCode)
        .order('created_at', { ascending: true });
      if (!error && data) setMessages(data);
    };
    fetchMessages();

    if (isConfigured) {
      const channel = supabase
        .channel(`chat:${normalizedCode}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages', 
            filter: `meeting_code=eq.${normalizedCode}` 
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
               if (prev.some(m => m.id === newMsg.id)) return prev;
               const isFromMe = newMsg.display_name === displayName;
               if (!isFromMe) handleNewMessage();
               return [...prev, newMsg];
            });
          }
        ).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [hasJoined, normalizedCode, displayName, activeTab]);

  useEffect(() => {
    // Mission-critical: Resolve loading state once mesh is initialized
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) {
      toast.info('PWA Synchronization Pending', {
         description: 'The browser is still initializing the local bundle. Try again in 5 seconds.',
         icon: <Zap className="w-4 h-4 text-blue-400" />
      });
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('PWA NODE INSTALLED');
      setDeferredPrompt(null);
    }
  };

  const exportAttendance = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(22);
    doc.text('VoiceMeet Session Audit', 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Meeting Code: ${code?.toUpperCase()} | Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableData = attendance.map(a => [a.name, a.joinAt, a.leaveAt, a.duration || 'N/A']);
    doc.autoTable({
      startY: 40,
      head: [['Identity', 'Joined', 'Left', 'Duration']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });
    doc.save(`Attendance_${code}.pdf`);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-slate-100 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden" role="alert">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-red-600/10 blur-[120px] pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 w-full max-w-sm backdrop-blur-xl bg-white/5 rounded-3xl border border-red-500/30 p-8 shadow-2xl text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/50 mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white uppercase tracking-widest">Mesh Link Failure</h1>
            <p className="text-slate-400 text-xs leading-relaxed uppercase font-bold tracking-tighter">
              {error}
            </p>
          </div>
          <Button 
            onClick={() => { setError(null); handleJoin(); }}
            className="w-full h-12 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest"
          >
            Retry Synchronization
          </Button>
          <Button 
            variant="ghost"
            onClick={() => navigate('/')}
            className="w-full text-[8px] font-black uppercase text-slate-500 hover:text-white"
          >
            Return to Command Center
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-6 overflow-hidden relative">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
        <h2 className="text-xl font-black text-white/50 uppercase tracking-[0.4em] animate-pulse italic">Engaging Mesh</h2>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center p-6 overflow-hidden relative font-sans">
        <div className="absolute top-[0%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        
        <div className="z-10 w-full max-w-[280px] flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 shadow-lg group">
            <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform">
              <Video className="w-3.5 h-3.5 text-black" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-[10px] font-black uppercase tracking-tighter text-white italic leading-none">VoiceMeet</h1>
              <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">Encrypted Mesh Node</p>
            </div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#0c0d12]/95 border border-white/10 rounded-[1.25rem] p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] space-y-4 relative overflow-hidden backdrop-blur-xl"
          >
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 border-dashed text-center space-y-1">
                 <MicOff className="w-4 h-4 text-amber-500 mx-auto" aria-hidden="true" />
                 <h3 className="text-[9px] font-black text-white uppercase tracking-tight">Audio Sync Required</h3>
                 <p className="text-[7px] text-slate-500 uppercase font-bold leading-tight px-2">
                    Grant mic access to engage mesh. Encrypted on-device.
                 </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                   <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center p-1 bg-white/[0.01] relative z-10 transition-transform hover:scale-105 active:scale-95 cursor-default">
                      <div className="w-full h-full rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                         <span className="text-xl font-black text-white italic uppercase" aria-hidden="true">{displayName ? displayName.slice(0, 1) : '?'}</span>
                      </div>
                   </div>
                   <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-[#0c0d12] shadow-lg" aria-label="Signal Available" />
                </div>
                
                <div className="space-y-1.5 w-full">
                  <label htmlFor="identity-node" className="text-[7px] uppercase tracking-[0.2em] font-black text-white/20 text-center block">Access Identity</label>
                  <Input 
                    id="identity-node"
                    placeholder="IDENTIFY NODE" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-9 bg-black/40 border-white/5 rounded-lg text-white placeholder:text-zinc-800 text-center font-black tracking-widest focus-visible:ring-1 focus-visible:ring-white/20 text-xs transition-all uppercase border-2"
                  />
                </div>
              </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={requestAdmission}
                    disabled={isJoining || isWaiting || !displayName.trim()}
                    aria-label="Secure join to meeting room"
                    className="w-full h-9 bg-white hover:bg-zinc-200 text-black rounded-lg font-black text-[9px] uppercase tracking-[0.4em] active:scale-[0.98] transition-all border-none relative overflow-hidden group shadow-[0_10px_20px_rgba(255,255,255,0.05)]"
                  >
                    {isJoining ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                        SYNCING
                      </div>
                    ) : isWaiting ? (
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 animate-pulse text-blue-600" aria-hidden="true" />
                        WAITING FOR HOST
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-3 h-3" aria-hidden="true" />
                        JOIN MESH
                      </div>
                    )}
                  </Button>

                <div className="flex items-center justify-center gap-2 pt-2 border-t border-white/5">
                   <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                   <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">
                      BRIDGE: <span className="text-white/40">{code?.toUpperCase()}</span>
                   </p>
                </div>
              </div>
            </div>
          </motion.div>

          <Button
            onClick={handlePWAInstall}
            variant="ghost"
            className="text-white/20 hover:text-white transition-colors text-[8px] font-black uppercase tracking-widest flex items-center gap-2 h-auto py-2"
          >
             <Download className="w-3.5 h-3.5" />
             Install Application Node
          </Button>
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
      className={cn(
        "flex flex-col h-screen bg-[#050508] text-slate-100 font-sans overflow-hidden relative",
        isHighContrast && "grayscale contrast-125"
      )}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none z-0"></div>

      {/* Welcome Guide Overlay */}
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8"
          >
            <div className="max-w-xs w-full text-center space-y-8 glass-surface-heavy p-10 rounded-[3rem] border border-white/10">
               <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl relative">
                  <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 animate-pulse" />
                  <ShieldCheck className="w-10 h-10 text-white relative z-10" />
               </div>
               <div className="space-y-4">
                  <h3 className="text-2xl font-black uppercase text-white italic tracking-tight">Mesh Guide</h3>
                  <div className="flex flex-col gap-4 text-left">
                     <div className="flex gap-4">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">1</div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Share your invite to link peers.</p>
                     </div>
                     <div className="flex gap-4">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black">2</div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Collaborate with real-time audio.</p>
                     </div>
                  </div>
               </div>
               <Button onClick={closeGuide} className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Acknowledge</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-join Intent Notifications */}
      <AnimatePresence>
        {preJoinNotif && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400 shadow-2xl flex items-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {preJoinNotif}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Emoji Layer */}
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        <AnimatePresence>
          {reactions.map((r) => (
            <motion.div
              key={r.id}
              initial={{ y: '110vh', x: `${Math.random() * 80 + 10}vw`, opacity: 0, scale: 0.5 }}
              animate={{ y: '-10vh', opacity: [0, 1, 1, 0], scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, ease: 'easeOut' }}
              className="absolute text-4xl flex flex-col items-center gap-1"
            >
              <div className="px-2 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-black uppercase tracking-tighter text-white mb-2">
                {r.sender}
              </div>
              {r.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <RoomHeader roomCode={normalizedCode!} joinTime={joinTime!} />

      <main className="flex-1 flex overflow-hidden lg:p-4 gap-4 z-10 relative" role="main">
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-0 relative flex flex-col" role="region" aria-label="Participant Stage">
           <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
           <div className="absolute top-4 right-6 z-40">
              <MeetingTimer />
           </div>
           <ParticipantStage isGridView={isGridView} />
        </div>

        <section aria-live="polite" className="sr-only">
           {/* Screen reader only notifications for dynamic events */}
           {messages.length > 0 && `New message from ${messages[messages.length - 1].display_name}`}
        </section>

        {/* Side Panels - Desktop Sidebar Style */}
        <div className="hidden lg:flex gap-4">
          <AnimatePresence>
            {activeTab === 'chat' && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden bg-[#090b14]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl"
              >
                 <ChatPanel 
                   roomCode={normalizedCode!} 
                   displayName={displayName} 
                   onClose={() => setActiveTab('none')} 
                   messages={messages}
                   setMessages={setMessages}
                 />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeTab === 'participants' && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden bg-[#00132E]/60 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl"
              >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between bg-white/[0.02] border-b border-white/5 h-16 px-6">
                      <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/90">Node Directory</h2>
                      <Button variant="ghost" size="icon" onClick={() => setActiveTab('none')} className="w-8 h-8 rounded-full hover:bg-white/10">
                        <X className="w-4 h-4 text-slate-500" />
                      </Button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ParticipantsPanel 
                        isHost={isHost} 
                        waitingParticipants={waitingParticipants}
                        onApprove={handleApprove}
                        onDeny={handleDeny}
                      />
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Panels - Mobile Drawers */}
        <Drawer.Root 
          open={activeTab !== 'none' && typeof window !== 'undefined' && window.innerWidth < 1024} 
          onOpenChange={(open) => !open && setActiveTab('none')}
          direction="bottom"
        >
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
            <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[90vh] bg-[#050508] border-t border-white/10 rounded-t-[3rem] z-[100] outline-none flex flex-col">
              <VisuallyHidden>
                <Drawer.Title>Meeting Panels</Drawer.Title>
                <Drawer.Description>Participants and Chat controls for the current mesh session.</Drawer.Description>
              </VisuallyHidden>
              <div className="mx-auto w-12 h-1 bg-white/10 rounded-full my-4" />
              <div className="flex-1 overflow-hidden">
                 {activeTab === 'chat' && (
                    <ChatPanel 
                     roomCode={normalizedCode!} 
                     displayName={displayName} 
                     onClose={() => setActiveTab('none')} 
                     messages={messages}
                     setMessages={setMessages}
                    />
                 )}
                 {activeTab === 'participants' && (
                    <div className="flex flex-col h-full">
                       <div className="flex items-center justify-between px-8 py-4">
                          <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-white">Participants</h2>
                          <button onClick={() => setActiveTab('none')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                             <X className="w-5 h-5 text-slate-500" />
                          </button>
                       </div>
                       <ParticipantsPanel 
                          isHost={isHost} 
                          waitingParticipants={waitingParticipants}
                          onApprove={handleApprove}
                          onDeny={handleDeny}
                       />
                    </div>
                 )}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </main>

      <RoomAudioRenderer />
      <AudioControlBar 
        isHost={isHost} 
        onToggleTab={(tab) => setActiveTab(prev => prev === tab ? 'none' : tab as any)} 
        activeTab={activeTab}
        isGridView={isGridView}
        onToggleView={() => setIsGridView(!isGridView)}
        isHighContrast={isHighContrast}
        onToggleContrast={() => setIsHighContrast(!isHighContrast)}
      />
      <RoomEventListener 
        onNewMessage={handleNewMessage} 
        onReaction={(emoji, sender) => setReactions(prev => [...prev, { id: Math.random().toString(), emoji, sender }])}
        onChatMessage={(msg) => setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        })} 
        roomCode={normalizedCode!} 
        displayName={displayName} 
      />
    </LiveKitRoom>
  );
}
