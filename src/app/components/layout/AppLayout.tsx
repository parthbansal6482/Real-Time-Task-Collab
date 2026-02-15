import { useStore } from '../../store/useStore';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { Dashboard } from '../dashboard/Dashboard';
import { BoardView } from '../board/BoardView';
import { TaskModal } from '../task/TaskModal';
import { ActivityPanel } from '../activity/ActivityPanel';
import { AnimatePresence, motion } from 'motion/react';

export function AppLayout() {
  const { currentView, selectedTaskId, isActivityPanelOpen } = useStore();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AppSidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />

        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {currentView === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <Dashboard />
              </motion.div>
            ) : (
              <motion.div
                key="board"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <BoardView />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activity Panel */}
          <ActivityPanel />
        </main>
      </div>

      {/* Task Modal */}
      {selectedTaskId && <TaskModal />}
    </div>
  );
}