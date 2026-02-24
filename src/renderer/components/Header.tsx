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
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-800">文字起こし校正</h1>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
          {providerLabel}
        </span>
      </div>
      <button
        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={onOpenSettings}
        disabled={isLoading}
      >
        設定
      </button>
    </header>
  );
}
