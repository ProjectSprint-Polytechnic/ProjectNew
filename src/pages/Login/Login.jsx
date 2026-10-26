import { useState } from 'react';
import './Login.css';
import polytech from '../../assets/polytech.png';
import person from '../../assets/person.png';
import eyeClosed from '../../assets/eye-closed.png';

const titles = { login: 'Вход', register: 'Регистрация', restore: 'Восстановление' };

function Login({ client, notice = '' }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [fields, setFields] = useState({ login: '', password: '', password2: '', name: '', email: '', remember: false });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  function changeMode(next) {
    setMode(next);
    setError(null);
    setMessage('');
    setShowPassword(false);
    setFields((current) => ({ ...current, password: '', password2: '' }));
  }

  function changeField(event) {
    const { name, value, type, checked } = event.target;
    setFields((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    setError(null);
  }

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    setMessage('');
    try {
      if (mode === 'login') await client.login({ ...fields, login: fields.login.trim() });
      if (mode === 'register') await client.register({ ...fields, login: fields.login.trim() });
      if (mode === 'restore') {
        await client.restore(fields.login.trim());
        setMessage('Запрос принят. Отправка писем пока не подключена, поэтому восстановить пароль через приложение пока нельзя.');
      }
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }

  function input(name, label, options = {}) {
    const fieldError = error?.fields?.[{ password: 'pass', password2: 'pass2' }[name] || name];
    return (
      <div className="input-wrapper">
        <label className="sr-only" htmlFor={name}>{label}</label>
        <input id={name} name={name} value={fields[name]} onChange={changeField}
          placeholder={label} className="login-input" disabled={pending}
          aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? `${name}-error` : undefined}
          {...options} />
        {fieldError && <p id={`${name}-error`} className="field-error">{fieldError}</p>}
      </div>
    );
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Политех">
        <div className="brand-circle-shadow shadow-one" />
        <div className="brand-circle-shadow shadow-two" />
        <div className="brand-circle"><img src={polytech} alt="Политех" className="university-logo" /></div>
      </section>
      <section className="login-content">
        <div className="login-form-container">
          <div className="user-photo-wrapper"><img src={person} alt="" className="user-photo" /></div>
          <div className="login-card">
            <h1>{titles[mode]}</h1>
            <p className="registration-text">
              {mode === 'login' ? 'Нет учётной записи?' : 'Есть учётная запись?'}
              <button type="button" className="text-button" disabled={pending}
                onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Регистрация' : 'Войти'}
              </button>
            </p>
            {notice && <p className="form-notice" role="status">{notice}</p>}
            {mode === 'restore' && <p className="form-hint">Укажите логин или email. Отправка писем пока не подключена.</p>}
            <form onSubmit={submit} aria-busy={pending}>
              {mode === 'register' && input('name', 'Имя', { autoComplete: 'name', maxLength: 255 })}
              {input('login', mode === 'register' ? 'Логин' : 'Логин или email', {
                required: true, autoComplete: 'username', maxLength: mode === 'register' ? 64 : 255,
                ...(mode === 'register' ? { minLength: 3, pattern: '[A-Za-z0-9_.@\\-]+' } : {}),
              })}
              {mode === 'register' && input('email', 'Email (необязательно)', { type: 'email', autoComplete: 'email', maxLength: 255 })}
              {mode !== 'restore' && <>
                <div className="input-wrapper password-input-wrapper">
                  <label className="sr-only" htmlFor="password">Пароль</label>
                  <input id="password" name="password" value={fields.password} onChange={changeField}
                    type={showPassword ? 'text' : 'password'} placeholder="Пароль"
                    className="login-input password-input" required disabled={pending}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    minLength={mode === 'register' ? 6 : undefined}
                    aria-invalid={Boolean(error?.fields?.pass)}
                    aria-describedby={error?.fields?.pass ? 'password-error' : undefined} />
                  <button type="button" className="password-toggle" disabled={pending}
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} aria-pressed={showPassword}>
                    {showPassword ? <span className="password-dot">●</span> : <img src={eyeClosed} alt="" />}
                  </button>
                  {error?.fields?.pass && <p id="password-error" className="field-error">{error.fields.pass}</p>}
                </div>
                {mode === 'register' && input('password2', 'Повторите пароль', {
                  type: showPassword ? 'text' : 'password', required: true, minLength: 6, autoComplete: 'new-password',
                })}
                <label className="remember-me">
                  <input type="checkbox" name="remember" checked={fields.remember} onChange={changeField} disabled={pending} />
                  <span>Запомнить меня</span>
                </label>
              </>}
              {error && <p className="form-error" role="alert">{error.message}</p>}
              {message && <p className="form-notice" role="status">{message}</p>}
              <button type="submit" className="login-button" disabled={pending}>
                {pending ? 'Подождите…' : mode === 'register' ? 'Создать аккаунт' : mode === 'restore' ? 'Отправить запрос' : 'Продолжить'}
              </button>
            </form>
            {mode === 'login' && <div className="forgot-password">
              <span>Забыли логин или пароль?</span>
              <button type="button" className="text-button" disabled={pending} onClick={() => changeMode('restore')}>Восстановить</button>
            </div>}
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
