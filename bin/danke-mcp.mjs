#!/usr/bin/env node
import { startServer } from '../dist/index.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
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

const nameIdx = args.indexOf('--name');
const name = nameIdx !== -1 ? args[nameIdx + 1] : undefined;
const descIdx = args.indexOf('--description');
const description = descIdx !== -1 ? args[descIdx + 1] : undefined;
const keysIdx = args.indexOf('--keys');
const keysPath = keysIdx !== -1 ? args[keysIdx + 1] : undefined;
const apiIdx = args.indexOf('--api');
const apiUrl = apiIdx !== -1 ? args[apiIdx + 1] : undefined;

startServer({ name, description, keysPath, apiUrl });
