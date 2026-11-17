// «Выполненные задачи» + «Мои отчёты»
import { useEffect, useState } from 'react';
import { useApp } from '../appContext';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';
import { Button, Empty, Field, FileDrop, Select, Textarea } from '../components/ui';
import { CommentsModal, TaskDetailsModal } from '../components/TaskModals';
import { matchTask } from '../taskDisplay';
import './Reports.css';

function AddReport({ tasks, initialTaskId, onClose, onSave }) {
  const [taskId, setTaskId] = useState(initialTaskId);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!taskId || pending) return;
    setPending(true);
    setError('');
    try {
      await onSave({ taskId, notes, files });
      onClose();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open onClose={pending ? undefined : onClose} title="Добавить отчёт">
      <Select value={taskId} onChange={setTaskId} placeholder="Выберите выполненную задачу" options={tasks.map((t) => ({ value: t.id, label: t.title }))} />
      <Field label="Заметки"><Textarea placeholder="Напишите желаемые заметки" value={notes} maxLength={10000} disabled={pending} onChange={(e) => setNotes(e.target.value)} /></Field>
      <div className="field"><span className="field-label">Добавить файлы</span><FileDrop files={files} onFiles={setFiles} /></div>
      {error && <p className="task-error" role="alert">{error}</p>}
      <Button variant="light" size="lg" block disabled={pending || !taskId} onClick={submit}>ДОБАВИТЬ</Button>
    </Modal>
  );
}

export default function Reports() {
  const { client, tasks, query, reloadBoard, uploadFiles } = useApp();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [adding, setAdding] = useState(null);
  const [openTask, setOpenTask] = useState(null);
  const [openReport, setOpenReport] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);
  const done = tasks.filter((t) => t.completedAt || t.progress === 100);
  const shown = done.filter((t) => matchTask(t, query));
  const task = done.find((t) => t.id === openTask);
  const report = reports.find((r) => r.id === openReport);
  const reportTask = report && tasks.find((t) => t.id === report.taskId);

  useEffect(() => {
    let current = true;
    client.request('/reports').then((result) => {
      if (current) setReports(result);
    }).catch((failure) => {
      if (current) setError(failure.message);
    }).finally(() => {
      if (current) setLoading(false);
    });
    return () => { current = false; };
  }, [attempt, client]);

  async function saveReport({ taskId, notes, files }) {
    const uploaded = files.length ? await uploadFiles(files) : [];
    try {
      const created = await client.request('/reports', {
        method: 'POST',
        body: { taskId, notes, files: uploaded.map((file) => file.id) },
      });
      setReports((current) => [created, ...current]);
    } catch (failure) {
      if (failure.status >= 400 && failure.status < 500) {
        await Promise.allSettled(uploaded.map((file) => client.request(`/files/${file.id}`, { method: 'DELETE' })));
      }
      throw failure;
    }
  }

  async function refreshBoard() {
    try {
      await reloadBoard();
    } catch (failure) {
      setError(failure.message);
    }
  }

  return (
    <Layout>
      <div className="rep-layout">
        <aside className="rep-side">
          <div className="rep-side-head">Мои отчёты</div>
          <div className="rep-list">
            {loading && <p role="status">Загрузка отчётов…</p>}
            {error && <p className="task-error" role="alert">{error} <button type="button"
              onClick={() => { setError(''); setLoading(true); setAttempt((value) => value + 1); }}>Повторить</button></p>}
            {reports.map((r) => (
              <div className="rep-card" key={r.id}>
                <h3 className="clamp-2">{r.title}</h3>
                <p>Дата выполнения: {r.date}</p>
                <button className="rep-open" onClick={() => setOpenReport(r.id)}>Открыть отчёт</button>
              </div>
            ))}
          </div>
          <button className="rep-add" disabled={loading} onClick={() => setAdding({ taskId: null })} aria-label="Добавить отчёт"><span><Icon name="plus" size={16} stroke={2.6} /></span></button>
        </aside>
        <section className="rep-main">
          <header className="column-head" style={{ '--col': 'var(--blue)' }}><span className="column-dot" /><h2 className="grow">Выполненные задачи</h2><span className="column-count">{shown.length}</span></header>
          <div className="rep-grid">
            {shown.map((t) => (
              <TaskCard key={t.id} task={t} color="blue" compact onOpen={() => setOpenTask(t.id)} onComments={() => setCommentsFor(t.id)}
                menu={[['Открыть', () => setOpenTask(t.id)], ...(!loading ? [['Создать отчёт', () => setAdding({ taskId: t.id })]] : [])]} />
            ))}
          </div>
          {shown.length === 0 && <Empty>Нет выполненных задач</Empty>}
        </section>
      </div>
      {adding && (
        <AddReport tasks={done} initialTaskId={adding.taskId} onClose={() => setAdding(null)} onSave={saveReport} />
      )}
      {task && <TaskDetailsModal key={task.id} task={task} color="blue" notesMode onClose={() => setOpenTask(null)} onChanged={refreshBoard} />}
      {report && (
        <TaskDetailsModal key={`report-${report.id}`} task={{ tags: [], ...reportTask, title: report.title, notes: report.notes, docs: report.files }}
          color="blue" notesMode readOnly onClose={() => setOpenReport(null)} />
      )}
      {commentsFor && <CommentsModal taskId={commentsFor} onChanged={refreshBoard} onClose={() => setCommentsFor(null)} />}
    </Layout>
  );
}
