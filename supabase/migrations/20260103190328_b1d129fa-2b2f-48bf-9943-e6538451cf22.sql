-- Create watch_progress table to track user's video progress
CREATE TABLE public.watch_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  progress_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate entries per user/video/episode
  UNIQUE(user_id, video_id, episode_id)
);

-- Create index for faster queries
CREATE INDEX idx_watch_progress_user_id ON public.watch_progress(user_id);
CREATE INDEX idx_watch_progress_last_watched ON public.watch_progress(last_watched_at DESC);

-- Enable Row Level Security
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own watch progress
CREATE POLICY "Users can view their own watch progress"
ON public.watch_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch progress"
ON public.watch_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch progress"
ON public.watch_progress
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch progress"
ON public.watch_progress
FOR DELETE
USING (auth.uid() = user_id);