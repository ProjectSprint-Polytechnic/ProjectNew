// Базовые компоненты из UI KIT макета
import { useEffect, useRef, useState } from 'react';
import Icon, { TechIcon } from './Icon';
import { useApp } from '../appContext';
import './ui.css';

const avatarPalette = [
  ['#f6d5c3', '#8a4b2f'], ['#d7e3ff', '#2b44a8'], ['#e9d5ff', '#6b21a8'], ['#d1fae5', '#065f46'],
  ['#fde68a', '#854d0e'], ['#fecdd3', '#9f1239'], ['#e0e7ff', '#3730a3'], ['#cffafe', '#155e75'], ['#f5f5f4', '#44403c'],
];

export function Avatar({ person, id, size = 40, ring }) {
  const { people, client } = useApp();
  const p = person || people.find((entry) => entry.id === id);
  const name = p?.name || p?.fullName || 'Пользователь';
  const [bg, fg] = avatarPalette[Math.max(0, Number(p?.id) - 1 || 0) % avatarPalette.length];
  const initials = p ? name.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join('') : '—';
  const avatarId = p?.avatar?.match(/^\/api\/files\/(\d+)$/)?.[1];
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!avatarId) return;
    let active = true;
    let url;
    client.readFile(avatarId, { inline: true }).then((blob) => {
      if (active && blob.type.startsWith('image/')) {
        url = URL.createObjectURL(blob);
        setImage({ id: avatarId, url });
      }
    }).catch(() => {});
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [avatarId, client]);
  return (
    <span
      className="avatar"
      title={name}
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.36, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}
    >
      {avatarId && image?.id === avatarId
        ? <img src={image.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
        : initials}
    </span>
  );
}

export function AvatarStack({ ids, size = 26 }) {
  return (
    <span className="avatar-stack">
      {ids.map((id) => <Avatar key={id} id={id} size={size} ring="var(--card)" />)}
    </span>
  );
}

export function Button({ variant = 'red', size, block, icon, children, className = '', ...rest }) {
  return (
    <button className={`btn btn-${variant} ${size ? 'btn-' + size : ''} ${block ? 'btn-block' : ''} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

export function Chip({ children, tone, dot, onClick, active, className = '' }) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag className={`chip ${tone ? 'chip-' + tone : ''} ${active ? 'is-active' : ''} ${className}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      {dot && <i className="chip-dot" style={{ background: dot }} />}
      {children}
    </Tag>
  );
}

const toneColor = { red: 'var(--red)', purple: 'var(--purple)', blue: 'var(--blue)', lilac: 'var(--lilac)', gray: '#9a9a9a' };
export function Progress({ value, color = 'red', label = true, thick }) {
  const c = toneColor[color] || color;
  return (
    <div className="progress">
      <div className={`progress-track ${thick ? 'thick' : ''}`}>
        <div className="progress-bar" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: c }} />
      </div>
      {label && <span className="progress-val">{value}%</span>}
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}</span>}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Input({ icon, right, className = '', ...rest }) {
  return (
    <span className={`input ${className}`}>
      {icon && <Icon name={icon} size={20} className="input-icon" />}
      <input {...rest} />
      {right}
    </span>
  );
}

export function Textarea(props) {
  return <textarea className="textarea" rows={3} {...props} />;
}

// Выпадающий список в стиле макета
export function Select({ value, onChange, options, placeholder = 'Выберите из выпадающего списка', renderOption, multiple }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', on);
    return () => document.removeEventListener('mousedown', on);
  }, []);
  const selected = multiple ? options.filter((o) => value?.includes(o.value)) : options.find((o) => o.value === value);
  const label = multiple
    ? (selected.length ? selected.map((o) => o.label).join(', ') : null)
    : selected?.label;
  const pick = (v) => {
    if (multiple) {
      const has = value?.includes(v);
      onChange(has ? value.filter((x) => x !== v) : [...(value || []), v]);
    } else {
      onChange(v);
      setOpen(false);
    }
  };
  return (
    <div className={`select ${open ? 'is-open' : ''}`} ref={ref}>
      <button type="button" className="select-head" onClick={() => setOpen((o) => !o)}>
        {!multiple && selected?.icon}
        <span className={label ? '' : 'muted'}>{label || placeholder}</span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={18} />
      </button>
      {open && (
        <div className="select-list" role="listbox">
          {options.map((o) => {
            const isSel = multiple ? value?.includes(o.value) : o.value === value;
            return (
              <button type="button" key={o.value} className={`select-opt ${isSel ? 'is-sel' : ''}`} onClick={() => pick(o.value)}>
                {renderOption ? renderOption(o) : <>{o.icon}<span>{o.label}</span></>}
                {multiple && isSel && <Icon name="check" size={18} style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TechSelect({ value, onChange, options }) {
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder="Выберите технологию"
      options={options.map((t) => ({ value: t.id, label: t.name, icon: <TechIcon tech={t.id} size={18} /> }))}
    />
  );
}

export function DateInput({ value, onChange, placeholder = 'Выбрать дату' }) {
  return (
    <span className="input date-input">
      <Icon name="calendar" size={18} className="input-icon" />
      <input type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
      {value && (
        <button type="button" className="date-clear" onClick={() => onChange('')} aria-label="Очистить">
          <Icon name="x" size={12} stroke={2.4} />
        </button>
      )}
    </span>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={checked} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}>
        <i />
      </button>
    </label>
  );
}

export function FileDrop({ files, onFiles }) {
  const [over, setOver] = useState(false);
  const input = useRef(null);
  const add = (list) => {
    if (list.length) onFiles([...(files || []), ...Array.from(list)]);
  };
  return (
    <div>
      <div
        className={`filedrop ${over ? 'is-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}
        onClick={(event) => { if (event.target !== input.current) input.current?.click(); }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            input.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span className="filedrop-icon"><Icon name="filePlus" size={18} /></span>
        <p><b>Нажмите</b> для загрузки файлов или перетащите их сюда</p>
        <p className="filedrop-sub">Например, JPG, PNG, PDF или DOCX. До 20 МБ за загрузку.</p>
        <input ref={input} type="file" multiple hidden onChange={(event) => {
          add(event.target.files);
          event.target.value = '';
        }} />
      </div>
      {files?.length > 0 && <DocList docs={files} onRemove={(i) => onFiles(files.filter((_, j) => j !== i))} />}
    </div>
  );
}

export function DocList({ title, docs, onRemove, onDownload }) {
  const [error, setError] = useState('');
  async function download(file) {
    setError('');
    try { await onDownload(file); } catch (failure) { setError(failure.message); }
  }
  return (
    <div className="doclist">
      {title && <h4>{title}</h4>}
      {docs.map((d, i) => (
        <div className="doc" key={i}>
          <Icon name="file" size={18} />
          {onDownload && d.id
            ? <button type="button" className="grow doc-name" onClick={() => download(d)}>{d.name}</button>
            : <span className="grow">{typeof d === 'string' ? d : d.name}</span>}
          {onRemove && (
            <button type="button" className="doc-del" onClick={() => onRemove(i)} aria-label="Удалить">
              <Icon name="trash" size={18} />
            </button>
          )}
        </div>
      ))}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function PersonChip({ id }) {
  const { people } = useApp();
  const p = people.find((entry) => entry.id === id);
  return (
    <span className="person-chip">
      <Avatar person={p} size={30} />
      <b>{p?.name || 'Не указан'}</b>
    </span>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}
