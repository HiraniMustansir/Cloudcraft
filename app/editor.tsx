'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Cpu,
  Database,
  GitPullRequest,
  Globe2,
  GripVertical,
  Grid3X3,
  HardDrive,
  Layers3,
  Minus,
  MousePointer2,
  Network,
  Plus,
  RadioTower,
  Redo2,
  Save,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  SquareDashed,
  Trash2,
  Undo2,
  Workflow,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  awsCategories,
  awsServices,
  type CloudService,
  type ServiceIcon,
} from './aws-services';
import type { DiagramDocument } from '@/lib/cloudcraft-types';

type NodeData = CloudService & {
  id: string;
  x: number;
  y: number;
  subnetId?: string;
  size: number;
};
type GroupType = 'section' | 'vpc' | 'az' | 'public-subnet' | 'private-subnet';
type SectionTheme = 'neutral' | 'blue' | 'green' | 'amber' | 'purple';
type GroupData = {
  id: string;
  label: string;
  type: GroupType;
  x: number;
  y: number;
  w: number;
  h: number;
  theme: SectionTheme;
};
type ConnectionKind =
  | 'data'
  | 'nat'
  | 'vpn'
  | 'peering'
  | 'transit'
  | 'direct-connect'
  | 'vpc-endpoint'
  | 'internet-gateway'
  | 'internet'
  | 'custom';
type Connection = {
  id: string;
  from: string;
  to: string;
  kind: ConnectionKind;
  label: string;
};

const connectionKinds: Array<{ value: ConnectionKind; label: string }> = [
  { value: 'data', label: 'Data flow' },
  { value: 'nat', label: 'NAT route' },
  { value: 'vpn', label: 'VPN tunnel' },
  { value: 'peering', label: 'VPC peering' },
  { value: 'transit', label: 'Transit Gateway route' },
  { value: 'direct-connect', label: 'Direct Connect' },
  { value: 'vpc-endpoint', label: 'VPC Endpoint' },
  { value: 'internet-gateway', label: 'Internet Gateway path' },
  { value: 'internet', label: 'Internet route' },
  { value: 'custom', label: 'Custom connection' },
];

const iconMap: Record<ServiceIcon, typeof Cpu> = {
  compute: Cpu,
  database: Database,
  storage: HardDrive,
  network: Network,
  security: ShieldCheck,
  analytics: Grid3X3,
  integration: Workflow,
  management: Settings2,
  ai: BrainCircuit,
  iot: RadioTower,
  developer: Code2,
  business: BriefcaseBusiness,
};

const infrastructure: Array<CloudService & { structure?: GroupType }> = [
  {
    label: 'Named Section',
    category: 'Custom service group',
    icon: 'management',
    tone: 'slate',
    structure: 'section',
  },
  {
    label: 'VPC',
    category: 'Network boundary',
    icon: 'network',
    tone: 'purple',
    structure: 'vpc',
  },
  {
    label: 'Availability Zone',
    category: 'Network boundary',
    icon: 'network',
    tone: 'slate',
    structure: 'az',
  },
  {
    label: 'Public Subnet',
    category: 'Internet-facing tier',
    icon: 'network',
    tone: 'public',
    structure: 'public-subnet',
  },
  {
    label: 'Private Subnet',
    category: 'Isolated tier',
    icon: 'security',
    tone: 'private',
    structure: 'private-subnet',
  },
  {
    label: 'NAT Gateway',
    category: 'Networking',
    icon: 'network',
    tone: 'purple',
  },
  {
    label: 'Internet Gateway',
    category: 'Networking',
    icon: 'network',
    tone: 'purple',
  },
  {
    label: 'Route Table',
    category: 'Networking',
    icon: 'network',
    tone: 'purple',
  },
  { label: 'Network ACL', category: 'Security', icon: 'security', tone: 'red' },
  {
    label: 'Security Group',
    category: 'Security',
    icon: 'security',
    tone: 'red',
  },
  {
    label: 'VPC Endpoint',
    category: 'Networking',
    icon: 'network',
    tone: 'purple',
  },
  {
    label: 'Customer / Web Browser',
    category: 'Workflow actor',
    icon: 'business',
    tone: 'slate',
  },
  {
    label: 'External System',
    category: 'Workflow actor',
    icon: 'integration',
    tone: 'slate',
  },
  {
    label: 'Email Recipient',
    category: 'Workflow outcome',
    icon: 'business',
    tone: 'green',
  },
];

const starterGroups: GroupData[] = [];
const starterNodes: NodeData[] = [];
const starterConnections: Connection[] = [];

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: unknown,
        options?: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
  }
}

type ArchitectureEditorProps = {
  onClose: () => void;
  title?: string;
  ownerLabel?: string;
  status?: 'draft' | 'published';
  initialDiagram?: DiagramDocument;
  onSave?: (diagram: DiagramDocument) => Promise<void>;
  onPublish?: (diagram: DiagramDocument) => Promise<void>;
  onSubmitPullRequest?: (input: {
    title: string;
    description: string;
    diagram: DiagramDocument;
  }) => Promise<void>;
};

export function ArchitectureEditor({
  onClose,
  title = 'Production topology',
  ownerLabel = 'Your architecture',
  status = 'draft',
  initialDiagram,
  onSave,
  onPublish,
  onSubmitPullRequest,
}: ArchitectureEditorProps) {
  const [nodes, setNodes] = useState<NodeData[]>(
    (initialDiagram?.nodes as NodeData[] | undefined) ?? starterNodes,
  );
  const [groups, setGroups] = useState<GroupData[]>(
    (initialDiagram?.groups as GroupData[] | undefined) ?? starterGroups,
  );
  const [connections, setConnections] = useState<Connection[]>(
    (initialDiagram?.connections as Connection[] | undefined) ??
      starterConnections,
  );
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [libraryMode, setLibraryMode] = useState<'services' | 'network'>(
    'services',
  );
  const [zoom, setZoom] = useState(100);
  const [saved, setSaved] = useState(true);
  const [connectMode, setConnectMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [prOpen, setPrOpen] = useState(false);
  const [prSent, setPrSent] = useState(false);
  const [prTitle, setPrTitle] = useState('Improve architecture design');
  const [prDescription, setPrDescription] = useState('');
  const [prSubmitting, setPrSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);
  const groupDragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const resizeRef = useRef<{
    kind: 'group' | 'node';
    id: string;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const visibleServices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return awsServices.filter(
      (service) =>
        (category === 'All' || service.category === category) &&
        (!needle ||
          `${service.label} ${service.category}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [query, category]);

  const selectedNode = nodes.find((node) => node.id === selected);
  const selectedGroup = groups.find((group) => group.id === selected);
  const selectedConnection = connections.find((line) => line.id === selected);

  const diagram = (): DiagramDocument => ({
    nodes,
    groups,
    connections,
  });

  const persistDiagram = async (publish = false) => {
    setSaving(true);
    setSaveError('');
    try {
      if (publish && onPublish) await onPublish(diagram());
      else if (onSave) await onSave(diagram());
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Could not save architecture.',
      );
    } finally {
      setSaving(false);
    }
  };

  const canvasPoint = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };
    return {
      x: Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(3, Math.min(97, ((clientY - rect.top) / rect.height) * 100)),
    };
  };

  const addService = useCallback(
    (service: CloudService, point?: { x: number; y: number }) => {
      const id = `${service.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nodes.length + 1}`;
      const target = point ?? {
        x: 35 + (nodes.length % 5) * 11,
        y: 35 + Math.floor(nodes.length / 5) * 15,
      };
      const placement = groups
        .filter(
          (item) =>
            target.x >= item.x &&
            target.x <= item.x + item.w &&
            target.y >= item.y &&
            target.y <= item.y + item.h,
        )
        .sort((a, b) => a.w * a.h - b.w * b.h)[0];
      setNodes((old) => [
        ...old,
        {
          ...service,
          id,
          x: target.x,
          y: target.y,
          subnetId: placement?.id,
          size: 100,
        },
      ]);
      setSelected(id);
      setSaved(false);
    },
    [groups, nodes.length],
  );

  const addStructure = (
    item: (typeof infrastructure)[number],
    point?: { x: number; y: number },
  ) => {
    if (!item.structure) return addService(item, point);
    const sameType = groups.filter(
      (group) => group.type === item.structure,
    ).length;
    const id = `${item.structure}-${groups.length + 1}`;
    const isSubnet = item.structure.includes('subnet');
    const isSection = item.structure === 'section';
    const target = point ?? {
      x: 48 + (sameType % 3) * 5,
      y: 46 + (sameType % 3) * 5,
    };
    setGroups((old) => [
      ...old,
      {
        id,
        type: item.structure!,
        label: isSection
          ? `Service section ${sameType + 1}`
          : `${item.label} ${sameType + 1}`,
        x: Math.max(
          1,
          target.x -
            (isSubnet
              ? 18
              : isSection
                ? 17
                : item.structure === 'az'
                  ? 32
                  : 38),
        ),
        y: Math.max(
          3,
          target.y -
            (isSubnet
              ? 10
              : isSection
                ? 17
                : item.structure === 'az'
                  ? 24
                  : 30),
        ),
        w: isSubnet ? 36 : isSection ? 34 : item.structure === 'az' ? 64 : 76,
        h: isSubnet ? 22 : isSection ? 34 : item.structure === 'az' ? 48 : 60,
        theme: isSection
          ? 'neutral'
          : item.structure === 'private-subnet'
            ? 'green'
            : item.structure === 'public-subnet'
              ? 'blue'
              : 'neutral',
      },
    ]);
    setSelected(id);
    setSaved(false);
  };

  const moveGroup = (id: string, clientX: number, clientY: number) => {
    const drag = groupDragRef.current;
    if (!drag || drag.id !== id) return;
    const point = canvasPoint(clientX, clientY);
    setGroups((old) =>
      old.map((group) =>
        group.id === id
          ? {
              ...group,
              x: Math.max(0, Math.min(100 - group.w, point.x - drag.offsetX)),
              y: Math.max(0, Math.min(100 - group.h, point.y - drag.offsetY)),
            }
          : group,
      ),
    );
    setSaved(false);
  };

  const resizeSelection = (clientX: number, clientY: number) => {
    const resize = resizeRef.current;
    if (!resize) return;
    if (resize.kind === 'group') {
      const point = canvasPoint(clientX, clientY);
      setGroups((old) =>
        old.map((group) =>
          group.id === resize.id
            ? {
                ...group,
                w: Math.max(
                  12,
                  Math.min(
                    100 - group.x,
                    resize.startW + point.x - resize.startX,
                  ),
                ),
                h: Math.max(
                  10,
                  Math.min(
                    100 - group.y,
                    resize.startH + point.y - resize.startY,
                  ),
                ),
              }
            : group,
        ),
      );
    } else {
      const delta = Math.max(clientX - resize.startX, clientY - resize.startY);
      setNodes((old) =>
        old.map((node) =>
          node.id === resize.id
            ? {
                ...node,
                size: Math.max(60, Math.min(180, resize.startW + delta)),
              }
            : node,
        ),
      );
    }
    setSaved(false);
  };

  const handleCanvasDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('application/cloudcraft');
    if (!raw) return;
    const payload = JSON.parse(raw) as {
      kind: 'service' | 'structure';
      item: CloudService & { structure?: GroupType };
    };
    const point = canvasPoint(event.clientX, event.clientY);
    if (payload.kind === 'structure') addStructure(payload.item, point);
    else addService(payload.item, point);
  };

  const endpointPoint = (id: string) => {
    const node = nodes.find((item) => item.id === id);
    if (node) return { x: node.x * 10, y: node.y * 6.2 };
    const group = groups.find((item) => item.id === id);
    if (group)
      return {
        x: (group.x + group.w / 2) * 10,
        y: (group.y + group.h / 2) * 6.2,
      };
    return { x: 0, y: 0 };
  };

  const connectEndpoint = (id: string) => {
    if (!connectMode) return setSelected(id);
    if (!connectionStart) {
      setConnectionStart(id);
      setSelected(id);
      return;
    }
    if (connectionStart !== id) {
      const connectionId = `connection-${connections.length + 1}`;
      setConnections((old) => [
        ...old,
        {
          id: connectionId,
          from: connectionStart,
          to: id,
          kind: 'data',
          label: 'Data flow',
        },
      ]);
      setSaved(false);
      setSelected(connectionId);
    }
    setConnectionStart(null);
    setConnectMode(false);
    if (connectionStart === id) setSelected(id);
  };

  const moveNode = (id: string, clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(
      4,
      Math.min(96, ((clientX - rect.left) / rect.width) * 100),
    );
    const y = Math.max(
      8,
      Math.min(92, ((clientY - rect.top) / rect.height) * 100),
    );
    setNodes((old) =>
      old.map((node) => (node.id === id ? { ...node, x, y } : node)),
    );
    setSaved(false);
  };

  const settleNode = (id: string) => {
    setNodes((old) =>
      old.map((node) => {
        if (node.id !== id) return node;
        const placement = groups
          .filter(
            (group) =>
              node.x >= group.x &&
              node.x <= group.x + group.w &&
              node.y >= group.y &&
              node.y <= group.y + group.h,
          )
          .sort((a, b) => a.w * a.h - b.w * b.h)[0];
        return { ...node, subnetId: placement?.id };
      }),
    );
  };

  const removeSelected = () => {
    setNodes((old) => old.filter((node) => node.id !== selected));
    setGroups((old) => old.filter((group) => group.id !== selected));
    setConnections((old) =>
      old.filter(
        (line) =>
          line.id !== selected &&
          line.from !== selected &&
          line.to !== selected,
      ),
    );
    setSelected('');
    setSaved(false);
  };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'add_aws_architecture_service',
          title: 'Add AWS architecture service',
          description:
            'Add one AWS service from the architecture catalog to the visible canvas.',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                enum: awsServices.map((item) => item.label),
              },
            },
            required: ['service'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const name = (input as { service?: string })?.service;
            const service = awsServices.find((item) => item.label === name);
            if (!service) throw new Error('Unsupported service');
            addService(service);
            return { status: 'added', service: service.label };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, [addService]);

  return (
    <main className="editor-shell">
      <header className="editor-topbar">
        <button
          className="editor-back"
          onClick={onClose}
          aria-label="Back to article"
        >
          <ArrowLeft />
        </button>
        <div className="editor-title">
          <strong>{title}</strong>
          <span>{ownerLabel}</span>
        </div>
        <span className="branch-pill">main</span>
        <span className={`save-state ${saved ? 'saved' : ''}`}>
          {saved ? (
            <>
              <Check /> Saved
            </>
          ) : (
            <>Unsaved changes</>
          )}
        </span>
        <div className="editor-spacer" />
        <Button
          variant="outline"
          onClick={() =>
            void navigator.clipboard.writeText(window.location.href)
          }
        >
          <Share2 /> Share
        </Button>
        <Button
          variant="outline"
          disabled={saving || (saved && Boolean(onSave))}
          onClick={() => void persistDiagram(false)}
        >
          <Save /> {saving ? 'Saving…' : 'Save version'}
        </Button>
        {onPublish && status === 'draft' && (
          <Button disabled={saving} onClick={() => void persistDiagram(true)}>
            <Cloud /> Publish
          </Button>
        )}
        {onSubmitPullRequest && (
          <Dialog open={prOpen} onOpenChange={setPrOpen}>
            <DialogTrigger render={<Button />}>
              <GitPullRequest /> Create pull request
            </DialogTrigger>
            <DialogContent className="pr-dialog">
              <DialogHeader>
                <DialogTitle>Propose your architecture changes</DialogTitle>
                <DialogDescription>
                  The original author will see your network boundaries, service
                  placement, and new connections.
                </DialogDescription>
              </DialogHeader>
              <label className="field-label" htmlFor="pr-title">
                Title
                <Input
                  id="pr-title"
                  value={prTitle}
                  onChange={(event) => setPrTitle(event.target.value)}
                />
              </label>
              <label className="field-label" htmlFor="pr-description">
                What changed?
                <Textarea
                  id="pr-description"
                  value={prDescription}
                  onChange={(event) => setPrDescription(event.target.value)}
                  placeholder="Explain the architecture changes and why they improve the design."
                />
              </label>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPrOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={prSubmitting || prTitle.trim().length < 3}
                  onClick={() => {
                    setPrSubmitting(true);
                    void onSubmitPullRequest({
                      title: prTitle.trim(),
                      description: prDescription.trim(),
                      diagram: diagram(),
                    })
                      .then(() => {
                        setPrSent(true);
                        setPrOpen(false);
                      })
                      .catch((error: unknown) =>
                        setSaveError(
                          error instanceof Error
                            ? error.message
                            : 'Could not submit pull request.',
                        ),
                      )
                      .finally(() => setPrSubmitting(false));
                  }}
                >
                  {prSubmitting ? 'Submitting…' : 'Submit pull request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>
      {prSent && (
        <div className="success-banner">
          <Check /> Pull request #19 submitted for review.
          <button onClick={() => setPrSent(false)} aria-label="Dismiss">
            <X />
          </button>
        </div>
      )}
      {saveError && (
        <div className="success-banner error-banner">
          {saveError}
          <button onClick={() => setSaveError('')} aria-label="Dismiss">
            <X />
          </button>
        </div>
      )}
      <div className="editor-body">
        <aside className="service-library">
          <div className="library-heading">
            <strong>Architecture library</strong>
            <small>
              {awsServices.length} AWS services + network primitives
            </small>
          </div>
          <div className="library-switch">
            <button
              className={libraryMode === 'services' ? 'active' : ''}
              onClick={() => setLibraryMode('services')}
            >
              <Cloud /> Services
            </button>
            <button
              className={libraryMode === 'network' ? 'active' : ''}
              onClick={() => setLibraryMode('network')}
            >
              <SquareDashed /> Network
            </button>
          </div>
          {libraryMode === 'services' ? (
            <>
              <div className="library-search">
                <Search />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search 320 AWS services"
                />
              </div>
              <div className="category-select">
                <select
                  aria-label="Filter AWS services by category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {awsCategories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <ChevronDown />
              </div>
              <div className="library-results-meta">
                <span>{visibleServices.length} results</span>
                <button
                  onClick={() => {
                    setQuery('');
                    setCategory('All');
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="palette-list catalog-list">
                {visibleServices.map((item) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <button
                      key={item.label}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'copy';
                        event.dataTransfer.setData(
                          'application/cloudcraft',
                          JSON.stringify({ kind: 'service', item }),
                        );
                      }}
                      onClick={() => addService(item)}
                    >
                      <span className={`palette-icon ${item.tone}`}>
                        <Icon />
                      </span>
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.category}</small>
                      </span>
                      <Plus />
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="network-help">
                Drag a Named Section to organize a workflow, or add network
                boundaries for deployment detail. Every box and resource can be
                connected with a labeled arrow.
              </p>
              <span className="eyebrow">BOUNDARIES & ROUTING</span>
              <div className="palette-list network-list">
                {infrastructure.map((item) => {
                  const Icon = item.structure ? Layers3 : iconMap[item.icon];
                  return (
                    <button
                      key={item.label}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'copy';
                        event.dataTransfer.setData(
                          'application/cloudcraft',
                          JSON.stringify({ kind: 'structure', item }),
                        );
                      }}
                      onClick={() => addStructure(item)}
                    >
                      <span className={`palette-icon ${item.tone}`}>
                        <Icon />
                      </span>
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.category}</small>
                      </span>
                      <Plus />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </aside>
        <section className="workspace">
          <div className="floating-tools">
            <button
              className={!connectMode ? 'active' : ''}
              onClick={() => {
                setConnectMode(false);
                setConnectionStart(null);
              }}
              title="Select"
            >
              <MousePointer2 />
            </button>
            <button
              className={connectMode ? 'active connect-active' : ''}
              onClick={() => {
                setConnectMode((value) => !value);
                setConnectionStart(null);
              }}
              title="Connect resources"
            >
              <Share2 />
            </button>
            <span />
            <button disabled title="Undo">
              <Undo2 />
            </button>
            <button disabled title="Redo">
              <Redo2 />
            </button>
            <span />
            <button title="Toggle grid">
              <Grid3X3 />
            </button>
          </div>
          {connectMode && (
            <div className="connect-hint">
              {connectionStart
                ? 'Select a destination'
                : 'Select a service or subnet to start'}{' '}
              <button
                onClick={() => {
                  setConnectMode(false);
                  setConnectionStart(null);
                }}
              >
                Cancel
              </button>
            </div>
          )}
          <div
            ref={canvasRef}
            className="editor-canvas subnet-canvas"
            aria-label="Cloud architecture canvas"
            style={{ transform: `scale(${zoom / 100})` }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'copy';
            }}
            onDrop={handleCanvasDrop}
          >
            {!nodes.length && !groups.length && (
              <div className="blank-canvas-guide">
                <SquareDashed />
                <strong>Start with a blank architecture</strong>
                <span>
                  Drag a named section, VPC, subnet, or AWS service here from
                  the library.
                </span>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setLibraryMode('network');
                  }}
                >
                  Open network library
                </button>
              </div>
            )}
            <svg
              className="editor-lines"
              viewBox="0 0 1000 620"
              preserveAspectRatio="none"
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
              </defs>
              {connections.map((line) => {
                const from = endpointPoint(line.from);
                const to = endpointPoint(line.to);
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                return (
                  <g key={line.id}>
                    <path
                      className={`connection-line connection-${line.kind} ${selected === line.id ? 'selected' : ''}`}
                      d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                      markerEnd="url(#arrow)"
                    />
                    <path
                      className="connection-hit"
                      d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(line.id);
                      }}
                    />
                    <text x={midX} y={midY - 8}>
                      {line.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            {[...groups]
              .sort((a, b) => b.w * b.h - a.w * a.h)
              .map((group) => (
                <div
                  key={group.id}
                  className={`network-group ${group.type} theme-${group.theme} ${selected === group.id ? 'selected' : ''}`}
                  style={{
                    left: `${group.x}%`,
                    top: `${group.y}%`,
                    width: `${group.w}%`,
                    height: `${group.h}%`,
                  }}
                  onPointerDown={(event) => {
                    if (connectMode || event.target !== event.currentTarget)
                      return;
                    event.preventDefault();
                    const point = canvasPoint(event.clientX, event.clientY);
                    groupDragRef.current = {
                      id: group.id,
                      offsetX: point.x - group.x,
                      offsetY: point.y - group.y,
                    };
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setSelected(group.id);
                  }}
                  onPointerMove={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId))
                      moveGroup(group.id, event.clientX, event.clientY);
                  }}
                  onPointerUp={() => {
                    groupDragRef.current = null;
                  }}
                >
                  <button
                    type="button"
                    className="group-label"
                    onPointerDown={(event) => {
                      if (connectMode) return;
                      event.preventDefault();
                      const point = canvasPoint(event.clientX, event.clientY);
                      groupDragRef.current = {
                        id: group.id,
                        offsetX: point.x - group.x,
                        offsetY: point.y - group.y,
                      };
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setSelected(group.id);
                    }}
                    onPointerMove={(event) => {
                      if (
                        event.currentTarget.hasPointerCapture(event.pointerId)
                      )
                        moveGroup(group.id, event.clientX, event.clientY);
                    }}
                    onPointerUp={() => {
                      groupDragRef.current = null;
                    }}
                    onPointerCancel={() => {
                      groupDragRef.current = null;
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      connectEndpoint(group.id);
                    }}
                  >
                    <GripVertical className="group-drag-icon" />
                    <span className="group-icon">
                      {group.type === 'public-subnet' ? (
                        <Globe2 />
                      ) : group.type === 'private-subnet' ? (
                        <ShieldCheck />
                      ) : (
                        <Layers3 />
                      )}
                    </span>
                    <div>
                      <strong>{group.label}</strong>
                      <small>{group.type.replace('-', ' ')}</small>
                    </div>
                    {connectMode && (
                      <span
                        className={`connection-port ${connectionStart === group.id ? 'armed' : ''}`}
                      />
                    )}
                  </button>
                  {selected === group.id && (
                    <button
                      type="button"
                      className="group-resize-handle"
                      aria-label={`Resize ${group.label}`}
                      title="Drag to resize"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        const point = canvasPoint(event.clientX, event.clientY);
                        resizeRef.current = {
                          kind: 'group',
                          id: group.id,
                          startX: point.x,
                          startY: point.y,
                          startW: group.w,
                          startH: group.h,
                        };
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                      onPointerMove={(event) => {
                        if (
                          event.currentTarget.hasPointerCapture(event.pointerId)
                        )
                          resizeSelection(event.clientX, event.clientY);
                      }}
                      onPointerUp={() => {
                        resizeRef.current = null;
                      }}
                    />
                  )}
                </div>
              ))}
            {nodes.map((node) => {
              const Icon = iconMap[node.icon];
              const subnet = groups.find((group) => group.id === node.subnetId);
              const placementLabel = subnet
                ? subnet.type === 'private-subnet'
                  ? 'Private subnet'
                  : subnet.type === 'public-subnet'
                    ? 'Public subnet'
                    : subnet.type === 'section'
                      ? 'Named section'
                      : subnet.type === 'az'
                        ? 'Availability Zone'
                        : 'VPC'
                : node.category;
              return (
                <button
                  key={node.id}
                  className={`editor-node ${selected === node.id ? 'selected' : ''} ${connectionStart === node.id ? 'connection-source' : ''}`}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    width: `${96 * (node.size / 100)}px`,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    connectEndpoint(node.id);
                  }}
                  onPointerDown={(event) => {
                    if (connectMode) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setSelected(node.id);
                  }}
                  onPointerMove={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId))
                      moveNode(node.id, event.clientX, event.clientY);
                  }}
                  onPointerUp={() => settleNode(node.id)}
                >
                  <span
                    className={`service-icon ${node.tone}`}
                    style={{
                      width: `${48 * (node.size / 100)}px`,
                      height: `${48 * (node.size / 100)}px`,
                    }}
                  >
                    <Icon />
                  </span>
                  <strong style={{ fontSize: `${10 * (node.size / 100)}px` }}>
                    {node.label}
                  </strong>
                  <small>{placementLabel}</small>
                  {selected === node.id && (
                    <span
                      className="node-resize-handle"
                      aria-hidden="true"
                      title="Drag to resize"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        resizeRef.current = {
                          kind: 'node',
                          id: node.id,
                          startX: event.clientX,
                          startY: event.clientY,
                          startW: node.size,
                          startH: node.size,
                        };
                        event.currentTarget.setPointerCapture(event.pointerId);
                      }}
                      onPointerMove={(event) => {
                        if (
                          event.currentTarget.hasPointerCapture(event.pointerId)
                        )
                          resizeSelection(event.clientX, event.clientY);
                      }}
                      onPointerUp={(event) => {
                        event.stopPropagation();
                        resizeRef.current = null;
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div className="canvas-legend">
            <span>
              <i className="public-key" /> Public subnet
            </span>
            <span>
              <i className="private-key" /> Private subnet
            </span>
            <span>
              <i className="route-key" /> Routed connection
            </span>
          </div>
          <div className="zoom-control">
            <button
              onClick={() => setZoom((value) => Math.max(60, value - 10))}
            >
              <Minus />
            </button>
            <span>{zoom}%</span>
            <button
              onClick={() => setZoom((value) => Math.min(140, value + 10))}
            >
              <Plus />
            </button>
          </div>
        </section>
        <aside className="properties-panel">
          <div className="properties-title">
            <strong>Properties</strong>
            {selected && (
              <button onClick={removeSelected} title="Delete selected">
                <Trash2 />
              </button>
            )}
          </div>
          {selectedNode && (
            <div className="properties-content">
              <div className="selected-service">
                <span className={`service-icon ${selectedNode.tone}`}>
                  {(() => {
                    const Icon = iconMap[selectedNode.icon];
                    return <Icon />;
                  })()}
                </span>
                <div>
                  <strong>{selectedNode.label}</strong>
                  <small>AWS · {selectedNode.category}</small>
                </div>
              </div>
              <label className="field-label" htmlFor="service-display-name">
                Display name
                <Input
                  id="service-display-name"
                  value={selectedNode.label}
                  onChange={(event) => {
                    setNodes((old) =>
                      old.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, label: event.target.value }
                          : node,
                      ),
                    );
                    setSaved(false);
                  }}
                />
              </label>
              <label className="field-label" htmlFor="service-placement">
                Section or network boundary
                <select
                  id="service-placement"
                  className="property-select"
                  value={selectedNode.subnetId ?? ''}
                  onChange={(event) => {
                    setNodes((old) =>
                      old.map((node) =>
                        node.id === selectedNode.id
                          ? {
                              ...node,
                              subnetId: event.target.value || undefined,
                            }
                          : node,
                      ),
                    );
                    setSaved(false);
                  }}
                >
                  <option value="">Outside a section or boundary</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.label}
                    </option>
                  ))}
                </select>
              </label>
              <div
                className={`placement-card ${groups.find((group) => group.id === selectedNode.subnetId)?.type ?? 'unplaced'}`}
              >
                <ShieldCheck />
                <div>
                  <strong>
                    {selectedNode.subnetId
                      ? groups.find(
                          (group) => group.id === selectedNode.subnetId,
                        )?.label
                      : 'No section assigned'}
                  </strong>
                  <span>
                    Drag the service into any section or network boundary to
                    update placement.
                  </span>
                </div>
              </div>
              <label className="field-label" htmlFor="service-description">
                Description
                <Textarea
                  id="service-description"
                  defaultValue="Architecture component for the production workload."
                />
              </label>
              <div className="size-control">
                <div>
                  <strong>Service size</strong>
                  <span>{Math.round(selectedNode.size)}%</span>
                </div>
                <Slider
                  value={[selectedNode.size]}
                  min={60}
                  max={180}
                  step={5}
                  onValueChange={(value) => {
                    const nextSize =
                      typeof value === 'number' ? value : value[0];
                    setNodes((old) =>
                      old.map((node) =>
                        node.id === selectedNode.id
                          ? { ...node, size: nextSize }
                          : node,
                      ),
                    );
                    setSaved(false);
                  }}
                />
              </div>
              <Button
                onClick={() => void persistDiagram(false)}
                className="full-button"
                disabled={saving}
              >
                <Save /> Save version
              </Button>
              <Button
                variant="destructive"
                onClick={removeSelected}
                className="full-button delete-button"
              >
                <Trash2 /> Delete service
              </Button>
            </div>
          )}
          {selectedGroup && (
            <div className="properties-content">
              <div className="selected-service">
                <span className={`service-icon ${selectedGroup.type}`}>
                  <Layers3 />
                </span>
                <div>
                  <strong>{selectedGroup.label}</strong>
                  <small>
                    {selectedGroup.type === 'section'
                      ? 'Custom section'
                      : `Network · ${selectedGroup.type.replace('-', ' ')}`}
                  </small>
                </div>
              </div>
              <label className="field-label" htmlFor="group-name">
                {selectedGroup.type === 'section'
                  ? 'Section name'
                  : 'Name and CIDR'}
                <Input
                  id="group-name"
                  value={selectedGroup.label}
                  onChange={(event) => {
                    setGroups((old) =>
                      old.map((group) =>
                        group.id === selectedGroup.id
                          ? { ...group, label: event.target.value }
                          : group,
                      ),
                    );
                    setSaved(false);
                  }}
                />
              </label>
              {selectedGroup.type === 'section' && (
                <label className="field-label" htmlFor="section-theme">
                  Section color
                  <select
                    id="section-theme"
                    className="property-select"
                    value={selectedGroup.theme}
                    onChange={(event) => {
                      const theme = event.target.value as SectionTheme;
                      setGroups((old) =>
                        old.map((group) =>
                          group.id === selectedGroup.id
                            ? { ...group, theme }
                            : group,
                        ),
                      );
                      setSaved(false);
                    }}
                  >
                    <option value="neutral">Neutral</option>
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="amber">Amber</option>
                    <option value="purple">Purple</option>
                  </select>
                </label>
              )}
              <div className="property-block">
                <strong>Resources placed here</strong>
                {nodes.filter((node) => node.subnetId === selectedGroup.id)
                  .length ? (
                  nodes
                    .filter((node) => node.subnetId === selectedGroup.id)
                    .map((node) => (
                      <span className="placed-resource" key={node.id}>
                        {node.label}
                      </span>
                    ))
                ) : (
                  <span className="muted-copy">
                    Drag services into this box.
                  </span>
                )}
              </div>
              <div className="size-control">
                <div>
                  <strong>Width</strong>
                  <span>{Math.round(selectedGroup.w)}%</span>
                </div>
                <Slider
                  value={[selectedGroup.w]}
                  min={12}
                  max={Math.max(12, 100 - selectedGroup.x)}
                  step={1}
                  onValueChange={(value) => {
                    const nextWidth =
                      typeof value === 'number' ? value : value[0];
                    setGroups((old) =>
                      old.map((group) =>
                        group.id === selectedGroup.id
                          ? { ...group, w: nextWidth }
                          : group,
                      ),
                    );
                    setSaved(false);
                  }}
                />
                <div>
                  <strong>Height</strong>
                  <span>{Math.round(selectedGroup.h)}%</span>
                </div>
                <Slider
                  value={[selectedGroup.h]}
                  min={10}
                  max={Math.max(10, 100 - selectedGroup.y)}
                  step={1}
                  onValueChange={(value) => {
                    const nextHeight =
                      typeof value === 'number' ? value : value[0];
                    setGroups((old) =>
                      old.map((group) =>
                        group.id === selectedGroup.id
                          ? { ...group, h: nextHeight }
                          : group,
                      ),
                    );
                    setSaved(false);
                  }}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setConnectMode(true);
                  setConnectionStart(selectedGroup.id);
                }}
                className="full-button"
              >
                <Share2 /> Start connection here
              </Button>
              <Button
                variant="destructive"
                onClick={removeSelected}
                className="full-button delete-button"
              >
                <Trash2 /> Delete{' '}
                {selectedGroup.type === 'section'
                  ? 'section'
                  : selectedGroup.type.replace('-', ' ')}
              </Button>
            </div>
          )}
          {selectedConnection && (
            <div className="properties-content">
              <div className="selected-service connection-property-title">
                <span
                  className={`connection-swatch ${selectedConnection.kind}`}
                >
                  <Share2 />
                </span>
                <div>
                  <strong>{selectedConnection.label}</strong>
                  <small>Manual connection</small>
                </div>
              </div>
              <label className="field-label" htmlFor="connection-type">
                Connection type
                <select
                  id="connection-type"
                  className="property-select"
                  value={selectedConnection.kind}
                  onChange={(event) => {
                    const kind = event.target.value as ConnectionKind;
                    const defaultLabel =
                      connectionKinds.find((item) => item.value === kind)
                        ?.label ?? 'Connection';
                    setConnections((old) =>
                      old.map((line) =>
                        line.id === selectedConnection.id
                          ? { ...line, kind, label: defaultLabel }
                          : line,
                      ),
                    );
                    setSaved(false);
                  }}
                >
                  {connectionKinds.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label" htmlFor="connection-label">
                Arrow label
                <Input
                  id="connection-label"
                  value={selectedConnection.label}
                  onChange={(event) => {
                    setConnections((old) =>
                      old.map((line) =>
                        line.id === selectedConnection.id
                          ? { ...line, label: event.target.value }
                          : line,
                      ),
                    );
                    setSaved(false);
                  }}
                />
              </label>
              <div className="connection-endpoints">
                <span>
                  {nodes.find((node) => node.id === selectedConnection.from)
                    ?.label ??
                    groups.find((group) => group.id === selectedConnection.from)
                      ?.label}
                </span>
                <ArrowRightLeft />
                <span>
                  {nodes.find((node) => node.id === selectedConnection.to)
                    ?.label ??
                    groups.find((group) => group.id === selectedConnection.to)
                      ?.label}
                </span>
              </div>
              <Button
                variant="outline"
                className="full-button"
                onClick={() => {
                  setConnections((old) =>
                    old.map((line) =>
                      line.id === selectedConnection.id
                        ? { ...line, from: line.to, to: line.from }
                        : line,
                    ),
                  );
                  setSaved(false);
                }}
              >
                <ArrowRightLeft /> Reverse direction
              </Button>
              <Button
                variant="destructive"
                onClick={removeSelected}
                className="full-button delete-button"
              >
                <Trash2 /> Delete connection
              </Button>
            </div>
          )}
          {!selectedNode && !selectedGroup && !selectedConnection && (
            <div className="properties-empty">
              <MousePointer2 />
              <strong>Select a canvas item</strong>
              <span>Edit its name, placement, and connections.</span>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
