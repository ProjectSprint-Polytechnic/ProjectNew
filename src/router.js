// Простой hash-роутер без зависимостей: адреса вида  #/tasks, #/chats/2
// Hash-режим работает на любом статическом хостинге без настройки сервера.
// Если захотите обычные адреса без «#», замените на react-router-dom.
import { useEffect, useState } from 'react';

const read = () => {
  const h = window.location.hash.replace(/^#/, '') || '/';
  return h.startsWith('/') ? h : '/' + h;
};

export function navigate(path) {
  if (read() !== path) window.location.hash = path;
}

export function useRoute() {
  const [path, setPath] = useState(read);
  useEffect(() => {
    const on = () => setPath(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const parts = path.split('/').filter(Boolean);
  return { path, section: parts[0] || '', param: parts[1] };
}
