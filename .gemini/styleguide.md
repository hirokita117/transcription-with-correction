# Code Review Style Guide

## Language & Framework

- TypeScript strict mode is required for all source files
- React 19 with functional components and hooks
- Electron architecture with strict main/preload/renderer process separation
- Tailwind CSS v4 for styling

## Type Safety

- Never use `any` type — use `unknown` with type guards or proper interfaces
- Define explicit interfaces for all data structures, IPC messages, and API responses
- Use discriminated unions for state management patterns
- Prefer `as const` assertions over type casts where possible

## Electron Architecture

- Main process and renderer process must communicate only through IPC via contextBridge
- Never expose Node.js APIs directly to the renderer process
- Preload scripts must use contextBridge.exposeInMainWorld with minimal, well-typed APIs
- Validate all IPC message payloads in the main process before processing

## React Patterns

- Use functional components exclusively — no class components
- Manage state with useState/useReducer hooks; avoid prop drilling with context when appropriate
- Memoize expensive computations with useMemo and callbacks with useCallback
- Keep components focused and small; extract reusable logic into custom hooks

## Error Handling

- Wrap async operations in try-catch blocks
- Provide user-friendly error feedback via UI notifications
- Log errors with sufficient context for debugging
- Never silently swallow errors

## Naming Conventions

- Variables and functions: camelCase (`getUserName`, `isLoading`)
- React components and types/interfaces: PascalCase (`CorrectionPanel`, `TranscriptionResult`)
- File names: kebab-case (`correction-panel.tsx`, `use-transcription.ts`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`, `API_TIMEOUT_MS`)

## Security

- Never hardcode API keys, secrets, or credentials in source code
- Manage sensitive values through environment variables
- Do not log sensitive information (API keys, user tokens)
- Validate and sanitize all external input before processing
