import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './client';

const key = 'projectsprint.session';
function storage() {
  const values = new Map();
  return { getItem: (name) => values.get(name) ?? null, setItem: (name, value) => values.set(name, value), removeItem: (name) => values.delete(name) };
}
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const jwt = (expires) => `header.${btoa(JSON.stringify({ exp: expires }))}.signature`;
function setup(fetchImpl, saved) {
  const persistentStorage = storage();
  const temporaryStorage = storage();
  if (saved) persistentStorage.setItem(key, JSON.stringify(saved));
  const options = { fetchImpl, persistentStorage, temporaryStorage, now: () => 100000 };
  return { client: createApiClient(options), persistentStorage, temporaryStorage, options };
}

describe('API session', () => {
  it('sends login credentials and persists only tokens in the chosen storage', async () => {
    const fetchImpl = vi.fn(async () => response({ accessToken: jwt(1000), refreshToken: 'refresh', user: { name: 'Иван' } }));
    const { client, persistentStorage, temporaryStorage, options } = setup(fetchImpl);
    await client.login({ login: 'ivan', password: 'secret', remember: true });
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/auth/login');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ login: 'ivan', password: 'secret', remember: true });
    expect(JSON.parse(persistentStorage.getItem(key))).toEqual({ accessToken: jwt(1000), refreshToken: 'refresh' });
    expect(temporaryStorage.getItem(key)).toBeNull();
    expect(createApiClient(options).getSession().accessToken).toBe(jwt(1000));
    await client.login({ login: 'ivan', password: 'secret', remember: false });
    expect(persistentStorage.getItem(key)).toBeNull();
    expect(temporaryStorage.getItem(key)).toContain(jwt(1000));
  });

  it('shares one refresh across concurrent expired requests and sends the fresh bearer', async () => {
    const fetchImpl = vi.fn(async (url, options) => {
      if (url.endsWith('/auth/refresh')) {
        expect(options.headers.Authorization).toBe('Bearer refresh');
        return response({ accessToken: jwt(2000) });
      }
      expect(options.headers.Authorization).toBe(`Bearer ${jwt(2000)}`);
      return response({ id: 1 });
    });
    const { client } = setup(fetchImpl, { accessToken: jwt(99), refreshToken: 'refresh' });
    const results = await Promise.all([client.request('/me'), client.request('/projects')]);
    expect(results).toEqual([{ id: 1 }, { id: 1 }]);
    expect(fetchImpl.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
  });

  it('retries a protected 401 once after refresh', async () => {
    const fetchImpl = vi.fn(async (url, options) => {
      if (url.endsWith('/auth/refresh')) return response({ accessToken: jwt(2000) });
      return options.headers.Authorization === `Bearer ${jwt(1000)}`
        ? response({ error: 'Expired' }, 401) : response({ login: 'ivan' });
    });
    const { client } = setup(fetchImpl, { accessToken: jwt(1000), refreshToken: 'refresh' });
    await expect(client.request('/me')).resolves.toEqual({ login: 'ivan' });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('clears a rejected refresh and an expired session without a refresh token', async () => {
    const fetchImpl = vi.fn(async () => response({ error: 'Expired' }, 401));
    const { client, persistentStorage } = setup(fetchImpl, { accessToken: jwt(99), refreshToken: 'refresh' });
    await expect(client.request('/me')).rejects.toMatchObject({ status: 401 });
    expect(client.getSession()).toBeNull();
    expect(persistentStorage.getItem(key)).toBeNull();
    const noRefresh = setup(fetchImpl, { accessToken: jwt(99) }).client;
    await expect(noRefresh.request('/me')).rejects.toMatchObject({ status: 401 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('preserves the session on a temporary refresh outage', async () => {
    const { client } = setup(async () => response({ error: 'Недоступно' }, 503), { accessToken: jwt(99), refreshToken: 'refresh' });
    await expect(client.request('/me')).rejects.toMatchObject({ status: 503 });
    expect(client.getSession()).not.toBeNull();
  });

  it('ignores malformed storage and supports an in-memory session when storage is blocked', async () => {
    const malformed = storage();
    malformed.setItem(key, '{broken');
    expect(createApiClient({ persistentStorage: malformed, temporaryStorage: storage() }).getSession()).toBeNull();
    const blocked = {
      getItem: () => { throw new DOMException('Blocked', 'SecurityError'); },
      setItem: () => { throw new DOMException('Blocked', 'SecurityError'); },
      removeItem: () => { throw new DOMException('Blocked', 'SecurityError'); },
    };
    const fetchImpl = vi.fn(async (url, options) => {
      if (url.endsWith('/auth/login')) return response({ accessToken: jwt(1000), user: { login: 'ivan' } });
      expect(options.headers.Authorization).toBe(`Bearer ${jwt(1000)}`);
      return response({ login: 'ivan' });
    });
    const client = createApiClient({ fetchImpl, persistentStorage: blocked, temporaryStorage: blocked, now: () => 100000 });
    await client.login({ login: 'ivan', password: 'secret', remember: true });
    await expect(client.request('/me')).resolves.toEqual({ login: 'ivan' });
    expect(client.getSession()?.user?.login).toBe('ivan');
    await client.logout();
    expect(client.getSession()).toBeNull();
  });

  it('aborts a stalled request after the timeout and returns a readable connection error', async () => {
    vi.useFakeTimers();
    try {
      let signal;
      const fetchImpl = vi.fn((_url, options) => new Promise((_resolve, reject) => {
        signal = options.signal;
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }));
      const { client } = setup(fetchImpl);
      const rejected = expect(client.restore('ivan')).rejects.toMatchObject({
        name: 'ApiError', status: 0, message: 'Не удалось связаться с сервером. Попробуйте ещё раз.',
      });
      await vi.advanceTimersByTimeAsync(14999);
      expect(signal.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await rejected;
      expect(signal.aborted).toBe(true);
    } finally { vi.useRealTimers(); }
  });

  it('reuses the token already refreshed by another request when a delayed 401 arrives', async () => {
    let releaseDelayed401;
    const fetchImpl = vi.fn(async (url, options) => {
      if (url.endsWith('/auth/refresh')) return response({ accessToken: jwt(2000) });
      const oldToken = options.headers.Authorization === `Bearer ${jwt(1000)}`;
      if (url.endsWith('/projects') && oldToken) return new Promise((resolve) => { releaseDelayed401 = resolve; });
      if (oldToken) return response({ error: 'Expired' }, 401);
      expect(options.headers.Authorization).toBe(`Bearer ${jwt(2000)}`);
      return response(url.endsWith('/me') ? { login: 'ivan' } : []);
    });
    const { client } = setup(fetchImpl, { accessToken: jwt(1000), refreshToken: 'refresh' });
    const first = client.request('/me');
    const delayed = client.request('/projects');
    await expect(first).resolves.toEqual({ login: 'ivan' });
    releaseDelayed401(response({ error: 'Expired' }, 401));
    await expect(delayed).resolves.toEqual([]);
    expect(fetchImpl.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
  });

  it('retains field validation errors and handles network or non-JSON failures', async () => {
    const invalid = setup(async () => response({ error: 'Занят', fields: { login: 'Занят' } }, 422)).client;
    await expect(invalid.register({ login: 'ivan', password: 'secret' })).rejects.toMatchObject({ status: 422, fields: { login: 'Занят' } });
    const offline = setup(async () => { throw new TypeError('Failed to fetch'); }).client;
    await expect(offline.restore('ivan')).rejects.toBeInstanceOf(ApiError);
    const html = setup(async () => new Response('<html>proxy error</html>', { status: 502 })).client;
    await expect(html.restore('ivan')).rejects.toMatchObject({ status: 502 });
  });

  it('revokes the refresh on logout and clears local state even if the server is offline', async () => {
    const fetchImpl = vi.fn(async () => response({ ok: true }));
    const { client, persistentStorage } = setup(fetchImpl, { accessToken: jwt(1000), refreshToken: 'refresh' });
    await client.logout();
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/auth/logout');
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ refreshToken: 'refresh' });
    expect(client.getSession()).toBeNull();
    expect(persistentStorage.getItem(key)).toBeNull();
    const offline = setup(async () => { throw new TypeError('offline'); }, { accessToken: jwt(1000) }).client;
    await expect(offline.logout()).rejects.toBeInstanceOf(ApiError);
    expect(offline.getSession()).toBeNull();
  });

  it('keeps a new login when an earlier session retry returns a delayed 401', async () => {
    let releaseOldRetry;
    let markRetryStarted;
    const retryStarted = new Promise((resolve) => { markRetryStarted = resolve; });
    const fetchImpl = vi.fn(async (url, options) => {
      if (url.endsWith('/auth/refresh')) return response({ accessToken: jwt(2000) });
      if (url.endsWith('/auth/logout')) return response({ ok: true });
      if (url.endsWith('/auth/login')) return response({ accessToken: jwt(3000), refreshToken: 'new-refresh', user: { login: 'new-user' } });
      if (url.endsWith('/me')) {
        if (options.headers.Authorization === `Bearer ${jwt(1000)}`) return response({ error: 'Expired' }, 401);
        markRetryStarted();
        return new Promise((resolve) => { releaseOldRetry = resolve; });
      }
      expect(options.headers.Authorization).toBe(`Bearer ${jwt(3000)}`);
      return response([]);
    });
    const { client, persistentStorage } = setup(fetchImpl, { accessToken: jwt(1000), refreshToken: 'old-refresh' });
    const oldRequest = client.request('/me');
    await retryStarted;
    await client.logout();
    await client.login({ login: 'new-user', password: 'secret', remember: true });
    releaseOldRetry(response({ error: 'Old session revoked' }, 401));
    await expect(oldRequest).rejects.toMatchObject({ status: 401 });
    expect(client.getSession()?.user?.login).toBe('new-user');
    expect(JSON.parse(persistentStorage.getItem(key))).toMatchObject({ accessToken: jwt(3000), refreshToken: 'new-refresh' });
    await expect(client.request('/projects')).resolves.toEqual([]);
  });
});
