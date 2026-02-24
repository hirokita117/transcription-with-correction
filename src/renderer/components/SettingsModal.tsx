import { useState, useEffect } from 'react';
import type { Settings, ProviderType, ValidationError } from '../../shared/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

const DEFAULT_PROMPT_TEMPLATE = `あなたはプロフェッショナルな校正者です。
以下のテキストの誤字脱字・文法エラーを修正してください。

ルール:
- 原文の意味や文体を変えないこと
- 誤字脱字・文法エラーのみを修正すること
- 修正後のテキストのみを出力すること（説明や注釈は不要）

テキスト:
{text}`;

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
      setValidationErrors([]);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const validate = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (localSettings.activeProvider === 'lm-studio') {
      if (!localSettings.lmStudio.endpointUrl) {
        errors.push({ field: 'lmStudio.endpointUrl', message: 'エンドポイントURLは必須です' });
      } else {
        try {
          new URL(localSettings.lmStudio.endpointUrl);
        } catch {
          errors.push({ field: 'lmStudio.endpointUrl', message: '有効なURL形式で入力してください' });
        }
      }
    }

    if (localSettings.activeProvider === 'gemini') {
      if (!localSettings.gemini.apiKey) {
        errors.push({ field: 'gemini.apiKey', message: 'APIキーは必須です' });
      }
      if (!localSettings.gemini.modelName) {
        errors.push({ field: 'gemini.modelName', message: 'モデル名は必須です' });
      }
    }

    if (!localSettings.promptTemplate.includes('{text}')) {
      errors.push({ field: 'promptTemplate', message: 'プロンプトテンプレートには {text} プレースホルダーが必要です' });
    }

    return errors;
  };

  const handleSave = () => {
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    onSave(localSettings);
  };

  const getFieldError = (field: string): string | undefined => {
    return validationErrors.find((e) => e.field === field)?.message;
  };

  const updateProvider = (provider: ProviderType) => {
    setLocalSettings({ ...localSettings, activeProvider: provider });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">設定</h2>

          {/* Provider Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 block mb-2">LLM プロバイダー</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  checked={localSettings.activeProvider === 'lm-studio'}
                  onChange={() => updateProvider('lm-studio')}
                  className="text-blue-600"
                />
                <span className="text-sm">LM Studio</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="provider"
                  checked={localSettings.activeProvider === 'gemini'}
                  onChange={() => updateProvider('gemini')}
                  className="text-blue-600"
                />
                <span className="text-sm">Gemini</span>
              </label>
            </div>
          </div>

          {/* LM Studio Settings */}
          {localSettings.activeProvider === 'lm-studio' && (
            <div className="mb-6 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Endpoint URL</label>
                <input
                  type="text"
                  className={`w-full border rounded px-3 py-2 text-sm ${getFieldError('lmStudio.endpointUrl') ? 'border-red-500' : 'border-gray-300'}`}
                  value={localSettings.lmStudio.endpointUrl}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      lmStudio: { ...localSettings.lmStudio, endpointUrl: e.target.value },
                    })
                  }
                />
                {getFieldError('lmStudio.endpointUrl') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('lmStudio.endpointUrl')}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Model Name</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="（空欄の場合はLM Studioのデフォルト）"
                  value={localSettings.lmStudio.modelName}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      lmStudio: { ...localSettings.lmStudio, modelName: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* Gemini Settings */}
          {localSettings.activeProvider === 'gemini' && (
            <div className="mb-6 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">API Key</label>
                <input
                  type="password"
                  className={`w-full border rounded px-3 py-2 text-sm ${getFieldError('gemini.apiKey') ? 'border-red-500' : 'border-gray-300'}`}
                  value={localSettings.gemini.apiKey}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      gemini: { ...localSettings.gemini, apiKey: e.target.value },
                    })
                  }
                />
                {getFieldError('gemini.apiKey') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('gemini.apiKey')}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Model Name</label>
                <input
                  type="text"
                  className={`w-full border rounded px-3 py-2 text-sm ${getFieldError('gemini.modelName') ? 'border-red-500' : 'border-gray-300'}`}
                  value={localSettings.gemini.modelName}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      gemini: { ...localSettings.gemini, modelName: e.target.value },
                    })
                  }
                />
                {getFieldError('gemini.modelName') && (
                  <p className="text-red-500 text-xs mt-1">{getFieldError('gemini.modelName')}</p>
                )}
              </div>
            </div>
          )}

          {/* Prompt Template */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">プロンプトテンプレート</label>
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() =>
                  setLocalSettings({ ...localSettings, promptTemplate: DEFAULT_PROMPT_TEMPLATE })
                }
              >
                デフォルトに戻す
              </button>
            </div>
            <textarea
              className={`w-full border rounded px-3 py-2 text-sm h-32 resize-none ${getFieldError('promptTemplate') ? 'border-red-500' : 'border-gray-300'}`}
              value={localSettings.promptTemplate}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, promptTemplate: e.target.value })
              }
            />
            {getFieldError('promptTemplate') && (
              <p className="text-red-500 text-xs mt-1">{getFieldError('promptTemplate')}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {'テンプレート内の {text} が校正対象テキストに置換されます'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleSave}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
