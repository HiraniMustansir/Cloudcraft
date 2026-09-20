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

export const emptyDiagram: DiagramDocument = {
  nodes: [],
  groups: [],
  connections: [],
};
