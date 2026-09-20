import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
  emptyDiagram,
  type Architecture,
  type ArchitectureComment,
  type ArchitectureFork,
  type ArchitectureVersion,
  type ContributionActivity,
  type FollowedProfile,
  type Profile,
  type ProfileStats,
  type Provider,
  type PullRequest,
} from '@/lib/cloudcraft-types';

const demoAuthor: Profile = {
  id: 'demo-author',
  username: 'alex-kim',
  display_name: 'Alex Kim',
  title: 'Principal Cloud Architect',
  bio: 'Designing resilient platforms and sharing the decisions behind them.',
  avatar_url: null,
  created_at: '2026-08-01T00:00:00.000Z',
};

export const demoArchitectures: Architecture[] = [
  {
    id: 'demo-resilient-commerce',
    author_id: demoAuthor.id,
    title: 'Designing a resilient event-driven commerce platform',
    summary:
      'A fault-tolerant checkout architecture that isolates inventory, payment, and fulfillment failures.',
    problem:
      'Peak campaigns created cascading failures across inventory, payments, and fulfillment. The platform needed independent failure domains without slowing down delivery teams.',
    approach:
      'Edge traffic terminates behind Route 53 and a load balancer. Stateless services validate requests, durable events isolate downstream work, and Aurora stores transactional state.',
    tradeoffs:
      'The event boundary improves resilience but adds eventual consistency, operational observability requirements, and replay handling.',
    provider: 'AWS',
    tags: ['event-driven', 'commerce', 'resilience'],
    diagram: emptyDiagram,
    status: 'published',
    forked_from: null,
    created_at: '2026-09-10T10:00:00.000Z',
    updated_at: '2026-09-18T10:00:00.000Z',
    published_at: '2026-09-18T10:00:00.000Z',
    author: demoAuthor,
    like_count: 184,
    comment_count: 12,
  },
  {
    id: 'demo-serverless-data',
    author_id: demoAuthor.id,
    title: 'A serverless ingestion pipeline with controlled backpressure',
    summary:
      'Kinesis, Lambda, DynamoDB, and S3 arranged for bursty workloads and predictable recovery.',
    problem: 'Bursty partner feeds overwhelmed synchronous consumers.',
    approach:
      'Buffer events, scale consumers independently, and archive raw payloads.',
    tradeoffs: 'Operational simplicity comes with careful concurrency tuning.',
    provider: 'AWS',
    tags: ['serverless', 'data', 'kinesis'],
    diagram: emptyDiagram,
    status: 'published',
    forked_from: null,
    created_at: '2026-09-02T10:00:00.000Z',
    updated_at: '2026-09-15T10:00:00.000Z',
    published_at: '2026-09-15T10:00:00.000Z',
    author: demoAuthor,
    like_count: 96,
    comment_count: 8,
  },
  {
    id: 'demo-multicloud-edge',
    author_id: 'demo-maya',
    title: 'Multi-cloud edge routing without shared failure domains',
    summary:
      'A practical traffic-management design spanning AWS and Google Cloud with explicit failover controls.',
    problem: 'Regional and provider outages needed independent failover paths.',
    approach: 'Health-aware DNS routes to isolated provider entry points.',
    tradeoffs: 'Portability increases governance and testing overhead.',
    provider: 'Multi-cloud',
    tags: ['multi-cloud', 'networking', 'failover'],
    diagram: emptyDiagram,
    status: 'published',
    forked_from: null,
    created_at: '2026-08-27T10:00:00.000Z',
    updated_at: '2026-09-12T10:00:00.000Z',
    published_at: '2026-09-12T10:00:00.000Z',
    author: {
      ...demoAuthor,
      id: 'demo-maya',
      username: 'maya-ortiz',
      display_name: 'Maya Ortiz',
      title: 'Staff Platform Engineer',
    },
    like_count: 143,
    comment_count: 19,
  },
];

const architectureSelect = '*, author:profiles!architectures_author_id_fkey(*)';

function isMissingSchema(message?: string) {
  return Boolean(
    message?.includes('schema cache') ||
    message?.includes('does not exist') ||
    message?.includes('Could not find the table'),
  );
}

export async function getProfileForUser(user: User): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (data) return data as Profile;
  return {
    id: user.id,
    username: `developer-${user.id.slice(0, 6)}`,
    display_name:
      (user.user_metadata.full_name as string | undefined) ||
      user.email?.split('@')[0] ||
      'Developer',
    title: 'Cloud professional',
    bio: '',
    avatar_url: null,
    created_at: user.created_at,
  };
}

export async function getProfile(username: string) {
  if (username === demoAuthor.username) return demoAuthor;
  const { data, error } = await createClient()
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) return null;
  return data as Profile | null;
}

export async function listArchitectures(
  options: {
    query?: string;
    authorId?: string;
    followingFor?: string;
    savedFor?: string;
    viewerId?: string;
    includeDrafts?: boolean;
  } = {},
): Promise<{ items: Architecture[]; needsSetup: boolean }> {
  const supabase = createClient();
  let ids: string[] | null = null;

  if (options.followingFor) {
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', options.followingFor);
    const followingIds = (data ?? []).map((row) => row.following_id as string);
    if (!followingIds.length) return { items: [], needsSetup: false };
    ids = followingIds;
  }

  let savedIds: string[] | null = null;
  if (options.savedFor) {
    const { data } = await supabase
      .from('bookmarks')
      .select('architecture_id')
      .eq('user_id', options.savedFor);
    savedIds = (data ?? []).map((row) => row.architecture_id as string);
    if (!savedIds.length) return { items: [], needsSetup: false };
  }

  let query = supabase
    .from('architectures')
    .select(architectureSelect)
    .order('published_at', { ascending: false, nullsFirst: false });
  if (!options.includeDrafts) query = query.eq('status', 'published');
  if (options.authorId) query = query.eq('author_id', options.authorId);
  if (ids) query = query.in('author_id', ids);
  if (savedIds) query = query.in('id', savedIds);
  if (options.query?.trim()) {
    const term = options.query.trim().replace(/[(),.%]/g, ' ');
    query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
  }

  const { data, error } = await query.limit(40);
  if (error) {
    const fallback = demoArchitectures.filter((item) => {
      const matchesQuery = options.query
        ? `${item.title} ${item.summary} ${item.tags.join(' ')}`
            .toLowerCase()
            .includes(options.query.toLowerCase())
        : true;
      const matchesAuthor = options.authorId
        ? item.author_id === options.authorId
        : true;
      return matchesQuery && matchesAuthor && !options.savedFor;
    });
    return { items: fallback, needsSetup: isMissingSchema(error.message) };
  }

  const items = (data ?? []) as unknown as Architecture[];
  await attachCountsAndViewerState(
    items,
    options.viewerId ?? options.savedFor ?? options.followingFor,
  );
  return { items, needsSetup: false };
}

async function attachCountsAndViewerState(
  items: Architecture[],
  viewerId?: string,
) {
  if (!items.length) return;
  const supabase = createClient();
  const architectureIds = items.map((item) => item.id);
  const [{ data: likes }, { data: comments }, { data: bookmarks }] =
    await Promise.all([
      supabase
        .from('likes')
        .select('architecture_id,user_id')
        .in('architecture_id', architectureIds),
      supabase
        .from('comments')
        .select('architecture_id')
        .in('architecture_id', architectureIds),
      viewerId
        ? supabase
            .from('bookmarks')
            .select('architecture_id')
            .eq('user_id', viewerId)
            .in('architecture_id', architectureIds)
        : Promise.resolve({ data: [] }),
    ]);
  for (const item of items) {
    item.like_count = (likes ?? []).filter(
      (row) => row.architecture_id === item.id,
    ).length;
    item.comment_count = (comments ?? []).filter(
      (row) => row.architecture_id === item.id,
    ).length;
    item.liked = Boolean(
      viewerId &&
      (likes ?? []).some(
        (row) => row.architecture_id === item.id && row.user_id === viewerId,
      ),
    );
    item.bookmarked = Boolean(
      (bookmarks ?? []).some((row) => row.architecture_id === item.id),
    );
  }
}

export async function getArchitecture(id: string, viewerId?: string) {
  const demo = demoArchitectures.find((item) => item.id === id);
  if (demo) return { item: demo, needsSetup: false };
  const { data, error } = await createClient()
    .from('architectures')
    .select(architectureSelect)
    .eq('id', id)
    .maybeSingle();
  if (error || !data)
    return { item: null, needsSetup: isMissingSchema(error?.message) };
  const item = data as unknown as Architecture;
  await attachCountsAndViewerState([item], viewerId);
  return { item, needsSetup: false };
}

export async function createArchitecture(input: {
  authorId: string;
  title: string;
  summary: string;
  problem: string;
  approach: string;
  tradeoffs: string;
  provider: Provider;
  tags: string[];
}) {
  const { data, error } = await createClient()
    .from('architectures')
    .insert({
      author_id: input.authorId,
      title: input.title,
      summary: input.summary,
      problem: input.problem,
      approach: input.approach,
      tradeoffs: input.tradeoffs,
      provider: input.provider,
      tags: input.tags,
      diagram: emptyDiagram,
      status: 'draft',
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function publishArchitecture(id: string, authorId: string) {
  const { error } = await createClient()
    .from('architectures')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .eq('author_id', authorId);
  if (error) throw error;
}

export async function forkArchitecture(
  architecture: Architecture,
  authorId: string,
) {
  const { data, error } = await createClient()
    .from('architectures')
    .insert({
      author_id: authorId,
      title: `${architecture.title} (fork)`,
      summary: architecture.summary,
      problem: architecture.problem,
      approach: architecture.approach,
      tradeoffs: architecture.tradeoffs,
      provider: architecture.provider,
      tags: architecture.tags,
      diagram: architecture.diagram,
      status: 'draft',
      forked_from: architecture.id,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function saveDiagram(
  architecture: Architecture,
  diagram: Architecture['diagram'],
) {
  const supabase = createClient();
  const { error } = await supabase
    .from('architectures')
    .update({ diagram })
    .eq('id', architecture.id)
    .eq('author_id', architecture.author_id);
  if (error) throw error;

  const { count } = await supabase
    .from('architecture_versions')
    .select('id', { count: 'exact', head: true })
    .eq('architecture_id', architecture.id);
  await supabase.from('architecture_versions').insert({
    architecture_id: architecture.id,
    author_id: architecture.author_id,
    version_number: (count ?? 0) + 1,
    message: 'Saved from architecture editor',
    diagram,
  });
}

export async function submitPullRequest(input: {
  source: Architecture;
  authorId: string;
  title: string;
  description: string;
  diagram: Architecture['diagram'];
}) {
  if (!input.source.forked_from)
    throw new Error('Only a fork can be submitted as a pull request.');
  const { error } = await createClient().from('pull_requests').insert({
    source_architecture_id: input.source.id,
    target_architecture_id: input.source.forked_from,
    author_id: input.authorId,
    title: input.title,
    description: input.description,
    proposed_diagram: input.diagram,
  });
  if (error) throw error;
}

export async function listPullRequests(targetArchitectureId: string) {
  const { data } = await createClient()
    .from('pull_requests')
    .select('*, author:profiles!pull_requests_author_id_fkey(*)')
    .eq('target_architecture_id', targetArchitectureId)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as PullRequest[];
}

export async function listArchitectureForks(sourceArchitectureId: string) {
  const { data, error } = await createClient()
    .from('architecture_forks')
    .select('*, author:profiles!architecture_forks_author_id_fkey(*)')
    .eq('source_architecture_id', sourceArchitectureId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as ArchitectureFork[];
}

export async function reviewPullRequest(
  request: PullRequest,
  status: 'approved' | 'rejected',
) {
  const supabase = createClient();
  if (status === 'approved') {
    const { error } = await supabase
      .from('architectures')
      .update({ diagram: request.proposed_diagram })
      .eq('id', request.target_architecture_id);
    if (error) throw error;
  }
  const { error } = await supabase
    .from('pull_requests')
    .update({ status })
    .eq('id', request.id);
  if (error) throw error;
}

export async function listVersions(id: string) {
  const { data } = await createClient()
    .from('architecture_versions')
    .select('*')
    .eq('architecture_id', id)
    .order('version_number', { ascending: false });
  return (data ?? []) as ArchitectureVersion[];
}

export async function listComments(id: string) {
  if (id.startsWith('demo-')) return [];
  const { data } = await createClient()
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey(*)')
    .eq('architecture_id', id)
    .order('created_at', { ascending: true });
  return (data ?? []) as unknown as ArchitectureComment[];
}

export async function addComment(
  architectureId: string,
  authorId: string,
  body: string,
) {
  const { error } = await createClient()
    .from('comments')
    .insert({ architecture_id: architectureId, author_id: authorId, body });
  if (error) throw error;
}

export async function toggleRelation(
  table: 'likes' | 'bookmarks',
  architectureId: string,
  userId: string,
  active: boolean,
) {
  const supabase = createClient();
  const key = table === 'likes' ? 'user_id' : 'user_id';
  if (active) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq(key, userId)
      .eq('architecture_id', architectureId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from(table)
      .insert({ user_id: userId, architecture_id: architectureId });
    if (error) throw error;
  }
}

export async function toggleFollow(
  followerId: string,
  followingId: string,
  active: boolean,
) {
  const supabase = createClient();
  if (active) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  }
}

export async function getFollowState(followerId: string, followingId: string) {
  const { data } = await createClient()
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return Boolean(data);
}

export async function listFollowingProfiles(
  followerId: string,
): Promise<FollowedProfile[]> {
  const supabase = createClient();
  const { data: follows, error } = await supabase
    .from('follows')
    .select('following_id,created_at')
    .eq('follower_id', followerId)
    .order('created_at', { ascending: false });
  if (error || !follows?.length) return [];

  const profileIds = follows.map((follow) => follow.following_id as string);
  const [{ data: profiles }, { data: architectures }] = await Promise.all([
    supabase.from('profiles').select('*').in('id', profileIds),
    supabase
      .from('architectures')
      .select('author_id')
      .in('author_id', profileIds)
      .eq('status', 'published'),
  ]);
  const profileById = new Map(
    ((profiles ?? []) as Profile[]).map((profile) => [profile.id, profile]),
  );

  return follows.flatMap((follow) => {
    const profile = profileById.get(follow.following_id as string);
    if (!profile) return [];
    return [
      {
        ...profile,
        followed_at: follow.created_at as string,
        published_architecture_count: (architectures ?? []).filter(
          (architecture) => architecture.author_id === profile.id,
        ).length,
      },
    ];
  });
}

export async function getProfileStats(
  profileId: string,
): Promise<ProfileStats> {
  const supabase = createClient();
  const [architectures, followers, following, forks, pullRequests] =
    await Promise.all([
      supabase
        .from('architectures')
        .select('id,status')
        .eq('author_id', profileId),
      supabase
        .from('follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', profileId),
      supabase
        .from('follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', profileId),
      supabase
        .from('architecture_forks')
        .select('fork_architecture_id', { count: 'exact', head: true })
        .eq('author_id', profileId),
      supabase
        .from('pull_requests')
        .select('id,status')
        .eq('author_id', profileId),
    ]);

  const visibleArchitectures = architectures.data ?? [];
  const architectureIds = visibleArchitectures.map((item) => item.id);
  const [likes, comments] = architectureIds.length
    ? await Promise.all([
        supabase
          .from('likes')
          .select('architecture_id', { count: 'exact', head: true })
          .in('architecture_id', architectureIds),
        supabase
          .from('comments')
          .select('architecture_id', { count: 'exact', head: true })
          .in('architecture_id', architectureIds),
      ])
    : [{ count: 0 }, { count: 0 }];
  const requests = pullRequests.data ?? [];

  return {
    architectures: visibleArchitectures.filter(
      (item) => item.status === 'published',
    ).length,
    drafts: visibleArchitectures.filter((item) => item.status === 'draft')
      .length,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
    forksCreated: forks.count ?? 0,
    pullRequests: requests.length,
    mergedContributions: requests.filter((item) => item.status === 'approved')
      .length,
    openContributions: requests.filter((item) => item.status === 'open').length,
    rejectedContributions: requests.filter((item) => item.status === 'rejected')
      .length,
    likesReceived: likes.count ?? 0,
    commentsReceived: comments.count ?? 0,
  };
}

export async function listProfileContributions(
  profileId: string,
): Promise<ContributionActivity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('pull_requests')
    .select(
      'id,title,status,source_architecture_id,target_architecture_id,created_at,updated_at',
    )
    .eq('author_id', profileId)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error || !data?.length) return [];

  const architectureIds = Array.from(
    new Set(
      data.flatMap((request) => [
        request.source_architecture_id,
        request.target_architecture_id,
      ]),
    ),
  );
  const { data: architectures } = await supabase
    .from('architectures')
    .select('id,title')
    .in('id', architectureIds);
  const titles = new Map(
    (architectures ?? []).map((architecture) => [
      architecture.id,
      architecture.title,
    ]),
  );

  return data.map((request) => ({
    id: request.id,
    title: request.title,
    status: request.status as PullRequest['status'],
    sourceArchitectureId: request.source_architecture_id,
    sourceArchitectureTitle:
      titles.get(request.source_architecture_id) ?? 'Forked architecture',
    targetArchitectureId: request.target_architecture_id,
    targetArchitectureTitle:
      titles.get(request.target_architecture_id) ?? 'Original architecture',
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  }));
}

export async function updateProfile(profile: Profile) {
  const { error } = await createClient()
    .from('profiles')
    .update({
      display_name: profile.display_name,
      username: profile.username,
      title: profile.title,
      bio: profile.bio,
    })
    .eq('id', profile.id);
  if (error) throw error;
}
