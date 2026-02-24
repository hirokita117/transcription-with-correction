import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiConfig } from '../../../shared/types';
import type { LLMProvider } from './types';

export class GeminiProvider implements LLMProvider {
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  async correct(prompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.config.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.config.modelName,
      generationConfig: { temperature: 0.3 },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  }

  validateConfig(): boolean {
    return !!this.config.apiKey && !!this.config.modelName;
  }

  getProviderName(): string {
    return 'Gemini';
  }

  updateConfig(config: GeminiConfig): void {
    this.config = config;
  }
}
