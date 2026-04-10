// Pure helper functions extracted for testing.
// js/app.js defines these as globals; this module re-exports them
// so test files can import them as ES modules.

export function oppositeTheme(theme) {
  return theme === 'light' ? 'dark' : 'light';
}

export function formatGreeting(phrase, name) {
  const trimmed = (name || '').trim();
  return trimmed ? `${phrase}, ${trimmed}` : phrase;
}

export function isValidDuration(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 180;
}

export function isDuplicate(tasks, label, excludeId) {
  const normalized = label.trim().toLowerCase();
  return tasks.some(t => t.id !== excludeId && t.label.trim().toLowerCase() === normalized);
}

export function sortTasks(tasks, order) {
  const copy = tasks.slice();
  if (order === 'alphabetical') {
    copy.sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()));
  } else if (order === 'completion') {
    copy.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.createdAt - b.createdAt;
    });
  } else {
    // 'creation' (default)
    copy.sort((a, b) => a.createdAt - b.createdAt);
  }
  return copy;
}
