import { useState } from 'react';

interface EditorPanelProps {
  value: string;
  onChange: (text: string) => void;
  onCorrect: () => void;
  onCopy: () => void;
  isLoading: boolean;
  canCopy: boolean;
}

export function EditorPanel({ value, onChange, onCorrect, onCopy, isLoading, canCopy }: EditorPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col border-r border-gray-200 p-4">
      <label className="text-sm font-medium text-gray-700 mb-2">入力テキスト</label>
      <textarea
        className="flex-1 w-full resize-none border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="ここにテキストを入力してください..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex gap-2 mt-3">
        <button
          className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCopy}
          disabled={!canCopy}
        >
          {copied ? 'コピー完了' : 'コピー'}
        </button>
        <button
          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={onCorrect}
          disabled={isLoading}
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
