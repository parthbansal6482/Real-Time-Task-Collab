import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { KanbanList } from './KanbanList';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { motion, AnimatePresence } from 'motion/react';
import { joinBoard, leaveBoard } from '../../services/socket';

export function BoardView() {
  const { lists, selectedBoardId, createList, reorderLists, isLoadingBoard } = useStore();
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

  // Handle list reordering via drag-and-drop
  const moveList = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (!selectedBoardId) return;
      const newOrder = [...boardLists];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, removed);
      reorderLists(selectedBoardId, newOrder.map((l) => l.id));
    },
    [boardLists, selectedBoardId, reorderLists]
  );

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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex gap-6 p-6 h-full overflow-x-auto overflow-y-hidden">
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

        {/* Add List Button / Inline Input */}
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
              className="w-full h-12 border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add another list
            </Button>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
