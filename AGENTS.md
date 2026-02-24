# AGENTS.md

## Project Overview

An Electron desktop application that corrects dictation transcription text using LLMs (LM Studio / Google Gemini).

**Tech Stack:**
- Electron 33 + React 19 (functional components)
- TypeScript (strict mode)
- Vite + vite-plugin-electron (build)
- Tailwind CSS v4 (styling)
- Vitest (testing)
- electron-store (settings persistence)

## Setup Commands

Requires **Node.js 18+** and npm.

```bash
npm install
cp .env.example .env   # optional — configure LLM provider
```

## Build & Test

```bash
npm run lint    # TypeScript type-checking (tsc --noEmit)
npm test        # Unit tests (vitest run)
npm run build   # Production build (tsc && vite build && electron-builder)
```

> **Note:** This is a GUI Electron app. Do not attempt to run `npm run dev` or `npm run electron:dev` in CI — they launch a desktop window and will hang.

## Project Structure

```
src/
  main/           # Electron main process (IPC handlers, LLM services)
  preload/        # Preload script (contextBridge)
  renderer/       # React UI (components, styles)
  shared/         # Shared type definitions
tests/            # Unit tests
```

## Code Style

### Language & Framework
- TypeScript strict mode for all source files
- React 19 with functional components and hooks only — no class components
- Electron architecture with strict main/preload/renderer process separation
- Tailwind CSS v4 for styling

### Type Safety
- Never use `any` — use `unknown` with type guards or proper interfaces
- Define explicit interfaces for all data structures, IPC messages, and API responses
- Use discriminated unions for state management patterns
- Prefer `as const` assertions over type casts

### Electron Architecture
- Main and renderer communicate only through IPC via contextBridge
- Never expose Node.js APIs directly to the renderer
- Preload scripts must use `contextBridge.exposeInMainWorld` with minimal, well-typed APIs
- Validate all IPC message payloads in the main process

### React Patterns
- Use functional components exclusively
- Manage state with `useState`/`useReducer`; use context to avoid prop drilling
- Memoize with `useMemo` and `useCallback`
- Keep components small; extract reusable logic into custom hooks

### Error Handling
- Wrap async operations in try-catch blocks
- Provide user-friendly error feedback via UI notifications
- Log errors with sufficient context for debugging
- Never silently swallow errors

### Naming Conventions
- Variables and functions: `camelCase`
- React components and types/interfaces: `PascalCase`
- File names: `kebab-case` (e.g., `correction-panel.tsx`)
- Constants: `UPPER_SNAKE_CASE`

## Security

- Never hardcode API keys, secrets, or credentials in source code
- Manage sensitive values through environment variables (`.env`)
- Do not log sensitive information (API keys, user tokens)
- Validate and sanitize all external input before processing

## PR & Commit Guidelines

- All PRs must pass `npm run lint` and `npm test` before merging
- Write atomic commits with clear, descriptive messages in English
- Keep PRs focused on a single concern

## Files to Ignore

Do not modify or review these paths:

- `dist/`
- `dist-electron/`
- `node_modules/`
- `package-lock.json`
- `aidlc-docs/`
- `.aidlc-rule-details/`
