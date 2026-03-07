import type { CorrectionLifecycleStatus, VoiceInputStatus } from '../../shared/types';

interface StatusBarProps {
  lifecycleStatus: CorrectionLifecycleStatus;
  voiceStatus: VoiceInputStatus;
  shortcutLabel: string;
  correctionShortcutLabel: string;
  hasResult: boolean;
  autoCorrectEnabled: boolean;
}

const STATUS_COPY: Record<CorrectionLifecycleStatus, { title: string; description: string; tone: string }> = {
  idle: {
    title: '入力待機中',
    description: 'テキスト入力または音声入力を開始できます。',
    tone: 'border-stone-200 bg-white/80 text-stone-700',
  },
  'setup-required': {
    title: '初期設定が必要です',
    description: 'プロバイダー設定を完了するとすぐに校正を開始できます。',
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  recording: {
    title: '音声入力中',
    description: '話し終わったらもう一度押して停止します。',
    tone: 'border-rose-300 bg-rose-50 text-rose-900',
  },
  transcribing: {
    title: '音声を確定しています',
    description: '認識結果を整えています。もう少し待つと次の操作に進みます。',
    tone: 'border-sky-200 bg-sky-50 text-sky-900',
  },
  correcting: {
    title: '校正中',
    description: 'テキストを校正しています。完了後は結果をすぐコピーできます。',
    tone: 'border-blue-200 bg-blue-50 text-blue-900',
  },
  success: {
    title: '校正完了',
    description: '結果をコピー、書き出し、履歴へ保存できます。',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  failure: {
    title: '処理に失敗しました',
    description: '設定確認または再試行を行ってください。',
    tone: 'border-red-200 bg-red-50 text-red-900',
  },
};

export function StatusBar({
  lifecycleStatus,
  voiceStatus,
  shortcutLabel,
  correctionShortcutLabel,
  hasResult,
  autoCorrectEnabled,
}: StatusBarProps) {
  const copy = STATUS_COPY[lifecycleStatus];
  const voiceText = voiceStatus === 'listening'
    ? '録音中'
    : voiceStatus === 'starting'
      ? '準備中'
      : voiceStatus === 'stopping'
        ? '停止処理中'
        : voiceStatus === 'error'
          ? '音声入力エラー'
          : '待機中';

  return (
    <section className={`rounded-3xl border px-5 py-4 shadow-sm backdrop-blur ${copy.tone}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-70">Workflow Status</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-current opacity-80" />
            <h2 className="text-lg font-semibold">{copy.title}</h2>
          </div>
          <p className="mt-1 text-sm opacity-90">{copy.description}</p>
        </div>
        <div className="grid gap-2 text-sm lg:min-w-[22rem]">
          <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-stone-700">
            <span>音声入力</span>
            <span className="font-medium">{voiceText} · {shortcutLabel}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-stone-700">
            <span>校正実行</span>
            <span className="font-medium">{correctionShortcutLabel}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-stone-700">
            <span>結果の状態</span>
            <span className="font-medium">
              {hasResult ? '利用可能' : '未生成'} · 自動校正 {autoCorrectEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
