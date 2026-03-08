import type { CSSProperties } from 'react';
import type { VoiceSessionViewModel } from '../../shared/types';

type DragRegionStyle = CSSProperties & {
  WebkitAppRegion: 'drag' | 'no-drag';
};

interface VoiceCapturePanelProps {
  state: VoiceSessionViewModel;
  onOpenSettings: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

const PHASE_TITLE: Record<VoiceSessionViewModel['phase'], string> = {
  hidden: '待機中',
  recording: '音声入力中',
  transcribing: '音声を確定しています',
  correcting: '校正中',
  provider_not_configured: '設定が必要です',
  correction_failed: '校正に失敗しました',
  paste_fallback: 'コピーのみ完了しました',
};

const PHASE_TONE: Record<VoiceSessionViewModel['phase'], string> = {
  hidden: 'border-stone-200 bg-white/90 text-stone-900',
  recording: 'border-rose-200 bg-white/95 text-rose-950',
  transcribing: 'border-sky-200 bg-white/95 text-sky-950',
  correcting: 'border-blue-200 bg-white/95 text-blue-950',
  provider_not_configured: 'border-amber-200 bg-white/95 text-amber-950',
  correction_failed: 'border-red-200 bg-white/95 text-red-950',
  paste_fallback: 'border-amber-200 bg-white/95 text-amber-950',
};

export function VoiceCapturePanel({
  state,
  onOpenSettings,
  onRetry,
  onDismiss,
}: VoiceCapturePanelProps) {
  const dragRegionStyle: DragRegionStyle = { WebkitAppRegion: 'drag' };
  const noDragStyle: DragRegionStyle = { WebkitAppRegion: 'no-drag' };

  if (!state.visible) {
    return <div className="h-full w-full bg-transparent" />;
  }

  return (
    <div className="h-full w-full bg-transparent p-3">
      <div
        className={`w-full rounded-[1.75rem] border px-4 py-4 shadow-2xl backdrop-blur ${PHASE_TONE[state.phase]}`}
        style={dragRegionStyle}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-current opacity-90" />
            <p className="text-sm font-semibold tracking-[0.2em] uppercase">Voice</p>
          </div>
          {(state.phase === 'correction_failed' || state.phase === 'provider_not_configured') && (
            <button
              type="button"
              className="rounded-full border border-current/25 px-3 py-1 text-xs font-medium"
              style={noDragStyle}
              onClick={onDismiss}
            >
              閉じる
            </button>
          )}
        </div>
        <h1 className="mt-3 text-xl font-semibold">{PHASE_TITLE[state.phase]}</h1>
        <p className="mt-2 text-sm leading-6 opacity-90">{state.message}</p>

        {(state.liveTranscript || state.finalTranscript) && (
          <div className="mt-4 rounded-[1.25rem] bg-black/5 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-55">
              {state.liveTranscript ? 'Live Transcript' : 'Final Transcript'}
            </p>
            <p className="mt-2 text-sm leading-6">
              {state.liveTranscript || state.finalTranscript}
            </p>
          </div>
        )}

        {state.phase === 'provider_not_configured' && (
          <button
            type="button"
            className="mt-4 w-full rounded-full bg-amber-900 px-4 py-2 text-sm font-medium text-white"
            style={noDragStyle}
            onClick={onOpenSettings}
          >
            設定を開く
          </button>
        )}

        {state.phase === 'correction_failed' && (
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              className="rounded-full bg-red-900 px-4 py-2 text-sm font-medium text-white"
              style={noDragStyle}
              onClick={onRetry}
            >
              再校正
            </button>
            <p className="text-xs opacity-70">Cmd+Enter でも再試行できます</p>
          </div>
        )}
      </div>
    </div>
  );
}
