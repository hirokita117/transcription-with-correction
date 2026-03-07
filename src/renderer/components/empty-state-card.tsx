interface EmptyStateCardProps {
  title: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  checklist?: string[];
}

export function EmptyStateCard({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  checklist = [],
}: EmptyStateCardProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">First Run</p>
      <h2 className="mt-3 text-2xl font-semibold text-stone-900">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">{description}</p>
      {checklist.length > 0 && (
        <ul className="mt-5 grid gap-2 text-sm text-stone-700">
          {checklist.map((item) => (
            <li key={item} className="rounded-2xl bg-stone-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          onClick={onPrimaryAction}
        >
          {primaryActionLabel}
        </button>
        {secondaryActionLabel && onSecondaryAction && (
          <button
            className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </section>
  );
}
