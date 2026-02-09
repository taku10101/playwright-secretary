/**
 * Pattern Matcher - Matches instructions to action patterns
 */

import type { ActionPattern, ActionLibraryFilter } from './types';
import { ActionLibrary } from './library';

export class PatternMatcher {
  private library: ActionLibrary;

  constructor(library?: ActionLibrary) {
    this.library = library || new ActionLibrary();
  }

  /**
   * Find best matching pattern for given criteria
   */
  async findBestMatch(criteria: {
    service?: string;
    action?: string;
    parameters?: Record<string, any>;
    description?: string;
  }): Promise<ActionPattern | null> {
    const candidates = await this.findCandidates(criteria);

    if (candidates.length === 0) {
      return null;
    }

    // Score each candidate
    const scored = candidates.map((pattern) => ({
      pattern,
      score: this.scoreMatch(pattern, criteria),
    }));

    // Return highest scoring pattern
    const best = scored.sort((a, b) => b.score - a.score)[0];

    // Only return if score is above threshold
    return best.score > 50 ? best.pattern : null;
  }

  /**
   * Find all candidate patterns
   */
  private async findCandidates(criteria: {
    service?: string;
    action?: string;
    parameters?: Record<string, any>;
    description?: string;
  }): Promise<ActionPattern[]> {
    const filter: ActionLibraryFilter = {};

    if (criteria.service) {
      filter.service = criteria.service;
    }

    if (criteria.description) {
      filter.search = criteria.description;
    }

    return await this.library.search(filter);
  }

  /**
   * Score how well a pattern matches the criteria
   */
  private scoreMatch(
    pattern: ActionPattern,
    criteria: {
      service?: string;
      action?: string;
      parameters?: Record<string, any>;
      description?: string;
    }
  ): number {
    let score = 0;

    // Service match (highest weight)
    if (criteria.service && pattern.service === criteria.service) {
      score += 40;
    }

    // Action name match
    if (criteria.action) {
      const actionLower = criteria.action.toLowerCase();
      const nameLower = pattern.name.toLowerCase();

      if (nameLower.includes(actionLower)) {
        score += 30;
      }

      // Check in description
      if (pattern.description.toLowerCase().includes(actionLower)) {
        score += 10;
      }
    }

    // Parameter match
    if (criteria.parameters) {
      const criteriaParams = Object.keys(criteria.parameters);
      const patternParams = pattern.parameters.map((p) => p.name);

      const matchingParams = criteriaParams.filter((p) =>
        patternParams.includes(p)
      );

      // More matching parameters = higher score
      const paramScore =
        (matchingParams.length / Math.max(criteriaParams.length, patternParams.length)) *
        20;
      score += paramScore;
    }

    // Description similarity
    if (criteria.description) {
      const descLower = criteria.description.toLowerCase();
      const patternDescLower = pattern.description.toLowerCase();

      // Check for common words
      const descWords = descLower.split(/\s+/);
      const patternWords = patternDescLower.split(/\s+/);
      const commonWords = descWords.filter((w) => patternWords.includes(w));

      score += (commonWords.length / descWords.length) * 10;
    }

    // Success rate bonus
    if (pattern.metadata.usageCount > 0) {
      score += pattern.metadata.successRate * 10;
    }

    // Usage count bonus (popular patterns get slight boost)
    if (pattern.metadata.usageCount > 10) {
      score += Math.min(pattern.metadata.usageCount / 10, 5);
    }

    return score;
  }

  /**
   * Find patterns similar to a given pattern
   */
  async findSimilar(
    pattern: ActionPattern,
    limit: number = 5
  ): Promise<ActionPattern[]> {
    return await this.library.suggestSimilar(pattern, limit);
  }

  /**
   * Match by tags
   */
  async matchByTags(tags: string[]): Promise<ActionPattern[]> {
    return await this.library.search({ tags });
  }

  /**
   * Match by category
   */
  async matchByCategory(category: string): Promise<ActionPattern[]> {
    const patterns = await this.library.getByCategory(category as any);
    return patterns;
  }
}

// Export singleton instance
export const patternMatcher = new PatternMatcher();
