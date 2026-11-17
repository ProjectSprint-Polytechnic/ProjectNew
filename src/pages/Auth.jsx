// Экраны «Вход» и «Регистрация» (включая состояние с ошибками)
import { useState } from 'react';
import { useApp } from '../appContext';
import { navigate } from '../router';
import Icon from '../components/Icon';
import { Button, Input } from '../components/ui';
import { DottedRing } from '../components/Graphics';
import './Auth.css';

function PasswordInput({ placeholder, value, onChange, error, pending, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <Input
      icon="lock"
      className={error ? 'is-error' : ''}
      type={show ? 'text' : 'password'}
      placeholder={placeholder}
      aria-label={placeholder}
      aria-invalid={Boolean(error)}
      disabled={pending}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      right={
        <button type="button" className="auth-eye" onClick={() => setShow(!show)} aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}>
          <Icon name={show ? 'eye' : 'eyeOff'} size={20} />
        </button>
      }
    />
  );
}

export default function Auth({ mode }) {
  const { client } = useApp();
  const isLogin = mode === 'login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [restore, setRestore] = useState(false);
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setErrors({});
    setNotice('');
    try {
      const ident = login.trim();
      if (restore) {
        await client.restore(ident);
        setNotice('Запрос принят. Отправка писем пока не подключена.');
        return;
      }
      if (isLogin) await client.login({ login: ident, password: pass, remember });
      else await client.register({ login: ident, password: pass, password2: pass2, name: name.trim(), email: email.trim(), remember });
      navigate('/tasks');
    } catch (error) {
      setErrors({ ...error.fields, message: error.message });
    } finally {
      setPending(false);
    }
  };

  function changeMode(nextRestore) {
    setRestore(nextRestore);
    setErrors({});
    setNotice('');
    setPass('');
  }

  return (
    <div className="auth">
      <div className="auth-art" aria-hidden="true">
        <div className="auth-c3" />
        <div className="auth-c2" />
        <div className="auth-c1">
          <DottedRing className="auth-ring" />
        </div>
      </div>

      <form className="auth-card" onSubmit={submit} aria-busy={pending}>
        <span className="auth-notch">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="5" fill="var(--text)" /><path d="M2.5 23c0-5.5 4.2-9 9.5-9s9.5 3.5 9.5 9z" fill="var(--text)" /></svg>
        </span>
        <h1>{restore ? 'Восстановление пароля' : isLogin ? 'Вход' : 'Регистрация'}</h1>
        {!restore && <p className="auth-sub">
          {isLogin ? <>Нет учётной записи? <a href="#/register">Регистрация</a></> : <>Есть учётная запись? <a href="#/login">Вход</a></>}
        </p>}

        <div className="auth-fields">
          {!isLogin && <Input icon="userCircle" placeholder="Имя" aria-label="Имя" value={name} onChange={(e) => setName(e.target.value)} disabled={pending} autoComplete="name" />}
          <div>
            <Input icon="userCircle" placeholder={isLogin ? 'Логин или email' : 'Логин'} aria-label={isLogin ? 'Логин или email' : 'Логин'} value={login} onChange={(e) => setLogin(e.target.value)} className={errors.login ? 'is-error' : ''} aria-invalid={Boolean(errors.login)} disabled={pending} autoComplete="username" />
            {errors.login && <span className="auth-err">{errors.login}</span>}
          </div>
          {!isLogin && <div>
            <Input placeholder="Email (необязательно)" aria-label="Email (необязательно)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={errors.email ? 'is-error' : ''} aria-invalid={Boolean(errors.email)} disabled={pending} autoComplete="email" />
            {errors.email && <span className="auth-err">{errors.email}</span>}
          </div>}
          {!restore && <div>
            <PasswordInput placeholder="Пароль" value={pass} onChange={setPass} error={errors.pass} pending={pending} autoComplete={isLogin ? 'current-password' : 'new-password'} />
            {errors.pass && <span className="auth-err">{errors.pass}</span>}
          </div>}
          {!isLogin && (
            <div>
              <PasswordInput placeholder="Повторите пароль" value={pass2} onChange={setPass2} error={errors.pass2} pending={pending} autoComplete="new-password" />
              {errors.pass2 && <span className="auth-err">{errors.pass2}</span>}
            </div>
          )}
          {!restore && (
            <label className="auth-check">
              <input type="checkbox" checked={remember} disabled={pending} onChange={(e) => setRemember(e.target.checked)} />
              <i />
              Запомнить меня
            </label>
          )}
        </div>

        {errors.message && <p className="auth-err" role="alert">{errors.message}</p>}
        {notice && <p className="auth-note" role="status">{notice}</p>}
        <div className="auth-actions"><Button type="submit" disabled={pending}>{pending ? 'Подождите…' : restore ? 'Отправить запрос' : isLogin ? 'Продолжить' : 'Создать аккаунт'}</Button></div>

        {isLogin && (
          <p className="auth-restore">
            {!restore && <>Забыли логин или пароль?<br /></>}
            <button type="button" disabled={pending} onClick={() => changeMode(!restore)}>{restore ? 'Вернуться ко входу' : 'Восстановить'}</button>
          </p>
        )}
      </form>
    </div>
  );
}
