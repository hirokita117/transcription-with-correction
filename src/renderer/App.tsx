import { useCallback, useEffect, useState } from 'react';
import type { PermissionStatus, Settings } from '../shared/types';
import { SettingsModal } from './components/SettingsModal';

export function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({ accessibilityTrusted: false });
  const [isFirstRun, setIsFirstRun] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [savedNotice, setSavedNotice] = useState('');

  const refreshPermissionStatus = useCallback(async () => {
    const latest = await window.electronAPI.getPermissionStatus();
    setPermissionStatus(latest);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const [windowData, latestPermissionStatus] = await Promise.all([
        window.electronAPI.getSettingsWindowData(),
        window.electronAPI.getPermissionStatus(),
      ]);

      setSettings(windowData.settings);
      setIsFirstRun(windowData.isFirstRun);
      setNeedsSetup(windowData.needsSetup);
      setPermissionStatus(latestPermissionStatus);
    };

    const unsubscribe = window.electronAPI.onSettingsRequired(() => {
      setNeedsSetup(true);
      void window.electronAPI.openSettingsWindow();
    });

    void bootstrap();

    return unsubscribe;
  }, []);

  const handleSave = useCallback(async (nextSettings: Settings) => {
    await window.electronAPI.saveSettings(nextSettings);
    setSettings(nextSettings);
    setNeedsSetup(false);
    setIsFirstRun(false);
    setSavedNotice('設定を保存しました。');
    await refreshPermissionStatus();
    window.setTimeout(() => {
      setSavedNotice('');
    }, 1800);
  }, [refreshPermissionStatus]);

  const handleOpenAccessibilitySettings = useCallback(async () => {
    await window.electronAPI.openAccessibilitySettings();
    await refreshPermissionStatus();
  }, [refreshPermissionStatus]);

  const handleClose = useCallback(() => {
    void window.electronAPI.closeSettingsWindow();
  }, []);

  if (!settings) {
    return <div className="min-h-screen bg-stone-950 text-stone-100" />;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,240,231,0.95),_rgba(221,232,227,0.92)_55%,_rgba(202,216,212,0.88)_100%)] px-4 py-5 text-stone-900">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-[0_24px_80px_rgba(62,78,71,0.18)] backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Tray Mode</p>
            <h1 className="mt-2 text-2xl font-semibold">文字起こし校正の設定</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              トレイ常駐で動作します。ショートカットで音声入力 UI を開き、完了後に自動校正して元のアプリへ戻します。
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-stone-300 px-3 py-1.5 text-sm text-stone-600 transition hover:bg-stone-100"
            onClick={handleClose}
          >
            閉じる
          </button>
        </div>

        {(isFirstRun || needsSetup) && (
          <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {needsSetup
              ? '現在の設定では校正を実行できません。LLM プロバイダー設定を完了してください。'
              : '初回起動です。まずは LLM プロバイダーとショートカットを確認してください。'}
          </div>
        )}

        {savedNotice && (
          <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {savedNotice}
          </div>
        )}
      </div>

      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        settings={settings}
        onSave={handleSave}
        permissionStatus={permissionStatus}
        onOpenAccessibilitySettings={handleOpenAccessibilitySettings}
      />
    </div>
  );
}
