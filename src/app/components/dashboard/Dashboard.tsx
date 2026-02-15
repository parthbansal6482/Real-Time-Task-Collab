import { useState, useEffect, useMemo } from 'react';
import { useStore, Board } from '../../store/useStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Skeleton } from '../ui/skeleton';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { AvatarGroup } from '../common/AvatarGroup';
import {
  Plus,
  Search,
  LayoutGrid,
  Folder,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BOARD_COLORS = [
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Orange', value: '#f97316' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Cyan', value: '#06b6d4' },
  { label: 'Blue', value: '#3b82f6' },
];

export function Dashboard() {
  const {
    boards,
    users,
    currentUser,
    setSelectedBoardId,
    createBoard,
    deleteBoard,
    fetchBoards,
    fetchUsers,
    isLoadingBoards,
    boardsPage,
    boardsTotal,
    searchQuery,
    setSearchQuery,
    boardSortBy,
    setBoardSortBy,
  } = useStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardColor, setNewBoardColor] = useState(BOARD_COLORS[0].value);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);

  // Fetch boards and users on mount
  useEffect(() => {
    fetchBoards();
    fetchUsers();
  }, []);

  // Filter and sort boards
  const filteredBoards = useMemo(() => {
    let result = [...boards];

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q));
    }

    // Sort
    if (boardSortBy === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      result.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    return result;
  }, [boards, searchQuery, boardSortBy]);

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setIsCreating(true);
    createBoard(newBoardTitle.trim(), newBoardColor, selectedMemberIds);
    // setNewBoardTitle('');
    // setNewBoardColor(BOARD_COLORS[0].value);
    // setSelectedMemberIds([]);
    setIsCreateOpen(false);
    setIsCreating(false);
  };

  const handleDeleteBoard = () => {
    if (deletingBoardId) {
      deleteBoard(deletingBoardId);
      setDeletingBoardId(null);
    }
  };

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(boardsTotal / ITEMS_PER_PAGE) || 1;

  const deletingBoard = boards.find((b) => b.id === deletingBoardId);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your boards and projects
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Board
        </Button>
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search boards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={boardSortBy}
          onValueChange={(v) => setBoardSortBy(v as typeof boardSortBy)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lastUpdated">Last Updated</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading Skeleton */}
      {isLoadingBoards && boards.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <DashboardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoadingBoards && filteredBoards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <LayoutGrid className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No boards found' : 'No boards yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md">
            {searchQuery
              ? 'Try a different search term.'
              : 'Create your first board to start organizing tasks.'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create a board
            </Button>
          )}
        </div>
      )}

      {/* Board Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredBoards.map((board) => {
            const members = board.memberIds
              .map((id) => users.find((u) => u.id === id))
              .filter(Boolean) as any[];

            return (
              <motion.div
                key={board.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  onClick={() => setSelectedBoardId(board.id)}
                  className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden
                    cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                >
                  {/* Color Banner */}
                  <div
                    className="h-4 w-full"
                    style={{ backgroundColor: board.color }}
                  />

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Folder
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: board.color }}
                        />
                        <h3 className="font-semibold text-gray-900 truncate">
                          {board.title}
                        </h3>
                      </div>
                    </div>

                    {board.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                        {board.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {board.taskCount !== undefined && (
                          <span>{board.taskCount} tasks</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(board.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {members.length > 0 && (
                        <AvatarGroup users={members} max={3} size="sm" />
                      )}
                    </div>
                  </div>

                  {/* Delete on hover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingBoardId(board.id);
                    }}
                    className="absolute top-4 right-3 opacity-0 group-hover:opacity-100
                      text-xs text-gray-400 hover:text-red-600 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={boardsPage <= 1}
            onClick={() => fetchBoards(boardsPage - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {boardsPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={boardsPage >= totalPages}
            onClick={() => fetchBoards(boardsPage + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Create Board Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Board Name</Label>
              <Input
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="e.g. Project Alpha"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {BOARD_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewBoardColor(c.value)}
                    className={`w-8 h-8 rounded-lg transition-all ${newBoardColor === c.value
                      ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                      : 'hover:scale-105'
                      }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Members</Label>
              <ScrollArea className="h-[120px] rounded-md border p-2">
                <div className="space-y-2">
                  {users.filter(u => u.id !== currentUser?.id).map((user) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedMemberIds.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMemberIds([...selectedMemberIds, user.id]);
                          } else {
                            setSelectedMemberIds(selectedMemberIds.filter(id => id !== user.id));
                          }
                        }}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {user.name} ({user.email})
                      </Label>
                    </div>
                  ))}
                  {users.filter(u => u.id !== currentUser?.id).length === 0 && (
                    <p className="text-xs text-gray-500 text-center py-4">No other users found</p>
                  )}
                </div>
              </ScrollArea>
              <p className="text-[10px] text-muted-foreground mt-1">
                You will always be a member of boards you create.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateBoard}
              disabled={!newBoardTitle.trim() || isCreating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Board Confirmation */}
      <AlertDialog
        open={!!deletingBoardId}
        onOpenChange={() => setDeletingBoardId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{deletingBoard?.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this board and all its lists and tasks.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBoard}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Skeleton className="h-2 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Skeleton className="h-3 w-16" />
          <div className="flex -space-x-1">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
