import React from 'react';
import { cn } from '@/lib/utils.ts';
import { TicketCategory, categoryColors } from '@/utils/mockData';

interface CategoryBadgeProps {
  category: TicketCategory;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  category, 
  size = 'md',
  showDot = true 
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const color = categoryColors[category];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeClasses[size]
      )}
      style={{ 
        backgroundColor: `${color}15`,
        color: color,
      }}
    >
      {showDot && (
        <span 
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {category}
    </span>
  );
};
