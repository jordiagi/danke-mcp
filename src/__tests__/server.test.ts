import { homedir } from 'os';
import { join } from 'path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('danke-agent', () => {
  const MockDankeAgent = vi.fn(function (this: any) {
    this.register = vi.fn();
    this.danke = vi.fn();
    this.balance = vi.fn();
    this.withdraw = vi.fn();
    this.profile = vi.fn();
  });
  return { DankeAgent: MockDankeAgent };
});

import { DankeAgent } from 'danke-agent';
import { resolveConfig } from '../config.js';
import { CliArgumentError, parseCliArgs, shouldShowHelp } from '../cli.js';
import { createServer } from '../server.js';

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
  vi.clearAllMocks();
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
  it('returns defaults when nothing is provided', () => {
    expect(resolveConfig()).toEqual({
      name: DEFAULT_AGENT_NAME,
      description: undefined,
      keysPath: DEFAULT_KEYS_PATH,
      apiUrl: DEFAULT_API_URL,
    });
  });

  it('lets explicit options override defaults', () => {
    expect(
      resolveConfig({
        name: 'CLI Agent',
        description: 'CLI description',
        keysPath: '/tmp/cli-keys.json',
        apiUrl: 'https://cli.example.test',
      })
    ).toEqual({
      name: 'CLI Agent',
      description: 'CLI description',
      keysPath: '/tmp/cli-keys.json',
      apiUrl: 'https://cli.example.test',
    });
  });

  it('uses environment variables when options are absent', () => {
    process.env['DANKE_AGENT_NAME'] = 'Env Agent';
    process.env['DANKE_DESCRIPTION'] = 'Env description';
    process.env['DANKE_KEYS_PATH'] = '/tmp/env-keys.json';
    process.env['DANKE_API_URL'] = 'https://env.example.test';

    expect(resolveConfig()).toEqual({
      name: 'Env Agent',
      description: 'Env description',
      keysPath: '/tmp/env-keys.json',
      apiUrl: 'https://env.example.test',
    });
  });

  it('keeps options higher priority than environment variables', () => {
    process.env['DANKE_AGENT_NAME'] = 'Env Agent';
    process.env['DANKE_DESCRIPTION'] = 'Env description';
    process.env['DANKE_KEYS_PATH'] = '/tmp/env-keys.json';
    process.env['DANKE_API_URL'] = 'https://env.example.test';

    expect(
      resolveConfig({
        name: 'Option Agent',
        description: 'Option description',
        keysPath: '/tmp/option-keys.json',
        apiUrl: 'https://options.example.test',
      })
    ).toEqual({
      name: 'Option Agent',
      description: 'Option description',
      keysPath: '/tmp/option-keys.json',
      apiUrl: 'https://options.example.test',
    });
  });
});

describe('createServer', () => {
  it('returns an MCP server with the expected tools registered', async () => {
    const server = await createServer({
      name: 'Test Agent',
      description: 'Test description',
      keysPath: '/tmp/test-keys.json',
      apiUrl: 'https://api.example.test',
    });

    expect(server).toBeInstanceOf(McpServer);
    expect(vi.mocked(DankeAgent)).toHaveBeenCalledWith({
      name: 'Test Agent',
      description: 'Test description',
      keysPath: '/tmp/test-keys.json',
      apiUrl: 'https://api.example.test',
    });

    const registeredTools = Object.keys(
      (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools
    ).sort();

    expect(registeredTools).toEqual([
      'danke_balance',
      'danke_leaderboard',
      'danke_profile',
      'danke_register',
      'danke_send',
      'danke_withdraw',
    ]);
  });
});

describe('CLI arg parsing', () => {
  it('parses supported CLI flags into server options', () => {
    expect(
      parseCliArgs([
        '--name', 'CLI Agent',
        '--description', 'From CLI',
        '--keys', '/tmp/cli-keys.json',
        '--api', 'https://cli.example.test',
      ])
    ).toEqual({
      name: 'CLI Agent',
      description: 'From CLI',
      keysPath: '/tmp/cli-keys.json',
      apiUrl: 'https://cli.example.test',
    });
  });

  it.each(['--name', '--description', '--keys', '--api'])(
    'throws when %s is missing a value',
    (flag) => {
      expect(() => parseCliArgs([flag])).toThrowError(
        new CliArgumentError(`${flag} requires a value`)
      );
    }
  );

  it('treats a following flag as a missing value', () => {
    expect(() => parseCliArgs(['--name', '--api', 'https://api.example.test'])).toThrowError(
      new CliArgumentError('--name requires a value')
    );
  });

  it('detects both help flags', () => {
    expect(shouldShowHelp(['--help'])).toBe(true);
    expect(shouldShowHelp(['-h'])).toBe(true);
    expect(shouldShowHelp(['--name', 'CLI Agent'])).toBe(false);
  });
});
