import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import type { UserProfile } from '../types';
import { UserAvatarEditor } from './UserAvatarEditor';

interface UserAvatarProps {
  user: UserProfile;
  size?: 'sm' | 'md' | 'lg';
  showInfo?: boolean;
  editable?: boolean;
  onUpdate?: (updates: Partial<UserProfile>) => void;
  className?: string;
}

export function UserAvatar({ 
  user, 
  size = 'md', 
  showInfo = false,
  editable = false,
  onUpdate,
  className 
}: UserAvatarProps) {
  const [showEditor, setShowEditor] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const handleUpdate = (updates: Partial<UserProfile>) => {
    onUpdate?.(updates);
    setShowEditor(false);
  };

  return (
    <>
      <div className={cn('flex items-center gap-3 group', className)}>
        <div className="relative">
          {user.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={`${user.firstName} ${user.lastName}`}
              className={cn(
                'rounded-full object-cover',
                sizeClasses[size]
              )}
            />
          ) : (
            <div
              className={cn(
                'rounded-full flex items-center justify-center font-medium text-white',
                sizeClasses[size]
              )}
              style={{ backgroundColor: user.color }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </div>
          )}
          
          {editable && (
            <button
              onClick={() => setShowEditor(true)}
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="text-white" size={16} />
            </button>
          )}
        </div>
        
        {showInfo && (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
            </span>
            <span className="text-sm text-gray-500">
              {user.department}
            </span>
          </div>
        )}
      </div>

      {showEditor && (
        <UserAvatarEditor
          user={user}
          onUpdate={handleUpdate}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}