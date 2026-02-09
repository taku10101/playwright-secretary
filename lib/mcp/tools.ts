/**
 * MCP tool definitions
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export const tools: MCPTool[] = [
  {
    name: 'execute_task',
    description: 'Execute a task on a configured web service (Gmail, Slack, Notion, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        serviceId: {
          type: 'string',
          description: 'The ID of the service to use',
        },
        action: {
          type: 'string',
          description: 'The action to perform (e.g., send_email, send_message, create_page)',
        },
        parameters: {
          type: 'object',
          description: 'Parameters for the action',
          additionalProperties: true,
        },
      },
      required: ['serviceId', 'action'],
    },
  },
  {
    name: 'get_services',
    description: 'Get a list of all configured services',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'configure_service',
    description: 'Add or update a service configuration',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['gmail', 'slack', 'notion'],
          description: 'The type of service to configure',
        },
        name: {
          type: 'string',
          description: 'A friendly name for this service',
        },
        settings: {
          type: 'object',
          description: 'Service-specific settings (e.g., workspace for Slack)',
          additionalProperties: true,
        },
      },
      required: ['type', 'name'],
    },
  },
  {
    name: 'get_task_history',
    description: 'Get recent task execution history',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10,
        },
      },
    },
  },
];
