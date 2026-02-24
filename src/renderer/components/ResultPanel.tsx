import { useState } from 'react';

interface ResultPanelProps {
  value: string;
  onChange: (text: string) => void;
  onCopy: () => void;
  canCopy: boolean;
}

export function ResultPanel({ value, onChange, onCopy, canCopy }: ResultPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      <label className="text-sm font-medium text-gray-700 mb-2">校正結果</label>
      <textarea
        className="flex-1 w-full resize-none border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="校正結果がここに表示されます..."
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
      </div>
    </div>
  );
}
