import React, { useState, useEffect, useRef } from 'react';
import { supabase, isConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile, Image as ImageIcon, File as FileIcon, Zap, X, Bold, Italic, Code, Video as VideoIcon, Download } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import ReactMarkdown from 'react-markdown';

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
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large (max 20MB)');
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
      else if (file.type.startsWith('video/')) type = 'video';

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
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden border-white/20">
      <div className="p-3 border-b border-black flex items-center justify-between bg-white">
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Node Comms</h3>
          <div className="flex items-center gap-1.5 opacity-50" title="Encrypted Peer Proxy">
             <Zap className="w-2.5 h-2.5 text-black" />
             <span className="text-[7px] font-black text-black uppercase tracking-tighter">Realtime P2P</span>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-black/10">
            <X className="w-4 h-4 text-black" />
          </Button>
        )}
      </div>

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
                    ) : att.type === 'video' ? (
                      <div className="rounded-2xl border border-white/10 overflow-hidden bg-black shadow-2xl">
                        <video src={att.url} controls className="w-full max-h-48" />
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
            <VideoIcon className="w-3 h-3 text-slate-500" />
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
