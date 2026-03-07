import type { VoiceInputStatus } from '../../shared/types';

interface VoiceButtonProps {
  status: VoiceInputStatus;
  onClick: () => void;
  isLoading: boolean;
  shortcutLabel: string;
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

export function VoiceButton({ status, onClick, isLoading, shortcutLabel }: VoiceButtonProps) {
  const isDisabled = isLoading || status === 'starting' || status === 'stopping';

  const getButtonStyle = () => {
    if (status === 'listening') {
      return 'border-rose-500 bg-rose-500 text-white hover:bg-rose-600 animate-pulse';
    }
    if (status === 'starting' || status === 'stopping') {
      return 'border-stone-300 text-stone-400 cursor-not-allowed';
    }
    return 'border-stone-300 text-stone-700 hover:bg-stone-50';
  };

  const getLabel = () => {
    switch (status) {
      case 'listening':
        return '停止';
      case 'starting':
        return '準備中...';
      case 'stopping':
        return '停止中...';
      default:
        return '音声入力';
    }
  };

  return (
    <button
      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${getButtonStyle()}`}
      onClick={onClick}
      disabled={isDisabled}
      title={`音声入力 (${shortcutLabel})`}
    >
      <MicIcon />
      {getLabel()}
    </button>
  );
}
