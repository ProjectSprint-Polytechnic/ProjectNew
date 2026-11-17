// «Главная» — канбан-доска задач (вид руководителя и студента)
import { useState } from 'react';
import { useApp } from '../appContext';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import TaskCard from '../components/TaskCard';
import { AddTaskModal, CommentsModal, NewSectionModal, TaskDetailsModal } from '../components/TaskModals';
import { Empty } from '../components/ui';
import { canEditTask, colorTone, matchTask } from '../taskDisplay';
import './Tasks.css';

export default function Tasks() {
  const { client, tasks, columns, role, user, query, reloadBoard } = useApp();
  const isLeader = role === 'leader';
  const [addTo, setAddTo] = useState(null);
  const [newSection, setNewSection] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [commentsFor, setCommentsFor] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [boardError, setBoardError] = useState('');
  const [moving, setMoving] = useState(false);

  const open = tasks.find((t) => t.id === openId);
  const openCol = open && columns.find((c) => c.id === open.column);
  const update = (id, body) => client.request(`/tasks/${id}`, { method: 'PATCH', body });

  async function refreshBoard() {
    try {
      await reloadBoard();
    } catch (error) {
      setBoardError(error.message);
    }
  }

  async function saveAndRefresh(request) {
    setBoardError('');
    const result = await request();
    await refreshBoard();
    return result;
  }

  async function changeBoard(request) {
    setMoving(true);
    try {
      await saveAndRefresh(request);
    } catch (error) {
      setBoardError(error.message);
    } finally {
      setMoving(false);
    }
  }

  function move(id, column) {
    const task = tasks.find((item) => item.id === id);
    if (moving || !task || task.column === column || !canEditTask(task, user, role)) return;
    return changeBoard(() => update(id, { column }));
  }

  return (
    <Layout>
      {boardError && (
        <div className="task-page-error" role="alert">
          {boardError} <button type="button" onClick={() => { setBoardError(''); refreshBoard(); }}>Обновить доску</button>
        </div>
      )}
      <div className="board">
        {columns.map((col) => {
          const list = tasks.filter((t) => t.column === col.id && matchTask(t, query));
          return (
            <section
              key={col.id}
              className={`column ${dragOver === col.id ? 'is-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); move(Number(e.dataTransfer.getData('text/plain')), col.id); }}
            >
              <header className="column-head" style={{ '--col': col.color }}>
                <span className="column-dot" />
                <h2 className="grow">{col.title}</h2>
                <span className="column-count">{list.length}</span>
                <button onClick={() => setAddTo(col.id)} aria-label={`Добавить задачу в «${col.title}»`}><Icon name="plusCircle" size={20} /></button>
              </header>
              <div className="column-list">
                {list.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    color={colorTone(col.color)}
                    draggable={!moving && canEditTask(t, user, role)}
                    onOpen={() => setOpenId(t.id)}
                    onComments={() => setCommentsFor(t.id)}
                    menu={[
                      ['Открыть', () => setOpenId(t.id)],
                      ['Комментарии', () => setCommentsFor(t.id)],
                      ...(!moving && canEditTask(t, user, role) ? columns.filter((c) => c.id !== col.id).map((c) => [`Переместить в «${c.title}»`, () => move(t.id, c.id)]) : []),
                      ...(!moving && (isLeader || user.id === t.author) ? [
                        ['Удалить задачу', () => changeBoard(() => client.request(`/tasks/${t.id}`, { method: 'DELETE' })), true],
                      ] : []),
                    ]}
                  />
                ))}
                {list.length === 0 && <Empty>{query ? 'Ничего не найдено' : 'Перетащите сюда задачу или нажмите «+»'}</Empty>}
              </div>
            </section>
          );
        })}
        {isLeader && (
          <button className="column-new" onClick={() => setNewSection(true)}>
            <span><Icon name="plus" size={30} stroke={2.4} /></span>
            Создать новый<br />раздел
          </button>
        )}
      </div>

      {addTo && (
        <AddTaskModal column={addTo} isLeader={isLeader} onClose={() => setAddTo(null)}
          onSave={(body) => saveAndRefresh(() => client.request('/tasks', { method: 'POST', body }))} />
      )}
      {newSection && (
        <NewSectionModal isLeader={isLeader} onClose={() => setNewSection(false)}
          onSave={(body) => saveAndRefresh(() => client.request('/columns', { method: 'POST', body }))} />
      )}
      {open && (
        <TaskDetailsModal key={open.id} task={open} color={colorTone(openCol?.color)} onClose={() => setOpenId(null)}
          onChanged={refreshBoard} />
      )}
      {commentsFor && <CommentsModal taskId={commentsFor} onChanged={refreshBoard} onClose={() => setCommentsFor(null)} />}
    </Layout>
  );
}
