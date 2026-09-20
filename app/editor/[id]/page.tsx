'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArchitectureEditor } from '@/app/editor';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import {
  getArchitecture,
  publishArchitecture,
  saveDiagram,
  submitPullRequest,
} from '@/lib/cloudcraft-data';
import type { Architecture, DiagramDocument } from '@/lib/cloudcraft-types';

export default function EditorPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { user, loading: authLoading, openAuth, profile } = useAuth();
  const [architecture, setArchitecture] = useState<Architecture | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    const result = await getArchitecture(params.id, user.id);
    setArchitecture(result.item);
    setLoading(false);
  }, [authLoading, params.id, user]);

  useEffect(() => {
    // oxlint-disable-next-line react/react-compiler -- Editor data is loaded from Supabase after auth resolves.
    void load();
  }, [load]);

  if (loading) return <div className="cc-editor-loading">Loading editor…</div>;
  if (!user)
    return (
      <div className="cc-empty-state cc-page-empty">
        <strong>Sign in to edit architectures</strong>
        <Button onClick={openAuth}>Sign in</Button>
      </div>
    );
  if (!architecture || architecture.author_id !== user.id)
    return (
      <div className="cc-empty-state cc-page-empty">
        <strong>You don’t have permission to edit this architecture.</strong>
        <Button onClick={() => router.push('/')}>Return to Explore</Button>
      </div>
    );

  const save = async (diagram: DiagramDocument) => {
    await saveDiagram(architecture, diagram);
    setArchitecture({ ...architecture, diagram });
  };

  return (
    <ArchitectureEditor
      title={architecture.title}
      ownerLabel={`${profile?.display_name ?? 'Developer'} · ${architecture.provider}`}
      provider={architecture.provider}
      status={architecture.status}
      initialDiagram={architecture.diagram}
      onClose={() => router.push(`/architectures/${architecture.id}`)}
      onSave={save}
      onPublish={async (diagram) => {
        await save(diagram);
        await publishArchitecture(architecture.id, user.id);
        router.push(`/architectures/${architecture.id}`);
      }}
      onSubmitPullRequest={
        architecture.forked_from
          ? async ({ title, description, diagram }) => {
              await save(diagram);
              await submitPullRequest({
                source: architecture,
                authorId: user.id,
                title,
                description,
                diagram,
              });
            }
          : undefined
      }
    />
  );
}
