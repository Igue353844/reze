import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { UploadProgress } from '@/hooks/useUpload';

interface UploadProgressBarProps {
  progress: UploadProgress | null;
  isUploading: boolean;
  error: string | null;
  fileName?: string;
  onCancel?: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function UploadProgressBar({
  progress,
  isUploading,
  error,
  fileName,
  onCancel,
}: UploadProgressBarProps) {
  if (!progress && !isUploading && !error) return null;

  const isComplete = progress?.percentage === 100 && !isUploading;
  const hasError = !!error;

  return (
    <div className="w-full space-y-2 p-4 rounded-lg bg-secondary/50 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {isUploading && <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />}
          {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
          {hasError && <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />}
          <span className="text-sm font-medium truncate">
            {fileName || 'Upload'}
          </span>
        </div>
        {onCancel && isUploading && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
            onClick={onCancel}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Error message */}
      {hasError && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Progress bar */}
      {progress && !hasError && (
        <>
          <Progress value={progress.percentage} className="h-2" />
          
          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
              </span>
              <span className="text-primary font-medium">
                {progress.percentage}%
              </span>
            </div>
            
            {isUploading && progress.speed > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-primary font-medium">
                  ⬆️ {progress.speedFormatted}
                </span>
                <span>
                  ⏱️ {progress.remainingTimeFormatted}
                </span>
              </div>
            )}
            
            {isComplete && (
              <span className="text-green-500 font-medium">
                Concluído!
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
