export type ProviderType = 'lm-studio' | 'gemini';

export interface LMStudioConfig {
  endpointUrl: string;
  modelName: string;
}

export interface GeminiConfig {
  apiKey: string;
  modelName: string;
}

export interface Settings {
  activeProvider: ProviderType;
  lmStudio: LMStudioConfig;
  gemini: GeminiConfig;
  promptTemplate: string;
}

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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
