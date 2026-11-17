// «Статистика» проекта: KPI, диаграммы, эффективность команды
import { useEffect, useState } from 'react';
import { useApp } from '../appContext';
import Layout from '../components/Layout';
import Icon from '../components/Icon';
import { Avatar, Chip, Select } from '../components/ui';
import './Stats.css';

const periods = [
  { value: 'all', label: 'Все время' },
  { value: 'month', label: 'Месяц' },
  { value: 'week', label: 'Неделя' },
];

function Donut({ data, center }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 62, C = 2 * Math.PI * R;
  const segments = data.filter((item) => item.value > 0);
  return (
    <svg viewBox="0 0 180 180" className="donut" role="img" aria-label="Распределение задач">
      <circle cx="90" cy="90" r={R} fill="none" stroke="var(--panel)" strokeWidth="34" />
      {segments.map((d, index) => {
        const len = (d.value / total) * C;
        const preceding = segments.slice(0, index).reduce((sum, item) => sum + item.value, 0);
        const offset = -(preceding / total) * C + C / 4;
        return (
          <circle key={d.label} cx="90" cy="90" r={R} fill="none" stroke={d.color} strokeWidth="34"
            strokeDasharray={`${len - Math.min(2, len / 3)} ${C - len + Math.min(2, len / 3)}`} strokeDashoffset={offset} />
        );
      })}
      <circle cx="90" cy="90" r="44" fill="var(--card)" />
      <text x="90" y="98" textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--text)">{center}</text>
    </svg>
  );
}

function Bars({ data }) {
  const step = Math.max(1, Math.ceil(Math.max(...data.map((d) => d.value), 0) / 5));
  const max = 5 * step, H = 150, bw = 30, gap = 34;
  return (
    <svg viewBox={`0 0 ${30 + data.length * (bw + gap)} ${H + 30}`} className="bars" role="img" aria-label="Часы работы">
      {[1, 2, 3, 4, 5].map((i) => i * step).map((v) => (
        <text key={v} x="4" y={H - (v / max) * H + 8} fontSize="9" fill="var(--text-2)">{v}</text>
      ))}
      {data.map((d, i) => {
        const h = (d.value / max) * H;
        const x = 26 + i * (bw + gap);
        return (
          <g key={i}>
            <rect x={x} y={H - h + 6} width={bw} height={h} rx="5" fill={d.color}><title>{d.value} ч</title></rect>
            <text x={x + bw / 2} y={H + 24} fontSize="9" textAnchor="middle" fill="var(--text-2)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Line({ data, labels }) {
  const W = 300, H = 120;
  const step = Math.max(1, Math.ceil(Math.max(...data, 0) / 4));
  const max = 4 * step;
  const pts = data.map((v, i) => [30 + (i / Math.max(1, data.length - 1)) * (W - 45), 10 + H - (v / max) * H]);
  const d = pts.map((p, i) => (i ? 'S' + [(pts[i - 1][0] + p[0]) / 2, p[1], p[0], p[1]].join(' ') : 'M' + p.join(' '))).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H + 36}`} className="line" role="img" aria-label="Командная деятельность">
      <defs>
        <linearGradient id="lg" x1="0" x2="1"><stop offset="0" stopColor="#4646f4" /><stop offset=".5" stopColor="#b04bfe" /><stop offset="1" stopColor="#e63246" /></linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => i * step).map((v) => (
        <g key={v}>
          <text x="0" y={10 + H - (v / max) * H + 3} fontSize="8" fill="var(--text-2)">{v} ч</text>
          <line x1="26" x2={W} y1={10 + H - (v / max) * H} y2={10 + H - (v / max) * H} stroke="var(--line)" strokeDasharray="2 4" />
        </g>
      ))}
      <path d={d} fill="none" stroke="url(#lg)" strokeWidth="3" strokeLinecap="round" />
      {[...new Set([0, Math.floor((labels.length - 1) / 2), labels.length - 1])].filter((i) => i >= 0 && labels[i]).map((i) => (
        <text key={i} x={pts[i][0]} y={H + 30} textAnchor="middle" fontSize="8" fill="var(--text-2)">{labels[i]}</text>
      ))}
    </svg>
  );
}

const pill = { red: 'chip-red', blue: 'chip-blue', purple: 'chip-purple', gray: '' };

export default function Stats() {
  const { client, people, query } = useApp();
  const [period, setPeriod] = useState('all');
  const [q, setQ] = useState('');
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const filters = new URLSearchParams({ period, q: q.trim() || query.trim() });
    const timer = setTimeout(async () => {
      try {
        const data = await client.request(`/stats?${filters}`);
        if (active) {
          setStats(data);
          setError('');
        }
      } catch (failure) {
        if (active) setError(failure.message);
      }
    }, 150);
    return () => { active = false; clearTimeout(timer); };
  }, [client, period, q, query]);

  const kpis = stats ? [
    ['Количество часов', stats.hours, 'clock', '#c173fe'],
    ['Всего задач', stats.tasks, 'refresh', '#6f6ff6'],
    ['Уровень завершения', stats.completion + '%', 'checkCircle', '#e63246'],
  ] : [];

  return (
    <Layout>
      <div className="stats">
        <section className="stats-panel">
          <div className="stats-head">
            <h2>Статистика проекта</h2>
            <div style={{ width: 170 }}><Select value={period} onChange={setPeriod} options={periods} /></div>
          </div>
          {error && <p role="alert">{error}</p>}
          {!stats && !error && <p role="status">Загрузка…</p>}
          {stats && <>
          <div className="kpis">
            {kpis.map(([label, val, icon, c]) => (
              <div className="kpi" key={label}>
                <span>{label}</span>
                <b>{val}</b>
                <i style={{ background: c + '33', color: c }}><span style={{ background: c }}><Icon name={icon} size={18} stroke={2} style={{ color: '#fff' }} /></span></i>
              </div>
            ))}
          </div>
          <div className="charts">
            <div className="chart">
              <h3>Распределение задач</h3>
              <div className="donut-wrap">
                <ul className="legend">
                  {stats.distribution.map((d) => <li key={d.label}><i style={{ background: d.color }} />{d.label}: {d.value}</li>)}
                </ul>
                <Donut data={stats.distribution} center={`${stats.completion}%`} />
              </div>
            </div>
            <div className="chart"><h3>Часы работы</h3><Bars data={stats.workHours} /></div>
            <div className="chart"><h3>Командная деятельность</h3><Line data={stats.activity} labels={stats.activityLabels} /></div>
          </div>
          </>}
        </section>

        <section className="stats-panel">
          <div className="stats-head">
            <h2>Обзор эффективности команды</h2>
            <label className="team-search"><Icon name="search" size={16} /><input placeholder="Поиск участника команды" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          </div>
          <div className="team-table" role="table">
            <div className="tt-row tt-head" role="row">
              <span role="columnheader">Участник команды</span><span role="columnheader">Выполненные задачи</span>
              <span role="columnheader">Часы работы</span><span role="columnheader">Вклад</span>
            </div>
            {stats?.team.map((m) => {
              const p = people.find((person) => person.id === m.person) || { id: m.person, name: m.name };
              return (
                <div className="tt-row" role="row" key={m.person}>
                  <span className="tt-person" role="cell">
                    <Avatar person={p} size={40} /><b>{p.name}</b>
                    {m.role && <Chip tone="lilac">{m.role}</Chip>}
                    {m.tag && <Chip>{m.tag}</Chip>}
                    {m.crown && <Icon name="crown" size={18} style={{ color: `var(--${m.crown === 'blue' ? 'lilac' : m.crown})` }} />}
                  </span>
                  <span role="cell"><Chip className={`tt-pill ${pill[m.color]}`}>{m.done}</Chip></span>
                  <span role="cell"><Chip className={`tt-pill ${pill[m.color]}`}>{m.hours} ч</Chip></span>
                  <span role="cell"><Chip className={`tt-pill ${pill[m.color]}`}>{m.share}%</Chip></span>
                </div>
              );
            })}
            {stats?.team.length === 0 && <p className="muted">Участники не найдены.</p>}
          </div>
        </section>
      </div>
    </Layout>
  );
}
