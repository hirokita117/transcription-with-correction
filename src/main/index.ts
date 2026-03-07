import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { ConfigManager } from './services/config-manager';
import { LLMService } from './services/llm/llm-service';
import { SpeechService } from './services/speech-service';
import { IPCHandler } from './ipc-handler';
import { AutomationHelperClient } from './services/automation-helper-client';
import { FrontmostAppService } from './services/frontmost-app-service';
import { PasteBackService } from './services/paste-back-service';
import { PermissionService } from './services/permission-service';
import { ResidentModeService } from './services/resident-mode-service';
import { VoiceOverlayService } from './services/voice-overlay-service';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const configManager = new ConfigManager();
const settings = configManager.load();
const llmService = new LLMService(settings);
const speechService = new SpeechService();
const automationHelperClient = new AutomationHelperClient();
const permissionService = new PermissionService(automationHelperClient);
const frontmostAppService = new FrontmostAppService(automationHelperClient);
const pasteBackService = new PasteBackService(automationHelperClient, permissionService);
const voiceOverlayService = new VoiceOverlayService({
  getDevServerUrl: () => process.env.VITE_DEV_SERVER_URL,
});
const residentModeService = new ResidentModeService({
  isVoiceListening: () => {
    const status = speechService.getStatus();
    return status === 'listening' || status === 'starting';
  },
  onToggleVoiceInput: () => {
    const status = speechService.getStatus();
    if (status === 'idle' || status === 'error') {
      speechService.start(configManager.load().voiceInput.language);
      return;
    }

    if (status === 'listening') {
      speechService.stop();
    }
  },
  onOpenWindow: () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  },
  onQuit: () => {
    isQuitting = true;
    app.quit();
  },
  getPermissionStatus: () => permissionService.getStatus(),
});
const ipcHandler = new IPCHandler(
  configManager,
  llmService,
  speechService,
  frontmostAppService,
  pasteBackService,
  permissionService,
  residentModeService,
  voiceOverlayService
);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('close', (event) => {
    if (residentModeService.handleWindowClose(mainWindow as BrowserWindow, configManager.load().residentMode.enabled, isQuitting)) {
      event.preventDefault();
    }
  });
}

app.whenReady().then(async () => {
  ipcHandler.registerHandlers();
  ipcHandler.registerVoiceShortcut(settings.voiceInput.shortcut);
  createWindow();
  await residentModeService.setEnabled(settings.residentMode.enabled);
  residentModeService.applyDockVisibility(settings.residentMode.showDockIcon);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || !configManager.load().residentMode.enabled) {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  ipcHandler.destroy();
  voiceOverlayService.destroy();
});
