-- Add banner_url column to episodes table
ALTER TABLE public.episodes ADD COLUMN IF NOT EXISTS banner_url text;