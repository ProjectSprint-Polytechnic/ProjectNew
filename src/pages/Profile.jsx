// «Профиль»: личные данные и прогресс обучения
import { useEffect, useState } from 'react';
import { useApp } from '../appContext';
import Layout from '../components/Layout';
import Icon, { TechIcon } from '../components/Icon';
import Modal from '../components/Modal';
import { Avatar, Button, Chip, Field, Input, Progress } from '../components/ui';
import { ProfileBanner } from '../components/Graphics';
import './Profile.css';

const banners = [
  null,
  'linear-gradient(120deg, #1d1b4b, #4646f4 45%, #b04bfe 75%, #e63246)',
  'linear-gradient(120deg, #0f2027, #203a43, #2c5364)',
  'radial-gradient(circle at 30% 120%, #f7d36b, transparent 50%), linear-gradient(120deg, #3a1c71, #d76d77, #ffaf7b)',
];

const fields = [
  ['status', 'Статус'], ['sex', 'Пол'], ['birth', 'Дата рождения'], ['faculty', 'Факультет'], ['direction', 'Направление'],
  ['course', 'Курс'], ['project', 'Проект'], ['department', 'Отдел'], ['position', 'Должность'],
];
const contacts = [['email', 'Email'], ['phone', 'Телефон'], ['telegram', 'Telegram'], ['vk', 'Вконтакте']];

export default function Profile() {
  const { client, user: data, reloadUser, theme, updateSettings, setModal, logout } = useApp();
  const [tab, setTab] = useState('data');
  const [edit, setEdit] = useState(null);
  const [openSkill, setOpenSkill] = useState(0);
  const [competencies, setCompetencies] = useState(null);
  const [skillsError, setSkillsError] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const bg = data.banner ?? 0;

  useEffect(() => {
    if (tab !== 'progress') return undefined;
    let active = true;
    (async () => {
      try {
        const items = await client.request('/competencies');
        if (active) {
          setSkillsError('');
          setCompetencies(items);
        }
      } catch (failure) {
        if (active) setSkillsError(failure.message);
      }
    })();
    return () => { active = false; };
  }, [client, tab]);

  async function run(operation) {
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

  async function patchProfile(body) {
    await client.request('/me', { method: 'PATCH', body });
    await reloadUser();
  }

  function saveProfile(event) {
    event.preventDefault();
    run(async () => {
      await patchProfile(edit);
      setEdit(null);
    });
  }

  const editableFields = [['fullName', 'ФИО'], ...fields.filter(([key]) => key !== 'project'), ...contacts];

  return (
    <Layout tabs={false}>
      <div className="profile">
        <section className="prof-head">
          <ProfileBanner style={banners[bg] ? { background: banners[bg] } : undefined}>
            <button className="prof-bg-btn" disabled={pending} onClick={() => run(() => patchProfile({ banner: (bg + 1) % banners.length }))}>Сменить фон</button>
          </ProfileBanner>
          <div className="prof-avatar"><Avatar person={data} size={96} /></div>
          <div className="prof-info">
            <div>
              <h1>{data.fullName || data.name}</h1>
              <div className="row prof-chips">
                {data.project && <Chip>{data.project}</Chip>}
                {data.department && <Chip dot="var(--text-2)">{data.department}</Chip>}
                {data.position && <Chip dot="var(--text-2)">{data.position}</Chip>}
              </div>
              <div className="row prof-tabs">
                <button className={tab === 'data' ? 'is-active' : ''} onClick={() => setTab('data')}>Личные данные</button>
                <button className={tab === 'progress' ? 'is-active' : ''} onClick={() => setTab('progress')}>Прогресс обучения</button>
              </div>
            </div>
            <div className="prof-actions">
              <button onClick={() => setModal('settings')}><Icon name="settings" size={20} />Настройки</button>
              <button disabled={pending} onClick={() => run(() => updateSettings({ theme: theme === 'light' ? 'dark' : 'light' }))}><Icon name="theme" size={20} />{theme === 'light' ? 'Светлая тема' : 'Тёмная тема'}</button>
              <button disabled={pending} onClick={() => {
                setError('');
                setEdit(Object.fromEntries(editableFields.map(([key]) => [key, data[key] ?? ''])));
              }}><Icon name="pencil" size={20} />Изменить</button>
              <button className="danger" onClick={logout}><Icon name="logout" size={20} />Выйти</button>
            </div>
          </div>
        </section>

        {error && !edit && <p role="alert">{error}</p>}
        <div className="prof-content">
          {tab === 'data' ? (
            <>
              <div className="prof-card">{fields.map(([k, l]) => <p key={k}><b>{l}:</b> {data[k] || '—'}</p>)}</div>
              <div className="prof-card">{contacts.map(([k, l]) => <p key={k}><b>{l}:</b> {data[k] || '—'}</p>)}</div>
            </>
          ) : (
            <>
              {skillsError && <p role="alert">{skillsError}</p>}
              {!competencies && !skillsError && <p role="status">Загрузка…</p>}
              {competencies?.length === 0 && <p className="muted">Компетенций пока нет.</p>}
              {competencies?.map((c, i) => (
              <div className="prof-card skillcard" key={c.tech}>
                <button className="skill-head" onClick={() => setOpenSkill(openSkill === i ? -1 : i)}>
                  <TechIcon tech={c.tech} size={20} />
                  <b>{c.name || c.tech}</b>
                  <div className="grow"><Progress value={c.percent} color="lilac" label={false} /></div>
                  <span className="skill-pct">{c.percent}%</span>
                  <Icon name={openSkill === i ? 'chevronUp' : 'chevronDown'} size={20} />
                </button>
                {openSkill === i && c.topics.map((t) => (
                  <div className="topic" key={t.id}>
                    <span className="grow">{t.title}</span>
                    {t.status === 'done' ? <Chip tone="lilac" className="topic-done">Уже выполнено</Chip> : <span className="topic-st">В процессе</span>}
                  </div>
                ))}
              </div>
              ))}
            </>
          )}
        </div>
      </div>

      {edit && (
        <Modal open onClose={() => setEdit(null)} title="Изменить профиль">
          <form onSubmit={saveProfile}>
            {editableFields.map(([key, label]) => (
              <Field key={key} label={label}>
                <Input aria-label={label} value={edit[key]}
                  type={{ birth: 'date', course: 'number', email: 'email', phone: 'tel' }[key] || 'text'}
                  min={key === 'course' ? 1 : undefined} max={key === 'course' ? 6 : undefined}
                  maxLength={{ status: 64, sex: 16, department: 128, position: 128, phone: 32, telegram: 64, vk: 128 }[key] || 255}
                  onChange={(e) => setEdit({ ...edit, [key]: e.target.value })} />
              </Field>
            ))}
            {error && <p role="alert">{error}</p>}
            <Button variant="dark" size="lg" block disabled={pending}>Сохранить</Button>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
