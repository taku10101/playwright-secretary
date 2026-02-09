/**
 * Service registry
 */

import { ServiceDefinition } from './types';
import { invoiceService } from './invoice';

export const services: Record<string, ServiceDefinition> = {
  invoice: invoiceService,
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
