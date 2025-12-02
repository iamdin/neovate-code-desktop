# AGENTS.md

This file provides guidance to neovate when working with code in this repository.

## WHY: Purpose and Goals
Neovate Code Desktop is an Electron-based desktop application for the Neovate AI coding assistant. It provides a rich UI for interacting with AI agents, managing workspaces, and visualizing code changes.

## WHAT: Technical Stack
- Runtime: Node.js (Electron Main Process)
- Frontend: React 19, TypeScript, Vite
- State Management: Zustand
- Styling: Tailwind CSS 4
- Testing: Vitest
- Build: Electron Builder

## HOW: Core Development Workflow
```bash
# Development (Main + Renderer)
npm run dev

# Testing
npm test

# Build
npm run package:mac
```

## Progressive Disclosure

For detailed information, consult these documents as needed:

- `docs/agent/development_commands.md` - All build, test, lint, release commands
- `docs/agent/architecture.md` - Module structure, IPC, and State Management
- `docs/agent/testing.md` - Test setup and conventions

**When working on a task, first determine which documentation is relevant, then read only those files.**
