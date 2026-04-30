import { useLocalParticipant, useParticipants } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { 
  Video,
  VideoOff,
  Mic, 
  MicOff, 
  Hand, 
  LogOut, 
  Bell, 
  MessageSquare, 
  Users,
  Settings2,
  X,
  Target,
  AlertCircle,
  MonitorUp,
  MonitorOff,
  Maximize,
  Minimize,
  MoreHorizontal,
  LayoutGrid,
  List,
  Keyboard,
  ShieldCheck,
  Timer,
  QrCode,
  Plus,
  Volume2,
  Contrast,
  Smile
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import WaveformVisualizer from './WaveformVisualizer';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Drawer } from 'vaul';
import QRCode from 'react-qr-code';

interface AudioControlBarProps {
  isHost: boolean;
  onToggleTab?: (tab: string) => void;
  activeTab?: string;
  isGridView?: boolean;
  onToggleView?: () => void;
  isHighContrast?: boolean;
  onToggleContrast?: () => void;
  onLeave?: () => void;
  viewMode?: 'desktop' | 'mobile';
}

export default function AudioControlBar({ 
  isHost, 
  onToggleTab, 
  activeTab,
  isGridView,
  onToggleView,
  isHighContrast,
  onToggleContrast,
  onLeave,
  viewMode = 'desktop'
}: AudioControlBarProps) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const navigate = useNavigate();
  const [isFocusMode, setIsFocusMode] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [meetingTime, setMeetingTime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setMeetingTime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isMicrophoneEnabled = localParticipant.isMicrophoneEnabled;
  const isCameraEnabled = localParticipant.isCameraEnabled;
  const metadata = JSON.parse(localParticipant.metadata || '{}');
  const isHandRaised = metadata.handRaised;
  const isScreenSharing = localParticipant.isScreenShareEnabled;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 'm') toggleMic();
      if (e.key === 'Escape') setShowExitConfirm(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [localParticipant, isMicrophoneEnabled]);

  const toggleMic = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (e) {}
  };

  const toggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (e) {}
  };

  const toggleHand = async () => {
    const nextState = !isHandRaised;
    await localParticipant.setMetadata(JSON.stringify({ ...metadata, handRaised: nextState }));
    const encoder = new TextEncoder();
    try {
      await localParticipant.publishData(encoder.encode(JSON.stringify({ type: 'signal', action: 'handRaise', state: nextState, sender: localParticipant.identity })), { reliable: true });
    } catch (e) {}
  };

  const toggleScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenSharing);
    } catch (e) {}
  };

  const confirmLeave = () => navigate('/');

  const reactions = ["❤️", "👍", "🎉", "👏", "😂", "😮", "😢", "🤔", "👎"];

  const isMobile = viewMode === 'mobile';

  return (
    <footer className={cn(
      "fixed bottom-0 left-0 right-0 z-50 h-16 md:h-20 bg-[#050508]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-4 md:px-6 pointer-events-auto transition-all",
      isMobile && "h-14"
    )} role="contentinfo">
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent className="border-red-500/30 bg-black/90 backdrop-blur-xl max-w-xs md:max-w-sm rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 italic">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Terminate Link?
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              You will be disconnected from the mesh node.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="bg-transparent border-none mt-2">
            <Button variant="ghost" onClick={() => setShowExitConfirm(false)} className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cancel</Button>
            <Button onClick={confirmLeave} className="bg-red-600 hover:bg-red-500 text-white px-6 rounded-xl">Disconnect Node</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={cn(
        "flex items-center w-full overflow-x-auto scrollbar-hide flex-nowrap gap-2 md:gap-0",
        isMobile ? "px-2" : "justify-between"
      )}>
        {/* Left: System Features Left-Aligned */}
        <div className={cn("flex flex-shrink-0 items-center gap-2 md:gap-6", isMobile ? "min-w-[100px]" : "min-w-[180px]")}>
          <div className="flex flex-col items-start px-1">
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className={cn(
                "font-mono tracking-tighter uppercase whitespace-nowrap opacity-80 decoration-dotted underline underline-offset-4 text-[var(--accent-primary)]",
                isMobile ? "text-[8px]" : "text-[10px]"
              )}>
                N_{localParticipant.sid.slice(0, 4).toUpperCase()}
              </span>
              {!isGridView && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1 md:gap-1.5"
                >
                  <div className={cn("rounded-full bg-blue-500 animate-pulse", isMobile ? "w-0.5 h-0.5" : "w-1 h-1")} />
                  <span className={cn("font-black text-blue-400 uppercase tracking-widest whitespace-nowrap", isMobile ? "text-[6px]" : "text-[7px]")}>
                    Top_Active
                  </span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 md:mt-1.5">
               <WaveformVisualizer className={cn(isMobile ? "h-2" : "h-3")} />
               <span className={cn("font-black text-slate-600 uppercase tracking-[0.1em] leading-none", isMobile ? "text-[5px]" : "text-[6px]")}>
                 {isMobile ? 'SYNC' : 'Signal_Link'}
               </span>
            </div>
          </div>
        </div>

        {/* Center: Main Controls */}
        <div className={cn("flex items-center gap-1 md:gap-3 flex-shrink-0 justify-center", isMobile ? "px-1" : "flex-1")}>
          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={toggleMic}
              className={cn(
                "rounded-full flex items-center justify-center transition-all flex-shrink-0",
                isMobile ? "w-8 h-8" : "w-10 h-10 md:w-11 md:h-11",
                isMicrophoneEnabled ? "bg-[#1E1E1E] text-white hover:bg-white/10" : "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              )}
            >
              {isMicrophoneEnabled ? <Mic className={isMobile ? "w-4 h-4" : "w-5 h-5"} /> : <MicOff className={isMobile ? "w-4 h-4" : "w-5 h-5"} />}
            </button>
            <button 
              onClick={toggleCamera}
              className={cn(
                "rounded-full flex items-center justify-center transition-all flex-shrink-0",
                isMobile ? "w-8 h-8" : "w-10 h-10 md:w-11 md:h-11",
                isCameraEnabled ? "bg-[#1E1E1E] text-white hover:bg-white/10" : "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              )}
            >
              {isCameraEnabled ? <Video className={isMobile ? "w-4 h-4" : "w-5 h-5"} /> : <VideoOff className={isMobile ? "w-4 h-4" : "w-5 h-5"} />}
            </button>
          </div>

          <div className={cn("w-px bg-white/10 flex-shrink-0", isMobile ? "h-4 mx-0.5" : "h-6 mx-1")} />

          <div className="flex items-center gap-1 md:gap-2">
             <button className="w-10 h-10 rounded-full bg-[#1E1E1E] text-white hover:bg-white/10 flex items-center justify-center transition-all hidden md:flex flex-shrink-0">
               <Volume2 className="w-5 h-5" />
             </button>
             
             <div className={cn("relative flex-shrink-0", isMobile && "hidden")}>
               <button 
                 onClick={() => setShowEmojiMenu(!showEmojiMenu)}
                 className={cn("w-10 h-10 rounded-full bg-[#1E1E1E] text-white hover:bg-white/10 flex items-center justify-center transition-all", showEmojiMenu && "bg-white/10 text-white")}
               >
                 <Smile className="w-5 h-5" />
               </button>
               <AnimatePresence>
                 {showEmojiMenu && (
                   <motion.div 
                     initial={{ opacity: 0, y: -20, scale: 0.8 }}
                     animate={{ opacity: 1, y: -60, scale: 1 }}
                     exit={{ opacity: 0, y: -20, scale: 0.8 }}
                     className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-2 bg-[#1E1E1E] border border-white/10 rounded-2xl flex gap-1 shadow-2xl z-[60]"
                   >
                     {reactions.map(e => (
                       <button 
                         key={e} 
                         onClick={() => {
                           const encoder = new TextEncoder();
                           localParticipant.publishData(encoder.encode(JSON.stringify({ type: 'reaction', emoji: e, sender: localParticipant.identity })), { reliable: false });
                           setShowEmojiMenu(false);
                         }}
                         className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-lg text-lg transition-all"
                       >
                         {e}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>

             <button 
               onClick={toggleHand}
               className={cn(
                 "rounded-full flex items-center justify-center transition-all flex-shrink-0",
                 isMobile ? "w-8 h-8" : "w-10 h-10",
                 isHandRaised && "text-amber-400 bg-amber-400/10",
                 !isHandRaised && "bg-[#1E1E1E] text-white hover:bg-white/10"
               )}
             >
               <Hand className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
             </button>

             <Drawer.Root direction="bottom">
               <Drawer.Trigger asChild>
                 <button className={cn(
                   "rounded-full bg-[#1E1E1E] text-white hover:bg-white/10 flex items-center justify-center transition-all flex-shrink-0",
                   isMobile ? "w-8 h-8" : "w-10 h-10"
                 )}>
                   <MoreHorizontal className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                 </button>
               </Drawer.Trigger>
               <Drawer.Portal>
                 <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
                 <Drawer.Content className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-[#0A0A0F] border-t border-white/10 rounded-t-[2.5rem] p-8 flex flex-col gap-6 z-[100] outline-none shadow-2xl">
                   <VisuallyHidden>
                     <Drawer.Title>Meeting Tools</Drawer.Title>
                     <Drawer.Description>Advanced meeting controls.</Drawer.Description>
                   </VisuallyHidden>
                   <div className="mx-auto w-12 h-1 bg-white/10 rounded-full mb-4" />
                   
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto w-full">
                      <button onClick={onToggleView} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3">
                         {isGridView ? <List className="w-6 h-6 text-blue-500" /> : <LayoutGrid className="w-6 h-6 text-blue-500" />}
                         <span className="text-xs font-bold uppercase tracking-widest">Change Layout</span>
                      </button>
                      <button onClick={onToggleContrast} className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3">
                         <Contrast className="w-6 h-6 text-amber-500" />
                         <span className="text-xs font-bold uppercase tracking-widest">High Contrast</span>
                      </button>
                      <button onClick={toggleScreenShare} className={cn("p-6 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all flex flex-col items-center gap-3", isScreenSharing && "border-blue-500/20 bg-blue-500/10")}>
                         <MonitorUp className="w-6 h-6 text-slate-400" />
                         <span className="text-xs font-bold uppercase tracking-widest">{isScreenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
                      </button>
                   </div>
                 </Drawer.Content>
               </Drawer.Portal>
             </Drawer.Root>
          </div>

          <button 
            onClick={onLeave}
            className={cn("ml-1 md:ml-2 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 flex-shrink-0", isMobile ? "w-8 h-8" : "h-10 px-6")}
          >
            <LogOut className={cn(isMobile ? "w-4 h-4" : "w-5 h-5", "rotate-180")} />
          </button>
        </div>

        {/* Right: Info, People, Chat */}
        <div className={cn("flex items-center gap-1 md:gap-2 justify-end flex-shrink-0", isMobile ? "min-w-[80px]" : "min-w-[200px]")}>
          <button 
             onClick={() => onToggleTab?.('oracle')}
             className={cn(
               "rounded-full flex items-center justify-center transition-all",
               isMobile ? "w-7 h-7" : "w-9 h-9 md:w-10 md:h-10",
               activeTab === 'oracle' ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"
             )}
          >
            <Target className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4 md:w-5 md:h-5"} />
          </button>
          <button 
             onClick={() => onToggleTab?.('participants')}
             className={cn(
               "rounded-full flex items-center justify-center transition-all relative",
               isMobile ? "w-7 h-7" : "w-9 h-9 md:w-10 md:h-10",
               activeTab === 'participants' ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"
             )}
          >
            <Users className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4 md:w-5 md:h-5"} />
            <span className={cn("absolute top-0 right-0 bg-blue-500 rounded-full text-[8px] font-black flex items-center justify-center text-white", isMobile ? "w-3 h-3" : "w-3.5 h-3.5 md:w-4 md:h-4")}>{participants.length}</span>
          </button>
          <button 
             onClick={() => onToggleTab?.('chat')}
             className={cn(
               "rounded-full flex items-center justify-center transition-all",
               isMobile ? "w-7 h-7" : "w-9 h-9 md:w-10 md:h-10",
               activeTab === 'chat' ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5"
             )}
          >
            <MessageSquare className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4 md:w-5 md:h-5"} />
          </button>
        </div>
      </div>
    </footer>
  );
}

