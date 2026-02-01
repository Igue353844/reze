-- Add custom URL and title columns to watch_parties table for M3U8 support
ALTER TABLE public.watch_parties 
ADD COLUMN custom_url TEXT,
ADD COLUMN custom_title TEXT;