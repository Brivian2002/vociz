-- SQL Setup for VoiceMeet Chat
-- Run this in your Supabase SQL Editor

-- 1. Create the chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_code TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    message TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Realtime for this table
-- Note: You may need to enable the extension if not active
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_chat_meeting_code ON public.chat_messages(meeting_code);

-- 4. Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
-- Policy: Enable read access for all users (based on meeting code)
CREATE POLICY "Enable global read for chat messages"
ON public.chat_messages FOR SELECT
USING (true);

-- Policy: Enable insert access for all participants
CREATE POLICY "Enable insert for all participants"
ON public.chat_messages FOR INSERT
WITH CHECK (true);

-- Policy: Optional - Restrict updates/deletes to owners
CREATE POLICY "Enable update for message owners"
ON public.chat_messages FOR UPDATE
USING (auth.uid() = user_id);
