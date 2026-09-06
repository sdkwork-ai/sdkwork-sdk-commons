import type { LogLevel, LoggerConfig } from '../core/types';

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  log(level: LogLevel, message: string, ...args: unknown[]): void;
  setLevel(level: LogLevel): void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export class ConsoleLogger implements Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamp: boolean;
  private colors: boolean;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.level = config.level ?? 'info';
    this.prefix = config.prefix ?? '[SDK]';
    this.timestamp = config.timestamp ?? true;
    this.colors = config.colors ?? true;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];

    if (this.timestamp) {
      parts.push(new Date().toISOString());
    }

    parts.push(this.prefix);
    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);

    return parts.join(' ');
  }

  private getColorCode(level: LogLevel): string {
    if (!this.colors) return '';

    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      silent: '',
    };

    return colors[level];
  }

  private getResetCode(): string {
    return this.colors ? '\x1b[0m' : '';
  }

  log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message);
    const colorCode = this.getColorCode(level);
    const resetCode = this.getResetCode();

    const output = `${colorCode}${formattedMessage}${resetCode}`;

    switch (level) {
      case 'debug':
        console.debug(output, ...args);
        break;
      case 'info':
        console.info(output, ...args);
        break;
      case 'warn':
        console.warn(output, ...args);
        break;
      case 'error':
        console.error(output, ...args);
        break;
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  log: () => {},
  setLevel: () => {},
};

export function createLogger(config?: Partial<LoggerConfig>): Logger {
  if (config?.level === 'silent') {
    return noopLogger;
  }
  return new ConsoleLogger(config);
}
