'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Box, Check, Cloud, Database, GitPullRequest, Grid3X3, Minus, MousePointer2, Network, Plus, Redo2, Save, Search, Server, Share2, Undo2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type NodeData = { id:string; label:string; kind:string; tone:string; x:number; y:number; icon:'network'|'share'|'box'|'database'|'cloud'|'server'|'zap' };
const iconMap = { network:Network, share:Share2, box:Box, database:Database, cloud:Cloud, server:Server, zap:Zap };
const starterNodes:NodeData[] = [
  { id:'route',label:'Route 53',kind:'Edge',icon:'network',tone:'purple',x:10,y:45 },
  { id:'lb',label:'Load Balancer',kind:'Network',icon:'share',tone:'purple',x:29,y:45 },
  { id:'ecs',label:'ECS Fargate',kind:'Compute',icon:'box',tone:'orange',x:49,y:45 },
  { id:'aurora',label:'Aurora',kind:'Database',icon:'database',tone:'blue',x:69,y:45 },
  { id:'s3',label:'S3',kind:'Storage',icon:'cloud',tone:'green',x:87,y:45 },
];
const palette = [
  { label:'EC2',kind:'Compute',icon:'server' as const,tone:'orange' },
  { label:'Lambda',kind:'Compute',icon:'zap' as const,tone:'orange' },
  { label:'Aurora',kind:'Database',icon:'database' as const,tone:'blue' },
  { label:'S3 Bucket',kind:'Storage',icon:'cloud' as const,tone:'green' },
  { label:'Load Balancer',kind:'Network',icon:'share' as const,tone:'purple' },
];

declare global { interface Document { modelContext?: { registerTool:(tool:unknown, options?:{signal:AbortSignal})=>void|Promise<void> } } }

export function ArchitectureEditor({ onClose }:{ onClose:()=>void }) {
  const [nodes,setNodes] = useState<NodeData[]>(starterNodes);
  const [selected,setSelected] = useState('ecs');
  const [zoom,setZoom] = useState(100);
  const [saved,setSaved] = useState(true);
  const [prOpen,setPrOpen] = useState(false);
  const [prSent,setPrSent] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const addService = (service:typeof palette[number]) => {
    const id = `${service.label.toLowerCase().replace(/\s/g,'-')}-${Date.now()}`;
    setNodes(old=>[...old,{...service,id,x:50,y:68}]); setSelected(id); setSaved(false);
  };

  const moveNode = (id:string, clientX:number, clientY:number) => {
    const rect=canvasRef.current?.getBoundingClientRect(); if(!rect)return;
    const x=Math.max(5,Math.min(95,((clientX-rect.left)/rect.width)*100));
    const y=Math.max(12,Math.min(88,((clientY-rect.top)/rect.height)*100));
    setNodes(old=>old.map(n=>n.id===id?{...n,x,y}:n)); setSaved(false);
  };

  useEffect(()=>{
    const context=document.modelContext; if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    void Promise.resolve(context.registerTool({
      name:'add_architecture_service', title:'Add architecture service',
      description:'Add one supported cloud service to the visible architecture canvas.',
      inputSchema:{type:'object',properties:{service:{type:'string',enum:palette.map(item=>item.label)}},required:['service'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:false},
      execute(input:unknown){ const serviceName=(input as {service?:string})?.service; const service=palette.find(item=>item.label===serviceName); if(!service)throw new Error('Unsupported service'); addService(service); return {status:'added',service:service.label}; }
    },{signal:lifecycle.signal})).catch(()=>{});
    return()=>lifecycle.abort();
  },[]);

  return <main className="editor-shell">
    <header className="editor-topbar">
      <button className="editor-back" onClick={onClose} aria-label="Back to article"><ArrowLeft/></button>
      <div className="editor-title"><strong>Production topology</strong><span>Alex Kim / commerce-resilience</span></div>
      <span className="branch-pill">main</span><span className={`save-state ${saved?'saved':''}`}>{saved?<><Check/> Saved</>:<>Unsaved changes</>}</span>
      <div className="editor-spacer"/><Button variant="outline"><Share2/> Share</Button>
      <Dialog open={prOpen} onOpenChange={setPrOpen}><DialogTrigger render={<Button/>}><GitPullRequest/> Create pull request</DialogTrigger><DialogContent className="pr-dialog"><DialogHeader><DialogTitle>Propose your architecture changes</DialogTitle><DialogDescription>The original author will see your node changes and can review the new version.</DialogDescription></DialogHeader><label className="field-label">Title<Input defaultValue="Add scalable processing tier" /></label><label className="field-label">What changed?<Textarea defaultValue="Added a compute service to isolate order processing and make scaling independent." /></label><DialogFooter><Button variant="outline" onClick={()=>setPrOpen(false)}>Cancel</Button><Button onClick={()=>{setPrSent(true);setPrOpen(false)}}>Submit pull request</Button></DialogFooter></DialogContent></Dialog>
    </header>
    {prSent&&<div className="success-banner"><Check/> Pull request #19 submitted for review.<button onClick={()=>setPrSent(false)} aria-label="Dismiss"><X/></button></div>}
    <div className="editor-body">
      <aside className="service-library"><div className="library-heading"><strong>Cloud services</strong><small>Drag or click to add</small></div><div className="library-search"><Search/><input placeholder="Search services" /></div><div className="provider-tabs"><button className="active">AWS</button><button>Azure</button><button>GCP</button></div><span className="eyebrow">POPULAR</span><div className="palette-list">{palette.map(item=>{const Icon=iconMap[item.icon];return <button key={item.label} onClick={()=>addService(item)}><span className={`palette-icon ${item.tone}`}><Icon/></span><span><strong>{item.label}</strong><small>{item.kind}</small></span><Plus/></button>})}</div></aside>
      <section className="workspace">
        <div className="floating-tools"><button className="active" title="Select"><MousePointer2/></button><button title="Add connection"><Share2/></button><span/><button title="Undo"><Undo2/></button><button title="Redo"><Redo2/></button><span/><button title="Toggle grid"><Grid3X3/></button></div>
        <div ref={canvasRef} className="editor-canvas" style={{transform:`scale(${zoom/100})`}}>
          <div className="editor-account"><span>AWS · Production account · us-east-1</span><div className="editor-lanes"><span>EDGE</span><span>NETWORK</span><span>COMPUTE</span><span>DATA</span></div></div>
          <svg className="editor-lines" viewBox="0 0 1000 620" preserveAspectRatio="none">{nodes.slice(0,-1).map((node,index)=>{const next=nodes[index+1];return <path key={node.id} d={`M ${node.x*10+34} ${node.y*6.2} L ${next.x*10-34} ${next.y*6.2}`} />})}</svg>
          {nodes.map(node=>{const Icon=iconMap[node.icon];return <button key={node.id} className={`editor-node ${selected===node.id?'selected':''}`} style={{left:`${node.x}%`,top:`${node.y}%`}} onClick={()=>setSelected(node.id)} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);setSelected(node.id)}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))moveNode(node.id,e.clientX,e.clientY)}}><span className={`service-icon ${node.tone}`}><Icon/></span><strong>{node.label}</strong><small>{node.kind}</small></button>})}
        </div>
        <div className="zoom-control"><button onClick={()=>setZoom(z=>Math.max(60,z-10))}><Minus/></button><span>{zoom}%</span><button onClick={()=>setZoom(z=>Math.min(140,z+10))}><Plus/></button></div>
      </section>
      <aside className="properties-panel"><div className="properties-title"><strong>Properties</strong><button><X/></button></div>{nodes.filter(n=>n.id===selected).map(node=><div key={node.id} className="properties-content"><div className="selected-service"><span className={`service-icon ${node.tone}`}><span>{node.label.slice(0,2)}</span></span><div><strong>{node.label}</strong><small>AWS · {node.kind}</small></div></div><label className="field-label">Display name<Input value={node.label} onChange={e=>{setNodes(old=>old.map(n=>n.id===node.id?{...n,label:e.target.value}:n));setSaved(false)}} /></label><label className="field-label">Description<Textarea defaultValue="Handles production traffic for the commerce workload." /></label><div className="property-block"><strong>Reliability</strong><label><input type="checkbox" defaultChecked/> Multi-AZ enabled</label><label><input type="checkbox"/> Cross-region replica</label></div><Button onClick={()=>setSaved(true)} className="full-button"><Save/> Save version</Button></div>)}</aside>
    </div>
  </main>
}
