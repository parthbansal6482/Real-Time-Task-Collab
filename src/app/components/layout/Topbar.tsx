import { useStore } from '../../store/useStore';
import { Button } from '../ui/button';
import { GlobalSearch } from '../common/GlobalSearch';
import { NotificationMenu } from '../common/NotificationMenu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  PanelRightOpen,
  PanelRightClose,
  ChevronLeft,
  Settings,
  LogOut,
  UserPlus,
} from 'lucide-react';

export function Topbar() {
  const {
    boards,
    users,
    currentUser,
    selectedBoardId,
    currentView,
    isActivityPanelOpen,
    setSelectedBoardId,
    setCurrentView,
    toggleActivityPanel,
    toggleSettings,
    logout,
  } = useStore();

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);

  // Online users (excluding current user)
  const onlineUsers = users.filter(
    (u) => u.online && u.id !== currentUser?.id
  );

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {currentView === 'board' && selectedBoard && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedBoardId(null);
                setCurrentView('dashboard');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: selectedBoard.color }}
              />
              <h1 className="text-lg font-semibold text-gray-900">
                {selectedBoard.title}
              </h1>
            </div>
          </>
        )}
        {currentView === 'dashboard' && (
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        )}
      </div>

      {/* Center — Global Search */}
      <div className="hidden md:flex flex-1 max-w-lg mx-4">
        <GlobalSearch />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <TooltipProvider>
            <div className="hidden sm:flex items-center -space-x-1 mr-2">
              {onlineUsers.slice(0, 4).map((user) => (
                <Tooltip key={user.id}>
                  <TooltipTrigger>
                    <div className="relative">
                      <Avatar className="w-7 h-7 border-2 border-white">
                        <AvatarFallback className="text-xs bg-[#3A9AFF] text-white">
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{user.name} (online)</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {onlineUsers.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-[10px] text-gray-500">
                    +{onlineUsers.length - 4}
                  </span>
                </div>
              )}
            </div>
          </TooltipProvider>
        )}

        {/* Notification Menu */}
        <NotificationMenu />

        {/* Activity Panel Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleActivityPanel}
                className={isActivityPanelOpen ? 'bg-indigo-50 text-[#3A9AFF]' : ''}
              >
                {isActivityPanelOpen ? (
                  <PanelRightClose className="w-5 h-5" />
                ) : (
                  <PanelRightOpen className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Toggle Activity Panel</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* User Menu (Linked to Settings) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSettings}
                className="relative"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-[#3A9AFF] text-white text-sm">
                    {currentUser?.avatar || '?'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">User Settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}