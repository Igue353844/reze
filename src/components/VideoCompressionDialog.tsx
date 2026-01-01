import { useState } from 'react';
import { Loader2, Minimize2, X, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useVideoCompression, CompressionQuality } from '@/hooks/useVideoCompression';

interface VideoCompressionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onCompressionComplete: (compressedFile: File) => void;
  onSkip: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function VideoCompressionDialog({
  open,
  onOpenChange,
  file,
  onCompressionComplete,
  onSkip,
}: VideoCompressionDialogProps) {
  const [quality, setQuality] = useState<CompressionQuality>('medium');
  const { 
    compressVideo, 
    isCompressing, 
    progress, 
    cancelCompression,
    qualityPresets,
  } = useVideoCompression();

  const handleCompress = async () => {
    if (!file) return;
    
    const result = await compressVideo(file, quality);
    if (result) {
      onCompressionComplete(result);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    if (isCompressing) {
      cancelCompression();
    }
    onOpenChange(false);
  };

  const handleSkip = () => {
    onSkip();
    onOpenChange(false);
  };

  const estimatedReduction: Record<CompressionQuality, number> = {
    high: 0.3,
    medium: 0.5,
    low: 0.7,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minimize2 className="w-5 h-5 text-primary" />
            Comprimir Vídeo
          </DialogTitle>
          <DialogDescription>
            Reduza o tamanho do arquivo antes do upload
          </DialogDescription>
        </DialogHeader>

        {file && (
          <div className="space-y-4">
            {/* File info */}
            <div className="bg-secondary rounded-lg p-3">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                Tamanho atual: {formatBytes(file.size)}
              </p>
            </div>

            {/* Quality selection */}
            {!isCompressing && progress?.stage !== 'done' && (
              <div className="space-y-3">
                <Label>Qualidade da compressão</Label>
                <RadioGroup
                  value={quality}
                  onValueChange={(v) => setQuality(v as CompressionQuality)}
                  className="space-y-2"
                >
                  {(Object.entries(qualityPresets) as [CompressionQuality, { description: string }][]).map(([key, { description }]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key} className="flex-1 cursor-pointer">
                        <span className="capitalize font-medium">{key === 'high' ? 'Alta' : key === 'medium' ? 'Média' : 'Baixa'}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({description})
                        </span>
                        <span className="text-xs text-primary ml-2">
                          ~{formatBytes(file.size * (1 - estimatedReduction[key]))}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Progress */}
            {progress && (
              <div className="space-y-2">
                {progress.stage === 'loading' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {progress.message}
                  </div>
                )}

                {progress.stage === 'compressing' && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{progress.message}</span>
                      <span className="font-medium">{progress.percentage}%</span>
                    </div>
                    <Progress value={progress.percentage} className="h-2" />
                  </>
                )}

                {progress.stage === 'done' && (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <Check className="w-4 h-4" />
                    {progress.message}
                  </div>
                )}

                {progress.stage === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {progress.message}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              {!isCompressing && progress?.stage !== 'done' && (
                <>
                  <Button variant="outline" onClick={handleSkip}>
                    Pular
                  </Button>
                  <Button onClick={handleCompress}>
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Comprimir
                  </Button>
                </>
              )}

              {isCompressing && (
                <Button variant="destructive" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}

              {progress?.stage === 'done' && (
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              )}

              {progress?.stage === 'error' && (
                <>
                  <Button variant="outline" onClick={handleSkip}>
                    Enviar Original
                  </Button>
                  <Button onClick={handleCompress}>
                    Tentar Novamente
                  </Button>
                </>
              )}
            </div>

            {/* Warning */}
            {!isCompressing && !progress && (
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ A compressão é feita no navegador e pode demorar para vídeos grandes.
                <br />
                Não feche a aba durante o processo.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
