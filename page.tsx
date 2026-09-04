import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-headline text-4xl font-semibold text-paper">
        Puzzle Training
      </h1>
      <p className="font-body text-paper/60">
        O colecție de jocuri de antrenament logic. Primul joc disponibil:
      </p>
      <Link
        href="/jocuri/connections"
        className="rounded-full bg-accent px-6 py-3 font-body text-sm font-semibold text-ink transition-colors hover:bg-accent-dim"
      >
        Joacă Connections
      </Link>
    </main>
  );
}
