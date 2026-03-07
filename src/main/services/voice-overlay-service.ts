import { BrowserWindow } from 'electron';
import path from 'path';
import type { OverlayState } from '../../shared/types';

interface VoiceOverlayServiceOptions {
  getDevServerUrl: () => string | undefined;
}

const DEFAULT_OVERLAY_STATE: OverlayState = {
  visible: false,
  phase: 'recording',
  message: '',
};

export class VoiceOverlayService {
  private overlayWindow: BrowserWindow | null = null;
  private currentState: OverlayState = DEFAULT_OVERLAY_STATE;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: VoiceOverlayServiceOptions) {}

  async showForRecording(): Promise<void> {
    await this.show({ visible: true, phase: 'recording', message: '話し終わったらもう一度ショートカットを押してください' });
  }

  async showForTranscribing(): Promise<void> {
    await this.show({ visible: true, phase: 'transcribing', message: '認識結果をまとめています' });
  }

  async showForCorrecting(): Promise<void> {
    await this.show({ visible: true, phase: 'correcting', message: 'テキストを整えています' });
  }

  async showForSuccess(message: string): Promise<void> {
    await this.show({ visible: true, phase: 'success', message });
    this.hideDelayed();
  }

  async showForFallback(message: string): Promise<void> {
    await this.show({ visible: true, phase: 'fallback', message });
    this.hideDelayed();
  }

  async showForError(message: string): Promise<void> {
    await this.show({ visible: true, phase: 'error', message });
    this.hideDelayed();
  }

  async update(state: OverlayState): Promise<void> {
    if (state.visible) {
      await this.show(state);
      return;
    }

    this.currentState = state;
    this.sendState();
    this.hideDelayed();
  }

  dismiss(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
    this.overlayWindow.hide();
  }

  destroy(): void {
    this.dismiss();
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
    this.overlayWindow.destroy();
    this.overlayWindow = null;
  }

  private async show(state: OverlayState): Promise<void> {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.currentState = state;
    const window = await this.ensureWindow();
    this.sendState();
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    window.showInactive();
  }

  private hideDelayed(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.hideTimer = setTimeout(() => {
      this.currentState = { ...this.currentState, visible: false };
      this.sendState();
      this.dismiss();
    }, 2500);
  }

  private sendState(): void {
    if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;
    this.overlayWindow.webContents.send('overlay-state-change', this.currentState);
  }

  private async ensureWindow(): Promise<BrowserWindow> {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      return this.overlayWindow;
    }

    this.overlayWindow = new BrowserWindow({
      width: 360,
      height: 180,
      frame: false,
      transparent: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      movable: false,
      skipTaskbar: true,
      show: false,
      focusable: false,
      alwaysOnTop: true,
      roundedCorners: true,
      hasShadow: true,
      webPreferences: {
        preload: path.join(__dirname, '../../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.overlayWindow.setAlwaysOnTop(true, 'status');
    this.overlayWindow.setPosition(24, 24);
    this.overlayWindow.on('closed', () => {
      this.overlayWindow = null;
    });

    const devUrl = this.options.getDevServerUrl();
    if (devUrl) {
      await this.overlayWindow.loadURL(`${devUrl}?overlay=1`);
    } else {
      await this.overlayWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), {
        query: { overlay: '1' },
      });
    }

    this.overlayWindow.webContents.once('did-finish-load', () => {
      this.sendState();
    });

    return this.overlayWindow;
  }
}
