interface QuickActionsBarProps {
  hasResult: boolean;
  onCopyResult: () => void;
  onCopyCombined: () => void;
  onCopyForEmail: () => void;
  onCopyForChat: () => void;
  onExportTxt: () => void;
  onExportMarkdown: () => void;
}

export function QuickActionsBar({
  hasResult,
  onCopyResult,
  onCopyCombined,
  onCopyForEmail,
  onCopyForChat,
  onExportTxt,
  onExportMarkdown,
}: QuickActionsBarProps) {
  const baseClass = 'rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Use The Result</p>
          <h3 className="mt-2 text-lg font-semibold text-stone-900">校正後の文章をすぐ使う</h3>
          <p className="mt-1 text-sm text-stone-600">コピー、用途別コピー、書き出しを 1 箇所に集約しています。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={`${baseClass} border-stone-900 bg-stone-900 text-white hover:bg-stone-700`} onClick={onCopyResult} disabled={!hasResult}>結果をコピー</button>
          <button className={`${baseClass} border-stone-300 bg-white text-stone-700 hover:bg-stone-50`} onClick={onCopyCombined} disabled={!hasResult}>原文と校正文をコピー</button>
          <button className={`${baseClass} border-stone-300 bg-white text-stone-700 hover:bg-stone-50`} onClick={onCopyForEmail} disabled={!hasResult}>メール向け</button>
          <button className={`${baseClass} border-stone-300 bg-white text-stone-700 hover:bg-stone-50`} onClick={onCopyForChat} disabled={!hasResult}>チャット向け</button>
          <button className={`${baseClass} border-stone-300 bg-white text-stone-700 hover:bg-stone-50`} onClick={onExportTxt} disabled={!hasResult}>TXT 書き出し</button>
          <button className={`${baseClass} border-stone-300 bg-white text-stone-700 hover:bg-stone-50`} onClick={onExportMarkdown} disabled={!hasResult}>Markdown 書き出し</button>
        </div>
      </div>
    </section>
  );
}
