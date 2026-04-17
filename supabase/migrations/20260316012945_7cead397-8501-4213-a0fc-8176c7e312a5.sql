
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Websites table
CREATE TABLE public.websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT NOT NULL,
  widget_color TEXT DEFAULT '#f97316',
  widget_greeting TEXT DEFAULT 'Hi! How can we help you?',
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view their websites" ON public.websites FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can insert websites" ON public.websites FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their websites" ON public.websites FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their websites" ON public.websites FOR DELETE USING (auth.uid() = owner_id);

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON public.websites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chats table
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_ip TEXT,
  visitor_location TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view chats for their websites" ON public.chats FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.websites WHERE websites.id = chats.website_id AND websites.owner_id = auth.uid()));
CREATE POLICY "Anyone can insert chats (visitors)" ON public.chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update chats" ON public.chats FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.websites WHERE websites.id = chats.website_id AND websites.owner_id = auth.uid()));

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON public.chats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chats_website_id ON public.chats(website_id);
CREATE INDEX idx_chats_status ON public.chats(status);

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('visitor', 'agent')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can view messages for their chats" ON public.messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chats
    JOIN public.websites ON websites.id = chats.website_id
    WHERE chats.id = messages.chat_id AND websites.owner_id = auth.uid()
  ));
CREATE POLICY "Anyone can insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update messages" ON public.messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.chats
    JOIN public.websites ON websites.id = chats.website_id
    WHERE chats.id = messages.chat_id AND websites.owner_id = auth.uid()
  ));

CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Enable realtime for chats and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
