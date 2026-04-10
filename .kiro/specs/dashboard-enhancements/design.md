# Design Document — Dashboard Enhancements

## Overview

This document covers five incremental enhancements to the existing personal dashboard (HTML/CSS/Vanilla JS, no backend, no build step). All changes stay within the three existing files: `index.html`, `css/style.css`, and `js/app.js`. Persistence uses `localStorage` exclusively.

The five features are:

1. **Light/Dark mode toggle** — a theme switch persisted under `dashboard_theme`
2. **Custom name in greeting** — user-supplied name shown in the greeting phrase, persisted under `dashboard_user_name`
3. **Configurable Pomodoro timer duration** — user-settable countdown start value (1–180 min), persisted under `dashboard_timer_duration`
4. **Duplicate task prevention** — case-insensitive deduplication on add and edit
5. **Task sorting** — three sort orders (creation, alphabetical, completion), persisted under `dashboard_sort_order`

A sixth requirement (Settings Persistence) is not a standalone feature; it is the cross-cutting persistence contract that each of the five features satisfies individually.

---

## Architecture

The existing architecture is unchanged: one plain-object widget per concern, all wired up in a single `DOMContentLoaded` handler. Each enhancement extends the relevant widget object in place.

```
index.html          ← markup skeleton (new controls added inline)
css/style.css       ← all styles (dark-mode overrides via [data-theme="dark"])
js/app.js           ← all logic (Storage, GreetingWidget, FocusTimer, TodoList, QuickLinks)
```

### Theme application strategy

Dark mode is implemented with a `data-theme` attribute on `<html>`. CSS custom properties (variables) are declared under `:root` (light defaults) and overridden under `[data-theme="dark"]`. This avoids a flash of unstyled content because the theme is applied synchronously from `localStorage` before the first paint via an inline `<script>` in `<head>`.

```
<html data-theme="light">   ← default; overwritten by inline script before CSS renders
```

### Execution flow (updated)

```
<head> inline script
  └── apply saved theme from localStorage (prevents FOUC)

DOMContentLoaded
  ├── ThemeToggle.init()      → binds toggle button, syncs button label
  ├── GreetingWidget.init()   → starts clock, loads + applies saved name
  ├── FocusTimer.init()       → loads saved duration, renders display, binds controls
  ├── TodoList.init()         → loads tasks + sort order, renders sorted list
  └── QuickLinks.init()       → loads links, renders (unchanged)
```

---

## Components and Interfaces

### ThemeToggle (new)

Manages the `data-theme` attribute on `<html>` and the `dashboard_theme` localStorage key.

```
ThemeToggle.init()
  → reads dashboard_theme from localStorage (default: 'light')
  → sets document.documentElement.dataset.theme
  → binds #theme-toggle click → ThemeToggle.toggle()

ThemeToggle.toggle()
  → flips current theme (light ↔ dark)
  → writes new theme to localStorage
  → updates document.documentElement.dataset.theme
  → updates button label/icon
```

Pure helper (exported for testing):
```js
function oppositeTheme(theme)  // 'light' → 'dark', 'dark' → 'light'
```

### GreetingWidget (extended)

New responsibilities: load/save `dashboard_user_name`, update greeting format.

```
GreetingWidget.init()
  → (existing) starts setInterval for clock
  → loads saved name from localStorage
  → binds #greeting-name-input submit/blur → GreetingWidget.saveName()

GreetingWidget.saveName(value)
  → trims value
  → writes to localStorage under dashboard_user_name
  → calls render()

GreetingWidget.render()   // replaces inline update()
  → reads current name from this.name
  → formats greeting: name ? `${phrase}, ${name}` : phrase
  → updates #greeting-msg
```

Pure helper (extended):
```js
function formatGreeting(phrase, name)
  // name is trimmed; if empty → phrase only; else → `${phrase}, ${name}`
```

### FocusTimer (extended)

New responsibilities: load/save `dashboard_timer_duration`, validate duration input, disable input while running.

```
FocusTimer.duration   // new field: configured minutes (default 25)

FocusTimer.init()
  → loads dashboard_timer_duration from localStorage (default 25)
  → sets this.remaining = this.duration * 60
  → renders display
  → binds #timer-duration-form submit → FocusTimer.setDuration()
  → (existing) binds start/stop/reset buttons

FocusTimer.setDuration(value)
  → parses value as integer
  → validates: integer, 1 ≤ n ≤ 180
  → if valid: this.duration = n, this.remaining = n * 60, save, render
  → if invalid: no-op (retain current duration)

FocusTimer.reset()   // updated
  → stop()
  → this.remaining = this.duration * 60   // uses configured duration, not hardcoded 1500
  → clears timer-finished class
  → render()

FocusTimer.start()   // updated
  → disables #timer-duration-input

FocusTimer.stop()    // updated
  → enables #timer-duration-input
```

Pure helper (extended):
```js
function isValidDuration(value)
  // returns true iff Number.isInteger(Number(value)) && n >= 1 && n <= 180
```

### TodoList (extended)

New responsibilities: `createdAt` on tasks, duplicate detection, sort order.

```
TodoList.sortOrder   // new field: 'creation' | 'alphabetical' | 'completion' (default 'creation')

TodoList.init()
  → load()
  → loads dashboard_sort_order from localStorage (default 'creation')
  → render()
  → binds #todo-form submit (existing, now calls isDuplicate check)
  → binds #todo-sort change → TodoList.setSort()

TodoList.add(label)   // updated
  → trims label; reject if empty (existing)
  → reject if isDuplicate(label) → show error message
  → push { id, label, completed, createdAt: Date.now() }
  → save(), render()

TodoList.edit(id, label)   // updated
  → trims label; reject if empty (existing)
  → reject if isDuplicate(label, id) → retain original label
  → update task.label
  → save(), render()

TodoList.setSort(order)
  → this.sortOrder = order
  → Storage.set('dashboard_sort_order', order)
  → render()

TodoList.getSorted()   // new pure helper
  → returns copy of this.tasks sorted by this.sortOrder

TodoList.render()   // updated
  → uses getSorted() instead of this.tasks directly
```

Pure helpers (exported for testing):
```js
function isDuplicate(tasks, label, excludeId)
  // returns true if any task (excluding excludeId) has label matching trimmed, case-insensitive

function sortTasks(tasks, order)
  // returns new sorted array; does not mutate input
  // 'creation'     → ascending createdAt
  // 'alphabetical' → ascending label.toLowerCase()
  // 'completion'   → incomplete first, then complete; within each group ascending createdAt
```

### Storage (extended)

Two new scalar-value helpers to avoid the `|| []` default that is wrong for non-array values:

```js
Storage.getString(key, defaultValue)
  // localStorage.getItem(key) ?? defaultValue  (no JSON.parse needed)

Storage.setString(key, value)
  // localStorage.setItem(key, value)
```

Existing `Storage.get` / `Storage.set` (JSON array) remain unchanged for `dashboard_tasks` and `dashboard_links`.

---

## Data Models

### Task (updated)

```js
{
  id:        string,   // crypto.randomUUID() or Date.now().toString()
  label:     string,   // non-empty, trimmed
  completed: boolean,  // false on creation
  createdAt: number    // Date.now() at time of creation (ms since epoch)
}
```

Migration: existing tasks loaded from `dashboard_tasks` that lack `createdAt` are assigned `createdAt = 0` on load so they sort stably to the front of creation-order lists.

### localStorage Schema (full)

| Key                       | Type            | Default      | Description                              |
|---------------------------|-----------------|--------------|------------------------------------------|
| `dashboard_tasks`         | `Task[]` (JSON) | `[]`         | All to-do items (now includes createdAt) |
| `dashboard_links`         | `Link[]` (JSON) | `[]`         | All quick-link entries (unchanged)       |
| `dashboard_theme`         | `string`        | `'light'`    | Active colour scheme                     |
| `dashboard_user_name`     | `string`        | `''`         | User's display name for greeting         |
| `dashboard_timer_duration`| `string`        | `'25'`       | Timer duration in minutes                |
| `dashboard_sort_order`    | `string`        | `'creation'` | Active task sort order                   |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Theme toggle is an involution

*For any* starting theme value (`'light'` or `'dark'`), calling `oppositeTheme` twice in succession shall return the original theme value.

**Validates: Requirements 1.2**

---

### Property 2: Theme persistence round-trip

*For any* valid theme value, after the toggle is activated and the theme is written to `localStorage`, reading `dashboard_theme` from `localStorage` shall return that new theme value.

**Validates: Requirements 1.5, 1.6, 6.1**

---

### Property 3: Greeting format with name

*For any* non-empty, non-whitespace-only name string and any greeting phrase, `formatGreeting(phrase, name)` shall return a string of the form `"<phrase>, <trimmed name>"`.

**Validates: Requirements 2.2**

---

### Property 4: Greeting format without name

*For any* string composed entirely of whitespace characters (including the empty string) and any greeting phrase, `formatGreeting(phrase, name)` shall return exactly the phrase with no comma or name suffix.

**Validates: Requirements 2.3, 2.6**

---

### Property 5: Name persistence round-trip

*For any* non-empty name string, after `saveName` is called, `localStorage` under `dashboard_user_name` shall contain the trimmed name.

**Validates: Requirements 2.4, 2.5, 6.2**

---

### Property 6: Valid timer duration is accepted

*For any* integer `n` in [1, 180], `isValidDuration(n)` shall return `true`, and after `setDuration(n)` is called, `FocusTimer.remaining` shall equal `n * 60`.

**Validates: Requirements 3.2**

---

### Property 7: Invalid timer duration is rejected

*For any* value outside the valid range (non-integer, less than 1, greater than 180), `isValidDuration(value)` shall return `false`, and calling `setDuration(value)` shall leave `FocusTimer.duration` and `FocusTimer.remaining` unchanged.

**Validates: Requirements 3.3**

---

### Property 8: Reset restores configured duration

*For any* valid configured duration `d` (in [1, 180]), after calling `reset()`, `FocusTimer.remaining` shall equal `d * 60` regardless of the timer's prior state.

**Validates: Requirements 3.5**

---

### Property 9: Duplicate add is rejected

*For any* task list containing at least one task, submitting a label whose trimmed, case-insensitive value matches any existing task's label shall leave `tasks.length` unchanged.

**Validates: Requirements 4.1, 4.5**

---

### Property 10: Duplicate edit is rejected

*For any* task list with at least two tasks, attempting to edit one task's label to a trimmed, case-insensitive match of any other task's label shall leave that task's label unchanged.

**Validates: Requirements 4.4, 4.5**

---

### Property 11: Creation sort preserves insertion order

*For any* array of tasks with distinct `createdAt` values, `sortTasks(tasks, 'creation')` shall return tasks in ascending `createdAt` order.

**Validates: Requirements 5.2**

---

### Property 12: Alphabetical sort is case-insensitive ascending

*For any* array of tasks, `sortTasks(tasks, 'alphabetical')` shall return tasks such that for every adjacent pair, `tasks[i].label.toLowerCase() <= tasks[i+1].label.toLowerCase()`.

**Validates: Requirements 5.3**

---

### Property 13: Completion sort groups incomplete before complete

*For any* array of tasks, `sortTasks(tasks, 'completion')` shall return a list where all incomplete tasks appear before all complete tasks, and within each group tasks are in ascending `createdAt` order.

**Validates: Requirements 5.4**

---

### Property 14: Sort order invariant is preserved after mutations

*For any* task list, any active sort order, and any single mutation (add, edit, toggle, or remove), the rendered list after the mutation shall satisfy the sort order invariant for that sort order.

**Validates: Requirements 5.9**

---

### Property 15: createdAt is always set on new tasks

*For any* valid (non-empty, non-duplicate) task label, after calling `add(label)`, the resulting task shall have a `createdAt` field that is a positive integer (milliseconds since epoch).

**Validates: Requirements 6.6**

---

### Property 16: Settings gracefully fall back on corrupt localStorage

*For any* non-JSON or otherwise corrupt string stored under any settings key (`dashboard_theme`, `dashboard_user_name`, `dashboard_timer_duration`, `dashboard_sort_order`), calling the relevant init function shall not throw an unhandled exception and shall apply the default value for that setting.

**Validates: Requirements 6.5**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable | `Storage.set`/`setString` are no-ops (try/catch); `Storage.get` returns `[]`, `getString` returns `defaultValue` |
| Corrupt JSON in `dashboard_tasks` or `dashboard_links` | `Storage.get` catches parse error, returns `[]` |
| Corrupt/missing value for settings keys | `Storage.getString` returns the provided `defaultValue` |
| Duplicate task label on add | Rejected; inline error message shown next to input; no task added |
| Duplicate task label on edit | Rejected silently; original label retained |
| Invalid timer duration submitted | Rejected silently; current duration retained |
| Timer running when duration input submitted | Input is disabled while running; submission is not possible |
| Task missing `createdAt` (legacy data) | Assigned `createdAt = 0` on load; sorts stably to front |
| Empty/whitespace task label | Rejected (existing behaviour, unchanged) |
| Empty label or URL for quick link | Rejected (existing behaviour, unchanged) |

---

## Testing Strategy

### Approach

The app has no build step, so tests are written as plain JS modules runnable with a test runner that supports ES modules (e.g., Vitest or Jest with `--experimental-vm-modules`). All widget logic is extracted into pure helper functions that can be tested without a DOM.

**Dual testing approach:**
- **Unit / example tests** — specific inputs, edge cases, error conditions
- **Property-based tests** — universal properties across generated inputs, using [fast-check](https://github.com/dubzzz/fast-check)

### Pure functions under test

| Function | Source |
|---|---|
| `oppositeTheme(theme)` | ThemeToggle |
| `formatGreeting(phrase, name)` | GreetingWidget |
| `isValidDuration(value)` | FocusTimer |
| `isDuplicate(tasks, label, excludeId)` | TodoList |
| `sortTasks(tasks, order)` | TodoList |
| `getGreeting(hour)` | GreetingWidget (existing) |
| `formatTime(seconds)` | FocusTimer (existing) |

### Property-based tests (fast-check, minimum 100 iterations each)

| Property | Generator | Assertion | Tag |
|---|---|---|---|
| P1: Theme toggle involution | `fc.constantFrom('light','dark')` | `oppositeTheme(oppositeTheme(t)) === t` | `Feature: dashboard-enhancements, Property 1` |
| P3: Greeting with name | `fc.tuple(fc.string(), fc.string().filter(s => s.trim().length > 0))` | result === `${phrase}, ${name.trim()}` | `Feature: dashboard-enhancements, Property 3` |
| P4: Greeting without name | `fc.tuple(fc.string(), fc.stringOf(fc.constantFrom(' ','\t','\n')))` | result === phrase | `Feature: dashboard-enhancements, Property 4` |
| P6: Valid duration accepted | `fc.integer({min:1, max:180})` | `isValidDuration(n)` is true; remaining === n*60 | `Feature: dashboard-enhancements, Property 6` |
| P7: Invalid duration rejected | values outside [1,180] or non-integer | `isValidDuration(v)` is false | `Feature: dashboard-enhancements, Property 7` |
| P9: Duplicate add rejected | task list + matching label (random casing) | `tasks.length` unchanged | `Feature: dashboard-enhancements, Property 9` |
| P10: Duplicate edit rejected | task list with ≥2 tasks + matching label | task label unchanged | `Feature: dashboard-enhancements, Property 10` |
| P11: Creation sort | `fc.array(taskArb)` with distinct createdAt | ascending createdAt | `Feature: dashboard-enhancements, Property 11` |
| P12: Alphabetical sort | `fc.array(taskArb)` | adjacent labels satisfy case-insensitive ≤ | `Feature: dashboard-enhancements, Property 12` |
| P13: Completion sort | `fc.array(taskArb)` with mixed completed | incomplete before complete, createdAt order within groups | `Feature: dashboard-enhancements, Property 13` |
| P14: Sort invariant after mutation | task list + sort order + random mutation | sorted invariant holds after mutation | `Feature: dashboard-enhancements, Property 14` |
| P15: createdAt on new tasks | `fc.string().filter(s => s.trim().length > 0)` | createdAt is positive integer | `Feature: dashboard-enhancements, Property 15` |
| P16: Graceful fallback on corrupt storage | `fc.string()` injected into each settings key | no throw; default value applied | `Feature: dashboard-enhancements, Property 16` |

### Unit / example tests

- `oppositeTheme('light')` → `'dark'`; `oppositeTheme('dark')` → `'light'`
- `formatGreeting('Good Morning', 'Alex')` → `'Good Morning, Alex'`
- `formatGreeting('Good Morning', '  ')` → `'Good Morning'`
- `formatGreeting('Good Morning', '')` → `'Good Morning'`
- `isValidDuration(1)` → true; `isValidDuration(180)` → true; `isValidDuration(0)` → false; `isValidDuration(181)` → false; `isValidDuration(1.5)` → false
- `isDuplicate([{label:'Buy milk'}], 'buy milk', null)` → true
- `isDuplicate([{label:'Buy milk'}], 'Buy Milk', null)` → true
- `isDuplicate([{id:'1',label:'Buy milk'}], 'buy milk', '1')` → false (self-exclusion)
- `sortTasks([], 'creation')` → `[]`
- After `FocusTimer.setDuration(45)`: `remaining === 2700`, display shows `'45:00'`
- After `FocusTimer.reset()` with `duration=45`: `remaining === 2700`
- Duplicate add: error message element visible; `tasks.length` unchanged
- Input change after duplicate rejection: error message removed
- Timer start: duration input has `disabled` attribute
- Timer stop/reset: duration input does not have `disabled` attribute
- No `dashboard_theme` in localStorage → `data-theme="light"` on `<html>`
- No `dashboard_timer_duration` in localStorage → `remaining === 1500`
- No `dashboard_sort_order` in localStorage → sort order is `'creation'`
- Legacy task without `createdAt` → assigned `createdAt = 0` on load

### Smoke tests (manual)

- Dashboard loads with correct theme applied before any visible flash
- Theme toggle button is visible without scrolling on 320 px and 1440 px viewports
- All five enhancements survive a hard page refresh
- Works in Chrome, Firefox, Edge, Safari (latest stable)
