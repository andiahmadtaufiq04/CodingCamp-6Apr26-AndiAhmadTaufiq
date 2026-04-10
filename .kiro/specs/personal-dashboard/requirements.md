# Requirements Document

## Introduction

A personal dashboard web app built with HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend, using Local Storage for persistence. The dashboard provides four core widgets: a greeting with live time/date, a focus timer, a to-do list, and a quick links panel. It can be used as a standalone web page or packaged as a browser extension.

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-based greeting message.
- **Focus_Timer**: The UI component that counts down from 25 minutes to help the user focus.
- **Todo_List**: The UI component that manages a list of tasks.
- **Task**: A single to-do item with a text label and a completion state.
- **Quick_Links**: The UI component that displays user-defined shortcut buttons to external URLs.
- **Link**: A single quick-link entry with a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used to persist tasks and links across sessions.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting, so that I have an at-a-glance overview when I open the dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time in HH:MM format, updated every second.
2. THE Greeting_Widget SHALL display the current date in a human-readable format (e.g., "Monday, July 14, 2025").
3. WHEN the current hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the current hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the current hour is between 18:00 and 20:59, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the current hour is between 21:00 and 04:59, THE Greeting_Widget SHALL display the greeting "Good Night".

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can manage focused work sessions.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes (25:00).
2. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down in one-second intervals.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown at the current value.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active countdown and restore the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual indication that the session has ended.
7. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL display the remaining time in MM:SS format.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks, so that I can track what I need to do during my session.

#### Acceptance Criteria

1. WHEN the user submits a non-empty task label, THE Todo_List SHALL add a new Task to the list and display it immediately.
2. IF the user submits an empty or whitespace-only task label, THEN THE Todo_List SHALL reject the submission and display no new Task.
3. WHEN the user activates the complete control on a Task, THE Todo_List SHALL toggle the Task's completion state and apply a visual distinction to completed Tasks.
4. WHEN the user activates the edit control on a Task, THE Todo_List SHALL allow the user to modify the Task's label inline and save the updated label on confirmation.
5. WHEN the user activates the delete control on a Task, THE Todo_List SHALL remove the Task from the list permanently.
6. WHEN any Task is added, updated, or removed, THE Todo_List SHALL persist the current task list to Local_Storage.
7. WHEN the Dashboard loads, THE Todo_List SHALL restore all previously saved Tasks from Local_Storage and display them in their last-known state.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and access shortcut buttons to my favourite websites, so that I can navigate quickly without typing URLs.

#### Acceptance Criteria

1. WHEN the user submits a Link with a non-empty label and a valid URL, THE Quick_Links SHALL add the Link and display it as a clickable button.
2. IF the user submits a Link with an empty label or an empty URL, THEN THE Quick_Links SHALL reject the submission and display no new Link.
3. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
4. WHEN the user activates the delete control on a Link, THE Quick_Links SHALL remove the Link from the panel permanently.
5. WHEN any Link is added or removed, THE Quick_Links SHALL persist the current link list to Local_Storage.
6. WHEN the Dashboard loads, THE Quick_Links SHALL restore all previously saved Links from Local_Storage and display them as clickable buttons.

---

### Requirement 5: Layout and Visual Design

**User Story:** As a user, I want a clean, minimal, and responsive interface, so that the dashboard is easy to read and use on any screen size.

#### Acceptance Criteria

1. THE Dashboard SHALL arrange all four widgets in a grid layout that adapts to the viewport width without horizontal scrolling.
2. THE Dashboard SHALL apply consistent typography with a readable font size of at least 14px for body text.
3. THE Dashboard SHALL load and render all widgets within 2 seconds on a standard broadband connection.
4. THE Dashboard SHALL function correctly in the latest stable versions of Chrome, Firefox, Edge, and Safari without requiring any plugins or extensions.
5. WHERE the viewport width is less than 768px, THE Dashboard SHALL stack widgets in a single-column layout.

---

### Requirement 6: Data Persistence

**User Story:** As a user, I want my tasks and links to survive page refreshes, so that I do not lose my data between sessions.

#### Acceptance Criteria

1. THE Dashboard SHALL store all Task data under a single, namespaced Local_Storage key (e.g., `dashboard_tasks`).
2. THE Dashboard SHALL store all Link data under a single, namespaced Local_Storage key (e.g., `dashboard_links`).
3. IF Local_Storage is unavailable or returns a parse error, THEN THE Dashboard SHALL initialise with an empty task list and an empty link list without throwing an unhandled exception.
