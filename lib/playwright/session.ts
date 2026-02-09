/**
 * Browser session management with persistence
 */

import { Browser, BrowserContext, chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

const SESSION_DIR = path.join(process.cwd(), '.config', 'sessions');

export interface SessionOptions {
  serviceId: string;
  headless?: boolean;
}

export class SessionManager {
  private browsers: Map<string, Browser> = new Map();
  private contexts: Map<string, BrowserContext> = new Map();

  async ensureSessionDir(): Promise<void> {
    try {
      await fs.access(SESSION_DIR);
    } catch {
      await fs.mkdir(SESSION_DIR, { recursive: true });
    }
  }

  private getSessionPath(serviceId: string): string {
    return path.join(SESSION_DIR, `${serviceId}.json`);
  }

  async createSession(options: SessionOptions): Promise<BrowserContext> {
    await this.ensureSessionDir();

    const { serviceId, headless = true } = options;

    // Launch browser if not already running
    if (!this.browsers.has(serviceId)) {
      const browser = await chromium.launch({
        headless,
        args: ['--disable-blink-features=AutomationControlled'],
      });
      this.browsers.set(serviceId, browser);
    }

    const browser = this.browsers.get(serviceId)!;
    const sessionPath = this.getSessionPath(serviceId);

    // Try to load existing session data
    let storageState: any = undefined;
    try {
      const data = await fs.readFile(sessionPath, 'utf-8');
      storageState = JSON.parse(data);
    } catch {
      // No existing session
    }

    // Create browser context
    const context = await browser.newContext({
      storageState,
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    this.contexts.set(serviceId, context);

    return context;
  }

  async getContext(serviceId: string): Promise<BrowserContext | null> {
    return this.contexts.get(serviceId) || null;
  }

  async saveSession(serviceId: string): Promise<void> {
    const context = this.contexts.get(serviceId);
    if (!context) {
      throw new Error(`No context found for service: ${serviceId}`);
    }

    const sessionPath = this.getSessionPath(serviceId);
    const storageState = await context.storageState();

    await fs.writeFile(sessionPath, JSON.stringify(storageState, null, 2));
  }

  async closeSession(serviceId: string): Promise<void> {
    const context = this.contexts.get(serviceId);
    if (context) {
      await this.saveSession(serviceId);
      await context.close();
      this.contexts.delete(serviceId);
    }

    const browser = this.browsers.get(serviceId);
    if (browser) {
      await browser.close();
      this.browsers.delete(serviceId);
    }
  }

  async closeAllSessions(): Promise<void> {
    for (const serviceId of this.contexts.keys()) {
      await this.closeSession(serviceId);
    }
  }
}

export const sessionManager = new SessionManager();
