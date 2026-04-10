# Implementation Plan: Personal Dashboard

## Overview

Build a single-page personal dashboard using HTML, CSS, and Vanilla JavaScript. All logic lives in `js/app.js`, all styles in `css/style.css`, and the markup in `index.html`. No build step, no framework, no backend.

## Tasks

- [x] 1. Create project file structure and HTML skeleton
  - Create `index.html` with the four widget container elements (`#greeting`, `#focus-timer`, `#todo`, `#quick-links`)
  - Create empty `css/style.css` and `js/app.js` files linked from `index.html`
  - Add input forms and control buttons for each widget in the HTML (timer controls, todo form, links form)
  - _Requirements: 5.1, 5.4_

- [x] 2. Implement layout and visual styles
  - Write CSS grid layout for the four-widget dashboard
  - Add responsive breakpoint: single-column stacking below 768px viewport width
  - Apply consistent typography with body font size ≥ 14px
  - Style widget cards with consistent spacing and visual separation
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 3. Implement Storage utility
  - [x] 3.1 Write the `Storage` object in `app.js` with `get(key)` and `set(key, value)` methods
    - `get`: wraps `JSON.parse(localStorage.getItem(key))` in try/catch, returns `[]` on any error
    - `set`: wraps `localStorage.setItem` in try/catch, no-op on failure
    - Use namespaced keys `dashboard_tasks` and `dashboard_links`
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 3.2 Write property test for Storage safety (Property 16)
    - **Property 16: Storage.get is safe against corrupt data**
    - **Validates: Requirements 6.3**

  - [ ]* 3.3 Write property test for task round-trip (Property 11)
    - **Property 11: Task list localStorage round-trip**
    - **Validates: Requirements 3.6, 3.7**

  - [ ]* 3.4 Write property test for links round-trip (Property 15)
    - **Property 15: Links list localStorage round-trip**
    - **Validates: Requirements 4.5, 4.6**

- [ ] 4. Implement Greeting Widget
  - [x] 4.1 Write `GreetingWidget` object with `init()` in `app.js`
    - Extract pure helper functions: `getTimeString(date)`, `getDateString(date)`, `getGreeting(hour)`
    - `init()` calls `setInterval` every 1000ms to update `#greeting-time`, `#greeting-date`, `#greeting-msg`
    - Time format: zero-padded HH:MM; date format: full weekday, month, day, year
    - Greeting rules: 5–11 → "Good Morning", 12–17 → "Good Afternoon", 18–20 → "Good Evening", 21–23/0–4 → "Good Night"
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 4.2 Write property test for time formatting (Property 1)
    - **Property 1: Time formatting is always HH:MM**
    - **Validates: Requirements 1.1**

  - [ ]* 4.3 Write property test for date formatting (Property 2)
    - **Property 2: Date formatting contains all required components**
    - **Validates: Requirements 1.2**

  - [ ]* 4.4 Write property test for greeting correctness (Property 3)
    - **Property 3: Greeting is correct for every hour of the day**
    - **Validates: Requirements 1.3, 1.4, 1.5, 1.6**

- [ ] 5. Implement Focus Timer
  - [x] 5.1 Write `FocusTimer` object with `init()`, `start()`, `stop()`, `reset()`, `tick()`, `onFinish()`, `render()` in `app.js`
    - Internal state: `remaining` (seconds, init 1500), `timerId` (null), `running` (false)
    - `render()` writes formatted MM:SS to `#timer-display` using `formatTime(seconds)`
    - `start()` is a no-op if already running; `stop()` is a no-op if already stopped
    - `onFinish()` calls `stop()` and applies `.timer-finished` CSS class
    - Bind `#timer-start`, `#timer-stop`, `#timer-reset` buttons
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 5.2 Write property test for timer format (Property 4)
    - **Property 4: Timer format is always MM:SS**
    - **Validates: Requirements 2.7**

  - [ ]* 5.3 Write property test for timer reset (Property 5)
    - **Property 5: Timer reset always restores initial state**
    - **Validates: Requirements 2.5**

- [x] 6. Checkpoint — core widgets working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement To-Do List
  - [x] 7.1 Write `TodoList` object with `init()`, `add(label)`, `toggle(id)`, `edit(id, label)`, `remove(id)`, `load()`, `save()`, `render()` in `app.js`
    - Task model: `{ id, label, completed }` — id via `crypto.randomUUID()` or `Date.now().toString()`
    - `add`: trim label, reject if empty/whitespace-only, push task, save, render
    - `render()` rebuilds `#todo-list` DOM; completed tasks get a visual distinction CSS class
    - Inline edit: clicking edit replaces label text with an input, saves on confirmation
    - Bind the add form submit; bind complete/edit/delete controls per task in `render()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 7.2 Write property test for valid task add (Property 6)
    - **Property 6: Adding a valid task grows the list**
    - **Validates: Requirements 3.1**

  - [ ]* 7.3 Write property test for whitespace label rejection (Property 7)
    - **Property 7: Whitespace-only labels are rejected**
    - **Validates: Requirements 3.2**

  - [ ]* 7.4 Write property test for toggle involution (Property 8)
    - **Property 8: Toggling completion is an involution**
    - **Validates: Requirements 3.3**

  - [ ]* 7.5 Write property test for edit updates label (Property 9)
    - **Property 9: Editing a task updates its label**
    - **Validates: Requirements 3.4**

  - [ ]* 7.6 Write property test for remove eliminates task (Property 10)
    - **Property 10: Removing a task eliminates it from the list**
    - **Validates: Requirements 3.5**

- [ ] 8. Implement Quick Links
  - [x] 8.1 Write `QuickLinks` object with `init()`, `add(label, url)`, `remove(id)`, `load()`, `save()`, `render()` in `app.js`
    - Link model: `{ id, label, url }` — prepend `https://` if no protocol present
    - `add`: reject if label or url is empty/whitespace-only, push link, save, render
    - `render()` rebuilds `#links-list` DOM; each link is a button that calls `window.open(url, '_blank')`
    - Bind the add form submit; bind delete controls per link in `render()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 8.2 Write property test for valid link add (Property 12)
    - **Property 12: Adding a valid link grows the links list**
    - **Validates: Requirements 4.1**

  - [ ]* 8.3 Write property test for invalid link rejection (Property 13)
    - **Property 13: Invalid link submissions are rejected**
    - **Validates: Requirements 4.2**

  - [ ]* 8.4 Write property test for remove eliminates link (Property 14)
    - **Property 14: Removing a link eliminates it from the list**
    - **Validates: Requirements 4.4**

- [ ] 9. Wire everything together in app.js
  - [x] 9.1 Add `DOMContentLoaded` listener that calls `GreetingWidget.init()`, `FocusTimer.init()`, `TodoList.init()`, `QuickLinks.init()` in order
    - Ensure no widget depends on another widget's state
    - _Requirements: 5.3_

  - [ ]* 9.2 Write unit tests for edge cases
    - `formatTime(1500)` → `"25:00"`, `formatTime(0)` → `"00:00"`, `formatTime(90)` → `"01:30"`
    - `Storage.get` with corrupt JSON returns `[]` without throwing
    - localStorage keys are exactly `dashboard_tasks` and `dashboard_links`
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 10. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests can be run with a minimal inline harness or fast-check; each property should run ≥ 100 iterations
- Tag format for test comments: `Feature: personal-dashboard, Property N: <property_text>`
