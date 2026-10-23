import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ResultsView from '@/components/ResultsView';
import { ScoredBikeResult, UserPreferences } from '@/lib/matching-engine/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Ranked Matches | Bike for U',
  robots: {
    index: false,
    follow: false,
  },
};

interface ResultsPageProps {
  params: {
    id: string;
  };
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = params;

  const snapshot = await prisma.recommendationSnapshot.findUnique({
    where: { id },
  });

  if (!snapshot) {
    notFound();
  }

  const results = snapshot.results as unknown as ScoredBikeResult[];
  const inputs = snapshot.inputs as unknown as UserPreferences;

  return (
    <ResultsView
      snapshotId={snapshot.id}
      results={results}
      inputs={inputs}
      isRelaxed={snapshot.relaxed}
      relaxationMessage={snapshot.relaxationMessage || undefined}
      createdAt={snapshot.createdAt.toISOString()}
      datasetVersion={snapshot.datasetVersion}
    />
  );
}
