import { ipcMain } from 'electron';
import type { CorrectionRequest, Settings } from '../shared/types';
import { ConfigManager } from './services/config-manager';
import { LLMService } from './services/llm/llm-service';

export class IPCHandler {
  private configManager: ConfigManager;
  private llmService: LLMService;

  constructor(configManager: ConfigManager, llmService: LLMService) {
    this.configManager = configManager;
    this.llmService = llmService;
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
    });
  }
}
