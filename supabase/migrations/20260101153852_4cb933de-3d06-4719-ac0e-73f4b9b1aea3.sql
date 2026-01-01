-- Create table for live TV channels
CREATE TABLE public.live_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  stream_url TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_channels ENABLE ROW LEVEL SECURITY;

-- Public can view active channels
CREATE POLICY "Anyone can view active channels" 
ON public.live_channels 
FOR SELECT 
USING (is_active = true);

-- Only admins can manage channels
CREATE POLICY "Admins can insert channels" 
ON public.live_channels 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update channels" 
ON public.live_channels 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete channels" 
ON public.live_channels 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_live_channels_updated_at
BEFORE UPDATE ON public.live_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();