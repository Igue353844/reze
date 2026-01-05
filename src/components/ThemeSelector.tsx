import { useState, useEffect } from 'react';
import { Check, Palette, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { APP_THEMES, getThemeById, generateThemeCssVars } from '@/config/themes';
import { useUserPreferences, useUpdateColorTheme } from '@/hooks/useUserPreferences';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ThemeSelector() {
  const { data: preferences, isLoading } = useUserPreferences();
  const updateTheme = useUpdateColorTheme();

  const [selectedTheme, setSelectedTheme] = useState<string>('purple-blue');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // Sync with saved preference
  useEffect(() => {
    if (preferences?.color_theme) {
      setSelectedTheme(preferences.color_theme);
    }
  }, [preferences?.color_theme]);

  // Apply theme to document on selection or preview
  useEffect(() => {
    const themeId = previewTheme || selectedTheme;
    const theme = getThemeById(themeId);
    const vars = generateThemeCssVars(theme);

    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [selectedTheme, previewTheme]);

  const handleSave = async (themeId: string) => {
    try {
      await updateTheme.mutateAsync(themeId);
      setSelectedTheme(themeId);
      setPreviewTheme(null);
      toast.success('Tema salvo com sucesso!');
    } catch (error) {
      console.error('Error saving theme:', error);
      toast.error('Erro ao salvar tema');
    }
  };

  const handlePreview = (themeId: string) => {
    setPreviewTheme(themeId);
  };

  const handleCancelPreview = () => {
    setPreviewTheme(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const activeTheme = previewTheme || selectedTheme;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          Tema de Cores
        </CardTitle>
        <CardDescription>
          Escolha o tema de cores do aplicativo. O preview é aplicado em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Theme grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {APP_THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            const isSaved = selectedTheme === theme.id && !previewTheme;

            return (
              <button
                key={theme.id}
                onClick={() => handlePreview(theme.id)}
                className={cn(
                  'relative group rounded-lg p-3 border-2 transition-all duration-200 text-left',
                  isActive
                    ? 'border-primary ring-2 ring-primary/30 scale-[1.02]'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                {/* Gradient preview */}
                <div
                  className="h-16 rounded-md mb-2 shadow-inner"
                  style={{ background: theme.gradient }}
                />

                {/* Theme name */}
                <span className="text-sm font-medium text-foreground block truncate">
                  {theme.name}
                </span>

                {/* Saved indicator */}
                {isSaved && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}

                {/* Preview indicator */}
                {previewTheme === theme.id && !isSaved && (
                  <span className="absolute top-2 right-2 text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
                    Preview
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        {previewTheme && previewTheme !== selectedTheme && (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={handleCancelPreview}>
              Cancelar
            </Button>
            <Button
              onClick={() => handleSave(previewTheme)}
              disabled={updateTheme.isPending}
            >
              {updateTheme.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Tema'
              )}
            </Button>
          </div>
        )}

        {/* Current theme info */}
        <div className="text-xs text-muted-foreground">
          Tema atual: <span className="text-foreground">{getThemeById(selectedTheme).name}</span>
        </div>
      </CardContent>
    </Card>
  );
}
