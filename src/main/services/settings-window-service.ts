import { BrowserWindow } from 'electron';
import path from 'path';

interface SettingsWindowServiceOptions {
  getDevServerUrl: () => string | undefined;
}

export class SettingsWindowService {
  private window: BrowserWindow | null = null;
  private isQuitting = false;

  constructor(private readonly options: SettingsWindowServiceOptions) {}

  async show(): Promise<void> {
    const window = await this.ensureWindow();
    if (window.isMinimized()) {
      window.restore();
    }
    window.show();
    window.focus();
  }

  hide(): void {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.hide();
  }

  isVisible(): boolean {
    return Boolean(this.window && !this.window.isDestroyed() && this.window.isVisible());
  }

  send(channel: string, ...args: unknown[]): void {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.webContents.send(channel, ...args);
  }

  destroy(): void {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.destroy();
    this.window = null;
  }

  prepareForQuit(): void {
    this.isQuitting = true;
  }

  private async ensureWindow(): Promise<BrowserWindow> {
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    this.window = new BrowserWindow({
      width: 520,
      height: 720,
      minWidth: 460,
      minHeight: 640,
      resizable: false,
      show: false,
      title: '設定',
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.window.on('close', (event) => {
      if (this.isQuitting) {
        return;
      }

      event.preventDefault();
      this.window?.hide();
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    const devUrl = this.options.getDevServerUrl();
    if (devUrl) {
      await this.window.loadURL(devUrl);
    } else {
      await this.window.loadFile(path.join(__dirname, '../../dist/index.html'));
    }

    return this.window;
  }
}
