/**
 * Instruction Parser - Natural language instruction interpreter
 */

import type { ParsedInstruction } from './types';

export class InstructionParser {
  private serviceKeywords = {
    freee: ['freee', 'フリー', '会計', '経理'],
  };

  private actionKeywords = {
    send: ['送信', '送る', 'send', '投稿', 'post'],
    read: ['読む', '取得', 'read', 'get', '確認', 'check'],
    create: ['作成', 'create', '新規', 'new', '追加', 'add'],
    search: ['検索', 'search', '探す', 'find'],
    delete: ['削除', 'delete', '消す', 'remove'],
    update: ['更新', 'update', '編集', 'edit', '変更', 'modify'],
  };

  /**
   * Parse natural language instruction into structured data
   */
  async parse(instruction: string): Promise<ParsedInstruction> {
    const lowerInstruction = instruction.toLowerCase();

    // Detect service
    const service = this.detectService(lowerInstruction);

    // Detect action
    const action = this.detectAction(lowerInstruction);

    // Detect intent
    const intent = this.detectIntent(lowerInstruction, action);

    // Extract parameters
    const parameters = this.extractParameters(instruction, service, action);

    // Extract context
    const context = this.extractContext(instruction);

    // Calculate confidence
    const confidence = this.calculateConfidence(service, action, parameters);

    // Identify ambiguities
    const ambiguities = this.identifyAmbiguities(
      service,
      action,
      parameters,
      confidence
    );

    return {
      intent,
      service,
      action,
      parameters,
      context,
      confidence,
      ambiguities,
    };
  }

  private detectService(instruction: string): string | undefined {
    for (const [service, keywords] of Object.entries(this.serviceKeywords)) {
      if (keywords.some((keyword) => instruction.includes(keyword))) {
        return service;
      }
    }
    return undefined;
  }

  private detectAction(instruction: string): string | undefined {
    for (const [action, keywords] of Object.entries(this.actionKeywords)) {
      if (keywords.some((keyword) => instruction.includes(keyword))) {
        return action;
      }
    }
    return undefined;
  }

  private detectIntent(
    instruction: string,
    action?: string
  ): ParsedInstruction['intent'] {
    const exploreKeywords = ['探索', '調べ', '確認', '見て', 'explore', 'investigate'];
    const queryKeywords = ['教えて', '何', 'どう', '？', '?'];

    if (exploreKeywords.some((keyword) => instruction.includes(keyword))) {
      return 'explore';
    }

    if (
      queryKeywords.some((keyword) => instruction.includes(keyword)) &&
      !action
    ) {
      return 'query';
    }

    return 'execute';
  }

  private extractParameters(
    instruction: string,
    service?: string,
    action?: string
  ): Record<string, any> {
    const params: Record<string, any> = {};

    // Freee-specific parameters
    if (service === 'freee') {
      // Extract email for login
      const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g;
      const emails = instruction.match(emailRegex);
      if (emails && emails.length > 0) {
        params.email = emails[0];
      }

      // Extract password (if provided - not recommended)
      const passwordMatch = instruction.match(/パスワード[：:]\s*([^\s]+)/);
      if (passwordMatch) {
        params.password = passwordMatch[1].trim();
      }
    }

    // Generic URL extraction
    const urlMatch = instruction.match(
      /(https?:\/\/[^\s]+)/
    );
    if (urlMatch) {
      params.url = urlMatch[1];
    }

    return params;
  }

  private extractContext(instruction: string): ParsedInstruction['context'] {
    const context: ParsedInstruction['context'] = {};

    // Extract URL if present
    const urlMatch = instruction.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      context.url = urlMatch[1];
    }

    // Extract expected outcome
    const outcomeKeywords = ['確認', 'should', 'expected', '期待'];
    for (const keyword of outcomeKeywords) {
      if (instruction.includes(keyword)) {
        const parts = instruction.split(keyword);
        if (parts.length > 1) {
          context.expectedOutcome = parts[1].trim();
        }
      }
    }

    return context;
  }

  private calculateConfidence(
    service?: string,
    action?: string,
    parameters?: Record<string, any>
  ): number {
    let confidence = 0;

    // Service detected
    if (service) confidence += 0.3;

    // Action detected
    if (action) confidence += 0.3;

    // Parameters extracted
    if (parameters && Object.keys(parameters).length > 0) {
      confidence += 0.2;
    }

    // Required parameters present (service-specific)
    if (service === 'freee') {
      if (parameters?.email) confidence += 0.1;
      if (parameters?.password) confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private identifyAmbiguities(
    service?: string,
    action?: string,
    parameters?: Record<string, any>,
    confidence?: number
  ): string[] {
    const ambiguities: string[] = [];

    if (!service) {
      ambiguities.push('対象サービスが特定できません');
    }

    if (!action) {
      ambiguities.push('実行するアクションが不明です');
    }

    if (confidence && confidence < 0.5) {
      ambiguities.push('指示の解釈に確信が持てません');
    }

    // Service-specific validation
    if (service === 'freee') {
      if (!parameters?.email && action === 'login') {
        ambiguities.push('ログイン用のメールアドレスが指定されていません');
      }
    }

    return ambiguities;
  }
}
