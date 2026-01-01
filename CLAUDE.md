# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electron desktop application boilerplate using React 19, TypeScript, and electron-vite.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (runs typecheck first) |
| `npm run build:win` | Build Windows installer |
| `npm run build:mac` | Build macOS DMG |
| `npm run build:linux` | Build Linux packages |
| `npm run typecheck` | Run all TypeScript checks |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

## Architecture

Three-process Electron architecture:

1. **Main Process** (`src/main/index.ts`) - App lifecycle, window creation, IPC handlers
2. **Preload Script** (`src/preload/index.ts`) - Secure bridge exposing `window.electron` and `window.api` via contextBridge
3. **Renderer Process** (`src/renderer/src/`) - React application

**IPC Pattern:**
- Main listens: `ipcMain.on('channel', handler)`
- Renderer sends: `window.electron.ipcRenderer.send('channel')`

## TypeScript Configuration

Three separate tsconfig files:
- `tsconfig.node.json` - Main and preload processes
- `tsconfig.web.json` - Renderer process (includes path alias `@renderer/*` → `src/renderer/src/*`)
- `tsconfig.json` - Composite root

## Code Style

- Single quotes, no semicolons, 100 char line width
- No trailing commas
- Configured in `.prettierrc.yaml` and `eslint.config.mjs`

## Key Patterns

- Import images with `?asset` suffix for Vite handling
- Preload exposes APIs through `window.electron` (from @electron-toolkit) and `window.api` (custom)
- Context isolation enabled, sandbox disabled for Node access

## Session Start Protocol

**At the START of every session:**

1. Run `git status` and `git log --oneline -5` to understand current state
2. Review any uncommitted changes from previous sessions
3. Commit or stash any dangling work before starting new tasks

## Git Commit Requirements

**CRITICAL REQUIREMENT - You MUST follow this:**

When you complete ANY task (bug fix, feature addition, refactoring, configuration, documentation):

1. **Review changes** with `git status` and `git diff`
2. **Create a detailed commit message** that includes:
   - **Summary line**: Conventional commit format (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`)
   - **What changed**: Specific files, functions, or components modified
   - **Why it changed**: Purpose, context, problem being solved
3. **Commit immediately** after task completion
4. **Do NOT batch multiple unrelated tasks** - commit after EACH completed task

**Commit Message Format:**

```
<type>: <short summary in imperative mood>

- Detailed point about what changed
- Why this change was needed
- Technical context if relevant

Files modified: <paths>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Commit Types:**

- `feat:` - New feature or functionality
- `fix:` - Bug fix
- `refactor:` - Code restructuring without behavior change
- `docs:` - Documentation changes
- `chore:` - Configuration, dependencies, tooling

**This is NOT optional - commit after EVERY completed task.**

## NEXT STEPS

- **REVIEW GIT HISTORY**: Last 4 commits, read them now
- **Tell the user**: Echo "READY AND CAUGHT UP" to the user
