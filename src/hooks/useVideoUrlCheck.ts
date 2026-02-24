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
  return useQuery({
    queryKey: ['video-url-check', url],
    queryFn: async (): Promise<UrlCheckResult> => {
      const { data, error } = await supabase.functions.invoke('check-video-url', {
        body: { url },
      });

      if (error) {
        return { accessible: false, error: error.message };
      }

      return data as UrlCheckResult;
    },
    enabled: !!url && !isEmbedUrl(url),
    staleTime: 5 * 60 * 1000, // cache 5 min
    retry: 1,
  });
}

function isEmbedUrl(url: string): boolean {
  const embedPatterns = [
    /youtube\.com/i,
    /youtu\.be/i,
    /vimeo\.com/i,
    /dailymotion\.com/i,
    /drive\.google\.com/i,
    /seekee\.ai/i,
  ];
  return embedPatterns.some(p => p.test(url));
}
