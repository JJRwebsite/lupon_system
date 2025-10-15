// JWT Authentication utilities for frontend

export interface User {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

// Store JWT token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('jwt_token', token);
};

// Get JWT token from localStorage
export const getToken = (): string | null => {
  const token = localStorage.getItem('jwt_token');
  return token;
};

// Remove JWT token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('jwt_token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Basic token expiry check (decode JWT payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Error checking token:', error);
    return false;
  }
};

// Internal helper: validate a JWT token string
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return typeof payload.exp === 'number' && payload.exp > currentTime;
  } catch {
    return false;
  }
};

// Get user info from JWT token
export const getUserFromToken = (): User | null => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      first_name: payload.first_name,
      last_name: payload.last_name,
      middle_name: payload.middle_name
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Try to refresh JWT using existing cookie-based session
const refreshJwtFromCookie = async (): Promise<string | null> => {
  try {
    const resp = await fetch('http://localhost:5000/api/generate-jwt', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data?.success && data?.token) {
      setToken(data.token);
      return data.token as string;
    }
    return null;
  } catch {
    return null;
  }
};

// Make authenticated API request with JWT token
export const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let token = getToken();
  let tokenValid = isTokenValid(token);
  // If no valid token, try to mint one from cookie first
  if (!tokenValid) {
    const refreshed = await refreshJwtFromCookie();
    if (refreshed) {
      token = refreshed;
      tokenValid = true;
    }
  }

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const withAuthHeaders = tokenValid
    ? { ...baseHeaders, Authorization: `Bearer ${token}` }
    : { ...baseHeaders };

  const doFetch = (headers: Record<string, string>) =>
    fetch(url, {
      ...options,
      headers,
      credentials: 'include', // include cookies for server-side auth
    });

  // First attempt prefers Authorization when token is valid
  let response = await doFetch(withAuthHeaders);

  // If unauthorized, try the alternative auth path once
  if (response.status === 401) {
    try {
      // Remove stale token if invalid to avoid poisoning subsequent calls
      if (!tokenValid && token) removeToken();

      const usedAuth = 'Authorization' in withAuthHeaders;
      const altHeaders = usedAuth
        ? { ...baseHeaders } // retry without Authorization (cookie-only)
        : (tokenValid ? { ...baseHeaders, Authorization: `Bearer ${token}` } : { ...baseHeaders }); // retry with Authorization if possible

      // Always perform one alternate retry if it differs from the first
      const differs = ('Authorization' in withAuthHeaders) !== ('Authorization' in altHeaders);
      if (differs) {
        const retry = await doFetch(altHeaders);
        if (retry.ok || retry.status !== 401) {
          response = retry;
        }
      }
      // If still unauthorized, try to mint a fresh JWT from cookie and retry once
      if (response.status === 401) {
        const refreshed = await refreshJwtFromCookie();
        if (refreshed) {
          const retryWithNewAuth = await doFetch({ ...baseHeaders, Authorization: `Bearer ${refreshed}` });
          if (retryWithNewAuth.ok) {
            response = retryWithNewAuth;
          }
        }
      }
    } catch (e) {
      // swallow retry errors; original 401 will be handled below
    }
  }

  if (!response.ok) {
    console.error(`❌ Request failed: ${response.status} ${response.statusText}`, {
      url,
      method: options.method || 'GET',
      hasToken: !!token
    });
  }

  return response;
};

// Login function
export const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      setToken(data.token);
      return { success: true, user: data.user };
    } else {
      return { success: false, message: data.message || 'Login failed' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Network error occurred' };
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  try {
    await makeAuthenticatedRequest('http://localhost:5000/api/logout', {
      method: 'POST',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeToken();
    window.location.href = '/login';
  }
};

// Get current user from server
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await makeAuthenticatedRequest('http://localhost:5000/api/current-user');
    
    if (response.ok) {
      const data = await response.json();
      return data.success ? data.user : null;
    } else {
      // Token might be expired or invalid
      removeToken();
      return null;
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};
