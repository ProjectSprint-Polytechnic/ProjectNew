// Окна, которые открываются из бокового меню: Настройки, Помощь, Справка, Мотивация
import { useEffect, useState } from 'react';
import { useApp } from '../appContext';
import { navigate } from '../router';
import Modal from './Modal';
import Icon from './Icon';
import { Avatar, Button, Field, FileDrop, Textarea, Toggle, Input } from './ui';
import { CommentCard } from './TaskModals';
import './GlobalModals.css';

function Settings({ onClose }) {
  const { client, user, reloadUser, notify, updateSettings, logout, uploadFiles } = useApp();
  const [tab, setTab] = useState('account');
  const [edit, setEdit] = useState(null);
  const [value, setValue] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function run(operation) {
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

  function beginEdit(key) {
    setError('');
    setEdit(key);
    setValue(key === 'password' ? '' : user[key] || '');
    setOldPassword('');
  }

  function saveEdit(event) {
    event.preventDefault();
    run(async () => {
      if (edit === 'password') {
        await client.request('/me/password', { method: 'POST', body: { oldPassword, newPassword: value } });
      } else {
        await client.request('/me', { method: 'PATCH', body: { [edit]: value.trim() } });
        await reloadUser();
      }
      setEdit(null);
      setOldPassword('');
      setValue('');
    });
  }

  const setN = (key, checked) => run(() => updateSettings({ notify: { [key]: checked } }));
  const allEnabled = ['messages', 'email', 'tasks', 'comments', 'deadlines'].every((key) => notify[key]);
  const row = (key, icon, title, type) => (
    <div className="set-row">
      <Icon name={icon} size={22} />
      <div className="grow">
        <b>{title}</b>
        {edit === key ? (
          <form onSubmit={saveEdit} className="settings-edit">
            {key === 'password' && <Input placeholder="Текущий пароль" aria-label="Текущий пароль" type="password" autoComplete="current-password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />}
            <Input autoFocus value={value} type={type} aria-label={key === 'password' ? 'Новый пароль' : title}
              placeholder={key === 'password' ? 'Новый пароль' : undefined}
              autoComplete={key === 'password' ? 'new-password' : undefined}
              maxLength={key === 'phone' ? 32 : 255} minLength={key === 'password' ? 6 : undefined} required={key === 'password'}
              onChange={(e) => setValue(e.target.value)} className="set-input" />
            <div className="row">
              <Button size="sm" disabled={pending}>Сохранить</Button>
              <Button variant="ghost" size="sm" type="button" disabled={pending} onClick={() => setEdit(null)}>Отмена</Button>
            </div>
          </form>
        ) : <small className="muted">{key === 'password' ? '••••••••' : user[key] || '—'}</small>}
      </div>
      {edit !== key && <button className="icon-btn" disabled={pending} onClick={() => beginEdit(key)} aria-label={`Изменить ${title}`}>
        <Icon name="pencil" size={18} />
      </button>}
    </div>
  );
  return (
    <Modal open onClose={onClose} width={634} className="settings-modal">
      <div className="settings">
        <div className="settings-nav">
          <h2>Настройки</h2>
          <button className={tab === 'account' ? 'is-active' : ''} onClick={() => setTab('account')}><Icon name="userCircle" size={20} /> Аккаунт</button>
          <button className={tab === 'notify' ? 'is-active' : ''} onClick={() => setTab('notify')}><Icon name="bell" size={20} /> Уведомления</button>
        </div>
        <div className="settings-body">
          {tab === 'account' ? (
            <>
              <h3>Личные данные</h3>
              {row('email', 'mail', 'Email', 'email')}
              {row('phone', 'phone', 'Телефон', 'tel')}
              {row('password', 'dots', 'Пароль', 'password')}
              <div className="set-row">
                <Avatar person={user} size={24} />
                <div className="grow"><b>Фото профиля</b><small className="muted">Смена аватара</small></div>
                <label className="icon-btn" aria-label="Загрузить фото"><Icon name="pencil" size={18} /><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden disabled={pending} onChange={(event) => {
                  const file = event.target.files[0];
                  event.target.value = '';
                  if (!file) return;
                  run(async () => {
                    if (!file.type.startsWith('image/')) throw new Error('Выберите изображение.');
                    const [avatar] = await uploadFiles([file]);
                    await client.request('/me', { method: 'PATCH', body: { avatarId: avatar.id } });
                    await reloadUser();
                  });
                }} /></label>
              </div>
            </>
          ) : (
            <>
              <h3>Каналы уведомлений</h3>
              <Toggle label="Все" checked={allEnabled} onChange={(v) => setN('all', v)} />
              <hr className="set-hr" />
              <Toggle label="Сообщения" checked={notify.messages} onChange={(v) => setN('messages', v)} />
              <Toggle label="Email-рассылка" checked={notify.email} onChange={(v) => setN('email', v)} />
              <Toggle label="Изменения в задачах" checked={notify.tasks} onChange={(v) => setN('tasks', v)} />
              <Toggle label="Комментарии к задачам" checked={notify.comments} onChange={(v) => setN('comments', v)} />
              <Toggle label="Приближение дедлайнов" checked={notify.deadlines} onChange={(v) => setN('deadlines', v)} />
            </>
          )}
          {error && <p role="alert" className="muted">{error}</p>}
          <button className="logout" disabled={pending} onClick={logout}>
            <Icon name="logout" size={16} /> Выйти из аккаунта
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Help({ onClose }) {
  const { client, uploadFiles } = useApp();
  const [sent, setSent] = useState(false);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    setPending(true);
    setError('');
    try {
      const uploaded = await uploadFiles(files);
      await client.request('/help', { method: 'POST', body: { text: text.trim(), files: uploaded.map((file) => file.id) } });
      setSent(true);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Помощь" width={714}>
      {sent ? (
        <div className="help-done">
          <p>Обращение отправлено.</p>
        </div>
      ) : (
        <>
          <Field label="Опишите проблему">
            <Textarea maxLength={10000} placeholder="В подробностях опишите вашу проблему, приложите медиафайлы (если требуется)" value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Field label="Добавить файлы"><span /></Field>
          <FileDrop files={files} onFiles={setFiles} />
        </>
      )}
      {error && <p role="alert" className="muted">{error}</p>}
      {sent
        ? <Button variant="light" size="lg" block onClick={() => { setSent(false); setText(''); setFiles([]); }}>Описать ещё одну проблему</Button>
        : <Button variant="light" size="lg" block disabled={pending || !text.trim()} onClick={send}>Отправить</Button>}
    </Modal>
  );
}

const faq = [
  ['Как добавить задачу?', 'На вкладке «Задачи» нажмите «+» в заголовке колонки. Руководитель может назначить исполнителя, сроки и хештеги.'],
  ['Как создать новый раздел на доске?', 'Нажмите на серую колонку «Создать новый раздел» справа от доски и выберите цвет.'],
  ['Как прикрепить отчёт?', 'Откройте «Выполненные задачи» → «Мои отчёты» → кнопка «+». Выберите выполненную задачу и добавьте файлы.'],
  ['Где посмотреть свой прогресс?', 'В профиле на вкладке «Прогресс обучения» или в разделе «Компетенции».'],
  ['Как сменить тему или язык?', 'В боковом меню: «Светлая тема» переключает оформление, «Русский» — язык интерфейса.'],
];

function Reference({ onClose }) {
  const [open, setOpen] = useState(0);
  return (
    <Modal open onClose={onClose} title="Справка" width={714}>
      <div className="faq">
        {faq.map(([q, a], i) => (
          <div key={i} className={`faq-item ${open === i ? 'is-open' : ''}`}>
            <button onClick={() => setOpen(open === i ? -1 : i)}>
              <span className="grow">{q}</span>
              <Icon name={open === i ? 'chevronUp' : 'chevronDown'} size={18} />
            </button>
            {open === i && <p>{a}</p>}
          </div>
        ))}
      </div>
    </Modal>
  );
}

function Motivation({ onClose }) {
  const { client } = useApp();
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const items = await client.request('/recommendations');
        if (active) setRecommendations(items);
      } catch (failure) {
        if (active) setError(failure.message);
      }
    })();
    return () => { active = false; };
  }, [client]);

  return (
    <Modal open onClose={onClose} title="Мотивация от лидера" width={560}>
      {error && <p role="alert">{error}</p>}
      {!recommendations && !error && <p role="status">Загрузка…</p>}
      {recommendations?.length === 0 && <p className="muted">Рекомендаций пока нет.</p>}
      {recommendations?.map((item) => <CommentCard key={item.id} c={item} title="Рекомендация" />)}
      <Button variant="dark" size="lg" block onClick={() => { onClose(); navigate('/tasks'); }}>К задачам</Button>
    </Modal>
  );
}

export default function GlobalModals() {
  const { modal, setModal } = useApp();
  const close = () => setModal(null);
  if (modal === 'settings') return <Settings onClose={close} />;
  if (modal === 'help') return <Help onClose={close} />;
  if (modal === 'reference') return <Reference onClose={close} />;
  if (modal === 'motivation') return <Motivation onClose={close} />;
  return null;
}
