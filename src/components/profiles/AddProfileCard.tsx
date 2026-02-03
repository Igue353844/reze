import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface AddProfileCardProps {
  onClick: () => void;
  className?: string;
  index?: number;
  isFocused?: boolean;
}

export function AddProfileCard({ onClick, className, index = 0, isFocused }: AddProfileCardProps) {
  return (
    <div 
      className={cn(
        'group flex flex-col items-center gap-3 cursor-pointer',
        'animate-fade-in',
        className
      )}
      style={{ 
        animationDelay: `${index * 100}ms`,
      }}
      onClick={onClick}
      data-focusable="true"
    >
      <div className={cn(
        'w-28 h-28 rounded-lg flex items-center justify-center',
        'bg-muted/30 border-4 border-muted/50',
        'transition-all duration-300 ease-out',
        'group-hover:border-white group-hover:bg-muted/50 group-hover:scale-110 group-hover:shadow-2xl',
        isFocused && 'border-white bg-muted/50 scale-110 shadow-2xl'
      )}>
        <Plus className={cn(
          'w-16 h-16 text-muted-foreground',
          'transition-all duration-200 group-hover:text-white group-hover:scale-110',
          isFocused && 'text-white scale-110'
        )} />
      </div>
      
      <span className={cn(
        'text-muted-foreground text-lg transition-all duration-200',
        'group-hover:text-white group-hover:scale-105',
        isFocused && 'text-white scale-105'
      )}>
        Adicionar Perfil
      </span>
    </div>
  );
}
