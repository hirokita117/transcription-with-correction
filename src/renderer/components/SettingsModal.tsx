import { useState, useEffect } from 'react';
import type { Settings, ProviderType, ValidationError, PermissionStatus } from '../../shared/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
  permissionStatus: PermissionStatus;
  onOpenAccessibilitySettings: () => void;
}

const DEFAULT_PROMPT_TEMPLATE = `あなたはプロフェッショナルな校正者です。
以下のテキストの誤字脱字・文法エラーを修正してください。

ルール:
- 原文の意味や文体を変えないこと
- 誤字脱字・文法エラーのみを修正すること
- 修正後のテキストのみを出力すること（説明や注釈は不要）

テキスト:
{text}`;

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  permissionStatus,
  onOpenAccessibilitySettings,
}: SettingsModalProps) {
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent p-4">
      <div className="mx-auto w-full max-w-lg rounded-[2rem] border border-white/70 bg-white/92 shadow-[0_24px_80px_rgba(62,78,71,0.18)] backdrop-blur">
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

          {/* Voice Input Settings */}
          <div className="mb-6 space-y-3">
            <label className="text-sm font-medium text-gray-700 block mb-2">音声入力</label>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">ショートカットキー</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="例: CommandOrControl+Shift+L"
                value={localSettings.voiceInput.shortcut}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    voiceInput: { ...localSettings.voiceInput, shortcut: e.target.value },
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Electron Accelerator 形式（例: Cmd+Shift+L, Ctrl+Shift+L）
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">認識言語</label>
              <select
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                value={localSettings.voiceInput.language}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings,
                    voiceInput: { ...localSettings.voiceInput, language: e.target.value },
                  })
                }
              >
                <option value="ja-JP">日本語</option>
                <option value="en-US">English (US)</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.voiceInput.autoCorrect}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      voiceInput: { ...localSettings.voiceInput, autoCorrect: e.target.checked },
                    })
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">音声入力完了後に自動校正を実行</span>
              </label>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <label className="text-sm font-medium text-gray-700 block mb-2">常駐と自動貼り付け</label>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.residentMode.enabled}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      residentMode: { ...localSettings.residentMode, enabled: e.target.checked },
                    })
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">メニューバーに常駐する</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.residentMode.showDockIcon}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      residentMode: { ...localSettings.residentMode, showDockIcon: e.target.checked },
                    })
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">Dock アイコンを表示する</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.pasteBack.enabled}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      pasteBack: { ...localSettings.pasteBack, enabled: e.target.checked },
                    })
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">校正完了後に元のアプリへ自動貼り付け</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">
                元のアプリのカーソル位置に `Cmd+V` 相当で貼り付けます
              </p>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.pasteBack.fallbackToClipboardOnly}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      pasteBack: {
                        ...localSettings.pasteBack,
                        fallbackToClipboardOnly: e.target.checked,
                      },
                    })
                  }
                  className="text-blue-600"
                />
                <span className="text-sm">権限不足時はコピーのみにフォールバック</span>
              </label>
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">アクセシビリティ権限</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {permissionStatus.accessibilityTrusted
                      ? '許可済みです。自動貼り付けを利用できます。'
                      : '未許可です。未許可時は結果をコピーのみ行います。'}
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                  onClick={onOpenAccessibilitySettings}
                >
                  アクセシビリティ設定を開く
                </button>
              </div>
            </div>
          </div>

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
