'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Clock3,
  GitFork,
  GitPullRequest,
  Heart,
  Layers3,
  MapPin,
  MessageCircle,
  Pencil,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { AppHeader } from '@/app/components/app-header';
import { ArchitectureCard } from '@/app/components/architecture-card';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  getFollowState,
  getProfile,
  getProfileStats,
  listProfileContributions,
  listArchitectures,
  toggleFollow,
  updateProfile,
} from '@/lib/cloudcraft-data';
import type {
  Architecture,
  ContributionActivity,
  Profile,
  ProfileStats,
} from '@/lib/cloudcraft-types';

const emptyStats: ProfileStats = {
  architectures: 0,
  drafts: 0,
  followers: 0,
  following: 0,
  forksCreated: 0,
  pullRequests: 0,
  mergedContributions: 0,
  openContributions: 0,
  rejectedContributions: 0,
  likesReceived: 0,
  commentsReceived: 0,
};

export function ProfileView({ username }: { username?: string }) {
  const {
    user,
    profile: currentProfile,
    loading: authLoading,
    openAuth,
    refreshProfile,
  } = useAuth();
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [draftProfile, setDraftProfile] = useState<Profile | null>(null);
  const [items, setItems] = useState<Architecture[]>([]);
  const [stats, setStats] = useState<ProfileStats>(emptyStats);
  const [contributions, setContributions] = useState<ContributionActivity[]>(
    [],
  );
  const [following, setFollowing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (authLoading) return;
    const nextProfile = username ? await getProfile(username) : currentProfile;
    setViewedProfile(nextProfile);
    setDraftProfile(nextProfile);
    if (nextProfile) {
      const [architectures, nextStats, nextContributions] = await Promise.all([
        listArchitectures({
          authorId: nextProfile.id,
          includeDrafts: user?.id === nextProfile.id,
        }),
        getProfileStats(nextProfile.id),
        listProfileContributions(nextProfile.id),
      ]);
      setItems(architectures.items);
      setStats(nextStats);
      setContributions(nextContributions);
      if (user && user.id !== nextProfile.id)
        setFollowing(await getFollowState(user.id, nextProfile.id));
    }
    setLoading(false);
  }, [authLoading, currentProfile, user, username]);

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- Profile data is loaded from Supabase when route identity changes.
    void load();
  }, [load]);

  if (loading)
    return (
      <main className="cc-app">
        <AppHeader />
        <div className="cc-detail-loading" />
      </main>
    );

  if (!viewedProfile)
    return (
      <main className="cc-app">
        <AppHeader />
        <div className="cc-empty-state cc-page-empty">
          <strong>
            {user ? 'Profile not found' : 'Sign in to view your profile'}
          </strong>
          {!user && <Button onClick={openAuth}>Sign in</Button>}
          <Link href="/">Return to Explore</Link>
        </div>
      </main>
    );

  const isOwner = user?.id === viewedProfile.id;
  const initials = viewedProfile.display_name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
  const contributionCards = [
    {
      label: 'Published',
      value: stats.architectures,
      detail: 'Public architectures',
      icon: Layers3,
    },
    ...(isOwner
      ? [
          {
            label: 'Drafts',
            value: stats.drafts,
            detail: 'Private work in progress',
            icon: Pencil,
          },
        ]
      : []),
    {
      label: 'Forks',
      value: stats.forksCreated,
      detail: 'Architectures forked',
      icon: GitFork,
    },
    {
      label: 'Pull requests',
      value: stats.pullRequests,
      detail: 'Contributions proposed',
      icon: GitPullRequest,
    },
    {
      label: 'Merged',
      value: stats.mergedContributions,
      detail: 'Accepted contributions',
      icon: CheckCircle2,
    },
    ...(isOwner
      ? [
          {
            label: 'In review',
            value: stats.openContributions,
            detail: 'Awaiting a decision',
            icon: Clock3,
          },
        ]
      : []),
    {
      label: 'Likes',
      value: stats.likesReceived,
      detail: 'Received on your work',
      icon: Heart,
    },
    {
      label: 'Comments',
      value: stats.commentsReceived,
      detail: 'Discussion on your work',
      icon: MessageCircle,
    },
  ];

  return (
    <main className="cc-app">
      <AppHeader />
      <section className="cc-profile-shell">
        <div className="cc-profile-cover" />
        <div className="cc-profile-main">
          <aside className="cc-profile-sidebar">
            <span className="cc-profile-avatar">{initials}</span>
            <h1>{viewedProfile.display_name}</h1>
            <strong>@{viewedProfile.username}</strong>
            <p>{viewedProfile.title}</p>
            <p className="cc-profile-bio">
              {viewedProfile.bio ||
                'Sharing practical cloud architecture decisions and reusable diagrams.'}
            </p>
            <span className="cc-profile-location">
              <MapPin /> Cloud community
            </span>
            <div className="cc-profile-stats">
              <div>
                <strong>{stats.architectures}</strong>
                <span>Architectures</span>
              </div>
              <div>
                <strong>{stats.followers}</strong>
                <span>Followers</span>
              </div>
              <div>
                <strong>{stats.following}</strong>
                <span>Following</span>
              </div>
            </div>
            {isOwner ? (
              <Button
                variant="outline"
                className="full-button"
                onClick={() => setEditing((value) => !value)}
              >
                <Pencil /> Edit profile
              </Button>
            ) : (
              <Button
                className="full-button"
                onClick={async () => {
                  if (!user) return openAuth();
                  const previous = following;
                  setFollowing(!previous);
                  try {
                    await toggleFollow(user.id, viewedProfile.id, previous);
                    setStats((value) => ({
                      ...value,
                      followers: value.followers + (previous ? -1 : 1),
                    }));
                  } catch {
                    setFollowing(previous);
                  }
                }}
              >
                {following ? <Check /> : <UserPlus />}
                {following ? 'Following' : 'Follow'}
              </Button>
            )}
          </aside>
          <div className="cc-profile-content">
            {editing && draftProfile && (
              <form
                className="cc-profile-editor"
                onSubmit={(event) => {
                  event.preventDefault();
                  void updateProfile(draftProfile)
                    .then(async () => {
                      setViewedProfile(draftProfile);
                      await refreshProfile();
                      setEditing(false);
                      setMessage('Profile updated.');
                    })
                    .catch((error: unknown) =>
                      setMessage(
                        error instanceof Error
                          ? error.message
                          : 'Could not update profile.',
                      ),
                    );
                }}
              >
                <div className="cc-section-heading">
                  <div>
                    <span className="cc-eyebrow">ACCOUNT</span>
                    <h2>Edit profile</h2>
                  </div>
                </div>
                <label htmlFor="profile-display-name">
                  Display name
                  <Input
                    id="profile-display-name"
                    value={draftProfile.display_name}
                    onChange={(event) =>
                      setDraftProfile({
                        ...draftProfile,
                        display_name: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label htmlFor="profile-username">
                  Username
                  <Input
                    id="profile-username"
                    value={draftProfile.username}
                    onChange={(event) =>
                      setDraftProfile({
                        ...draftProfile,
                        username: event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ''),
                      })
                    }
                    minLength={3}
                    required
                  />
                </label>
                <label htmlFor="profile-title">
                  Professional title
                  <Input
                    id="profile-title"
                    value={draftProfile.title}
                    onChange={(event) =>
                      setDraftProfile({
                        ...draftProfile,
                        title: event.target.value,
                      })
                    }
                  />
                </label>
                <label htmlFor="profile-bio">
                  Bio
                  <Textarea
                    id="profile-bio"
                    value={draftProfile.bio}
                    onChange={(event) =>
                      setDraftProfile({
                        ...draftProfile,
                        bio: event.target.value,
                      })
                    }
                  />
                </label>
                <div className="cc-form-actions">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save profile</Button>
                </div>
              </form>
            )}
            <section className="cc-contribution-dashboard">
              <div className="cc-section-heading">
                <div>
                  <span className="cc-eyebrow">IMPACT</span>
                  <h2>Contribution overview</h2>
                </div>
                {stats.pullRequests > 0 && (
                  <span className="cc-merge-rate">
                    {Math.round(
                      (stats.mergedContributions / stats.pullRequests) * 100,
                    )}
                    % merge rate
                  </span>
                )}
              </div>
              <div className="cc-contribution-stats">
                {contributionCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <article key={card.label}>
                      <span>
                        <Icon />
                      </span>
                      <strong>{card.value}</strong>
                      <b>{card.label}</b>
                      <small>{card.detail}</small>
                    </article>
                  );
                })}
              </div>
              {isOwner && stats.rejectedContributions > 0 && (
                <p className="cc-contribution-note">
                  <XCircle /> {stats.rejectedContributions} contribution
                  {stats.rejectedContributions === 1 ? '' : 's'} declined
                </p>
              )}
              {contributions.length > 0 && (
                <div className="cc-contribution-activity">
                  <strong>Recent pull requests</strong>
                  {contributions.map((contribution) => (
                    <Link
                      key={contribution.id}
                      href={`/architectures/${contribution.targetArchitectureId}`}
                    >
                      <span
                        className={`cc-contribution-status ${contribution.status}`}
                      >
                        {contribution.status === 'approved' ? (
                          <CheckCircle2 />
                        ) : contribution.status === 'open' ? (
                          <Clock3 />
                        ) : (
                          <XCircle />
                        )}
                      </span>
                      <span>
                        <b>{contribution.title}</b>
                        <small>
                          {contribution.sourceArchitectureTitle} →{' '}
                          {contribution.targetArchitectureTitle}
                        </small>
                      </span>
                      <em className={contribution.status}>
                        {contribution.status === 'approved'
                          ? 'Merged'
                          : contribution.status === 'open'
                            ? 'In review'
                            : 'Declined'}
                      </em>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            <div className="cc-section-heading cc-profile-heading">
              <div>
                <span className="cc-eyebrow">
                  {isOwner ? 'YOUR WORK' : 'PUBLISHED WORK'}
                </span>
                <h2>Architectures</h2>
              </div>
              {isOwner && (
                <Button render={<Link href="/publish" />}>
                  New architecture
                </Button>
              )}
            </div>
            {message && (
              <button className="cc-notice" onClick={() => setMessage('')}>
                {message}
              </button>
            )}
            {items.length ? (
              <div className="cc-card-grid cc-profile-grid">
                {items.map((item) => (
                  <div className="cc-profile-card-wrap" key={item.id}>
                    {item.status === 'draft' && (
                      <span className="cc-draft-badge">Draft</span>
                    )}
                    <ArchitectureCard item={item} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="cc-empty-state">
                <strong>No architectures yet</strong>
                <p>Create a post and add an editable diagram.</p>
                {isOwner && (
                  <Button render={<Link href="/publish" />}>
                    Create architecture
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
