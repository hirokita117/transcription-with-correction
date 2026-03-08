import { app, globalShortcut } from 'electron';
import { ConfigManager } from './services/config-manager';
import { AutomationHelperClient } from './services/automation-helper-client';
import { DictationSessionService } from './services/dictation-session-service';
import { FrontmostAppService } from './services/frontmost-app-service';
import { IPCHandler } from './ipc-handler';
import { LLMService } from './services/llm/llm-service';
import { PasteBackService } from './services/paste-back-service';
import { PermissionService } from './services/permission-service';
import { ResidentModeService } from './services/resident-mode-service';
import { SettingsWindowService } from './services/settings-window-service';
import { SpeechService } from './services/speech-service';
import { VoiceCaptureWindowService } from './services/voice-capture-window-service';

let isQuitting = false;
let hasCleanedUp = false;

const configManager = new ConfigManager();
const settings = configManager.load();
const automationHelperClient = new AutomationHelperClient();
const permissionService = new PermissionService(automationHelperClient);
const frontmostAppService = new FrontmostAppService(automationHelperClient);
const pasteBackService = new PasteBackService(automationHelperClient, permissionService);
const llmService = new LLMService(settings);
const speechService = new SpeechService();
const settingsWindowService = new SettingsWindowService({
  getDevServerUrl: () => process.env.VITE_DEV_SERVER_URL,
});
const voiceCaptureWindowService = new VoiceCaptureWindowService({
  getDevServerUrl: () => process.env.VITE_DEV_SERVER_URL,
});
const dictationSessionService = new DictationSessionService({
  configManager,
  llmService,
  speechService,
  frontmostAppService,
  pasteBackService,
  settingsWindowService,
  voiceCaptureWindowService,
});
const residentModeService = new ResidentModeService({
  isVoiceListening: () => dictationSessionService.isListening(),
  onToggleVoiceInput: () => {
    void dictationSessionService.toggleVoiceCapture();
  },
  onOpenSettings: () => {
    void settingsWindowService.show();
  },
  onQuit: () => {
    isQuitting = true;
    app.quit();
  },
  getPermissionStatus: () => permissionService.getStatus(),
});
const ipcHandler = new IPCHandler(
  configManager,
  permissionService,
  residentModeService,
  settingsWindowService,
  dictationSessionService,
);

app.whenReady().then(async () => {
  ipcHandler.registerHandlers();
  ipcHandler.registerVoiceShortcut(settings.voiceInput.shortcut);
  await residentModeService.setEnabled(settings.residentMode.enabled);
  residentModeService.applyDockVisibility(settings.residentMode.showDockIcon);

  const bootstrap = configManager.getBootstrapData();
  if (bootstrap.isFirstRun || bootstrap.needsSetup) {
    await settingsWindowService.show();
  }

  app.on('activate', () => {
    void settingsWindowService.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  cleanupResources();
});

const cleanupResources = () => {
  if (hasCleanedUp) return;

  hasCleanedUp = true;
  if (!isQuitting) {
    isQuitting = true;
  }

  globalShortcut.unregisterAll();
  ipcHandler.destroy();
  residentModeService.destroy();
  settingsWindowService.destroy();
  voiceCaptureWindowService.destroy();
  speechService.destroy();
};

const shutdown = () => {
  try {
    cleanupResources();
  } finally {
    app.quit();
  }
};

process.on('SIGINT', () => {
  shutdown();
});

process.on('SIGTERM', () => {
  shutdown();
});
