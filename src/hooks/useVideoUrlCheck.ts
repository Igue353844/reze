import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UrlCheckResult {
  accessible: boolean;
  status?: number;
  contentType?: string;
  isVideo?: boolean;
  error?: string;
}

export function useVideoUrlCheck(url: string | null | undefined) {
  const normalizedUrl = typeof url === 'string' ? url.trim() : '';

  return useQuery({
    queryKey: ['video-url-check', normalizedUrl],
    queryFn: async (): Promise<UrlCheckResult> => {
      const { data, error } = await supabase.functions.invoke('check-video-url', {
        body: { url: normalizedUrl },
      });

      if (error) {
        return { accessible: false, error: error.message };
      }

      return data as UrlCheckResult;
    },
    enabled: !!normalizedUrl && !shouldSkipCheck(normalizedUrl),
    staleTime: 5 * 60 * 1000, // cache 5 min
    retry: 1,
  });
}

function shouldSkipCheck(url: string): boolean {
  // Skip URL check for embed URLs and internal storage references
  const normalized = url.trim().toLowerCase();
  if (normalized.startsWith('b2://')) return true;

  const embedPatterns = [
    /youtube\.com/i,
    /youtu\.be/i,
    /vimeo\.com/i,
    /dailymotion\.com/i,
    /drive\.google\.com/i,
    /seekee\.ai/i,
  ];

  return embedPatterns.some((p) => p.test(normalized));
}
