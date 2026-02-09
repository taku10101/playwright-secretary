/**
 * Action Library - Manages action patterns
 */

import type {
  ActionPattern,
  ActionLibraryFilter,
  ActionLibraryStats,
  ActionCategory,
} from './types';
import { ActionStorage } from './storage';

export class ActionLibrary {
  private storage: ActionStorage;
  private cache: Map<string, ActionPattern> = new Map();

  constructor(storage?: ActionStorage) {
    this.storage = storage || new ActionStorage();
  }

  /**
   * Add new action pattern
   */
  async add(pattern: Omit<ActionPattern, 'metadata'>): Promise<ActionPattern> {
    const fullPattern: ActionPattern = {
      ...pattern,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        averageDuration: 0,
        tags: [],
        version: '1.0.0',
      },
    };

    await this.storage.save(fullPattern);
    this.cache.set(fullPattern.id, fullPattern);

    return fullPattern;
  }

  /**
   * Get action pattern by ID
   */
  async get(id: string, service?: string): Promise<ActionPattern | null> {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    // Load from storage
    const pattern = await this.storage.load(id, service);
    if (pattern) {
      this.cache.set(id, pattern);
    }

    return pattern;
  }

  /**
   * Update action pattern
   */
  async update(pattern: ActionPattern): Promise<void> {
    pattern.metadata.updatedAt = new Date();
    await this.storage.update(pattern);
    this.cache.set(pattern.id, pattern);
  }

  /**
   * Delete action pattern
   */
  async delete(id: string, service?: string): Promise<boolean> {
    const deleted = await this.storage.delete(id, service);
    if (deleted) {
      this.cache.delete(id);
    }
    return deleted;
  }

  /**
   * Search patterns with filters
   */
  async search(filter: ActionLibraryFilter): Promise<ActionPattern[]> {
    let patterns = await this.storage.loadAll();

    // Apply filters
    if (filter.service) {
      patterns = patterns.filter((p) => p.service === filter.service);
    }

    if (filter.category) {
      patterns = patterns.filter((p) => p.category === filter.category);
    }

    if (filter.tags && filter.tags.length > 0) {
      patterns = patterns.filter((p) =>
        filter.tags!.some((tag) => p.metadata.tags.includes(tag))
      );
    }

    if (filter.minSuccessRate !== undefined) {
      patterns = patterns.filter(
        (p) => p.metadata.successRate >= filter.minSuccessRate!
      );
    }

    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      patterns = patterns.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
      );
    }

    return patterns;
  }

  /**
   * Get patterns by service
   */
  async getByService(service: string): Promise<ActionPattern[]> {
    return await this.storage.loadByService(service);
  }

  /**
   * Get patterns by category
   */
  async getByCategory(category: ActionCategory): Promise<ActionPattern[]> {
    const all = await this.storage.loadAll();
    return all.filter((p) => p.category === category);
  }

  /**
   * Get most used patterns
   */
  async getMostUsed(limit: number = 10): Promise<ActionPattern[]> {
    const all = await this.storage.loadAll();
    return all
      .sort((a, b) => b.metadata.usageCount - a.metadata.usageCount)
      .slice(0, limit);
  }

  /**
   * Get most successful patterns
   */
  async getMostSuccessful(limit: number = 10): Promise<ActionPattern[]> {
    const all = await this.storage.loadAll();
    return all
      .filter((p) => p.metadata.usageCount > 0)
      .sort((a, b) => b.metadata.successRate - a.metadata.successRate)
      .slice(0, limit);
  }

  /**
   * Record pattern usage
   */
  async recordUsage(
    id: string,
    success: boolean,
    duration: number
  ): Promise<void> {
    const pattern = await this.get(id);
    if (!pattern) return;

    pattern.metadata.usageCount++;

    if (success) {
      pattern.metadata.successCount++;
    } else {
      pattern.metadata.failureCount++;
    }

    // Recalculate success rate
    pattern.metadata.successRate =
      pattern.metadata.successCount / pattern.metadata.usageCount;

    // Update average duration
    const currentAvg = pattern.metadata.averageDuration;
    const count = pattern.metadata.usageCount;
    pattern.metadata.averageDuration =
      (currentAvg * (count - 1) + duration) / count;

    await this.update(pattern);
  }

  /**
   * Get library statistics
   */
  async getStats(): Promise<ActionLibraryStats> {
    const patterns = await this.storage.loadAll();

    const stats: ActionLibraryStats = {
      totalPatterns: patterns.length,
      byService: {},
      byCategory: {},
      totalUsage: 0,
      averageSuccessRate: 0,
    };

    let totalSuccessRate = 0;
    let patternsWithUsage = 0;

    for (const pattern of patterns) {
      // By service
      stats.byService[pattern.service] =
        (stats.byService[pattern.service] || 0) + 1;

      // By category
      stats.byCategory[pattern.category] =
        (stats.byCategory[pattern.category] || 0) + 1;

      // Total usage
      stats.totalUsage += pattern.metadata.usageCount;

      // Average success rate
      if (pattern.metadata.usageCount > 0) {
        totalSuccessRate += pattern.metadata.successRate;
        patternsWithUsage++;
      }
    }

    if (patternsWithUsage > 0) {
      stats.averageSuccessRate = totalSuccessRate / patternsWithUsage;
    }

    return stats;
  }

  /**
   * Suggest similar patterns
   */
  async suggestSimilar(
    pattern: Partial<ActionPattern>,
    limit: number = 5
  ): Promise<ActionPattern[]> {
    const all = await this.storage.loadAll();

    // Calculate similarity scores
    const scored = all.map((p) => ({
      pattern: p,
      score: this.calculateSimilarity(pattern, p),
    }));

    // Sort by score and return top N
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.pattern);
  }

  /**
   * Calculate similarity between two patterns
   */
  private calculateSimilarity(
    pattern1: Partial<ActionPattern>,
    pattern2: ActionPattern
  ): number {
    let score = 0;

    // Service match (high weight)
    if (pattern1.service === pattern2.service) {
      score += 40;
    }

    // Category match
    if (pattern1.category === pattern2.category) {
      score += 20;
    }

    // Name similarity
    if (pattern1.name && pattern2.name) {
      const name1 = pattern1.name.toLowerCase();
      const name2 = pattern2.name.toLowerCase();
      if (name1.includes(name2) || name2.includes(name1)) {
        score += 20;
      }
    }

    // Parameter similarity
    if (pattern1.parameters && pattern2.parameters) {
      const params1 = pattern1.parameters.map((p) => p.name);
      const params2 = pattern2.parameters.map((p) => p.name);
      const commonParams = params1.filter((p) => params2.includes(p));
      score += (commonParams.length / Math.max(params1.length, params2.length)) * 20;
    }

    return score;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Export patterns
   */
  async export(outputPath: string): Promise<void> {
    await this.storage.export(outputPath);
  }

  /**
   * Import patterns
   */
  async import(inputPath: string): Promise<number> {
    const count = await this.storage.import(inputPath);
    this.clearCache();
    return count;
  }
}

// Export singleton instance
export const actionLibrary = new ActionLibrary();
