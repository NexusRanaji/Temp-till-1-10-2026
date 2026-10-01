import React from 'react';
import { UserRole } from '../../types';

interface UserAvatarProps {
  name: string;
  role?: UserRole;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  role = 'student',
  size = 'md',
  className = '',
}) => {
  // Extract up to 2 uppercase initials
  const initials = (name || 'User')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const roleGradients: Record<UserRole, string> = {
    superadmin: 'from-amber-500 to-rose-600 text-white shadow-amber-500/20',
    teacher: 'from-emerald-500 to-teal-700 text-white shadow-emerald-500/20',
    student: 'from-blue-500 to-indigo-700 text-white shadow-blue-500/20',
    parent: 'from-purple-500 to-pink-600 text-white shadow-purple-500/20',
  };

  const sizeClasses: Record<string, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-16 h-16 text-xl font-bold',
  };

  const gradient = roleGradients[role] || 'from-slate-600 to-slate-800 text-white';
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br ${gradient} select-none shadow-sm shrink-0 font-serif tracking-wider ${sizeClass} ${className}`}
      title={`${name} (${role})`}
      aria-label={`${name} avatar`}
    >
      <span>{initials}</span>
    </div>
  );
};
