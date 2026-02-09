/**
 * Action Pattern Storage
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ActionPattern } from './types';

export class ActionStorage {
  private basePath: string;

  constructor(basePath: string = '.config/actions') {
    this.basePath = basePath;
  }

  /**
   * Save action pattern
   */
  async save(pattern: ActionPattern): Promise<void> {
    const dir = path.join(this.basePath, pattern.service);
    await fs.mkdir(dir, { recursive: true });

    const filePath = path.join(dir, `${pattern.id}.json`);
    await fs.writeFile(
      filePath,
      JSON.stringify(pattern, null, 2),
      'utf-8'
    );
  }

  /**
   * Load action pattern by ID
   */
  async load(id: string, service?: string): Promise<ActionPattern | null> {
    try {
      if (service) {
        const filePath = path.join(this.basePath, service, `${id}.json`);
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
      }

      // Search in all services
      const services = await this.listServices();
      for (const svc of services) {
        const pattern = await this.load(id, svc);
        if (pattern) return pattern;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Load all patterns for a service
   */
  async loadByService(service: string): Promise<ActionPattern[]> {
    try {
      const dir = path.join(this.basePath, service);
      const files = await fs.readdir(dir);

      const patterns: ActionPattern[] = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(dir, file), 'utf-8');
          patterns.push(JSON.parse(data));
        }
      }

      return patterns;
    } catch {
      return [];
    }
  }

  /**
   * Load all patterns
   */
  async loadAll(): Promise<ActionPattern[]> {
    const services = await this.listServices();
    const allPatterns: ActionPattern[] = [];

    for (const service of services) {
      const patterns = await this.loadByService(service);
      allPatterns.push(...patterns);
    }

    return allPatterns;
  }

  /**
   * Delete action pattern
   */
  async delete(id: string, service?: string): Promise<boolean> {
    try {
      if (service) {
        const filePath = path.join(this.basePath, service, `${id}.json`);
        await fs.unlink(filePath);
        return true;
      }

      // Search and delete from any service
      const services = await this.listServices();
      for (const svc of services) {
        const deleted = await this.delete(id, svc);
        if (deleted) return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Update action pattern
   */
  async update(pattern: ActionPattern): Promise<void> {
    pattern.metadata.updatedAt = new Date();
    await this.save(pattern);
  }

  /**
   * Check if pattern exists
   */
  async exists(id: string, service?: string): Promise<boolean> {
    const pattern = await this.load(id, service);
    return pattern !== null;
  }

  /**
   * List all services
   */
  async listServices(): Promise<string[]> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      const entries = await fs.readdir(this.basePath, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalPatterns: number;
    byService: Record<string, number>;
    totalSize: number;
  }> {
    const services = await this.listServices();
    const stats = {
      totalPatterns: 0,
      byService: {} as Record<string, number>,
      totalSize: 0,
    };

    for (const service of services) {
      const patterns = await this.loadByService(service);
      stats.byService[service] = patterns.length;
      stats.totalPatterns += patterns.length;
    }

    return stats;
  }

  /**
   * Export patterns to a single file
   */
  async export(outputPath: string): Promise<void> {
    const patterns = await this.loadAll();
    await fs.writeFile(
      outputPath,
      JSON.stringify(patterns, null, 2),
      'utf-8'
    );
  }

  /**
   * Import patterns from a file
   */
  async import(inputPath: string): Promise<number> {
    const data = await fs.readFile(inputPath, 'utf-8');
    const patterns = JSON.parse(data) as ActionPattern[];

    let imported = 0;
    for (const pattern of patterns) {
      await this.save(pattern);
      imported++;
    }

    return imported;
  }
}

// Export singleton instance
export const actionStorage = new ActionStorage();
