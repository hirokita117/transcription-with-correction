import { ipcMain, globalShortcut, BrowserWindow } from 'electron';
import type { CorrectionRequest, Settings, TranscriptionResult, VoiceInputStatus } from '../shared/types';
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

    ipcMain.handle('get-settings', async () => {
      return this.configManager.load();
    });

    ipcMain.handle('save-settings', async (_event, settings: Settings) => {
      this.configManager.save(settings);
      this.llmService.updateSettings(settings);
      this.registerVoiceShortcut(settings.voiceInput.shortcut);
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
}
