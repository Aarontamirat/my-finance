import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-4 h-4', color }) => {
  // Try to lookup from LucideIcons
  const IconComponent = (LucideIcons as Record<string, any>)[name] || LucideIcons.Tag;

  return <IconComponent className={className} style={color ? { color } : undefined} />;
};
