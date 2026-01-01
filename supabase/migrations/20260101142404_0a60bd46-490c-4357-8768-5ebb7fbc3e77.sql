-- Create enum for content types
CREATE TYPE public.content_type AS ENUM ('movie', 'series', 'trailer');

-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create videos table
CREATE TABLE public.videos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    type public.content_type NOT NULL DEFAULT 'movie',
    year INTEGER,
    duration_minutes INTEGER,
    poster_url TEXT,
    banner_url TEXT,
    video_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Public read access for categories (everyone can see categories)
CREATE POLICY "Categories are publicly viewable" 
ON public.categories 
FOR SELECT 
USING (true);

-- Public read access for videos (everyone can watch)
CREATE POLICY "Videos are publicly viewable" 
ON public.videos 
FOR SELECT 
USING (true);

-- Insert default categories
INSERT INTO public.categories (name, slug) VALUES
    ('Ação', 'acao'),
    ('Comédia', 'comedia'),
    ('Drama', 'drama'),
    ('Terror', 'terror'),
    ('Romance', 'romance'),
    ('Ficção Científica', 'ficcao-cientifica'),
    ('Documentário', 'documentario'),
    ('Animação', 'animacao');

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'videos',
    'videos',
    true,
    524288000,
    ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
);

-- Create storage bucket for posters/images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'posters',
    'posters',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage policies for videos bucket (public read, authenticated write)
CREATE POLICY "Public video access"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Anyone can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Anyone can update videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos');

CREATE POLICY "Anyone can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos');

-- Storage policies for posters bucket (public read, anyone can write for now)
CREATE POLICY "Public poster access"
ON storage.objects FOR SELECT
USING (bucket_id = 'posters');

CREATE POLICY "Anyone can upload posters"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'posters');

CREATE POLICY "Anyone can update posters"
ON storage.objects FOR UPDATE
USING (bucket_id = 'posters');

CREATE POLICY "Anyone can delete posters"
ON storage.objects FOR DELETE
USING (bucket_id = 'posters');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Anyone can insert videos (for admin panel - will add auth later if needed)
CREATE POLICY "Anyone can insert videos"
ON public.videos
FOR INSERT
WITH CHECK (true);

-- Anyone can update videos
CREATE POLICY "Anyone can update videos"
ON public.videos
FOR UPDATE
USING (true);

-- Anyone can delete videos
CREATE POLICY "Anyone can delete videos"
ON public.videos
FOR DELETE
USING (true);

-- Anyone can manage categories
CREATE POLICY "Anyone can insert categories"
ON public.categories
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update categories"
ON public.categories
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete categories"
ON public.categories
FOR DELETE
USING (true);