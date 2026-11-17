import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import App from './App';
import { createApiClient } from './api/client';

beforeEach(() => {
  window.history.replaceState(null, '', '/#/login');
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks(); });
const response = (value, status = 200) => new Response(JSON.stringify(value), { status });
const profile = { id: 1, login: 'ivan', name: 'Иван', fullName: 'Иван Петров', accountRole: 'student', group: '101' };
const columns = [{ id: 1, key: 'progress', title: 'В процессе', color: '#fa4545' }];
function clientFor(fetchImpl) { return createApiClient({ fetchImpl }); }
function resources(url) {
  if (url === '/api/me') return response(profile);
  if (url === '/api/users') return response([profile]);
  if (url === '/api/meta') return response({});
  if (url === '/api/columns') return response(columns);
  if (url === '/api/recommendations') return response([]);
  if (url === '/api/chats/unread') return response({ count: 0 });
  if (url === '/api/projects?full=1') return response([{ id: 2, title: 'Студенческий проект', members: 1, memberIds: [1], tasks: [], stages: [], progress: 45, status: 'progress', end: '2026-12-20' }]);
  if (url === '/api/tasks') return response([
    { id: 3, title: 'Подготовить прототип', progress: 25, column: 1, columnKey: 'progress', end: '2026-11-10', tags: [], docs: [] },
  ]);
  throw new Error(`Unexpected URL ${url}`);
}

describe('connected app', () => {
  it('prevents duplicate submissions while a login request is pending', async () => {
    let resolveLogin;
    const fetchImpl = vi.fn((url) => url === '/api/auth/login'
      ? new Promise((resolve) => { resolveLogin = resolve; }) : Promise.resolve(resources(url)));
    render(<App client={clientFor(fetchImpl)} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Логин или email'), 'ivan');
    await user.type(screen.getByLabelText('Пароль'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(screen.getByRole('button', { name: 'Подождите…' })).toBeDisabled();
    expect(screen.getByLabelText('Логин или email')).toBeDisabled();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await act(async () => resolveLogin(response({ accessToken: 'access', user: profile })));
    expect(await screen.findByRole('heading', { name: 'Подготовить прототип' })).toBeInTheDocument();
  });

  it('returns to login when a stored session has expired without refresh', async () => {
    sessionStorage.setItem('projectsprint.session', JSON.stringify({ accessToken: `header.${btoa('{"exp":1}')}.signature` }));
    const fetchImpl = vi.fn();
    render(<App client={clientFor(fetchImpl)} />);
    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('projectsprint.session')).toBeNull();
  });

  it('logs in, displays server projects and tasks, then logs out', async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (url === '/api/auth/login') return response({ accessToken: 'access', refreshToken: 'refresh', user: profile });
      if (url === '/api/auth/logout') return response({ ok: true });
      return resources(url);
    });
    render(<App client={clientFor(fetchImpl)} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Логин или email'), 'ivan');
    await user.type(screen.getByLabelText('Пароль'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(await screen.findByRole('heading', { name: 'Подготовить прототип' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Проекты', exact: true }));
    expect(await screen.findByRole('heading', { name: 'Студенческий проект' })).toBeInTheDocument();
    expect(localStorage.getItem('projectsprint.session')).toContain('refresh');
    await user.click(screen.getByRole('button', { name: 'Настройки', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Выйти из аккаунта' }));
    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
    expect(localStorage.getItem('projectsprint.session')).toBeNull();
  });

  it('shows invalid credentials, keeps the form and supports password visibility', async () => {
    render(<App client={clientFor(async () => response({ error: 'Неверный логин или пароль', fields: { pass: 'Проверьте пароль' } }, 401))} />);
    const user = userEvent.setup();
    const password = screen.getByLabelText('Пароль');
    await user.type(screen.getByLabelText('Логин или email'), 'ivan');
    await user.type(password, 'wrong');
    await user.click(screen.getByRole('button', { name: 'Показать пароль' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Продолжить' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный логин или пароль');
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: 'Продолжить' })).toBeEnabled();
  });

  it('registers through the backend and shows honest empty states', async () => {
    const fetchImpl = vi.fn(async (url) => {
      if (url === '/api/auth/register') return response({ accessToken: 'access', user: profile }, 201);
      if (url === '/api/me') return response(profile);
      if (url === '/api/columns') return response(columns);
      return response([]);
    });
    render(<App client={clientFor(fetchImpl)} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: 'Регистрация' }));
    await user.type(await screen.findByLabelText('Имя'), 'Иван');
    await user.type(screen.getByLabelText('Логин', { exact: true }), 'newstudent');
    await user.type(screen.getByLabelText('Пароль', { exact: true }), 'secret');
    await user.type(screen.getByLabelText('Повторите пароль'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Создать аккаунт' }));
    expect(await screen.findByText('Перетащите сюда задачу или нажмите «+»')).toBeInTheDocument();
    const sent = JSON.parse(fetchImpl.mock.calls.find(([url]) => url === '/api/auth/register')[1].body);
    expect(sent).toMatchObject({ login: 'newstudent', password: 'secret', password2: 'secret', name: 'Иван' });
  });

  it('submits recovery without promising that an email was sent', async () => {
    const fetchImpl = vi.fn(async () => response({ ok: true, message: 'Инструкция отправлена' }));
    render(<App client={clientFor(fetchImpl)} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Восстановить' }));
    await user.type(screen.getByLabelText('Логин или email'), 'ivan');
    await user.click(screen.getByRole('button', { name: 'Отправить запрос' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Отправка писем пока не подключена');
    expect(screen.queryByText('Инструкция отправлена')).not.toBeInTheDocument();
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ login: 'ivan' });
  });

  it('restores an existing session and retries loading after a network failure', async () => {
    sessionStorage.setItem('projectsprint.session', JSON.stringify({ accessToken: 'access' }));
    let online = false;
    const fetchImpl = vi.fn(async (url) => {
      if (!online) throw new TypeError('offline');
      return resources(url);
    });
    render(<App client={clientFor(fetchImpl)} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось связаться с сервером');
    online = true;
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('heading', { name: 'Подготовить прототип' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
