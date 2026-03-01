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
  data: { status: string };
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
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
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
