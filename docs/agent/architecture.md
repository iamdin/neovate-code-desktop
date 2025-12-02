# Architecture

## Overview
The application follows a standard Electron architecture with a Main process and a Renderer process, communicating via IPC.

## Main Process (`src/main/`)
- **Entry Point**: `src/main/main.ts`
- **Responsibilities**:
  - Window creation and management.
  - Native file system access (directory selection).
  - **Persistence**: Handles saving/loading the Zustand store to `~/.neovate/desktop/store.json`.
  - **IPC Handlers**: `select-directory`, `store:save`, `store:load`.

## Renderer Process (`src/renderer/`)
- **Framework**: React 19 with TypeScript.
- **Build Tool**: Vite.
- **Entry Point**: `src/renderer/main.tsx` -> `App.tsx`.

### State Management (Zustand)
- **Store**: Defined in `src/renderer/store.tsx`.
- **Structure**:
  - `transport`: `WebSocketTransport` for connecting to the backend agent (`ws://localhost:1024/ws`).
  - `messageBus`: Handles request/response cycles over WebSocket.
  - **Entities**: `repos`, `workspaces`, `sessions`, `messages`.
  - **UI State**: `selectedRepoPath`, `selectedWorkspaceId`, etc.
- **Actions**:
  - `connect`/`disconnect`: Manage WebSocket connection.
  - `sendMessage`: Sends user messages to the backend.
  - Entity CRUD operations.

## Data Flow
1.  **User Action**: User interacts with UI (e.g., sends message).
2.  **Store Action**: Updates local state or sends request via `WebSocketTransport`.
3.  **Backend Response**: WebSocket events (`message`, `chunk`) trigger store updates.
4.  **Persistence**: Store state is periodically saved to disk via Main process IPC.
