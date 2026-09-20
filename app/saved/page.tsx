import { Suspense } from 'react';
import { FeedPage } from '@/app/components/feed-page';

export default function SavedPage() {
  return (
    <Suspense>
      <FeedPage mode="saved" />
    </Suspense>
  );
}
