# Testing

## Framework
- **Runner**: Vitest
- **Environment**: Happy DOM (implied for React components) or Node (for logic).

## Structure
- Tests are co-located with source files or in `src/renderer/*.test.ts(x)`.
- Key test files:
  - `src/renderer/store.test.ts`: Tests the Zustand store logic.

## Running Tests
```bash
# Run all tests
npm test

# Run with UI
npm test -- --ui
```

## Conventions
- Use `describe` blocks to group tests by feature or component.
- Use `it` or `test` for individual test cases.
- Mock external dependencies (like WebSocket or IPC) when testing store logic.
