import { User } from '../../store/useStore';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ users, max = 3, size = 'md' }: AvatarGroupProps) {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {displayUsers.map((user) => (
          <Tooltip key={user.id}>
            <TooltipTrigger>
              <Avatar
                className={`${sizeClasses[size]} border-2 border-white ring-1 ring-gray-200 hover:z-10 transition-all`}
              >
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{user.name}</p>
            </TooltipContent>
          </Tooltip>
        ))}
        {remainingCount > 0 && (
          <div
            className={`${sizeClasses[size]} rounded-full bg-gray-200 border-2 border-white flex items-center justify-center`}
          >
            <span className="text-gray-600">+{remainingCount}</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
