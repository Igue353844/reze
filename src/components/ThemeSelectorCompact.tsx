import { useState, useEffect } from 'react';
import { Palette, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { APP_THEMES, getThemeById, generateThemeCssVars } from '@/config/themes';
import { useUserPreferences, useUpdateColorTheme } from '@/hooks/useUserPreferences';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ThemeSelectorCompact() {
  const { data: preferences } = useUserPreferences();
  const updateTheme = useUpdateColorTheme();

  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('purple-blue');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // Sync with saved preference
  useEffect(() => {
    if (preferences?.color_theme) {
      setSelectedTheme(preferences.color_theme);
    }
  }, [preferences?.color_theme]);

  // Apply theme preview
  useEffect(() => {
    if (!open) return;
    
    const themeId = previewTheme || selectedTheme;
    const theme = getThemeById(themeId);
    const vars = generateThemeCssVars(theme);

    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [selectedTheme, previewTheme, open]);

  // Reset preview on close
  useEffect(() => {
    if (!open && previewTheme) {
      setPreviewTheme(null);
      // Restore saved theme
      const theme = getThemeById(selectedTheme);
      const vars = generateThemeCssVars(theme);
      const root = document.documentElement;
      Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  }, [open, previewTheme, selectedTheme]);

  const handleSelect = async (themeId: string) => {
    try {
      await updateTheme.mutateAsync(themeId);
      setSelectedTheme(themeId);
      setPreviewTheme(null);
      setOpen(false);
      toast.success('Tema salvo!');
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Erro ao salvar tema');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Escolher tema">
          <Palette className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Escolher Tema
          </DialogTitle>
          <DialogDescription>
            Selecione seu tema de cores preferido
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 py-4">
          {APP_THEMES.map((theme) => {
            const isActive = (previewTheme || selectedTheme) === theme.id;
            const isSaved = selectedTheme === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                onMouseEnter={() => setPreviewTheme(theme.id)}
                onMouseLeave={() => setPreviewTheme(null)}
                disabled={updateTheme.isPending}
                className={cn(
                  'relative rounded-lg p-2 border-2 transition-all duration-200',
                  isActive
                    ? 'border-primary ring-2 ring-primary/30 scale-[1.02]'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                {/* Gradient preview */}
                <div
                  className="h-10 rounded-md shadow-inner"
                  style={{ background: theme.gradient }}
                />

                {/* Theme name */}
                <span className="text-[10px] font-medium text-foreground block truncate mt-1">
                  {theme.name}
                </span>

                {/* Saved indicator */}
                {isSaved && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}

                {/* Loading indicator */}
                {updateTheme.isPending && previewTheme === theme.id && (
                  <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
