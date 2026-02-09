/**
 * Service registry
 */

import { ServiceDefinition } from './types';

export const services: Record<string, ServiceDefinition> = {
  // Services will be registered here
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
