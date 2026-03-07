import type { CorrectionHistoryItem } from '../../shared/types';

interface CorrectionHistoryPanelProps {
  history: CorrectionHistoryItem[];
  onRestore: (item: CorrectionHistoryItem) => void;
  onCopy: (item: CorrectionHistoryItem) => void;
}

export function CorrectionHistoryPanel({ history, onRestore, onCopy }: CorrectionHistoryPanelProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">History</p>
          <h3 className="mt-2 text-lg font-semibold text-stone-900">最近の校正結果</h3>
          <p className="mt-1 text-sm text-stone-600">直近 20 件を保存し、再利用や再編集に戻れます。</p>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{history.length} items</span>
      </div>
      {history.length === 0 ? (
        <div className="mt-5 rounded-3xl bg-stone-50 px-4 py-6 text-sm text-stone-500">
          まだ履歴がありません。校正が成功するとここに保存されます。
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {history.map((item) => (
            <article key={item.id} className="rounded-3xl border border-stone-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">{new Date(item.createdAt).toLocaleString('ja-JP')}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{item.provider}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:bg-stone-50"
                    onClick={() => onCopy(item)}
                  >
                    再コピー
                  </button>
                  <button
                    className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-stone-700"
                    onClick={() => onRestore(item)}
                  >
                    復元
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="rounded-2xl bg-stone-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">原文</p>
                  <p className="mt-2 max-h-24 overflow-hidden text-sm leading-6 text-stone-700">{item.inputText}</p>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">校正文</p>
                  <p className="mt-2 max-h-24 overflow-hidden text-sm leading-6 text-emerald-900">{item.correctedText}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
