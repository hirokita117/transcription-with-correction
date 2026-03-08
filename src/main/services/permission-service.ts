import { systemPreferences } from 'electron';
import type { PermissionStatus } from '../../shared/types';
import { AutomationHelperClient } from './automation-helper-client';

export class PermissionService {
  constructor(private readonly automationHelperClient: AutomationHelperClient) {}

  async getStatus(): Promise<PermissionStatus> {
    try {
      return {
        accessibilityTrusted: process.platform === 'darwin'
          ? systemPreferences.isTrustedAccessibilityClient(false)
          : false,
        automationAvailable: true,
      };
    } catch (error) {
      console.error('Failed to read accessibility permission status:', error);
      return { accessibilityTrusted: false, automationAvailable: false };
    }
  }

  async openAccessibilitySettings(): Promise<void> {
    if (process.platform === 'darwin') {
      systemPreferences.isTrustedAccessibilityClient(true);
    }
    await this.automationHelperClient.runCommand<Record<string, never>>(['open-accessibility-settings']);
  }
}
