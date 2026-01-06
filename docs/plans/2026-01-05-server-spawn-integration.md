# Server Spawn, Port Discovery & Connection Implementation Plan

**Goal:** Integrate a backend server process that spawns from a bundled binary, discovers an available port, and manages connection lifecycle with splash screen and error handling.

**Architecture:** Main process spawns a child server process from the `@neovate/code` binary, polls TCP connections to detect readiness, communicates via IPC to renderer, which displays splash/error states. Server lifecycle managed through port discovery, spawn monitoring, and graceful shutdown.

**Tech Stack:** Electron main process (Node.js), portfinder for port discovery, child_process.spawn, TCP polling, IPC messaging, React 19 for UI, Zustand for state.

---

## Task 1: Add Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add @neovate/code dependency**

Run: `npm install @neovate/code`
Expected: "@neovate/code" added to dependencies in package.json, node_modules/@neovate installed

**Step 2: Add portfinder dependency**

Run: `npm install --save-dev portfinder`
Expected: "portfinder" added to devDependencies in package.json

**Step 3: Update electron-builder config to unpack @neovate/code**

Modify `package.json` build section, add after `"files"`:

```json
"files": [
  "dist/**/*"
],
"asarUnpack": [
  "**/node_modules/@neovate/code/**/*"
]
```

Run: `cat package.json | grep -A5 asarUnpack`
Expected: asarUnpack configuration present

**Step 4: Commit**

Run: `git add package.json package-lock.json && git commit -m "feat: add server dependencies and asar unpack config"`

---

## Task 2: Create Environment and Constants Module

**Files:**
- Create: `src/main/env.ts`
- Create: `src/main/server/constants.ts`

**Step 1: Create environment file**

```typescript
import { app } from 'electron';

export const isDev = !app.isPackaged;
```

**Step 2: Create constants file**

```typescript
export const POLL_INTERVAL_MS = 250;
export const STARTUP_TIMEOUT_MS = 7000;

export const ErrorCodes = {
  SPAWN_FAILED: 'SPAWN_FAILED',
  SERVER_CRASHED: 'SERVER_CRASHED',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
```

**Step 3: Create TypeScript type definition file for IPC**

Create: `src/main/server/types.ts`:

```typescript
import type { ErrorCode } from './constants';

export interface ServerReadyPayload {
  url: string;
}

export interface ServerErrorPayload {
  code: ErrorCode;
  message: string;
}

export interface ServerOptions {
  hostname?: string;
  port?: number;
  timeout?: number;
  config?: {
    cwd: string;
  };
  signal?: AbortSignal;
}

export interface ServerInstance {
  url: string;
  close: () => void;
}
```

**Step 3: Commit**

Run: `git add src/main/env.ts src/main/server/constants.ts src/main/server/types.ts && git commit -m "feat: add environment and server constants"`

---

## Task 3: Create Binary Path Resolution Module

**Files:**
- Create: `src/main/server/resolve-binary-path.ts`

**Step 1: Create binary path resolution file**

```typescript
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import type { ServerConfig } from './types';
import { isDev } from '../env';

export async function resolveBinaryPath(
  config: ServerConfig,
): Promise<string> {
  let binaryPath: string;

  if (isDev) {
    binaryPath = path.join(config.cwd, 'node_modules/.bin/neovate');
  } else {
    const appPath = app.getAppPath();
    const basePath = appPath.endsWith('app.asar')
      ? appPath.replace('app.asar', 'app.asar.unpacked')
      : appPath;
    binaryPath = path.join(basePath, 'node_modules/.bin/neovate');
  }

  await fs.access(binaryPath);
  return binaryPath;
}
```

**Step 2: Commit**

Run: `git add src/main/server/binaryPath.ts && git commit -m "feat: implement binary path resolution"`

---

## Task 4: Create Neovate Server Function

**Files:**
- Create: `src/main/server/create.ts`

**Step 1: Create server manager file**

```typescript
import { spawn } from 'child_process';
import portfinder from 'portfinder';
import net from 'net';
import { resolveBinaryPath } from './binaryPath';
import { isDev } from '../env';
import { PORT_RANGE_START, PORT_RANGE_END, STARTUP_TIMEOUT_MS, POLL_INTERVAL_MS } from './constants';
import type { ServerOptions, ServerInstance } from './types';

export async function createNeovateServer(
  options?: ServerOptions,
): Promise<ServerInstance> {
  const hostname = options?.hostname ?? '127.0.0.1';
  const port = options?.port ?? await portfinder.getPortPromise({
    port: PORT_RANGE_START,
    stopPort: PORT_RANGE_END,
  });
  const timeout = options?.timeout ?? STARTUP_TIMEOUT_MS;

  const cwd = options?.config?.cwd ?? (isDev ? process.cwd() : process.resourcesPath);
  const binaryPath = await resolveBinaryPath({ cwd });

  const args = [`serve`, `--hostname=${hostname}`, `--port=${port}`];

  const proc = spawn(binaryPath, args, {
    signal: options?.signal,
    cwd,
    env: {
      ...process.env,
      NEOVATE_CLIENT: 'desktop',
      NODE_ENV: isDev ? 'development' : 'production',
    },
  });

  const url = await new Promise<string>((resolve, reject) => {
    let socket: net.Socket | null = null;
    const startTime = Date.now();

    const checkConnection = () => {
      socket = net.connect({ host: hostname, port });

      socket.on('connect', () => {
        if (socket) {
          socket.destroy();
          socket = null;
        }
        resolve(`ws://${hostname}:${port}`);
      });

      socket.on('error', () => {
        if (socket) {
          socket.destroy();
          socket = null;
        }

        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for server to start after ${timeout}ms`));
          return;
        }

        setTimeout(checkConnection, POLL_INTERVAL_MS);
      });
    };

    checkConnection();

    proc.on('exit', (code) => {
      if (socket) {
        socket.destroy();
        socket = null;
      }
      reject(new Error(`Server exited with code ${code}`));
    });

    proc.on('error', (error) => {
      if (socket) {
        socket.destroy();
        socket = null;
      }
      reject(error);
    });

    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        if (socket) {
          socket.destroy();
          socket = null;
        }
        reject(new Error('Aborted'));
      });
    }
  });

  return {
    url,
    close() {
      proc.kill();
    },
  };
}
```

**Step 2: Commit**

Run: `git add src/main/server/create.ts && git commit -m "feat: implement createNeovateServer function"`

---

## Task 5: Integrate Neovate Server into Main Process

**Files:**
- Modify: `src/main/main.ts`

**Step 1: Update imports at top of main.ts**

Add after existing imports:

```typescript
import { createNeovateServer } from './server/create';
import type { ServerInstance } from './server/types';
import { isDev } from './env';
```

**Step 2: Add server instance variable after mainWindow declaration**

After `let mainWindow: BrowserWindow | null = null;` add:

```typescript
let serverInstance: ServerInstance | null = null;
```

**Step 3: Add server startup logic inside createWindow function**

After mainWindow creation but before `mainWindow.on('closed')`, replace any existing startup code with:

```typescript
if (process.env.NODE_ENV !== 'test') {
  const cwd = isDev ? process.cwd() : process.resourcesPath;

  await createNeovateServer({ config: { cwd } })
    .then((instance) => {
      serverInstance = instance;
      mainWindow?.webContents.send('neovate-server:ready', {
        url: instance.url,
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      mainWindow?.webContents.send('neovate-server:error', {
        code: 'SPAWN_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    });
}
```

**Step 4: Add IPC handler for retry**

After existing IPC handlers, before `app.whenReady()`:

```typescript
ipcMain.on('neovate-server:retry', async () => {
  if (!mainWindow) return;

  if (serverInstance) {
    serverInstance.close();
    serverInstance = null;
  }

  const cwd = isDev ? process.cwd() : process.resourcesPath;
  createNeovateServer({ config: { cwd } })
    .then((instance) => {
      serverInstance = instance;
      mainWindow?.webContents.send('neovate-server:ready', {
        url: instance.url,
      });
    })
    .catch((error) => {
      console.error('Failed to restart server:', error);
      mainWindow?.webContents.send('neovate-server:error', {
        code: 'SPAWN_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    });
});
```

**Step 5: Add shutdown handlers**

Before `app.whenReady()`:

```typescript
app.on('before-quit', () => {
  if (serverInstance) {
    serverInstance.close();
  }
});
```

**Step 6: Commit**

Run: `git add src/main/main.ts && git commit -m "feat: integrate createNeovateServer into main process"`

---

## Task 7: Create Splash Screen Component

**Files:**
- Create: `src/renderer/components/SplashScreen.tsx`

**Step 1: Create splash screen component**

```typescript
import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [text, setText] = useState('');
  const fullText = 'Neovate';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-white">
      <div className="text-6xl font-light">
        {text}
        <span className="animate-pulse">▌</span>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

Run: `git add src/renderer/components/SplashScreen.tsx && git commit -m "feat: create splash screen component"`

---

## Task 8: Create Error Dialog Component

**Files:**
- Create: `src/renderer/components/ServerErrorDialog.tsx`

**Step 1: Create error dialog component**

```typescript
import { Button } from './ui/button';

interface ServerErrorDialogProps {
  message: string;
  onRetry: () => void;
  onExit: () => void;
}

export function ServerErrorDialog({
  message,
  onRetry,
  onExit,
}: ServerErrorDialogProps) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-white">
      <div className="flex max-w-md flex-col items-center gap-6 rounded-lg bg-neutral-900 p-8 text-center">
        <div className="rounded-full bg-neutral-800 p-4">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Neovate couldn't start</h2>
          <p className="text-neutral-400">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onRetry}>Retry</Button>
          <Button variant="secondary" onClick={onExit}>
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

Run: `git add src/renderer/components/ServerErrorDialog.tsx && git commit -m "feat: create server error dialog component"`

---

## Task 9: Update Store for Server State

**Files:**
- Modify: `src/renderer/store.tsx`

**Step 1: Add server state to interface**

Find `interface StoreState` and add after `initialized: boolean;`:

```typescript
serverState: 'splash' | 'ready' | 'error';
```

**Step 2: Add server state to initial state**

Find initial state definition (around line 60-100) and add:

```typescript
serverState: 'splash',
```

**Step 3: Add server actions**

After existing actions, add:

```typescript
setServerState: (state: 'splash' | 'ready' | 'error') => void;
```

**Step 4: Implement server actions in store body**

After existing action implementations, add:

```typescript
setServerState: (state) => set({ serverState: state }),
```

**Step 2: Add server state to initial state**

Find initial state definition (around line 60-100) and add:

```typescript
serverState: 'splash',
serverUrl: null,
serverError: null,
```

**Step 3: Add server actions**

After existing actions, add:

```typescript
setServerState: (state: 'splash' | 'connecting' | 'ready' | 'error') => void;
setServerReady: (url: string) => void;
setServerError: (error: { code: string; message: string }) => void;
```

**Step 4: Implement server actions in store body**

After existing action implementations, add:

```typescript
setServerState: (state) => set({ serverState: state }),

setServerReady: (url) =>
  set({
    serverState: 'ready',
    serverUrl: url,
    serverError: null,
  }),

setServerError: (error) =>
  set({
    serverState: 'error',
    serverPort: null,
    serverError: error,
  }),
```

**Step 5: Commit**

Run: `git add src/renderer/store.tsx && git commit -m "feat: add server state to store"`

---

## Task 10: Update Preload Script for IPC

**Files:**
- Modify: `src/main/preload.ts`

**Step 1: Add IPC context bridge methods**

Find the preload script and add these methods to the existing API:

```typescript
electron.contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing methods ...

  onServerReady: (callback: () => void) => {
    const listener = (_event: any) => callback();
    ipcRenderer.on('neovate-server:ready', listener);
    return () => ipcRenderer.removeListener('neovate-server:ready', listener);
  },
});
```

**Step 2: Update main.ts imports for preload types**

If needed, update the types at the top of preload.ts to include the new API methods.

**Step 3: Commit**

Run: `git add src/main/preload.ts && git commit -m "feat: add IPC for server events"`

---

## Task 11: Update App Component to Handle Server States

**Files:**
- Modify: `src/renderer/App.tsx`

**Step 1: Add imports**

Add at top:

```typescript
import { SplashScreen } from './components/SplashScreen';
import { useEffect } from 'react';
```

**Step 2: Add server event listeners**

After `useStoreConnection` call, add:

```typescript
useEffect(() => {
  const removeReadyListener = window.electronAPI.onServerReady((url) => {
    store.setServerState('ready');
    store.setUrl(url);
  });

  return () => {
    removeReadyListener();
  };
}, [store]);
```

**Step 3: Add conditional rendering**

Wrap the main App content in a condition:

Find the main return statement and wrap:

```typescript
if (store.serverState === 'splash') {
  return <SplashScreen />;
}
```

Keep the rest of the return statement as is for the main UI.

**Step 4: Commit**

Run: `git add src/renderer/App.tsx && git commit -m "feat: integrate splash screen into App"`

---

## Task 12: Manual Verification

**Files:**
- N/A (Manual testing steps)

**Step 1: Test development startup**

Run: `npm run dev`
Expected: Splash screen appears, server starts, transitions to main UI within 7 seconds

**Step 2: Verify server process**

Run in separate terminal: `lsof -i :49152-65535 | grep neovate`
Expected: Server process running on a port in the range

**Step 3: Test error handling**

Stop the server manually and observe:
Expected: Error dialog appears with Retry and Exit buttons

**Step 4: Test retry**

Click Retry button:
Expected: Splash screen appears again, server restarts

**Step 5: Verify binary path in development**

Run: `ls -la node_modules/.bin/neovate`
Expected: Binary exists

**Step 6: Build and verify packaging**

Run: `npm run package:mac`
Expected: DMG created, binary should be in `Contents/Resources/app.asar.unpacked/node_modules/.bin/neovate`

**Step 7: Test production build**

Run the built app:
Expected: Same behavior as development

**Step 8: Commit**

Run: `git commit --allow-empty -m "test: manual verification completed"`

---

## Task 13: Cleanup and Documentation

**Files:**
- Modify: `README.md` (if needed)
- Modify: `docs/designs/2026-01-05-neovate-server-integrate.md`

**Step 1: Update implementation checklist in design doc**

Mark all items in the checklist as completed.

**Step 2: Verify all tests pass**

Run: `npm test`
Expected: All tests pass

**Step 3: Run linting**

Run: `npm run format` (if exists)
Expected: No formatting errors

**Step 4: Build to verify no TypeScript errors**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

Run: `git add -A && git commit -m "chore: complete server integration implementation"`
