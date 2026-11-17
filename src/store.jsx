import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { api } from './api/client';
import { AppContext } from './appContext';

const dict = {
  ru: {
    main: 'Главная', theme: 'Светлая тема', themeDark: 'Тёмная тема', messages: 'Сообщения', settings: 'Настройки',
    basic: 'Основное', extra: 'Дополнительно', lang: 'Русский', reference: 'Справка', help: 'Помощь',
    motivation: 'Мотивация\nот лидера', search: 'Поиск', searchChats: 'Поиск по чатам', keywords: 'Поиск по ключевым словам',
    tabCompetencies: 'Компетенции', tabTasks: 'Задачи', tabDeadlines: 'Дедлайны', tabProjects: 'Проекты',
    tabDone: 'Выполненные задачи', tabStats: 'Статистика', tabAnalytics: 'Аналитика',
  },
  en: {
    main: 'Home', theme: 'Light theme', themeDark: 'Dark theme', messages: 'Messages', settings: 'Settings',
    basic: 'Main', extra: 'More', lang: 'English', reference: 'Reference', help: 'Help',
    motivation: 'Motivation\nfrom leader', search: 'Search', searchChats: 'Search chats', keywords: 'Search by keywords',
    tabCompetencies: 'Competencies', tabTasks: 'Tasks', tabDeadlines: 'Deadlines', tabProjects: 'Projects',
    tabDone: 'Completed tasks', tabStats: 'Statistics', tabAnalytics: 'Analytics',
  },
};

const defaults = { all: false, messages: true, email: false, tasks: true, comments: true, deadlines: true };

export function AppProvider({ children, client = api }) {
  const session = useSyncExternalStore(client.subscribe, client.getSession);
  const [logoutNotice, setLogoutNotice] = useState('');
  const authed = Boolean(session);

  async function logout() {
    setLogoutNotice('');
    try {
      await client.logout();
    } catch {
      setLogoutNotice('Вы вышли на этом устройстве. Не удалось завершить сессию на сервере.');
    }
  }

  return (
    <AppState key={session?.user?.id ?? (authed ? 'signed-in' : 'signed-out')} client={client} authed={authed}
      logout={logout} logoutNotice={logoutNotice} clearLogoutNotice={() => setLogoutNotice('')}>
      {children}
    </AppState>
  );
}

function AppState({ children, client, authed, logout, logoutNotice, clearLogoutNotice }) {
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [modal, setModal] = useState(null);
  const [query, setQuery] = useState('');
  const boardVersion = useRef(0);
  const projectVersion = useRef(0);
  const settingsQueue = useRef(Promise.resolve());
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!authed) return;
    let active = true;
    Promise.all([
      client.request('/me'), client.request('/users'), client.request('/meta'),
      client.request('/columns'), client.request('/tasks'), client.request('/projects?full=1'),
    ]).then(([user, people, meta, columns, tasks, projects]) => {
      if (active) setData({ user, people, meta, columns, tasks, projects });
    }).catch((error) => {
      if (active) setLoadError(error.message);
    });
    return () => { active = false; };
  }, [authed, client, attempt]);

  const user = data?.user;
  const theme = user?.settings?.theme || 'light';
  const lang = user?.settings?.lang || 'ru';
  const notify = user?.settings?.notify || defaults;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
  }, [theme, lang]);

  async function reloadUser() {
    const user = await client.request('/me');
    setData((current) => ({ ...current, user }));
    return user;
  }

  async function reloadBoard() {
    const version = ++boardVersion.current;
    const [columns, tasks] = await Promise.all([client.request('/columns'), client.request('/tasks')]);
    if (version === boardVersion.current) setData((current) => ({ ...current, columns, tasks }));
  }

  async function reloadProjects() {
    const version = ++projectVersion.current;
    const projects = await client.request('/projects?full=1');
    if (version === projectVersion.current) setData((current) => ({ ...current, projects }));
  }

  function updateSettings(body) {
    const operation = settingsQueue.current.then(async () => {
      if (!mounted.current) return;
      const settings = await client.request('/me/settings', { method: 'PATCH', body });
      setData((current) => ({ ...current, user: { ...current.user, settings } }));
      return settings;
    });
    settingsQueue.current = operation.catch(() => {});
    return operation;
  }

  async function uploadFiles(files) {
    if (!files.length) return [];
    const form = new FormData();
    for (const file of files) form.append('files', file);
    return client.request('/files', { method: 'POST', body: form });
  }

  async function downloadFile(file) {
    const blob = await client.readFile(file.id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const t = useCallback((key) => dict[lang][key] ?? key, [lang]);
  const value = {
    client, authed, user, role: user?.accountRole, theme, lang, notify, t,
    people: data?.people || [], meta: data?.meta || {},
    columns: data?.columns || [], tasks: data?.tasks || [], projects: data?.projects || [],
    loading: authed && !data && !loadError, loadError,
    retry: () => { setLoadError(''); setAttempt((current) => current + 1); },
    reloadUser, reloadBoard, reloadProjects, updateSettings, uploadFiles, downloadFile,
    logout, logoutNotice, clearLogoutNotice, collapsed, setCollapsed, modal, setModal, query, setQuery,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
