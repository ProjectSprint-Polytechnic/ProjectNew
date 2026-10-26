import { useEffect, useState } from 'react';
import './Workspace.css';

function dateLabel(value) {
  if (!value) return 'Срок не указан';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? 'Срок не указан' : `До ${date.toLocaleDateString('ru-RU')}`;
}

function Workspace({ client, onLogout }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [pendingLogout, setPendingLogout] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      client.request('/me'), client.request('/projects?mine=1'), client.request('/tasks?assignee=me'),
    ]).then(([user, projects, tasks]) => {
      if (active) setData({ user, projects, tasks });
    }).catch((failure) => {
      if (active) setError(failure.message);
    });
    return () => { active = false; };
  }, [client, attempt]);

  function reload() {
    setError('');
    setData(null);
    setAttempt((current) => current + 1);
  }

  async function logout() {
    setPendingLogout(true);
    await onLogout();
  }

  return (
    <main className="workspace">
      <header className="workspace-header">
        <div><p className="workspace-brand">ProjectSprint Mobile</p><h1>Мои проекты</h1></div>
        <button className="secondary-button" onClick={logout} disabled={pendingLogout}>{pendingLogout ? 'Выходим…' : 'Выйти'}</button>
      </header>
      {!data && !error && <p className="workspace-message" role="status">Загружаем проекты и задачи…</p>}
      {error && <div className="workspace-message"><p className="form-error" role="alert">{error}</p><button className="secondary-button" onClick={reload}>Повторить</button></div>}
      {data && <>
        <section className="workspace-profile" aria-label="Мой профиль">
          <h2>{data.user.fullName || data.user.name || data.user.login}</h2>
          <p>{data.user.accountRole === 'leader' ? 'Руководитель' : 'Студент'}{data.user.group ? ` · ${data.user.group}` : ''}</p>
        </section>
        <section aria-label="Мои проекты">
          <div className="section-heading"><h2>Проекты</h2><span>{data.projects.length}</span></div>
          {data.projects.length === 0 ? <p className="empty-state">Вы пока не участвуете в проектах.</p> : <ul className="project-list">
            {data.projects.map((project) => <li className="project-card" key={project.id}>
              <p className="item-status">{project.status === 'done' ? 'Завершён' : 'В работе'}</p>
              <h3>{project.title}</h3>
              <p className="item-meta">{dateLabel(project.end)} · Участников: {project.members}</p>
              <div className="progress-heading"><span>Выполнено</span><span>{project.progress}%</span></div>
              <progress max="100" value={project.progress} aria-label={`Прогресс проекта ${project.title}`} />
            </li>)}
          </ul>}
        </section>
        <section className="tasks-section" aria-label="Мои задачи">
          <div className="section-heading"><h2>Мои задачи</h2><span>{data.tasks.length}</span></div>
          {data.tasks.length === 0 ? <p className="empty-state">У вас пока нет назначенных задач.</p> : <ul className="task-list">
            {data.tasks.map((task) => <li className="task-row" key={task.id}>
              <div><h3>{task.title}</h3><p className="item-meta">{dateLabel(task.end)}</p></div>
              <span className="task-status">{task.completedAt || task.columnKey === 'done' ? 'Готово' : `${task.progress}%`}</span>
            </li>)}
          </ul>}
        </section>
      </>}
    </main>
  );
}

export default Workspace;
