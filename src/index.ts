export { createServer, runServer } from './server.js';
export { resolveConfig } from './config.js';
export type { DankeMcpConfig, DankeMcpOptions } from './config.js';

import { resolveConfig } from './config.js';
import { runServer } from './server.js';
import type { DankeMcpOptions } from './config.js';

/**
 * Start the Danke MCP server with stdio transport.
 * This is the main entry point used by the CLI.
 */
export async function startServer(options: DankeMcpOptions = {}): Promise<void> {
  const config = resolveConfig(options);
  await runServer(config);
}
