import { useEffect } from 'react';
import { AppProvider } from './store';
import { useApp } from './appContext';
import { navigate, useRoute } from './router';
import Auth from './pages/Auth';
import Tasks from './pages/Tasks';
import Competencies from './pages/Competencies';
import Deadlines from './pages/Deadlines';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import Stats from './pages/Stats';
import Chats from './pages/Chats';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const pages = {
  tasks: Tasks,
  competencies: Competencies,
  deadlines: Deadlines,
  projects: Projects,
  reports: Reports,
  stats: Stats,
  chats: Chats,
  profile: Profile,
};

export default function App({ client } = {}) {
  return <AppProvider client={client}><Routes /></AppProvider>;
}

function Routes() {
  const { authed, setQuery, loading, loadError, retry, logout } = useApp();
  const { section } = useRoute();

  // Поиск сбрасывается при смене раздела
  useEffect(() => { setQuery(''); window.scrollTo(0, 0); }, [section, setQuery]);

  if (section === '') return <Redirect to={authed ? '/tasks' : '/login'} />;
  if (section === 'login' || section === 'register') {
    return authed ? <Redirect to="/tasks" /> : <Auth key={section} mode={section} />;
  }
  const Page = pages[section];
  if (!Page) return <NotFound />;
  if (!authed) return <Redirect to="/login" />;
  if (loading || loadError) {
    return (
      <main className="auth">
        <div className="auth-card">
          {loading ? <p role="status">Загружаем рабочее пространство…</p> : (
            <>
              <p role="alert">{loadError}</p>
              <div className="auth-actions row">
                <button type="button" className="btn btn-ghost" onClick={logout}>Выйти</button>
                <button type="button" className="btn btn-red" onClick={retry}>Повторить</button>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }
  return <Page />;
}

function Redirect({ to }) {
  useEffect(() => { navigate(to); }, [to]);
  return null;
}
