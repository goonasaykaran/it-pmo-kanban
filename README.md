# IT PMO Kanban

A single-page Kanban board for tracking IT project tasks across Backlog, In Progress, Blocked and Done.

**Live demo:** https://goonasaykaran.github.io/it-pmo-kanban/

![Deploy](https://github.com/goonasaykaran/it-pmo-kanban/actions/workflows/pages.yml/badge.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-222222?logo=githubpages&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)

## Features

- Four columns: Backlog, In Progress, Blocked, Done
- Move cards by drag and drop, or with the per-card "Move to" dropdown, which works from the keyboard
- Add Task form with validation (title, project, category, assignee, priority, status, due date)
- Filter by project, assignee and priority
- Live summary of totals per column and overdue tasks
- Optional email notification for new tasks via [FormSubmit](https://formsubmit.co)
- Plain HTML, CSS and JavaScript in one file, with no dependencies or build step

Tasks are kept in memory only. Reloading the page resets the board to 8 sample tasks.

## Installation

```bash
git clone https://github.com/goonasaykaran/it-pmo-kanban.git
cd it-pmo-kanban
```

There is nothing to install.

## How to run

Either open `index.html` directly in your browser, or serve the folder locally:

```bash
python -m http.server 8000
```

Then browse to http://localhost:8000.

## Configuration

To get email notifications for new tasks, replace the placeholder in `index.html`:

```js
const FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/YOUR_EMAIL@example.com";
```

FormSubmit sends a one-time activation email to that address the first time it's used. Until you set a real address, tasks are still added, and a toast says the notification failed.

## Deployment

Every push to `main` deploys the site to GitHub Pages automatically through GitHub Actions (`.github/workflows/pages.yml`).
