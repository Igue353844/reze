
-- Create watch_parties table for hosting watch sessions
CREATE TABLE public.watch_parties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  current_time_seconds INTEGER NOT NULL DEFAULT 0,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create watch_party_participants table
CREATE TABLE public.watch_party_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create watch_party_messages table for chat
CREATE TABLE public.watch_party_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  party_id UUID NOT NULL REFERENCES public.watch_parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_party_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for watch_parties
CREATE POLICY "Anyone can view active parties" ON public.watch_parties
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create parties" ON public.watch_parties
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their parties" ON public.watch_parties
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their parties" ON public.watch_parties
  FOR DELETE USING (auth.uid() = host_id);

-- RLS Policies for watch_party_participants
CREATE POLICY "Anyone can view party participants" ON public.watch_party_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join parties" ON public.watch_party_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave parties" ON public.watch_party_participants
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for watch_party_messages
CREATE POLICY "Party participants can view messages" ON public.watch_party_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.watch_party_participants
      WHERE party_id = watch_party_messages.party_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Party participants can send messages" ON public.watch_party_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.watch_party_participants
      WHERE party_id = watch_party_messages.party_id
      AND user_id = auth.uid()
    )
  );

-- Enable realtime for sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_parties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_party_messages;

-- Create function to generate unique party code
CREATE OR REPLACE FUNCTION public.generate_party_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_watch_parties_updated_at
  BEFORE UPDATE ON public.watch_parties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
