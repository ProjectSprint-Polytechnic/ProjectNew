// Набор линейных иконок (24×24, stroke = currentColor), повторяет стиль макета.
const P = {
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  theme: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17a8.5 8.5 0 0 1-17 0z" fill="currentColor" /></>,
  message: <><path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.5z" /><path d="M8.5 10h7M8.5 13.5h4.5" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5z" /></>,
  book: <><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" /><path d="M9 7.5h6M9 11h4" /></>,
  help: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.5" /><path d="m6 6 3.5 3.5M14.5 14.5 18 18M18 6l-3.5 3.5M9.5 14.5 6 18" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  plusCircle: <><circle cx="12" cy="12" r="8.5" /><path d="M12 8.5v7M8.5 12h7" /></>,
  more: <><circle cx="12" cy="5.5" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="18.5" r="1.2" fill="currentColor" /></>,
  hash: <path d="M5 9h15M4 15h15M10 3.5 8 20.5M16 3.5l-2 17" />,
  comment: <><path d="M14.5 4H6a2.5 2.5 0 0 0-2.5 2.5v6A2.5 2.5 0 0 0 6 15h1v3l3.5-3H14.5a2.5 2.5 0 0 0 2.5-2.5v-6A2.5 2.5 0 0 0 14.5 4z" /><path d="M17 8h1a2.5 2.5 0 0 1 2.5 2.5v5A2.5 2.5 0 0 1 18 18h-.5v2.5L14.5 18h-3" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m6 15 6-6 6 6" />,
  chevronsLeft: <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" />,
  chevronsRight: <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />,
  arrowRight: <path d="M4 12h16m-6-6 6 6-6 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.3 3.1M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.4-.6 4.7-1.4" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" /></>,
  userCircle: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="10" r="3" /><path d="M6.5 18.3c1.2-2 3.1-3 5.5-3s4.3 1 5.5 3" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 19.5c.9-3 3.4-4.8 6.5-4.8s5.6 1.8 6.5 4.8" /><path d="M16 4.7a3.5 3.5 0 0 1 0 6.6M18 14.9c1.8.7 3 2.3 3.5 4.6" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  file: <><path d="M14 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9z" /><path d="M14 3.5V9h5.5" /></>,
  filePlus: <><path d="M14 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9z" /><path d="M14 3.5V9h5.5M12 12v5M9.5 14.5h5" /></>,
  trash: <><path d="M4 6.5h16M9.5 6.5V4.5h5v2M6 6.5l1 13a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l1-13" /><path d="M10 10.5v6M14 10.5v6" /></>,
  pencil: <><path d="M4 20l1-4.5L15.5 5a2.1 2.1 0 0 1 3 3L8 18.5z" /><path d="M13.5 7l3 3" /></>,
  logout: <><path d="M9.5 20.5H6A2.5 2.5 0 0 1 3.5 18V6A2.5 2.5 0 0 1 6 3.5h3.5" /><path d="M15.5 16.5 20 12l-4.5-4.5M20 12H9" /></>,
  bell: <><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
  phone: <path d="M20.5 16.6v2.6a1.8 1.8 0 0 1-2 1.8A17.6 17.6 0 0 1 3 5.5a1.8 1.8 0 0 1 1.8-2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.6 2.5a1.8 1.8 0 0 1-.4 1.9L8.3 10.5a14 14 0 0 0 5.2 5.2l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.3 1.6.5 2.5.6a1.8 1.8 0 0 1 1.5 1.8z" />,
  dots: <><circle cx="6" cy="12" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /><circle cx="18" cy="12" r="1.3" fill="currentColor" /></>,
  star: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="m12 7.5 1.3 2.8 3 .4-2.2 2.1.6 3L12 14.4l-2.7 1.4.6-3-2.2-2.1 3-.4z" fill="currentColor" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  refresh: <><path d="M20 11.5A8 8 0 0 0 5.6 7M4 12.5A8 8 0 0 0 18.4 17" /><path d="M5 3.5V7.5h4M19 20.5v-4h-4" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.5 2.5 4.8-5" /></>,
  checks: <path d="m2 12.5 4 4 8.5-9M11 15.5l1 1 8.5-9" />,
  send: <path d="M21 3 3 10.5l7 3 3 7zM21 3 10 13.5" />,
  smile: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0" /><circle cx="9" cy="10" r=".8" fill="currentColor" /><circle cx="15" cy="10" r=".8" fill="currentColor" /></>,
  paperclip: <path d="m20 11.5-7.8 7.8a5 5 0 0 1-7-7l7.8-7.9a3.3 3.3 0 0 1 4.7 4.7l-7.8 7.8a1.7 1.7 0 0 1-2.4-2.4l7.2-7.1" />,
  crown: <path d="M4 18.5h16M5 15.5 3.5 7l5 3.5L12 5l3.5 5.5 5-3.5-1.5 8.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  upload: <><path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 15v3a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 20 18v-3" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" /></>,
};

export default function Icon({ name, size = 22, stroke = 1.7, className, style, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: 'none', ...style }}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {P[name] || null}
    </svg>
  );
}

// Цветные значки технологий (Python, HTML, CSS …)
export function TechIcon({ tech, size = 20 }) {
  const s = { width: size, height: size, flex: 'none', display: 'block' };
  switch (tech) {
    case 'python':
      return (
        <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
          <path d="M11.8 2C7 2 7.3 4.1 7.3 4.1v2.2h4.6V7H5.4S2 6.6 2 11.8s3 5 3 5h1.8v-2.4s-.1-3 2.9-3h4.8s2.8 0 2.8-2.7V4.6S17.7 2 11.8 2z" fill="#3772a4" />
          <circle cx="9.3" cy="4.2" r=".9" fill="#fff" />
          <path d="M12.2 22c4.8 0 4.5-2.1 4.5-2.1v-2.2h-4.6V17h6.5s3.4.4 3.4-4.8-3-5-3-5h-1.8v2.4s.1 3-2.9 3H9.5s-2.8 0-2.8 2.7v4.1S6.3 22 12.2 22z" fill="#ffd43b" />
          <circle cx="14.7" cy="19.8" r=".9" fill="#fff" />
        </svg>
      );
    case 'html':
    case 'css': {
      const c = tech === 'html' ? '#e34f26' : '#1572b6';
      const c2 = tech === 'html' ? '#ef652a' : '#33a9dc';
      return (
        <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
          <path d="M4 2h16l-1.5 17L12 22l-6.5-3z" fill={c} />
          <path d="M12 3.6v16.7l5.2-1.5 1.3-15.2z" fill={c2} />
          <text x="12" y="15" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">{tech === 'html' ? '5' : '3'}</text>
        </svg>
      );
    }
    case 'js':
      return (
        <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="3" fill="#f2c94c" />
          <text x="13" y="18" fontSize="9" fontWeight="700" fill="#222" fontFamily="Inter, sans-serif">JS</text>
        </svg>
      );
    case 'csharp':
      return (
        <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
          <path d="M12 2 21 7v10l-9 5-9-5V7z" fill="#9b4f96" />
          <text x="12" y="15.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">C#</text>
        </svg>
      );
    case 'figma':
      return (
        <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
          <circle cx="15" cy="12" r="3" fill="#1abcfe" />
          <path d="M9 21a3 3 0 0 0 3-3v-3H9a3 3 0 0 0 0 6z" fill="#0acf83" />
          <path d="M6 12a3 3 0 0 0 3 3h3V9H9a3 3 0 0 0-3 3z" fill="#a259ff" />
          <path d="M6 6a3 3 0 0 0 3 3h3V3H9a3 3 0 0 0-3 3z" fill="#f24e1e" />
          <path d="M12 3v6h3a3 3 0 0 0 0-6z" fill="#ff7262" />
        </svg>
      );
    default: {
      const letter = { java: 'J', php: 'P', excel: 'X', word: 'W' }[tech] || '•';
      const bg = { java: '#e76f00', php: '#777bb4', excel: '#1d6f42', word: '#2b579a' }[tech] || '#999';
      return (
        <svg viewBox="0 0 24 24" style={s} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" fill={bg} />
          <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">{letter}</text>
        </svg>
      );
    }
  }
}
