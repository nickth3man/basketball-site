import type React from 'react';
import GamePage from '@/app/games/[id]/page';

export default async function BoxscoreDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.JSX.Element> {
  return GamePage({ params });
}
