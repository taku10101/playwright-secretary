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
import { serviceExecutor } from '../playwright/service-executor.js';
import { getService, getAllServices } from '../services/index.js';

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
            const { serviceId, actionId, parameters = {} } = args as any;
            const result = await serviceExecutor.executeTask({
              serviceId,
              actionId,
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

          case 'list_service_actions': {
            const { serviceType } = args as any;
            const service = getService(serviceType);

            if (!service) {
              throw new Error(`Service not found: ${serviceType}`);
            }

            const actions = service.actions.map(action => ({
              id: action.id,
              name: action.name,
              description: action.description,
              parameters: action.parameters,
            }));

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    serviceId: service.id,
                    serviceName: service.name,
                    actions,
                  }, null, 2),
                },
              ],
            };
          }

          case 'list_all_services': {
            const allServices = getAllServices();
            const servicesInfo = allServices.map(service => ({
              id: service.id,
              name: service.name,
              description: service.description,
              icon: service.icon,
              actionsCount: service.actions.length,
              actions: service.actions.map(action => ({
                id: action.id,
                name: action.name,
                description: action.description,
              })),
            }));

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(servicesInfo, null, 2),
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
