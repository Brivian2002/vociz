import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Smile, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Session } from '@supabase/supabase-js';

interface Message {
  id: string;
  meeting_code: string;
  user_id: string | null;
  display_name: string;
  message: string;
  attachments: any[];
  created_at: string;
}

export default function ChatPanel({ roomCode, displayName, session }: { roomCode: string, displayName: string, session: Session | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial fetch
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('meeting_code', roomCode)
        .order('created_at', { ascending: true });
      
      if (!error && data) setMessages(data);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${roomCode}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `meeting_code=eq.${roomCode}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

    const { error } = await supabase.from('chat_messages').insert({
      meeting_code: roomCode,
      user_id: session?.user?.id || null,
      display_name: displayName,
      message: messageToSend,
      attachments: [],
    });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        user_id: session?.user?.id || null,
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
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/5">
      <div className="p-4 border-b border-white/5">
        <h2 className="font-bold text-white/90 tracking-tight">In-Call Messages</h2>
      </div>

      <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
        <div className="space-y-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Security Note</p>
            <p className="text-xs text-blue-200/70 leading-relaxed">
              Messages are visible only to people in the call and are deleted when the call ends.
            </p>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white/80">{msg.display_name}</span>
                <span className="text-[10px] text-white/30 font-mono">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              {msg.message && (
                <p className="text-sm text-white/70 leading-relaxed break-words bg-white/5 p-2 rounded-lg border border-white/5">
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
                    <a 
                      href={att.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-xs text-white/60"
                    >
                      <FileIcon className="w-4 h-4" />
                      {att.name}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 bg-slate-950/50 border-t border-white/5">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative group">
              <Input
                placeholder="Send a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-primary/50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50 group-focus-within:opacity-100 transition-opacity">
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="p-1 hover:text-primary transition-colors text-white/70">
                      <Smile className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="w-full p-0 border-none bg-transparent shadow-none mb-4">
                    <EmojiPicker 
                      theme={Theme.DARK} 
                      onEmojiClick={onEmojiClick}
                      autoFocusSearch={false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
              accept="image/*,video/*,.pdf,.doc,.docx"
            />
            
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              className="bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>

            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim() && !isUploading}
              className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
