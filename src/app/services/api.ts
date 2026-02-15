// API Service — HTTP client for backend communication
// Uses fetch with auth token management and error handling

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ── Token Management ──────────────────────────────────────────────────

export function getToken(): string | null {
    return localStorage.getItem('auth_token');
}

export function setToken(token: string | null) {
    if (token) {
        localStorage.setItem('auth_token', token);
    } else {
        localStorage.removeItem('auth_token');
    }
}

// ── HTTP Helpers ──────────────────────────────────────────────────────

interface ApiError {
    message: string;
    status: number;
}

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;
        try {
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {
            // Response may not have JSON body
        }
        const error: ApiError = { message: errorMessage, status: response.status };
        throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

function get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'GET' });
}

function post<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
}

function put<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
    });
}

function del<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
}

// ── Auth API ──────────────────────────────────────────────────────────

export const authApi = {
    signup: (data: { email: string; password: string; username: string }) =>
        post<{ token: string; user: any }>('/auth/signup', data),

    login: (data: { email: string; password: string }) =>
        post<{ token: string; user: any }>('/auth/login', data),

    logout: () => post<void>('/auth/logout'),

    me: () => get<{ user: any }>('/auth/me'),

    getUsers: () => get<{ users: any[] }>('/auth/users'),
};

// ── Boards API ────────────────────────────────────────────────────────

export const boardsApi = {
    list: (page = 1, limit = 20) =>
        get<{ boards: any[]; total: number; page: number }>(
            `/boards?page=${page}&limit=${limit}`
        ),

    create: (data: { name: string; description?: string; color?: string; memberIds?: string[] }) =>
        post<any>('/boards', data),

    get: (id: string) => get<any>(`/boards/${id}`),

    update: (id: string, data: { name?: string; description?: string }) =>
        put<any>(`/boards/${id}`, data),

    delete: (id: string) => del<void>(`/boards/${id}`),

    addMember: (boardId: string, userId: string) =>
        post<any>(`/boards/${boardId}/members`, { userId }),

    removeMember: (boardId: string, userId: string) =>
        del<void>(`/boards/${boardId}/members/${userId}`),

    search: (query: string) =>
        get<{ boards: any[] }>(`/boards/search?q=${encodeURIComponent(query)}`),
};

// ── Lists API ─────────────────────────────────────────────────────────

export const listsApi = {
    getByBoard: (boardId: string) =>
        get<any[]>(`/boards/${boardId}/lists`),

    create: (boardId: string, data: { name: string; position: number }) =>
        post<any>(`/boards/${boardId}/lists`, data),

    update: (id: string, data: { name?: string; position?: number }) =>
        put<any>(`/lists/${id}`, data),

    delete: (id: string) => del<void>(`/lists/${id}`),
};

// ── Tasks API ─────────────────────────────────────────────────────────

export const tasksApi = {
    getByList: (listId: string, page = 1, limit = 50) =>
        get<{ tasks: any[]; total: number }>(
            `/lists/${listId}/tasks?page=${page}&limit=${limit}`
        ),

    get: (id: string) => get<any>(`/tasks/${id}`),

    create: (
        listId: string,
        data: {
            title: string;
            description?: string;
            position: number;
            cid?: string;
            priority?: string;
            dueDate?: string;
        }
    ) => post<any>(`/lists/${listId}/tasks`, data),

    update: (
        id: string,
        data: {
            title?: string;
            description?: string;
            listId?: string;
            position?: number;
        }
    ) => put<any>(`/tasks/${id}`, data),

    delete: (id: string) => del<void>(`/tasks/${id}`),

    assign: (taskId: string, userId: string) =>
        post<any>(`/tasks/${taskId}/assign`, { userId }),

    unassign: (taskId: string, userId: string) =>
        del<void>(`/tasks/${taskId}/assign/${userId}`),
};

// ── Activities API ────────────────────────────────────────────────────

export const activitiesApi = {
    getByBoard: (boardId: string, page = 1, limit = 50) =>
        get<{ activities: any[]; total: number }>(
            `/boards/${boardId}/activities?page=${page}&limit=${limit}`
        ),
};

// ── Search API ────────────────────────────────────────────────────────

export const searchApi = {
    boardContent: (boardId: string, query: string) =>
        get<any>(`/boards/${boardId}/search?q=${encodeURIComponent(query)}`),

    global: (query: string) =>
        get<any>(`/boards/search?q=${encodeURIComponent(query)}`),
};
