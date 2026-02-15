import { useState, useRef } from 'react';
import { useStore, Task, User } from '../../store/useStore';
import { useDrag } from 'react-dnd';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  Calendar,
  MessageSquare,
  CheckCircle2,
  Circle,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { users, setSelectedTaskId, toggleTaskComplete, deleteTask, updateTask, editingUsers } =
    useStore();

  // ── Drag Source ──────────────────────────────────────────────────

  const [{ isDragging }, drag] = useDrag({
    type: 'TASK',
    item: { type: 'TASK', id: task.id, listId: task.listId, index: task.order },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // ── Computed Values ─────────────────────────────────────────────

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const assigneeUsers = task.assignees
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as User[];

  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && task.status !== 'completed';
  const isCompleted = task.status === 'completed';
  const editingUserNames = (editingUsers[task.id] || [])
    .map((uid) => users.find((u) => u.id === uid)?.name)
    .filter(Boolean);
  const commentCount = task.comments?.length || 0;

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 50);
  };

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      updateTask(task.id, { title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    high: { label: 'High', color: 'text-red-700', bgColor: 'bg-red-100 border-red-200' },
    medium: { label: 'Med', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-200' },
    low: { label: 'Low', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-200' },
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id);
  };

  return (
    <div
      ref={drag as any}
      onClick={() => setSelectedTaskId(task.id)}
      className={`
        group relative bg-white rounded-lg border border-gray-200 p-3 cursor-pointer
        hover:shadow-md hover:border-indigo-200 transition-all duration-200
        ${isDragging ? 'opacity-40 rotate-2 shadow-xl scale-105' : ''}
        ${isCompleted ? 'opacity-60 bg-gray-50' : ''}
        ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}
      `}
    >
      {/* Delete button — shown on hover */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="w-3 h-3" />
      </Button>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-400">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <div className="flex items-start gap-2 mb-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id);
          }}
          className="mt-0.5 flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          ) : (
            <Circle className="w-4 h-4 text-gray-300 hover:text-indigo-400 transition-colors" />
          )}
        </button>
        {isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleTitleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="h-7 text-sm py-1 px-2 border-indigo-300 focus:ring-1 focus:ring-indigo-300"
          />
        ) : (
          <h4
            onClick={handleTitleClick}
            className={`text-sm font-medium leading-snug hover:text-indigo-600 transition-colors ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'
              }`}
          >
            {task.title}
          </h4>
        )}
      </div>

      {/* Description snippet */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Bottom Row: Priority, Due Date, Comments, Assignees */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {/* Priority */}
          {task.priority && (
            <Badge
              variant="outline"
              className={`text-xs px-1.5 py-0 h-5 ${priorityConfig[task.priority]?.bgColor || ''
                } ${priorityConfig[task.priority]?.color || ''}`}
            >
              {priorityConfig[task.priority]?.label || task.priority}
            </Badge>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'
                      }`}
                  >
                    {isOverdue ? (
                      <AlertCircle className="w-3 h-3" />
                    ) : (
                      <Calendar className="w-3 h-3" />
                    )}
                    <span>
                      {formatDistanceToNow(parseISO(task.dueDate), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Comments */}
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <MessageSquare className="w-3 h-3" />
              <span>{commentCount}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {assigneeUsers.length > 0 && (
          <div className="flex -space-x-1">
            {assigneeUsers.slice(0, 3).map((user) => (
              <TooltipProvider key={user.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="w-5 h-5 border border-white">
                      <AvatarFallback className="text-[8px] bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{user.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {assigneeUsers.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center">
                <span className="text-[8px] text-gray-500">
                  +{assigneeUsers.length - 3}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editing indicator */}
      {editingUserNames.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-1"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-600">
            {editingUserNames.join(', ')} editing...
          </span>
        </motion.div>
      )}
    </div>
  );
}
