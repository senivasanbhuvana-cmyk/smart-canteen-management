const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('smartbite_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const isGet = !config.method || config.method.toUpperCase() === 'GET';
  const maxRetries = options.retries !== undefined ? options.retries : (isGet ? 2 : 0);
  const retryDelay = options.retryDelay !== undefined ? options.retryDelay : 600;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }

        const errorMessage = data.error || data.message || `Request failed (${response.status})`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      lastError = err;
      const isNetworkError =
        err.name === 'TypeError' ||
        (err.message && (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')));

      if (isNetworkError && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }

      if (isNetworkError) {
        throw new Error('Unable to connect to canteen server. Please make sure backend is running.');
      }
      throw err;
    }
  }

  throw lastError;
}

export const authAPI = {
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  getMe: () => request('/auth/me'),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),
};

export const foodAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.is_veg !== undefined && params.is_veg !== null && params.is_veg !== 'all') query.append('is_veg', params.is_veg);
    if (params.available_only) query.append('available_only', '1');
    const qs = query.toString();
    return request(`/foods${qs ? `?${qs}` : ''}`);
  },

  getById: (id) => request(`/foods/${id}`),

  getCategories: () => request('/foods/categories'),

  create: (foodData) =>
    request('/foods', {
      method: 'POST',
      body: JSON.stringify(foodData),
    }),

  update: (id, foodData) =>
    request(`/foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(foodData),
    }),

  delete: (id) =>
    request(`/foods/${id}`, {
      method: 'DELETE',
    }),
};

export const orderAPI = {
  checkout: (orderPayload) =>
    request('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    }),

  getMyOrders: () => request('/orders/my-orders'),

  getById: (id) => request(`/orders/${id}`),

  cancel: (id) =>
    request(`/orders/${id}/cancel`, {
      method: 'POST',
    }),
};

export const adminAPI = {
  getStats: () => request('/admin/stats'),

  getAllOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.search) query.append('search', params.search);
    if (params.date) query.append('date', params.date);
    const qs = query.toString();
    return request(`/admin/orders${qs ? `?${qs}` : ''}`);
  },

  updateOrderStatus: (id, status) =>
    request(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};
