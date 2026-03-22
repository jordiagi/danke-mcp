import { homedir } from 'os';
import { join } from 'path';

export interface DankeMcpConfig {
  name: string;
  description?: string;
  keysPath: string;
  apiUrl: string;
}

export interface DankeMcpOptions {
  name?: string;
  description?: string;
  keysPath?: string;
  apiUrl?: string;
}

const DEFAULT_API_URL = 'https://danke.nosaltres2.info';
const DEFAULT_KEYS_PATH = join(homedir(), '.danke', 'keys.json');
const DEFAULT_AGENT_NAME = 'DankeAgent';

export function resolveConfig(options: DankeMcpOptions = {}): DankeMcpConfig {
  return {
    name:
      options.name ??
      process.env['DANKE_AGENT_NAME'] ??
      DEFAULT_AGENT_NAME,
    description: options.description ?? process.env['DANKE_DESCRIPTION'],
    keysPath:
      options.keysPath ??
      process.env['DANKE_KEYS_PATH'] ??
      DEFAULT_KEYS_PATH,
    apiUrl:
      options.apiUrl ??
      process.env['DANKE_API_URL'] ??
      DEFAULT_API_URL,
  };
}
