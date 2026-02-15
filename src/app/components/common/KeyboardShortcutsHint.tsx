import { Command, Keyboard } from 'lucide-react';

export function KeyboardShortcutsHint() {
  return (
    <div className="fixed bottom-4 right-4 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-4 max-w-xs hidden xl:block">
      <div className="flex items-center gap-2 mb-3">
        <Keyboard className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h3>
      </div>
      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>Close modals</span>
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
            Esc
          </kbd>
        </div>
        <div className="flex items-center justify-between">
          <span>Toggle activity</span>
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
              <Command className="w-3 h-3 inline" />
            </kbd>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
              ⇧
            </kbd>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
              A
            </kbd>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span>Search</span>
          <div className="flex gap-1">
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
              <Command className="w-3 h-3 inline" />
            </kbd>
            <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
              K
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
