import { useState, useEffect, useCallback } from 'react';
import type { Settings, CorrectionError } from '../shared/types';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';
import { ResultPanel } from './components/ResultPanel';
import { SettingsModal } from './components/SettingsModal';

export function App() {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CorrectionError | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    window.electronAPI.getSettings().then(setSettings);
  }, []);

  const handleCorrect = useCallback(async () => {
    if (!inputText.trim()) {
      setError({ type: 'EMPTY_TEXT', message: '校正するテキストを入力してください' });
      return;
    }

    if (!settings) return;

    setIsLoading(true);
    setError(null);

    const response = await window.electronAPI.correctText({
      text: inputText,
      promptTemplate: settings.promptTemplate,
    });

    if (response.success && response.correctedText) {
      setCorrectedText(response.correctedText);
    } else if (response.error) {
      setError(response.error);
    }

    setIsLoading(false);
  }, [inputText, settings]);

  const handleSaveSettings = useCallback(async (newSettings: Settings) => {
    await window.electronAPI.saveSettings(newSettings);
    setSettings(newSettings);
    setIsSettingsOpen(false);
  }, []);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <Header
        currentProvider={settings?.activeProvider ?? null}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isLoading={isLoading}
      />

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-red-700 text-sm">{error.message}</span>
            {error.type === 'PROVIDER_NOT_CONFIGURED' && (
              <button
                className="text-red-700 underline text-sm font-medium"
                onClick={() => setIsSettingsOpen(true)}
              >
                設定を開く
              </button>
            )}
          </div>
          <button
            className="text-red-400 hover:text-red-600"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <EditorPanel
          value={inputText}
          onChange={setInputText}
          onCorrect={handleCorrect}
          onCopy={() => handleCopy(inputText)}
          isLoading={isLoading}
          canCopy={inputText.length > 0}
        />
        <ResultPanel
          value={correctedText}
          onChange={setCorrectedText}
          onCopy={() => handleCopy(correctedText)}
          canCopy={correctedText.length > 0}
        />
      </div>

      {settings && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}
