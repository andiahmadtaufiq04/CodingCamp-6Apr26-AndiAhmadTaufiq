// Personal Dashboard app

const Storage = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch (e) {
      return [];
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // no-op if localStorage is unavailable or quota exceeded
    }
  },
  getString(key, defaultValue) {
    try {
      return localStorage.getItem(key) ?? defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  setString(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // no-op if localStorage is unavailable or quota exceeded
    }
  }
};

// --- Theme Toggle helpers (pure functions, exported for testing) ---

function oppositeTheme(theme) {
  return theme === 'light' ? 'dark' : 'light';
}

const ThemeToggle = {
  init() {
    const theme = Storage.getString('dashboard_theme', 'light');
    document.documentElement.dataset.theme = theme;
    this._syncLabel(theme);
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggle());
  },

  toggle() {
    const current = document.documentElement.dataset.theme || 'light';
    const next = oppositeTheme(current);
    Storage.setString('dashboard_theme', next);
    document.documentElement.dataset.theme = next;
    this._syncLabel(next);
  },

  _syncLabel(theme) {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
  }
};

// --- Greeting Widget helpers (pure functions, exported for testing) ---

function formatGreeting(phrase, name) {
  const trimmed = (name || '').trim();
  return trimmed ? `${phrase}, ${trimmed}` : phrase;
}

function getTimeString(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getDateString(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  return 'Good Night';
}

const GreetingWidget = {
  name: '',

  init() {
    this.name = Storage.getString('dashboard_user_name', '');
    this.render();
    setInterval(() => this.render(), 1000);

    const form = document.getElementById('greeting-name-form');
    const input = document.getElementById('greeting-name-input');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveName(input.value);
    });

    input.addEventListener('blur', () => {
      this.saveName(input.value);
    });
  },

  saveName(value) {
    const trimmed = (value || '').trim();
    this.name = trimmed;
    Storage.setString('dashboard_user_name', trimmed);
    this.render();
  },

  render() {
    const now = new Date();
    document.getElementById('greeting-time').textContent = getTimeString(now);
    document.getElementById('greeting-date').textContent = getDateString(now);
    const phrase = getGreeting(now.getHours());
    document.getElementById('greeting-msg').textContent = formatGreeting(phrase, this.name);
  }
};

// --- Focus Timer helpers ---

function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function isValidDuration(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 180;
}

function isDuplicate(tasks, label, excludeId) {
  const normalized = label.trim().toLowerCase();
  return tasks.some(t => t.id !== excludeId && t.label.trim().toLowerCase() === normalized);
}

function sortTasks(tasks, order) {
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

const FocusTimer = {
  duration: 25,
  remaining: 1500,
  timerId: null,
  running: false,

  init() {
    const saved = Storage.getString('dashboard_timer_duration', '25');
    this.duration = isValidDuration(saved) ? Number(saved) : 25;
    this.remaining = this.duration * 60;
    this.render();
    document.getElementById('timer-start').addEventListener('click', () => this.start());
    document.getElementById('timer-stop').addEventListener('click', () => this.stop());
    document.getElementById('timer-reset').addEventListener('click', () => this.reset());
    document.getElementById('timer-duration-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('timer-duration-input');
      this.setDuration(input.value);
    });
  },

  setDuration(value) {
    if (!isValidDuration(value)) return;
    const n = Number(value);
    this.duration = n;
    this.remaining = n * 60;
    Storage.setString('dashboard_timer_duration', String(n));
    this.render();
  },

  start() {
    if (this.running) return;
    this.running = true;
    document.getElementById('timer-duration-input').disabled = true;
    this.timerId = setInterval(() => this.tick(), 1000);
  },

  stop() {
    if (!this.running) return;
    clearInterval(this.timerId);
    this.timerId = null;
    this.running = false;
    document.getElementById('timer-duration-input').disabled = false;
  },

  reset() {
    this.stop();
    this.remaining = this.duration * 60;
    document.getElementById('focus-timer').classList.remove('timer-finished');
    this.render();
  },

  tick() {
    this.remaining -= 1;
    this.render();
    if (this.remaining <= 0) {
      this.onFinish();
    }
  },

  onFinish() {
    this.stop();
    document.getElementById('focus-timer').classList.add('timer-finished');
  },

  render() {
    document.getElementById('timer-display').textContent = formatTime(this.remaining);
  }
};

// --- To-Do List ---

const TodoList = {
  tasks: [],
  sortOrder: 'creation',

  init() {
    this.sortOrder = Storage.getString('dashboard_sort_order', 'creation');
    this.load();
    this.render();
    document.getElementById('todo-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('todo-input');
      this.add(input.value);
      input.value = '';
    });
    document.getElementById('todo-input').addEventListener('input', () => {
      const err = document.getElementById('todo-duplicate-error');
      if (err) err.style.display = 'none';
    });
    const sortSelect = document.getElementById('todo-sort');
    if (sortSelect) {
      sortSelect.value = this.sortOrder;
      sortSelect.addEventListener('change', () => this.setSort(sortSelect.value));
    }
  },

  setSort(order) {
    this.sortOrder = order;
    Storage.setString('dashboard_sort_order', order);
    this.render();
  },

  add(label) {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (isDuplicate(this.tasks, trimmed, null)) {
      const err = document.getElementById('todo-duplicate-error');
      if (err) err.style.display = 'block';
      return;
    }
    this.tasks.push({
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(),
      label: trimmed,
      completed: false,
      createdAt: Date.now()
    });
    this.save();
    this.render();
  },

  toggle(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.save();
      this.render();
    }
  },

  edit(id, label) {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (isDuplicate(this.tasks, trimmed, id)) return;
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.label = trimmed;
      this.save();
      this.render();
    }
  },

  remove(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
    this.render();
  },

  load() {
    this.tasks = Storage.get('dashboard_tasks').map(task => {
      if (!('createdAt' in task)) task.createdAt = 0;
      return task;
    });
  },

  save() {
    Storage.set('dashboard_tasks', this.tasks);
  },

  render() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    sortTasks(this.tasks, this.sortOrder).forEach(task => {
      const li = document.createElement('li');
      if (task.completed) li.classList.add('completed');

      // Label span
      const span = document.createElement('span');
      span.textContent = task.label;
      span.style.flex = '1';

      // Complete button
      const completeBtn = document.createElement('button');
      completeBtn.type = 'button';
      completeBtn.textContent = task.completed ? '↩' : '✓';
      completeBtn.title = task.completed ? 'Mark incomplete' : 'Mark complete';
      completeBtn.style.cssText = 'padding:0.2rem 0.5rem;font-size:0.8rem;background:#22c55e;';
      completeBtn.addEventListener('click', () => this.toggle(task.id));

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = '✎';
      editBtn.title = 'Edit task';
      editBtn.style.cssText = 'padding:0.2rem 0.5rem;font-size:0.8rem;background:#f59e0b;';
      editBtn.addEventListener('click', () => {
        // Replace span with inline input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = task.label;
        input.style.cssText = 'flex:1;padding:0.2rem 0.4rem;font-size:0.9rem;border:1px solid #4f46e5;border-radius:4px;';
        li.replaceChild(input, span);
        input.focus();
        input.select();

        const confirm = () => {
          if (input.value.trim()) {
            this.edit(task.id, input.value);
          } else {
            li.replaceChild(span, input);
          }
        };
        input.addEventListener('blur', confirm);
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { input.blur(); }
          if (e.key === 'Escape') {
            input.removeEventListener('blur', confirm);
            li.replaceChild(span, input);
          }
        });
      });

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = '✕';
      deleteBtn.title = 'Delete task';
      deleteBtn.style.cssText = 'padding:0.2rem 0.5rem;font-size:0.8rem;background:#ef4444;';
      deleteBtn.addEventListener('click', () => this.remove(task.id));

      li.appendChild(span);
      li.appendChild(completeBtn);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  }
};

// --- Quick Links ---

const QuickLinks = {
  links: [],

  init() {
    this.load();
    this.render();
    document.getElementById('links-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const labelInput = document.getElementById('links-label-input');
      const urlInput = document.getElementById('links-url-input');
      this.add(labelInput.value, urlInput.value);
      labelInput.value = '';
      urlInput.value = '';
    });
  },

  add(label, url) {
    const trimmedLabel = label.trim();
    const trimmedUrl = url.trim();
    if (!trimmedLabel || !trimmedUrl) return;
    const normalizedUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmedUrl)
      ? trimmedUrl
      : 'https://' + trimmedUrl;
    this.links.push({
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(),
      label: trimmedLabel,
      url: normalizedUrl
    });
    this.save();
    this.render();
  },

  remove(id) {
    this.links = this.links.filter(l => l.id !== id);
    this.save();
    this.render();
  },

  load() {
    this.links = Storage.get('dashboard_links');
  },

  save() {
    Storage.set('dashboard_links', this.links);
  },

  render() {
    const container = document.getElementById('links-list');
    container.innerHTML = '';
    this.links.forEach(link => {
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem;';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = link.label;
      btn.style.cssText = 'flex:1;text-align:left;padding:0.4rem 0.6rem;';
      btn.addEventListener('click', () => window.open(link.url, '_blank'));

      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = '✕';
      deleteBtn.title = 'Delete link';
      deleteBtn.style.cssText = 'padding:0.2rem 0.5rem;font-size:0.8rem;background:#ef4444;';
      deleteBtn.addEventListener('click', () => this.remove(link.id));

      wrapper.appendChild(btn);
      wrapper.appendChild(deleteBtn);
      container.appendChild(wrapper);
    });
  }
};

// --- Bootstrap ---
document.addEventListener('DOMContentLoaded', () => {
  ThemeToggle.init();
  GreetingWidget.init();
  FocusTimer.init();
  TodoList.init();
  QuickLinks.init();
});
