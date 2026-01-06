import { spawn } from 'node:child_process';
import net from 'node:net';
import portfinder from 'portfinder';
import { IS_DEV } from '../env';
import { resolveBinaryPath } from './binary-path';
import {
  POLL_INTERVAL_MS,
  PORT_RANGE_END,
  PORT_RANGE_START,
  STARTUP_TIMEOUT_MS,
} from './constants';
import type { ServerInstance, ServerOptions } from './types';

export async function createNeovateServer(
  options?: ServerOptions,
): Promise<ServerInstance> {
  const hostname = options?.hostname ?? '127.0.0.1';
  const port =
    options?.port ??
    (await portfinder.getPortPromise({
      port: PORT_RANGE_START,
      stopPort: PORT_RANGE_END,
    }));
  const timeout = options?.timeout ?? STARTUP_TIMEOUT_MS;

  const cwd =
    options?.config?.cwd ?? (IS_DEV ? process.cwd() : process.resourcesPath);
  const binaryPath = await resolveBinaryPath({ cwd });

  const args = [`serve`, `--hostname=${hostname}`, `--port=${port}`];

  const proc = spawn(binaryPath, args, {
    signal: options?.signal,
    cwd,
    env: {
      ...process.env,
      NEOVATE_CLIENT: 'desktop',
      NODE_ENV: IS_DEV ? 'development' : 'production',
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
          reject(new Error('Connection timeout'));
          return;
        }

        setTimeout(checkConnection, POLL_INTERVAL_MS);
      });

      proc.on('exit', (code) => {
        if (socket) {
          socket.destroy();
          socket = null;
        }
        reject(new Error(`Server exited with code ${code ?? 'unknown'}`));
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
    };

    checkConnection();
  });

  return {
    url,
    close() {
      proc.kill('SIGTERM');
    },
  };
}
