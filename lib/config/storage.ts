/**
 * Configuration storage and retrieval
 */

import fs from 'fs/promises';
import path from 'path';
import { ServiceConfig, ExecutionResult } from './services';

const CONFIG_DIR = path.join(process.cwd(), '.config');
const SERVICES_FILE = path.join(CONFIG_DIR, 'services.json');
const HISTORY_FILE = path.join(CONFIG_DIR, 'execution-history.json');

export class ConfigStorage {
  static async ensureConfigDir(): Promise<void> {
    try {
      await fs.access(CONFIG_DIR);
    } catch {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    }
  }

  static async saveServices(services: ServiceConfig[]): Promise<void> {
    await this.ensureConfigDir();
    await fs.writeFile(SERVICES_FILE, JSON.stringify(services, null, 2));
  }

  static async loadServices(): Promise<ServiceConfig[]> {
    try {
      const data = await fs.readFile(SERVICES_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static async saveService(service: ServiceConfig): Promise<void> {
    const services = await this.loadServices();
    const index = services.findIndex(s => s.id === service.id);

    if (index >= 0) {
      services[index] = service;
    } else {
      services.push(service);
    }

    await this.saveServices(services);
  }

  static async getService(id: string): Promise<ServiceConfig | null> {
    const services = await this.loadServices();
    return services.find(s => s.id === id) || null;
  }

  static async deleteService(id: string): Promise<void> {
    const services = await this.loadServices();
    const filtered = services.filter(s => s.id !== id);
    await this.saveServices(filtered);
  }

  static async saveExecutionResult(result: ExecutionResult): Promise<void> {
    await this.ensureConfigDir();

    let history: ExecutionResult[] = [];
    try {
      const data = await fs.readFile(HISTORY_FILE, 'utf-8');
      history = JSON.parse(data);
    } catch {
      // File doesn't exist, start fresh
    }

    history.push(result);

    // Keep only last 1000 results
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    await fs.writeFile(HISTORY_FILE, JSON.stringify(history, null, 2));
  }

  static async getExecutionHistory(limit = 100): Promise<ExecutionResult[]> {
    try {
      const data = await fs.readFile(HISTORY_FILE, 'utf-8');
      const history: ExecutionResult[] = JSON.parse(data);
      return history.slice(-limit).reverse();
    } catch {
      return [];
    }
  }
}
