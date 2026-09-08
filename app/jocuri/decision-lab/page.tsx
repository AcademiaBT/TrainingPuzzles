import { DecisionLabBoard } from '@/components/decision-lab/Board';

export default function DecisionLabPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-10 sm:py-16">
      <header className="mb-8 text-center">
        <h1 className="font-headline text-3xl font-semibold text-paper sm:text-4xl">
          Decision Lab
        </h1>
        <p className="mt-1 font-body text-sm text-paper/50">
          Simulări de gândire critică în situații reale
        </p>
      </header>
      <DecisionLabBoard />
    </main>
  );
}
