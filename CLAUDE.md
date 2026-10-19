# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The only real code is `index.html`, an IT PMO Kanban board with a squad-lead dashboard for a banking IT team. It is one self-contained file of vanilla HTML, CSS and JS with no build step, JS dependencies, tests or linter. The only external load is Google Fonts (Source Sans 3, Source Serif 4, IBM Plex Mono), with system font fallbacks. The Python virtualenv exists but nothing uses it yet.

## Running

Open `index.html` in a browser directly, or serve the folder with `.\.venv\Scripts\python.exe -m http.server` and browse to http://localhost:8000.

## index.html layout

- `<style>` at the top holds all CSS. The design follows the HTML5 UP "Strata" layout: a fixed dark sidebar (`.side`, with animated `.strata` layers) and light content sections (`.sec`). Colours are tokens on `:root`; status colours (`--st-*`) and RAG colours (`--green`/`--amber`/`--red`/`--critical`) are mirrored in JS as `STATUS_COLORS` and `RAG_COLORS` and must stay in sync. Priority colours on cards use `task--<priority>` classes. All animation is switched off under `prefers-reduced-motion`.
- Motion: sections have `.reveal`; `initMotion()` adds `.in` when a section scrolls into view, which starts its paused `a-*` animation classes (`a-draw` needs `pathLength="1"`). `onSectionVisible()` runs count-ups and the forecast ring.
- The markup has the sidebar (`live-*`, `gauge-*`, `#nav`, `#toggle-panel`), eight sections (`#overview`, `#portfolio`, `#delivery`, `#forecast`, `#roadmap`, `#risk`, `#team`, `#board-sec`), the Add Task drawer (`#task-panel`, form fields `f-*` with error spans `e-*`), the WhatsApp widget (`wa-*`), a filter bar (`filter-*`) and four columns (`.column[data-status]`).
- The `<script>` at the bottom has:
  - Config constants: `FORMSUBMIT_ENDPOINT` (a placeholder email that must be replaced before notifications work), `TASK_ID_PREFIX`, `NOTIFY_TIMEOUT_MS`, and `WHATSAPP_NUMBER` / `WHATSAPP_MESSAGE` (digits only, country code first; the chat button opens `wa.me` with this number).
  - Domain lists: `STATUSES`, `PRIORITIES`, `PROJECTS`, `CATEGORIES`, `WIP_LIMITS`. The selects are populated from these, so add values here rather than in the markup.
  - Demo dashboard data: `SPRINTS`, `BURNDOWN`, `RELEASE`, `WORKSTREAMS`, `ROADMAP`, `FREEZE`, `TEAM`, `RISKS`, `INCIDENTS`, `COMPLIANCE`. Dates are day offsets from today so the page never goes stale.
  - Analytics: `computeStaticAnalytics()` derives cycle-time percentiles, the velocity forecast, burndown projection and the Monte Carlo release forecast (`simulateFinish()`, seeded so results are stable), including the descope and extra-capacity levers. `computeLiveAnalytics()` recomputes the health score and its drivers from the live board.
  - State: tasks are kept in memory only and reseeded by `seedTasks()` on every load. Nothing is persisted.
  - Rendering: static charts are drawn once at boot (`renderVelocity`, `renderBurndown`, `renderCfd`, `renderCycle`, `renderForecast`, `renderGantt`, `renderRisk`, `renderTeam`, `renderPortfolio`). `renderBoard()` re-renders the columns and then `renderSummary()`, which refreshes the live parts: health gauge, briefing (`buildBriefing()`), KPIs and the status donut. Filter changes set `state.filterOnly` so they redraw only the board. User text must go through `escapeHtml()`.
  - Mutations: `addTask`, `moveTask` and `deleteTask` update state and then re-render. `moveTask` warns when a column goes over its WIP limit. Cards move by drag and drop or through the per-card "move" select, which is the keyboard path.
  - `notifyNewTask()` POSTs new tasks to FormSubmit. A failure only shows a toast and does not block adding the task.
  - Page hooks: user actions call `fireHook(name, detail)` (`whatsapp.opened`, `whatsapp.chat-started`, `task.added`, `task.moved`, `task.deleted`, `wip.breached`), and `initHooks()` registers the handlers with `onHook()`. `"*"` handlers run for every event; they log to the console and POST to `HOOK_WEBHOOK_URL` when it is set. `whatsappContext()` builds the pre-filled WhatsApp message from `state.viewing` (section in view) and `state.lastCardId`. `showHookEvent()` drives the on-page "hooks fired" feed.

## Hooks

`.claude/settings.json` registers a PostToolUse hook ("Site Guard", `.claude/hooks/check-site.mjs`) on Write/Edit. When `index.html` changes it checks that the inline scripts parse, every `getElementById` target exists, ids are unique, `WHATSAPP_NUMBER` is digits-only international format, and external scripts pin a version. On success it shows a one-line report; on failure it exits 2 so the problems must be fixed before continuing. Either way it also shows a Windows toast notification (sent before the hook exits, so Claude Code cannot kill it) and appends a line to `%TEMP%\site-guard.log`, which is the quickest way to confirm the hook fired.

## Environment

- Platform: Windows. The project folder is inside OneDrive.
- Git repo on `main`. `.venv/`, `.idea/` and `__pycache__/` are gitignored.
- Interpreter: CPython 3.11.0 in `.venv`, which only has pip, setuptools and wheel. Run Python through the venv:
  - PowerShell: `.\.venv\Scripts\python.exe`
  - Git Bash: `.venv/Scripts/python.exe`
