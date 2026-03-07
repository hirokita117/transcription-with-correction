import { useState } from 'react';

interface ResultPanelProps {
  inputValue: string;
  value: string;
  onChange: (text: string) => void;
  onCopy: () => void;
  canCopy: boolean;
}

export function ResultPanel({ inputValue, value, onChange, onCopy, canCopy }: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex flex-1 flex-col rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Correction</p>
          <label className="mt-2 block text-lg font-semibold text-stone-900">校正結果</label>
          <p className="mt-1 text-sm text-stone-600">必要なら編集してからコピーや書き出しに進めます。</p>
        </div>
        <button
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleCopy}
          disabled={!canCopy}
        >
          {copied ? 'コピー完了' : 'コピー'}
        </button>
      </div>
      <textarea
        className="min-h-[16rem] flex-1 w-full resize-none rounded-[1.5rem] border border-stone-200 bg-emerald-50 p-4 text-sm leading-6 text-stone-800 outline-none transition focus:border-emerald-300 focus:bg-white"
        placeholder="校正結果がここに表示されます..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">原文プレビュー</p>
          <p className="mt-2 max-h-28 overflow-auto text-sm leading-6 text-stone-700">
            {inputValue || 'まだ入力がありません。'}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">校正文プレビュー</p>
          <p className="mt-2 max-h-28 overflow-auto text-sm leading-6 text-emerald-900">
            {value || '校正が完了するとここに表示されます。'}
          </p>
        </div>
      </div>
    </section>
  );
}
