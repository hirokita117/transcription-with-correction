import { EventEmitter } from 'events';
import type {
  CorrectionError,
  FrontmostAppInfo,
  Settings,
  TranscriptionResult,
  VoiceInputStatus,
  VoiceSessionErrorCode,
  VoiceSessionViewModel,
} from '../../shared/types';
import { ConfigManager } from './config-manager';
import { FrontmostAppService } from './frontmost-app-service';
import { LLMService } from './llm/llm-service';
import { PasteBackService } from './paste-back-service';
import { SettingsWindowService } from './settings-window-service';
import { SpeechService } from './speech-service';
import { VoiceCaptureWindowService } from './voice-capture-window-service';

const HIDE_DELAY_MS = 1500;

const DEFAULT_STATE: VoiceSessionViewModel = {
  visible: false,
  phase: 'hidden',
  liveTranscript: '',
  finalTranscript: '',
  message: '',
  canRetryCorrection: false,
};

interface DictationSessionDependencies {
  configManager: ConfigManager;
  llmService: LLMService;
  speechService: SpeechService;
  frontmostAppService: FrontmostAppService;
  pasteBackService: PasteBackService;
  settingsWindowService: SettingsWindowService;
  voiceCaptureWindowService: VoiceCaptureWindowService;
}

export class DictationSessionService extends EventEmitter {
  private latestSettings: Settings;
  private liveTranscript = '';
  private finalTranscript = '';
  private lastCorrectionSource = '';
  private currentState: VoiceSessionViewModel = DEFAULT_STATE;
  private targetApp: FrontmostAppInfo | null = null;

  constructor(private readonly deps: DictationSessionDependencies) {
    super();
    this.latestSettings = this.deps.configManager.load();

    this.deps.speechService.on('transcription', (result: TranscriptionResult) => {
      void this.handleTranscriptionResult(result);
    });

    this.deps.speechService.on('status-change', (status: VoiceInputStatus) => {
      void this.handleSpeechStatusChange(status);
    });

    this.deps.speechService.on('error', (error: { code: string; message: string }) => {
      void this.showFailureState('correction_failed', error.message, this.mapUnknownError(error.code));
    });
  }

  updateSettings(settings: Settings): void {
    this.latestSettings = settings;
  }

  getCurrentState(): VoiceSessionViewModel {
    return this.currentState;
  }

  isListening(): boolean {
    const status = this.deps.speechService.getStatus();
    return status === 'starting' || status === 'listening' || status === 'stopping';
  }

  async toggleVoiceCapture(): Promise<void> {
    const status = this.deps.speechService.getStatus();

    if (status === 'idle' || status === 'error') {
      await this.startVoiceCapture();
      return;
    }

    if (status === 'listening') {
      this.stopVoiceCapture();
    }
  }

  async startVoiceCapture(): Promise<void> {
    this.resetTranscripts();
    this.targetApp = await this.deps.frontmostAppService.getFrontmostApp();
    if (this.targetApp?.processId === process.pid) {
      this.targetApp = null;
    }
    this.deps.pasteBackService.setTargetApp(this.targetApp);

    await this.setState({
      visible: true,
      phase: 'recording',
      liveTranscript: '',
      finalTranscript: '',
      message: '話している内容をリアルタイムで表示します',
      canRetryCorrection: false,
    });

    this.deps.speechService.start(this.latestSettings.voiceInput.language);
  }

  stopVoiceCapture(): void {
    this.deps.speechService.stop();
  }

  async retryLastCorrection(): Promise<void> {
    if (!this.lastCorrectionSource.trim()) return;
    await this.runCorrection(this.lastCorrectionSource, 'retry');
  }

  dismissVoiceWindow(): void {
    this.currentState = DEFAULT_STATE;
    this.deps.voiceCaptureWindowService.dismiss();
  }

  private async handleTranscriptionResult(result: TranscriptionResult): Promise<void> {
    if (result.isFinal) {
      this.finalTranscript = result.text;
      this.liveTranscript = '';
      this.lastCorrectionSource = result.text;
    } else {
      this.liveTranscript = result.text;
    }

    await this.setState({
      ...this.currentState,
      visible: true,
      phase: 'recording',
      liveTranscript: this.liveTranscript,
      finalTranscript: this.finalTranscript,
      message: this.finalTranscript || this.liveTranscript
        ? 'ショートカットをもう一度押すと音声入力を終了します'
        : '話している内容をリアルタイムで表示します',
      canRetryCorrection: false,
    });
  }

  private async handleSpeechStatusChange(status: VoiceInputStatus): Promise<void> {
    if (status === 'starting' || status === 'listening') {
      await this.setState({
        ...this.currentState,
        visible: true,
        phase: 'recording',
        liveTranscript: this.liveTranscript,
        finalTranscript: this.finalTranscript,
        message: 'ショートカットをもう一度押すと音声入力を終了します',
        canRetryCorrection: false,
      });
      this.emit('session-state-change', this.currentState);
      return;
    }

    if (status === 'stopping') {
      await this.setState({
        ...this.currentState,
        visible: true,
        phase: 'transcribing',
        liveTranscript: this.liveTranscript,
        finalTranscript: this.finalTranscript,
        message: '音声を確定しています',
        canRetryCorrection: false,
      });
      this.emit('session-state-change', this.currentState);
      return;
    }

    if (status === 'idle' && this.lastCorrectionSource.trim()) {
      await this.runCorrection(this.lastCorrectionSource, 'auto');
      return;
    }

    if (status === 'error') {
      await this.showFailureState('correction_failed', '音声入力の開始に失敗しました', 'unknown_error');
    }

    this.emit('session-state-change', this.currentState);
  }

  private async runCorrection(sourceText: string, trigger: 'auto' | 'retry'): Promise<void> {
    const settings = this.deps.configManager.load();
    this.latestSettings = settings;
    this.lastCorrectionSource = sourceText;

    await this.setState({
      ...this.currentState,
      visible: true,
      phase: 'correcting',
      liveTranscript: '',
      finalTranscript: sourceText,
      correctedText: undefined,
      message: trigger === 'retry' ? '再度テキストを整えています' : 'テキストを整えています',
      canRetryCorrection: false,
      errorCode: undefined,
    });

    const response = await this.deps.llmService.correct({
      text: sourceText,
      promptTemplate: settings.promptTemplate,
    });

    if (!response.success || !response.correctedText) {
      const error = response.error as CorrectionError | undefined;
      if (error?.type === 'PROVIDER_NOT_CONFIGURED') {
        await this.setState({
          ...this.currentState,
          visible: true,
          phase: 'provider_not_configured',
          liveTranscript: '',
          finalTranscript: sourceText,
          correctedText: undefined,
          message: error.message,
          canRetryCorrection: false,
          errorCode: 'provider_not_configured',
        });
        this.emit('settings-required');
        return;
      }

      await this.showFailureState(
        'correction_failed',
        error?.message ?? '校正処理に失敗しました',
        this.mapCorrectionError(error?.type)
      );
      return;
    }

    const pasteResult = settings.pasteBack.enabled
      ? await this.pasteCorrectedText(response.correctedText, settings.pasteBack.fallbackToClipboardOnly)
      : { status: 'clipboard_only' as const, message: '校正結果をコピーしました' };

    if (pasteResult.status === 'pasted') {
      this.deps.voiceCaptureWindowService.dismiss();
      this.currentState = DEFAULT_STATE;
      this.resetSessionAfterDelay(0);
      return;
    }

    await this.setState({
      visible: true,
      phase: 'paste_fallback',
      liveTranscript: '',
      finalTranscript: sourceText,
      correctedText: response.correctedText,
      message: pasteResult.message ?? '校正結果をコピーしました。手動で貼り付けてください',
      canRetryCorrection: false,
      errorCode: this.mapPasteError(pasteResult.details),
    });
    this.deps.voiceCaptureWindowService.dismissAfterDelay(HIDE_DELAY_MS + 1000);
    this.resetSessionAfterDelay(HIDE_DELAY_MS + 1200);
  }

  private async showFailureState(
    phase: 'correction_failed',
    message: string,
    errorCode: VoiceSessionErrorCode,
  ): Promise<void> {
    await this.setState({
      visible: true,
      phase,
      liveTranscript: '',
      finalTranscript: this.lastCorrectionSource || this.finalTranscript,
      correctedText: undefined,
      message,
      canRetryCorrection: this.lastCorrectionSource.trim().length > 0,
      errorCode,
    });
  }

  private async setState(state: VoiceSessionViewModel): Promise<void> {
    this.currentState = state;
    await this.deps.voiceCaptureWindowService.update(state);
    this.emit('session-state-change', state);
  }

  private resetTranscripts(): void {
    this.liveTranscript = '';
    this.finalTranscript = '';
    this.lastCorrectionSource = '';
    this.currentState = DEFAULT_STATE;
  }

  private resetSessionAfterDelay(delayMs: number = HIDE_DELAY_MS + 1200): void {
    setTimeout(() => {
      this.currentState = DEFAULT_STATE;
      this.liveTranscript = '';
      this.finalTranscript = '';
      this.lastCorrectionSource = '';
      this.targetApp = null;
      this.deps.pasteBackService.clearTargetApp();
    }, delayMs);
  }

  private async pasteCorrectedText(text: string, fallbackToClipboardOnly: boolean) {
    this.deps.voiceCaptureWindowService.dismiss();
    return this.deps.pasteBackService.pasteText(text, fallbackToClipboardOnly);
  }

  private mapCorrectionError(type?: CorrectionError['type']): VoiceSessionErrorCode {
    switch (type) {
      case 'PROVIDER_NOT_CONFIGURED':
        return 'provider_not_configured';
      case 'CONNECTION_ERROR':
        return 'connection_error';
      case 'AUTH_ERROR':
        return 'auth_error';
      case 'API_ERROR':
        return 'api_error';
      default:
        return 'unknown_error';
    }
  }

  private mapPasteError(details?: string): VoiceSessionErrorCode {
    switch (details) {
      case 'permission_missing':
        return 'permission_missing';
      case 'target_not_found':
        return 'target_not_found';
      case 'target_not_frontmost':
        return 'target_not_frontmost';
      case 'paste_failed':
        return 'paste_failed';
      default:
        return 'unknown_error';
    }
  }

  private mapUnknownError(_code: string): VoiceSessionErrorCode {
    return 'unknown_error';
  }
}
