import { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TVFocusableProps {
  children: ReactNode;
  className?: string;
  onSelect?: () => void;
  as?: 'div' | 'button' | 'a';
}

export const TVFocusable = forwardRef<HTMLElement, TVFocusableProps>(
  ({ children, className, onSelect, as = 'div', ...props }, ref) => {
    const Component = as as any;

    return (
      <Component
        ref={ref}
        data-focusable="true"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect?.();
          }
        }}
        className={cn(
          'outline-none transition-all duration-200',
          'focus:ring-4 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
          'focus:scale-105 focus:z-10',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

TVFocusable.displayName = 'TVFocusable';
