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
  MicOff
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
function RoomEventListener({ onNewMessage }: { onNewMessage: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();

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
        }

        if (data.type === 'chat') {
          const isFromMe = (data.display_name === localParticipant.identity);
          if (!isFromMe) onNewMessage();
        }

        if (data.action === 'mute' && data.targetSid === localParticipant.sid) {
          localParticipant.setMicrophoneEnabled(false);
          toast.warning('Host muted your microphone', { icon: <ShieldAlert className="w-4 h-4 text-red-500" /> });
        }
      } catch (e) {}
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    return () => { room.off(RoomEvent.DataReceived, onDataReceived); };
  }, [room, localParticipant, onNewMessage]);

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

export default function Meeting({ session: _session }: MeetingProps) {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState<string | null>(null);
  const [liveKitUrl, setLiveKitUrl] = useState<string>(import.meta.env.VITE_LIVEKIT_URL || import.meta.env.NEXT_PUBLIC_LIVEKIT_URL || '');
  const [isHost, setIsHost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mission-critical: Resolve loading state once mesh is initialized
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinTime, setJoinTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);

  const normalizedCode = code?.trim().toLowerCase();
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'none'>('none');
  const [unreadCount, setUnreadCount] = useState(0);
  const [displayName, setDisplayName] = useState(searchParams.get('name') || '');
  const isCreator = searchParams.get('host') === 'true';

  useEffect(() => {
    if (isCreator) setIsHost(true);
  }, [isCreator]);

  useEffect(() => {
    if (activeTab === 'chat') setUnreadCount(0);
  }, [activeTab]);

  const handleNewMessage = () => { if (activeTab !== 'chat') setUnreadCount(prev => prev + 1); };

  // Intent to Join Notification
  useEffect(() => {
    if (!normalizedCode || hasJoined) return;
    const channel = supabase.channel(`intent:${normalizedCode}`)
      .on('broadcast', { event: 'joining' }, (payload) => {
        toast(`${payload.payload.name} is about to enter the node`, {
          icon: <Zap className="w-4 h-4 text-blue-400" />,
          duration: 3000
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [normalizedCode, hasJoined]);

  const broadcastJoinIntent = async () => {
    if (!displayName.trim()) return;
    const channel = supabase.channel(`intent:${normalizedCode}`);
    await channel.send({ type: 'broadcast', event: 'joining', payload: { name: displayName } });
  };

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

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const roomToJoin = normalizedCode;
      const res = await fetch('/api/livekit/token', {
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
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setIsJoining(false);
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
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
        
        <div className="z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Brand & Visuals */}
          <div className="space-y-12">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40 transform -rotate-12">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">VoiceMeet</h1>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] ml-1">Universal Bridge</span>
              </div>
            </div>

            <div className="glass-surface-heavy rounded-[2rem] p-8 border border-white/5 bg-black/40 space-y-6">
               <div className="flex items-center gap-4 text-white/80">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                     <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Protocol Rules</h3>
               </div>
               <div className="grid gap-4">
                  {[
                    { icon: <MousePointer2 className="w-4 h-4" />, text: "Use your real identity (Rename if needed)" },
                    { icon: <MicOff className="w-4 h-4" />, text: "Keep Mic Muted unless speaking" },
                    { icon: <Scale className="w-4 h-4" />, text: "Maintain respect & professional order" },
                    { icon: <ShieldAlert className="w-4 h-4" />, text: "Session is encrypted and logged" }
                  ].map((rule, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                       <div className="w-8 h-8 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-blue-500 transition-colors">
                          {rule.icon}
                       </div>
                       <p className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">{rule.text}</p>
                    </div>
                  ))}
               </div>
            </div>
            
            <div className="flex items-center gap-6 opacity-40">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-700 uppercase">Latency Target</span>
                  <span className="text-xs font-mono font-black text-slate-500">&lt; 30ms Mesh</span>
               </div>
               <div className="w-px h-8 bg-white/10" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-700 uppercase">Security Tier</span>
                  <span className="text-xs font-mono font-black text-slate-500">AES-256 GCM</span>
               </div>
            </div>
          </div>
          
          {/* Right Side: Join Dashboard */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-surface-heavy rounded-[3rem] p-12 shadow-3xl space-y-10 border border-white/5 bg-black/60 backdrop-blur-3xl relative"
          >
            <div className="absolute top-8 right-10">
               <Zap className="w-6 h-6 text-blue-500/20 animate-pulse" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white italic tracking-tight">PRE-FLIGHT DASHBOARD</h2>
              <p className="text-slate-600 font-mono text-[10px] uppercase tracking-widest">Bridging Node: <span className="text-blue-500 font-black">{code?.toUpperCase()}</span></p>
            </div>

            <div className="space-y-10">
              <div className="flex flex-col items-center gap-8">
                <div className="relative group">
                   <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-110 group-hover:bg-blue-500/30 transition-all" />
                   <div className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center p-1.5 bg-white/[0.03] relative z-10 overflow-hidden">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-blue-950 flex items-center justify-center shadow-inner relative group/avatar">
                         <span className="text-5xl font-black text-white drop-shadow-2xl z-10 uppercase italic">{displayName ? displayName.slice(0, 1) : '?'}</span>
                         <div className="absolute inset-0 bg-blue-400/10 mix-blend-overlay group-hover/avatar:scale-125 transition-transform duration-1000" />
                      </div>
                   </div>
                </div>
                
                <div className="space-y-4 w-full">
                  <div className="space-y-2.5">
                    <label className="text-[9px] uppercase tracking-[0.3em] font-black text-slate-600 ml-4">Identity Authorization</label>
                    <Input 
                      placeholder="ENTER NODE IDENTITY" 
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        broadcastJoinIntent();
                      }}
                      className="h-16 bg-black/60 border-white/10 rounded-2xl text-white placeholder:text-slate-800 text-center font-black tracking-widest focus:ring-blue-500/30 text-xl border-2 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button 
                  onClick={handleJoin}
                  disabled={isJoining || !displayName.trim()}
                  className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/40 active:scale-95 transition-all border-none relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  {isJoining ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Initializing Node...
                    </div>
                  ) : 'AUTHENTICATE & JOIN'}
                </Button>

                <Button
                  onClick={handlePWAInstall}
                  variant="outline"
                  className="w-full h-14 bg-white/[0.02] border-white/5 text-slate-500 rounded-[1.4rem] flex items-center justify-center gap-4 hover:text-white hover:bg-white/10 transition-all font-black uppercase text-[9px] tracking-widest"
                >
                   <Download className="w-4 h-4 text-blue-500" />
                   System Install (Desktop/Mobile)
                </Button>
              </div>
            </div>
          </motion.div>
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

      <main className="flex-1 flex overflow-hidden lg:p-4 gap-4 z-10 relative">
        <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-0 relative flex flex-col">
           <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
           <div className="absolute top-4 right-6 z-40">
              <MeetingTimer />
           </div>
           <ParticipantStage />
        </div>

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
                className="w-14 h-14 rounded-2xl bg-[#090b14]/80 backdrop-blur-xl border-white/10 shadow-2xl hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all group relative cursor-grab active:cursor-grabbing border-2"
              >
                <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-xl group-hover:bg-blue-500/20 transition-all" />
                <MessageCircle className="w-6 h-6 relative z-10" />
                {unreadCount > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black rounded-lg min-w-[22px] h-6 px-1.5 flex items-center justify-center border-2 border-[#050508] z-20 shadow-xl">
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
              className="fixed bottom-24 right-6 z-50 w-[360px] h-[480px] glass-surface-heavy rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] flex flex-col pointer-events-auto"
            >
               <ChatPanel roomCode={normalizedCode!} displayName={displayName} onClose={() => setActiveTab('none')} onNewMessage={handleNewMessage} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'participants' && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
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
                    <ParticipantsPanel isHost={isHost} />
                  </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      <RoomAudioRenderer />
      <AudioControlBar isHost={isHost} onToggleTab={(tab) => setActiveTab(prev => prev === tab ? 'none' : tab as any)} activeTab={activeTab} />
      <RoomEventListener onNewMessage={handleNewMessage} />
    </LiveKitRoom>
  );
}
