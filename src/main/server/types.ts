import type { ErrorCode } from './constants';

export interface ServerReadyPayload {
  url: string;
}

export interface ServerErrorPayload {
  code: ErrorCode;
  message: string;
}

export interface ServerConfig {
  cwd: string;
}

export interface ServerOptions {
  hostname?: string;
  port?: number;
  timeout?: number;
  config?: ServerConfig;
  signal?: AbortSignal;
}

export interface ServerInstance {
  url: string;
  close: () => void;
}
