# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This is a newly created PyCharm Python project. It has no source code, dependency manifest, tests, or lint/build configuration yet. Update this file once real code and tooling are added.

## Environment

- Platform: Windows. The project folder is inside OneDrive.
- Interpreter: CPython 3.11.0 in the project virtualenv at `.venv` (it was built from a local install at `..\python-3.11.0`). Only pip, setuptools and wheel are installed.
- Run Python through the venv rather than any global interpreter:
  - PowerShell: `.\.venv\Scripts\python.exe`
  - Git Bash: `.venv/Scripts/python.exe`
- Install packages with `.\.venv\Scripts\python.exe -m pip install <pkg>`.
- PyCharm settings live in `.idea/`, and `.venv` is excluded from indexing. The project is not a git repository yet.
