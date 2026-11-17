// Окна задач: добавление, новый раздел, подробности, комментарии
import { useEffect, useState } from 'react';
import Modal from './Modal';
import Icon from './Icon';
import { Avatar, Button, Chip, DateInput, DocList, Field, Input, PersonChip, Progress, Select } from './ui';
import { useApp } from '../appContext';
import { canEditTask } from '../taskDisplay';
import './TaskModals.css';

const fmt = (d) => (d ? d.split('-').reverse().join('/') : '—');

function useTaskSubmission() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(action) {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await action();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }
  return { pending, error, submit };
}

export function PeopleSelect({ value, onChange, multiple, placeholder }) {
  const { people } = useApp();
  return (
    <Select
      value={value}
      onChange={onChange}
      multiple={multiple}
      placeholder={placeholder}
      options={people.map((p) => ({ value: p.id, label: p.name, group: p.group }))}
      renderOption={(o) => (
        <>
          <Avatar id={o.value} size={34} />
          <span className="grow" style={{ fontSize: 16 }}>{o.label}</span>
          {o.group && <Chip>{o.group}</Chip>}
        </>
      )}
    />
  );
}

function TaskFields({ v, set, withAssignee }) {
  const { meta } = useApp();
  return (
    <>
      <Field label="Название задачи">
        <Input placeholder="Например: Написать программу" value={v.title} maxLength={255} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <Field label="Описание">
        <Input placeholder="Опишите поставленную задачу" value={v.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>
      {withAssignee && (
        <Field label="Исполнитель задачи">
          <PeopleSelect value={v.assignee} onChange={(assignee) => set({ assignee })} />
        </Field>
      )}
      <div className="field">
        <span className="field-label">Срок выполнения</span>
        <span className="field-sub">Начало</span>
        <DateInput value={v.start} onChange={(start) => set({ start })} />
        <span className="field-sub">Окончание</span>
        <DateInput value={v.end} onChange={(end) => set({ end })} />
      </div>
      <Field label="Выберите хештег">
        <Select multiple value={v.tags} onChange={(tags) => set({ tags })} placeholder="Хештеги"
          options={meta.hashtags.map((h) => ({ value: h, label: h }))} />
      </Field>
    </>
  );
}

const emptyTask = () => ({ title: '', description: '', assignee: null, start: '', end: '', tags: [] });
const taskPayload = (task) => ({ ...task, assignee: task.assignee ?? undefined });

export function AddTaskModal({ column, isLeader, onClose, onSave }) {
  const [v, setV] = useState(emptyTask);
  const set = (p) => setV((s) => ({ ...s, ...p }));
  const { pending, error, submit } = useTaskSubmission();
  return (
    <Modal open onClose={pending ? undefined : onClose} title="Добавить новую задачу">
      <TaskFields v={v} set={set} withAssignee={isLeader} />
      {error && <p className="task-error" role="alert">{error}</p>}
      <Button variant="light" size="lg" block disabled={pending || !v.title.trim()}
        onClick={() => submit(async () => {
          await onSave({ ...taskPayload(v), column });
          onClose();
        })}>ДОБАВИТЬ</Button>
    </Modal>
  );
}

export function NewSectionModal({ isLeader, onClose, onSave }) {
  const { meta } = useApp();
  const [name, setName] = useState('');
  const [color, setColor] = useState(null);
  const [v, setV] = useState(emptyTask);
  const set = (p) => setV((s) => ({ ...s, ...p }));
  const { pending, error, submit } = useTaskSubmission();
  return (
    <Modal open onClose={pending ? undefined : onClose} title="Создайте новый раздел">
      <Field label="Название">
        <Input placeholder="Например: В планах" value={name} maxLength={128} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Выберите цвет">
        <Select value={color} onChange={setColor} placeholder="Цвет"
          options={meta.columnColors.map((c) => ({ value: c.value, label: c.label, icon: <i className="color-dot" style={{ background: c.value }} /> }))} />
      </Field>
      <hr className="sep" />
      <TaskFields v={v} set={set} withAssignee={isLeader} />
      {error && <p className="task-error" role="alert">{error}</p>}
      <Button variant="light" size="lg" block disabled={pending || !name.trim()}
        onClick={() => submit(async () => {
          await onSave({
            title: name,
            color: color || meta.columnColors[2]?.value || '#4646f4',
            task: v.title.trim() ? taskPayload(v) : undefined,
          });
          onClose();
        })}>
        СОЗДАТЬ
      </Button>
    </Modal>
  );
}

export function TaskDetailsModal({ task, color, onClose, onChanged, notesMode, readOnly = false }) {
  const { client, user, role, downloadFile } = useApp();
  const [docs, setDocs] = useState(task.docs || []);
  const [progress, setProgress] = useState(task.progress);
  const [savedProgress, setSavedProgress] = useState(task.progress);
  const { pending, error, submit } = useTaskSubmission();
  const editable = !readOnly && canEditTask(task, user, role);

  function saveProgress() {
    submit(async () => {
      const updated = await client.request(`/tasks/${task.id}`, { method: 'PATCH', body: { progress } });
      setSavedProgress(updated.progress);
      setProgress(updated.progress);
      await onChanged?.();
    });
  }

  function removeDoc(index) {
    submit(async () => {
      await client.request(`/files/${docs[index].id}`, { method: 'DELETE' });
      setDocs((current) => current.filter((_, i) => i !== index));
      await onChanged?.();
    });
  }

  return (
    <Modal open onClose={pending ? undefined : onClose} title={task.title}>
      {!notesMode && (
        <div className="field">
          <span className="field-label">Прогресс</span>
          <div className="progress-edit">
            <Progress value={progress} color={color} />
            {editable && <>
              <input type="range" min="0" max="100" value={progress} disabled={pending}
                onChange={(e) => setProgress(Number(e.target.value))} aria-label="Изменить прогресс" />
              <Button variant="light" disabled={pending || progress === savedProgress} onClick={saveProgress}>Сохранить прогресс</Button>
            </>}
          </div>
        </div>
      )}
      <Field label="Описание"><div className="readbox">{task.description}</div></Field>
      {notesMode && <Field label="Заметки"><div className="readbox">{task.notes}</div></Field>}
      <div className="field">
        <span className="field-label">Исполнитель задачи</span>
        <div><PersonChip id={task.assignee} /></div>
      </div>
      <div className="field">
        <span className="field-label">Срок выполнения</span>
        <span className="field-sub">Начало</span>
        <div className="readbox row"><Icon name="calendar" size={16} />{fmt(task.start)}</div>
        <span className="field-sub">Окончание</span>
        <div className="readbox row"><Icon name="calendar" size={16} />{fmt(task.end)}</div>
      </div>
      <div className="field">
        <span className="field-label">Хештеги</span>
        <div className="tags">{task.tags.map((t) => <Chip key={t} className="chip-white tag-lg">{t}</Chip>)}</div>
      </div>
      <DocList title="Прикреплённые документы" docs={docs}
        onDownload={downloadFile} onRemove={editable && !pending ? removeDoc : undefined} />
      {error && <p className="task-error" role="alert">{error}</p>}
    </Modal>
  );
}

export function CommentsModal({ taskId, onChanged, onClose }) {
  const { client } = useApp();
  const [list, setList] = useState(null);
  const [text, setText] = useState('');
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const { pending, error, submit } = useTaskSubmission();
  const path = `/tasks/${taskId}/comments`;

  useEffect(() => {
    let current = true;
    client.request(path).then((comments) => {
      if (current) setList(comments);
    }).catch((failure) => {
      if (current) setLoadError(failure.message);
    });
    return () => { current = false; };
  }, [attempt, client, path]);

  function send() {
    if (!list || !text.trim()) return;
    submit(async () => {
      const comment = await client.request(path, { method: 'POST', body: { text } });
      setList((current) => [comment, ...current]);
      setText('');
      await onChanged?.();
    });
  }

  return (
    <Modal open onClose={pending ? undefined : onClose} title="Комментарии">
      {list ? (
        <div className="comment-new">
          <Input placeholder="Оставьте комментарий" maxLength={5000} value={text} disabled={pending}
            onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
          <Button variant="dark" disabled={pending || !text.trim()} onClick={send} aria-label="Отправить"><Icon name="send" size={18} /></Button>
        </div>
      ) : loadError ? (
        <p className="task-error" role="alert">{loadError} <button type="button"
          onClick={() => { setLoadError(''); setAttempt((value) => value + 1); }}>Повторить</button></p>
      ) : (
        <p role="status">Загрузка комментариев…</p>
      )}
      {error && <p className="task-error" role="alert">{error}</p>}
      {list?.length === 0 && <p>Комментариев пока нет</p>}
      {list?.map((c) => <CommentCard key={c.id} c={c} />)}
    </Modal>
  );
}

export function CommentCard({ c, title = 'Содержимое', faded }) {
  const { people, downloadFile } = useApp();
  const p = people.find((person) => person.id === c.from);
  return (
    <div className={`comment ${faded ? 'is-faded' : ''}`}>
      <div className="comment-head">
        <div className="comment-from">
          <small>Отправитель</small>
          <span className="row"><Avatar id={c.from} size={26} /><b>{p?.name || 'Пользователь удалён'}</b></span>
        </div>
        <div className="row">
          <Chip>{c.date}</Chip>
          {typeof c.isNew === 'boolean' && (c.isNew ? <Chip tone="lilac">Новое</Chip> : <Chip>Просмотрено</Chip>)}
        </div>
      </div>
      <div className="comment-body">
        <small>{title}</small>
        <p>{c.text} {c.link && <a href={c.link.href} className="link-red">{c.link.label}</a>}</p>
        {c.files?.length > 0 && <DocList docs={c.files} onDownload={downloadFile} />}
      </div>
    </div>
  );
}
