import { jwtDecode } from 'jwt-decode';

const API_URL = (process.env.REACT_APP_BACKEND_URL || '') + '/api';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  // Add /api prefix for uploads paths
  if (path.startsWith('/uploads')) {
    return `${BACKEND_URL}/api${path}`;
  }
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getCurrentUser = () => {
  const token = getAuthToken();
  if (!token) {
    return null;
  }
  try {
    const decoded = jwtDecode(token);
    
    // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      localStorage.removeItem('token');
      return null;
    }
    return decoded;
  } catch (e) {
    localStorage.removeItem('token');
    return null;
  }
};

export const isAuthenticated = () => {
  const user = getCurrentUser();
  return !!user;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

const fetchWithRetry = async (url, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        mode: 'cors',
        credentials: 'include',
      });
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetchWithRetry(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error('Сессия истекла');
  }

  return response;
};

export const api = {
  // Auth
  register: (data) => fetchWithRetry(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  login: (data) => fetchWithRetry(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  googleAuth: (token) => fetchWithRetry(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }),

  telegramAuth: (data) => fetchWithRetry(`${API_URL}/auth/telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  getTelegramBotUsername: () => fetchWithRetry(`${API_URL}/auth/telegram/bot-username`),

  checkUsername: (username) => fetchWithRetry(`${API_URL}/auth/check-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  }),

  changePassword: (data) => fetchWithAuth(`${API_URL}/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),


  forgotPassword: (data) => fetchWithRetry(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  resetPasswordConfirm: (data) => fetchWithRetry(`${API_URL}/auth/reset-password-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  resolveUrl: (url) => fetchWithRetry(`${API_URL}/tools/resolve-url?url=${encodeURIComponent(url)}`),

  getMe: () => fetchWithAuth(`${API_URL}/auth/me`),
  updateUser: (data) => fetchWithAuth(`${API_URL}/auth/me`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteAccount: () => fetchWithAuth(`${API_URL}/auth/me`, {
    method: 'DELETE',
  }),

  // Analytics
  trackEvent: (data) => {
    if (!data.username) return Promise.resolve({ ok: true }); // Prevent 422
    return fetchWithRetry(`${API_URL}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  getPageAnalytics: (username) => fetchWithAuth(`${API_URL}/pages/${username}/stats`),

  // Pages
  getPages: () => fetchWithAuth(`${API_URL}/pages`),

  createPage: (data) => fetchWithAuth(`${API_URL}/pages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getPageByUsername: (username) => fetchWithRetry(`${API_URL}/pages/${username}`),

  updatePage: (pageId, data) => fetchWithAuth(`${API_URL}/pages/${pageId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  updateUsername: (pageId, username) => fetchWithAuth(`${API_URL}/pages/${pageId}/update-username`, {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  }),

  deletePage: (pageId) => fetchWithAuth(`${API_URL}/pages/${pageId}`, {
    method: 'DELETE',
  }),

  // Blocks
  createBlock: (data) => fetchWithAuth(`${API_URL}/blocks`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateBlock: (blockId, data) => fetchWithAuth(`${API_URL}/blocks/${blockId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  deleteBlock: (blockId) => fetchWithAuth(`${API_URL}/blocks/${blockId}`, {
    method: 'DELETE',
  }),

  reorderBlocks: (blockIds) => fetchWithAuth(`${API_URL}/blocks/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ block_ids: blockIds }),
  }),

  // Leads
  submitLead: (data) => fetchWithRetry(`${API_URL}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  deleteLead: (leadId) => fetchWithAuth(`${API_URL}/submissions/${leadId}`, {
    method: 'DELETE',
  }),

  updateLeadStatus: (leadId, status) => fetchWithAuth(`${API_URL}/submissions/${leadId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Events
  createEvent: (data) => fetchWithAuth(`${API_URL}/events`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateEvent: (eventId, data) => fetchWithAuth(`${API_URL}/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  deleteEvent: (eventId) => fetchWithAuth(`${API_URL}/events/${eventId}`, {
    method: 'DELETE',
  }),

  // Showcases
  createShowcase: (data) => fetchWithAuth(`${API_URL}/showcases`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateShowcase: (showcaseId, data) => fetchWithAuth(`${API_URL}/showcases/${showcaseId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  deleteShowcase: (showcaseId) => fetchWithAuth(`${API_URL}/showcases/${showcaseId}`, {
    method: 'DELETE',
  }),

  // Music
  resolveMusic: (data) => fetchWithRetry(`${API_URL}/music/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }),

  // Upload
  uploadImage: async (file, category = 'others') => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/upload?category=${category}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (response.status === 401) {
      logout();
      throw new Error('Сессия истекла');
    }

    return response;
  },

  // Verification
  verifyRequest: (data) => fetchWithAuth(`${API_URL}/verification/request`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getVerificationRequests: (options) => fetchWithAuth(`${API_URL}/admin/verification/requests`, options),
  approveVerification: (id, options) => fetchWithAuth(`${API_URL}/admin/verification/${id}/approve`, {
    method: 'POST',
    ...options,
  }),
  rejectVerification: (id, reason, options) => fetchWithAuth(`${API_URL}/admin/verification/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    ...options,
  }),
  cancelVerification: (id, reason, options) => fetchWithAuth(`${API_URL}/admin/verification/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
    ...options,
  }),
  resumeVerification: (id, options) => fetchWithAuth(`${API_URL}/admin/verification/${id}/resume`, {
    method: 'POST',
    ...options,
  }),
  deleteVerification: (id, options) => fetchWithAuth(`${API_URL}/admin/verification/${id}`, {
    method: 'DELETE',
    ...options,
  }),
  grantDirectVerification: (userId, options) => fetchWithAuth(`${API_URL}/admin/users/${userId}/verify`, {
    method: 'POST',
    ...options,
  }),
  sendAdminNotification: (data, options) => fetchWithAuth(`${API_URL}/admin/notifications/send`, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  }),

  // Reserved Usernames
  getReservedUsernames: () => fetchWithAuth(`${API_URL}/admin/reserved-usernames`),
  addReservedUsername: (data) => fetchWithAuth(`${API_URL}/admin/reserved-usernames`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteReservedUsername: (username) => fetchWithAuth(`${API_URL}/admin/reserved-usernames/${username}`, {
    method: 'DELETE',
  }),

  // Notifications
  getNotifications: () => fetchWithAuth(`${API_URL}/notifications`),
  markNotificationRead: (id) => fetchWithAuth(`${API_URL}/notifications/${id}/read`, {
    method: 'POST',
  }),
  clearNotifications: () => fetchWithAuth(`${API_URL}/notifications`, {
    method: 'DELETE',
  }),

  // Admin
  getAdminStats: (options) => fetchWithAuth(`${API_URL}/admin/stats`, options),
  getAdminUsers: (options) => fetchWithAuth(`${API_URL}/admin/users`, options),
  getAdminCampaigns: (options) => fetchWithAuth(`${API_URL}/admin/campaigns`, options),
  getAdminCampaignDetails: (id, options) => fetchWithAuth(`${API_URL}/admin/campaigns/${id}`, options),
  deleteUser: (userId, options) => fetchWithAuth(`${API_URL}/admin/user/${userId}`, {
    method: 'DELETE',
    ...options,
  }),
  makeAdmin: (userId, options) => fetchWithAuth(`${API_URL}/admin/user/${userId}/make-admin`, {
    method: 'POST',
    ...options,
  }),
  getAdminSettings: (options) => fetchWithAuth(`${API_URL}/admin/settings`, options),
  updateAdminSettings: (data, options) => fetchWithAuth(`${API_URL}/admin/settings`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  }),
  getPublicSettings: () => fetchWithRetry(`${API_URL}/settings/public`),

  // Telegram
  getTelegramLink: () => fetchWithAuth(`${API_URL}/telegram/link`),
  disconnectTelegram: () => fetchWithAuth(`${API_URL}/telegram/link`, {
    method: 'DELETE'
  }),

  // Support Bot
  getAdminSupport: (options) => fetchWithAuth(`${API_URL}/admin/support`, options),
  createAdminSupport: (data, options) => fetchWithAuth(`${API_URL}/admin/support`, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options
  }),
  updateAdminSupport: (id, data, options) => fetchWithAuth(`${API_URL}/admin/support/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options
  }),
  deleteAdminSupport: (id, options) => fetchWithAuth(`${API_URL}/admin/support/${id}`, {
    method: 'DELETE',
    ...options
  }),

  };