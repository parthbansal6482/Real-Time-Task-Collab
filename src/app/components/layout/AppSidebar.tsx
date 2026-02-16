import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Folder,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export function AppSidebar() {
  const {
    boards,
    selectedBoardId,
    isSidebarCollapsed,
    setSelectedBoardId,
    setCurrentView,
    toggleSidebar,
    toggleSettings,
    createBoard,
  } = useStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const boardColors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
  ];

  const handleCreateBoard = () => {
    if (newBoardTitle.trim()) {
      const randomColor = boardColors[Math.floor(Math.random() * boardColors.length)];
      createBoard(newBoardTitle.trim(), randomColor);
      setNewBoardTitle('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateBoard();
    if (e.key === 'Escape') {
      setIsCreating(false);
      setNewBoardTitle('');
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.2 }}
      className="h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0"
    >
      {/* Logo / Brand */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        {!isSidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#3A9AFF] flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="font-semibold text-gray-900">TaskFlow</span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={!selectedBoardId ? 'secondary' : 'ghost'}
                className={`w-full ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} h-9`}
                onClick={() => {
                  setSelectedBoardId(null);
                  setCurrentView('dashboard');
                }}
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="ml-2">Dashboard</span>}
              </Button>
            </TooltipTrigger>
            {isSidebarCollapsed && (
              <TooltipContent side="right">Dashboard</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Boards List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!isSidebarCollapsed && (
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Boards
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 px-2">
          {/* Inline Create Board */}
          {isCreating && !isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-1 px-1"
            >
              <Input
                ref={inputRef}
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newBoardTitle.trim()) setIsCreating(false);
                }}
                placeholder="Board name..."
                className="h-8 text-sm mb-1"
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={handleCreateBoard}
                  disabled={!newBoardTitle.trim()}
                  className="h-6 text-xs bg-indigo-600 hover:bg-indigo-700"
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsCreating(false);
                    setNewBoardTitle('');
                  }}
                  className="h-6 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}

          {boards.map((board) => (
            <TooltipProvider key={board.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={selectedBoardId === board.id ? 'secondary' : 'ghost'}
                    className={`w-full mb-0.5 ${isSidebarCollapsed ? 'justify-center' : 'justify-start'
                      } h-8 text-sm`}
                    onClick={() => setSelectedBoardId(board.id)}
                  >
                    <Folder
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: board.color }}
                    />
                    {!isSidebarCollapsed && (
                      <span className="ml-2 truncate">{board.title}</span>
                    )}
                  </Button>
                </TooltipTrigger>
                {isSidebarCollapsed && (
                  <TooltipContent side="right">{board.title}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </ScrollArea>
      </div>

    </motion.aside>
  );
}