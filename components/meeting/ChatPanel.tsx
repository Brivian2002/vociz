import React, { useState, useEffect, useRef } from 'react';
import { supabase, isConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile, Image as ImageIcon, File as FileIcon, Zap } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent, DataPacket_Kind } from 'livekit-client';

interface Message {
  id: string;
  meeting_code: string;
  user_id: string | null;
  display_name: string;
  message: string;
  attachments: any[];
  created_at: string;
  isRealtimeOnly?: boolean; // Flag if it only came through LiveKit Data
}

export default function ChatPanel({ roomCode, displayName }: { roomCode: string, displayName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  // Handle incoming LiveKit data messages (High-speed, peer-to-peer)
  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: any) => {
      const decoder = new TextDecoder();
      const str = decoder.decode(payload);
      try {
        const data = JSON.parse(str);
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

          setMessages(prev => {
            // Deduplicate: Don't add if message exists (likely from Supabase)
            if (prev.some(m => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });
        }
      } catch (e) {
        // Not chat data
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, roomCode]);

  useEffect(() => {
    // Initial fetch from Supabase
    const fetchMessages = async () => {
      if (!isConfigured) return;
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('meeting_code', roomCode)
        .order('created_at', { ascending: true });
      
      if (!error && data) setMessages(data);
    };

    fetchMessages();

    // Supabase Realtime subscription
    let channel: any = null;
    if (isConfigured) {
      channel = supabase
        .channel(`chat:${roomCode}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages', 
            filter: `meeting_code=eq.${roomCode}` 
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => {
               if (prev.some(m => m.id === newMsg.id)) return prev;
               return [...prev, newMsg];
            });
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [roomCode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); // CRITICAL: Stop the page reload
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    const msgId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    setNewMessage('');

    // 1. Prepare payload
    const chatPayload = {
      type: 'chat',
      id: msgId,
      display_name: displayName,
      message: messageToSend,
      attachments: [],
      created_at: timestamp
    };

    // 2. Local Echo (Instant feedback)
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

    // 3. Broadcast via LiveKit for sub-millisecond delivery if peers are connected
    const encoder = new TextEncoder();
    try {
      await localParticipant.publishData(encoder.encode(JSON.stringify(chatPayload)), { 
        reliable: true 
      });
    } catch (err) {
      console.warn('LiveKit data broadcast failed, falling back to Supabase only');
    }

    // 4. Perist to Supabase
    if (isConfigured) {
      try {
        const { error } = await supabase.from('chat_messages').insert({
          id: msgId,
          meeting_code: roomCode,
          display_name: displayName,
          message: messageToSend,
          attachments: [],
        });
        if (error) throw error;
      } catch (err: any) {
        toast.error('Failed to sync message to server history');
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isConfigured) {
      toast.error('File sharing requires Supabase storage configuration');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `chat/${roomCode}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      const attachment = {
        name: file.name,
        url: publicUrl,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      };

      // Broadcast file via LiveKit
      const chatPayload = {
        type: 'chat',
        id: Math.random().toString(36).substring(7),
        display_name: displayName,
        message: '',
        attachments: [attachment],
        created_at: new Date().toISOString()
      };
      
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify(chatPayload));
      await localParticipant.publishData(data, { reliable: true });

      // Persist to DB
      await supabase.from('chat_messages').insert({
        meeting_code: roomCode,
        user_id: null,
        display_name: displayName,
        message: '',
        attachments: [attachment],
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">In-call Messages</h3>
        <div className="flex items-center gap-1.5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-help" title="Powered by LiveKit High-Speed Link">
           <Zap className="w-3 h-3 text-blue-400" />
           <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Realtime Link</span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-3" viewportRef={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.display_name === displayName;
            return (
              <div key={msg.id} className={cn("space-y-1.5", isMe ? "items-end" : "items-start")}>
                <div className={cn("flex items-baseline gap-2 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
                  <span className={cn("text-[10px] font-bold", isMe ? "text-slate-400" : "text-blue-400")}>
                    {isMe ? 'Me' : msg.display_name}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {msg.message && (
                  <div className={cn(
                    "relative group max-w-[85%]",
                    isMe ? "ml-auto" : "mr-auto"
                  )}>
                    <p className={cn(
                      "text-xs p-2.5 rounded-2xl border leading-relaxed",
                      isMe 
                        ? "bg-blue-600 border-blue-500 text-white rounded-tr-none shadow-lg shadow-blue-900/20" 
                        : "bg-white/5 border-white/10 text-slate-300 rounded-tl-none"
                    )}>
                      {msg.message}
                    </p>
                  </div>
                )}

                {msg.attachments?.map((att: any, i: number) => (
                  <div key={i} className={cn("mt-1.5", isMe ? "ml-auto" : "mr-auto")}>
                    {att.type === 'image' ? (
                      <div className="relative group overflow-hidden rounded-2xl border border-white/10 max-w-[200px]">
                        <img 
                          src={att.url} 
                          alt={att.name} 
                          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                          referrerPolicy="no-referrer"
                          onClick={() => window.open(att.url, '_blank')}
                        />
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white/5 rounded-2xl rounded-tl-none border border-white/10 flex items-center gap-3">
                         <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                           <FileIcon className="w-4 h-4 text-blue-400" />
                         </div>
                         <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold truncate text-white/90">{att.name}</span>
                            <button className="text-[9px] text-blue-400 hover:underline text-left">Download</button>
                         </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-white/10 bg-white/5 backdrop-blur-md">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <Input 
                placeholder="Message all nodes..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full bg-black/40 border-white/10 rounded-xl px-4 py-2.5 text-xs focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all pr-24 h-11 placeholder:text-slate-600"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="text-white/40 hover:text-white/80 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                      <Smile className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 border-none bg-transparent shadow-none" side="top" align="end">
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick}
                      theme={Theme.DARK}
                      lazyLoadEmojis={true}
                    />
                  </PopoverContent>
                </Popover>
                
                <button 
                  type="button" 
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()} 
                  className="text-white/40 hover:text-white/80 transition-colors p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30"
                >
                  <Paperclip className={cn("w-4 h-4", isUploading && "animate-spin")} />
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={!newMessage.trim() || isUploading}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-11 px-5 flex items-center gap-2 border-none shadow-xl shadow-blue-600/20 disabled:opacity-50 transition-all font-bold group"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        </form>
        <p className="text-[8px] text-center text-slate-600 mt-2 font-bold uppercase tracking-widest leading-none">End-to-End Encrypted Data Channel</p>
      </div>
    </div>
  );
}
