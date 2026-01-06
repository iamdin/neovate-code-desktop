import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import type { ServerConfig } from './types';
import { IS_DEV } from '../env';

export async function resolveBinaryPath(config: ServerConfig): Promise<string> {
  let binaryPath: string;

  if (IS_DEV) {
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
