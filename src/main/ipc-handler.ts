import { BrowserWindow, globalShortcut, ipcMain } from 'electron';
import type { Settings, VoiceSessionViewModel } from '../shared/types';
import { ConfigManager } from './services/config-manager';
import { DictationSessionService } from './services/dictation-session-service';
import { PermissionService } from './services/permission-service';
import { ResidentModeService } from './services/resident-mode-service';
import { SettingsWindowService } from './services/settings-window-service';

export class IPCHandler {
  private currentShortcut: string | null = null;
  private latestSettings: Settings;

  constructor(
    private readonly configManager: ConfigManager,
    private readonly permissionService: PermissionService,
    private readonly residentModeService: ResidentModeService,
    private readonly settingsWindowService: SettingsWindowService,
    private readonly dictationSessionService: DictationSessionService,
  ) {
    this.latestSettings = this.configManager.load();

    this.dictationSessionService.on('settings-required', () => {
      void this.settingsWindowService.show();
      this.sendToAllWindows('settings-required');
    });

    this.dictationSessionService.on('session-state-change', (state: VoiceSessionViewModel) => {
      this.sendToAllWindows('voice-session-state-change', state);
      void this.residentModeService.refreshMenu();
    });
  }

  registerHandlers(): void {
    ipcMain.handle('get-settings-window-data', async () => {
      return this.configManager.getBootstrapData();
    });

    ipcMain.handle('save-settings', async (_event, settings: Settings) => {
      this.configManager.save(settings);
      this.latestSettings = settings;
      this.dictationSessionService.updateSettings(settings);
      this.registerVoiceShortcut(settings.voiceInput.shortcut);
      await this.residentModeService.setEnabled(settings.residentMode.enabled);
      this.residentModeService.applyDockVisibility(settings.residentMode.showDockIcon);
      if (!this.configManager.getBootstrapData().needsSetup) {
        this.settingsWindowService.hide();
      }
    });

    ipcMain.handle('get-permission-status', async () => {
      return this.permissionService.getStatus();
    });

    ipcMain.handle('open-accessibility-settings', async () => {
      await this.permissionService.openAccessibilitySettings();
    });

    ipcMain.handle('open-settings-window', async () => {
      await this.settingsWindowService.show();
    });

    ipcMain.handle('close-settings-window', async () => {
      this.settingsWindowService.hide();
    });

    ipcMain.handle('retry-last-correction', async () => {
      await this.dictationSessionService.retryLastCorrection();
    });

    ipcMain.handle('dismiss-voice-window', async () => {
      this.dictationSessionService.dismissVoiceWindow();
    });

    ipcMain.handle('get-transcription-history', async () => {
      return this.configManager.getCorrectionHistory();
    });

    ipcMain.handle('correct-from-history', async (_event, id: string) => {
      await this.dictationSessionService.correctFromHistory(id);
    });

    ipcMain.handle('delete-history-item', async (_event, id: string) => {
      this.configManager.deleteCorrectionHistoryItem(id);
    });
  }

  registerVoiceShortcut(shortcut: string): void {
    if (this.currentShortcut) {
      globalShortcut.unregister(this.currentShortcut);
      this.currentShortcut = null;
    }

    if (!shortcut) return;

    try {
      const registered = globalShortcut.register(shortcut, () => {
        void this.dictationSessionService.toggleVoiceCapture().catch((error: unknown) => {
          console.error('Failed to toggle voice capture:', error);
        });
      });

      if (registered) {
        this.currentShortcut = shortcut;
      } else {
        console.warn(`Failed to register shortcut: ${shortcut}`);
      }
    } catch (error) {
      console.warn(`Invalid shortcut: ${shortcut}`, error);
    }
  }

  destroy(): void {
    if (this.currentShortcut) {
      globalShortcut.unregister(this.currentShortcut);
      this.currentShortcut = null;
    }
  }

  private sendToAllWindows(channel: string, ...args: unknown[]): void {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, ...args);
      }
    }
  }
}
