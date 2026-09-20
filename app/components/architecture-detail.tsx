'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Cloud,
  GitFork,
  GitPullRequest,
  Heart,
  MessageCircle,
  Pencil,
  Send,
  Share2,
} from 'lucide-react';
import { AppHeader } from '@/app/components/app-header';
import { DiagramPreview } from '@/app/components/diagram-preview';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  addComment,
  forkArchitecture,
  getArchitecture,
  getFollowState,
  listArchitectureForks,
  listComments,
  listPullRequests,
  listVersions,
  reviewPullRequest,
  toggleFollow,
  toggleRelation,
} from '@/lib/cloudcraft-data';
import type {
  Architecture,
  ArchitectureComment,
  ArchitectureFork,
  ArchitectureVersion,
  PullRequest,
} from '@/lib/cloudcraft-types';

export function ArchitectureDetail({ id }: { id: string }) {
  const router = useRouter();
  const { user, openAuth } = useAuth();
  const [item, setItem] = useState<Architecture | null>(null);
  const [comments, setComments] = useState<ArchitectureComment[]>([]);
  const [versions, setVersions] = useState<ArchitectureVersion[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [forks, setForks] = useState<ArchitectureFork[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [following, setFollowing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const result = await getArchitecture(id, user?.id);
    setItem(result.item);
    setLiked(Boolean(result.item?.liked));
    setBookmarked(Boolean(result.item?.bookmarked));
    if (result.item) {
      const [nextComments, nextVersions, nextForks, nextPullRequests] =
        await Promise.all([
          listComments(result.item.id),
          listVersions(result.item.id),
          result.item.id.startsWith('demo-')
            ? Promise.resolve([])
            : listArchitectureForks(result.item.id),
          user && !result.item.id.startsWith('demo-')
            ? listPullRequests(result.item.id)
            : Promise.resolve([]),
        ]);
      setComments(nextComments);
      setVersions(nextVersions);
      setForks(nextForks);
      setPullRequests(nextPullRequests);
      if (
        user &&
        result.item.author_id !== user.id &&
        !result.item.author_id.startsWith('demo-')
      )
        setFollowing(await getFollowState(user.id, result.item.author_id));
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- Architecture data is loaded from Supabase when the route changes.
    void load();
  }, [load]);

  const requireUser = () => {
    if (user) return true;
    openAuth();
    return false;
  };

  const toggleSavedOrLiked = async (kind: 'likes' | 'bookmarks') => {
    if (!requireUser() || !item || item.id.startsWith('demo-')) return;
    const active = kind === 'likes' ? liked : bookmarked;
    if (kind === 'likes') setLiked(!active);
    else setBookmarked(!active);
    try {
      await toggleRelation(kind, item.id, user!.id, active);
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Could not save change.',
      );
      if (kind === 'likes') setLiked(active);
      else setBookmarked(active);
    }
  };

  if (loading)
    return (
      <main className="cc-app">
        <AppHeader />
        <div className="cc-detail-loading" />
      </main>
    );

  if (!item)
    return (
      <main className="cc-app">
        <AppHeader />
        <div className="cc-empty-state cc-page-empty">
          <Cloud />
          <strong>Architecture not found</strong>
          <Link href="/">Return to Explore</Link>
        </div>
      </main>
    );

  const isOwner = user?.id === item.author_id;

  return (
    <main className="cc-app">
      <AppHeader />
      <div className="cc-detail-shell">
        <aside className="cc-detail-rail">
          <Link href="/">
            <ArrowLeft /> Discover
          </Link>
          <nav>
            <span>IN THIS POST</span>
            <a href="#challenge">The challenge</a>
            <a href="#approach">The approach</a>
            <a href="#architecture">Architecture</a>
            <a href="#collaboration">Collaboration</a>
            <a href="#tradeoffs">Trade-offs</a>
            <a href="#discussion">Discussion</a>
          </nav>
          <div className="cc-stack-card">
            <span>STACK</span>
            <strong>{item.provider}</strong>
          </div>
        </aside>
        <article className="cc-detail-article">
          <div className="cc-detail-meta">
            <span>{item.tags[0]?.toUpperCase() ?? 'CLOUD ARCHITECTURE'}</span>
            <span>{item.provider}</span>
            <span>
              Updated {new Date(item.updated_at).toLocaleDateString()}
            </span>
          </div>
          <h1>{item.title}</h1>
          <p className="cc-detail-dek">{item.summary}</p>
          <div className="cc-author-row">
            <span className="cc-avatar large">
              {(item.author?.display_name ?? 'CA')
                .split(' ')
                .map((part) => part[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div>
              <Link href={`/profiles/${item.author?.username ?? 'developer'}`}>
                {item.author?.display_name ?? 'Cloud architect'}
              </Link>
              <span>{item.author?.title ?? 'Cloud professional'}</span>
            </div>
            {!isOwner && !item.author_id.startsWith('demo-') && (
              <Button
                variant="outline"
                onClick={async () => {
                  if (!requireUser()) return;
                  const previous = following;
                  setFollowing(!previous);
                  try {
                    await toggleFollow(user!.id, item.author_id, previous);
                  } catch {
                    setFollowing(previous);
                  }
                }}
              >
                {following ? <Check /> : null}
                {following ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          <section id="challenge" className="cc-prose">
            <h2>The challenge</h2>
            <p>{item.problem || item.summary}</p>
          </section>
          <section id="approach" className="cc-prose">
            <h2>The approach</h2>
            <p>
              {item.approach || 'The author has not added the approach yet.'}
            </p>
          </section>

          <section id="architecture" className="cc-live-architecture">
            <div className="cc-section-heading">
              <div>
                <span className="cc-eyebrow">LIVE ARCHITECTURE</span>
                <h2>Architecture canvas</h2>
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!requireUser()) return;
                    try {
                      const forkId = await forkArchitecture(item, user!.id);
                      router.push(`/editor/${forkId}`);
                    } catch (error) {
                      setNotice(
                        error instanceof Error
                          ? error.message
                          : 'Could not create fork.',
                      );
                    }
                  }}
                >
                  <GitFork /> Fork
                </Button>
                {isOwner && (
                  <Button onClick={() => router.push(`/editor/${item.id}`)}>
                    <Pencil /> Open editor
                  </Button>
                )}
              </div>
            </div>
            <div className="cc-diagram-preview">
              <DiagramPreview diagram={item.diagram} />
            </div>
            <div className="cc-version-strip">
              <span>main</span>
              <span>
                {versions.length ? `v${versions[0].version_number}` : 'v1'}
              </span>
              <span>{versions.length} saved versions</span>
            </div>
          </section>

          {(isOwner || forks.length > 0 || pullRequests.length > 0) && (
            <section id="collaboration" className="cc-collaboration">
              <div className="cc-section-heading">
                <div>
                  <span className="cc-eyebrow">COLLABORATION</span>
                  <h2>Forks and pull requests</h2>
                </div>
              </div>
              <div className="cc-collaboration-grid">
                <div className="cc-collaboration-panel">
                  <div className="cc-collaboration-title">
                    <GitFork />
                    <div>
                      <strong>Forks</strong>
                      <span>{forks.length} total</span>
                    </div>
                  </div>
                  {forks.length === 0 ? (
                    <p>No one has forked this architecture yet.</p>
                  ) : (
                    <div className="cc-collaboration-list">
                      {forks.map((fork) => (
                        <div key={fork.fork_architecture_id}>
                          <span className="cc-avatar small">
                            {(fork.author?.display_name ?? 'D')[0]}
                          </span>
                          <div>
                            <Link
                              href={`/profiles/${fork.author?.username ?? 'developer'}`}
                            >
                              {fork.author?.display_name ?? 'Developer'}
                            </Link>
                            <small>
                              Forked{' '}
                              {new Date(fork.created_at).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="cc-collaboration-panel">
                  <div className="cc-collaboration-title">
                    <GitPullRequest />
                    <div>
                      <strong>Pull requests</strong>
                      <span>{pullRequests.length} visible to you</span>
                    </div>
                  </div>
                  {pullRequests.length === 0 ? (
                    <p>No pull requests have been submitted yet.</p>
                  ) : (
                    <div className="cc-collaboration-list requests">
                      {pullRequests.map((request) => (
                        <div key={request.id}>
                          <div className="cc-pr-main">
                            <strong>{request.title}</strong>
                            <small>
                              by{' '}
                              <Link
                                href={`/profiles/${request.author?.username ?? 'developer'}`}
                              >
                                {request.author?.display_name ?? 'Contributor'}
                              </Link>{' '}
                              ·{' '}
                              {new Date(
                                request.created_at,
                              ).toLocaleDateString()}
                            </small>
                            {request.description && (
                              <p>{request.description}</p>
                            )}
                          </div>
                          <span className={`cc-pr-status ${request.status}`}>
                            {request.status}
                          </span>
                          {isOwner && request.status === 'open' && (
                            <div className="cc-pr-actions">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  void reviewPullRequest(
                                    request,
                                    'rejected',
                                  ).then(load);
                                }}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  void reviewPullRequest(
                                    request,
                                    'approved',
                                  ).then(load);
                                }}
                              >
                                Approve
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section id="tradeoffs" className="cc-prose">
            <h2>Trade-offs</h2>
            <p>
              {item.tradeoffs ||
                'The author has not documented trade-offs yet.'}
            </p>
          </section>

          <section id="discussion" className="cc-discussion">
            <div className="cc-section-heading">
              <div>
                <span className="cc-eyebrow">COMMUNITY REVIEW</span>
                <h2>Discussion</h2>
              </div>
              <span>{comments.length} comments</span>
            </div>
            {comments.map((entry) => (
              <div className="cc-comment" key={entry.id}>
                <span className="cc-avatar small">
                  {(entry.author?.display_name ?? 'D')[0]}
                </span>
                <div>
                  <strong>{entry.author?.display_name ?? 'Developer'}</strong>
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                  <p>{entry.body}</p>
                </div>
              </div>
            ))}
            <form
              className="cc-comment-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!requireUser() || !comment.trim()) return;
                void addComment(item.id, user!.id, comment.trim())
                  .then(() => {
                    setComment('');
                    return load();
                  })
                  .catch((error: unknown) =>
                    setNotice(
                      error instanceof Error
                        ? error.message
                        : 'Could not add comment.',
                    ),
                  );
              }}
            >
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={
                  user
                    ? 'Ask a question or suggest an improvement…'
                    : 'Sign in to join the discussion'
                }
                onFocus={() => {
                  if (!user) openAuth();
                }}
              />
              <Button type="submit" disabled={!comment.trim()}>
                <Send /> Comment
              </Button>
            </form>
          </section>
        </article>
        <aside className="cc-detail-actions">
          <div className="cc-action-row">
            <button
              className={liked ? 'active' : ''}
              onClick={() => void toggleSavedOrLiked('likes')}
            >
              <Heart /> {item.like_count ?? 0}
            </button>
            <a href="#discussion">
              <MessageCircle /> {comments.length || item.comment_count || 0}
            </a>
            <button
              className={bookmarked ? 'active' : ''}
              onClick={() => void toggleSavedOrLiked('bookmarks')}
            >
              <Bookmark />
            </button>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
                setNotice('Link copied to clipboard.');
              }}
            >
              <Share2 />
            </button>
          </div>
          <div className="cc-health-card">
            <span>ARCHITECTURE HEALTH</span>
            <strong>Well-documented</strong>
            <p>Problem, approach, canvas, and trade-offs are available.</p>
          </div>
          {isOwner && (forks.length > 0 || pullRequests.length > 0) && (
            <div className="cc-pr-card">
              <span>COLLABORATION</span>
              <a href="#collaboration" className="cc-collaboration-summary">
                <GitFork />
                <strong>{forks.length} forks</strong>
                <small>See who built on your work</small>
              </a>
              <a href="#collaboration" className="cc-collaboration-summary">
                <GitPullRequest />
                <strong>{pullRequests.length} pull requests</strong>
                <small>
                  {
                    pullRequests.filter((request) => request.status === 'open')
                      .length
                  }{' '}
                  awaiting review
                </small>
              </a>
            </div>
          )}
          {notice && (
            <button className="cc-notice" onClick={() => setNotice('')}>
              {notice}
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}
