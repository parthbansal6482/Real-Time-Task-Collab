import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Search, FileText, Folder } from 'lucide-react';
import { Badge } from '../ui/badge';

export function GlobalSearch() {
  const { tasks, boards, setSelectedBoardId, setSelectedTaskId } = useStore();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTasks, setFilteredTasks] = useState<typeof tasks>([]);
  const [filteredBoards, setFilteredBoards] = useState<typeof boards>([]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setFilteredTasks([]);
      setFilteredBoards([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    const matchedTasks = tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(query))
    );

    const matchedBoards = boards.filter((board) =>
      board.title.toLowerCase().includes(query)
    );

    setFilteredTasks(matchedTasks.slice(0, 5));
    setFilteredBoards(matchedBoards.slice(0, 5));
  }, [searchQuery, tasks, boards]);

  const handleSelectTask = (taskId: string, boardId: string) => {
    setSelectedBoardId(boardId);
    setSelectedTaskId(taskId);
    setOpen(false);
    setSearchQuery('');
  };

  const handleSelectBoard = (boardId: string) => {
    setSelectedBoardId(boardId);
    setOpen(false);
    setSearchQuery('');
  };

  const hasResults = filteredTasks.length > 0 || filteredBoards.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-start text-sm font-normal"
        >
          <Search className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-gray-500">Search tasks and boards...</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {searchQuery.length >= 2 && !hasResults && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}

            {filteredBoards.length > 0 && (
              <CommandGroup heading="Boards">
                {filteredBoards.map((board) => (
                  <CommandItem
                    key={board.id}
                    onSelect={() => handleSelectBoard(board.id)}
                    className="cursor-pointer"
                  >
                    <Folder className="w-4 h-4 mr-2" style={{ color: board.color }} />
                    <span>{board.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredTasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {filteredTasks.map((task) => {
                  const board = boards.find((b) => b.id === task.boardId);
                  return (
                    <CommandItem
                      key={task.id}
                      onSelect={() => handleSelectTask(task.id, task.boardId)}
                      className="cursor-pointer"
                    >
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{task.title}</span>
                          {task.priority && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                task.priority === 'high'
                                  ? 'border-red-300 text-red-700'
                                  : task.priority === 'medium'
                                  ? 'border-yellow-300 text-yellow-700'
                                  : 'border-blue-300 text-blue-700'
                              }`}
                            >
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                        {board && (
                          <span className="text-xs text-gray-500">{board.title}</span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
