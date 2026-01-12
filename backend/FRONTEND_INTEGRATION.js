// Frontend API Service for Lighth Dashboard
// Place this file in: src/services/api.js

const API_URL = 'http://localhost:5000/api';

/**
 * Get JWT token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('lighthToken');
};

/**
 * Set JWT token in localStorage
 */
const setToken = (token) => {
  localStorage.setItem('lighthToken', token);
};

/**
 * Clear JWT token from localStorage
 */
const clearToken = () => {
  localStorage.removeItem('lighthToken');
};

/**
 * Make API request with JWT token if available
 */
const request = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API Error');
  }

  return data;
};

// ============== Authentication Routes ==============

/**
 * Register a new user
 */
export const registerUser = async (email, username, password) => {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });

  if (data.token) {
    setToken(data.token);
  }

  return data;
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (data.token) {
    setToken(data.token);
  }

  return data;
};

/**
 * Logout user (client-side only)
 */
export const logoutUser = () => {
  clearToken();
};

// ============== Server Routes ==============

/**
 * Get all servers for logged-in user
 */
export const getServers = async () => {
  const data = await request('/servers', {
    method: 'GET',
  });

  return data.servers || [];
};

/**
 * Create a new server
 */
export const createServer = async (name, ipAddress, port, memory, diskSpace) => {
  const data = await request('/servers', {
    method: 'POST',
    body: JSON.stringify({
      name,
      ipAddress,
      port,
      memory,
      diskSpace,
    }),
  });

  return data.server;
};

/**
 * Get a specific server by ID
 */
export const getServerById = async (id) => {
  const data = await request(`/servers/${id}`, {
    method: 'GET',
  });

  return data.server;
};

/**
 * Update a server
 */
export const updateServer = async (id, updates) => {
  const data = await request(`/servers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

  return data.server;
};

/**
 * Delete a server
 */
export const deleteServer = async (id) => {
  await request(`/servers/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = () => {
  return !!getToken();
};
