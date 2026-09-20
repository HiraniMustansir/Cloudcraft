import { Suspense } from 'react';
import { FeedPage } from '@/app/components/feed-page';

export default function FollowingPage() {
  return (
    <Suspense>
      <FeedPage mode="following" />
    </Suspense>
  );
}
