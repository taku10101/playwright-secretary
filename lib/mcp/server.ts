/**
 * MCP Server implementation for Claude Code CLI integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools } from './tools.js';
import { ConfigStorage } from '../config/storage.js';
import { taskExecutor } from '../playwright/executor.js';

export class PlaywrightSecretaryServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'playwright-secretary',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'execute_task': {
            const { serviceId, action, parameters = {} } = args as any;
            const result = await taskExecutor.executeTask({
              serviceId,
              action,
              parameters,
            });

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'get_services': {
            const services = await ConfigStorage.loadServices();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(services, null, 2),
                },
              ],
            };
          }

          case 'configure_service': {
            const { type, name, settings = {} } = args as any;
            const service = await ConfigStorage.saveService({
              id: `${type}-${Date.now()}`,
              type,
              name,
              enabled: true,
              credentials: {},
              settings,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            return {
              content: [
                {
                  type: 'text',
                  text: `Service configured: ${JSON.stringify(service, null, 2)}`,
                },
              ],
            };
          }

          case 'get_task_history': {
            const { limit = 10 } = args as any;
            const history = await ConfigStorage.getExecutionHistory(limit);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(history, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Playwright Secretary MCP Server running on stdio');
  }
}
