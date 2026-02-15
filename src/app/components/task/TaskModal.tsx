import { useState, useRef, useEffect } from 'react';
import { useStore, Task, User, Priority } from '../../store/useStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  Calendar,
  Tag,
  MessageSquare,
  Trash2,
  Users,
  Send,
  Clock,
  X,
  Plus,
  AlertTriangle,
  ArrowUp,
  Minus,
  ArrowDown,
  CheckCircle2,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
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

export function TaskModal() {
  const {
    tasks,
    users,
    activities,
    currentUser,
    boards,
    selectedTaskId,
    setSelectedTaskId,
    updateTask,
    deleteTask,
    addComment,
  } = useStore();

  const task = tasks.find((t) => t.id === selectedTaskId);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with task
  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description);
    }
  }, [task?.id]);

  if (!task) return null;

  const assigneeUsers = task.assignees
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as User[];

  const currentBoard = boards.find((b) => b.id === task.boardId);
  const availableUsers = users.filter((u) => {
    // Only show users who are members of the board AND not already assigned to the task
    const isMember = currentBoard?.memberIds.includes(u.id);
    const isAssigned = task.assignees.includes(u.id);
    return isMember && !isAssigned;
  });
  const taskActivities = activities.filter((a) => a.boardId === task.boardId).slice(0, 10);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== task.title) {
      updateTask(task.id, { title: editTitle.trim() });
    }
  };

  const handleSaveDescription = () => {
    if (editDescription !== task.description) {
      updateTask(task.id, { description: editDescription });
    }
  };

  const handleToggleAssignee = (userId: string) => {
    const newAssignees = task.assignees.includes(userId)
      ? task.assignees.filter((id) => id !== userId)
      : [...task.assignees, userId];
    updateTask(task.id, { assignees: newAssignees });
  };

  const handleSetPriority = (priority: Priority) => {
    updateTask(task.id, { priority });
  };

  const handleSetDueDate = (date: string) => {
    updateTask(task.id, { dueDate: date || undefined });
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const currentTags = task.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        updateTask(task.id, { tags: [...currentTags, newTag.trim()] });
      }
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateTask(task.id, { tags: (task.tags || []).filter((t) => t !== tag) });
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleDelete = () => {
    deleteTask(task.id);
    setSelectedTaskId(null);
    setShowDeleteDialog(false);
  };

  const priorityOptions: { value: Priority; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'high', label: 'High', icon: <ArrowUp className="w-3 h-3" />, color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
    { value: 'medium', label: 'Medium', icon: <Minus className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200' },
    { value: 'low', label: 'Low', icon: <ArrowDown className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' },
  ];

  return (
    <>
      <Dialog open={!!selectedTaskId} onOpenChange={() => setSelectedTaskId(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] p-0 gap-0 overflow-hidden">
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6 space-y-6">
              {/* Header */}
              <DialogHeader className="space-y-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => updateTask(task.id, {
                      status: task.status === 'completed' ? 'active' : 'completed'
                    })}
                    className="mt-1 flex-shrink-0"
                  >
                    <CheckCircle2
                      className={`w-5 h-5 transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-indigo-400'
                        }`}
                    />
                  </button>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className={`text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 ${task.status === 'completed' ? 'line-through text-gray-400' : ''
                      }`}
                  />
                </div>
              </DialogHeader>

              {/* Priority Selector */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" /> Priority
                </Label>
                <div className="flex gap-2">
                  {priorityOptions.map((opt) => (
                    <Button
                      key={opt.value}
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetPriority(opt.value)}
                      className={`text-xs h-7 ${task.priority === opt.value ? opt.color : 'text-gray-500'
                        }`}
                    >
                      {opt.icon}
                      <span className="ml-1">{opt.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-3 h-3" /> Tags
                </Label>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {(task.tags || []).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs pl-2 pr-1 py-0.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {isAddingTag ? (
                    <div className="flex items-center gap-1">
                      <Input
                        ref={tagInputRef}
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTag();
                          if (e.key === 'Escape') setIsAddingTag(false);
                        }}
                        onBlur={() => {
                          if (!newTag.trim()) setIsAddingTag(false);
                        }}
                        placeholder="Tag name"
                        className="h-6 text-xs w-24"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsAddingTag(true);
                        setTimeout(() => tagInputRef.current?.focus(), 50);
                      }}
                      className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-0.5 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add tag
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase tracking-wider">
                  Description
                </Label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  placeholder="Add a description..."
                  className="w-full min-h-[80px] p-3 text-sm border border-gray-200 rounded-lg
                    resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    transition-all bg-gray-50 hover:bg-white focus:bg-white"
                  rows={3}
                />
              </div>

              <Separator />

              {/* Due Date & Assignees Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Due Date
                  </Label>
                  <Input
                    type="date"
                    value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                    onChange={(e) => handleSetDueDate(e.target.value ? new Date(e.target.value).toISOString() : '')}
                    className="text-sm h-9"
                  />
                </div>

                {/* Assignees */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-3 h-3" /> Assignees
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {assigneeUsers.map((user) => (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-700 transition-colors pl-1 pr-2"
                        onClick={() => handleToggleAssignee(user.id)}
                      >
                        <Avatar className="w-4 h-4 mr-1">
                          <AvatarFallback className="text-[8px] bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        {user.name}
                      </Badge>
                    ))}
                    {availableUsers.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {availableUsers.slice(0, 5).map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleToggleAssignee(user.id)}
                            className="flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 
                              border border-dashed border-gray-300 rounded-full
                              hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            {user.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Comments Section */}
              <div className="space-y-3">
                <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-3 h-3" /> Comments
                  {(task.comments?.length ?? 0) > 0 && (
                    <span className="text-gray-400">({task.comments?.length})</span>
                  )}
                </Label>

                {/* Comment Input */}
                <div className="flex gap-2">
                  <Avatar className="w-7 h-7 flex-shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      {currentUser?.avatar || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <textarea
                      ref={commentInputRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={handleCommentKeyDown}
                      placeholder="Write a comment..."
                      className="w-full p-2 pr-10 text-sm border border-gray-200 rounded-lg
                        resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                        min-h-[60px] bg-gray-50 hover:bg-white focus:bg-white transition-all"
                      rows={2}
                    />
                    {newComment.trim() && (
                      <Button
                        size="icon"
                        onClick={handleAddComment}
                        className="absolute right-2 bottom-2 h-6 w-6 bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Send className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Comment List */}
                <AnimatePresence>
                  {(task.comments || []).slice().reverse().map((comment) => {
                    const commentUser = users.find((u) => u.id === comment.userId);
                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 pl-2"
                      >
                        <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                          <AvatarFallback className="text-[8px] bg-gray-200 text-gray-600">
                            {commentUser?.avatar || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">
                              {commentUser?.name || 'Unknown'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatDistanceToNow(parseISO(comment.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <Separator />

              {/* Activity Timeline */}
              {taskActivities.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Activity
                  </Label>
                  <div className="space-y-2">
                    {taskActivities.slice(0, 5).map((activity) => {
                      const actUser = users.find((u) => u.id === activity.userId);
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-2 text-xs text-gray-500"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-700">
                              {actUser?.name || 'Someone'}
                            </span>{' '}
                            {activity.message}
                            <span className="text-gray-400 ml-1">
                              {formatDistanceToNow(parseISO(activity.timestamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Delete Button */}
              <div className="pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete task
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{task.title}&rdquo;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
