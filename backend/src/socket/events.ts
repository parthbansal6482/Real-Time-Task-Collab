/**
 * Socket.io event name constants — used by both server handlers and controllers.
 * Keeping event names centralised prevents typos and makes refactoring easier.
 */
export const SOCKET_EVENTS = {
    // Connection
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',

    // Room management
    JOIN_BOARD: 'join:board',
    LEAVE_BOARD: 'leave:board',

    // Task events
    TASK_CREATED: 'task:created',
    TASK_UPDATED: 'task:updated',
    TASK_DELETED: 'task:deleted',
    TASK_MOVED: 'task:moved',
    TASK_ASSIGNED: 'task:assigned',
    TASK_UNASSIGNED: 'task:unassigned',

    // List events
    LIST_CREATED: 'list:created',
    LIST_UPDATED: 'list:updated',
    LIST_DELETED: 'list:deleted',

    // Board events
    BOARD_UPDATED: 'board:updated',
    BOARD_DELETED: 'board:deleted',

    // Member events
    MEMBER_ADDED: 'member:added',
    MEMBER_REMOVED: 'member:removed',

    // Presence events
    USER_JOINED: 'user:joined',
    USER_LEFT: 'user:left',

    // Activity
    ACTIVITY_NEW: 'activity:new',

    // User editing indicator
    USER_EDITING: 'user:editing',
    USER_STOPPED_EDITING: 'user:stopped_editing',
} as const;
