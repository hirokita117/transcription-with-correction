import { useState } from 'react';
import type { VoiceInputStatus } from '../../shared/types';
import { VoiceButton } from './VoiceButton';

interface EditorPanelProps {
  value: string;
  onChange: (text: string) => void;
  onCorrect: () => void;
  onCopy: () => void;
  isLoading: boolean;
  canCopy: boolean;
  voiceStatus: VoiceInputStatus;
  volatileText: string;
  onToggleVoice: () => void;
  shortcutLabel: string;
}

export function EditorPanel({
  value,
  onChange,
  onCorrect,
  onCopy,
  isLoading,
  canCopy,
  voiceStatus,
  volatileText,
  onToggleVoice,
  shortcutLabel,
}: EditorPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isVoiceActive = voiceStatus === 'listening' || voiceStatus === 'starting';
  const isCorrectionDisabled = isLoading || isVoiceActive;

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200 p-4">
      <label className="text-sm font-medium text-gray-700 mb-2">入力テキスト</label>
      <textarea
        className="flex-1 w-full resize-none border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="ここにテキストを入力してください..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {volatileText && (
        <p className="text-gray-400 italic text-sm mt-1 px-1">{volatileText}</p>
      )}
      <div className="flex gap-2 mt-3">
        <VoiceButton
          status={voiceStatus}
          onClick={onToggleVoice}
          isLoading={isLoading}
          shortcutLabel={shortcutLabel}
        />
        <button
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCopy}
          disabled={!canCopy}
        >
          {copied ? 'コピー完了' : 'コピー'}
        </button>
        <button
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={() => onCorrect()}
          disabled={isCorrectionDisabled}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              校正中...
            </>
          ) : (
            '校正'
          )}
        </button>
      </div>
    </div>
  );
}
