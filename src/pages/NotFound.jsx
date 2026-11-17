// Страница ошибки 404
import { useState } from 'react';
import { useApp } from '../appContext';
import Icon from '../components/Icon';
import { Art404, Logo } from '../components/Graphics';
import '../components/ui.css';
import './NotFound.css';

export default function NotFound() {
  const { authed, setModal } = useApp();
  const [q, setQ] = useState('');
  return (
    <div className="nf">
      <header className="nf-top">
        <a href="#/"><Logo size={44} /></a>
        <form className="nf-search" onSubmit={(e) => { e.preventDefault(); window.location.hash = authed ? '/tasks' : '/login'; }}>
          <Icon name="search" size={18} />
          <input placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
      </header>
      <div className="nf-art"><Art404 /></div>
      <div className="nf-bottom">
        <h1>Страница не найдена</h1>
        <a className="btn btn-dark" href={authed ? '#/tasks' : '#/login'}>На главную</a>
      </div>
      <button className="nf-help" onClick={() => (authed ? setModal('help') : (window.location.hash = '/login'))} aria-label="Помощь"><Icon name="message" size={22} /></button>
    </div>
  );
}
