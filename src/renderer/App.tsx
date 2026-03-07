import { useState, useEffect, useCallback } from 'react';
import type {
  AnalyticsEvent,
  CorrectionError,
  CorrectionHistoryItem,
  CorrectionLifecycleStatus,
  Settings,
  UIToast,
} from '../shared/types';
import { Header } from './components/Header';
import { EditorPanel } from './components/EditorPanel';
import { ResultPanel } from './components/ResultPanel';
import { SettingsModal } from './components/SettingsModal';
import { useVoiceInput } from './hooks/useVoiceInput';
import { StatusBar } from './components/status-bar';
import { ToastRegion } from './components/toast-region';
import { EmptyStateCard } from './components/empty-state-card';
import { QuickActionsBar } from './components/quick-actions-bar';
import { CorrectionHistoryPanel } from './components/correction-history-panel';

type CorrectionTrigger = 'manual' | 'auto';

function formatShortcutLabel(shortcut: string): string {
  return shortcut
    .replace('CommandOrControl', 'Cmd/Ctrl')
    .replace('Command', 'Cmd')
    .replace('Control', 'Ctrl')
    .replace('Shift', 'Shift')
    .replace(/\+/g, '+');
}

function buildLifecycleStatus(params: {
  needsSetup: boolean;
  voiceStatus: 'idle' | 'starting' | 'listening' | 'stopping' | 'error';
  isLoading: boolean;
  error: CorrectionError | null;
  hasResult: boolean;
}): CorrectionLifecycleStatus {
  if (params.needsSetup) return 'setup-required';
  if (params.isLoading) return 'correcting';
  if (params.voiceStatus === 'listening') return 'recording';
  if (params.voiceStatus === 'starting' || params.voiceStatus === 'stopping') return 'transcribing';
  if (params.voiceStatus === 'error' || params.error) return 'failure';
  if (params.hasResult) return 'success';
  return 'idle';
}

export function App() {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CorrectionError | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [history, setHistory] = useState<CorrectionHistoryItem[]>([]);
  const [toasts, setToasts] = useState<UIToast[]>([]);

  const pushToast = useCallback((toast: Omit<UIToast, 'id'>) => {
    const id = window.crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    await window.electronAPI.trackEvent(event);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const [bootstrapData, loadedHistory] = await Promise.all([
        window.electronAPI.getBootstrapData(),
        window.electronAPI.getCorrectionHistory(),
      ]);

      setSettings(bootstrapData.settings);
      setIsFirstRun(bootstrapData.isFirstRun);
      setNeedsSetup(bootstrapData.needsSetup);
      setHistory(loadedHistory);
    };

    void bootstrap();
  }, []);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
    void trackEvent({
      name: 'settings_opened',
      timestamp: new Date().toISOString(),
      metadata: { source: needsSetup ? 'setup-card' : 'header' },
    });
  }, [needsSetup, trackEvent]);

  const saveHistoryItem = useCallback(async (item: CorrectionHistoryItem) => {
    await window.electronAPI.saveCorrectionHistoryItem(item);
    setHistory((current) => [item, ...current].slice(0, 20));
  }, []);

  const copyToClipboard = useCallback(async (
    text: string,
    message: string,
    metadata: Record<string, string | number | boolean | null>,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast({ type: 'success', message });
      await trackEvent({
        name: 'result_copied',
        timestamp: new Date().toISOString(),
        metadata,
      });
    } catch (clipboardError: unknown) {
      console.error('Failed to write text to clipboard:', clipboardError);
      pushToast({ type: 'error', message: 'クリップボードへのコピーに失敗しました。' });
    }
  }, [pushToast, trackEvent]);

  const handleCorrect = useCallback(async (textOverride?: string, trigger: CorrectionTrigger = 'manual') => {
    const text = typeof textOverride === 'string' ? textOverride : inputText;
    if (!text.trim()) {
      setError({ type: 'EMPTY_TEXT', message: '校正するテキストを入力してください。' });
      return;
    }

    if (!settings) {
      setError({ type: 'UNKNOWN_ERROR', message: '設定の読み込みに失敗しました。アプリを再起動してください。' });
      return;
    }

    setIsLoading(true);
    setError(null);

    await trackEvent({
      name: 'correction_started',
      timestamp: new Date().toISOString(),
      metadata: { trigger, provider: settings.activeProvider },
    });

    try {
      const response = await window.electronAPI.correctText({
        text,
        promptTemplate: settings.promptTemplate,
      });

      if (response.success && response.correctedText) {
        setCorrectedText(response.correctedText);
        setNeedsSetup(false);

        const historyItem: CorrectionHistoryItem = {
          id: window.crypto.randomUUID(),
          inputText: text,
          correctedText: response.correctedText,
          provider: settings.activeProvider,
          createdAt: new Date().toISOString(),
        };

        await saveHistoryItem(historyItem);
        let autoCopySucceeded = false;
        try {
          await navigator.clipboard.writeText(response.correctedText);
          autoCopySucceeded = true;
          pushToast({ type: 'success', message: '校正結果を自動でコピーしました。' });
        } catch (clipboardError: unknown) {
          console.error('Failed to auto-copy corrected text:', clipboardError);
          pushToast({ type: 'info', message: '校正は完了しましたが、自動コピーに失敗しました。' });
        }
        await trackEvent({
          name: 'correction_succeeded',
          timestamp: historyItem.createdAt,
          metadata: { trigger, provider: settings.activeProvider },
        });
        if (autoCopySucceeded) {
          await trackEvent({
            name: 'result_copied',
            timestamp: new Date().toISOString(),
            metadata: { source: 'auto-copy', provider: settings.activeProvider },
          });
        }
      } else if (response.error) {
        setError(response.error);
        setNeedsSetup(response.error.type === 'PROVIDER_NOT_CONFIGURED');
        pushToast({ type: 'error', message: response.error.message });
        await trackEvent({
          name: response.error.type === 'PROVIDER_NOT_CONFIGURED' ? 'provider_validation_failed' : 'correction_failed',
          timestamp: new Date().toISOString(),
          metadata: { trigger, provider: settings.activeProvider, errorType: response.error.type },
        });
      }
    } catch (caughtError: unknown) {
      console.error('Correction request failed:', caughtError);
      setError({ type: 'UNKNOWN_ERROR', message: '校正処理中にエラーが発生しました。しばらく待ってからもう一度お試しください。' });
      pushToast({ type: 'error', message: '校正処理に失敗しました。' });
      await trackEvent({
        name: 'correction_failed',
        timestamp: new Date().toISOString(),
        metadata: { trigger, provider: settings.activeProvider },
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputText, pushToast, saveHistoryItem, settings, trackEvent]);

  const { status: voiceStatus, volatileText, toggleVoiceInput } = useVoiceInput({
    autoCorrectEnabled: settings?.voiceInput?.autoCorrect ?? true,
    onFinalResult: useCallback((text: string) => {
      setInputText(text);
    }, []),
    onAutoCorrect: useCallback((text: string) => {
      void trackEvent({
        name: 'voice_autocorrect_started',
        timestamp: new Date().toISOString(),
        metadata: { provider: settings?.activeProvider ?? 'unknown' },
      });
      void handleCorrect(text, 'auto');
    }, [handleCorrect, settings?.activeProvider, trackEvent]),
  });

  const handleToggleVoice = useCallback(() => {
    const nextEvent = voiceStatus === 'listening' ? 'voice_stopped' : 'voice_started';
    void trackEvent({
      name: nextEvent,
      timestamp: new Date().toISOString(),
      metadata: { autoCorrectEnabled: settings?.voiceInput.autoCorrect ?? true },
    });
    toggleVoiceInput();
  }, [settings?.voiceInput.autoCorrect, toggleVoiceInput, trackEvent, voiceStatus]);

  const handleSaveSettings = useCallback(async (newSettings: Settings) => {
    await window.electronAPI.saveSettings(newSettings);
    setSettings(newSettings);
    setIsSettingsOpen(false);
    setIsFirstRun(false);
    setNeedsSetup(false);
    pushToast({ type: 'success', message: '設定を保存しました。' });
  }, [pushToast]);

  const handleCopyInput = useCallback(async () => {
    await copyToClipboard(inputText, '入力テキストをコピーしました。', { source: 'input', hasResult: Boolean(correctedText) });
  }, [copyToClipboard, correctedText, inputText]);

  const handleCopyResult = useCallback(async () => {
    await copyToClipboard(correctedText, '校正結果をコピーしました。', { source: 'result', hasInput: Boolean(inputText) });
  }, [copyToClipboard, correctedText, inputText]);

  const handleCopyCombined = useCallback(async () => {
    const combined = `原文:\n${inputText}\n\n校正文:\n${correctedText}`;
    await copyToClipboard(combined, '原文と校正文をまとめてコピーしました。', { source: 'combined' });
  }, [copyToClipboard, correctedText, inputText]);

  const handleCopyForEmail = useCallback(async () => {
    const emailText = `件名案:\n\n本文:\n${correctedText}`;
    await copyToClipboard(emailText, 'メール向けフォーマットでコピーしました。', { source: 'email-template' });
  }, [copyToClipboard, correctedText]);

  const handleCopyForChat = useCallback(async () => {
    const chatText = `共有します。\n\n${correctedText}`;
    await copyToClipboard(chatText, 'チャット向けフォーマットでコピーしました。', { source: 'chat-template' });
  }, [copyToClipboard, correctedText]);

  const handleExport = useCallback(async (format: 'txt' | 'md') => {
    const response = await window.electronAPI.exportCorrectionResult({
      inputText,
      correctedText,
      format,
    });

    if (response.success) {
      pushToast({ type: 'success', message: `${format.toUpperCase()} で書き出しました。` });
      await trackEvent({
        name: 'result_exported',
        timestamp: new Date().toISOString(),
        metadata: { format, path: response.path ?? null },
      });
      return;
    }

    pushToast({ type: 'info', message: response.error ?? '書き出しをキャンセルしました。' });
  }, [correctedText, inputText, pushToast, trackEvent]);

  useEffect(() => {
    const handleGlobalCorrectShortcut = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (!event.metaKey || event.key !== 'Enter') return;
      if (isLoading) return;
      if (voiceStatus === 'listening' || voiceStatus === 'starting') return;
      if (isSettingsOpen) return;

      event.preventDefault();
      void handleCorrect(undefined, 'manual');
    };

    window.addEventListener('keydown', handleGlobalCorrectShortcut);
    return () => {
      window.removeEventListener('keydown', handleGlobalCorrectShortcut);
    };
  }, [handleCorrect, isLoading, isSettingsOpen, voiceStatus]);

  const shortcutLabel = formatShortcutLabel(settings?.voiceInput?.shortcut ?? 'CommandOrControl+Shift+L');
  const lifecycleStatus = buildLifecycleStatus({
    needsSetup,
    voiceStatus,
    isLoading,
    error,
    hasResult: correctedText.trim().length > 0,
  });

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(233,229,219,0.72)_35%,_rgba(232,239,234,0.75)_100%)] text-stone-900">
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-5 px-4 py-5 lg:px-6 lg:py-6">
        <Header
          currentProvider={settings?.activeProvider ?? null}
          onOpenSettings={handleOpenSettings}
          isLoading={isLoading}
        />

        <StatusBar
          lifecycleStatus={lifecycleStatus}
          voiceStatus={voiceStatus}
          shortcutLabel={shortcutLabel}
          correctionShortcutLabel="Cmd+Enter"
          hasResult={correctedText.length > 0}
          autoCorrectEnabled={settings?.voiceInput.autoCorrect ?? true}
        />

        {error && (
          <div className="flex flex-col gap-3 rounded-[2rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-semibold">原因</p>
              <p className="mt-1">{error.message}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {error.type === 'PROVIDER_NOT_CONFIGURED' ? (
                <button
                  className="rounded-full bg-red-900 px-4 py-2 font-medium text-white transition hover:bg-red-700"
                  onClick={handleOpenSettings}
                >
                  設定を開く
                </button>
              ) : (
                <button
                  className="rounded-full bg-red-900 px-4 py-2 font-medium text-white transition hover:bg-red-700"
                  onClick={() => void handleCorrect(undefined, 'manual')}
                >
                  再試行
                </button>
              )}
              <button
                className="rounded-full border border-red-300 px-4 py-2 font-medium text-red-700 transition hover:bg-red-100"
                onClick={() => setError(null)}
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {(isFirstRun || needsSetup) && (
          <EmptyStateCard
            title={needsSetup ? 'LLM プロバイダー設定を完了してください' : '最初の校正フローを 1 分で始めましょう'}
            description={needsSetup
              ? '現在の設定では校正を実行できません。プロバイダー情報を入力すると、音声入力から校正までをそのまま試せます。'
              : '初回導線として、設定確認、音声入力、校正、コピーの順で進められるようにしています。'}
            primaryActionLabel="設定を開く"
            onPrimaryAction={handleOpenSettings}
            secondaryActionLabel="手入力で始める"
            onSecondaryAction={() => {
              setNeedsSetup(false);
              setIsFirstRun(false);
            }}
            checklist={[
              '1. 利用する LLM プロバイダーを選ぶ',
              '2. 音声入力ショートカットを確認する',
              '3. テキストを入力または話して校正する',
            ]}
          />
        )}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <EditorPanel
            value={inputText}
            onChange={setInputText}
            onCorrect={() => void handleCorrect(undefined, 'manual')}
            onCopy={() => void handleCopyInput()}
            isLoading={isLoading}
            canCopy={inputText.length > 0}
            voiceStatus={voiceStatus}
            volatileText={volatileText}
            onToggleVoice={handleToggleVoice}
            shortcutLabel={shortcutLabel}
          />
          <ResultPanel
            inputValue={inputText}
            value={correctedText}
            onChange={setCorrectedText}
            onCopy={() => void handleCopyResult()}
            canCopy={correctedText.length > 0}
          />
        </div>

        <QuickActionsBar
          hasResult={correctedText.length > 0}
          onCopyResult={() => void handleCopyResult()}
          onCopyCombined={() => void handleCopyCombined()}
          onCopyForEmail={() => void handleCopyForEmail()}
          onCopyForChat={() => void handleCopyForChat()}
          onExportTxt={() => void handleExport('txt')}
          onExportMarkdown={() => void handleExport('md')}
        />

        <CorrectionHistoryPanel
          history={history}
          onRestore={(item) => {
            setInputText(item.inputText);
            setCorrectedText(item.correctedText);
            setError(null);
            pushToast({ type: 'info', message: '履歴から内容を復元しました。' });
          }}
          onCopy={(item) => {
            void copyToClipboard(item.correctedText, '履歴から校正結果をコピーしました。', { source: 'history' });
          }}
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
