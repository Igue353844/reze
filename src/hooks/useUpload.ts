import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as tus from 'tus-js-client';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  speedFormatted: string;
  remainingTime: number; // seconds
  remainingTimeFormatted: string;
}

const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-msvideo',
  'video/mpeg',
  'video/3gpp',
  'video/x-m4v',
  'video/x-matroska', // MKV
  'video/x-flv',
  'video/avi',
];

const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

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

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<tus.Upload | null>(null);
  const speedHistoryRef = useRef<number[]>([]);
  const lastProgressRef = useRef<{ time: number; loaded: number }>({ time: 0, loaded: 0 });

  const cancelUpload = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    setIsUploading(false);
    setProgress(null);
  }, []);

  const uploadWithTus = useCallback(async (
    file: File,
    bucket: 'videos' | 'posters',
    folder?: string
  ): Promise<string | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Não autenticado');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        speedHistoryRef.current = [];
        lastProgressRef.current = { time: Date.now(), loaded: 0 };

        const upload = new tus.Upload(file, {
          endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
          retryDelays: [0, 1000, 3000, 5000, 10000],
          chunkSize: 6 * 1024 * 1024, // 6MB chunks for faster upload
          headers: {
            authorization: `Bearer ${session.access_token}`,
            apikey: supabaseKey,
            'x-upsert': 'false',
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: bucket,
            objectName: filePath,
            contentType: file.type,
            cacheControl: '3600',
          },
          onError: (err) => {
            console.error('TUS upload error:', err);
            setError(err.message);
            setIsUploading(false);
            reject(err);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const now = Date.now();
            const timeDiff = (now - lastProgressRef.current.time) / 1000; // seconds
            const bytesDiff = bytesUploaded - lastProgressRef.current.loaded;
            
            if (timeDiff > 0.5) { // Update speed every 0.5 seconds
              const currentSpeed = bytesDiff / timeDiff;
              speedHistoryRef.current.push(currentSpeed);
              
              // Keep only last 10 speed measurements for average
              if (speedHistoryRef.current.length > 10) {
                speedHistoryRef.current.shift();
              }
              
              lastProgressRef.current = { time: now, loaded: bytesUploaded };
            }

            // Calculate average speed
            const avgSpeed = speedHistoryRef.current.length > 0
              ? speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length
              : 0;

            const remaining = bytesTotal - bytesUploaded;
            const remainingTime = avgSpeed > 0 ? remaining / avgSpeed : 0;

            setProgress({
              loaded: bytesUploaded,
              total: bytesTotal,
              percentage: Math.round((bytesUploaded / bytesTotal) * 100),
              speed: avgSpeed,
              speedFormatted: formatSpeed(avgSpeed),
              remainingTime,
              remainingTimeFormatted: formatTime(remainingTime),
            });
          },
          onSuccess: () => {
            setProgress({
              loaded: file.size,
              total: file.size,
              percentage: 100,
              speed: 0,
              speedFormatted: '0 B/s',
              remainingTime: 0,
              remainingTimeFormatted: '0s',
            });

            const { data: urlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);

            uploadRef.current = null;
            resolve(urlData.publicUrl);
          },
        });

        uploadRef.current = upload;
        
        // Check for previous uploads and resume if possible
        const previousUploads = await upload.findPreviousUploads();
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        upload.start();
      } catch (err) {
        console.error('Upload setup error:', err);
        setError(err instanceof Error ? err.message : 'Erro ao configurar upload');
        reject(err);
      }
    });
  }, []);

  const uploadFile = useCallback(async (
    file: File,
    bucket: 'videos' | 'posters',
    folder?: string
  ): Promise<string | null> => {
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
      // Validate file type
      if (bucket === 'videos' && !SUPPORTED_VIDEO_TYPES.includes(file.type)) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        throw new Error(
          `Formato "${ext}" não suportado. Use: MP4, WebM, OGG, MOV, AVI, MKV, MPEG, 3GP, M4V, FLV`
        );
      }

      if (bucket === 'posters' && !SUPPORTED_IMAGE_TYPES.includes(file.type)) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        throw new Error(
          `Formato "${ext}" não suportado. Use: JPG, PNG, GIF, WebP, SVG`
        );
      }

      // Use TUS for large files (> 50MB) or videos, standard upload for small files
      const useTus = file.size > 50 * 1024 * 1024 || bucket === 'videos';

      if (useTus) {
        const url = await uploadWithTus(file, bucket, folder);
        return url;
      } else {
        // Standard upload for small files
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = folder ? `${folder}/${fileName}` : fileName;

        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        setProgress({ 
          loaded: file.size, 
          total: file.size, 
          percentage: 100,
          speed: 0,
          speedFormatted: '0 B/s',
          remainingTime: 0,
          remainingTimeFormatted: '0s',
        });

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        return urlData.publicUrl;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload falhou';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [uploadWithTus]);

  const uploadVideo = useCallback((file: File) => uploadFile(file, 'videos'), [uploadFile]);
  const uploadPoster = useCallback((file: File) => uploadFile(file, 'posters'), [uploadFile]);

  return {
    uploadVideo,
    uploadPoster,
    isUploading,
    progress,
    error,
    cancelUpload,
    resetProgress: () => setProgress(null),
    resetError: () => setError(null),
  };
}
