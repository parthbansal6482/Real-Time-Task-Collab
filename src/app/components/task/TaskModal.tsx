import { useState, useRef, useEffect, useMemo } from 'react';
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
  Save,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { getSocket } from '../../services/socket';
import { SOCKET_EVENTS } from '../../services/socketEvents';
import { tasksApi } from '../../services/api';
import { toast } from 'sonner';
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
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignees, setEditAssignees] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Sync local state with task
  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description);
      setEditPriority(task.priority || 'medium');
      setEditDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setEditAssignees([...task.assignees]);
      setEditTags([...(task.tags || [])]);

      // Sync editing status to other users
      const socket = getSocket();
      if (socket) {
        socket.emit(SOCKET_EVENTS.USER_EDITING, { taskId: task.id, boardId: task.boardId });
      }

      return () => {
        if (socket) {
          socket.emit(SOCKET_EVENTS.USER_STOPPED_EDITING, { taskId: task.id, boardId: task.boardId });
        }
      };
    }
  }, [task?.id, task?.boardId]);

  // Detect if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!task) return false;
    if (editTitle.trim() !== task.title) return true;
    if (editDescription !== task.description) return true;
    if (editPriority !== task.priority) return true;
    const taskDueDate = task.dueDate ? task.dueDate.split('T')[0] : '';
    if (editDueDate !== taskDueDate) return true;
    if (JSON.stringify([...editAssignees].sort()) !== JSON.stringify([...task.assignees].sort())) return true;
    if (JSON.stringify([...editTags].sort()) !== JSON.stringify([...(task.tags || [])].sort())) return true;
    return false;
  }, [task, editTitle, editDescription, editPriority, editDueDate, editAssignees, editTags]);

  if (!task) return null;

  const currentBoard = boards.find((b) => b.id === task.boardId);
  const isCreator = currentUser?.id === task.creatorId;
  const isOwner = currentUser?.id === currentBoard?.ownerId;
  const canEdit = isCreator || isOwner;
  const assigneeUsers = editAssignees
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean) as User[];
  const availableUsers = users.filter((u) => {
    // Only show users who are members of the board AND not already assigned to the task
    const isMember = currentBoard?.memberIds.includes(u.id);
    const isAssigned = editAssignees.includes(u.id);
    return isMember && !isAssigned;
  });
  const taskActivities = activities.filter((a) => a.boardId === task.boardId).slice(0, 10);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleToggleAssignee = (userId: string) => {
    setEditAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSetPriority = (priority: Priority) => {
    setEditPriority(priority);
  };

  const handleSetDueDate = (date: string) => {
    setEditDueDate(date);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      if (!editTags.includes(newTag.trim())) {
        setEditTags((prev) => [...prev, newTag.trim()]);
      }
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setEditTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSaveChanges = async () => {
    if (!task || !hasChanges) return;
    setIsSaving(true);
    try {
      // Build local updates
      const updates: Partial<Task> = {};
      if (editTitle.trim() !== task.title) updates.title = editTitle.trim();
      if (editDescription !== task.description) updates.description = editDescription;
      if (editPriority !== task.priority) updates.priority = editPriority;
      if (editDueDate !== (task.dueDate ? task.dueDate.split('T')[0] : '')) {
        updates.dueDate = editDueDate ? new Date(editDueDate).toISOString() : undefined;
      }
      if (JSON.stringify([...editTags].sort()) !== JSON.stringify([...(task.tags || [])].sort())) {
        updates.tags = editTags;
      }
      if (JSON.stringify([...editAssignees].sort()) !== JSON.stringify([...task.assignees].sort())) {
        updates.assignees = editAssignees;
      }

      // Update local store
      updateTask(task.id, updates);

      // Handle assignee changes via backend API
      const addedAssignees = editAssignees.filter((id) => !task.assignees.includes(id));
      const removedAssignees = task.assignees.filter((id) => !editAssignees.includes(id));

      for (const userId of addedAssignees) {
        try {
          await tasksApi.assign(task.id, userId);
        } catch (err) {
          console.error(`[TaskModal] Failed to assign user ${userId}:`, err);
        }
      }
      for (const userId of removedAssignees) {
        try {
          await tasksApi.unassign(task.id, userId);
        } catch (err) {
          console.error(`[TaskModal] Failed to unassign user ${userId}:`, err);
        }
      }

      toast.success('Changes saved!');
    } catch (error: any) {
      console.error('[TaskModal] Save failed:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
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
                    disabled={!isCreator}
                    className={`mt-1 flex-shrink-0 ${!isCreator ? 'cursor-default' : ''}`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 transition-colors ${task.status === 'completed' ? 'text-green-500' : 'text-gray-300 hover:text-indigo-400'
                        } ${!isCreator && task.status !== 'completed' ? 'opacity-50' : ''}`}
                    />
                  </button>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={!isCreator}
                    className={`text-lg font-semibold border-none p-0 h-auto focus-visible:ring-0 ${task.status === 'completed' ? 'line-through text-gray-400' : ''
                      } ${!isCreator ? 'cursor-default' : ''}`}
                  />
                  {!isCreator && (
                    <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-200 uppercase tracking-widest px-1.5 h-5">
                      Read Only
                    </Badge>
                  )}
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
                      disabled={!isCreator}
                      className={`text-xs h-7 ${editPriority === opt.value ? opt.color : 'text-gray-500'
                        } ${!isCreator && editPriority !== opt.value ? 'opacity-50' : ''}`}
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
                  {editTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs pl-2 pr-1 py-0.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                    >
                      {tag}
                      {isCreator && (
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
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
                  ) : isCreator ? (
                    <button
                      onClick={() => {
                        setIsAddingTag(true);
                        setTimeout(() => tagInputRef.current?.focus(), 50);
                      }}
                      className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-0.5 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add tag
                    </button>
                  ) : null}
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
                  readOnly={!canEdit}
                  placeholder={canEdit ? "Add a description..." : "No description provided."}
                  className={`w-full min-h-[80px] p-3 text-sm border border-gray-200 rounded-lg
                    resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    transition-all bg-gray-50 hover:bg-white focus:bg-white focus:outline-none ${!canEdit ? 'cursor-default opacity-80' : ''}`}
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
                    value={editDueDate}
                    onChange={(e) => handleSetDueDate(e.target.value)}
                    disabled={!canEdit}
                    className={`text-sm h-9 ${!canEdit ? 'cursor-default' : ''}`}
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
                        className={`transition-colors pl-1 pr-2 ${canEdit ? 'cursor-pointer hover:bg-red-100 hover:text-red-700' : 'cursor-default'}`}
                        onClick={() => canEdit && handleToggleAssignee(user.id)}
                      >
                        <Avatar className="w-4 h-4 mr-1">
                          <AvatarFallback className="text-[8px] bg-[#3A9AFF] text-white">
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        {user.name}
                      </Badge>
                    ))}
                    {canEdit && availableUsers.length > 0 && (
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
                    <AvatarFallback className="text-[10px] bg-[#3A9AFF] text-white">
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
                <AnimatePresence mode="popLayout">
                  {(task.comments || []).slice().reverse().map((comment) => {
                    const commentUser = users.find((u) => u.id === comment.userId);
                    const displayName = comment.userName || commentUser?.name || 'Unknown User';
                    const displayAvatar = comment.userAvatar || commentUser?.avatar || (displayName !== 'Unknown User' ? displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '?');

                    return (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex gap-2 pl-2"
                      >
                        <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                          <AvatarFallback className="text-[8px] bg-gray-100 text-gray-600 border border-gray-200">
                            {displayAvatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">
                              {displayName}
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

              {/* Save & Delete Buttons */}
              <div className="flex items-center justify-between pt-2">
                {canEdit ? (
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete task
                  </Button>
                ) : (
                  <div />
                )}
                {canEdit && (
                  <Button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || isSaving}
                    className={`text-sm transition-all ${hasChanges
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
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
