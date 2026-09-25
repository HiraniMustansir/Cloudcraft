'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Bookmark,
  Boxes,
  Building2,
  Compass,
  Database,
  GitFork,
  Layers3,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react';
import { AppHeader } from '@/app/components/app-header';
import { ArchitectureCard } from '@/app/components/architecture-card';
import { useAuth } from '@/app/providers';
import {
  listArchitectures,
  listFollowingProfiles,
} from '@/lib/cloudcraft-data';
import type { Architecture, FollowedProfile } from '@/lib/cloudcraft-types';
import { Button } from '@/components/ui/button';
import { analyzeArchitecture } from '@/lib/architecture-analysis';

const providers = [
  'All providers',
  'AWS',
  'Azure',
  'GCP',
  'Multi-cloud',
] as const;
const patterns = [
  {
    label: 'Secure web applications',
    query: 'security',
    icon: ShieldCheck,
    tone: 'green',
  },
  {
    label: 'Event-driven systems',
    query: 'event-driven',
    icon: Workflow,
    tone: 'purple',
  },
  { label: 'Data & analytics', query: 'data', icon: Database, tone: 'blue' },
  {
    label: 'Platform foundations',
    query: 'platform',
    icon: Building2,
    tone: 'amber',
  },
];

export function FeedPage({
  mode,
}: {
  mode: 'explore' | 'following' | 'saved';
}) {
  const params = useSearchParams();
  const query = params.get('q') ?? '';
  const { user, loading: authLoading, openAuth } = useAuth();
  const [items, setItems] = useState<Architecture[]>([]);
  const [followingProfiles, setFollowingProfiles] = useState<FollowedProfile[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [provider, setProvider] =
    useState<(typeof providers)[number]>('All providers');
  const [sort, setSort] = useState<
    'Recommended' | 'Newest' | 'Most discussed' | 'Health score'
  >('Recommended');

  /* oxlint-disable react/react-compiler -- Route data is synchronized after auth resolves. */
  useEffect(() => {
    if (authLoading) return;
    if ((mode === 'following' || mode === 'saved') && !user) {
      setItems([]);
      setFollowingProfiles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void Promise.all([
      listArchitectures({
        query,
        followingFor: mode === 'following' ? user?.id : undefined,
        savedFor: mode === 'saved' ? user?.id : undefined,
        viewerId: user?.id,
      }),
      mode === 'following' && user
        ? listFollowingProfiles(user.id)
        : Promise.resolve([]),
    ]).then(([result, profiles]) => {
      setItems(result.items);
      setFollowingProfiles(profiles);
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
  const visibleItems = useMemo(() => {
    const filtered =
      provider === 'All providers'
        ? [...items]
        : items.filter((item) => item.provider === provider);
    return filtered.sort((a, b) => {
      if (sort === 'Newest')
        return (
          +new Date(b.published_at ?? b.updated_at) -
          +new Date(a.published_at ?? a.updated_at)
        );
      if (sort === 'Most discussed')
        return (b.comment_count ?? 0) - (a.comment_count ?? 0);
      if (sort === 'Health score')
        return (
          analyzeArchitecture(b.diagram, b.provider).score -
          analyzeArchitecture(a.diagram, a.provider).score
        );
      return (
        (b.like_count ?? 0) +
        (b.comment_count ?? 0) * 3 -
        ((a.like_count ?? 0) + (a.comment_count ?? 0) * 3)
      );
    });
  }, [items, provider, sort]);

  const averageScore = items.length
    ? Math.round(
        items.reduce(
          (total, item) =>
            total + analyzeArchitecture(item.diagram, item.provider).score,
          0,
        ) / items.length,
      )
    : 0;

  return (
    <main className="cc-app">
      <AppHeader />
      <section className="cc-feed-shell">
        <div
          className={`cc-feed-heading ${mode === 'explore' ? 'cc-explore-heading' : ''}`}
        >
          <span className="cc-heading-icon">
            <Icon />
          </span>
          <div>
            <span className="cc-eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.description}</p>
          </div>
          {mode === 'explore' && (
            <Link className="cc-heading-action" href="/publish">
              Start an architecture <ArrowRight />
            </Link>
          )}
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
        {mode === 'explore' && !query && (
          <>
            <div className="cc-workbench-summary">
              <article>
                <span>
                  <Boxes />
                </span>
                <div>
                  <strong>{items.length}</strong>
                  <small>published designs</small>
                </div>
              </article>
              <article>
                <span>
                  <ShieldCheck />
                </span>
                <div>
                  <strong>{averageScore || '—'}</strong>
                  <small>average health score</small>
                </div>
              </article>
              <article>
                <span>
                  <GitFork />
                </span>
                <div>
                  <strong>
                    {items.filter((item) => item.forked_from).length}
                  </strong>
                  <small>community remixes</small>
                </div>
              </article>
              <article className="cc-summary-note">
                <Sparkles />
                <p>
                  <strong>Architecture intelligence</strong> checks every design
                  across six well-architected pillars.
                </p>
              </article>
            </div>
            <section
              className="cc-pattern-section"
              aria-labelledby="pattern-heading"
            >
              <div className="cc-section-title">
                <div>
                  <span>REFERENCE PATTERNS</span>
                  <h2 id="pattern-heading">
                    Start from a proven workload shape
                  </h2>
                </div>
                <small>
                  Curated entry points for common architecture decisions
                </small>
              </div>
              <div className="cc-pattern-grid">
                {patterns.map((pattern) => {
                  const PatternIcon = pattern.icon;
                  return (
                    <Link
                      href={`/?q=${encodeURIComponent(pattern.query)}`}
                      key={pattern.label}
                      className={`cc-pattern-card ${pattern.tone}`}
                    >
                      <span>
                        <PatternIcon />
                      </span>
                      <strong>{pattern.label}</strong>
                      <small>Explore designs</small>
                      <ArrowRight />
                    </Link>
                  );
                })}
              </div>
            </section>
          </>
        )}
        {mode === 'explore' && (
          <div className="cc-library-toolbar">
            <div>
              <span>ARCHITECTURE LIBRARY</span>
              <strong>
                {query ? `Matches for “${query}”` : 'Community designs'}
              </strong>
            </div>
            <div
              className="cc-provider-filters"
              aria-label="Filter by provider"
            >
              {providers.map((item) => (
                <button
                  key={item}
                  className={provider === item ? 'active' : ''}
                  onClick={() => setProvider(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="cc-sort-control">
              <span>Sort</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
              >
                <option>Recommended</option>
                <option>Newest</option>
                <option>Most discussed</option>
                <option>Health score</option>
              </select>
            </label>
          </div>
        )}
        <div
          className={mode === 'following' ? 'cc-following-layout' : undefined}
        >
          {mode === 'following' && (
            <aside className="cc-following-sidebar">
              <div className="cc-following-sidebar-title">
                <span>
                  <Users />
                </span>
                <div>
                  <strong>People you follow</strong>
                  <small>
                    {user ? followingProfiles.length : 0} in your network
                  </small>
                </div>
              </div>
              {authLoading || (user && loading) ? (
                <div className="cc-following-people-loading">
                  <i />
                  <i />
                  <i />
                </div>
              ) : !user ? (
                <div className="cc-following-people-empty">
                  <Users />
                  <span>Sign in to see the people you follow.</span>
                  <Button size="sm" onClick={openAuth}>
                    Sign in
                  </Button>
                </div>
              ) : followingProfiles.length ? (
                <div className="cc-following-people">
                  {followingProfiles.map((profile) => {
                    const initials = profile.display_name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('');
                    return (
                      <Link
                        key={profile.id}
                        href={`/profiles/${profile.username}`}
                      >
                        <span className="cc-avatar small">{initials}</span>
                        <span>
                          <strong>{profile.display_name}</strong>
                          <small>{profile.title}</small>
                          <em>
                            <Layers3 /> {profile.published_architecture_count}{' '}
                            published
                          </em>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="cc-following-people-empty">
                  <Users />
                  <span>People you follow will appear here.</span>
                </div>
              )}
            </aside>
          )}
          <div className="cc-following-feed">
            {loading ? (
              <div className="cc-card-grid" aria-label="Loading architectures">
                {[0, 1, 2].map((item) => (
                  <div className="cc-card-skeleton" key={item} />
                ))}
              </div>
            ) : visibleItems.length ? (
              <div className="cc-card-grid">
                {visibleItems.map((item) => (
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
          </div>
        </div>
      </section>
    </main>
  );
}
