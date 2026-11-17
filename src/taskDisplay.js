export function colorTone(hex) {
  return { '#e63246': 'red', '#b04bfe': 'purple', '#4646f4': 'blue' }[hex] || hex;
}

export function matchTask(task, query) {
  const term = query.trim().toLowerCase();
  return [task.title, task.description, ...task.tags].some((value) => value.toLowerCase().includes(term));
}

export function canEditTask(task, user, role) {
  return role === 'leader' || user.id === task.assignee || user.id === task.author;
}

export function daysWord(days) {
  const lastTwoDigits = Math.abs(days) % 100;
  const lastDigit = lastTwoDigits % 10;
  if (lastTwoDigits > 10 && lastTwoDigits < 20) return 'Дней';
  if (lastDigit === 1) return 'День';
  if (lastDigit >= 2 && lastDigit <= 4) return 'Дня';
  return 'Дней';
}
