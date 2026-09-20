'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bookmark, Compass, Radio, Search } from 'lucide-react';
import { AppHeader } from '@/app/components/app-header';
import { ArchitectureCard } from '@/app/components/architecture-card';
import { useAuth } from '@/app/providers';
import { listArchitectures } from '@/lib/cloudcraft-data';
import type { Architecture } from '@/lib/cloudcraft-types';
import { Button } from '@/components/ui/button';

export function FeedPage({
  mode,
}: {
  mode: 'explore' | 'following' | 'saved';
}) {
  const params = useSearchParams();
  const query = params.get('q') ?? '';
  const { user, loading: authLoading, openAuth } = useAuth();
  const [items, setItems] = useState<Architecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  /* oxlint-disable react/react-compiler -- Route data is synchronized after auth resolves. */
  useEffect(() => {
    if (authLoading) return;
    if ((mode === 'following' || mode === 'saved') && !user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void listArchitectures({
      query,
      followingFor: mode === 'following' ? user?.id : undefined,
      savedFor: mode === 'saved' ? user?.id : undefined,
      viewerId: user?.id,
    }).then((result) => {
      setItems(result.items);
      setNeedsSetup(result.needsSetup);
      setLoading(false);
    });
  }, [authLoading, mode, query, user]);
  /* oxlint-enable react/react-compiler */

  const copy = {
    explore: {
      eyebrow: 'COMMUNITY ARCHITECTURES',
      title: query ? `Results for “${query}”` : 'Explore cloud architecture',
      description:
        'Study real implementation decisions, remix working diagrams, and share improvements with their authors.',
      icon: Compass,
    },
    following: {
      eyebrow: 'YOUR NETWORK',
      title: 'Architectures from people you follow',
      description:
        'New posts and updated designs from cloud professionals in your network.',
      icon: Radio,
    },
    saved: {
      eyebrow: 'YOUR LIBRARY',
      title: 'Saved architectures',
      description:
        'A private collection of designs you want to revisit or use as references.',
      icon: Bookmark,
    },
  }[mode];
  const Icon = copy.icon;

  return (
    <main className="cc-app">
      <AppHeader />
      <section className="cc-feed-shell">
        <div className="cc-feed-heading">
          <span className="cc-heading-icon">
            <Icon />
          </span>
          <div>
            <span className="cc-eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
          </div>
        </div>
        {needsSetup && (
          <div className="cc-setup-banner">
            <strong>Connect the application database</strong>
            <span>
              Run <code>supabase/migrations/001_cloudcraft.sql</code> in the
              Supabase SQL Editor. Demo architectures are shown until then.
            </span>
          </div>
        )}
        {loading ? (
          <div className="cc-card-grid" aria-label="Loading architectures">
            {[0, 1, 2].map((item) => (
              <div className="cc-card-skeleton" key={item} />
            ))}
          </div>
        ) : items.length ? (
          <div className="cc-card-grid">
            {items.map((item) => (
              <ArchitectureCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <div className="cc-empty-state">
            <Search />
            <strong>
              {mode === 'following'
                ? 'Your following feed is empty'
                : mode === 'saved'
                  ? 'Nothing saved yet'
                  : 'No architectures found'}
            </strong>
            <p>
              {!user && mode !== 'explore'
                ? 'Sign in to build your personal architecture feed.'
                : mode === 'following'
                  ? 'Follow architects from their profile pages to see their work here.'
                  : mode === 'saved'
                    ? 'Use the bookmark button on an architecture to add it here.'
                    : 'Try another service, provider, or architecture pattern.'}
            </p>
            {!user && mode !== 'explore' && (
              <Button onClick={openAuth}>Sign in</Button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
