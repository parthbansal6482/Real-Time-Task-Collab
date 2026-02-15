import { useStore } from '../../store/useStore';
import { X, Activity as ActivityIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';

export function ActivityPanel() {
  const { activities, users, isActivityPanelOpen, toggleActivityPanel } = useStore();

  return (
    <AnimatePresence>
      {isActivityPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleActivityPanel}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
              </div>
              <button
                onClick={toggleActivityPanel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Activity List */}
            <div className="flex-1 overflow-y-auto p-6">
              {activities.length > 0 ? (
                <div className="space-y-6">
                  {activities.map((activity) => {
                    const user = users.find((u) => u.id === activity.userId);
                    const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    });

                    return (
                      <div key={activity.id} className="flex gap-3 group">
                        {/* Avatar */}
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                            {user?.avatar}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-sm text-gray-900">
                              <span className="font-medium">{user?.name}</span>{' '}
                              <span className="text-gray-600">{activity.message}</span>
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1.5">{timeAgo}</p>
                        </div>

                        {/* Activity Type Badge */}
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {activity.type === 'task_created' && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                          {activity.type === 'task_moved' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          {activity.type === 'task_updated' && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          )}
                          {activity.type === 'task_assigned' && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ActivityIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">No activity yet</h3>
                  <p className="text-sm text-gray-500">
                    Activity from your team will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Real-time updates active</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
