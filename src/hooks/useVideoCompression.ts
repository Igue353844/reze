import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface CompressionProgress {
  percentage: number;
  stage: 'loading' | 'compressing' | 'done' | 'error';
  message: string;
  originalSize: number;
  estimatedSize?: number;
}

export type CompressionQuality = 'high' | 'medium' | 'low';

const QUALITY_PRESETS: Record<CompressionQuality, { crf: number; preset: string; description: string }> = {
  high: { crf: 23, preset: 'medium', description: 'Alta qualidade (menor compressão)' },
  medium: { crf: 28, preset: 'fast', description: 'Qualidade balanceada (recomendado)' },
  low: { crf: 35, preset: 'veryfast', description: 'Baixa qualidade (maior compressão)' },
};

export function useVideoCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const abortRef = useRef(false);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && isLoaded) return true;

    setProgress({
      percentage: 0,
      stage: 'loading',
      message: 'Carregando compressor de vídeo (~31MB)...',
      originalSize: 0,
    });

    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';
      
      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      ffmpeg.on('progress', ({ progress: p }) => {
        if (abortRef.current) return;
        setProgress(prev => prev ? {
          ...prev,
          percentage: Math.round(p * 100),
          stage: 'compressing',
          message: `Comprimindo... ${Math.round(p * 100)}%`,
        } : null);
      });

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setIsLoaded(true);
      return true;
    } catch (error) {
      console.error('Error loading FFmpeg:', error);
      setProgress({
        percentage: 0,
        stage: 'error',
        message: 'Erro ao carregar compressor. Tente novamente.',
        originalSize: 0,
      });
      return false;
    }
  }, [isLoaded]);

  const compressVideo = useCallback(async (
    file: File,
    quality: CompressionQuality = 'medium'
  ): Promise<File | null> => {
    abortRef.current = false;
    setIsCompressing(true);
    
    const originalSize = file.size;
    setProgress({
      percentage: 0,
      stage: 'loading',
      message: 'Preparando compressão...',
      originalSize,
    });

    try {
      const loaded = await loadFFmpeg();
      if (!loaded || !ffmpegRef.current) {
        throw new Error('FFmpeg não carregado');
      }

      if (abortRef.current) {
        setIsCompressing(false);
        setProgress(null);
        return null;
      }

      const ffmpeg = ffmpegRef.current;
      const { crf, preset } = QUALITY_PRESETS[quality];

      // Get file extension
      const inputExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const inputName = `input.${inputExt}`;
      const outputName = 'output.mp4';

      setProgress({
        percentage: 0,
        stage: 'compressing',
        message: 'Preparando arquivo...',
        originalSize,
      });

      // Write input file
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      if (abortRef.current) {
        await ffmpeg.deleteFile(inputName);
        setIsCompressing(false);
        setProgress(null);
        return null;
      }

      setProgress({
        percentage: 5,
        stage: 'compressing',
        message: 'Iniciando compressão...',
        originalSize,
      });

      // Compress video with H.264
      await ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-crf', crf.toString(),
        '-preset', preset,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-y',
        outputName,
      ]);

      if (abortRef.current) {
        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(outputName);
        } catch {}
        setIsCompressing(false);
        setProgress(null);
        return null;
      }

      // Read output
      const data = await ffmpeg.readFile(outputName);
      
      // Clean up
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      // Create a new Uint8Array from the data to ensure proper buffer handling
      const uint8Data = new Uint8Array(data as Uint8Array);

      const compressedBlob = new Blob([uint8Data], { type: 'video/mp4' });
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^.]+$/, '_compressed.mp4'),
        { type: 'video/mp4' }
      );

      setProgress({
        percentage: 100,
        stage: 'done',
        message: `Compressão concluída! ${formatBytes(originalSize)} → ${formatBytes(compressedFile.size)}`,
        originalSize,
        estimatedSize: compressedFile.size,
      });

      return compressedFile;
    } catch (error) {
      console.error('Compression error:', error);
      setProgress({
        percentage: 0,
        stage: 'error',
        message: error instanceof Error ? error.message : 'Erro na compressão',
        originalSize,
      });
      return null;
    } finally {
      setIsCompressing(false);
    }
  }, [loadFFmpeg]);

  const cancelCompression = useCallback(() => {
    abortRef.current = true;
    setIsCompressing(false);
    setProgress(null);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return {
    compressVideo,
    isCompressing,
    progress,
    isLoaded,
    loadFFmpeg,
    cancelCompression,
    resetProgress,
    qualityPresets: QUALITY_PRESETS,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
