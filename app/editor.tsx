'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
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
import {
  awsCategories,
  awsServices,
  type CloudService,
  type ServiceIcon,
} from './aws-services';

type NodeData = CloudService & {
  id: string;
  x: number;
  y: number;
  subnetId?: string;
};
type GroupType = 'vpc' | 'az' | 'public-subnet' | 'private-subnet';
type GroupData = {
  id: string;
  label: string;
  type: GroupType;
  x: number;
  y: number;
  w: number;
  h: number;
};
type Connection = { id: string; from: string; to: string; label?: string };

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
];

const starterGroups: GroupData[] = [
  {
    id: 'vpc-main',
    label: 'Production VPC · 10.0.0.0/16',
    type: 'vpc',
    x: 3,
    y: 8,
    w: 94,
    h: 84,
  },
  {
    id: 'subnet-public',
    label: 'Public subnet · 10.0.1.0/24',
    type: 'public-subnet',
    x: 8,
    y: 20,
    w: 39,
    h: 62,
  },
  {
    id: 'subnet-private',
    label: 'Private subnet · 10.0.10.0/24',
    type: 'private-subnet',
    x: 53,
    y: 20,
    w: 39,
    h: 62,
  },
];

const starterNodes: NodeData[] = [
  {
    id: 'internet',
    label: 'Internet Gateway',
    category: 'Networking',
    icon: 'network',
    tone: 'purple',
    x: 12,
    y: 34,
    subnetId: 'subnet-public',
  },
  {
    id: 'lb',
    label: 'Elastic Load Balancing',
    category: 'Networking & Content Delivery',
    icon: 'network',
    tone: 'purple',
    x: 28,
    y: 34,
    subnetId: 'subnet-public',
  },
  {
    id: 'nat',
    label: 'NAT Gateway',
    category: 'Networking',
    icon: 'network',
    tone: 'purple',
    x: 40,
    y: 68,
    subnetId: 'subnet-public',
  },
  {
    id: 'ecs',
    label: 'Amazon ECS',
    category: 'Containers',
    icon: 'compute',
    tone: 'orange',
    x: 62,
    y: 34,
    subnetId: 'subnet-private',
  },
  {
    id: 'aurora',
    label: 'Amazon Aurora',
    category: 'Database',
    icon: 'database',
    tone: 'blue',
    x: 80,
    y: 34,
    subnetId: 'subnet-private',
  },
  {
    id: 's3',
    label: 'Amazon S3',
    category: 'Storage',
    icon: 'storage',
    tone: 'green',
    x: 70,
    y: 68,
    subnetId: 'subnet-private',
  },
];

const starterConnections: Connection[] = [
  { id: 'c1', from: 'internet', to: 'lb' },
  { id: 'c2', from: 'lb', to: 'ecs' },
  { id: 'c3', from: 'ecs', to: 'aurora' },
  { id: 'c4', from: 'ecs', to: 's3' },
  { id: 'c5', from: 'subnet-public', to: 'nat', label: 'egress' },
  { id: 'c6', from: 'nat', to: 'subnet-private', label: 'NAT route' },
];

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

export function ArchitectureEditor({ onClose }: { onClose: () => void }) {
  const [nodes, setNodes] = useState<NodeData[]>(starterNodes);
  const [groups, setGroups] = useState<GroupData[]>(starterGroups);
  const [connections, setConnections] =
    useState<Connection[]>(starterConnections);
  const [selected, setSelected] = useState('ecs');
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
  const canvasRef = useRef<HTMLDivElement>(null);

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

  const addService = useCallback(
    (service: CloudService) => {
      const id = `${service.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nodes.length + 1}`;
      const privateSubnet = groups.find(
        (item) => item.type === 'private-subnet',
      );
      const x = privateSubnet
        ? privateSubnet.x +
          Math.min(privateSubnet.w - 8, 12 + (nodes.length % 3) * 10)
        : 50;
      const y = privateSubnet
        ? privateSubnet.y +
          Math.min(privateSubnet.h - 8, 14 + (nodes.length % 2) * 23)
        : 55;
      setNodes((old) => [
        ...old,
        { ...service, id, x, y, subnetId: privateSubnet?.id },
      ]);
      setSelected(id);
      setSaved(false);
    },
    [groups, nodes.length],
  );

  const addStructure = (item: (typeof infrastructure)[number]) => {
    if (!item.structure) return addService(item);
    const sameType = groups.filter(
      (group) => group.type === item.structure,
    ).length;
    const id = `${item.structure}-${groups.length + 1}`;
    const isSubnet = item.structure.includes('subnet');
    setGroups((old) => [
      ...old,
      {
        id,
        type: item.structure!,
        label: `${item.label} ${sameType + 1}`,
        x: isSubnet ? 12 + (sameType % 2) * 44 : 6 + sameType * 3,
        y: isSubnet ? 26 + Math.floor(sameType / 2) * 28 : 12 + sameType * 4,
        w: isSubnet ? 38 : item.structure === 'az' ? 86 : 90,
        h: isSubnet ? 24 : item.structure === 'az' ? 70 : 78,
      },
    ]);
    setSelected(id);
    setSaved(false);
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
      setConnections((old) => [
        ...old,
        {
          id: `connection-${connections.length + 1}`,
          from: connectionStart,
          to: id,
        },
      ]);
      setSaved(false);
    }
    setConnectionStart(null);
    setConnectMode(false);
    setSelected(id);
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
        const subnet = groups
          .filter((group) => group.type.includes('subnet'))
          .reverse()
          .find(
            (group) =>
              node.x >= group.x &&
              node.x <= group.x + group.w &&
              node.y >= group.y &&
              node.y <= group.y + group.h,
          );
        return { ...node, subnetId: subnet?.id };
      }),
    );
  };

  const removeSelected = () => {
    setNodes((old) => old.filter((node) => node.id !== selected));
    setGroups((old) => old.filter((group) => group.id !== selected));
    setConnections((old) =>
      old.filter((line) => line.from !== selected && line.to !== selected),
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
          <strong>Production topology</strong>
          <span>Alex Kim / commerce-resilience</span>
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
        <Button variant="outline">
          <Share2 /> Share
        </Button>
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
                defaultValue="Add private application and data subnets"
              />
            </label>
            <label className="field-label" htmlFor="pr-description">
              What changed?
              <Textarea
                id="pr-description"
                defaultValue="Separated internet-facing resources from private compute and data tiers, with controlled outbound access through a NAT gateway."
              />
            </label>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPrOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setPrSent(true);
                  setPrOpen(false);
                }}
              >
                Submit pull request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
      {prSent && (
        <div className="success-banner">
          <Check /> Pull request #19 submitted for review.
          <button onClick={() => setPrSent(false)} aria-label="Dismiss">
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
                    <button key={item.label} onClick={() => addService(item)}>
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
                Add boundaries first, then place services inside them. Use
                Connect to link subnets through a NAT gateway.
              </p>
              <span className="eyebrow">BOUNDARIES & ROUTING</span>
              <div className="palette-list network-list">
                {infrastructure.map((item) => {
                  const Icon = item.structure ? Layers3 : iconMap[item.icon];
                  return (
                    <button key={item.label} onClick={() => addStructure(item)}>
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
            style={{ transform: `scale(${zoom / 100})` }}
          >
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
                      d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                      markerEnd="url(#arrow)"
                    />
                    {line.label && (
                      <text x={midX} y={midY - 8}>
                        {line.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            {[...groups]
              .sort((a, b) => b.w * b.h - a.w * a.h)
              .map((group) => (
                <div
                  key={group.id}
                  className={`network-group ${group.type} ${selected === group.id ? 'selected' : ''}`}
                  style={{
                    left: `${group.x}%`,
                    top: `${group.y}%`,
                    width: `${group.w}%`,
                    height: `${group.h}%`,
                  }}
                >
                  <button
                    type="button"
                    className="group-label"
                    onClick={(event) => {
                      event.stopPropagation();
                      connectEndpoint(group.id);
                    }}
                  >
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
                </div>
              ))}
            {nodes.map((node) => {
              const Icon = iconMap[node.icon];
              const subnet = groups.find((group) => group.id === node.subnetId);
              return (
                <button
                  key={node.id}
                  className={`editor-node ${selected === node.id ? 'selected' : ''} ${connectionStart === node.id ? 'connection-source' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
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
                  <span className={`service-icon ${node.tone}`}>
                    <Icon />
                  </span>
                  <strong>{node.label}</strong>
                  <small>
                    {subnet
                      ? subnet.type === 'private-subnet'
                        ? 'Private'
                        : 'Public'
                      : node.category}
                  </small>
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
                Placement
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
                  <option value="">Outside a subnet</option>
                  {groups
                    .filter((group) => group.type.includes('subnet'))
                    .map((group) => (
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
                      : 'No subnet assigned'}
                  </strong>
                  <span>
                    Drag the service into a subnet to update placement.
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
              <Button onClick={() => setSaved(true)} className="full-button">
                <Save /> Save version
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
                    Network · {selectedGroup.type.replace('-', ' ')}
                  </small>
                </div>
              </div>
              <label className="field-label" htmlFor="group-name">
                Name and CIDR
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
                    Drag services into this subnet.
                  </span>
                )}
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
            </div>
          )}
          {!selectedNode && !selectedGroup && (
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
