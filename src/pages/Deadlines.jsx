// «Дедлайны» — отдельного макета нет, собрано из тех же компонентов, что и доска задач
import { useEffect, useState } from 'react';
import { useApp } from '../appContext';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { Avatar, Chip, Empty, Progress } from '../components/ui';
import { TaskDetailsModal } from '../components/TaskModals';
import { colorTone, matchTask } from '../taskDisplay';
import './Deadlines.css';

const fmt = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
const deadlineGroups = [
  ['overdue', 'Просрочено', 'var(--red)'],
  ['week', 'Ближайшие 7 дней', 'var(--purple)'],
  ['later', 'Позже', 'var(--blue)'],
];

export default function Deadlines() {
  const { client, columns, people, query, reloadBoard } = useApp();
  const [open, setOpen] = useState(null);
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');
  const task = Object.values(groups || {}).flat().find((t) => t.id === open);
  const col = (t) => columns.find((c) => c.id === t.column);

  useEffect(() => {
    let current = true;
    client.request('/deadlines').then((result) => {
      if (current) setGroups(result);
    }).catch((failure) => {
      if (current) setError(failure.message);
    });
    return () => { current = false; };
  }, [client]);

  async function refresh() {
    setError('');
    try {
      await Promise.all([client.request('/deadlines').then(setGroups), reloadBoard()]);
    } catch (failure) {
      setError(failure.message);
    }
  }

  return (
    <Layout>
      {error && <p className="task-page-error" role="alert">{error} <button type="button" onClick={refresh}>Повторить</button></p>}
      {!groups && !error && <p role="status">Загрузка дедлайнов…</p>}
      {groups && <div className="dl">
        {deadlineGroups.map(([key, title, color]) => {
          const items = groups[key].filter((t) => matchTask(t, query));
          return (
            <section className="dl-group" key={key}>
              <header className="column-head" style={{ '--col': color }}><span className="column-dot" /><h2 className="grow">{title}</h2><span className="column-count">{items.length}</span></header>
              {items.length === 0 && <Empty>Нет задач</Empty>}
              {items.map((t) => {
                const d = t.days;
                const person = people.find((p) => p.id === t.assignee);
                const taskColumn = col(t);
                return (
                  <button className="dl-row" key={t.id} onClick={() => setOpen(t.id)}>
                    <span className="dl-date" style={{ color: d < 0 ? 'var(--red)' : undefined }}>
                      <Icon name="calendar" size={18} /> {fmt(t.end)}
                    </span>
                    <span className="dl-title grow"><b>{t.title}</b><small className="muted">{taskColumn?.title}</small></span>
                    <span className="dl-person"><Avatar id={t.assignee} size={28} />{person?.name || 'Без исполнителя'}</span>
                    <span className="dl-progress"><Progress value={t.progress} color={colorTone(taskColumn?.color)} /></span>
                    <Chip tone={d < 0 ? 'red' : d <= 2 ? 'lilac' : undefined}>
                      {d < 0 ? `просрочено на ${-d} дн.` : d === 0 ? 'сегодня' : `через ${d} дн.`}
                    </Chip>
                  </button>
                );
              })}
            </section>
          );
        })}
      </div>}
      {task && <TaskDetailsModal key={task.id} task={task} color={colorTone(col(task)?.color)}
        onClose={() => setOpen(null)} onChanged={refresh} />}
    </Layout>
  );
}
