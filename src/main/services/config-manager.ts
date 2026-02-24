import Store from 'electron-store';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { app } from 'electron';
import type { Settings, ValidationResult, ValidationError, ProviderType } from '../../shared/types';

const DEFAULT_PROMPT_TEMPLATE = `あなたはプロフェッショナルな校正者です。
以下のテキストの誤字脱字・文法エラーを修正してください。

ルール:
- 原文の意味や文体を変えないこと
- 誤字脱字・文法エラーのみを修正すること
- 修正後のテキストのみを出力すること（説明や注釈は不要）

テキスト:
{text}`;

const DEFAULT_SETTINGS: Settings = {
  activeProvider: 'lm-studio',
  lmStudio: {
    endpointUrl: 'http://localhost:1234/v1',
    modelName: '',
  },
  gemini: {
    apiKey: '',
    modelName: 'gemini-2.0-flash',
  },
  promptTemplate: DEFAULT_PROMPT_TEMPLATE,
};

export class ConfigManager {
  private store: Store<{ settings: Settings }>;
  private envConfig: Partial<Settings>;

  constructor() {
    this.store = new Store<{ settings: Settings }>({
      name: 'transcription-correction-settings',
    });
    this.envConfig = {};
  }

  load(): Settings {
    // Load .env file
    const envPath = path.join(app.getAppPath(), '.env');
    dotenv.config({ path: envPath });

    // Build env-based config
    this.envConfig = this.buildEnvConfig();

    // Merge: store > .env > defaults
    const stored = this.store.get('settings');
    const merged: Settings = {
      activeProvider: stored?.activeProvider ?? this.envConfig.activeProvider ?? DEFAULT_SETTINGS.activeProvider,
      lmStudio: {
        endpointUrl: stored?.lmStudio?.endpointUrl ?? this.envConfig.lmStudio?.endpointUrl ?? DEFAULT_SETTINGS.lmStudio.endpointUrl,
        modelName: stored?.lmStudio?.modelName ?? this.envConfig.lmStudio?.modelName ?? DEFAULT_SETTINGS.lmStudio.modelName,
      },
      gemini: {
        apiKey: stored?.gemini?.apiKey ?? this.envConfig.gemini?.apiKey ?? DEFAULT_SETTINGS.gemini.apiKey,
        modelName: stored?.gemini?.modelName ?? this.envConfig.gemini?.modelName ?? DEFAULT_SETTINGS.gemini.modelName,
      },
      promptTemplate: stored?.promptTemplate ?? DEFAULT_SETTINGS.promptTemplate,
    };

    return merged;
  }

  save(settings: Settings): void {
    this.store.set('settings', settings);
  }

  validate(settings: Settings): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate active provider specific settings
    if (settings.activeProvider === 'lm-studio') {
      if (!settings.lmStudio.endpointUrl) {
        errors.push({ field: 'lmStudio.endpointUrl', message: 'エンドポイントURLは必須です' });
      } else {
        try {
          new URL(settings.lmStudio.endpointUrl);
        } catch {
          errors.push({ field: 'lmStudio.endpointUrl', message: '有効なURL形式で入力してください' });
        }
      }
    }

    if (settings.activeProvider === 'gemini') {
      if (!settings.gemini.apiKey) {
        errors.push({ field: 'gemini.apiKey', message: 'APIキーは必須です' });
      }
      if (!settings.gemini.modelName) {
        errors.push({ field: 'gemini.modelName', message: 'モデル名は必須です' });
      }
    }

    // Validate prompt template
    if (!settings.promptTemplate.includes('{text}')) {
      errors.push({ field: 'promptTemplate', message: 'プロンプトテンプレートには {text} プレースホルダーが必要です' });
    }

    return { valid: errors.length === 0, errors };
  }

  getDefaultPromptTemplate(): string {
    return DEFAULT_PROMPT_TEMPLATE;
  }

  private buildEnvConfig(): Partial<Settings> {
    const config: Partial<Settings> = {};

    const provider = process.env.LLM_PROVIDER;
    if (provider === 'lm-studio' || provider === 'gemini') {
      config.activeProvider = provider as ProviderType;
    }

    config.lmStudio = {
      endpointUrl: process.env.LM_STUDIO_ENDPOINT || DEFAULT_SETTINGS.lmStudio.endpointUrl,
      modelName: process.env.LM_STUDIO_MODEL || DEFAULT_SETTINGS.lmStudio.modelName,
    };

    config.gemini = {
      apiKey: process.env.GEMINI_API_KEY || DEFAULT_SETTINGS.gemini.apiKey,
      modelName: process.env.GEMINI_MODEL || DEFAULT_SETTINGS.gemini.modelName,
    };

    return config;
  }
}
