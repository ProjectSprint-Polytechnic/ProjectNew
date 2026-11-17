// Векторные иллюстрации из макета: логотип, точечное кольцо, «404», обложка профиля.
// Оригинальное точечное кольцо с шариком, экспортированное из Figma (экран «вход»)
import ringUrl from '../assets/ring.svg';

// Логотип: тёмный круг с кольцом из макета
export function LogoMark({ size = 30 }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size, borderRadius: '50%', background: '#1e1e1e', display: 'inline-grid', placeItems: 'center', flex: 'none' }}>
      <img src={ringUrl} alt="" style={{ width: '78%', height: 'auto', display: 'block' }} />
    </span>
  );
}

export function Logo({ compact, size = 30, className }) {
  return (
    <span className={`logo ${className || ''}`} aria-label="Московский Политех" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
      <LogoMark size={size} />
      {!compact && (
        <span style={{ fontWeight: 700, fontSize: Math.round(size * 0.37), lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          московский<br />политех
        </span>
      )}
    </span>
  );
}

// Кольцо для экрана входа — тот же файл из Figma, без изменений
export function DottedRing({ className, style }) {
  return <img src={ringUrl} alt="" className={className} style={{ height: 'auto', ...style }} aria-hidden="true" />;
}

// Анимированный «спиннер» для окна «Уже решаем вашу проблему» — тот же знак, что в логотипе
export function DotSpinner({ size = 64 }) {
  return (
    <div style={{ width: size, height: size, animation: 'spin 1.6s linear infinite' }}>
      <LogoMark size={size} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}

// Иллюстрация «404» — собрана из градиентных «палочек» и точечного нуля
export function Art404({ style }) {
  const bar = (x, y, w, h, rot, grad) => (
    <rect x={x} y={y} width={w} height={h} rx={w / 2} transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`} fill={`url(#${grad})`} />
  );
  return (
    <svg viewBox="0 0 1030 740" style={{ width: '100%', height: 'auto', ...style }} aria-hidden="true">
      <defs>
        <linearGradient id="g-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#111" /><stop offset="1" stopColor="#111" stopOpacity="0.15" /></linearGradient>
        <linearGradient id="g-gray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#eaeaea" /><stop offset=".4" stopColor="#8a8a8a" /><stop offset="1" stopColor="#5a5a5a" /></linearGradient>
        <linearGradient id="g-blue" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#4646f4" stopOpacity="0.1" /><stop offset="1" stopColor="#4646f4" /></linearGradient>
        <linearGradient id="g-red" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff1b1b" /><stop offset="1" stopColor="#ff1b1b" stopOpacity="0.1" /></linearGradient>
      </defs>
      {/* первая 4 */}
      {bar(110, 0, 56, 330, 38, 'g-dark')}
      <rect x="0" y="270" width="250" height="56" rx="28" fill="url(#g-blue)" />
      {bar(222, 160, 56, 330, 0, 'g-gray')}
      {/* 0 */}
      <g transform="translate(310 160)"><DottedZero /></g>
      {/* вторая 4 */}
      {bar(840, 230, 56, 330, 38, 'g-dark')}
      <rect x="720" y="500" width="250" height="56" rx="28" fill="url(#g-red)" />
      {bar(946, 390, 56, 340, 0, 'g-gray')}
    </svg>
  );
}

function DottedZero() {
  const dots = [];
  const R = 200, r0 = 95, rings = 10, step = (R - r0) / rings;
  for (let k = 0; k < rings; k++) {
    const r = r0 + step * (k + 0.5);
    const n = Math.floor((2 * Math.PI * r) / (step * 1.05));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const lower = Math.sin(a) > 0.15 && Math.cos(a) > -0.2; // правый нижний сектор бледнеет
      const sz = step * (lower ? 0.18 : 0.38);
      dots.push(<circle key={k + '-' + i} cx={(R + Math.cos(a) * r).toFixed(1)} cy={(R + Math.sin(a) * r).toFixed(1)} r={sz.toFixed(2)} fill="#111" opacity={lower ? 0.55 : 1} />);
    }
  }
  return <g>{dots}</g>;
}

// Обложка профиля — тёмный фон с цветными световыми полосами
export function ProfileBanner({ children, style }) {
  return (
    <div
      style={{
        position: 'relative', height: 160, borderRadius: '30px 30px 0 0', overflow: 'hidden',
        background:
          'radial-gradient(ellipse 40% 120% at 80% 120%, rgba(255,255,255,.55), transparent 60%),' +
          'radial-gradient(ellipse 30% 90% at 20% 110%, rgba(214,141,255,.65), transparent 60%),' +
          'conic-gradient(from 200deg at 60% 140%, #0b0b19, #2b1650, #c46b3c, #f7d36b, #63c9ff, #2b2f8a, #0b0b19),' +
          '#0b0b19',
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.1) 60%, rgba(0,0,0,.35))' }} />
      {children}
    </div>
  );
}
