import { useState, useEffect, useCallback } from 'react';
import type { CorrectionHistoryItem } from '../../shared/types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

export function TranscriptionHistory() {
  const [items, setItems] = useState<CorrectionHistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    const history = await window.electronAPI.getTranscriptionHistory();
    setItems(history);
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchHistory();
    }
  }, [isOpen, fetchHistory]);

  // Refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (isOpen) {
        void fetchHistory();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isOpen, fetchHistory]);

  const handleCorrect = async (id: string) => {
    await window.electronAPI.correctFromHistory(id);
  };

  const handleDelete = async (id: string) => {
    await window.electronAPI.deleteHistoryItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-medium text-gray-700 mb-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>文字起こし履歴 ({items.length > 0 ? `${items.length}件` : isOpen ? '0件' : '…'})</span>
        <span className="text-gray-400 text-xs">{isOpen ? '▲ 閉じる' : '▼ 開く'}</span>
      </button>

      {isOpen && (
        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-xs text-gray-500 py-2">履歴はまだありません。音声入力を行うと自動的に保存されます。</p>
          )}
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded border border-gray-200 bg-gray-50 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                      {item.correctedText ? (
                        <span className="text-xs text-emerald-600 font-medium">校正済み</span>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">未校正</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="text-sm text-gray-800 text-left w-full break-all"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      {isExpanded ? item.inputText : truncate(item.inputText, 80)}
                    </button>
                    {isExpanded && item.correctedText && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">校正結果:</p>
                        <p className="text-sm text-gray-700 break-all">{item.correctedText}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      className="px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
                      onClick={() => void handleCorrect(item.id)}
                    >
                      校正する
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs text-red-500 border border-red-200 rounded hover:bg-red-50"
                      onClick={() => void handleDelete(item.id)}
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
