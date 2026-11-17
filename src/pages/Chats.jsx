// «Сообщения»: список чатов, переписка, новый чат, вложения
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useApp } from '../appContext';
import { navigate, useRoute } from '../router';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import { Avatar, Button, Chip, DocList, Field, FileDrop, Input } from '../components/ui';
import './Chats.css';

const narrow = '(max-width: 800px)';
const isNarrow = () => window.matchMedia?.(narrow)?.matches ?? false;
function subscribeWidth(callback) {
  const media = window.matchMedia?.(narrow);
  media?.addEventListener('change', callback);
  return () => media?.removeEventListener('change', callback);
}

function ChatAvatar({ chat, size = 40 }) {
  const { people } = useApp();
  const person = people.find(({ id }) => id === chat.person);
  if (person) return <Avatar person={person} size={size} />;
  const letters = chat.title.trim().split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase();
  return <span className="group-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>{letters}</span>;
}

function NewChat({ onClose, onCreated }) {
  const { client, people, projects, role, user } = useApp();
  const [mode, setMode] = useState('direct');
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const q = query.trim().toLowerCase();
  const list = people.filter((person) => person.id !== user.id && person.name.toLowerCase().includes(q));
  const linkedProjects = projects.filter((project) => (role === 'leader' || project.memberIds.includes(user.id)) && project.title.toLowerCase().includes(q));

  async function create(body) {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      const chat = await client.request('/chats', { method: 'POST', body });
      onCreated(chat);
    } catch (failure) {
      setError(failure.message);
      setPending(false);
    }
  }

  function selectPerson(id) {
    if (mode === 'direct') {
      void create({ person: id });
      return;
    }
    setMembers((current) => current.includes(id) ? current.filter((member) => member !== id) : [...current, id]);
  }

  function selectMode(next) {
    setMode(next);
    setQuery('');
    setError('');
  }

  return (
    <Modal open onClose={() => { if (!pending) onClose(); }} width={560} title="Новый чат" className="newchat">
      <label className="newchat-search"><input placeholder="Поиск" value={query} onChange={(e) => setQuery(e.target.value)} /><Icon name="search" size={20} /></label>
      <div className="newchat-types">
        <button disabled={pending} aria-pressed={mode === 'direct'} onClick={() => selectMode('direct')}><Icon name="user" size={18} /> Личный чат</button>
        <button disabled={pending} aria-pressed={mode === 'group'} onClick={() => selectMode('group')}><Icon name="users" size={18} /> Групповой чат</button>
        <button disabled={pending} aria-pressed={mode === 'project'} onClick={() => selectMode('project')}><Icon name="paperclip" size={18} /> Чат проекта</button>
      </div>
      {mode === 'group' && <Field label="Название группы">
        <Input value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} />
      </Field>}
      <h3 className="newchat-sub">{mode === 'project' ? 'Проекты' : 'Участники'}</h3>
      <div className="newchat-people">
        {mode === 'project' ? linkedProjects.map((project) => (
          <button disabled={pending} key={project.id} onClick={() => create({ projectId: project.id })}>{project.title}</button>
        )) : list.map((person) => (
          <button disabled={pending} key={person.id} onClick={() => selectPerson(person.id)}
            aria-pressed={mode === 'group' ? members.includes(person.id) : undefined}>
            <Avatar person={person} size={40} />
            <span className="grow">{person.name}</span>
            {person.role && <Chip tone="lilac">{person.role}</Chip>}
            {person.tag && <Chip>{person.tag}</Chip>}
          </button>
        ))}
        {(mode === 'project' ? linkedProjects : list).length === 0 && <p className="muted">Ничего не найдено.</p>}
      </div>
      {error && <p role="alert">{error}</p>}
      {mode === 'group' && <Button block disabled={pending || !title.trim() || members.length === 0}
        onClick={() => create({ title: title.trim(), isGroup: true, members })}>Создать группу</Button>}
      {pending && <p role="status">Открываем чат…</p>}
    </Modal>
  );
}

function mergeMessages(current, next) {
  return [...new Map([...current, ...next].map((message) => [message.id, message])).values()]
    .sort((first, second) => first.id - second.id);
}

const PAGE_SIZE = 100;
const POLL_INTERVAL = 5000;
const nameColors = ['#3b82f6', '#8b5cf6', '#059669', '#d97706'];

function ChatThread({ chat, onRead, onMessage }) {
  const { client, people, uploadFiles, downloadFile } = useApp();
  const path = `/chats/${chat.id}/messages`;
  const [messages, setMessages] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [attach, setAttach] = useState(false);
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState('');
  const [findOpen, setFindOpen] = useState(false);
  const [find, setFind] = useState('');
  const [findResult, setFindResult] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const endRef = useRef(null);
  const lastId = useRef(0);
  const query = find.trim();
  const shown = query ? (findResult?.query === query ? findResult.items : null) : messages;
  const finalMessage = shown?.at(-1)?.id;

  useEffect(() => {
    let active = true;
    let timer;
    async function poll() {
      const after = lastId.current;
      try {
        const result = await client.request(`${path}?limit=${PAGE_SIZE}${after ? '&after=' + after : ''}`);
        if (!active) return;
        if (!after) setHasOlder(result.length >= PAGE_SIZE);
        lastId.current = Math.max(lastId.current, result.at(-1)?.id || 0);
        setMessages((current) => mergeMessages(current || [], result));
        setHistoryError('');
        if (result.length) onRead(chat.id);
      } catch (failure) {
        if (active) setHistoryError(failure.message);
      } finally {
        if (active) timer = setTimeout(poll, POLL_INTERVAL);
      }
    }
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [client, path, onRead, chat.id]);

  useEffect(() => {
    if (!query) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const items = await client.request(`${path}?q=${encodeURIComponent(query)}`);
        if (active) setFindResult({ query, items });
      } catch (failure) {
        if (active) setFindResult({ query, items: [], error: failure.message });
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [client, path, query]);

  useEffect(() => {
    if (!query) endRef.current?.scrollIntoView({ block: 'end' });
  }, [finalMessage, query]);

  async function loadOlder() {
    if (loadingOlder || !messages?.length) return;
    setLoadingOlder(true);
    setActionError('');
    try {
      const older = await client.request(`${path}?before=${messages[0].id}&limit=${PAGE_SIZE}`);
      setMessages((current) => mergeMessages(current, older));
      setHasOlder(older.length >= PAGE_SIZE);
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setLoadingOlder(false);
    }
  }

  async function send(event) {
    event.preventDefault();
    if (sending || (!text.trim() && files.length === 0)) return;
    setSending(true);
    setActionError('');
    try {
      const queued = files.filter((file) => !file.id);
      const uploaded = queued.length ? await uploadFiles(queued) : [];
      const attachments = [...files.filter((file) => file.id), ...uploaded];
      setFiles(attachments);
      const message = await client.request(path, {
        method: 'POST',
        body: { text: text.trim(), files: attachments.map((file) => file.id) },
      });
      setMessages((current) => mergeMessages(current || [], [message]));
      setText('');
      setFiles([]);
      onMessage(chat.id, message);
    } catch (failure) {
      setActionError(failure.message);
    } finally {
      setSending(false);
    }
  }


  return (
    <section className="chat-panel">
      <header className="chat-head">
        <button className="chat-back" onClick={() => navigate('/chats')} aria-label="Назад к списку"><Icon name="chevronsLeft" size={20} /></button>
        <ChatAvatar chat={chat} size={48} />
        <div className="grow">
          <b>{chat.title}</b>
          {chat.isGroup && <small className="muted">Участники: {chat.members}</small>}
        </div>
        {findOpen && <input className="chat-find" autoFocus placeholder="Поиск в чате" value={find}
          onChange={(event) => { setFindResult(null); setFind(event.target.value); }} />}
        <button className="icon-btn" onClick={() => { setFindOpen(!findOpen); setFind(''); setFindResult(null); }} aria-label="Поиск в чате"><Icon name={findOpen ? 'x' : 'search'} size={20} /></button>
        <button className="icon-btn" onClick={() => setMembersOpen(true)} aria-label="Участники чата"><Icon name="more" size={20} /></button>
      </header>
      <div className="chat-body">
        {hasOlder && !query && <Button variant="light" disabled={loadingOlder} onClick={loadOlder}>Предыдущие сообщения</Button>}
        {historyError && !query && <p role="alert">{historyError}</p>}
        {findResult?.query === query && findResult.error && <p role="alert">{findResult.error}</p>}
        {!historyError && !shown && <p className="chat-empty" role="status">{query ? 'Ищем…' : 'Загружаем сообщения…'}</p>}
        {shown?.length === 0 && !findResult?.error && <p className="chat-empty">{query ? 'Ничего не найдено' : 'Сообщений пока нет.'}</p>}
        {shown?.map((message, index) => {
          const person = people.find(({ id }) => id === message.from);
          const sameSender = index > 0 && shown[index - 1].from === message.from;
          return (
            <div key={message.id} className={`msg ${message.mine ? 'mine' : ''}`}>
              {!message.mine && (sameSender || !person ? <span className="msg-av-gap" /> : <Avatar person={person} size={40} />)}
              <div className="bubble">
                {chat.isGroup && !message.mine && !sameSender && <b style={{ color: nameColors[(message.from || 0) % nameColors.length] }}>{person?.name || 'Пользователь'}</b>}
                {message.text && <p>{message.text}</p>}
                {message.files.length > 0 && <DocList docs={message.files} onDownload={downloadFile} />}
                <small>{message.time}</small>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {actionError && <p className="chat-action-error" role="alert">{actionError}</p>}
      <form className="composer" onSubmit={send}>
        <button type="button" className="icon-btn" disabled={sending} onClick={() => setAttach(true)} aria-label="Прикрепить файл"><Icon name="plusCircle" size={24} /></button>
        <input placeholder="Сообщение" value={text} maxLength={10000} disabled={sending} onChange={(e) => setText(e.target.value)} />
        {files.length > 0 && <Chip>📎 {files.length}</Chip>}
        <button type="button" className="icon-btn" disabled={sending} onClick={() => setText((value) => value + '🙂')} aria-label="Эмодзи"><Icon name="smile" size={24} /></button>
        <button type="submit" className="icon-btn" disabled={sending || (!text.trim() && !files.length)} aria-label="Отправить"><Icon name="send" size={22} /></button>
      </form>
      {attach && <Modal open onClose={() => setAttach(false)} title="Прикрепить файл">
        <FileDrop files={files} onFiles={setFiles} />
        <Button variant="light" size="lg" block onClick={() => setAttach(false)}>Готово</Button>
      </Modal>}
      {membersOpen && <Modal open onClose={() => setMembersOpen(false)} title="Участники чата">
        {people.filter((person) => chat.memberIds.includes(person.id)).map((person) => (
          <div className="row" key={person.id}><Avatar person={person} />{person.name}</div>
        ))}
      </Modal>}
    </section>
  );
}

export default function Chats() {
  const { client, query } = useApp();
  const { param } = useRoute();
  const mobile = useSyncExternalStore(subscribeWidth, isNarrow);
  const [chats, setChats] = useState(null);
  const [error, setError] = useState('');
  const [defaultId, setDefaultId] = useState(null);
  const [newChat, setNewChat] = useState(false);
  const listRevision = useRef(0);
  const active = chats?.find(({ id }) => id === (param ? Number(param) : defaultId));

  useEffect(() => {
    let active = true;
    let timer;
    async function poll() {
      const revision = listRevision.current;
      try {
        const result = await client.request('/chats');
        if (!active || revision !== listRevision.current) return;
        setChats(result);
        setDefaultId((id) => result.some((chat) => chat.id === id) ? id : result[0]?.id);
        setError('');
      } catch (failure) {
        if (active) setError(failure.message);
      } finally {
        if (active) timer = setTimeout(poll, POLL_INTERVAL);
      }
    }
    void poll();
    return () => { active = false; clearTimeout(timer); };
  }, [client]);

  const markRead = useCallback((id) => {
    listRevision.current += 1;
    setChats((current) => current?.map((chat) => chat.id === id && chat.unread ? { ...chat, unread: 0 } : chat));
  }, []);

  function created(chat) {
    listRevision.current += 1;
    setChats((current) => [chat, ...(current || []).filter((item) => item.id !== chat.id)]);
    setNewChat(false);
    navigate('/chats/' + chat.id);
  }

  function sent(chatId, message) {
    listRevision.current += 1;
    setChats((current) => {
      const chat = current?.find(({ id }) => id === chatId);
      if (!chat) return current;
      return [
        { ...chat, unread: 0, last: message.text || '📎 Вложение', time: message.time, lastAt: message.createdAt },
        ...current.filter(({ id }) => id !== chatId),
      ];
    });
  }

  const q = query.trim().toLowerCase();
  const list = chats?.filter((chat) => !q || chat.title.toLowerCase().includes(q) || chat.last.toLowerCase().includes(q));
  return (
    <Layout tabs={false} searchPlaceholder="Поиск по чатам">
      <div className={`chats ${active && param ? 'show-chat' : ''}`}>
        <aside className="chat-list">
          <div className="chat-items">
            {error && <p role="alert">{error}</p>}
            {!error && !chats && <p role="status">Загружаем чаты…</p>}
            {list?.length === 0 && <p className="chat-empty">{q ? 'Ничего не найдено' : 'Чатов пока нет.'}</p>}
            {list?.map((chat) => (
              <a key={chat.id} href={'#/chats/' + chat.id} className={`chat-item ${chat.id === active?.id ? 'is-active' : ''}`}>
                <ChatAvatar chat={chat} />
                <span className="grow">
                  <b>{chat.title}</b>
                  <small className="clamp-1">{chat.last}</small>
                </span>
                <span className="chat-meta">
                  <small>{chat.time}</small>
                  {chat.unread > 0 && <i className="badge">{chat.unread}</i>}
                </span>
              </a>
            ))}
          </div>
          <button className="chat-fab" onClick={() => setNewChat(true)} aria-label="Новый чат"><Icon name="plus" size={24} stroke={2.4} /></button>
        </aside>
        {active && (!mobile || param) && <ChatThread key={active.id} chat={active} onRead={markRead} onMessage={sent} />}
        {chats && param && !active && <p role="alert">Чат недоступен.</p>}
      </div>
      {newChat && <NewChat onClose={() => setNewChat(false)} onCreated={created} />}
    </Layout>
  );
}
