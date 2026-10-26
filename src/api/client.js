const SESSION_KEY = 'projectsprint.session';

export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

function browserStorage(kind) {
  try { return globalThis[kind]; } catch { return undefined; }
}

function readSession(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(SESSION_KEY) || 'null');
    if (typeof saved?.accessToken !== 'string' || !saved.accessToken) return null;
    return { accessToken: saved.accessToken, refreshToken: typeof saved.refreshToken === 'string' ? saved.refreshToken : undefined };
  } catch { return null; }
}

function expiresAt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const expiration = JSON.parse(atob(payload)).exp;
    return typeof expiration === 'number' ? expiration * 1000 : Infinity;
  } catch {
    // The server remains responsible for checking the token signature and format.
    return Infinity;
  }
}

export function createApiClient({
  baseUrl = import.meta.env?.VITE_API_BASE_URL || '/api',
  fetchImpl = (...args) => fetch(...args),
  persistentStorage = browserStorage('localStorage'),
  temporaryStorage = browserStorage('sessionStorage'),
  now = Date.now,
} = {}) {
  const subscribers = new Set();
  const temporary = readSession(temporaryStorage);
  let session = temporary || readSession(persistentStorage);
  let remember = Boolean(session && !temporary);
  let generation = 0;
  let refreshPromise = null;
  const base = baseUrl.replace(/\/+$/, '');

  function storeSession() {
    for (const storage of [persistentStorage, temporaryStorage]) {
      try { storage?.removeItem(SESSION_KEY); } catch { /* Storage may be disabled. */ }
    }
    if (session) {
      const { accessToken, refreshToken } = session;
      try {
        (remember ? persistentStorage : temporaryStorage)?.setItem(SESSION_KEY, JSON.stringify({ accessToken, refreshToken }));
      } catch { /* An in-memory session still works when storage is unavailable. */ }
    }
    subscribers.forEach((notify) => notify());
  }

  function clearSession() {
    generation += 1;
    session = null;
    storeSession();
  }

  function sessionExpired() {
    clearSession();
    return new ApiError('Сессия истекла. Войдите снова.', 401);
  }

  async function send(path, { method = 'GET', body, token } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response;
    try {
      response = await fetchImpl(`${base}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
    } catch {
      throw new ApiError('Не удалось связаться с сервером. Попробуйте ещё раз.');
    } finally { clearTimeout(timeout); }
    if (response.status === 204) return null;
    let data;
    try { data = await response.json(); } catch {
      throw new ApiError('Не удалось прочитать ответ сервера. Попробуйте ещё раз.', response.status);
    }
    if (!response.ok) {
      throw new ApiError(typeof data.error === 'string' ? data.error : 'Не удалось выполнить запрос.', response.status, data.fields || {});
    }
    return data;
  }

  async function refresh() {
    if (refreshPromise) return refreshPromise;
    if (!session?.refreshToken) throw sessionExpired();
    const currentGeneration = generation;
    const refreshToken = session.refreshToken;
    refreshPromise = (async () => {
      try {
        const result = await send('/auth/refresh', { method: 'POST', token: refreshToken });
        if (currentGeneration !== generation) throw new ApiError('Сессия завершена. Войдите снова.', 401);
        if (typeof result.accessToken !== 'string') throw new ApiError('Не удалось обновить сессию.');
        session = { ...session, accessToken: result.accessToken };
        storeSession();
      } catch (error) {
        if (currentGeneration === generation && [401, 422].includes(error.status)) throw sessionExpired();
        throw error;
      } finally { refreshPromise = null; }
    })();
    return refreshPromise;
  }

  async function request(path, options = {}) {
    if (!session) throw new ApiError('Войдите в учётную запись.', 401);
    const expiry = expiresAt(session.accessToken);
    if (expiry <= now() || (session.refreshToken && expiry <= now() + 30000)) await refresh();
    const sentToken = session?.accessToken;
    const currentGeneration = generation;
    try {
      return await send(path, { ...options, token: sentToken });
    } catch (error) {
      if (error.status !== 401 || currentGeneration !== generation) throw error;
      // Concurrent requests share one refresh; a late 401 can reuse the new token.
      if (session?.accessToken === sentToken) await refresh();
      if (!session) throw error;
      const retryToken = session.accessToken;
      try { return await send(path, { ...options, token: retryToken }); } catch (retryError) {
        if (retryError.status === 401 && currentGeneration === generation && session?.accessToken === retryToken) throw sessionExpired();
        throw retryError;
      }
    }
  }

  async function authenticate(path, body, persist) {
    const result = await send(path, { method: 'POST', body });
    if (typeof result.accessToken !== 'string') throw new ApiError('Сервер не вернул данные для входа.');
    generation += 1;
    remember = persist;
    session = { accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user };
    storeSession();
    return result.user;
  }

  return {
    subscribe: (notify) => { subscribers.add(notify); return () => subscribers.delete(notify); },
    getSession: () => session,
    request,
    login: ({ login, password, remember = false }) => authenticate('/auth/login', { login, password, remember }, remember),
    register: ({ remember = false, ...fields }) => authenticate('/auth/register', fields, remember),
    restore: (login) => send('/auth/restore', { method: 'POST', body: { login } }),
    logout: async () => {
      if (!session) return;
      const refreshToken = session.refreshToken;
      try { await request('/auth/logout', { method: 'POST', body: { refreshToken } }); } finally { clearSession(); }
    },
  };
}

export const api = createApiClient();
