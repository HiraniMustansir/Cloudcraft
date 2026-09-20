'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, FileText, Layers3 } from 'lucide-react';
import { AppHeader } from '@/app/components/app-header';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createArchitecture } from '@/lib/cloudcraft-data';
import type { Provider } from '@/lib/cloudcraft-types';

const providerChoices: Array<{
  value: Provider;
  label: string;
  mark: string;
  description: string;
}> = [
  {
    value: 'AWS',
    label: 'Amazon Web Services',
    mark: 'AWS',
    description: 'Build with the complete AWS service catalog.',
  },
  {
    value: 'Azure',
    label: 'Microsoft Azure',
    mark: 'AZ',
    description: 'Use Azure, Microsoft, and hybrid services.',
  },
  {
    value: 'GCP',
    label: 'Google Cloud',
    mark: 'GCP',
    description: 'Design with Google Cloud and Firebase services.',
  },
  {
    value: 'Multi-cloud',
    label: 'Hybrid / multi-cloud',
    mark: 'HYB',
    description: 'Mix providers and add cross-cloud connectivity.',
  },
];

export default function PublishPage() {
  const router = useRouter();
  const { user, loading, openAuth } = useAuth();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [problem, setProblem] = useState('');
  const [approach, setApproach] = useState('');
  const [tradeoffs, setTradeoffs] = useState('');
  const [provider, setProvider] = useState<Provider>('AWS');
  const [tags, setTags] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  return (
    <main className="cc-app">
      <AppHeader />
      <section className="cc-publish-shell">
        <button className="cc-back-button" onClick={() => router.back()}>
          <ArrowLeft /> Back
        </button>
        <div className="cc-publish-heading">
          <span className="cc-heading-icon">
            <FileText />
          </span>
          <div>
            <span className="cc-eyebrow">NEW ARCHITECTURE</span>
            <h1>Document the decisions behind your design</h1>
            <p>
              Start with the written context. You’ll build the editable canvas
              in the next step.
            </p>
          </div>
        </div>
        {!loading && !user ? (
          <div className="cc-empty-state">
            <strong>Sign in to publish</strong>
            <p>
              Your drafts and architecture versions are saved to your profile.
            </p>
            <Button onClick={openAuth}>Sign in</Button>
          </div>
        ) : (
          <form
            className="cc-publish-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!user) return openAuth();
              setPending(true);
              setError('');
              void createArchitecture({
                authorId: user.id,
                title,
                summary,
                problem,
                approach,
                tradeoffs,
                provider,
                tags: tags
                  .split(',')
                  .map((tag) => tag.trim().toLowerCase())
                  .filter(Boolean),
              })
                .then((id) => router.push(`/editor/${id}`))
                .catch((nextError: unknown) => {
                  setPending(false);
                  setError(
                    nextError instanceof Error
                      ? nextError.message
                      : 'Could not create architecture.',
                  );
                });
            }}
          >
            <div className="cc-form-section">
              <div className="cc-form-section-title">
                <span>1</span>
                <div>
                  <strong>Choose your cloud environment</strong>
                  <p>
                    This controls which services are shown in the architecture
                    editor.
                  </p>
                </div>
              </div>
              <div className="cc-provider-picker" role="radiogroup">
                {providerChoices.map((choice) => (
                  <label
                    key={choice.value}
                    className={`cc-provider-choice ${provider === choice.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="cloud-provider"
                      value={choice.value}
                      checked={provider === choice.value}
                      onChange={() => setProvider(choice.value)}
                    />
                    <span
                      className={`cc-provider-mark ${choice.value.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}
                    >
                      {choice.mark}
                    </span>
                    <span>
                      <strong>{choice.label}</strong>
                      <small>{choice.description}</small>
                    </span>
                    <i aria-hidden="true" />
                  </label>
                ))}
              </div>
            </div>
            <div className="cc-form-section">
              <div className="cc-form-section-title">
                <span>2</span>
                <div>
                  <strong>Post details</strong>
                  <p>Help readers understand what they’ll learn.</p>
                </div>
              </div>
              <label htmlFor="publish-title">
                Title
                <Input
                  id="publish-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={`e.g. A resilient API on ${provider === 'Multi-cloud' ? 'multiple clouds' : provider}`}
                  minLength={3}
                  maxLength={120}
                  required
                />
              </label>
              <label htmlFor="publish-summary">
                Summary
                <Textarea
                  id="publish-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="Describe the outcome and why this architecture matters."
                  required
                />
              </label>
              <label htmlFor="publish-tags">
                Tags
                <Input
                  id="publish-tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="serverless, security, networking"
                />
              </label>
            </div>
            <div className="cc-form-section">
              <div className="cc-form-section-title">
                <span>3</span>
                <div>
                  <strong>Architecture story</strong>
                  <p>Capture the context that a diagram cannot show alone.</p>
                </div>
              </div>
              <label htmlFor="publish-problem">
                The problem
                <Textarea
                  id="publish-problem"
                  value={problem}
                  onChange={(event) => setProblem(event.target.value)}
                  placeholder="What constraint, incident, or scale challenge led to this design?"
                  required
                />
              </label>
              <label htmlFor="publish-approach">
                The approach
                <Textarea
                  id="publish-approach"
                  value={approach}
                  onChange={(event) => setApproach(event.target.value)}
                  placeholder="Explain the important services, boundaries, and data flows."
                  required
                />
              </label>
              <label htmlFor="publish-tradeoffs">
                Trade-offs
                <Textarea
                  id="publish-tradeoffs"
                  value={tradeoffs}
                  onChange={(event) => setTradeoffs(event.target.value)}
                  placeholder="What did the team accept in exchange for the benefits?"
                />
              </label>
            </div>
            {error && (
              <div className="cc-form-error" role="alert">
                <strong>Could not create the draft</strong>
                <span>{error}</span>
                <span>
                  If the database is new, run the migration from
                  <code>supabase/migrations/001_cloudcraft.sql</code> first.
                </span>
              </div>
            )}
            <div className="cc-publish-footer">
              <span>
                <Layers3 /> The draft will be private until you publish it.
              </span>
              <Button type="submit" disabled={pending || loading}>
                {pending ? 'Creating draft…' : 'Continue to canvas'}
                <ArrowRight />
              </Button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
