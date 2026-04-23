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
  UserPlus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { RoomEvent } from 'livekit-client';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Global Room Event Listener for Expert Signaling
function RoomEventListener({ 
  onNewMessage, 
  onChatMessage,
  roomCode,
  displayName
}: { 
  onNewMessage: () => void,
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
  const [displayName, setDisplayName] = useState(searchParams.get('name') || '');
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
  const [messages, setMessages] = useState<Message[]>([]);

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
        
        <div className="z-10 w-full max-w-sm flex flex-col items-center space-y-10">
          {/* Brand */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Video className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-white/90 italic">VoiceMeet</h1>
          </div>
          
          {/* Join Dashboard */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-[#0c0d12] border border-white/10 rounded-[2rem] p-8 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] space-y-10 relative overflow-hidden"
          >
            <div className="text-center space-y-2">
              <h2 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">PRE-FLIGHT DASHBOARD</h2>
              <div className="h-[2px] w-8 bg-white mx-auto opacity-20" />
            </div>

            <div className="space-y-10">
              <div className="flex flex-col items-center gap-6">
                <div className="text-center space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 border-dashed">
                   <MicOff className="w-5 h-5 text-amber-500 mx-auto" />
                   <p className="text-[9px] font-black uppercase text-slate-400 leading-tight">
                     Hardware mesh requires microphone permission. <br/>
                     <span className="text-white/60">VoiceMeet will sync with your standard audio input.</span>
                   </p>
                </div>

                <div className="relative">
                   <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center p-1 bg-white/[0.01] relative z-10">
                      <div className="w-full h-full rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                         <span className="text-3xl font-black text-white italic uppercase">{displayName ? displayName.slice(0, 1) : '?'}</span>
                      </div>
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#0c0d12] shadow-lg" />
                </div>
                
                <div className="space-y-3 w-full">
                  <label className="text-[9px] uppercase tracking-[0.2em] font-black text-white/30 text-center block">Access Identity</label>
                  <Input 
                    placeholder="IDENTIFY NODE" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-12 bg-black/40 border-white/5 rounded-lg text-white placeholder:text-zinc-800 text-center font-black tracking-widest focus-visible:ring-1 focus-visible:ring-white/20 text-md transition-all uppercase border-2"
                  />
                </div>
              </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={requestAdmission}
                    disabled={isJoining || isWaiting || !displayName.trim()}
                    className="w-full h-12 bg-white hover:bg-zinc-200 text-black rounded-lg font-black text-xs uppercase tracking-[0.4em] active:scale-[0.98] transition-all border-none relative overflow-hidden group shadow-[0_10px_20px_rgba(255,255,255,0.05)]"
                  >
                    {isJoining ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        SYNCING
                      </div>
                    ) : isWaiting ? (
                      <div className="flex items-center gap-3">
                        <Zap className="w-4 h-4 animate-pulse text-blue-600" />
                        WAITING FOR HOST...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-4 h-4" />
                        REQUEST ADMISSION
                      </div>
                    )}
                  </Button>

                <div className="flex items-center justify-center gap-2 mt-4">
                   <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                   <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">
                      Secure Bridge: <span className="text-white/40">{code?.toUpperCase()}</span>
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
      className="flex flex-col h-screen bg-[#050508] text-slate-100 font-sans overflow-hidden relative"
    >
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none z-0"></div>

      <RoomHeader roomCode={normalizedCode!} joinTime={joinTime!} />

      <main className="flex-1 flex overflow-hidden lg:p-4 gap-4 z-10 relative" role="main">
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-0 relative flex flex-col" role="region" aria-label="Participant Stage">
           <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
           <div className="absolute top-4 right-6 z-40">
              <MeetingTimer />
           </div>
           <ParticipantStage />
        </div>

        <section aria-live="polite" className="sr-only">
           {/* Screen reader only notifications for dynamic events */}
           {messages.length > 0 && `New message from ${messages[messages.length - 1].display_name}`}
        </section>

        <AnimatePresence>
          {activeTab !== 'chat' && (
            <motion.div
              drag
              dragConstraints={{ left: -200, right: 0, top: -400, bottom: 400 }}
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
                aria-label={`Open messages. ${unreadCount > 0 ? unreadCount + ' unread' : ''}`}
                className="w-14 h-14 rounded-2xl bg-[#090b14]/80 backdrop-blur-xl border-white/10 shadow-2xl hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all group relative cursor-grab active:cursor-grabbing border-2"
              >
                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl group-hover:bg-blue-500/20 transition-all" />
                <MessageCircle className="w-6 h-6 relative z-10" aria-hidden="true" />
                {unreadCount > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-black rounded-lg min-w-[22px] h-6 px-1.5 flex items-center justify-center border-2 border-black z-20 shadow-xl" aria-hidden="true">
                    {unreadCount}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeTab === 'chat' && (
            <motion.div
              drag
              dragMomentum={false}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              role="complementary"
              aria-label="In-Call Messages"
              className="fixed bottom-28 right-8 z-50 w-[280px] h-[400px] bg-black rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto"
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

        <AnimatePresence mode="wait">
          {activeTab === 'participants' && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              role="complementary"
              aria-label="Node Directory"
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed lg:relative right-0 top-0 bottom-0 z-40 lg:z-10",
                "w-full sm:w-80 xl:w-96 flex flex-col",
                "bg-[#050508]/90 backdrop-blur-3xl lg:bg-transparent lg:backdrop-blur-none"
              )}
            >
              <div className="flex-1 glass-surface-heavy rounded-none lg:rounded-[2.5rem] overflow-hidden flex flex-col border-none lg:border lg:border-white/5 shadow-3xl lg:bg-[#090b14]/40 h-full">
                  <div className="flex items-center justify-between bg-white/[0.02] border-b border-white/5 h-16 px-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-white/90 flex items-center gap-2">
                       <Users className="w-4 h-4 text-blue-400" />
                       Node Directory
                    </h2>
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" onClick={exportAttendance} className="w-8 h-8 rounded-full text-slate-500 hover:text-blue-400" title="Export Audit">
                          <Download className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => setActiveTab('none')} className="w-8 h-8 rounded-full hover:bg-white/10">
                         <X className="w-4 h-4 text-slate-500" />
                       </Button>
                    </div>
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
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      <RoomAudioRenderer />
      <AudioControlBar isHost={isHost} onToggleTab={(tab) => setActiveTab(prev => prev === tab ? 'none' : tab as any)} activeTab={activeTab} />
      <RoomEventListener onNewMessage={handleNewMessage} onChatMessage={(msg) => setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      })} roomCode={normalizedCode!} displayName={displayName} />
    </LiveKitRoom>
  );
}
