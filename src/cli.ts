import type { DankeMcpOptions } from './config.js';

export class CliArgumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CliArgumentError';
  }
}

export function shouldShowHelp(args: string[]): boolean {
  return args.includes('--help') || args.includes('-h');
}

export function parseCliArgs(args: string[]): DankeMcpOptions {
  const nameIdx = args.indexOf('--name');
  const name = nameIdx !== -1 ? args[nameIdx + 1] : undefined;
  const descIdx = args.indexOf('--description');
  const description = descIdx !== -1 ? args[descIdx + 1] : undefined;
  const keysIdx = args.indexOf('--keys');
  const keysPath = keysIdx !== -1 ? args[keysIdx + 1] : undefined;
  const apiIdx = args.indexOf('--api');
  const apiUrl = apiIdx !== -1 ? args[apiIdx + 1] : undefined;

  for (const [flag, index, value] of [
    ['--name', nameIdx, name],
    ['--description', descIdx, description],
    ['--keys', keysIdx, keysPath],
    ['--api', apiIdx, apiUrl],
  ] as const) {
    if (index !== -1 && (value === undefined || value.startsWith('--'))) {
      throw new CliArgumentError(`${flag} requires a value`);
    }
  }

  return { name, description, keysPath, apiUrl };
}
