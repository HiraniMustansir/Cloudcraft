'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  GitFork,
  Heart,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/app/providers';
import { DiagramPreview } from '@/app/components/diagram-preview';
import { toggleRelation } from '@/lib/cloudcraft-data';
import { analyzeArchitecture } from '@/lib/architecture-analysis';
import type { Architecture } from '@/lib/cloudcraft-types';

const providerTone: Record<string, string> = {
  AWS: 'aws',
  Azure: 'azure',
  GCP: 'gcp',
  'Multi-cloud': 'multi',
};

export function ArchitectureCard({ item }: { item: Architecture }) {
  const { user, openAuth } = useAuth();
  const [liked, setLiked] = useState(Boolean(item.liked));
  const [bookmarked, setBookmarked] = useState(Boolean(item.bookmarked));
  const [likeCount, setLikeCount] = useState(item.like_count ?? 0);

  const relation = async (kind: 'likes' | 'bookmarks') => {
    if (!user) return openAuth();
    const active = kind === 'likes' ? liked : bookmarked;
    if (kind === 'likes') {
      setLiked(!active);
      setLikeCount((count) => count + (active ? -1 : 1));
    } else setBookmarked(!active);
    try {
      await toggleRelation(kind, item.id, user.id, active);
    } catch {
      if (kind === 'likes') {
        setLiked(active);
        setLikeCount((count) => count + (active ? 1 : -1));
      } else setBookmarked(active);
    }
  };

  const authorInitials = (item.author?.display_name ?? 'Cloud architect')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('');
  const analysis = analyzeArchitecture(item.diagram, item.provider, {
    problem: item.problem,
    approach: item.approach,
    tradeoffs: item.tradeoffs,
  });

  return (
    <article className="cc-architecture-card">
      <Link className="cc-card-preview" href={`/architectures/${item.id}`}>
        <DiagramPreview diagram={item.diagram} compact />
        <span className={`cc-provider ${providerTone[item.provider]}`}>
          {item.provider}
        </span>
        <span className="cc-card-health">
          <ShieldCheck /> {analysis.score}
        </span>
      </Link>
      <div className="cc-card-body">
        <div className="cc-card-author">
          <span className="cc-avatar small">{authorInitials}</span>
          <Link href={`/profiles/${item.author?.username ?? 'developer'}`}>
            {item.author?.display_name ?? 'Cloud architect'}
          </Link>
          <span>·</span>
          <span>
            {new Date(item.published_at ?? item.updated_at).toLocaleDateString(
              undefined,
              { month: 'short', day: 'numeric' },
            )}
          </span>
        </div>
        <Link className="cc-card-title" href={`/architectures/${item.id}`}>
          {item.title}
        </Link>
        <p>{item.summary}</p>
        <div className="cc-tags">
          {item.tags.slice(0, 3).map((tag) => (
            <Link href={`/?q=${encodeURIComponent(tag)}`} key={tag}>
              {tag}
            </Link>
          ))}
        </div>
        <div className="cc-card-footer">
          <button
            className={liked ? 'active' : ''}
            onClick={() => void relation('likes')}
          >
            <Heart /> {likeCount}
          </button>
          <Link href={`/architectures/${item.id}#discussion`}>
            <MessageCircle /> {item.comment_count ?? 0}
          </Link>
          <span>
            <GitFork /> {item.forked_from ? 'Fork' : 'Original'}
          </span>
          <button
            className={`cc-bookmark ${bookmarked ? 'active' : ''}`}
            onClick={() => void relation('bookmarks')}
            aria-label={bookmarked ? 'Remove from saved' : 'Save architecture'}
          >
            <Bookmark />
          </button>
        </div>
      </div>
    </article>
  );
}
