import { Menu, Tray, BrowserWindow, nativeImage, app } from 'electron';
import type { PermissionStatus } from '../../shared/types';

interface ResidentModeOptions {
  isVoiceListening: () => boolean;
  onToggleVoiceInput: () => void;
  onOpenWindow: () => void;
  onQuit: () => void;
  getPermissionStatus: () => Promise<PermissionStatus>;
}

export class ResidentModeService {
  private tray: Tray | null = null;

  constructor(private readonly options: ResidentModeOptions) {}

  async setEnabled(enabled: boolean): Promise<void> {
    if (process.platform !== 'darwin') return;

    if (!enabled) {
      this.destroy();
      return;
    }

    if (this.tray) {
      await this.refreshMenu();
      return;
    }

    const trayIcon = nativeImage.createEmpty();
    this.tray = new Tray(trayIcon);
    this.tray.setTitle('校正');
    this.tray.setToolTip('Transcription Correction');
    this.tray.on('click', () => {
      this.options.onOpenWindow();
    });

    await this.refreshMenu();
  }

  async refreshMenu(): Promise<void> {
    if (!this.tray) return;

    const permission = await this.options.getPermissionStatus();
    const menu = Menu.buildFromTemplate([
      {
        label: this.options.isVoiceListening() ? '音声入力を停止' : '音声入力を開始',
        click: this.options.onToggleVoiceInput,
      },
      {
        label: 'メインウィンドウを開く',
        click: this.options.onOpenWindow,
      },
      {
        label: permission.accessibilityTrusted
          ? 'アクセシビリティ権限: 許可済み'
          : 'アクセシビリティ権限: 未許可',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: '終了',
        click: this.options.onQuit,
      },
    ]);

    this.tray.setContextMenu(menu);
  }

  applyDockVisibility(showDockIcon: boolean): void {
    if (process.platform !== 'darwin') return;
    if (!app.dock) return;

    if (showDockIcon) {
      app.dock.show();
    } else {
      app.dock.hide();
    }
  }

  handleWindowClose(window: BrowserWindow, enabled: boolean, isQuitting: boolean): boolean {
    if (!enabled || isQuitting) {
      return false;
    }

    window.hide();
    return true;
  }

  destroy(): void {
    if (!this.tray) return;
    this.tray.destroy();
    this.tray = null;
  }
}
