import { ipcMain, globalShortcut, BrowserWindow, app, dialog } from 'electron';
import { writeFile } from 'fs/promises';
import type {
  AnalyticsEvent,
  CorrectionRequest,
  CorrectionHistoryItem,
  ExportCorrectionPayload,
  Settings,
  TranscriptionResult,
  VoiceInputStatus,
} from '../shared/types';
import { ConfigManager } from './services/config-manager';
import { LLMService } from './services/llm/llm-service';
import { SpeechService } from './services/speech-service';

export class IPCHandler {
  private configManager: ConfigManager;
  private llmService: LLMService;
  private speechService: SpeechService;
  private currentShortcut: string | null = null;

  constructor(configManager: ConfigManager, llmService: LLMService, speechService: SpeechService) {
    this.configManager = configManager;
    this.llmService = llmService;
    this.speechService = speechService;

    this.speechService.on('transcription', (result: TranscriptionResult) => {
      this.sendToRenderer('voice-transcription-result', result);
    });

    this.speechService.on('status-change', (status: VoiceInputStatus) => {
      this.sendToRenderer('voice-input-status-change', status);
    });

    this.speechService.on('error', (error: { code: string; message: string }) => {
      this.sendToRenderer('voice-input-status-change', 'error' as VoiceInputStatus);
      console.error('[SpeechService error]', error);
    });
  }

  registerHandlers(): void {
    ipcMain.handle('correct-text', async (_event, request: CorrectionRequest) => {
      return this.llmService.correct(request);
    });

    ipcMain.handle('get-bootstrap-data', async () => {
      return this.configManager.getBootstrapData();
    });

    ipcMain.handle('get-settings', async () => {
      return this.configManager.load();
    });

    ipcMain.handle('save-settings', async (_event, settings: Settings) => {
      this.configManager.save(settings);
      this.llmService.updateSettings(settings);
      this.registerVoiceShortcut(settings.voiceInput.shortcut);
    });

    ipcMain.handle('get-correction-history', async () => {
      return this.configManager.getCorrectionHistory();
    });

    ipcMain.handle('save-correction-history-item', async (_event, item: CorrectionHistoryItem) => {
      this.configManager.saveCorrectionHistoryItem(item);
    });

    ipcMain.handle('export-correction-result', async (_event, payload: ExportCorrectionPayload) => {
      return this.exportCorrectionResult(payload);
    });

    ipcMain.handle('track-event', async (_event, event: AnalyticsEvent) => {
      this.configManager.trackEvent(event);
    });

    ipcMain.handle('start-voice-input', async () => {
      const settings = this.configManager.load();
      this.speechService.start(settings.voiceInput.language);
    });

    ipcMain.handle('stop-voice-input', async () => {
      this.speechService.stop();
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
        this.bringAppToFront();
        this.sendToRenderer('voice-input-shortcut');
      });

      if (registered) {
        this.currentShortcut = shortcut;
      } else {
        console.warn(`Failed to register shortcut: ${shortcut}`);
      }
    } catch (err) {
      console.warn(`Invalid shortcut: ${shortcut}`, err);
    }
  }

  destroy(): void {
    if (this.currentShortcut) {
      globalShortcut.unregister(this.currentShortcut);
      this.currentShortcut = null;
    }
    this.speechService.destroy();
  }

  private sendToRenderer(channel: string, ...args: unknown[]): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, ...args);
      }
    }
  }

  private bringAppToFront(): void {
    const windows = BrowserWindow.getAllWindows().filter((win) => !win.isDestroyed());
    if (windows.length === 0) return;

    const targetWindow = windows.find((win) => win.isVisible()) ?? windows[0];

    if (targetWindow.isMinimized()) {
      targetWindow.restore();
    }
    if (!targetWindow.isVisible()) {
      targetWindow.show();
    }

    app.focus({ steal: true });
    targetWindow.focus();

    // Some desktop environments require a short always-on-top toggle for reliable foregrounding.
    targetWindow.setAlwaysOnTop(true);
    targetWindow.setAlwaysOnTop(false);
  }

  private async exportCorrectionResult(payload: ExportCorrectionPayload): Promise<{
    success: boolean;
    path?: string;
    error?: string;
  }> {
    const focusedWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const defaultExtension = payload.format === 'md' ? 'md' : 'txt';
    const defaultPath = `correction-${new Date().toISOString().replace(/[:.]/g, '-')}.${defaultExtension}`;

    const result = await dialog.showSaveDialog(focusedWindow ?? undefined, {
      defaultPath,
      filters: [
        {
          name: payload.format === 'md' ? 'Markdown' : 'Text',
          extensions: [defaultExtension],
        },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, error: '保存をキャンセルしました' };
    }

    const content = payload.format === 'md'
      ? `# 校正結果\n\n## 原文\n\n${payload.inputText}\n\n## 校正文\n\n${payload.correctedText}\n`
      : `原文:\n${payload.inputText}\n\n校正文:\n${payload.correctedText}\n`;

    await writeFile(result.filePath, content, 'utf8');
    return { success: true, path: result.filePath };
  }
}
