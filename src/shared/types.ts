export type ProviderType = 'lm-studio' | 'gemini';

export interface LMStudioConfig {
  endpointUrl: string;
  modelName: string;
}

export interface GeminiConfig {
  apiKey: string;
  modelName: string;
}

export interface VoiceInputConfig {
  shortcut: string;
  autoCorrect: boolean;
  language: string;
}

export interface Settings {
  activeProvider: ProviderType;
  lmStudio: LMStudioConfig;
  gemini: GeminiConfig;
  promptTemplate: string;
  voiceInput: VoiceInputConfig;
}

export type VoiceInputStatus = 'idle' | 'starting' | 'listening' | 'stopping' | 'error';

export type CorrectionLifecycleStatus =
  | 'idle'
  | 'setup-required'
  | 'recording'
  | 'transcribing'
  | 'correcting'
  | 'success'
  | 'failure';

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  timestamp: string;
}

export type SpeechHelperMessageType = 'result' | 'error' | 'status';

export interface SpeechHelperResultMessage {
  type: 'result';
  data: TranscriptionResult;
}

export interface SpeechHelperErrorMessage {
  type: 'error';
  data: { code: string; message: string };
}

export interface SpeechHelperStatusMessage {
  type: 'status';
  data: { status: 'ready' | 'listening' | 'stopped' };
}

export type SpeechHelperMessage =
  | SpeechHelperResultMessage
  | SpeechHelperErrorMessage
  | SpeechHelperStatusMessage;

export interface CorrectionRequest {
  text: string;
  promptTemplate: string;
}

export type ErrorType =
  | 'EMPTY_TEXT'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'CONNECTION_ERROR'
  | 'AUTH_ERROR'
  | 'API_ERROR'
  | 'UNKNOWN_ERROR';

export interface CorrectionError {
  type: ErrorType;
  message: string;
}

export interface CorrectionResponse {
  success: boolean;
  correctedText?: string;
  error?: CorrectionError;
}

export interface UIToast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface CorrectionHistoryItem {
  id: string;
  inputText: string;
  correctedText: string;
  provider: ProviderType;
  createdAt: string;
}

export interface AnalyticsEvent {
  name:
    | 'settings_opened'
    | 'provider_validation_failed'
    | 'voice_started'
    | 'voice_stopped'
    | 'voice_autocorrect_started'
    | 'correction_started'
    | 'correction_succeeded'
    | 'correction_failed'
    | 'result_copied'
    | 'result_exported';
  timestamp: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface ExportCorrectionPayload {
  inputText: string;
  correctedText: string;
  format: 'txt' | 'md';
}

export interface ExportCorrectionResponse {
  success: boolean;
  path?: string;
  error?: string;
}

export interface BootstrapData {
  settings: Settings;
  isFirstRun: boolean;
  needsSetup: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ElectronAPI {
  correctText(request: CorrectionRequest): Promise<CorrectionResponse>;
  getBootstrapData(): Promise<BootstrapData>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  getCorrectionHistory(): Promise<CorrectionHistoryItem[]>;
  saveCorrectionHistoryItem(item: CorrectionHistoryItem): Promise<void>;
  exportCorrectionResult(payload: ExportCorrectionPayload): Promise<ExportCorrectionResponse>;
  trackEvent(event: AnalyticsEvent): Promise<void>;
  startVoiceInput(): Promise<void>;
  stopVoiceInput(): Promise<void>;
  onTranscriptionResult(callback: (result: TranscriptionResult) => void): () => void;
  onVoiceInputStatusChange(callback: (status: VoiceInputStatus) => void): () => void;
  onVoiceInputShortcut(callback: () => void): () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
