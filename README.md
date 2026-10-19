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
- Work-in-progress limits on In Progress and Blocked, with due-date countdowns on every card
- Squad-lead dashboard for a banking IT team, with demo data ranging from green to critical:
  - Lead's briefing: a ranked list of what needs action today, plus KPI tiles with trend lines
  - Portfolio RAG table: progress, schedule slip, budget burn vs plan and next milestone per workstream
  - Past delivery: velocity vs commitment, sprint burndown, cumulative flow and cycle-time charts
  - Forecast: a Monte Carlo simulation of the release date against a regulatory deadline, with the scope cut or extra capacity needed to hit it
  - Roadmap timeline with milestones, month-end batch windows and the year-end change freeze
  - Risk heatmap, incident restore times against SLA, compliance calendar and team capacity
- Live delivery-health score that updates as cards move
- Floating WhatsApp chat button (set your number in `WHATSAPP_NUMBER`)
- Strata-style layout with scroll-triggered chart animation that switches off when the system asks for reduced motion
- Optional email notification for new tasks via [FormSubmit](https://formsubmit.co)
- Plain HTML, CSS and JavaScript in one file, with no JavaScript libraries or build step (fonts load from Google Fonts)

Tasks are kept in memory only. Reloading the page resets the board to 12 sample tasks. The dashboard figures are demo data.

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
