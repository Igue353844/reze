import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface TVInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
  label?: string;
}

export const TVInput = forwardRef<HTMLInputElement, TVInputProps>(
  ({ className, icon: Icon, error, label, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-lg font-medium text-foreground/80">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
          )}
          <input
            ref={ref}
            data-focusable="true"
            className={cn(
              "w-full h-16 rounded-xl text-lg",
              "bg-secondary/50 border-2 border-border",
              "text-foreground placeholder:text-muted-foreground",
              "transition-all duration-200",
              "outline-none",
              // Focus states for D-pad
              "focus:ring-4 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background",
              "focus:border-primary focus:bg-secondary",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              Icon ? "pl-14 pr-6" : "px-6",
              error && "border-destructive focus:ring-destructive",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-destructive text-base mt-1">{error}</p>
        )}
      </div>
    );
  }
);

TVInput.displayName = 'TVInput';
