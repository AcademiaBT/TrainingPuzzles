import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-headline text-4xl font-semibold text-paper">
        Puzzle Training
      </h1>
      <p className="font-body text-paper/60">
        O colecție de jocuri de antrenament logic.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/jocuri/connections"
          className="rounded-full bg-accent px-6 py-3 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim"
        >
          Joacă Connections
        </Link>
        <Link
          href="/jocuri/decision-lab"
          className="rounded-full border border-ink-border px-6 py-3 font-body text-sm font-semibold text-paper transition-colors hover:border-accent"
        >
          Joacă Decision Lab
        </Link>
      </div>
    </main>
  );
}
