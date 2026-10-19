# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The only real code is `index.html`, an IT PMO Kanban board demo. It is one self-contained file of vanilla HTML, CSS and JS with no build step, dependencies, tests or linter. The Python virtualenv exists but nothing uses it yet.

## Running

Open `index.html` in a browser directly, or serve the folder with `.\.venv\Scripts\python.exe -m http.server` and browse to http://localhost:8000.

## index.html layout

- `<style>` at the top holds all CSS. Priority colours are applied through `card--<priority>` classes.
- The markup has a summary bar (`sum-*` ids), an Add Task side panel (`#task-panel`, form fields `f-*` with error spans `e-*`), a filter bar (`filter-*`) and four columns (`.column[data-status]`).
- The `<script>` at the bottom has:
  - Config constants: `FORMSUBMIT_ENDPOINT` (a placeholder email that must be replaced before notifications work), `TASK_ID_PREFIX`, `NOTIFY_TIMEOUT_MS`.
  - Domain lists: `STATUSES`, `PRIORITIES`, `PROJECTS`, `CATEGORIES`. The selects are populated from these, so add values here rather than in the markup.
  - State: tasks are kept in memory only and reseeded by `seedTasks()` on every load. Nothing is persisted.
  - Rendering: `renderBoard()` re-renders everything from state, and `renderCard()` builds each card. User text must go through `escapeHtml()`.
  - Mutations: `addTask`, `moveTask` and `deleteTask` update state and then re-render. Cards move by drag and drop or through the per-card "move" select, which is the keyboard path.
  - `notifyNewTask()` POSTs new tasks to FormSubmit. A failure only shows a toast and does not block adding the task.

## Environment

- Platform: Windows. The project folder is inside OneDrive.
- Git repo on `main`. `.venv/`, `.idea/` and `__pycache__/` are gitignored.
- Interpreter: CPython 3.11.0 in `.venv`, which only has pip, setuptools and wheel. Run Python through the venv:
  - PowerShell: `.\.venv\Scripts\python.exe`
  - Git Bash: `.venv/Scripts/python.exe`
