import React, { useState, useEffect, useRef } from 'react';
import { supabase, isConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Paperclip, 
  X, 
  Bold, 
  Italic, 
  Code, 
  Link,
  Download,
  ShieldCheck,
  Zap,
  Terminal,
  PaperclipIcon,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocalParticipant } from '@livekit/components-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Message {
  id: string;
  meeting_code: string;
  user_id: string | null;
  display_name: string;
  message: string;
  attachments: any[];
  created_at: string;
}

export default function ChatPanel({ 
  roomCode, 
  displayName, 
  onClose, 
  messages,
  setMessages
}: { 
  roomCode: string, 
  displayName: string,
  onClose?: () => void,
  messages: Message[],
  setMessages?: React.Dispatch<React.SetStateAction<Message[]>>
}) {
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const insertFormat = (tag: string, endTag?: string) => {
    setNewMessage(prev => `${prev}${tag}${endTag || tag}`);
  };

  const handleExportHistory = () => {
    if (messages.length === 0) {
      toast.info('No data for export.');
      return;
    }

    try {
      const doc = new jsPDF() as any;
      doc.setFontSize(18);
      doc.text('INDUSTRIAL COMMS ARCHIVE', 14, 20);
      doc.setFontSize(8);
      doc.text(`SESSION_ID: ${roomCode}`, 14, 28);
      doc.text(`EXPORT_TS: ${new Date().toISOString()}`, 14, 33);
      
      const tableData = messages.map(msg => [
        new Date(msg.created_at).toLocaleTimeString(),
        msg.display_name.toUpperCase(),
        msg.message || '[ATTACHMENT]'
      ]);

      doc.autoTable({
        startY: 40,
        head: [['TS', 'IDENTITY', 'CONTENT']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [20, 20, 30], textColor: [255, 255, 255], fontSize: 7 },
        styles: { fontSize: 7 }
      });

      doc.save(`LOG_${roomCode}.pdf`);
      toast.success('Archive Exported.');
    } catch (err) {
      toast.error('Export failed.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !localParticipant) return;

    const messageToSend = newMessage.trim();
    const msgId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    setNewMessage('');

    const chatPayload = {
      type: 'chat',
      id: msgId,
      display_name: displayName,
      message: messageToSend,
      attachments: [],
      created_at: timestamp
    };

    const localMsg: Message = {
      id: msgId,
      meeting_code: roomCode,
      user_id: null,
      display_name: displayName,
      message: messageToSend,
      attachments: [],
      created_at: timestamp
    };
    
    if (setMessages) setMessages(prev => [...prev, localMsg]);

    const encoder = new TextEncoder();
    try {
      await localParticipant.publishData(encoder.encode(JSON.stringify(chatPayload)), { reliable: true });
    } catch (err) {}

    if (isConfigured) {
      await supabase.from('chat_messages').insert({
        id: msgId,
        meeting_code: roomCode,
        display_name: displayName,
        message: messageToSend,
        attachments: [],
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] italic text-white/90">Signal Exchange</h2>
          <div className="flex items-center gap-1.5 opacity-30 mt-1">
             <Terminal className="w-2.5 h-2.5 text-[var(--accent-primary)]" />
             <span className="text-[7px] font-black uppercase tracking-widest italic">E2EE Data Stream</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={handleExportHistory} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5">
              <Download className="w-3.5 h-3.5 text-slate-500" />
           </button>
           {onClose && (
             <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-500/20 group transition-all border border-white/5">
                <X className="w-4 h-4 text-slate-500 group-hover:text-red-500" />
             </button>
           )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((msg, i) => {
            const isMe = msg.display_name === displayName;
            return (
              <div key={msg.id} className={cn("flex flex-col gap-1.5", isMe ? "items-end" : "items-start")}>
                <div className={cn("flex items-center gap-2 px-1", isMe && "flex-row-reverse")}>
                   <span className={cn("text-[8px] font-black uppercase tracking-widest", isMe ? "text-[var(--accent-primary)]" : "text-emerald-500")}>
                      {msg.display_name}
                   </span>
                   <span className="text-[7px] font-mono text-slate-700">[{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                </div>
                
                <div className={cn(
                  "p-3 rounded-2xl border text-[10px] leading-relaxed max-w-[85%] break-words shadow-sm",
                  isMe 
                    ? "bg-white border-white text-black rounded-tr-none font-bold" 
                    : "bg-white/[0.02] border-white/5 text-white/90 rounded-tl-none italic"
                )}>
                   {msg.message}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-black/40">
         <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="flex items-center gap-1.5 px-2">
               <button type="button" onClick={() => insertFormat('**')} className="p-2 hover:bg-white/5 rounded-lg transition-all"><Bold className="w-3.5 h-3.5 text-slate-600" /></button>
               <button type="button" onClick={() => insertFormat('*')} className="p-2 hover:bg-white/5 rounded-lg transition-all"><Italic className="w-3.5 h-3.5 text-slate-600" /></button>
               <button type="button" onClick={() => insertFormat('`')} className="p-2 hover:bg-white/5 rounded-lg transition-all"><Code className="w-3.5 h-3.5 text-slate-600" /></button>
               <div className="flex-1" />
               <button type="button" className="p-2 hover:bg-white/5 rounded-lg transition-all opacity-40"><PaperclipIcon className="w-3.5 h-3.5 text-slate-600" /></button>
            </div>
            
            <div className="flex items-center gap-2">
               <Input 
                 placeholder="Enter data sequence..." 
                 value={newMessage}
                 onChange={(e) => setNewMessage(e.target.value)}
                 className="flex-1 bg-white/[0.02] border-white/5 rounded-xl h-11 text-[11px] font-black uppercase tracking-tight placeholder:text-slate-800 focus-visible:ring-[var(--accent-primary)]"
               />
               <Button 
                 type="submit" 
                 disabled={!newMessage.trim()}
                 className="w-11 h-11 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white shadow-lg active:scale-95 transition-all"
               >
                 <Send className="w-4 h-4" />
               </Button>
            </div>
         </form>
         
         <div className="flex items-center justify-between mt-4 px-1">
            <div className="flex items-center gap-2">
               <CheckCircle2 className="w-3 h-3 text-emerald-500/40" />
               <span className="text-[7px] font-black text-slate-700 uppercase tracking-widest">Handshake Verified</span>
            </div>
            <span className="text-[7px] font-mono text-slate-800">{roomCode}</span>
         </div>
      </div>
    </div>
  );
}
