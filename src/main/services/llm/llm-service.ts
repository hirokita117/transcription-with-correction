import type { Settings, CorrectionRequest, CorrectionResponse, CorrectionError, ErrorType } from '../../../shared/types';
import type { LLMProvider } from './types';
import { LMStudioProvider } from './lm-studio-provider';
import { GeminiProvider } from './gemini-provider';

const ERROR_MESSAGES: Record<ErrorType, string> = {
  EMPTY_TEXT: '校正するテキストを入力してください',
  PROVIDER_NOT_CONFIGURED: 'LLMプロバイダーの設定を確認してください。設定画面で接続情報を入力してください',
  CONNECTION_ERROR: 'APIサーバーに接続できません。接続先URLとサーバーの起動状態を確認してください',
  AUTH_ERROR: 'APIキーが無効です。設定画面でAPIキーを確認してください',
  API_ERROR: '校正処理中にエラーが発生しました。しばらく待ってからもう一度お試しください',
  UNKNOWN_ERROR: '予期しないエラーが発生しました。アプリを再起動してください',
};

export class LLMService {
  private providers: Map<string, LLMProvider>;
  private lmStudioProvider: LMStudioProvider;
  private geminiProvider: GeminiProvider;
  private activeProviderType: string;

  constructor(settings: Settings) {
    this.lmStudioProvider = new LMStudioProvider(settings.lmStudio);
    this.geminiProvider = new GeminiProvider(settings.gemini);
    this.activeProviderType = settings.activeProvider;

    this.providers = new Map();
    this.providers.set('lm-studio', this.lmStudioProvider);
    this.providers.set('gemini', this.geminiProvider);
  }

  async correct(request: CorrectionRequest): Promise<CorrectionResponse> {
    // Validate input
    if (!request.text.trim()) {
      return this.errorResponse('EMPTY_TEXT');
    }

    const provider = this.providers.get(this.activeProviderType);
    if (!provider) {
      return this.errorResponse('PROVIDER_NOT_CONFIGURED');
    }

    if (!provider.validateConfig()) {
      return this.errorResponse('PROVIDER_NOT_CONFIGURED');
    }

    // Build prompt from template
    const prompt = request.promptTemplate.replace('{text}', request.text);

    try {
      const correctedText = await provider.correct(prompt);
      return { success: true, correctedText };
    } catch (error: unknown) {
      return this.handleProviderError(error);
    }
  }

  updateSettings(settings: Settings): void {
    this.activeProviderType = settings.activeProvider;
    this.lmStudioProvider.updateConfig(settings.lmStudio);
    this.geminiProvider.updateConfig(settings.gemini);
  }

  private handleProviderError(error: unknown): CorrectionResponse {
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
      return this.errorResponse('CONNECTION_ERROR');
    }

    const statusError = error as { status?: number };
    if (statusError.status === 401 || statusError.status === 403) {
      return this.errorResponse('AUTH_ERROR');
    }

    if (statusError.status && statusError.status >= 400) {
      return this.errorResponse('API_ERROR');
    }

    // Check for connection-related errors
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('econnrefused') || msg.includes('enotfound') || msg.includes('etimedout')) {
        return this.errorResponse('CONNECTION_ERROR');
      }
    }

    return this.errorResponse('UNKNOWN_ERROR');
  }

  private errorResponse(type: ErrorType): CorrectionResponse {
    const error: CorrectionError = { type, message: ERROR_MESSAGES[type] };
    return { success: false, error };
  }
}
