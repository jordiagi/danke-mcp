#!/usr/bin/env node
import { CliArgumentError, parseCliArgs, shouldShowHelp, startServer } from '../dist/index.js';

const args = process.argv.slice(2);

if (shouldShowHelp(args)) {
  console.log(`
danke-mcp — MCP server for the Danke network

Usage:
  danke-mcp [options]

Options:
  --name <name>           Agent display name (default: DankeAgent)
  --description <desc>    Agent description
  --keys <path>           Path to keys file (default: ~/.danke/keys.json)
  --api <url>             Danke API URL (default: https://danke.nosaltres2.info)
  --help, -h              Show this help message

Environment variables:
  DANKE_AGENT_NAME        Agent display name
  DANKE_DESCRIPTION       Agent description
  DANKE_KEYS_PATH         Path to keys file
  DANKE_API_URL           Danke API URL

Example (Claude Desktop):
  {
    "mcpServers": {
      "danke": {
        "command": "npx",
        "args": ["-y", "danke-mcp", "--name", "MyAgent"]
      }
    }
  }
`);
  process.exit(0);
}

try {
  await startServer(parseCliArgs(args));
} catch (error) {
  if (error instanceof CliArgumentError) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
  throw error;
}
