import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface AddProfileCardProps {
  onClick: () => void;
  className?: string;
}

export function AddProfileCard({ onClick, className }: AddProfileCardProps) {
  return (
    <div 
      className={cn(
        'group flex flex-col items-center gap-3 cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <div className={cn(
        'w-28 h-28 rounded-lg flex items-center justify-center',
        'bg-muted/50 border-2 border-muted',
        'transition-all duration-200',
        'group-hover:border-white group-hover:bg-muted'
      )}>
        <Plus className={cn(
          'w-16 h-16 text-muted-foreground',
          'transition-colors group-hover:text-white'
        )} />
      </div>
      
      <span className={cn(
        'text-muted-foreground text-lg transition-colors',
        'group-hover:text-white'
      )}>
        Adicionar Perfil
      </span>
    </div>
  );
}
