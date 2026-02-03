import { ReactNode } from 'react';
import { useTVNavigation } from '@/hooks/useTVNavigation';
import { cn } from '@/lib/utils';

interface TVLayoutProps {
  children: ReactNode;
  className?: string;
  onBack?: () => void;
}

export function TVLayout({ children, className, onBack }: TVLayoutProps) {
  useTVNavigation({ onBack });

  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground",
      "tv-layout",
      className
    )}>
      {/* TV-optimized background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/3 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-accent/3 blur-3xl rounded-full" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
