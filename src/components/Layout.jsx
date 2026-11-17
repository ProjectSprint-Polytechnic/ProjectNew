import { useEffect, useRef, useState } from 'react';
import { useApp } from '../appContext';
import { navigate, useRoute } from '../router';
import Icon from './Icon';
import { Avatar } from './ui';
import { Logo } from './Graphics';
import GlobalModals from './GlobalModals';
import './Layout.css';

const TABS = [
  ['competencies', 'tabCompetencies'],
  ['tasks', 'tabTasks'],
  ['deadlines', 'tabDeadlines'],
  ['projects', 'tabProjects'],
  ['reports', 'tabDone'],
  ['stats', 'tabStats'],
];

function Item({ icon, label, active, onClick, children, disabled }) {
  const { collapsed } = useApp();
  return (
    <button className={`side-item ${active ? 'is-active' : ''}`} onClick={onClick} disabled={disabled} title={collapsed ? label : undefined}>
      <Icon name={icon} size={22} />
      {!collapsed && <span className="grow">{label}</span>}
      {!collapsed && children}
    </button>
  );
}

function Sidebar({ mobileOpen, onCloseMobile }) {
  const { t, theme, lang, collapsed, setCollapsed, setModal, user, role, updateSettings } = useApp();
  const { section } = useRoute();
  const [langOpen, setLangOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [saving, setSaving] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    const on = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener('mousedown', on);
    return () => document.removeEventListener('mousedown', on);
  }, []);

  async function changeSettings(body) {
    if (saving) return;
    setSaving(true);
    setSettingsError('');
    try {
      await updateSettings(body);
    } catch (error) {
      setSettingsError(error.message);
    } finally {
      setSaving(false);
    }
  }

  const go = (p) => { navigate(p); onCloseMobile(); };
  const mainActive = ['tasks', 'competencies', 'deadlines', 'projects', 'reports', 'stats'].includes(section);

  return (
    <aside className={`sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
      <div className="side-user" ref={menuRef}>
        <button className="side-user-btn" onClick={() => setUserMenu((v) => !v)} aria-haspopup="menu">
          <Avatar person={user} size={40} />
          {!collapsed && (
            <span className="grow">
              <b>{user.name}</b>
              <small className="muted">{user.email}</small>
            </span>
          )}
        </button>
        {userMenu && (
          <div className="side-menu" role="menu">
            <button onClick={() => { setUserMenu(false); go('/profile'); }}><Icon name="user" size={18} /> Профиль</button>
            <div className="side-menu-label">{role === 'leader' ? 'Руководитель' : 'Студент'}</div>
          </div>
        )}
      </div>

      <button className="side-motivation" onClick={() => setModal('motivation')} title={collapsed ? 'Мотивация от лидера' : undefined}>
        <Icon name="star" size={22} />
        {!collapsed && <span style={{ whiteSpace: 'pre-line' }}>{t('motivation')}</span>}
      </button>

      <div className="side-group-title">{collapsed ? <hr /> : <>{t('basic')}<hr /></>}</div>
      <Item icon="grid" label={t('main')} active={mainActive} onClick={() => go('/tasks')} />
      <Item icon="theme" label={theme === 'light' ? t('theme') : t('themeDark')} disabled={saving} onClick={() => changeSettings({ theme: theme === 'light' ? 'dark' : 'light' })} />
      <Item icon="message" label={t('messages')} active={section === 'chats'} onClick={() => go('/chats')} />
      <Item icon="settings" label={t('settings')} onClick={() => setModal('settings')} />

      <div className="side-group-title">{collapsed ? <hr /> : <>{t('extra')}<hr /></>}</div>
      <div className="side-lang">
        <Item icon="globe" label={t('lang')} active={langOpen} disabled={saving} onClick={() => (collapsed ? changeSettings({ lang: lang === 'ru' ? 'en' : 'ru' }) : setLangOpen((v) => !v))}>
          <Icon name={langOpen ? 'chevronUp' : 'chevronDown'} size={18} />
        </Item>
        {langOpen && !collapsed && (
          <div className="side-lang-list">
            {[['ru', 'Русский'], ['en', 'English']].map(([k, l]) => (
              <button key={k} className={lang === k ? 'is-sel' : ''} disabled={saving} onClick={() => { changeSettings({ lang: k }); setLangOpen(false); }}>{l}</button>
            ))}
          </div>
        )}
      </div>
      <Item icon="book" label={t('reference')} onClick={() => setModal('reference')} />
      <Item icon="help" label={t('help')} onClick={() => setModal('help')} />

      {settingsError && <small role="alert" className="side-menu-label">{settingsError}</small>}

      <div className="side-bottom">
        <Logo compact={collapsed} />
        <button className="side-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}>
          <Icon name={collapsed ? 'chevronsRight' : 'chevronsLeft'} size={20} />
        </button>
      </div>
    </aside>
  );
}

export function Tabs({ extra }) {
  const { t, query, setQuery } = useApp();
  const { section } = useRoute();
  return (
    <div className="tabs-row">
      <nav className="tabs" aria-label="Разделы">
        {TABS.map(([id, key]) => (
          <a key={id} href={'#/' + id} className={`tab ${section === id ? 'is-active' : ''}`}>{t(key)}</a>
        ))}
      </nav>
      <label className="kw-search">
        <Icon name="search" size={16} />
        <input placeholder={t('keywords')} value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && <button onClick={() => setQuery('')} aria-label="Очистить"><Icon name="x" size={14} /></button>}
      </label>
      {extra}
    </div>
  );
}

export default function Layout({ children, tabs = true, searchPlaceholder, topLeft }) {
  const { t, query, setQuery, collapsed } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className={`app ${collapsed ? 'side-collapsed' : ''}`}>
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      {mobileOpen && <div className="side-scrim" onClick={() => setMobileOpen(false)} />}
      <main className="main">
        <div className="topbar">
          <button className="burger" onClick={() => setMobileOpen(true)} aria-label="Меню"><Icon name="menu" size={22} /></button>
          {topLeft}
          <label className="global-search">
            <Icon name="search" size={24} />
            <input placeholder={searchPlaceholder || t('search')} value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
        {tabs && <Tabs />}
        <div className="content">{children}</div>
      </main>
      <GlobalModals />
    </div>
  );
}
