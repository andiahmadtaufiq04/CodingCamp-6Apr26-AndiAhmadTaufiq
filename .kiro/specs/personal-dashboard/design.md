# Design Document

## Overview

The personal dashboard is a single-page web application built with HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend, using the `localStorage` API for data persistence. The app is structured as a single `index.html` file, one `css/style.css`, and one `js/app.js`.

The dashboard hosts four widgets:
- **Greeting Widget** — live clock, date, and time-based greeting
- **Focus Timer** — 25-minute Pomodoro-style countdown
- **To-Do List** — task management with add, complete, edit, and delete
- **Quick Links** — user-defined shortcut buttons to external URLs

The app can be opened directly as a local file or served from any static host. It can also be packaged as a browser extension (new-tab override) with a minimal `manifest.json`.

---

## Architecture

The app follows a simple **widget-per-module** pattern inside a single `app.js` file. There is no build step, no bundler, and no framework. Each widget is an isolated section of code with its own state, DOM references, and event listeners. A shared `Storage` utility handles all `localStorage` reads and writes.

```
index.html          ← markup skeleton + widget containers
css/style.css       ← all styles (grid layout, widget cards, responsive breakpoints)
js/app.js           ← all logic (widgets + storage utility)
```

Execution flow:

```
DOMContentLoaded
  ├── GreetingWidget.init()   → starts setInterval (1 s) for clock
  ├── FocusTimer.init()       → renders 25:00, binds controls
  ├── TodoList.init()         → loads from localStorage, renders tasks
  └── QuickLinks.init()       → loads from localStorage, renders links
```

Each widget is a plain object literal with an `init()` method and private helper functions. No classes are required, keeping the code minimal.

---

## Components and Interfaces

### GreetingWidget

Reads `new Date()` every second via `setInterval`.

```
GreetingWidget.init()
  → updates #greeting-time   (HH:MM)
  → updates #greeting-date   (e.g. "Monday, July 14, 2025")
  → updates #greeting-msg    ("Good Morning" | "Good Afternoon" | "Good Evening" | "Good Night")
```

Greeting rules (based on `Date.getHours()`):
- 05–11 → "Good Morning"
- 12–17 → "Good Afternoon"
- 18–20 → "Good Evening"
- 21–23, 00–04 → "Good Night"

### FocusTimer

Internal state: `remaining` (seconds), `timerId` (interval handle or null), `running` (boolean).

```
FocusTimer.init()     → renders 25:00, binds #timer-start, #timer-stop, #timer-reset
FocusTimer.start()    → sets running=true, starts setInterval (1 s)
FocusTimer.stop()     → clears interval, running=false
FocusTimer.reset()    → stop(), remaining=1500, re-renders 25:00, clears finished state
FocusTimer.tick()     → decrements remaining, re-renders, calls onFinish() at 0
FocusTimer.onFinish() → stop(), applies .timer-finished CSS class
FocusTimer.render()   → formats remaining as MM:SS, writes to #timer-display
```

### TodoList

Internal state: `tasks` — array of `{ id, label, completed }`.

```
TodoList.init()         → load(), render(), bind form submit
TodoList.add(label)     → push new task, save(), render()
TodoList.toggle(id)     → flip completed, save(), render()
TodoList.edit(id, label)→ update label, save(), render()
TodoList.remove(id)     → filter out task, save(), render()
TodoList.load()         → Storage.get('dashboard_tasks') → tasks
TodoList.save()         → Storage.set('dashboard_tasks', tasks)
TodoList.render()       → rebuild #todo-list DOM from tasks array
```

### QuickLinks

Internal state: `links` — array of `{ id, label, url }`.

```
QuickLinks.init()       → load(), render(), bind form submit
QuickLinks.add(label, url) → push new link, save(), render()
QuickLinks.remove(id)   → filter out link, save(), render()
QuickLinks.load()       → Storage.get('dashboard_links') → links
QuickLinks.save()       → Storage.set('dashboard_links', links)
QuickLinks.render()     → rebuild #links-list DOM from links array
```

### Storage Utility

```
Storage.get(key)   → JSON.parse(localStorage.getItem(key)) || []  (catches parse errors)
Storage.set(key, value) → localStorage.setItem(key, JSON.stringify(value))
```

If `localStorage` is unavailable or throws, `Storage.get` returns `[]` and `Storage.set` is a no-op (wrapped in try/catch).

---

## Data Models

### Task

```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  label:     string,   // non-empty, trimmed
  completed: boolean   // false on creation
}
```

Persisted as a JSON array under the key `dashboard_tasks`.

### Link

```js
{
  id:    string,  // crypto.randomUUID() or Date.now().toString()
  label: string,  // non-empty, trimmed
  url:   string   // non-empty; prepend "https://" if no protocol present
}
```

Persisted as a JSON array under the key `dashboard_links`.

### localStorage Schema

| Key               | Value type     | Description                  |
|-------------------|----------------|------------------------------|
| `dashboard_tasks` | `Task[]` (JSON)| All to-do items              |
| `dashboard_links` | `Link[]` (JSON)| All quick-link entries       |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Time formatting is always HH:MM

*For any* `Date` object, `getTimeString(date)` shall return a string of the form `HH:MM` where HH is the zero-padded 24-hour hour and MM is the zero-padded minute, matching the actual hour and minute of the input date.

**Validates: Requirements 1.1**

---

### Property 2: Date formatting contains all required components

*For any* `Date` object, `getDateString(date)` shall return a string that contains the correct full weekday name, full month name, day-of-month number, and four-digit year corresponding to that date.

**Validates: Requirements 1.2**

---

### Property 3: Greeting is correct for every hour of the day

*For any* integer hour in [0, 23], `getGreeting(hour)` shall return exactly one of the four greeting strings, and the mapping shall be:
- 5–11 → "Good Morning"
- 12–17 → "Good Afternoon"
- 18–20 → "Good Evening"
- 21–23, 0–4 → "Good Night"

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 4: Timer format is always MM:SS

*For any* integer seconds value in [0, 1500], `formatTime(seconds)` shall return a string of the form `MM:SS` where MM is the zero-padded minutes and SS is the zero-padded remaining seconds, correctly representing the input value.

**Validates: Requirements 2.7**

---

### Property 5: Timer reset always restores initial state

*For any* timer state (any value of `remaining` in [0, 1500], any value of `running`), calling `reset()` shall result in `remaining === 1500` and `running === false`.

**Validates: Requirements 2.5**

---

### Property 6: Adding a valid task grows the list

*For any* task list and any non-empty, non-whitespace-only string label, calling `add(label)` shall increase `tasks.length` by exactly 1 and the new task shall appear in the list with the trimmed label and `completed === false`.

**Validates: Requirements 3.1**

---

### Property 7: Whitespace-only labels are rejected

*For any* string composed entirely of whitespace characters (including the empty string), calling `add(label)` shall leave `tasks.length` unchanged.

**Validates: Requirements 3.2**

---

### Property 8: Toggling completion is an involution

*For any* task, calling `toggle(id)` twice in succession shall return the task to its original `completed` value (i.e., `toggle` is its own inverse).

**Validates: Requirements 3.3**

---

### Property 9: Editing a task updates its label

*For any* task in the list and any non-empty string `newLabel`, calling `edit(id, newLabel)` shall result in the task having `label === newLabel.trim()` while all other task fields remain unchanged.

**Validates: Requirements 3.4**

---

### Property 10: Removing a task eliminates it from the list

*For any* task list and any `id` present in that list, calling `remove(id)` shall result in no task with that `id` remaining in the list, and all other tasks shall be preserved.

**Validates: Requirements 3.5**

---

### Property 11: Task list localStorage round-trip

*For any* array of tasks, calling `save()` followed by `load()` shall produce an array that is deeply equal to the original (same ids, labels, and completion states, in the same order).

**Validates: Requirements 3.6, 3.7**

---

### Property 12: Adding a valid link grows the links list

*For any* links list and any pair of non-empty strings `(label, url)`, calling `add(label, url)` shall increase `links.length` by exactly 1 and the new link shall appear with the correct label and url.

**Validates: Requirements 4.1**

---

### Property 13: Invalid link submissions are rejected

*For any* pair `(label, url)` where either `label` or `url` is empty or whitespace-only, calling `add(label, url)` shall leave `links.length` unchanged.

**Validates: Requirements 4.2**

---

### Property 14: Removing a link eliminates it from the list

*For any* links list and any `id` present in that list, calling `remove(id)` shall result in no link with that `id` remaining in the list, and all other links shall be preserved.

**Validates: Requirements 4.4**

---

### Property 15: Links list localStorage round-trip

*For any* array of links, calling `save()` followed by `load()` shall produce an array that is deeply equal to the original (same ids, labels, and urls, in the same order).

**Validates: Requirements 4.5, 4.6**

---

### Property 16: Storage.get is safe against corrupt data

*For any* string value stored in `localStorage` under a given key (including non-JSON strings, empty strings, and malformed JSON), calling `Storage.get(key)` shall return `[]` and shall not throw an exception.

**Validates: Requirements 6.3**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private browsing, quota exceeded) | `Storage.set` is a no-op (try/catch); `Storage.get` returns `[]` |
| Corrupt JSON in `localStorage` | `JSON.parse` error caught; returns `[]` |
| Empty/whitespace task label submitted | Rejected silently; no task added |
| Empty label or URL for quick link | Rejected silently; no link added |
| Timer already running when Start clicked | `start()` is a no-op if `running === true` |
| Timer already stopped when Stop clicked | `stop()` is a no-op if `running === false` |
| URL missing protocol | Prepend `https://` before storing so `window.open` works correctly |

---

## Testing Strategy

Given the technical constraints (no test setup required, Vanilla JS only), the testing strategy is designed to be lightweight and optional — properties are documented here as a specification guide and can be verified manually or with a minimal inline test harness.

### Unit / Example Tests

Cover specific behaviors with concrete inputs:

- `getGreeting(9)` → `"Good Morning"`
- `getGreeting(15)` → `"Good Afternoon"`
- `getGreeting(19)` → `"Good Evening"`
- `getGreeting(23)` → `"Good Night"`, `getGreeting(2)` → `"Good Night"`
- `formatTime(1500)` → `"25:00"`, `formatTime(0)` → `"00:00"`, `formatTime(90)` → `"01:30"`
- Timer init state: `remaining === 1500`, display `"25:00"`
- Timer at 0: `running === false`, finished class applied
- `Storage.get` with corrupt JSON returns `[]` without throwing
- localStorage keys are exactly `dashboard_tasks` and `dashboard_links`
- `window.open` called with correct url and `'_blank'` when link button clicked

### Property-Based Tests

If a property-based testing library is introduced (e.g., [fast-check](https://github.com/dubzzz/fast-check) for JavaScript), each correctness property maps to one test:

| Property | Generator | Assertion |
|---|---|---|
| P1: Time format | `fc.date()` | output matches `/^\d{2}:\d{2}$/` with correct values |
| P2: Date format | `fc.date()` | output contains weekday, month, day, year |
| P3: Greeting correctness | `fc.integer({min:0, max:23})` | correct greeting string returned |
| P4: Timer format | `fc.integer({min:0, max:1500})` | output matches `/^\d{2}:\d{2}$/` with correct values |
| P5: Reset restores state | `fc.record({remaining: fc.integer({min:0,max:1500}), running: fc.boolean()})` | remaining===1500, running===false |
| P6: Valid task add | `fc.string().filter(s => s.trim().length > 0)` | length+1, label present |
| P7: Whitespace rejected | `fc.stringOf(fc.constantFrom(' ','\t','\n'))` | length unchanged |
| P8: Toggle involution | `fc.boolean()` (initial completed) | double-toggle returns original |
| P9: Edit updates label | `fc.string().filter(s => s.trim().length > 0)` | label === newLabel.trim() |
| P10: Remove eliminates task | `fc.array(taskArb)` + pick random id | id absent after remove |
| P11: Task round-trip | `fc.array(taskArb)` | save→load produces equal array |
| P12: Valid link add | `fc.tuple(nonEmptyStr, nonEmptyStr)` | length+1, link present |
| P13: Invalid link rejected | empty/whitespace label or url | length unchanged |
| P14: Remove eliminates link | `fc.array(linkArb)` + pick random id | id absent after remove |
| P15: Links round-trip | `fc.array(linkArb)` | save→load produces equal array |
| P16: Storage safe on corrupt data | `fc.string()` (arbitrary) | returns [], no throw |

Each property test should run a minimum of **100 iterations**.

Tag format for test comments: `Feature: personal-dashboard, Property N: <property_text>`

### Smoke Tests (Manual)

- Dashboard loads in < 2 s on broadband
- Grid layout adapts at 768 px breakpoint (single column below)
- Font size ≥ 14 px for body text
- Works in Chrome, Firefox, Edge, Safari (latest stable)
