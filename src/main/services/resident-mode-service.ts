import { Menu, Tray, nativeImage, app } from 'electron';
import path from 'path';
import type { PermissionStatus } from '../../shared/types';

interface ResidentModeOptions {
  isVoiceListening: () => boolean;
  onToggleVoiceInput: () => void;
  onOpenSettings: () => void;
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

    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'icon.png')
      : path.join(app.getAppPath(), 'build', 'icon.png');
    const trayIcon = nativeImage.createFromPath(iconPath).resize({
      width: 18,
      height: 18,
    });
    trayIcon.setTemplateImage(true);
    this.tray = new Tray(trayIcon);
    this.tray.setToolTip('Transcription Correction');
    this.tray.on('click', () => {
      this.options.onOpenSettings();
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
        label: '設定を開く',
        click: this.options.onOpenSettings,
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

  destroy(): void {
    if (!this.tray) return;
    this.tray.destroy();
    this.tray = null;
  }
}
