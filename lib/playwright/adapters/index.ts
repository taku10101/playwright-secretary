/**
 * Service adapter registry
 */

import { BrowserContext } from 'playwright';
import { ServiceAdapter, ServiceConfig, ServiceType } from '../../config/services';
import { GmailAdapter } from './gmail';
import { SlackAdapter } from './slack';
import { NotionAdapter } from './notion';

export function getAdapter(
  type: ServiceType,
  context: BrowserContext,
  config: ServiceConfig
): ServiceAdapter {
  switch (type) {
    case 'gmail':
      return new GmailAdapter(context, config);
    case 'slack':
      return new SlackAdapter(context, config);
    case 'notion':
      return new NotionAdapter(context, config);
    default:
      throw new Error(`Unsupported service type: ${type}`);
  }
}
