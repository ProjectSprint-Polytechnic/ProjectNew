import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { Avatar, Progress } from './ui';
import { daysWord } from '../taskDisplay';
import './TaskCard.css';

export function CardMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', on);
    return () => document.removeEventListener('mousedown', on);
  }, []);
  return (
    <div className="card-menu" ref={ref}>
      <button className="card-more" onClick={(e) => { e.stopPropagation(); setOpen(!open); }} aria-label="Действия"><Icon name="more" size={20} /></button>
      {open && (
        <div className="card-menu-list" onClick={(e) => e.stopPropagation()}>
          {items.map(([label, fn, danger]) => (
            <button key={label} className={danger ? 'danger' : ''} onClick={() => { setOpen(false); fn(); }}>{label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TaskCard({ task, color = 'red', onOpen, onComments, menu, draggable, compact }) {
  return (
    <article
      className={`task-card ${compact ? 'is-compact' : ''}`}
      onClick={onOpen}
      draggable={draggable}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(task.id)); e.currentTarget.classList.add('is-dragging'); }}
      onDragEnd={(e) => e.currentTarget.classList.remove('is-dragging')}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onOpen?.();
        }
      }}
    >
      <div className="task-top">
        {!compact && <Avatar id={task.assignee} size={28} />}
        {menu && <CardMenu items={menu} />}
      </div>
      <h3 className={compact ? 'task-title-c' : ''}>{task.title}</h3>
      <p className="task-desc clamp-2">{task.description}</p>
      <div className="task-progress">
        <b>Прогресс</b>
        <Progress value={task.progress} color={color} />
      </div>
      <div className="task-foot">
        <span className="task-chip square" title={task.tags.join(', ')}><Icon name="hash" size={18} /></span>
        <button className="task-chip" onClick={(e) => { e.stopPropagation(); onComments?.(); }} aria-label="Комментарии">
          <Icon name="comment" size={18} /> {task.comments}
        </button>
        <span className="task-chip push">{task.days == null ? 'Без срока' : `${task.days} ${daysWord(task.days)}`}</span>
      </div>
    </article>
  );
}
