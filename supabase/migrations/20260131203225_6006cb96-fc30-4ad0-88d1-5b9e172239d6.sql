-- Create avatar_sections table
CREATE TABLE public.avatar_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create avatars table
CREATE TABLE public.avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.avatar_sections(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  name TEXT NOT NULL,
  bg_class TEXT NOT NULL DEFAULT 'bg-muted',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avatar_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- RLS policies for avatar_sections
CREATE POLICY "Avatar sections are publicly viewable"
ON public.avatar_sections FOR SELECT
USING (true);

CREATE POLICY "Admins can insert avatar sections"
ON public.avatar_sections FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update avatar sections"
ON public.avatar_sections FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete avatar sections"
ON public.avatar_sections FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for avatars
CREATE POLICY "Avatars are publicly viewable"
ON public.avatars FOR SELECT
USING (true);

CREATE POLICY "Admins can insert avatars"
ON public.avatars FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update avatars"
ON public.avatars FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete avatars"
ON public.avatars FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_avatar_sections_updated_at
BEFORE UPDATE ON public.avatar_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default sections and avatars
INSERT INTO public.avatar_sections (name, slug, display_order) VALUES
  ('Hello Kitty', 'hello-kitty', 1),
  ('Homem Aranha', 'spider-man', 2),
  ('Coraline', 'coraline', 3);

-- Insert default avatars for Hello Kitty
INSERT INTO public.avatars (section_id, emoji, name, bg_class, display_order)
SELECT id, '🎀', 'Laço Rosa', 'bg-pink-100 dark:bg-pink-900', 1 FROM public.avatar_sections WHERE slug = 'hello-kitty'
UNION ALL
SELECT id, '🌸', 'Flor de Cerejeira', 'bg-pink-50 dark:bg-pink-950', 2 FROM public.avatar_sections WHERE slug = 'hello-kitty'
UNION ALL
SELECT id, '💖', 'Coração Brilhante', 'bg-rose-100 dark:bg-rose-900', 3 FROM public.avatar_sections WHERE slug = 'hello-kitty'
UNION ALL
SELECT id, '🐱', 'Gatinha', 'bg-amber-50 dark:bg-amber-950', 4 FROM public.avatar_sections WHERE slug = 'hello-kitty'
UNION ALL
SELECT id, '✨', 'Brilho', 'bg-yellow-50 dark:bg-yellow-950', 5 FROM public.avatar_sections WHERE slug = 'hello-kitty'
UNION ALL
SELECT id, '🩷', 'Coração Rosa', 'bg-pink-200 dark:bg-pink-800', 6 FROM public.avatar_sections WHERE slug = 'hello-kitty';

-- Insert default avatars for Spider-Man
INSERT INTO public.avatars (section_id, emoji, name, bg_class, display_order)
SELECT id, '🕷️', 'Aranha', 'bg-red-100 dark:bg-red-900', 1 FROM public.avatar_sections WHERE slug = 'spider-man'
UNION ALL
SELECT id, '🕸️', 'Teia', 'bg-slate-100 dark:bg-slate-900', 2 FROM public.avatar_sections WHERE slug = 'spider-man'
UNION ALL
SELECT id, '🦸', 'Super-herói', 'bg-blue-100 dark:bg-blue-900', 3 FROM public.avatar_sections WHERE slug = 'spider-man'
UNION ALL
SELECT id, '🔴', 'Vermelho', 'bg-red-200 dark:bg-red-800', 4 FROM public.avatar_sections WHERE slug = 'spider-man'
UNION ALL
SELECT id, '🔵', 'Azul', 'bg-blue-200 dark:bg-blue-800', 5 FROM public.avatar_sections WHERE slug = 'spider-man'
UNION ALL
SELECT id, '⚡', 'Poder', 'bg-yellow-100 dark:bg-yellow-900', 6 FROM public.avatar_sections WHERE slug = 'spider-man';

-- Insert default avatars for Coraline
INSERT INTO public.avatars (section_id, emoji, name, bg_class, display_order)
SELECT id, '🪡', 'Agulha', 'bg-indigo-100 dark:bg-indigo-900', 1 FROM public.avatar_sections WHERE slug = 'coraline'
UNION ALL
SELECT id, '🐈‍⬛', 'Gato Preto', 'bg-slate-200 dark:bg-slate-800', 2 FROM public.avatar_sections WHERE slug = 'coraline'
UNION ALL
SELECT id, '🚪', 'Porta Mágica', 'bg-purple-100 dark:bg-purple-900', 3 FROM public.avatar_sections WHERE slug = 'coraline'
UNION ALL
SELECT id, '👁️', 'Botão', 'bg-gray-100 dark:bg-gray-900', 4 FROM public.avatar_sections WHERE slug = 'coraline'
UNION ALL
SELECT id, '🌙', 'Lua', 'bg-blue-950 dark:bg-blue-100', 5 FROM public.avatar_sections WHERE slug = 'coraline'
UNION ALL
SELECT id, '🦋', 'Borboleta', 'bg-cyan-100 dark:bg-cyan-900', 6 FROM public.avatar_sections WHERE slug = 'coraline';