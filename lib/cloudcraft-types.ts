export type Provider = 'AWS' | 'Azure' | 'GCP' | 'Multi-cloud';

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  title: string;
  bio: string;
  avatar_url: string | null;
  created_at: string;
};

export type FollowedProfile = Profile & {
  published_architecture_count: number;
  followed_at: string;
};

export type DiagramDocument = {
  nodes: unknown[];
  groups: unknown[];
  connections: unknown[];
};

export type Architecture = {
  id: string;
  author_id: string;
  title: string;
  summary: string;
  problem: string;
  approach: string;
  tradeoffs: string;
  provider: Provider;
  tags: string[];
  diagram: DiagramDocument;
  status: 'draft' | 'published';
  forked_from: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author?: Profile;
  like_count?: number;
  comment_count?: number;
  liked?: boolean;
  bookmarked?: boolean;
};

export type ArchitectureComment = {
  id: string;
  architecture_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: Profile;
};

export type ArchitectureVersion = {
  id: string;
  architecture_id: string;
  author_id: string;
  version_number: number;
  message: string;
  diagram: DiagramDocument;
  created_at: string;
};

export type PullRequest = {
  id: string;
  source_architecture_id: string;
  target_architecture_id: string;
  author_id: string;
  title: string;
  description: string;
  proposed_diagram: DiagramDocument;
  status: 'open' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  author?: Profile;
};

export type ArchitectureFork = {
  source_architecture_id: string;
  fork_architecture_id: string;
  author_id: string;
  created_at: string;
  author?: Profile;
};

export type ProfileStats = {
  architectures: number;
  drafts: number;
  followers: number;
  following: number;
  forksCreated: number;
  pullRequests: number;
  mergedContributions: number;
  openContributions: number;
  rejectedContributions: number;
  likesReceived: number;
  commentsReceived: number;
};

export type ContributionActivity = {
  id: string;
  title: string;
  status: PullRequest['status'];
  sourceArchitectureId: string;
  sourceArchitectureTitle: string;
  targetArchitectureId: string;
  targetArchitectureTitle: string;
  createdAt: string;
  updatedAt: string;
};

export const emptyDiagram: DiagramDocument = {
  nodes: [],
  groups: [],
  connections: [],
};
