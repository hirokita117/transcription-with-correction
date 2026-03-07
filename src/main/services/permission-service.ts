import type { PermissionStatus } from '../../shared/types';
import { AutomationHelperClient } from './automation-helper-client';

interface PermissionHelperResponse {
  accessibilityTrusted: boolean;
}

export class PermissionService {
  constructor(private readonly automationHelperClient: AutomationHelperClient) {}

  async getStatus(): Promise<PermissionStatus> {
    try {
      const response = await this.automationHelperClient.runCommand<PermissionHelperResponse>(['permission-status']);
      return {
        ...response,
        automationAvailable: true,
      };
    } catch (error) {
      console.error('Failed to read accessibility permission status:', error);
      return { accessibilityTrusted: false, automationAvailable: false };
    }
  }

  async openAccessibilitySettings(): Promise<void> {
    await this.automationHelperClient.runCommand<Record<string, never>>(['open-accessibility-settings']);
  }
}
