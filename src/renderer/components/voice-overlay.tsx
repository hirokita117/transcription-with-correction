import { useEffect, useState } from 'react';
import type { OverlayState } from '../../shared/types';

const PHASE_TITLE: Record<OverlayState['phase'], string> = {
  recording: '音声入力中',
  transcribing: '音声を確定しています',
  correcting: '校正中',
  success: '貼り付けました',
  fallback: 'コピーしました',
  error: '処理に失敗しました',
};

const PHASE_TONE: Record<OverlayState['phase'], string> = {
  recording: 'border-rose-200 bg-white/95 text-rose-950',
  transcribing: 'border-sky-200 bg-white/95 text-sky-950',
  correcting: 'border-blue-200 bg-white/95 text-blue-950',
  success: 'border-emerald-200 bg-white/95 text-emerald-950',
  fallback: 'border-amber-200 bg-white/95 text-amber-950',
  error: 'border-red-200 bg-white/95 text-red-950',
};

const DEFAULT_STATE: OverlayState = {
  visible: false,
  phase: 'recording',
  message: '話し終わったらもう一度ショートカットを押してください',
};

export function VoiceOverlay() {
  const [state, setState] = useState<OverlayState>(DEFAULT_STATE);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onOverlayStateChange((nextState) => {
      setState(nextState);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (state.visible) return undefined;

    const timer = window.setTimeout(() => {
      void window.electronAPI.dismissOverlay();
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [state.visible]);

  if (!state.visible) {
    return <div className="h-full w-full bg-transparent" />;
  }

  return (
    <div className="h-full w-full bg-transparent p-3">
      <div className={`w-full rounded-[1.75rem] border px-4 py-4 shadow-2xl backdrop-blur ${PHASE_TONE[state.phase]}`}>
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-current opacity-90" />
          <p className="text-sm font-semibold tracking-[0.2em] uppercase">Voice</p>
        </div>
        <h1 className="mt-3 text-xl font-semibold">{PHASE_TITLE[state.phase]}</h1>
        <p className="mt-2 text-sm leading-6 opacity-90">{state.message}</p>
        <p className="mt-3 text-xs opacity-70">ショートカットをもう一度押すと停止します</p>
      </div>
    </div>
  );
}
