import React, { useState, useEffect, useRef } from 'react';
import { supabase, isConfigured } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Message {
  id: string;
  meeting_code: string;
  user_id: string | null;
  display_name: string;
  message: string;
  attachments: any[];
  created_at: string;
}

export default function ChatPanel({ roomCode, displayName }: { roomCode: string, displayName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial fetch
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

    // Realtime subscription
    let channel: any = null;
    if (isConfigured) {
      channel = supabase
        .channel(`chat:${roomCode}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `meeting_code=eq.${roomCode}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage('');

    if (isConfigured) {
      const { error } = await supabase.from('chat_messages').insert({
        meeting_code: roomCode,
        user_id: null,
        display_name: displayName,
        message: messageToSend,
        attachments: [],
      });

      if (error) {
        console.error('Error sending message:', error);
        toast.error('Failed to send message');
      }
    } else {
      // Local echo if no DB
      const tempMsg: Message = {
        id: Math.random().toString(),
        meeting_code: roomCode,
        user_id: null,
        display_name: displayName,
        message: messageToSend,
        attachments: [],
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempMsg]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isConfigured) {
      toast.error('Storage unavailable without configuration');
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

      await supabase.from('chat_messages').insert({
        meeting_code: roomCode,
        user_id: null,
        display_name: displayName,
        message: '',
        attachments: [{
          name: file.name,
          url: publicUrl,
          type: file.type.startsWith('image/') ? 'image' : 'file'
        }],
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
      <div className="p-3 border-b border-white/10">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">In-call Messages</h3>
      </div>

      <ScrollArea className="flex-1 p-3" viewportRef={scrollRef}>
        <div className="space-y-3">
          {messages.map((msg) => {
            const isMe = msg.display_name === displayName;
            return (
              <div key={msg.id} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className={cn("text-[10px] font-bold", isMe ? "text-slate-400" : "text-blue-400")}>
                    {isMe ? 'Me' : msg.display_name}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {msg.message && (
                  <p className={cn(
                    "text-xs p-2 rounded-lg rounded-tl-none border",
                    isMe ? "bg-blue-500/10 border-blue-500/20 text-white/90" : "bg-white/5 border-white/5 text-slate-300"
                  )}>
                    {msg.message}
                  </p>
                )}

                {msg.attachments?.map((att: any, i: number) => (
                  <div key={i} className="mt-2">
                    {att.type === 'image' ? (
                      <img 
                        src={att.url} 
                        alt={att.name} 
                        className="max-w-full rounded-lg border border-white/10 hover:border-primary/50 transition-colors cursor-pointer"
                        referrerPolicy="no-referrer"
                        onClick={() => window.open(att.url, '_blank')}
                      />
                    ) : (
                      <div className="p-2 bg-blue-500/10 rounded-lg rounded-tl-none border border-blue-500/20">
                         <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-blue-500/30 rounded flex items-center justify-center">
                             <FileIcon className="w-3 h-3 text-white" />
                           </div>
                           <span className="text-[10px] truncate text-white/70">{att.name}</span>
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

      <div className="p-3 border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 group">
              <Input 
                placeholder="Send a message..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full bg-black/40 border-white/10 rounded-xl px-3 py-2 text-xs focus-visible:ring-1 focus-visible:ring-blue-500/50 transition-all pr-20 h-10"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="text-white/40 hover:text-white/70 transition-colors p-1">
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
                  onClick={() => fileInputRef.current?.click()} 
                  className="text-white/40 hover:text-white/70 transition-colors p-1"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-10 px-4 flex items-center gap-2 border-none shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all font-bold group"
            >
              <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        </form>
      </div>
    </div>
  );
}
