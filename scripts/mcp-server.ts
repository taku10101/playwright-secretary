#!/usr/bin/env node
/**
 * MCP Server startup script
 */

import { PlaywrightSecretaryServer } from '../lib/mcp/server.js';

async function main() {
  const server = new PlaywrightSecretaryServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
