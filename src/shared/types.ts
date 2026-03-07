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

export interface ResidentModeConfig {
  enabled: boolean;
  showDockIcon: boolean;
}

export interface PasteBackConfig {
  enabled: boolean;
  fallbackToClipboardOnly: boolean;
}

export interface Settings {
  activeProvider: ProviderType;
  lmStudio: LMStudioConfig;
  gemini: GeminiConfig;
  promptTemplate: string;
  voiceInput: VoiceInputConfig;
  residentMode: ResidentModeConfig;
  pasteBack: PasteBackConfig;
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

export interface FrontmostAppInfo {
  bundleId: string;
  name: string;
  processId: number;
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

export type PasteBackStatus =
  | 'pasted'
  | 'clipboard_only'
  | 'settings_required'
  | 'correction_failed';

export interface PasteBackResult {
  status: PasteBackStatus;
  message?: string;
  details?: 'permission_missing' | 'target_not_found' | 'activation_failed' | 'target_not_frontmost' | 'paste_failed';
}

export interface PermissionStatus {
  accessibilityTrusted: boolean;
  automationAvailable?: boolean;
}

export type VoiceSessionPhase =
  | 'hidden'
  | 'recording'
  | 'transcribing'
  | 'correcting'
  | 'success'
  | 'provider_not_configured'
  | 'correction_failed'
  | 'paste_fallback';

export type VoiceSessionErrorCode =
  | 'provider_not_configured'
  | 'connection_error'
  | 'auth_error'
  | 'api_error'
  | 'unknown_error'
  | 'permission_missing'
  | 'target_not_found'
  | 'target_not_frontmost'
  | 'paste_failed';

export interface VoiceSessionViewModel {
  visible: boolean;
  phase: VoiceSessionPhase;
  liveTranscript: string;
  finalTranscript: string;
  correctedText?: string;
  message: string;
  canRetryCorrection: boolean;
  errorCode?: VoiceSessionErrorCode;
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
  getSettingsWindowData(): Promise<BootstrapData>;
  saveSettings(settings: Settings): Promise<void>;
  getPermissionStatus(): Promise<PermissionStatus>;
  openAccessibilitySettings(): Promise<void>;
  openSettingsWindow(): Promise<void>;
  closeSettingsWindow(): Promise<void>;
  retryLastCorrection(): Promise<void>;
  dismissVoiceWindow(): Promise<void>;
  onVoiceSessionStateChange(callback: (state: VoiceSessionViewModel) => void): () => void;
  onSettingsRequired(callback: () => void): () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
