# Development Commands

## Development Server
- `npm run dev`: Starts both main and renderer processes concurrently with hot reload.
- `npm run dev:main`: Starts only the Electron main process in dev mode.
- `npm run dev:renderer`: Starts only the Vite dev server for the renderer.

## Building and Packaging
- `npm run build`: Builds both main and renderer processes.
- `npm run package`: Packages the application for all platforms.
- `npm run package:mac`: Packages the application for macOS (arm64).

## Testing and Quality
- `npm test`: Runs unit tests using Vitest.
- `npm run format`: Formats code using Biome.

## Lifecycle
- `postinstall`: Runs `electron-rebuild` to ensure native modules match the Electron version.
