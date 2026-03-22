import { homedir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveConfig } from '../config.js';

const ENV_KEYS = [
  'DANKE_AGENT_NAME',
  'DANKE_DESCRIPTION',
  'DANKE_KEYS_PATH',
  'DANKE_API_URL',
] as const;

const DEFAULT_KEYS_PATH = join(homedir(), '.danke', 'keys.json');
const DEFAULT_API_URL = 'https://danke.nosaltres2.info';
const DEFAULT_AGENT_NAME = 'DankeAgent';

const savedEnv = new Map<string, string | undefined>();

beforeEach(() => {
  savedEnv.clear();
  for (const key of ENV_KEYS) {
    savedEnv.set(key, process.env[key]);
    delete process.env[key];
  }
});

afterEach(() => {
  for (const [key, value] of savedEnv) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe('resolveConfig', () => {
  it('returns the documented defaults when no options or env vars are provided', () => {
    expect(resolveConfig()).toEqual({
      name: DEFAULT_AGENT_NAME,
      description: undefined,
      keysPath: DEFAULT_KEYS_PATH,
      apiUrl: DEFAULT_API_URL,
    });
  });

  it('lets options override defaults', () => {
    expect(
      resolveConfig({
        name: 'CLI Agent',
        description: 'From CLI',
        keysPath: '/tmp/cli-keys.json',
        apiUrl: 'https://cli.example.test',
      })
    ).toEqual({
      name: 'CLI Agent',
      description: 'From CLI',
      keysPath: '/tmp/cli-keys.json',
      apiUrl: 'https://cli.example.test',
    });
  });

  it('uses environment variables when options are omitted', () => {
    process.env['DANKE_AGENT_NAME'] = 'Env Agent';
    process.env['DANKE_DESCRIPTION'] = 'From env';
    process.env['DANKE_KEYS_PATH'] = '/tmp/env-keys.json';
    process.env['DANKE_API_URL'] = 'https://env.example.test';

    expect(resolveConfig()).toEqual({
      name: 'Env Agent',
      description: 'From env',
      keysPath: '/tmp/env-keys.json',
      apiUrl: 'https://env.example.test',
    });
  });

  it('gives explicit options precedence over environment variables', () => {
    process.env['DANKE_AGENT_NAME'] = 'Env Agent';
    process.env['DANKE_DESCRIPTION'] = 'From env';
    process.env['DANKE_KEYS_PATH'] = '/tmp/env-keys.json';
    process.env['DANKE_API_URL'] = 'https://env.example.test';

    expect(
      resolveConfig({
        name: 'Option Agent',
        description: 'From options',
        keysPath: '/tmp/option-keys.json',
        apiUrl: 'https://options.example.test',
      })
    ).toEqual({
      name: 'Option Agent',
      description: 'From options',
      keysPath: '/tmp/option-keys.json',
      apiUrl: 'https://options.example.test',
    });
  });
});
