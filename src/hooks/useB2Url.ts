import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Resolves b2:// internal URLs to real presigned download URLs.
 * Passes through any other URL unchanged.
 */
export function useB2Url(url: string | null | undefined) {
  const isB2 = url?.startsWith('b2://') ?? false;
  const filePath = isB2 ? url!.replace('b2://', '') : null;

  const { data: resolvedUrl, isLoading } = useQuery({
    queryKey: ['b2-url', filePath],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('b2-storage', {
        body: { action: 'get-download-url', filePath },
      });
      if (error) throw error;
      return data.url as string;
    },
    enabled: !!filePath,
    staleTime: 30 * 60 * 1000, // 30 min cache (presigned URLs last 1h typically)
    retry: 2,
  });

  if (!url) return { url: null, isLoading: false };
  if (!isB2) return { url, isLoading: false };
  return { url: resolvedUrl ?? null, isLoading };
}
