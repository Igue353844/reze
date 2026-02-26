import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const B2_PROTOCOL_REGEX = /^b2:\/\//i;

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getB2FilePath(url: string): string | null {
  if (!B2_PROTOCOL_REGEX.test(url)) return null;
  return url.replace(B2_PROTOCOL_REGEX, '');
}

/**
 * Resolves b2:// internal URLs to real presigned download URLs.
 * Passes through any other URL unchanged.
 */
export function useB2Url(url: string | null | undefined) {
  const normalizedUrl = normalizeUrl(url);
  const filePath = normalizedUrl ? getB2FilePath(normalizedUrl) : null;
  const isB2 = !!filePath;

  const { data: resolvedUrl, isLoading, error } = useQuery({
    queryKey: ['b2-url', filePath],
    queryFn: async () => {
      if (!filePath) return null;

      const { data, error } = await supabase.functions.invoke('b2-storage', {
        body: { action: 'get-download-url', filePath },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Falha ao gerar URL temporária do vídeo.');

      return data.url as string;
    },
    enabled: !!filePath,
    staleTime: 30 * 60 * 1000, // 30 min cache (presigned URLs last 1h typically)
    retry: 2,
  });

  if (!normalizedUrl) return { url: null, isLoading: false, error: null as Error | null };
  if (!isB2) return { url: normalizedUrl, isLoading: false, error: null as Error | null };

  return {
    url: resolvedUrl ?? null,
    isLoading,
    error: (error as Error | null) ?? null,
  };
}

