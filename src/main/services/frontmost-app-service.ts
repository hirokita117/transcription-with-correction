import type { FrontmostAppInfo } from '../../shared/types';
import { AutomationHelperClient } from './automation-helper-client';

interface FrontmostAppResponse {
  bundleId: string;
  name: string;
  processId: number;
}

export class FrontmostAppService {
  constructor(private readonly automationHelperClient: AutomationHelperClient) {}

  async getFrontmostApp(): Promise<FrontmostAppInfo | null> {
    try {
      const result = await this.automationHelperClient.runCommand<FrontmostAppResponse>(['frontmost-app']);
      if (!result.bundleId) {
        return null;
      }
      return result;
    } catch (error) {
      console.error('Failed to get frontmost app:', error);
      return null;
    }
  }
}
