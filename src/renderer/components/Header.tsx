import type { ProviderType } from '../../shared/types';

interface HeaderProps {
  currentProvider: ProviderType | null;
  onOpenSettings: () => void;
  isLoading: boolean;
}

const PROVIDER_LABELS: Record<ProviderType, string> = {
  'lm-studio': 'LM Studio',
  'gemini': 'Gemini',
};

export function Header({ currentProvider, onOpenSettings, isLoading }: HeaderProps) {
  const providerLabel = currentProvider ? PROVIDER_LABELS[currentProvider] : '未設定';

  return (
    <header className="rounded-[2rem] border border-stone-200 bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-lg font-semibold text-white">
            T
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Transcription With Correction</p>
            <h1 className="mt-1 text-2xl font-semibold text-stone-900">文字起こし校正</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-600">
            Provider: {providerLabel}
          </span>
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onOpenSettings}
            disabled={isLoading}
          >
            設定
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-500">
        <span className="rounded-full bg-stone-100 px-3 py-1">音声入力から校正までを最短化</span>
        <span className="rounded-full bg-stone-100 px-3 py-1">校正後はすぐにコピー・書き出し</span>
      </div>
    </header>
  );
}
