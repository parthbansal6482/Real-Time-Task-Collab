import { useState, useRef, useEffect } from 'react';
import { useStore, Priority, User } from '../../store/useStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import {
    Calendar,
    Tag,
    Users,
    X,
    Plus,
    AlertTriangle,
    ArrowUp,
    Minus,
    ArrowDown,
    Loader2,
} from 'lucide-react';

export function CreateTaskModal() {
    const {
        users,
        boards,
        currentUser,
        isCreateTaskModalOpen,
        createTaskTargetListId,
        createTaskTargetBoardId,
        closeCreateTaskModal,
        createTask,
    } = useStore();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Priority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tagInputRef = useRef<HTMLInputElement>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isCreateTaskModalOpen) {
            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDate('');
            setSelectedAssignees([]);
            setTags([]);
        }
    }, [isCreateTaskModalOpen]);

    if (!isCreateTaskModalOpen || !createTaskTargetListId || !createTaskTargetBoardId) {
        return null;
    }

    const currentBoard = boards.find((b) => b.id === createTaskTargetBoardId);
    const boardMembers = users.filter((u) => currentBoard?.memberIds.includes(u.id));

    const handleCreate = async () => {
        if (!title.trim()) return;

        setIsSubmitting(true);
        try {
            createTask(createTaskTargetListId, createTaskTargetBoardId, title.trim(), {
                description: description.trim(),
                priority,
                dueDate: dueDate || undefined,
                assignees: selectedAssignees,
                tags,
            });
            closeCreateTaskModal();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleAssignee = (userId: string) => {
        setSelectedAssignees((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()]);
            setNewTag('');
            setIsAddingTag(false);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const priorityOptions: { value: Priority; label: string; icon: React.ReactNode; color: string }[] = [
        {
            value: 'high',
            label: 'High',
            icon: <ArrowUp className="w-3 h-3" />,
            color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
        },
        {
            value: 'medium',
            label: 'Medium',
            icon: <Minus className="w-3 h-3" />,
            color: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200',
        },
        {
            value: 'low',
            label: 'Low',
            icon: <ArrowDown className="w-3 h-3" />,
            color: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
        },
    ];

    return (
        <Dialog open={isCreateTaskModalOpen} onOpenChange={closeCreateTaskModal}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl">Create New Task</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-6 pb-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="task-title" className="text-sm font-medium">
                                Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="task-title"
                                placeholder="What needs to be done?"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                                className="text-base"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="task-desc" className="text-sm font-medium">
                                Description
                            </Label>
                            <textarea
                                id="task-desc"
                                placeholder="Add more details..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full min-h-[100px] p-3 text-sm border border-gray-200 rounded-lg
                  resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                  transition-all bg-gray-50 hover:bg-white focus:bg-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Priority */}
                            <div className="space-y-3">
                                <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" /> Priority
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {priorityOptions.map((opt) => (
                                        <Button
                                            key={opt.value}
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setPriority(opt.value)}
                                            className={`text-xs h-8 px-3 ${priority === opt.value ? opt.color : 'text-gray-500 hover:bg-gray-100'
                                                }`}
                                        >
                                            {opt.icon}
                                            <span className="ml-1.5">{opt.label}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Due Date */}
                            <div className="space-y-3">
                                <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-3 h-3" /> Due Date
                                </Label>
                                <Input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>

                        {/* Assignees */}
                        <div className="space-y-3">
                            <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-3 h-3" /> Assignees
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {boardMembers.map((user) => {
                                    const isSelected = selectedAssignees.includes(user.id);
                                    return (
                                        <Badge
                                            key={user.id}
                                            variant={isSelected ? 'default' : 'secondary'}
                                            className={`cursor-pointer transition-all px-2 py-1 flex items-center gap-1.5 ${isSelected
                                                    ? 'bg-indigo-600 hover:bg-indigo-700'
                                                    : 'hover:bg-gray-200'
                                                }`}
                                            onClick={() => handleToggleAssignee(user.id)}
                                        >
                                            <Avatar className="w-4 h-4">
                                                <AvatarFallback className="text-[8px] bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                                                    {user.avatar}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs">{user.name}</span>
                                            {isSelected && <X className="w-3 h-3 ml-0.5" />}
                                        </Badge>
                                    );
                                })}
                                {boardMembers.length === 0 && (
                                    <p className="text-xs text-gray-400 italic">No board members to assign</p>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-3">
                            <Label className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Tag className="w-3 h-3" /> Tags
                            </Label>
                            <div className="flex flex-wrap gap-2 items-center">
                                {tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="text-xs py-1 px-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1"
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
                                    <div className="flex items-center gap-2">
                                        <Input
                                            ref={tagInputRef}
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddTag();
                                                }
                                                if (e.key === 'Escape') setIsAddingTag(false);
                                            }}
                                            onBlur={() => {
                                                if (!newTag.trim()) setIsAddingTag(false);
                                            }}
                                            placeholder="Tag name..."
                                            className="h-8 text-xs w-32"
                                            autoFocus
                                        />
                                        <Button size="sm" className="h-8 px-2" onClick={handleAddTag}>
                                            Add
                                        </Button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setIsAddingTag(true);
                                            setTimeout(() => tagInputRef.current?.focus(), 50);
                                        }}
                                        className="h-8 px-3 rounded-full border border-dashed border-gray-300 text-xs 
                      text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 
                      flex items-center gap-1.5 transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Tag
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-2 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex w-full justify-between items-center">
                        <p className="text-[11px] text-gray-400 italic">
                            * Required fields
                        </p>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={closeCreateTaskModal} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={!title.trim() || isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 px-6"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Task'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
