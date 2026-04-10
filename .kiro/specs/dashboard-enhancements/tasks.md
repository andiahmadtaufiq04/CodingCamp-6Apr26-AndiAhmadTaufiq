# Implementation Plan: Dashboard Enhancements

## Overview

Incremental implementation of five enhancements to the personal dashboard, all within `index.html`, `css/style.css`, and `js/app.js`. Each task builds on the previous, ending with full integration.

## Tasks

- [x] 1. Extend Storage with scalar helpers and migrate Task model
  - Add `Storage.getString(key, defaultValue)` and `Storage.setString(key, value)` to the `Storage` object in `js/app.js`
  - Update `TodoList.load()` to assign `createdAt = 0` to any loaded task that lacks the field
  - Update `TodoList.add()` to include `createdAt: Date.now()` on every new task object
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 2. Implement Light/Dark mode toggle
  - [x] 2.1 Add FOUC-prevention inline `<script>` in `<head>` of `index.html` that reads `dashboard_theme` from `localStorage` and sets `document.documentElement.dataset.theme` synchronously
  - Add `data-theme="light"` attribute to `<html>` as the default
  - Add `#theme-toggle` button to `index.html` (visible without scrolling)
  - _Requirements: 1.1, 1.6, 1.7_

  - [x] 2.2 Add CSS custom properties and dark-mode overrides to `css/style.css`
  - Declare colour tokens as CSS custom properties on `:root` (light defaults)
  - Add `[data-theme="dark"]` block overriding those tokens for dark colours
  - Update existing colour literals in `style.css` to reference the custom properties
  - _Requirements: 1.3, 1.4_

  - [x] 2.3 Implement `oppositeTheme(theme)` pure helper and `ThemeToggle` widget in `js/app.js`
  - Write `function oppositeTheme(theme)` returning `'dark'` for `'light'` and vice-versa
  - Write `ThemeToggle` object with `init()` and `toggle()` methods
  - `init()` reads `dashboard_theme` via `Storage.getString`, sets `document.documentElement.dataset.theme`, syncs button label
  - `toggle()` calls `oppositeTheme`, writes new theme via `Storage.setString`, updates attribute and button label
  - Wire `ThemeToggle.init()` into the `DOMContentLoaded` handler
  - _Requirements: 1.2, 1.5, 1.6, 1.7_

  - [ ]* 2.4 Write property test for `oppositeTheme` — Property 1: Theme toggle is an involution
    - **Property 1: Theme toggle is an involution**
    - **Validates: Requirements 1.2**

  - [ ]* 2.5 Write unit tests for `ThemeToggle`
    - `oppositeTheme('light')` → `'dark'`; `oppositeTheme('dark')` → `'light'`
    - No `dashboard_theme` in localStorage → `data-theme="light"` on `<html>`
    - _Requirements: 1.6, 1.7_

- [ ] 3. Implement custom name in greeting
  - [x] 3.1 Add name input form (`#greeting-name-form` / `#greeting-name-input`) inside the greeting widget in `index.html`
  - _Requirements: 2.1_

  - [x] 3.2 Implement `formatGreeting(phrase, name)` pure helper and extend `GreetingWidget` in `js/app.js`
  - Write `function formatGreeting(phrase, name)`: trims name; returns `"${phrase}, ${name}"` if non-empty, else `phrase`
  - Add `this.name` field to `GreetingWidget`
  - Replace the inline `update()` closure with a `render()` method that calls `formatGreeting`
  - Add `saveName(value)` method: trims, writes via `Storage.setString('dashboard_user_name', ...)`, calls `render()`
  - In `init()`: load saved name via `Storage.getString('dashboard_user_name', '')`, bind `#greeting-name-form` submit and `#greeting-name-input` blur to `saveName()`
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 3.3 Write property tests for `formatGreeting` — Properties 3 and 4
    - **Property 3: Greeting format with name**
    - **Property 4: Greeting format without name**
    - **Validates: Requirements 2.2, 2.3, 2.6**

  - [ ]* 3.4 Write unit tests for `GreetingWidget` name handling
    - `formatGreeting('Good Morning', 'Alex')` → `'Good Morning, Alex'`
    - `formatGreeting('Good Morning', '  ')` → `'Good Morning'`
    - `formatGreeting('Good Morning', '')` → `'Good Morning'`
    - No `dashboard_user_name` in localStorage → greeting shows phrase only
    - _Requirements: 2.3, 2.5, 2.6_

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement configurable Pomodoro timer duration
  - [x] 5.1 Add duration input form (`#timer-duration-form` / `#timer-duration-input`) to the focus timer widget in `index.html`
  - _Requirements: 3.1_

  - [x] 5.2 Implement `isValidDuration(value)` pure helper and extend `FocusTimer` in `js/app.js`
  - Write `function isValidDuration(value)`: returns `true` iff `Number.isInteger(Number(value)) && n >= 1 && n <= 180`
  - Add `this.duration = 25` field to `FocusTimer`
  - In `init()`: load saved duration via `Storage.getString('dashboard_timer_duration', '25')`, set `this.duration` and `this.remaining = this.duration * 60`
  - Add `setDuration(value)` method: validates with `isValidDuration`, updates `this.duration`, `this.remaining`, saves via `Storage.setString`, calls `render()`; no-op on invalid input
  - Update `reset()` to use `this.duration * 60` instead of hardcoded `1500`
  - Update `start()` to disable `#timer-duration-input`; update `stop()` to re-enable it
  - Bind `#timer-duration-form` submit to `setDuration()` in `init()`
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 5.3 Write property tests for `isValidDuration` — Properties 6 and 7
    - **Property 6: Valid timer duration is accepted**
    - **Property 7: Invalid timer duration is rejected**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]* 5.4 Write property test for `FocusTimer.reset` — Property 8: Reset restores configured duration
    - **Property 8: Reset restores configured duration**
    - **Validates: Requirements 3.5**

  - [ ]* 5.5 Write unit tests for `FocusTimer` duration handling
    - `isValidDuration(1)` → true; `isValidDuration(180)` → true; `isValidDuration(0)` → false; `isValidDuration(181)` → false; `isValidDuration(1.5)` → false
    - After `setDuration(45)`: `remaining === 2700`, display shows `'45:00'`
    - After `reset()` with `duration=45`: `remaining === 2700`
    - Timer start: `#timer-duration-input` has `disabled` attribute
    - Timer stop/reset: `#timer-duration-input` does not have `disabled` attribute
    - No `dashboard_timer_duration` in localStorage → `remaining === 1500`
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.7, 3.8_

- [ ] 6. Implement duplicate task prevention
  - [x] 6.1 Implement `isDuplicate(tasks, label, excludeId)` pure helper in `js/app.js`
  - Returns `true` if any task (excluding `excludeId`) has a label matching trimmed, case-insensitive comparison
  - _Requirements: 4.1, 4.4, 4.5_

  - [x] 6.2 Update `TodoList.add()` and `TodoList.edit()` to use `isDuplicate`
  - In `add()`: call `isDuplicate(this.tasks, label, null)`; if true, show inline error message adjacent to `#todo-input` and return early
  - Bind input event on `#todo-input` to clear the error message when the user modifies the field
  - In `edit()`: call `isDuplicate(this.tasks, label, id)`; if true, silently retain original label (no error shown)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 6.3 Write property tests for `isDuplicate` — Properties 9 and 10
    - **Property 9: Duplicate add is rejected**
    - **Property 10: Duplicate edit is rejected**
    - **Validates: Requirements 4.1, 4.4, 4.5**

  - [ ]* 6.4 Write unit tests for duplicate prevention
    - `isDuplicate([{label:'Buy milk'}], 'buy milk', null)` → true
    - `isDuplicate([{label:'Buy milk'}], 'Buy Milk', null)` → true
    - `isDuplicate([{id:'1',label:'Buy milk'}], 'buy milk', '1')` → false (self-exclusion)
    - Duplicate add: error message element visible; `tasks.length` unchanged
    - Input change after duplicate rejection: error message removed
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement task sorting
  - [x] 8.1 Add sort control (`#todo-sort` select with options `creation`, `alphabetical`, `completion`) to the to-do widget in `index.html`
  - _Requirements: 5.1_

  - [x] 8.2 Implement `sortTasks(tasks, order)` pure helper in `js/app.js`
  - Returns a new sorted array without mutating the input
  - `'creation'` → ascending `createdAt`
  - `'alphabetical'` → ascending `label.toLowerCase()`
  - `'completion'` → incomplete first, then complete; ascending `createdAt` within each group
  - _Requirements: 5.2, 5.3, 5.4_

  - [x] 8.3 Extend `TodoList` with sort state and wire up the sort control
  - Add `this.sortOrder = 'creation'` field
  - In `init()`: load saved sort order via `Storage.getString('dashboard_sort_order', 'creation')`, bind `#todo-sort` change event to `setSort()`
  - Add `setSort(order)` method: updates `this.sortOrder`, saves via `Storage.setString`, calls `render()`
  - Update `render()` to call `sortTasks(this.tasks, this.sortOrder)` instead of iterating `this.tasks` directly
  - _Requirements: 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ]* 8.4 Write property tests for `sortTasks` — Properties 11, 12, 13, and 14
    - **Property 11: Creation sort preserves insertion order**
    - **Property 12: Alphabetical sort is case-insensitive ascending**
    - **Property 13: Completion sort groups incomplete before complete**
    - **Property 14: Sort order invariant is preserved after mutations**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.9**

  - [ ]* 8.5 Write property test for `createdAt` on new tasks — Property 15
    - **Property 15: createdAt is always set on new tasks**
    - **Validates: Requirements 6.6**

  - [ ]* 8.6 Write unit tests for task sorting
    - `sortTasks([], 'creation')` → `[]`
    - Verify creation, alphabetical, and completion sort orders with concrete task arrays
    - No `dashboard_sort_order` in localStorage → sort order is `'creation'`
    - _Requirements: 5.2, 5.3, 5.4, 5.7, 5.8_

- [ ] 9. Validate graceful fallback on corrupt localStorage
  - [ ]* 9.1 Write property test for graceful fallback — Property 16
    - **Property 16: Settings gracefully fall back on corrupt localStorage**
    - **Validates: Requirements 6.5**

  - [ ]* 9.2 Write unit tests for Storage fallback behaviour
    - Corrupt/missing value for each settings key → default value applied, no exception thrown
    - Legacy task without `createdAt` → assigned `createdAt = 0` on load
    - _Requirements: 6.5, 6.6_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical boundaries
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- All changes stay within `index.html`, `css/style.css`, and `js/app.js` — no new files
