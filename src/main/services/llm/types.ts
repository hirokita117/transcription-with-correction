export interface LLMProvider {
  correct(prompt: string): Promise<string>;
  validateConfig(): boolean;
  getProviderName(): string;
}
