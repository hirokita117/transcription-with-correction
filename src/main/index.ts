import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { ConfigManager } from './services/config-manager';
import { LLMService } from './services/llm/llm-service';
import { SpeechService } from './services/speech-service';
import { IPCHandler } from './ipc-handler';

let mainWindow: BrowserWindow | null = null;

const configManager = new ConfigManager();
const settings = configManager.load();
const llmService = new LLMService(settings);
const speechService = new SpeechService();
const ipcHandler = new IPCHandler(configManager, llmService, speechService);

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
}

app.whenReady().then(() => {
  ipcHandler.registerHandlers();
  ipcHandler.registerVoiceShortcut(settings.voiceInput.shortcut);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  ipcHandler.destroy();
});
