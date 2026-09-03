export function MistakeDots({
  mistakes,
  max,
}: {
  mistakes: number;
  max: number;
}) {
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={`${mistakes} din ${max} greșeli`}
    >
      <span className="font-body text-xs text-paper/60">Greșeli</span>
      <div className="flex gap-1.5">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={[
              'h-2.5 w-2.5 rounded-full transition-colors',
              i < mistakes ? 'bg-tier-purple' : 'bg-ink-border',
            ].join(' ')}
          />
        ))}
      </div>
    </div>
  );
}
