
-- Allow widget (unauthenticated) to read website config by ID
CREATE POLICY "Public can view website config" ON public.websites
FOR SELECT TO anon
USING (true);

-- Allow widget to read its own chat by ID (visitor knows chat_id)
CREATE POLICY "Public can view chats by id" ON public.chats
FOR SELECT TO anon
USING (true);

-- Allow widget to read messages for a chat (visitor knows chat_id)
CREATE POLICY "Public can view messages by chat" ON public.messages
FOR SELECT TO anon
USING (true);
