// «Проекты»: доска проектов, карточка «Подробнее», добавление проекта
import { useState } from 'react';
import { useApp } from '../appContext';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { Avatar, AvatarStack, Button, Chip, DateInput, Field, Input, Progress } from '../components/ui';
import { PeopleSelect } from '../components/TaskModals';
import { daysWord } from '../taskDisplay';
import './Projects.css';

const membersWord = (n) => {
  const a = n % 100, b = n % 10;
  if (a > 10 && a < 20) return 'участников';
  if (b === 1) return 'участник';
  if (b >= 2 && b <= 4) return 'участника';
  return 'участников';
};

function dateLabel(value) {
  return value ? value.split('-').reverse().join('.') : '—';
}

function daysLabel(project) {
  return project.end ? `${project.daysLeft} ${daysWord(project.daysLeft).toLowerCase()}` : 'Без срока';
}

function ProjectCard({ p, onOpen }) {
  const { people } = useApp();
  const leader = people.find((person) => person.id === p.leader);
  const color = p.status === 'done' ? 'blue' : 'red';
  return (
    <article className="proj-card">
      <h3>{p.title}</h3>
      <div className="proj-boxes">
        <div className="proj-box"><small>Лидер</small><span className="proj-pill">{leader && <Avatar person={leader} size={26} />}{leader?.name || 'Не назначен'}</span></div>
        {p.status !== 'done' && <div className="proj-box"><small>Сроки</small><span className="proj-pill">{daysLabel(p)}</span></div>}
        <div className="proj-box"><small>Участники</small><span className="proj-pill"><AvatarStack ids={p.memberIds.slice(0, 2)} size={24} />{p.members} {membersWord(p.members)}</span></div>
      </div>
      <p className="proj-desc clamp-3">{p.goal}</p>
      <div className="proj-progress"><b>Прогресс</b><Progress value={p.progress} color={color} /></div>
      <Button variant="dark" block onClick={onOpen}>Подробнее</Button>
    </article>
  );
}

function ProjectDetails({ p, onClose, onEdit }) {
  const [tab, setTab] = useState('goal');
  const [more, setMore] = useState(false);
  const { people } = useApp();
  const stages = more ? p.stages : p.stages.slice(0, 5);
  const leader = people.find((person) => person.id === p.leader);
  const team = people.filter((person) => p.memberIds.includes(person.id) && person.id !== p.leader);
  const text = { goal: p.goal || 'Цель проекта пока не заполнена.', relevance: p.relevance || 'Актуальность проекта пока не заполнена.', problem: p.problem || 'Проблематика проекта пока не заполнена.' }[tab];
  return (
    <Modal open onClose={onClose} width={1500} title={p.title} className="proj-modal"
      actions={onEdit && <button className="row proj-edit" onClick={onEdit}><Icon name="pencil" size={16} /> Редактировать</button>}>
      <div className="proj-grid">
        <div className="proj-col">
          <section className="pbox">
            <h4>Сроки</h4>
            <div className="row proj-dates"><span className="readpill">{dateLabel(p.start)}</span>—<span className="readpill">{dateLabel(p.end)}</span></div>
            <div className="row proj-left"><b>Осталось</b><span className="proj-left-pill">{p.status === 'done' ? 'Завершён' : daysLabel(p)}</span></div>
          </section>
          <section className="pbox">
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {[['goal', 'Цель'], ['relevance', 'Актуальность'], ['problem', 'Проблематика']].map(([k, l]) => (
                <Chip key={k} onClick={() => setTab(k)} className={tab === k ? 'chip-red' : 'chip-white-ish'}>{l}</Chip>
              ))}
            </div>
            <p className="proj-text">{text}</p>
          </section>
          {p.tasks.length > 0 && <section className="pbox">
            <h4>Ключевые задачи</h4>
            <ol className="proj-text">{p.tasks.map((task, index) => <li key={index}>{task}</li>)}</ol>
          </section>}
          {p.result && <section className="pbox">
            <h4>Ожидаемый продуктовый результат</h4>
            <p className="proj-text">{p.result}</p>
          </section>}
        </div>
        <section className="pbox proj-col">
          <h4>Ключевые этапы</h4>
          <div className="stages">
            {stages.map(({ id, name, percent }) => (
              <div className="stage" key={id}><span className="grow">{name}</span><div style={{ width: 90 }}><Progress value={percent} color="red" label={false} /></div><b>{percent}%</b></div>
            ))}
          </div>
          {stages.length === 0 && <p className="muted">Этапы пока не добавлены.</p>}
          {p.stages.length > 5 && (
            <button className="stages-more" onClick={() => setMore(!more)}>{more ? 'Скрыть' : `Показать еще (+${p.stages.length - 5})`}</button>
          )}
        </section>
        <section className="pbox proj-col">
          <h4>Участники проекта</h4>
          <small className="muted">Лидер</small>
          {leader ? <div className="member"><Avatar person={leader} size={40} /><span className="grow">{leader.name}</span>{leader.tag && <Chip>{leader.tag}</Chip>}</div> : <p>Не назначен</p>}
          <small className="muted">Участники</small>
          <div className="members">
            {team.map((m) => <div className="member" key={m.id}><Avatar person={m} size={40} /><span className="grow">{m.name}</span>{m.tag && <Chip>{m.tag}</Chip>}</div>)}
          </div>
        </section>
      </div>
    </Modal>
  );
}

function AddProject({ client, onClose, onSaved, initial, userId }) {
  const [v, setV] = useState(() => ({
    title: initial?.title || '',
    goal: initial?.goal || '',
    relevance: initial?.relevance || '',
    problem: initial?.problem || '',
    tasks: initial?.tasks.length ? initial.tasks : [''],
    result: initial?.result || '',
    members: initial?.memberIds || [],
    leader: initial ? initial.leader : userId,
    start: initial?.start || '',
    end: initial?.end || '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    if (saving || !v.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await client.request(initial ? `/projects/${initial.id}` : '/projects', {
        method: initial ? 'PATCH' : 'POST',
        body: { ...v, tasks: v.tasks.map((task) => task.trim()).filter(Boolean) },
      });
    } catch (failure) {
      setError(failure.message);
      setSaving(false);
      return;
    }
    onSaved();
  }
  const set = (p) => setV((s) => ({ ...s, ...p }));
  const field = (k, label, ph) => (
    <Field label={label}><Input placeholder={ph} value={v[k]} disabled={saving} maxLength={k === 'title' ? 255 : undefined} onChange={(e) => set({ [k]: e.target.value })} /></Field>
  );
  return (
    <Modal open onClose={() => { if (!saving) onClose(); }} title={initial ? 'Редактировать проект' : 'Добавить проект'}>
      {field('title', 'Название проекта', 'Например:  ProjectSprint')}
      {field('goal', 'Цель', 'Опишите цель проекта')}
      {field('relevance', 'Актуальность', 'Опишите актуальность проекта')}
      {field('problem', 'Проблематика', 'Опишите проблематику проекта')}
      <div className="field">
        <span className="field-label">Ключевые задачи</span>
        {v.tasks.map((t, i) => (
          <div className="row" key={i}>
            <Input className="grow" placeholder={`${i + 1}. Опишите ${i === 0 ? 'первую' : 'следующую'} задачу`} value={t}
              onChange={(e) => set({ tasks: v.tasks.map((x, j) => (j === i ? e.target.value : x)) })} />
            {i === v.tasks.length - 1 && (
              <button className="add-round" onClick={() => set({ tasks: [...v.tasks, ''] })} aria-label="Добавить задачу"><Icon name="plus" size={22} /></button>
            )}
          </div>
        ))}
      </div>
      {field('result', 'Ожидаемый продуктовый результат', 'Опишите ожидаемый продуктовый результат проекта')}
      <Field label="Участники команды"><PeopleSelect multiple value={v.members} onChange={(members) => set({ members })} /></Field>
      <Field label="Тим-Лидер команды"><PeopleSelect value={v.leader} onChange={(leader) => set({ leader })} /></Field>
      <div className="field">
        <span className="field-label">Срок выполнения</span>
        <span className="field-sub">Начало</span><DateInput value={v.start} onChange={(start) => set({ start })} />
        <span className="field-sub">Окончание</span><DateInput value={v.end} onChange={(end) => set({ end })} />
      </div>
      {error && <p role="alert">{error}</p>}
      <Button variant="light" size="lg" block disabled={saving || !v.title.trim()} onClick={save}>
        {saving ? 'СОХРАНЯЕМ…' : initial ? 'СОХРАНИТЬ' : 'ДОБАВИТЬ'}
      </Button>
    </Modal>
  );
}

export default function Projects() {
  const { client, projects, reloadProjects, user, role, query } = useApp();
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [refreshError, setRefreshError] = useState('');
  const q = query.trim().toLowerCase();
  const list = projects.filter((p) => !q || p.title.toLowerCase().includes(q) || p.goal.toLowerCase().includes(q));
  const inWork = list.filter((p) => p.status !== 'done');
  const done = list.filter((p) => p.status === 'done');
  const opened = projects.find((p) => p.id === open);

  async function refresh() {
    setRefreshError('');
    try {
      await reloadProjects();
    } catch (failure) {
      setRefreshError(failure.message);
    }
  }

  function saved() {
    setAdding(false);
    setEditing(null);
    void refresh();
  }

  return (
    <Layout>
      {refreshError && <p role="alert">{refreshError} <Button onClick={refresh}>Обновить проекты</Button></p>}
      <div className="proj-board">
        <section className="proj-column wide">
          <header className="column-head" style={{ '--col': 'var(--red)' }}><span className="column-dot" /><h2 className="grow">В процессе</h2><span className="column-count">{inWork.length}</span></header>
          <div className="proj-cards">{inWork.map((p) => <ProjectCard key={p.id} p={p} onOpen={() => setOpen(p.id)} />)}</div>
        </section>
        <section className="proj-column">
          <header className="column-head" style={{ '--col': 'var(--blue)' }}><span className="column-dot" /><h2 className="grow">Готовые</h2><span className="column-count">{done.length}</span></header>
          <div className="proj-cards one">{done.map((p) => <ProjectCard key={p.id} p={p} onOpen={() => setOpen(p.id)} />)}</div>
        </section>
      </div>
      {role === 'leader' && (
        <button className="fab" onClick={() => setAdding(true)} aria-label="Добавить проект"><Icon name="plus" size={28} stroke={2.2} /></button>
      )}
      {opened && <ProjectDetails key={opened.id} p={opened} onClose={() => setOpen(null)}
        onEdit={role === 'leader' || opened.leader === user.id ? () => { setEditing(opened); setOpen(null); } : undefined} />}
      {adding && <AddProject client={client} userId={user.id} onClose={() => setAdding(false)} onSaved={saved} />}
      {editing && <AddProject client={client} initial={editing} onClose={() => setEditing(null)} onSaved={saved} />}
    </Layout>
  );
}
