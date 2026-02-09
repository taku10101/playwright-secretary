/**
 * Service adapter registry
 */

import { BrowserContext } from 'playwright';
import { ServiceAdapter, ServiceConfig, ServiceType } from '../../config/services';

export function getAdapter(
  type: ServiceType,
  context: BrowserContext,
  config: ServiceConfig
): ServiceAdapter {
  throw new Error(`Unsupported service type: ${type}`);
}
