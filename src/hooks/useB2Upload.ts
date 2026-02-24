import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UploadProgress } from '@/hooks/useUpload';

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function useB2Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const corsConfiguredRef = useRef(false);

  const cancelUpload = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsUploading(false);
    setProgress(null);
  }, []);

  const ensureCorsConfigured = useCallback(async () => {
    if (corsConfiguredRef.current) return;
    try {
      await supabase.functions.invoke('b2-storage', {
        body: { action: 'configure-cors' },
      });
      corsConfiguredRef.current = true;
    } catch (e) {
      console.warn('CORS config attempt:', e);
    }
  }, []);

  const getPresignedUploadUrl = useCallback(async (fileName: string, contentType: string, folder?: string) => {
    const filePath = folder 
      ? `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`
      : `${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;

    const { data, error } = await supabase.functions.invoke('b2-storage', {
      body: {
        action: 'get-upload-url',
        fileName,
        contentType,
        filePath,
      },
    });

    if (error) throw new Error('Erro ao obter URL de upload: ' + error.message);
    return { url: data.url as string, key: data.key as string };
  }, []);

  const getPresignedDownloadUrl = useCallback(async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('b2-storage', {
      body: {
        action: 'get-download-url',
        filePath,
      },
    });

    if (error) throw new Error('Erro ao obter URL de download: ' + error.message);
    return data.url as string;
  }, []);

  const uploadToB2 = useCallback(async (
    file: File,
    folder?: string
  ): Promise<{ key: string } | null> => {
    setIsUploading(true);
    setError(null);
    setProgress({
      loaded: 0,
      total: file.size,
      percentage: 0,
      speed: 0,
      speedFormatted: '0 B/s',
      remainingTime: 0,
      remainingTimeFormatted: 'Calculando...',
    });

    try {
      // 0. Ensure CORS is configured on B2 bucket
      await ensureCorsConfigured();

      // 1. Get presigned URL
      const { url, key } = await getPresignedUploadUrl(file.name, file.type, folder);

      // 2. Upload directly to B2 via presigned URL with XHR for progress
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const startTime = Date.now();
        let lastLoaded = 0;
        let lastTime = startTime;
        const speedHistory: number[] = [];

        xhr.upload.addEventListener('progress', (e) => {
          if (!e.lengthComputable) return;
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          const bytesDiff = e.loaded - lastLoaded;

          if (timeDiff > 0.5) {
            const currentSpeed = bytesDiff / timeDiff;
            speedHistory.push(currentSpeed);
            if (speedHistory.length > 10) speedHistory.shift();
            lastLoaded = e.loaded;
            lastTime = now;
          }

          const avgSpeed = speedHistory.length > 0
            ? speedHistory.reduce((a, b) => a + b, 0) / speedHistory.length
            : 0;
          const remaining = e.total - e.loaded;
          const remainingTime = avgSpeed > 0 ? remaining / avgSpeed : 0;

          setProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
            speed: avgSpeed,
            speedFormatted: formatSpeed(avgSpeed),
            remainingTime,
            remainingTimeFormatted: formatTime(remainingTime),
          });
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress({
              loaded: file.size,
              total: file.size,
              percentage: 100,
              speed: 0,
              speedFormatted: '0 B/s',
              remainingTime: 0,
              remainingTimeFormatted: '0s',
            });
            resolve();
          } else {
            reject(new Error(`Upload falhou (status ${xhr.status})`));
          }
        });

        xhr.addEventListener('error', () => reject(new Error('Erro de conexão durante upload')));
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelado')));

        // Listen for abort
        abortController.signal.addEventListener('abort', () => xhr.abort());

        xhr.open('PUT', url);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });

      return { key };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload falhou';
      if (message !== 'Upload cancelado') {
        setError(message);
      }
      return null;
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [getPresignedUploadUrl]);

  return {
    uploadToB2,
    getPresignedDownloadUrl,
    isUploading,
    progress,
    error,
    cancelUpload,
    resetProgress: () => setProgress(null),
    resetError: () => setError(null),
  };
}
