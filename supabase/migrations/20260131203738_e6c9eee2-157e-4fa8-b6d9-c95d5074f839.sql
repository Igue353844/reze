-- Add image_url column to avatars table
ALTER TABLE public.avatars 
ADD COLUMN image_url TEXT DEFAULT NULL;

-- Make emoji nullable since we can have image-based avatars
ALTER TABLE public.avatars 
ALTER COLUMN emoji DROP NOT NULL;