const SIGNIN_URL = 'https://learn.reboot01.com/api/auth/signin';

export async function signIn(identifier, password) {
  const credentials = btoa(`${identifier}:${password}`);

  const response = await fetch(SIGNIN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => null);
    const message = text || 'Invalid credentials';
    throw new Error(message);
  }

  return await response.json();
}

export function getToken() {
  return localStorage.getItem('jwt_token');
}

export function setToken(token) {
  localStorage.setItem('jwt_token', token);
}

export function removeToken() {
  localStorage.removeItem('jwt_token');
}

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getUserIdFromToken() {
  const token = getToken();
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.userId;
  } catch {
    return null;
  }
}
