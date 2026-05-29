const API_BASE = 'http://localhost:3001/api';

async function request(url, options = {}) {
    const token = localStorage.getItem('dear_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
    };
    
    console.log(`📡 请求: ${options.method || 'GET'} ${url}`);
    
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    const data = await res.json();
    
    console.log(`📡 响应: ${res.status}`, data);
    
    if (!res.ok) {
        throw new Error(data.error || '请求失败');
    }
    return data;
}

export const authAPI = {
    register: (nickname, phone, email, password) => request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ nickname, phone, email, password })
    }),
    login: (phone, password) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password })
    }),
    me: () => request('/auth/me')
};

export const projectAPI = {
    create: (data, projectType) => request('/projects', {
        method: 'POST',
        body: JSON.stringify({ ...data, projectType })
    }),
    confirmDownload: (id) => request(`/projects/${id}/confirm-download`, { method: 'POST' }),
    update: (id, data) => request(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    get: (id) => request(`/projects/${id}`),
    list: () => request('/projects'),
    render: (id) => request(`/projects/${id}/render`, { method: 'POST' }),
	updateStatus: (id, status) => request(`/projects/${id}/status`, {
		method: 'PUT',
		body: JSON.stringify({ status })
	}),
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
    applySuggestions: (projectId) => request('/ai/apply-suggestions', {
        method: 'POST',
        body: JSON.stringify({ projectId })
    }),
    generateColors: (description, mood) => request('/ai/generate-colors', {
        method: 'POST',
        body: JSON.stringify({ description, mood })
    }),
    getConversation: (projectId) => request(`/ai/conversation/${projectId}`)
};

export const exportAPI = {
    downloadSource: (projectId) => `${API_BASE}/export/source/${projectId}`,
    downloadHTML: (projectId) => `${API_BASE}/export/html/${projectId}`,
    preview: (projectId) => `${API_BASE}/export/preview/${projectId}`
};