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
    <section className="flex flex-1 flex-col rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Capture</p>
          <label className="mt-2 block text-lg font-semibold text-stone-900">入力テキスト</label>
          <p className="mt-1 text-sm text-stone-600">音声入力または手入力で下書きを作り、すぐに校正へ進めます。</p>
        </div>
        <div className="rounded-2xl bg-stone-100 px-3 py-2 text-right text-xs text-stone-500">
          <div>音声入力: {shortcutLabel}</div>
          <div>校正: Cmd+Enter</div>
        </div>
      </div>
      <textarea
        className="min-h-[16rem] flex-1 w-full resize-none rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-800 outline-none transition focus:border-stone-400 focus:bg-white"
        placeholder="ここにテキストを入力するか、音声入力を開始してください..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {volatileText && (
        <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Live Transcript</p>
          <p className="mt-2 text-sm italic text-sky-900">{volatileText}</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <VoiceButton
          status={voiceStatus}
          onClick={onToggleVoice}
          isLoading={isLoading}
          shortcutLabel={shortcutLabel}
        />
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleCopy}
          disabled={!canCopy}
        >
          {copied ? 'コピー完了' : 'コピー'}
        </button>
        <button
          className="flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
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
    </section>
  );
}
