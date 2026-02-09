/**
 * Service registry
 */

import { ServiceDefinition } from './types';
import { gmailService } from './gmail';
import { slackService } from './slack';
import { notionService } from './notion';

export const services: Record<string, ServiceDefinition> = {
  gmail: gmailService,
  slack: slackService,
  notion: notionService,
};

export function getService(serviceId: string): ServiceDefinition | null {
  return services[serviceId] || null;
}

export function getServiceAction(serviceId: string, actionId: string) {
  const service = getService(serviceId);
  if (!service) return null;

  return service.actions.find(action => action.id === actionId) || null;
}

export function getAllServices(): ServiceDefinition[] {
  return Object.values(services);
}

export * from './types';
