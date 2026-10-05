import { useState } from 'react';
import './Login.css';

import polytech from '../../assets/polytech.png';
import person from '../../assets/person.png';
import eyeClosed from '../../assets/eye-closed.png';

function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="login-page">

      {/* =====================================
          ЛЕВАЯ ЧАСТЬ
          ===================================== */}

      <section className="login-brand">

        <div className="brand-circle-shadow shadow-one"></div>

        <div className="brand-circle-shadow shadow-two"></div>

        <div className="brand-circle">
          <img
            src={polytech}
            alt="polytech"
            className="university-logo"
          />
        </div>

      </section>


      {/* =====================================
          ПРАВАЯ ЧАСТЬ
          ===================================== */}

      <section className="login-content">

        <div className="login-form-container">

          {/* Фотография над карточкой */}

          <div className="user-photo-wrapper">

            <img
              src={person}
              alt="Пользователь"
              className="user-photo"
            />

          </div>


          {/* Карточка входа */}

          <div className="login-card">

            <h1>Вход</h1>

            <p className="registration-text">
              Нет учетной записи?

              <a href="#">
                Регистрация
              </a>
            </p>


            <form>

              {/* Логин */}

              <div className="input-wrapper">

                <input
                  type="text"
                  placeholder="Логин"
                  className="login-input"
                />

              </div>


              {/* Пароль */}

              <div className="input-wrapper password-input-wrapper">

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Пароль"
                  className="login-input password-input"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? 'Скрыть пароль'
                      : 'Показать пароль'
                  }
                >
                  {showPassword ? (
                    <span className="password-dot">●</span>
                  ) : (
                    <img
                      src={eyeClosed}
                      alt=""
                    />
                  )}
                </button>

              </div>


              {/* Запомнить меня */}

              <label className="remember-me">

                <input
                  type="checkbox"
                />

                <span>
                  Запомнить меня
                </span>

              </label>


              {/* Кнопка */}

              <button
                type="submit"
                className="login-button"
              >
                Продолжить
              </button>

            </form>


            {/* Восстановление */}

            <div className="forgot-password">

              <span>
                Забыли логин или пароль?
              </span>

              <a href="#">
                Восстановить
              </a>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Login;