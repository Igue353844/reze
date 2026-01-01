export type ContentType = 'movie' | 'series' | 'trailer';

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: ContentType;
  year: number | null;
  duration_minutes: number | null;
  poster_url: string | null;
  banner_url: string | null;
  video_url: string | null;
  is_featured: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category | null;
}

export interface VideoWithCategory extends Video {
  categories: Category | null;
}
