---
description: Security-scan, push to GitHub, write README + About, deploy GitHub Pages with Actions CI/CD
argument-hint: <owner/repo> [public|private]
---

# Ship this project to GitHub

GitHub target from the user: **$ARGUMENTS**

Work through the steps below in order. Use the `gh` CLI for every GitHub operation. Stop and report if any step fails; do not skip a step silently.

## 0. Gather inputs

- Parse `$ARGUMENTS` as `owner/repo` plus an optional visibility (`public` or `private`).
- If the repo or the visibility is missing, ask the user with AskUserQuestion. Never guess the visibility. Free GitHub accounts can only use Pages on public repos, so say so if they pick private.
- Run `gh auth status`. If not logged in, tell the user to run `! gh auth login` and stop.
- Check whether the repo already exists: `gh repo view <owner/repo>`.

## 1. Security scan (BEFORE anything leaves this machine)

Nothing is pushed until this step passes.

1. Make sure a `.gitignore` exists and covers at least: `.venv/`, `venv/`, `.idea/`, `.vscode/`, `__pycache__/`, `node_modules/`, `.env`, `.env.*`, `*.pem`, `*.key`, `*.log`, `.DS_Store`, `.claude/settings.local.json`. Add anything that is missing.
2. Work out exactly what would be committed: `git init` if needed, `git add -A`, then `git status --short` (and `git ls-files` for an existing repo).
3. Scan **every file that would be pushed**, including the full git history if the repo already has commits:
   - If `gitleaks` is installed, run `gitleaks detect --source . -v` (and `gitleaks protect --staged`). Otherwise use Grep with these patterns:
     - Private keys: `-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----`
     - Tokens: `ghp_[A-Za-z0-9]{36}`, `gho_`, `github_pat_`, `AKIA[0-9A-Z]{16}`, `sk-[A-Za-z0-9]{20,}`, `xox[baprs]-`, `AIza[0-9A-Za-z_-]{35}`
     - Assignments: `(?i)(password|passwd|secret|api[_-]?key|token|client[_-]?secret)\s*[:=]\s*['"][^'"]{6,}`
     - Connection strings: `(?i)(mongodb|postgres|mysql|redis)://[^\s'"]+:[^\s'"]+@`
   - Flag sensitive files by name: `.env*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`, `credentials*`, `*.sqlite`, `*.db`, database dumps, and any file over 5 MB.
   - Flag personal data: real email addresses (except placeholders like `example.com`), phone numbers, internal hostnames or IPs.
   - Flag third-party trademarks or logos the project should not be publishing.
4. If anything is found: **stop**. Show the user each finding as `file:line` with the match masked (e.g. `ghp_****abcd`), suggest the fix (remove it, move it to an env var or GitHub secret, or add it to `.gitignore`), and wait for them to approve before going on. If a secret is already in git history, warn them that it must be rotated. Rewriting history does not undo a leak that has already been pushed.
5. Only continue once the scan is clean or the user has approved each finding.

## 2. Push the code

- New repo: commit, then `gh repo create <owner/repo> --<visibility> --source=. --remote=origin --push`.
- Existing repo: make sure `origin` points at it, commit, then `git push -u origin <branch>`. Never force-push without asking.
- Default branch is `main`. End commit messages with the attribution lines from the system reminder, if there is one.

## 3. Work out the project facts

Read the code (entry points, `package.json`, `pyproject.toml`, `requirements.txt`, `index.html`, etc.) to determine:
- The language, frameworks and tools that are actually used (for the badges)
- How to install and how to run it locally
- Whether it is a static site (deploy the files as they are) or needs a build step (and what the output folder is)
- Any test and lint commands

Only use facts you can confirm from the code.

## 4. README.md (create or update)

If a README exists, keep any content the user wrote and update the rest. It must include:
- Title, a one-line description, and a **Live demo** link: `https://<owner>.github.io/<repo>/`
- **Tech badges** from shields.io for the real stack, plus a CI status badge:
  `![Deploy](https://github.com/<owner>/<repo>/actions/workflows/pages.yml/badge.svg)`
  Example tech badge: `![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)`
- **Features**: a short list
- **Installation**: copy-pasteable commands (`git clone ...`, dependency install if there is one)
- **How to run**: the exact local run commands. For a static page, cover both opening the file directly and a local server (`python -m http.server 8000`).
- **Deployment**: a note that pushes to `main` deploy automatically via GitHub Actions
- Any config the user has to fill in (placeholders, endpoints, env vars)

## 5. CI/CD with GitHub Actions

Create `.github/workflows/pages.yml`:
- Triggers: `push` to `main`, plus `workflow_dispatch`
- `permissions: contents: read, pages: write, id-token: write`
- `concurrency: { group: pages, cancel-in-progress: false }`
- A `build` job that runs checkout, any install/lint/test/build steps the project actually has, `actions/configure-pages@v5`, then `actions/upload-pages-artifact@v3` pointing at the site folder (`.` for a static site at the repo root; exclude non-site files where you can)
- A `deploy` job that `needs: build`, uses `environment: { name: github-pages, url: ${{ steps.deployment.outputs.page_url }} }`, and runs `actions/deploy-pages@v4` with `id: deployment`

Commit and push the workflow.

## 6. GitHub Pages

- Set Pages to deploy from Actions:
  - Not enabled yet: `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`
  - Already enabled: `gh api -X PUT repos/<owner>/<repo>/pages -f build_type=workflow`
- Trigger or wait for the run: `gh run list --workflow=pages.yml --limit 1`, then `gh run watch <id> --exit-status`.
- Check the site is live: `curl -s -o /dev/null -w "%{http_code}" https://<owner>.github.io/<repo>/` must return `200`. If the run fails, read the log with `gh run view <id> --log-failed`, fix the problem, and push again.

## 7. About section

```
gh repo edit <owner/repo> \
  --description "<one-line description>" \
  --homepage "https://<owner>.github.io/<repo>/" \
  --add-topic <topic> --add-topic <topic>
```
Use 3–8 lowercase topics that match the stack and the purpose. Confirm with `gh repo view <owner/repo> --json description,homepageUrl,repositoryTopics`.

## 8. Final check and report

- Run the step 1 scan again over everything now on GitHub (`git ls-files` on the pushed branch, including the new README and workflow).
- Report to the user:
  - Repo URL and visibility
  - Live Pages URL (the link to share)
  - Actions run status
  - Security scan result: clean, or what was found and what was done about it
  - Anything left for the user to do (placeholders to fill in, secrets to add under Settings → Secrets)
