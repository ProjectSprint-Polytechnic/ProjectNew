// «Компетенции»: студент видит свой прогресс и рекомендации, руководитель — навыки всей команды
import { useEffect, useState } from 'react';
import { useApp } from '../appContext';
import Layout from '../components/Layout';
import Icon, { TechIcon } from '../components/Icon';
import Modal from '../components/Modal';
import { Button, Chip, DocList, Field, FileDrop, Input, Progress, TechSelect, Textarea } from '../components/ui';
import { CommentCard } from '../components/TaskModals';
import './Competencies.css';

function useSubmission() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(operation) {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await operation();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, submit };
}

function TeamPanel({ departments, title = 'Команда' }) {
  const { people, query } = useApp();
  const count = new Set(departments.flatMap((department) => department.members.map(([id]) => id))).size;
  return (
    <aside className="team-panel">
      <div className="team-head">
        <h2>{title}</h2>
        <span className="row muted"><Icon name="userCircle" size={18} />{count}</span>
      </div>
      <div className="team-list">
        {!count && <p className="muted">Участников пока нет.</p>}
        {departments.map(({ name, members }) => (
          <div className="team-dep" key={name}>
            <Chip>{name}</Chip>
            {members
              .map(([id, percent]) => ({ id, percent, person: people.find((person) => person.id === id) }))
              .filter(({ person }) => person?.name.toLowerCase().includes(query.trim().toLowerCase()))
              .map(({ id, percent, person }) => (
                <div className="team-row" key={id}>
                  {percent != null && <i style={{ background: percent >= 80 ? 'var(--blue)' : 'var(--purple)' }} />}
                  <span className="grow">{person.name}</span>
                  {percent != null && <span>{percent}%</span>}
                </div>
              ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function SkillAccordion({ comp, onTopic, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="skill">
      <button className="skill-head" onClick={() => setOpen(!open)} aria-expanded={open}>
        <TechIcon tech={comp.tech} size={20} />
        <b>{comp.name || comp.tech}</b>
        <div className="grow"><Progress value={comp.percent} color="lilac" label={false} /></div>
        <span className="skill-pct">{comp.percent}%</span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={20} />
      </button>
      {open && comp.topics.map((t) => {
        const Tag = onTopic ? 'button' : 'div';
        return (
          <Tag className="topic" key={t.id} onClick={onTopic ? () => onTopic(t) : undefined}>
            <span className="grow">{t.title}</span>
            {t.status === 'done' ? <Chip tone="lilac" className="topic-done">Уже выполнено</Chip> : <span className="topic-st">В процессе</span>}
          </Tag>
        );
      })}
    </div>
  );
}

function AddCompetencyModal({ onClose, onSave }) {
  const { meta } = useApp();
  const { pending, error, submit } = useSubmission();
  const [tech, setTech] = useState(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  return (
    <Modal open onClose={onClose} title="Добавить компетенцию" width={600}>
      <Field label="Технология"><TechSelect value={tech} onChange={setTech} options={meta.techs} /></Field>
      <Field label="Тема"><Input aria-label="Тема" maxLength={255} placeholder="Например: Числа и операторы" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Заметки"><Textarea placeholder="Напишите, что хотите повторить или изучить" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div className="field"><span className="field-label">Добавить файлы</span><FileDrop files={files} onFiles={setFiles} /></div>
      {error && <p role="alert">{error}</p>}
      <Button variant="light" size="lg" block disabled={pending || !tech || !title.trim()} onClick={() => submit(() => onSave({ tech, title: title.trim(), notes, files }))}>Добавить</Button>
    </Modal>
  );
}

function EditTopicModal({ topic, onClose, onSave, onRemove }) {
  const { meta, downloadFile } = useApp();
  const { pending, error, submit } = useSubmission();
  const [tech, setTech] = useState(topic.tech);
  const [title, setTitle] = useState(topic.title);
  const [notes, setNotes] = useState(topic.notes);
  const save = (status) => submit(() => onSave({ tech, title: title.trim(), notes, status }));
  return (
    <Modal open onClose={onClose} title="Редактировать информацию" width={600}>
      <Field label="Технология"><TechSelect value={tech} onChange={setTech} options={meta.techs} /></Field>
      <Field label="Тема"><Input aria-label="Тема" maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Заметки"><Textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <DocList title="Прикреплённые документы" docs={topic.docs || []}
        onDownload={(file) => submit(() => downloadFile(file))}
        onRemove={(i) => submit(() => onRemove(topic.docs[i]))} />
      {error && <p role="alert">{error}</p>}
      <div className="row">
        <Button variant={topic.status === 'done' ? 'ghost' : 'lilac'} disabled={pending || !title.trim()} onClick={() => save(topic.status === 'done' ? 'progress' : 'done')}>
          {topic.status === 'done' ? 'Вернуть в работу' : 'Отметить выполненным'}
        </Button>
        <Button variant="dark" className="grow" disabled={pending || !title.trim()} onClick={() => save(topic.status)}>Сохранить</Button>
      </div>
    </Modal>
  );
}

function StudentView({ competencies, recommendations, refresh }) {
  const { client, user, uploadFiles, query } = useApp();
  const { pending, error, submit } = useSubmission();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [allRecs, setAllRecs] = useState(false);
  const edited = competencies.flatMap((competency) => competency.topics).find((topic) => topic.id === editId);
  const done = competencies.filter((competency) => competency.percent >= 100).length;
  const normalized = query.trim().toLowerCase();
  const visible = competencies.filter(({ name, topics }) => name.toLowerCase().includes(normalized) || topics.some(({ title }) => title.toLowerCase().includes(normalized)));

  async function add({ tech, title, notes, files }) {
    const uploaded = await uploadFiles(files);
    await client.request('/competencies/topics', { method: 'POST', body: { tech, title, notes, files: uploaded.map((file) => file.id) } });
    setAdding(false);
    refresh();
  }

  async function saveTopic(body) {
    await client.request(`/competencies/topics/${editId}`, { method: 'PATCH', body });
    setEditId(null);
    refresh();
  }

  async function removeAttachment(file) {
    await client.request(`/files/${file.id}`, { method: 'DELETE' });
    refresh();
  }

  function openRecommendations() {
    setAllRecs(true);
    if (recommendations.some((item) => item.isNew)) {
      submit(async () => {
        await client.request('/recommendations/read-all', { method: 'POST' });
        refresh();
      });
    }
  }

  return (
    <div className="comp-main">
      <div className="comp-person">
        <div>
          <h2>{user.name}</h2>
          {user.department && <Chip>{user.department}</Chip>}
        </div>
        <div className="comp-person-r">
          <small className="muted">Освоено: {done} из {competencies.length}</small>
          <Button size="sm" onClick={() => setAdding(true)}>Добавить компетенцию</Button>
        </div>
      </div>

      {visible.map((competency, index) => <SkillAccordion key={competency.tech} comp={competency} defaultOpen={index === 0} onTopic={(topic) => setEditId(topic.id)} />)}
      {!visible.length && <p className="muted">{normalized ? 'Компетенции не найдены.' : 'Добавьте первую компетенцию.'}</p>}

      <div className="recs">
        <div className="recs-head">
          <span>Рекомендации</span>
          {recommendations.some((item) => item.isNew) && <Chip tone="lilac">Есть непрочитанные</Chip>}
        </div>
        <div className="recs-row">
          {recommendations.slice(0, 2).map((item, index) => <CommentCard key={item.id} c={item} faded={index > 0} />)}
          {!recommendations.length && <p className="muted">Рекомендаций пока нет.</p>}
        </div>
        {recommendations.length > 0 && <button className="recs-all" disabled={pending} onClick={openRecommendations}>Посмотреть все <Icon name="arrowRight" size={20} /></button>}
        {error && <p role="alert">{error}</p>}
      </div>

      {adding && <AddCompetencyModal onClose={() => setAdding(false)} onSave={add} />}
      {edited && <EditTopicModal key={edited.id} topic={edited} onClose={() => setEditId(null)} onSave={saveTopic} onRemove={removeAttachment} />}
      {allRecs && (
        <Modal open onClose={() => setAllRecs(false)} title="Рекомендации">
          {recommendations.map((item) => <CommentCard key={item.id} c={item} />)}
        </Modal>
      )}
    </div>
  );
}

function PersonCard({ s, expanded, onToggle, onOpen }) {
  const { people, meta } = useApp();
  const person = people.find((item) => item.id === s.person);
  const shown = expanded ? s.skills : s.skills.slice(0, 1);
  return (
    <div className={`pcard ${expanded ? 'is-hl' : ''}`}>
      <div className="pcard-in">
        <button className="pcard-head" onClick={onOpen}>
          <div>
            <h3>{person?.name || 'Участник'}</h3>
            <div className="row" style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
              {s.role && <Chip tone="lilac">{s.role}</Chip>}
              {s.tags.map((t) => <Chip key={t}>{t}</Chip>)}
            </div>
          </div>
          <div className="pcard-count"><b>{s.done}/{s.total}</b><small>Навыки</small></div>
        </button>
        {shown.map(([tech, pct, c], i) => (
          <div className="pskill" key={i}>
            <TechIcon tech={tech} size={18} />
            <b>{meta.techs.find((item) => item.id === tech)?.name || tech}</b>
            <div className="grow"><Progress value={pct} color={c === 'blue' ? 'lilac' : c} label={false} /></div>
            <span>{pct}%</span>
          </div>
        ))}
      </div>
      {s.skills.length > 1 && (
        <button className="pcard-toggle" onClick={onToggle}>{expanded ? 'Свернуть' : 'Развернуть'}</button>
      )}
    </div>
  );
}

function LeaderView({ team }) {
  const { people, query } = useApp();
  const [expanded, setExpanded] = useState([]);
  const [open, setOpen] = useState(null);
  const normalized = query.trim().toLowerCase();
  const list = team.filter(({ person }) => !normalized || people.find((item) => item.id === person)?.name.toLowerCase().includes(normalized));
  const cols = [list.filter((_, i) => i % 2 === 0), list.filter((_, i) => i % 2 === 1)];
  const toggle = (id) => setExpanded((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  const opened = team.find((item) => item.person === open);

  return (
    <div className="comp-grid">
      {!list.length && <p className="muted">Участники с компетенциями не найдены.</p>}
      {cols.map((col, index) => (
        <div className="comp-col" key={index}>
          {col.map((item) => (
            <PersonCard key={item.person} s={item} expanded={expanded.includes(item.person)}
              onToggle={() => toggle(item.person)} onOpen={() => setOpen(item.person)} />
          ))}
        </div>
      ))}
      {opened && <MemberSkills key={opened.person} member={opened} onClose={() => setOpen(null)} />}
    </div>
  );
}

function MemberSkills({ member, onClose }) {
  const { client, people } = useApp();
  const person = people.find((item) => item.id === member.person);
  const [skills, setSkills] = useState(null);
  const [error, setError] = useState('');
  const [recommend, setRecommend] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const items = await client.request(`/competencies?user=${member.person}`);
        if (active) {
          setSkills(items);
          setError('');
        }
      } catch (failure) {
        if (active) setError(failure.message);
      }
    })();
    return () => { active = false; };
  }, [client, member.person, version]);

  return (
    <>
      {!recommend && (
        <Modal open onClose={onClose} width={714}
          title={<span>{person?.name || 'Участник'}<span className="row" style={{ marginTop: 10, gap: 8 }}>{member.tags.map((tag) => <Chip key={tag} className="chip-white">{tag}</Chip>)}</span></span>}
          actions={<div className="pcard-count"><b>{member.done}/{member.total}</b><small>Навыки</small></div>}>
          {error && <p role="alert">{error}</p>}
          {!skills && !error && <p role="status">Загрузка…</p>}
          {skills?.map((skill) => <SkillAccordion key={skill.tech} comp={skill} defaultOpen={false} />)}
          <div className="row">
            <Button variant="light" size="lg" className="grow" onClick={() => setRecommend(true)}>Добавить рекомендацию</Button>
            <Button variant="light" size="lg" className="grow" onClick={() => setVersion((current) => current + 1)}>Обновить</Button>
          </div>
        </Modal>
      )}
      {recommend && <RecommendModal personId={member.person} onClose={() => setRecommend(false)} />}
    </>
  );
}

function RecommendModal({ personId, onClose }) {
  const { client, uploadFiles } = useApp();
  const { pending, error, submit } = useSubmission();
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sent, setSent] = useState(false);

  async function send() {
    const uploaded = await uploadFiles(files);
    await client.request('/recommendations', { method: 'POST', body: { to: personId, text: text.trim(), files: uploaded.map((file) => file.id) } });
    setSent(true);
  }

  return (
    <Modal open onClose={onClose} title="Добавить рекомендацию" width={714}>
      {sent ? <p>Рекомендация отправлена.</p> : (
        <>
          <Field label="Рекомендация"><Textarea placeholder="Оставьте рекомендацию студенту" maxLength={5000} value={text} onChange={(e) => setText(e.target.value)} /></Field>
          <div className="field"><span className="field-label">Файлы</span><FileDrop files={files} onFiles={setFiles} /></div>
        </>
      )}
      {error && <p role="alert">{error}</p>}
      <Button variant="light" size="lg" block disabled={pending || (!sent && !text.trim())}
        onClick={sent ? onClose : () => submit(send)}>{sent ? 'Готово' : 'Отправить'}</Button>
    </Modal>
  );
}

export default function Competencies() {
  const { client, role, user, people, projects } = useApp();
  const [result, setResult] = useState(null);
  const data = result?.role === role ? result.items : null;
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const endpoints = role === 'leader' ? ['/competencies/team', '/competencies/departments'] : ['/competencies', '/recommendations'];
    (async () => {
      try {
        const result = await Promise.all(endpoints.map((path) => client.request(path)));
        if (active) {
          setResult({ role, items: result });
          setError('');
        }
      } catch (failure) {
        if (active) setError(failure.message);
      }
    })();
    return () => { active = false; };
  }, [client, role, version]);

  const refresh = () => setVersion((current) => current + 1);
  const ownProject = role === 'student' ? projects.find((project) => project.memberIds.includes(user.id) && project.title === user.project) : null;
  const projectGroups = new Map();
  if (data && ownProject) {
    for (const person of people.filter(({ id }) => ownProject.memberIds.includes(id))) {
      const group = person.tag || 'Участники';
      const percent = person.id === user.id && data[0].length
        ? Math.round(data[0].reduce((sum, competency) => sum + competency.percent, 0) / data[0].length)
        : null;
      projectGroups.set(group, [...(projectGroups.get(group) || []), [person.id, percent]]);
    }
  }

  return (
    <Layout>
      {error && <p role="alert">{error} <Button size="sm" onClick={refresh}>Повторить</Button></p>}
      {!data && !error && <p role="status">Загрузка…</p>}
      {data && (role === 'leader' ? (
        <div className="comp-layout">
          <TeamPanel departments={data[1]} />
          <LeaderView team={data[0]} />
        </div>
      ) : (
        <div className="comp-layout">
          <TeamPanel departments={Array.from(projectGroups, ([name, members]) => ({ name, members }))} title={ownProject?.title} />
          <StudentView competencies={data[0]} recommendations={data[1]} refresh={refresh} />
        </div>
      ))}
    </Layout>
  );
}
