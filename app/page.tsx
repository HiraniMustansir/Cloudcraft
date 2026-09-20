'use client';

import { useState } from 'react';
import { ArrowLeft, Bell, Box, Cloud, Code2, Database, GitFork, Heart, MessageCircle, MoreHorizontal, Network, Play, Search, Share2, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArchitectureEditor } from './editor';

const services = [
  { id: 'route', label: 'Route 53', kind: 'Edge', icon: Network, tone: 'purple', x: 7, y: 38 },
  { id: 'lb', label: 'Load Balancer', kind: 'Network', icon: Share2, tone: 'purple', x: 27, y: 38 },
  { id: 'ecs', label: 'ECS Fargate', kind: 'Compute', icon: Box, tone: 'orange', x: 48, y: 38 },
  { id: 'aurora', label: 'Aurora', kind: 'Database', icon: Database, tone: 'blue', x: 70, y: 38 },
  { id: 's3', label: 'S3', kind: 'Storage', icon: Cloud, tone: 'green', x: 87, y: 38 },
];

const lines = [['route', 'lb'], ['lb', 'ecs'], ['ecs', 'aurora'], ['aurora', 's3']];

export default function Home() {
  const [liked, setLiked] = useState(false);
  const [forked, setForked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(['Would a regional replica be worth the added operational cost here?']);
  const [reviewed, setReviewed] = useState<'approved'|'rejected'|null>(null);

  if (editing) return <ArchitectureEditor onClose={() => setEditing(false)} />;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Cloud /></span><span>Cloudcraft</span></div>
        <nav className="main-nav" aria-label="Primary"><a className="active" href="#explore">Explore</a><a href="#following">Following</a><a href="#teams">Teams</a></nav>
        <div className="header-actions">
          <button className="search-pill" aria-label="Search"><Search /> <span>Search architectures</span><kbd>⌘ K</kbd></button>
          <button className="icon-button" aria-label="Notifications"><Bell /></button>
          <Button className="publish-button"><Sparkles /> Publish</Button>
          <span className="avatar">AK</span>
        </div>
      </header>

      <div className="page-shell">
        <aside className="rail">
          <a href="#explore" className="back-link"><ArrowLeft /> Discover</a>
          <div className="rail-section"><span className="eyebrow">In this post</span><a className="active" href="#challenge">The challenge</a><a href="#approach">The approach</a><a href="#architecture">Architecture</a><a href="#tradeoffs">Trade-offs</a></div>
          <div className="rail-section"><span className="eyebrow">Stack</span><div className="provider-list"><span className="provider aws">AWS</span><span>Amazon Web Services</span></div></div>
        </aside>

        <article className="article">
          <div className="article-meta"><span className="topic">PLATFORM ENGINEERING</span><span>8 min read</span><span>Updated Sep 18</span></div>
          <h1>Designing a resilient event-driven commerce platform</h1>
          <p className="dek">How we moved a high-traffic checkout flow from a fragile monolith to a fault-tolerant architecture without slowing down product teams.</p>
          <div className="author-row">
            <span className="avatar large">AK</span><div><strong>Alex Kim</strong><span>Principal Cloud Architect · Northstar Labs</span></div>
            <Button variant="outline" size="sm">Follow</Button><button className="more-button" aria-label="More options"><MoreHorizontal /></button>
          </div>

          <section id="challenge" className="prose-section"><h2>The challenge</h2><p>During peak campaigns, synchronous checkout requests created cascading failures across inventory, payments, and fulfillment. We needed to isolate failure domains and give each team an independently deployable surface.</p></section>

          <section id="architecture" className="architecture-section">
            <div className="section-heading"><div><span className="eyebrow">LIVE ARCHITECTURE</span><h2>Production topology</h2></div><div className="section-actions"><Button variant="outline" onClick={() => setForked(true)}><GitFork /> {forked ? 'Forked' : 'Fork'}</Button><Button onClick={() => setEditing(true)}><Play /> Open editor</Button></div></div>
            <Tabs defaultValue="canvas" className="architecture-tabs">
              <TabsList variant="line"><TabsTrigger value="canvas">Architecture</TabsTrigger><TabsTrigger value="discussion">Discussion <span className="count">12</span></TabsTrigger><TabsTrigger value="versions">Versions <span className="count">8</span></TabsTrigger></TabsList>
              <TabsContent value="canvas">
                <div className="canvas-card">
                  <div className="canvas-toolbar"><div><span className="status-dot" /> main <span className="version">v2.4</span></div><div className="collaborators"><span>+3</span><span className="avatar tiny">MO</span><span className="avatar tiny coral">SL</span></div></div>
                  <div className="diagram-canvas">
                    <div className="account-boundary"><span>AWS · Production account</span><div className="lane-labels"><span>EDGE</span><span>NETWORK</span><span>COMPUTE</span><span>DATA</span></div></div>
                    <svg className="connectors" viewBox="0 0 1000 360" preserveAspectRatio="none" aria-hidden="true">
                      {lines.map(([a,b]) => { const from=services.find(s=>s.id===a)!; const to=services.find(s=>s.id===b)!; return <path key={a} d={`M ${from.x*10+48} ${from.y*3.6+34} L ${to.x*10-10} ${to.y*3.6+34}`} />; })}
                    </svg>
                    {services.map(({id,label,kind,icon:Icon,tone,x,y}) => <div key={id} className="service-node" style={{left:`${x}%`,top:`${y}%`}}><span className={`service-icon ${tone}`}><Icon /></span><strong>{label}</strong><small>{kind}</small></div>)}
                    <div className="event-note"><Code2 /><div><strong>Order events</strong><span>Async · encrypted</span></div></div>
                  </div>
                  <div className="canvas-caption"><span><Users /> 4 collaborators viewing</span><span>Last saved 2 min ago</span></div>
                </div>
              </TabsContent>
              <TabsContent value="discussion"><div className="discussion-panel"><div className="discussion-heading"><MessageCircle/><div><strong>Architecture discussion</strong><span>Ask questions and challenge design decisions.</span></div></div>{comments.map((item,index)=><div className="comment" key={`${item}-${index}`}><span className="avatar tiny coral">{index?'AK':'MO'}</span><div><strong>{index?'Alex Kim':'Maya Ortiz'} <small>{index?'now':'2h'}</small></strong><p>{item}</p></div></div>)}<div className="comment-composer"><Textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add to the discussion…"/><Button disabled={!comment.trim()} onClick={()=>{setComments(old=>[...old,comment.trim()]);setComment('')}}>Comment</Button></div></div></TabsContent>
              <TabsContent value="versions"><div className="version-list"><div><span className="version-dot"/><strong>v2.4</strong><span>Added regional failover</span><small>2 hours ago</small></div><div><span className="version-dot muted"/><strong>v2.3</strong><span>Switched workers to Fargate</span><small>3 days ago</small></div></div></TabsContent>
            </Tabs>
          </section>

          <section id="approach" className="prose-section"><h2>The approach</h2><p>The critical shift was treating the order event as the contract. Edge traffic terminates behind Route 53 and a load balancer, while stateless tasks handle validation before persisting durable state in Aurora.</p></section>
        </article>

        <aside className="context-panel">
          <div className="engagement"><button onClick={() => setLiked(!liked)} className={liked ? 'liked' : ''}><Heart /> <span>{liked ? 185 : 184}</span></button><button><MessageCircle /> <span>12</span></button><button><Share2 /></button></div>
          <div className="context-card"><span className="eyebrow">ARCHITECTURE HEALTH</span><div className="health-score"><span>92</span><div><strong>Well-architected</strong><small>7 checks passed</small></div></div><div className="health-row"><span>Reliability</span><strong>A</strong></div><div className="health-row"><span>Security</span><strong>A−</strong></div><div className="health-row"><span>Cost efficiency</span><strong>B+</strong></div></div>
          <div className="context-card"><span className="eyebrow">{reviewed ? 'CONTRIBUTION REVIEWED' : 'OPEN CONTRIBUTION'}</span><div className="pr-title"><GitFork /><div><strong>Add multi-region failover</strong><span>#18 by Maya Ortiz</span></div></div><div className="diff"><span>+3 services</span><span>−1 connection</span></div>{reviewed?<div className={`review-result ${reviewed}`}>{reviewed==='approved'?'Approved for merge':'Changes declined'}</div>:<Dialog><DialogTrigger render={<Button variant="outline" className="full-button"/>}>Review changes</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Review pull request #18</DialogTitle><DialogDescription>Maya added a failover region, Route 53 health checks, and a read replica. One direct database connection was removed.</DialogDescription></DialogHeader><div className="review-summary"><span><strong>+3</strong> services</span><span><strong>−1</strong> connection</span><span><strong>2</strong> files</span></div><DialogFooter><Button variant="destructive" onClick={()=>setReviewed('rejected')}>Reject</Button><Button onClick={()=>setReviewed('approved')}>Approve changes</Button></DialogFooter></DialogContent></Dialog>}</div>
        </aside>
      </div>
    </main>
  );
}
