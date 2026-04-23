import React, { useState, useEffect, useRef } from 'react';
import { supabase, isConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Image as ImageIcon, 
  File as FileIcon, 
  Zap, 
  X, 
  Bold, 
  Italic, 
  Code, 
  Video as VideoIcon, 
  Download,
  Share,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { GoogleGenAI } from "@google/genai";

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
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
}) {
  if (!roomCode) {
    return (
       <div className="flex-1 flex items-center justify-center p-8 text-center bg-[#050508]">
          <div className="space-y-4">
             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                <Zap className="w-6 h-6 text-slate-700 animate-pulse" />
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Waiting for node synchronization...
             </p>
          </div>
       </div>
    );
  }

  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const insertFormat = (tag: string) => {
    setNewMessage(prev => `${prev}${tag}${tag}`);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  const handleSummarize = async () => {
    if (messages.length < 2) {
      toast.info('Insufficient data for intelligence mapping.');
      return;
    }

    setIsSummarizing(true);
    const api_key = process.env.GEMINI_API_KEY;
    if (!api_key) {
      toast.error('AI Mesh Key not found in environment.');
      setIsSummarizing(false);
      return;
    }

    try {
      const gConfig = { apiKey: api_key };
      const ai = new GoogleGenAI(gConfig);
      
      const sessionHistory = messages
        .filter(m => m.message)
        .map(m => `${m.display_name}: ${m.message}`)
        .join('\n');

      const prompt = `You are a professional session analyst for VoiceMeet. 
      Analyze the following chat history from a communication node and provide a concise, high-fidelity narrative summary of the key points discussed. 
      Maintain a professional, authoritative tone. Format as markdown.
      
      HISTORY:
      ${sessionHistory}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const summaryText = response.text;
      
      // Send as an "AI Intelligence" message
      const msgId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const aiMsg: Message = {
        id: msgId,
        meeting_code: roomCode,
        user_id: 'gemini-ai',
        display_name: 'AI SYSTEM',
        message: `### SESSION INTELLIGENCE SUMMARY\n\n${summaryText}`,
        attachments: [],
        created_at: timestamp
      };

      setMessages(prev => [...prev, aiMsg]);
      
      // Broadcast to others
      const encoder = new TextEncoder();
      const payload = {
        type: 'chat',
        id: msgId,
        display_name: 'AI SYSTEM',
        message: aiMsg.message,
        attachments: [],
        created_at: timestamp
      };
      await localParticipant.publishData(encoder.encode(JSON.stringify(payload)), { reliable: true });

      toast.success('Intelligence mapped and broadcast.');
    } catch (err) {
      console.error('AI summary failure:', err);
      toast.error('Failed to engage intelligence mesh.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExportHistory = () => {
    if (messages.length === 0) {
      toast.info('No message data available for transmission export.');
      return;
    }

    try {
      const doc = new jsPDF() as any;
      
      doc.setFontSize(22);
      doc.text('VOICEMEET SESSION LOG', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`NETWORK NODE: ${roomCode}`, 14, 28);
      doc.text(`TIMESTAMP: ${new Date().toLocaleString()}`, 14, 33);
      doc.setDrawColor(230);
      doc.line(14, 38, 196, 38);

      const tableData = messages.map(msg => [
        new Date(msg.created_at).toLocaleTimeString(),
        msg.display_name.toUpperCase(),
        msg.message || (msg.attachments?.length ? `[ATTACHMENT: ${msg.attachments[0].name}]` : '')
      ]);

      doc.autoTable({
        startY: 45,
        head: [['TIMESTAMP', 'NODE IDENTITY', 'COMMUNICATION DATA']],
        body: tableData,
        theme: 'plain',
        headStyles: { 
          fillColor: [0, 0, 0], 
          textColor: [255, 255, 255], 
          fontSize: 8, 
          fontStyle: 'bold',
          cellPadding: 4
        },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 50 },
          2: { cellWidth: 'auto' }
        }
      });

      doc.save(`VOICEMEET_LOG_${roomCode}.pdf`);
      toast.success('Communication History Exported.');
    } catch (err) {
      toast.error('Failed to generate export document.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

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
    setMessages(prev => [...prev, localMsg]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isConfigured) {
      toast.error('File sharing requires Supabase configuration');
      return;
    }

    // Strict Node Validation: Only Images, Documents, and Audio
    const allowedTypes = [
      'image/', 
      'audio/', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
    if (!isAllowed) {
      toast.error('Unauthorized file type. Node only accepts Images, Documents, and Audio.');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Transmission quota exceeded (max 20MB)');
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `chat/${roomCode}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(filePath);

      let type = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const attachment = { name: file.name, url: publicUrl, type };

      const chatPayload = {
        type: 'chat',
        id: crypto.randomUUID(),
        display_name: displayName,
        message: '',
        attachments: [attachment],
        created_at: new Date().toISOString()
      };
      
      const encoder = new TextEncoder();
      await localParticipant.publishData(encoder.encode(JSON.stringify(chatPayload)), { reliable: true });

      await supabase.from('chat_messages').insert({
        meeting_code: roomCode,
        display_name: displayName,
        message: '',
        attachments: [attachment],
      });

    } catch (error: any) {
      toast.error('Transmission failure');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden border-white/20" role="region" aria-label="In-Call Message Hub">
      <div className="p-3 border-b border-black flex items-center justify-between bg-white text-black shadow-sm">
        <div className="flex flex-col">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">IN CALL MESSAGE</h2>
          <div className="flex items-center gap-1.5 opacity-40">
             <Zap className="w-2.5 h-2.5" />
             <span className="text-[7px] font-black uppercase tracking-tighter italic">Secure Node Sync</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSummarize} 
            disabled={isSummarizing}
            className="w-8 h-8 rounded-full hover:bg-black/5 text-blue-600 relative overflow-hidden"
            aria-label="Generate AI intelligence summary of chat history"
          >
            {isSummarizing ? (
               <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
               <Sparkles className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleExportHistory} 
            className="w-8 h-8 rounded-full hover:bg-black/5 text-black"
            aria-label="Export communication log as PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="w-8 h-8 rounded-full hover:bg-black/5 text-black"
              aria-label="Close message hub"
            >
              <X className="w-4 h-4 text-black" />
            </Button>
          )}
        </div>
      </div>

      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileUpload}
        accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
      />

      <div 
        ref={scrollRef}
        className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 transition-all"
      >
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.display_name === displayName;
            return (
              <div key={msg.id} className={cn("flex flex-col gap-0.5", isMe ? "items-end" : "items-start")}>
                <div className={cn("flex items-baseline gap-1.5 px-0.5", isMe ? "flex-row-reverse" : "flex-row")}>
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", isMe ? "text-blue-500" : "text-emerald-500")}>
                    {isMe ? 'Host Node' : msg.display_name}
                  </span>
                  <span className="text-[6px] text-slate-600 font-black">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {msg.message && (
                  <div className={cn("max-w-[100%] message-bubble", isMe ? "ml-auto" : "mr-auto")}>
                    <div className={cn(
                      "text-[10px] p-2 py-1.5 rounded-lg border leading-tight break-words markdown-content",
                      isMe 
                        ? "bg-white border-white text-black rounded-tr-none font-medium" 
                        : "bg-zinc-900 border-white/10 text-white rounded-tl-none"
                    )}>
                      <ReactMarkdown>{msg.message}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {msg.attachments?.map((att: any, i: number) => (
                  <div key={i} className={cn("mt-1.5 max-w-[90%]", isMe ? "ml-auto" : "mr-auto")}>
                    {att.type === 'image' ? (
                      <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                        <img 
                          src={att.url} 
                          alt={att.name} 
                          className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                          referrerPolicy="no-referrer"
                          onClick={() => window.open(att.url, '_blank')}
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                         <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center border border-white/10">
                           <FileIcon className="w-4 h-4 text-white" />
                         </div>
                         <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-[9px] font-black truncate text-white/90">{att.name}</span>
                            <a href={att.url} download={att.name} target="_blank" rel="noopener noreferrer" className="text-[7px] font-black text-white/60 uppercase tracking-widest mt-0.5 hover:text-white flex items-center gap-1 transition-colors">
                               <Download className="w-2.5 h-2.5" /> Handshake Download
                            </a>
                         </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Advanced Formatting Toolbar */}
      <div className="px-3 py-1.5 border-t border-white/5 bg-white/[0.01] flex items-center gap-1">
          <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5" onClick={() => insertFormat('**')}>
            <Bold className="w-3 h-3 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5" onClick={() => insertFormat('*')}>
            <Italic className="w-3 h-3 text-slate-500" />
          </Button>
          <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5" onClick={() => insertFormat('`')}>
            <Code className="w-3 h-3 text-slate-500" />
          </Button>
          <div className="w-px h-3 bg-white/10 mx-1" />
          <Button variant="ghost" size="icon" className="w-7 h-7 hover:bg-white/5" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="w-3 h-3 text-slate-500" />
          </Button>
      </div>

      <div className="p-2 border-t border-white/10 bg-black">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Input 
                placeholder="Message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full bg-zinc-900 border-white/10 rounded-lg px-3 py-1.5 text-[10px] focus-visible:ring-1 focus-visible:ring-white/30 transition-all h-9 placeholder:text-zinc-600 font-medium"
              />
            </div>
            <Button 
              type="submit" 
              disabled={(!newMessage.trim() && !isUploading)}
              className="bg-white hover:bg-zinc-200 text-black rounded-lg h-9 px-3 active:scale-95 transition-all border-none font-black text-[9px] uppercase"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
