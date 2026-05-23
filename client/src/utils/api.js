const API_BASE = 'http://localhost:3001/api';

async function request(url, options = {}) {
    const token = localStorage.getItem('dear_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
    };
    
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
}

export const authAPI = {
    register: (email, password) => request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    login: (email, password) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    me: () => request('/auth/me')
};

export const projectAPI = {
    create: (data) => request('/projects', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    get: (id) => request(`/projects/${id}`),
    list: () => request('/projects'),
    render: (id) => request(`/projects/${id}/render`, { method: 'POST' }),
    delete: (id) => request(`/projects/${id}`, { method: 'DELETE' })
};

export const aiAPI = {
    generateContent: (ownerName, relationship, theme) => request('/ai/generate-content', {
        method: 'POST',
        body: JSON.stringify({ ownerName, relationship, theme })
    }),
    chat: (projectId, message) => request('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ projectId, message })
    }),
    generateColors: (description, mood) => request('/ai/generate-colors', {
        method: 'POST',
        body: JSON.stringify({ description, mood })
    })
};

export const exportAPI = {
    downloadSource: (projectId) => `${API_BASE}/export/source/${projectId}`,
    downloadHTML: (projectId) => `${API_BASE}/export/html/${projectId}`
};