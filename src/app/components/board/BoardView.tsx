import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { KanbanList } from './KanbanList';
import { Plus, Loader2, Search, Filter, X, User as UserIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { joinBoard, leaveBoard } from '../../services/socket';

export function BoardView() {
  const {
    lists,
    users,
    boards,
    selectedBoardId,
    createList,
    reorderLists,
    isLoadingBoard,
    boardFilters,
    setBoardFilters,
    currentUser,
  } = useStore();
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Join/leave board room for real-time events
  useEffect(() => {
    if (selectedBoardId) {
      joinBoard(selectedBoardId);
    }
    return () => {
      if (selectedBoardId) {
        leaveBoard(selectedBoardId);
      }
    };
  }, [selectedBoardId]);

  // Auto-focus input when adding list
  useEffect(() => {
    if (isAddingList && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingList]);

  const boardLists = lists
    .filter((l) => l.boardId === selectedBoardId)
    .sort((a, b) => a.order - b.order);

  const handleAddList = () => {
    if (newListTitle.trim() && selectedBoardId) {
      createList(selectedBoardId, newListTitle.trim());
      setNewListTitle('');
      setIsAddingList(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddList();
    } else if (e.key === 'Escape') {
      setIsAddingList(false);
      setNewListTitle('');
    }
  };

  const currentBoard = boards.find(b => b.id === selectedBoardId);
  const isOwner = currentUser?.id === currentBoard?.ownerId;

  // Handle list reordering via drag-and-drop
  const moveList = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (!selectedBoardId || !isOwner) return;
      const newOrder = [...boardLists];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, removed);
      reorderLists(selectedBoardId, newOrder.map((l) => l.id));
    },
    [boardLists, selectedBoardId, reorderLists, isOwner]
  );

  const boardMembers = users.filter(u => currentBoard?.memberIds.includes(u.id));

  if (isLoadingBoard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm">Loading board...</p>
        </div>
      </div>
    );
  }

  const activeFilterCount = (
    (boardFilters.search ? 1 : 0) +
    (boardFilters.priority !== 'all' ? 1 : 0) +
    (boardFilters.assigneeId !== 'all' ? 1 : 0)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/20">
      {/* Filter Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={boardFilters.search}
              onChange={(e) => setBoardFilters({ search: e.target.value })}
              className="pl-9 h-9 bg-gray-50/50 border-gray-200 focus:bg-white transition-all text-sm"
            />
            {boardFilters.search && (
              <button
                onClick={() => setBoardFilters({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
            <Select
              value={boardFilters.priority}
              onValueChange={(val) => setBoardFilters({ priority: val as any })}
            >
              <SelectTrigger className="h-9 w-[130px] text-xs bg-gray-50/50 border-gray-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-3 h-3 text-gray-400" />
                  <SelectValue placeholder="Priority" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={boardFilters.assigneeId}
              onValueChange={(val) => setBoardFilters({ assigneeId: val })}
            >
              <SelectTrigger className="h-9 w-[150px] text-xs bg-gray-50/50 border-gray-200">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-3 h-3 text-gray-400" />
                  <SelectValue placeholder="Assignee" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                {boardMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-4 h-4">
                        <AvatarFallback className="text-[8px] bg-[#3A9AFF] text-white">
                          {member.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {member.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBoardFilters({ search: '', priority: 'all', assigneeId: 'all' })}
                className="h-8 text-xs text-gray-500 hover:text-[#3A9AFF]"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">
            {boardLists.reduce((acc, l) => acc + l.taskIds.length, 0)} Tasks
          </span>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-x-auto overflow-y-hidden">
        <AnimatePresence mode="popLayout">
          {boardLists.map((list, index) => (
            <motion.div
              key={list.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <KanbanList
                list={list}
                index={index}
                moveList={moveList}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add List Button / Inline Input (Owner only) */}
        {isOwner && (
          <div className="flex-shrink-0 w-72">
            {isAddingList ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-3"
              >
                <Input
                  ref={inputRef}
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => {
                    if (!newListTitle.trim()) {
                      setIsAddingList(false);
                    }
                  }}
                  placeholder="Enter list title..."
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddList}
                    disabled={!newListTitle.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add List
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setIsAddingList(true)}
                className="w-full h-12 border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-[#3A9AFF] hover:bg-indigo-50/50 rounded-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add another list
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
