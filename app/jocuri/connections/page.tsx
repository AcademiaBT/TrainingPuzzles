import { Board } from '@/components/connections/Board';

export default function ConnectionsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10 sm:py-16">
      <header className="mb-8 text-center">
        <h1 className="font-headline text-3xl font-semibold text-paper sm:text-4xl">
          Connections
        </h1>
        <p className="mt-1 font-body text-sm text-paper/50">
          Găsește cele 4 grupuri ascunse
        </p>
      </header>
      <Board />
    </main>
  );
}
