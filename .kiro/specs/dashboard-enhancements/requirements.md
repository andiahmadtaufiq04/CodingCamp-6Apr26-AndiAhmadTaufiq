# Requirements Document

## Introduction

This document specifies five enhancements to the existing personal dashboard web app (HTML/CSS/Vanilla JS, no backend). The app already provides a greeting widget, focus timer, to-do list, and quick links panel, all persisted via `localStorage`. The enhancements add user-configurable preferences (theme, name, timer duration), duplicate-task prevention, and task sorting — all within the same single-file, no-build-step architecture.

## Glossary

- **Dashboard**: The single-page web application that hosts all widgets (unchanged from the base spec).
- **Theme**: The active colour scheme of the Dashboard — either `light` or `dark`.
- **Theme_Toggle**: The UI control that switches the Dashboard between light and dark themes.
- **User_Name**: A user-supplied string displayed inside the greeting message (e.g. "Good Morning, Alex").
- **Greeting_Widget**: The existing UI component that displays the current time, date, and greeting (extended by Requirement 2).
- **Focus_Timer**: The existing countdown timer widget (extended by Requirement 3).
- **Timer_Duration**: The number of minutes the Focus_Timer counts down from, configurable by the user.
- **Todo_List**: The existing task-management widget (extended by Requirements 4 and 5).
- **Task**: A single to-do item with a text label, a completion state, and a creation timestamp (extended from the base spec).
- **Sort_Order**: The active ordering rule applied to the Todo_List — one of `creation` (default), `alphabetical`, or `completion`.
- **Local_Storage**: The browser's `localStorage` API used to persist all data across sessions.
- **Settings**: User preferences (theme, User_Name, Timer_Duration, Sort_Order) persisted to Local_Storage.

---

## Requirements

### Requirement 1: Light/Dark Mode Toggle

**User Story:** As a user, I want to switch between a light and a dark colour scheme, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme_Toggle control that is visible and reachable without scrolling on all supported viewport sizes.
2. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL switch the active Theme from `light` to `dark`, or from `dark` to `light`.
3. WHILE the `dark` Theme is active, THE Dashboard SHALL apply a dark background colour and light foreground colour to all widgets and body text.
4. WHILE the `light` Theme is active, THE Dashboard SHALL apply the default light background colour and dark foreground colour to all widgets and body text.
5. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL persist the selected Theme to Local_Storage under the key `dashboard_theme`.
6. WHEN the Dashboard loads, THE Dashboard SHALL restore the previously saved Theme from Local_Storage and apply it before the first paint.
7. IF no Theme value is found in Local_Storage, THEN THE Dashboard SHALL default to the `light` Theme.

---

### Requirement 2: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting message addresses me personally (e.g. "Good Morning, Alex"), so that the dashboard feels more personalised.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL provide an input control that allows the user to enter or update the User_Name.
2. WHEN the user submits a non-empty User_Name, THE Greeting_Widget SHALL display the greeting in the format `"<greeting phrase>, <User_Name>"` (e.g. "Good Morning, Alex").
3. IF the User_Name is empty or whitespace-only, THEN THE Greeting_Widget SHALL display the greeting phrase without a name suffix (e.g. "Good Morning").
4. WHEN the user submits a User_Name, THE Greeting_Widget SHALL persist the trimmed User_Name to Local_Storage under the key `dashboard_user_name`.
5. WHEN the Dashboard loads, THE Greeting_Widget SHALL restore the previously saved User_Name from Local_Storage and apply it to the greeting immediately.
6. IF no User_Name value is found in Local_Storage, THEN THE Greeting_Widget SHALL display the greeting phrase without a name suffix.

---

### Requirement 3: Configurable Pomodoro Timer Duration

**User Story:** As a user, I want to set the Focus_Timer duration to a value other than 25 minutes, so that I can adapt the timer to my preferred work-session length.

#### Acceptance Criteria

1. THE Focus_Timer SHALL provide an input control that allows the user to specify the Timer_Duration in whole minutes.
2. WHEN the user submits a Timer_Duration that is a whole number between 1 and 180 inclusive, THE Focus_Timer SHALL update the countdown start value to that number of minutes and reset the display to `<Timer_Duration>:00`.
3. IF the user submits a Timer_Duration that is not a whole number, is less than 1, or is greater than 180, THEN THE Focus_Timer SHALL reject the input and retain the current Timer_Duration.
4. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the Timer_Duration input control to prevent mid-session changes.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL restore the display to the currently configured Timer_Duration (not necessarily 25:00).
6. WHEN the user submits a valid Timer_Duration, THE Focus_Timer SHALL persist the value to Local_Storage under the key `dashboard_timer_duration`.
7. WHEN the Dashboard loads, THE Focus_Timer SHALL restore the previously saved Timer_Duration from Local_Storage and initialise the countdown display accordingly.
8. IF no Timer_Duration value is found in Local_Storage, THEN THE Focus_Timer SHALL default to a Timer_Duration of 25 minutes.

---

### Requirement 4: Duplicate Task Prevention

**User Story:** As a user, I want the dashboard to prevent me from adding a task with the same label as an existing one, so that my task list stays clean and free of accidental duplicates.

#### Acceptance Criteria

1. WHEN the user submits a task label whose trimmed, case-insensitive value matches the trimmed, case-insensitive label of any existing Task in the Todo_List, THE Todo_List SHALL reject the submission and display no new Task.
2. WHEN a duplicate task label is rejected, THE Todo_List SHALL display an inline error message adjacent to the task input field indicating that the task already exists.
3. WHEN the user modifies the task input field after a duplicate rejection, THE Todo_List SHALL remove the inline error message.
4. WHEN the user edits an existing Task's label to a trimmed, case-insensitive value that matches any other existing Task's label, THE Todo_List SHALL reject the edit and retain the Task's original label.
5. THE Todo_List SHALL treat task labels as duplicates using a case-insensitive comparison (e.g. "Buy milk" and "buy milk" are considered the same).

---

### Requirement 5: Task Sorting

**User Story:** As a user, I want to sort my task list by completion status, alphabetically, or by creation order, so that I can organise my tasks in the way that is most useful to me.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a sort control that allows the user to select one of three Sort_Order values: `creation` (default), `alphabetical`, or `completion`.
2. WHEN the user selects the `creation` Sort_Order, THE Todo_List SHALL display Tasks in the order they were originally added, oldest first.
3. WHEN the user selects the `alphabetical` Sort_Order, THE Todo_List SHALL display Tasks sorted by their label in case-insensitive ascending alphabetical order.
4. WHEN the user selects the `completion` Sort_Order, THE Todo_List SHALL display incomplete Tasks before completed Tasks, preserving creation order within each group.
5. WHEN the user selects a Sort_Order, THE Todo_List SHALL re-render the list immediately without requiring a page reload.
6. WHEN the user selects a Sort_Order, THE Todo_List SHALL persist the selected Sort_Order to Local_Storage under the key `dashboard_sort_order`.
7. WHEN the Dashboard loads, THE Todo_List SHALL restore the previously saved Sort_Order from Local_Storage and apply it to the initial render.
8. IF no Sort_Order value is found in Local_Storage, THEN THE Todo_List SHALL default to the `creation` Sort_Order.
9. THE Todo_List SHALL apply the active Sort_Order to the rendered list after every add, edit, toggle, or remove operation.

---

### Requirement 6: Settings Persistence

**User Story:** As a user, I want all my preferences to survive page refreshes, so that I do not have to reconfigure the dashboard every time I open it.

#### Acceptance Criteria

1. THE Dashboard SHALL store the active Theme under the Local_Storage key `dashboard_theme`.
2. THE Dashboard SHALL store the User_Name under the Local_Storage key `dashboard_user_name`.
3. THE Dashboard SHALL store the Timer_Duration under the Local_Storage key `dashboard_timer_duration`.
4. THE Dashboard SHALL store the Sort_Order under the Local_Storage key `dashboard_sort_order`.
5. IF Local_Storage is unavailable or returns a parse error for any settings key, THEN THE Dashboard SHALL apply the default value for that setting without throwing an unhandled exception.
6. THE Task data model SHALL include a `createdAt` timestamp (milliseconds since epoch) on each Task to support `creation` Sort_Order, persisted alongside existing Task fields under `dashboard_tasks`.
