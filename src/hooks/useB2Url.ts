import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const B2_PROTOCOL_REGEX = /^b2:\/\//i;

function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Parse b2:// URLs.
 * Formats supported:
 *   b2://label/path/to/file.mp4   → accountLabel="label", filePath="path/to/file.mp4"
 *   b2://path/to/file.mp4         → accountLabel=null (legacy), filePath="path/to/file.mp4"
 * 
 * Heuristic: if the first segment does NOT contain a dot or slash-like chars
 * and the rest looks like a path, treat it as a label.
 */
function parseB2Url(url: string): { accountLabel: string | null; filePath: string } | null {
  if (!B2_PROTOCOL_REGEX.test(url)) return null;
  const raw = url.replace(B2_PROTOCOL_REGEX, '');
  if (!raw) return null;

  const slashIndex = raw.indexOf('/');
  if (slashIndex === -1) {
    // No slash at all – treat whole thing as filePath (legacy)
    return { accountLabel: null, filePath: raw };
  }

  const firstSegment = raw.substring(0, slashIndex);
  const rest = raw.substring(slashIndex + 1);

  // If the first segment looks like a label (no dots, no extensions)
  // and the rest is a real path, use it as label
  if (!/\./.test(firstSegment) && rest.length > 0 && !firstSegment.startsWith('uploads') && !firstSegment.startsWith('videos')) {
    return { accountLabel: firstSegment, filePath: rest };
  }

  // Otherwise it's a legacy path
  return { accountLabel: null, filePath: raw };
}

/**
 * Resolves b2:// internal URLs to real presigned download URLs.
 * Supports both b2://label/path and b2://path (legacy) formats.
 * Passes through any other URL unchanged.
 */
export function useB2Url(url: string | null | undefined) {
  const normalizedUrl = normalizeUrl(url);
  const parsed = normalizedUrl ? parseB2Url(normalizedUrl) : null;
  const isB2 = !!parsed;

  const { data: resolvedUrl, isLoading, error } = useQuery({
    queryKey: ['b2-url', parsed?.accountLabel, parsed?.filePath],
    queryFn: async () => {
      if (!parsed) return null;

      const { data, error } = await supabase.functions.invoke('b2-storage', {
        body: {
          action: 'get-download-url',
          filePath: parsed.filePath,
          accountLabel: parsed.accountLabel,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Falha ao gerar URL temporária do vídeo.');

      return data.url as string;
    },
    enabled: !!parsed,
    staleTime: 30 * 60 * 1000,
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
