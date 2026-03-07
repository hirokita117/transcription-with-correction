import { BrowserWindow } from 'electron';
import path from 'path';
import type { VoiceSessionViewModel } from '../../shared/types';

interface VoiceCaptureWindowServiceOptions {
  getDevServerUrl: () => string | undefined;
}

const DEFAULT_STATE: VoiceSessionViewModel = {
  visible: false,
  phase: 'hidden',
  liveTranscript: '',
  finalTranscript: '',
  message: '',
  canRetryCorrection: false,
};

export class VoiceCaptureWindowService {
  private window: BrowserWindow | null = null;
  private currentState: VoiceSessionViewModel = DEFAULT_STATE;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private hasUserMovedWindow = false;

  constructor(private readonly options: VoiceCaptureWindowServiceOptions) {}

  async show(state: VoiceSessionViewModel): Promise<void> {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.currentState = state;
    const window = await this.ensureWindow();
    this.applyFocusPolicy(window, state);
    this.sendState();
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    if (this.shouldFocus(state)) {
      window.show();
      window.focus();
    } else {
      window.showInactive();
    }
  }

  async update(state: VoiceSessionViewModel): Promise<void> {
    if (state.visible) {
      await this.show(state);
      return;
    }

    this.currentState = state;
    this.sendState();
    this.dismiss();
  }

  dismiss(): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    if (!this.window || this.window.isDestroyed()) return;
    this.window.hide();
  }

  dismissAfterDelay(delayMs: number): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    this.hideTimer = setTimeout(() => {
      this.currentState = { ...DEFAULT_STATE };
      this.sendState();
      this.dismiss();
    }, delayMs);
  }

  destroy(): void {
    this.dismiss();
    if (!this.window || this.window.isDestroyed()) return;
    this.window.destroy();
    this.window = null;
  }

  private sendState(): void {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.webContents.send('voice-session-state-change', this.currentState);
  }

  private async ensureWindow(): Promise<BrowserWindow> {
    if (this.window && !this.window.isDestroyed()) {
      return this.window;
    }

    this.window = new BrowserWindow({
      width: 460,
      height: 320,
      frame: false,
      transparent: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      movable: true,
      skipTaskbar: true,
      show: false,
      focusable: true,
      alwaysOnTop: true,
      roundedCorners: true,
      hasShadow: true,
      center: true,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    this.window.setAlwaysOnTop(true, 'status');
    this.window.on('move', () => {
      this.hasUserMovedWindow = true;
    });
    this.window.once('ready-to-show', () => {
      if (!this.hasUserMovedWindow) {
        this.window?.center();
      }
    });
    this.window.on('closed', () => {
      this.window = null;
      this.hasUserMovedWindow = false;
    });

    const devUrl = this.options.getDevServerUrl();
    if (devUrl) {
      await this.window.loadURL(`${devUrl}?overlay=1`);
    } else {
      await this.window.loadFile(path.join(__dirname, '../../dist/index.html'), {
        query: { overlay: '1' },
      });
    }

    this.window.webContents.once('did-finish-load', () => {
      this.sendState();
    });

    return this.window;
  }

  private applyFocusPolicy(window: BrowserWindow, state: VoiceSessionViewModel): void {
    window.setFocusable(this.shouldFocus(state));
    window.setAlwaysOnTop(true, 'status');
  }

  private shouldFocus(state: VoiceSessionViewModel): boolean {
    return state.phase === 'provider_not_configured' || state.phase === 'correction_failed';
  }
}
