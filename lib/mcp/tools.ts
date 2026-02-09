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
    description: 'Execute a predefined action on a configured web service (Gmail, Slack, Notion)',
    inputSchema: {
      type: 'object',
      properties: {
        serviceId: {
          type: 'string',
          description: 'The ID of the configured service instance to use',
        },
        actionId: {
          type: 'string',
          description: 'The action ID to perform (e.g., send_email, send_message, create_page)',
        },
        parameters: {
          type: 'object',
          description: 'Parameters for the action',
          additionalProperties: true,
        },
      },
      required: ['serviceId', 'actionId'],
    },
  },
  {
    name: 'list_all_services',
    description: 'Get a list of all available service types and their actions',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_service_actions',
    description: 'Get detailed information about actions available for a specific service type',
    inputSchema: {
      type: 'object',
      properties: {
        serviceType: {
          type: 'string',
          enum: ['gmail', 'slack', 'notion'],
          description: 'The type of service (gmail, slack, or notion)',
        },
      },
      required: ['serviceType'],
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
