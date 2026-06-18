import { api } from './api.js';

export async function login(email, password, rememberMe = false) {
  try {
    const data = await api.post('/auth/login', { email, password });
    if (data && data.token) {
      localStorage.setItem('apx_token', data.token);
      localStorage.setItem('apx_user', JSON.stringify(data.user));
      
      // If remember me is set, we can store a preference
      if (rememberMe) {
        localStorage.setItem('apx_remember_email', email);
      } else {
        localStorage.removeItem('apx_remember_email');
      }
      
      return data.user;
    }
  } catch (error) {
    throw error;
  }
}

export async function signup(fields) {
  try {
    const data = await api.post('/auth/signup', fields);
    if (data && data.token) {
      localStorage.setItem('apx_token', data.token);
      localStorage.setItem('apx_user', JSON.stringify(data.user));
      return data.user;
    }
  } catch (error) {
    throw error;
  }
}

export function logout() {
  localStorage.removeItem('apx_token');
  localStorage.removeItem('apx_user');
  window.location.href = '/login.html';
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('apx_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('apx_token');
}

/**
 * Page route protection helper.
 * Redirects to login if not authenticated.
 */
export function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return false;
  }
  return true;
}

/**
 * Protects pages based on role (e.g. SELLER or ADMIN)
 * @param {string[]} allowedRoles 
 */
export function requireRole(...allowedRoles) {
  if (!requireAuth()) return false;
  const user = getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    window.location.href = '/index.html'; // bounce to home
    return false;
  }
  return true;
}
