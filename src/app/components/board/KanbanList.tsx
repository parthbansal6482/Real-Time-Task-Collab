import { useState, useRef, useCallback } from 'react';
import { useStore, List } from '../../store/useStore';
import { useDrop, useDrag } from 'react-dnd';
import { TaskCard } from './TaskCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Plus, MoreVertical, Pencil, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KanbanListProps {
  list: List;
  index: number;
  moveList: (dragIndex: number, hoverIndex: number) => void;
}

interface DragItem {
  type: string;
  id: string;
  listId: string;
  index: number;
}

export function KanbanList({ list, index, moveList }: KanbanListProps) {
  const { tasks, boardFilters, createTask, moveTask, updateListTitle, deleteList } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  // List tasks filtered by search, priority, and assignee, then sorted by order
  const listTasks = tasks
    .filter((t) => {
      if (t.listId !== list.id) return false;

      const matchesSearch = !boardFilters.search ||
        t.title.toLowerCase().includes(boardFilters.search.toLowerCase()) ||
        t.description?.toLowerCase().includes(boardFilters.search.toLowerCase());

      const matchesPriority = boardFilters.priority === 'all' || t.priority === boardFilters.priority;

      const matchesAssignee = boardFilters.assigneeId === 'all' ||
        t.assignees.includes(boardFilters.assigneeId);

      return matchesSearch && matchesPriority && matchesAssignee;
    })
    .sort((a, b) => a.order - b.order);

  // ── List Drag (for reordering lists) ────────────────────────────

  const [{ isDraggingList }, dragListRef, previewRef] = useDrag({
    type: 'LIST',
    item: { type: 'LIST', id: list.id, index },
    collect: (monitor) => ({
      isDraggingList: monitor.isDragging(),
    }),
  });

  const [, dropListRef] = useDrop({
    accept: 'LIST',
    hover(item: { index: number }) {
      if (item.index !== index) {
        moveList(item.index, index);
        item.index = index;
      }
    },
  });

  // ── Task Drop Target ────────────────────────────────────────────

  const [{ isOver }, dropTaskRef] = useDrop({
    accept: 'TASK',
    drop: (item: DragItem) => {
      if (item.listId !== list.id) {
        moveTask(item.id, item.listId, list.id, listTasks.length);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // ── Title Editing ───────────────────────────────────────────────

  const handleStartEditing = () => {
    setEditTitle(list.title);
    setIsEditing(true);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== list.title) {
      updateListTitle(list.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') setIsEditing(false);
  };

  // ── Add Task ────────────────────────────────────────────────────

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      createTask(list.id, list.boardId, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTask();
    if (e.key === 'Escape') {
      setIsAddingTask(false);
      setNewTaskTitle('');
    }
  };

  // ── Delete List ─────────────────────────────────────────────────

  const handleDeleteList = () => {
    deleteList(list.id);
    setShowDeleteDialog(false);
  };

  // Combine refs for list DnD
  const listRef = useCallback(
    (node: HTMLDivElement | null) => {
      previewRef(node);
      dropListRef(node);
      dropTaskRef(node);
    },
    [previewRef, dropListRef, dropTaskRef]
  );

  return (
    <>
      <div
        ref={listRef}
        className={`
          flex-shrink-0 w-72 bg-gray-50/80 rounded-xl border border-gray-200
          flex flex-col max-h-[calc(100vh-10rem)]
          transition-all duration-200
          ${isDraggingList ? 'opacity-40 scale-95' : ''}
          ${isOver ? 'border-indigo-400 bg-indigo-50/30 shadow-md' : ''}
        `}
      >
        {/* List Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {/* Drag handle */}
            <div
              ref={dragListRef as any}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            {isEditing ? (
              <Input
                ref={titleInputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleTitleKeyDown}
                className="h-7 text-sm font-semibold"
              />
            ) : (
              <h3
                className="text-sm font-semibold text-gray-700 truncate cursor-pointer hover:text-gray-900"
                onDoubleClick={handleStartEditing}
              >
                {list.title}
              </h3>
            )}

            <span className="text-xs text-gray-400 ml-1 flex-shrink-0">
              {listTasks.length}
            </span>
          </div>

          {/* List Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleStartEditing}>
                <Pencil className="w-4 h-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task Cards */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <AnimatePresence mode="popLayout">
            {listTasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <TaskCard task={task} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {listTasks.length === 0 && !isAddingTask && (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400">No tasks yet</p>
            </div>
          )}

          {/* Add Task Inline */}
          {isAddingTask && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Input
                ref={taskInputRef}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleTaskKeyDown}
                onBlur={() => {
                  if (!newTaskTitle.trim()) {
                    setIsAddingTask(false);
                  }
                }}
                placeholder="Enter a task title..."
                className="text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs"
                >
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Add Task Button */}
        {!isAddingTask && (
          <div className="p-2 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddingTask(true);
                setTimeout(() => taskInputRef.current?.focus(), 50);
              }}
              className="w-full justify-start text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 h-8"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add task
            </Button>
          </div>
        )}
      </div>

      {/* Delete List Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{list.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this list and all{' '}
              <strong>{listTasks.length}</strong> task(s) in it. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
