import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const tvButtonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-3",
    "font-medium transition-all duration-200",
    "outline-none rounded-xl",
    // Focus states for D-pad navigation
    "focus:ring-4 focus:ring-primary focus:ring-offset-4 focus:ring-offset-background",
    "focus:scale-105 focus:z-10",
    "disabled:opacity-50 disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-r from-primary to-accent text-primary-foreground",
          "hover:brightness-110 focus:brightness-110",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 focus:bg-secondary/80",
        ],
        outline: [
          "border-2 border-primary/50 bg-transparent text-foreground",
          "hover:border-primary hover:bg-primary/10",
          "focus:border-primary focus:bg-primary/10",
        ],
        ghost: [
          "bg-transparent text-foreground",
          "hover:bg-muted focus:bg-muted",
        ],
      },
      size: {
        default: "h-14 px-8 text-lg",
        lg: "h-16 px-10 text-xl",
        xl: "h-20 px-12 text-2xl",
        icon: "h-14 w-14",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

interface TVButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tvButtonVariants> {}

export const TVButton = forwardRef<HTMLButtonElement, TVButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-focusable="true"
        className={cn(tvButtonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TVButton.displayName = 'TVButton';
