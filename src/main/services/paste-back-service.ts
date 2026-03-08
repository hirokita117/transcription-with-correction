import { Notification, clipboard } from 'electron';
import type { FrontmostAppInfo, PasteBackResult } from '../../shared/types';
import { AutomationHelperClient } from './automation-helper-client';
import { PermissionService } from './permission-service';

interface OperationResponse {
  ok: boolean;
  message?: string;
}

export class PasteBackService {
  private targetApp: FrontmostAppInfo | null = null;

  constructor(
    private readonly automationHelperClient: AutomationHelperClient,
    private readonly permissionService: PermissionService
  ) {}

  setTargetApp(appInfo: FrontmostAppInfo | null): void {
    this.targetApp = appInfo;
  }

  clearTargetApp(): void {
    this.targetApp = null;
  }

  async pasteText(text: string, fallbackToClipboardOnly: boolean): Promise<PasteBackResult> {
    clipboard.writeText(text);

    if (!this.targetApp) {
      return this.finish('clipboard_only', '校正結果をコピーしました', 'target_not_found');
    }

    const permissionStatus = await this.permissionService.getStatus();
    if (!permissionStatus.accessibilityTrusted) {
      return this.finish(
        'clipboard_only',
        '校正結果をコピーしました。アクセシビリティ権限を許可すると自動貼り付けできます',
        'permission_missing'
      );
    }

    try {
      const activated = this.targetApp.processId > 0
        ? await this.automationHelperClient.runCommand<OperationResponse>([
            'activate-process',
            String(this.targetApp.processId),
          ])
        : await this.automationHelperClient.runCommand<OperationResponse>([
            'activate-app',
            this.targetApp.bundleId,
          ]);

      if (!activated.ok) {
        if (!this.targetApp.bundleId) {
          return this.handleFailure('activation_failed', activated.message, fallbackToClipboardOnly);
        }

        const fallbackActivation = await this.automationHelperClient.runCommand<OperationResponse>([
          'activate-app',
          this.targetApp.bundleId,
        ]);

        if (!fallbackActivation.ok) {
          return this.handleFailure('activation_failed', fallbackActivation.message ?? activated.message, fallbackToClipboardOnly);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 450));

      const matchesTarget = await this.isTargetFrontmost();

      if (!matchesTarget) {
        return this.handleFailure('target_not_frontmost', '元のアプリを前面化できませんでした', fallbackToClipboardOnly);
      }

      const pasted = await this.automationHelperClient.runCommand<OperationResponse>(['paste']);
      if (!pasted.ok) {
        return this.handleFailure('paste_failed', pasted.message, fallbackToClipboardOnly);
      }

      return this.finish('pasted', '校正して貼り付けました');
    } catch (error) {
      console.error('Failed to paste corrected text back to target app:', error);
      return this.handleFailure('paste_failed', undefined, fallbackToClipboardOnly);
    }
  }

  private handleFailure(
    details: NonNullable<PasteBackResult['details']>,
    message?: string,
    fallbackToClipboardOnly?: boolean
  ): PasteBackResult {
    if (fallbackToClipboardOnly) {
      return this.finish('clipboard_only', message ?? '校正結果をコピーしました。手動で貼り付けてください', details);
    }

    return this.finish('correction_failed', message ?? '自動貼り付けに失敗しました', details);
  }

  private finish(
    status: PasteBackResult['status'],
    message: string,
    details?: PasteBackResult['details']
  ): PasteBackResult {
    this.showNotification(message);
    return { status, message, details };
  }

  private async isTargetFrontmost(): Promise<boolean> {
    const frontmostApp = await this.automationHelperClient.runCommand<FrontmostAppInfo>(['frontmost-app']);
    return this.targetAppMatches(frontmostApp);
  }

  private targetAppMatches(frontmostApp: FrontmostAppInfo): boolean {
    if (!this.targetApp) return false;

    return this.targetApp.processId > 0
      ? frontmostApp.processId === this.targetApp.processId || frontmostApp.bundleId === this.targetApp.bundleId
      : frontmostApp.bundleId === this.targetApp.bundleId;
  }

  private showNotification(body: string): void {
    if (!Notification.isSupported()) return;

    new Notification({
      title: 'Transcription Correction',
      body,
      silent: true,
    }).show();
  }
}
