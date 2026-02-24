import type { LMStudioConfig } from '../../../shared/types';
import type { LLMProvider } from './types';

export class LMStudioProvider implements LLMProvider {
  private config: LMStudioConfig;

  constructor(config: LMStudioConfig) {
    this.config = config;
  }

  async correct(prompt: string): Promise<string> {
    const url = `${this.config.endpointUrl}/chat/completions`;

    const body: Record<string, unknown> = {
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    };

    if (this.config.modelName) {
      body.model = this.config.modelName;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = new Error(`LM Studio API error: ${response.status}`) as Error & { status: number };
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  validateConfig(): boolean {
    if (!this.config.endpointUrl) return false;
    try {
      new URL(this.config.endpointUrl);
      return true;
    } catch {
      return false;
    }
  }

  getProviderName(): string {
    return 'LM Studio';
  }

  updateConfig(config: LMStudioConfig): void {
    this.config = config;
  }
}
