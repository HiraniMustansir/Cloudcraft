'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
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
  Gauge,
  Grid3X3,
  HardDrive,
  Layers3,
  LayoutTemplate,
  Minus,
  MoveRight,
  MousePointer2,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
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
  awsServices,
  type CloudService,
  type ServiceIcon,
} from './aws-services';
import { azureServices } from './azure-services';
import { gcpServices } from './gcp-services';
import { hybridServices } from './hybrid-services';
import type { DiagramDocument, Provider } from '@/lib/cloudcraft-types';
import { analyzeArchitecture } from '@/lib/architecture-analysis';
import { getArchitectureTemplates } from '@/lib/architecture-templates';
import {
  getConnectionGeometry,
  type ConnectionRouting,
} from '@/lib/diagram-geometry';

type NodeData = CloudService & {
  id: string;
  x: number;
  y: number;
  subnetId?: string;
  size: number;
  role?: 'service' | 'connector';
  connectorKind?:
    | 'nat'
    | 'internet-gateway'
    | 'vpc-endpoint'
    | 'routing'
    | 'hybrid';
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
  | 'hybrid'
  | 'custom';
type Connection = {
  id: string;
  from: string;
  to: string;
  kind: ConnectionKind;
  label: string;
  routing?: ConnectionRouting;
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
  { value: 'hybrid', label: 'Cross-cloud connection' },
  { value: 'custom', label: 'Custom connection' },
];

const connectorKindFor = (
  service: CloudService & { connectorKind?: NodeData['connectorKind'] },
): NodeData['connectorKind'] => {
  if (service.connectorKind) return service.connectorKind;
  const label = service.label.toLowerCase();
  if (label.includes('internet gateway')) return 'internet-gateway';
  if (label.includes('nat gateway')) return 'nat';
  if (label.includes('vpc endpoint') || label.includes('privatelink'))
    return 'vpc-endpoint';
  if (
    label.includes('azure arc') ||
    label.includes('interconnect') ||
    label.includes('direct connect') ||
    label.includes('expressroute') ||
    label.includes('vpn gateway') ||
    label.includes('site-to-site vpn') ||
    label.includes('sd-wan')
  )
    return 'hybrid';
  if (label.includes('route table') || label.includes('transit gateway'))
    return 'routing';
  return undefined;
};

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

type InfrastructureItem = CloudService & {
  structure?: GroupType;
  connectorKind?: NodeData['connectorKind'];
};

const infrastructure: InfrastructureItem[] = [
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
    connectorKind: 'nat',
  },
  {
    label: 'Internet Gateway',
    category: 'Networking',
    icon: 'network',
    tone: 'purple',
    connectorKind: 'internet-gateway',
  },
  {
    label: 'Route Table',
    category: 'Networking',
    icon: 'network',
    tone: 'purple',
    connectorKind: 'routing',
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
    connectorKind: 'vpc-endpoint',
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
  provider?: Provider;
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
  provider = 'AWS',
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
  const [providerFilter, setProviderFilter] = useState<
    'All' | 'AWS' | 'Azure' | 'GCP' | 'Hybrid'
  >(provider === 'Multi-cloud' ? 'All' : provider);
  const [libraryMode, setLibraryMode] = useState<'services' | 'network'>(
    'services',
  );
  const [zoom, setZoom] = useState(100);
  const [libraryWidth, setLibraryWidth] = useState(340);
  const [propertiesWidth, setPropertiesWidth] = useState(330);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [propertiesCollapsed, setPropertiesCollapsed] = useState(false);
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
  const panelResizeRef = useRef<{
    side: 'library' | 'properties';
    startX: number;
    startWidth: number;
  } | null>(null);

  const resizePanel = (clientX: number) => {
    const resize = panelResizeRef.current;
    if (!resize) return;
    const delta = clientX - resize.startX;
    if (resize.side === 'library') {
      setLibraryWidth(Math.max(230, Math.min(480, resize.startWidth + delta)));
    } else {
      setPropertiesWidth(
        Math.max(250, Math.min(440, resize.startWidth - delta)),
      );
    }
  };

  const availableServices = useMemo(() => {
    if (provider === 'AWS') return awsServices;
    if (provider === 'Azure') return azureServices;
    if (provider === 'GCP') return gcpServices;
    const services = [
      ...awsServices,
      ...azureServices,
      ...gcpServices,
      ...hybridServices,
    ];
    return providerFilter === 'All'
      ? services
      : services.filter((service) => service.provider === providerFilter);
  }, [provider, providerFilter]);

  const serviceCategories = useMemo(
    () => [
      'All',
      ...Array.from(
        new Set(availableServices.map((service) => service.category)),
      ),
    ],
    [availableServices],
  );

  const visibleServices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return availableServices.filter(
      (service) =>
        (category === 'All' || service.category === category) &&
        (!needle ||
          `${service.label} ${service.category}`
            .toLowerCase()
            .includes(needle)),
    );
  }, [availableServices, query, category]);

  const selectedNode = nodes.find((node) => node.id === selected);
  const selectedGroup = groups.find((group) => group.id === selected);
  const selectedConnection = connections.find((line) => line.id === selected);
  const architectureTemplates = useMemo(
    () => getArchitectureTemplates(provider),
    [provider],
  );
  const liveAnalysis = useMemo(
    () => analyzeArchitecture({ nodes, groups, connections }, provider),
    [connections, groups, nodes, provider],
  );

  const diagram = (): DiagramDocument => ({
    nodes,
    groups,
    connections,
  });

  const applyTemplate = (templateId: string) => {
    const template = architectureTemplates.find(
      (candidate) => candidate.id === templateId,
    );
    if (!template) return;
    setNodes(template.diagram.nodes as NodeData[]);
    setGroups(template.diagram.groups as GroupData[]);
    setConnections(template.diagram.connections as Connection[]);
    setSelected('');
    setSaved(false);
  };

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
    (
      service: CloudService & { connectorKind?: NodeData['connectorKind'] },
      point?: { x: number; y: number },
    ) => {
      const connectorKind = connectorKindFor(service);
      const id = `${(service.provider ?? provider).toLowerCase()}-${service.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${nodes.length + 1}`;
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
          role: connectorKind ? 'connector' : 'service',
          connectorKind,
        },
      ]);
      setSelected(id);
      setSaved(false);
    },
    [groups, nodes.length, provider],
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

  const endpointBounds = (id: string) => {
    const node = nodes.find((item) => item.id === id);
    if (node) {
      const scale = node.size / 100;
      return {
        x: node.x * 10,
        y: node.y * 6.2,
        w: (node.role === 'connector' ? 104 : 88) * scale,
        h: (node.role === 'connector' ? 38 : 76) * scale,
      };
    }
    const group = groups.find((item) => item.id === id);
    if (group)
      return {
        x: (group.x + group.w / 2) * 10,
        y: (group.y + group.h / 2) * 6.2,
        w: group.w * 10,
        h: group.h * 6.2,
      };
    return null;
  };

  const connectionGeometry = (line: Connection) => {
    const fromBounds = endpointBounds(line.from);
    const toBounds = endpointBounds(line.to);
    if (!fromBounds || !toBounds) return null;
    return getConnectionGeometry(fromBounds, toBounds, line.routing);
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
      const connector = nodes.find(
        (node) =>
          (node.id === connectionStart || node.id === id) &&
          node.role === 'connector',
      );
      const kind: ConnectionKind =
        connector?.connectorKind === 'hybrid'
          ? 'hybrid'
          : connector?.connectorKind === 'internet-gateway'
            ? 'internet-gateway'
            : connector?.connectorKind === 'vpc-endpoint'
              ? 'vpc-endpoint'
              : connector?.connectorKind === 'nat'
                ? 'nat'
                : 'data';
      const label =
        connectionKinds.find((item) => item.value === kind)?.label ??
        'Data flow';
      setConnections((old) => [
        ...old,
        {
          id: connectionId,
          from: connectionStart,
          to: id,
          kind,
          label,
          routing: 'elbow',
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
          name: 'add_cloud_architecture_service',
          title: 'Add cloud architecture service',
          description:
            'Add one service from the active cloud provider catalog to the visible canvas.',
          inputSchema: {
            type: 'object',
            properties: {
              service: {
                type: 'string',
                enum: Array.from(
                  new Set(availableServices.map((item) => item.label)),
                ),
              },
            },
            required: ['service'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const name = (input as { service?: string })?.service;
            const service = availableServices.find(
              (item) => item.label === name,
            );
            if (!service) throw new Error('Unsupported service');
            addService(service);
            return { status: 'added', service: service.label };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
    return () => lifecycle.abort();
  }, [addService, availableServices]);

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
          onClick={() => {
            setSelected('');
            setPropertiesCollapsed(false);
          }}
        >
          <Gauge /> Review {liveAnalysis.score}
        </Button>
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
      <div
        className="editor-body"
        style={
          {
            '--library-width': `${libraryCollapsed ? 46 : libraryWidth}px`,
            '--properties-width': `${propertiesCollapsed ? 46 : propertiesWidth}px`,
          } as CSSProperties
        }
      >
        <aside
          className={`service-library ${libraryCollapsed ? 'panel-collapsed' : ''}`}
        >
          <div className="library-heading">
            <div>
              <strong>Architecture library</strong>
              <small>
                {availableServices.length} {provider} services + network
                primitives
              </small>
            </div>
            <button
              className="panel-toggle"
              onClick={() => setLibraryCollapsed((value) => !value)}
              title={
                libraryCollapsed
                  ? 'Expand architecture library'
                  : 'Collapse architecture library'
              }
              aria-label={
                libraryCollapsed
                  ? 'Expand architecture library'
                  : 'Collapse architecture library'
              }
            >
              {libraryCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </button>
          </div>
          {!libraryCollapsed && (
            <>
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
                  {provider === 'Multi-cloud' && (
                    <div className="provider-tabs provider-tabs-hybrid">
                      {(['All', 'AWS', 'Azure', 'GCP', 'Hybrid'] as const).map(
                        (item) => (
                          <button
                            key={item}
                            className={providerFilter === item ? 'active' : ''}
                            onClick={() => {
                              setProviderFilter(item);
                              setCategory('All');
                            }}
                          >
                            {item}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                  <div className="library-search">
                    <Search />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={`Search ${provider === 'Multi-cloud' ? 'all cloud' : provider} services`}
                    />
                  </div>
                  <div className="category-select">
                    <select
                      aria-label="Filter cloud services by category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      {serviceCategories.map((item) => (
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
                          key={`${item.provider ?? provider}-${item.label}`}
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
                            <small>
                              {provider === 'Multi-cloud' && item.provider
                                ? `${item.provider} · ${item.category}`
                                : item.category}
                            </small>
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
                    boundaries for deployment detail. Gateways, route tables,
                    and VPC endpoints are connectors: place them between
                    sections and join them with labeled arrows.
                  </p>
                  <span className="eyebrow">BOUNDARIES & ROUTING</span>
                  <div className="palette-list network-list">
                    {infrastructure.map((item) => {
                      const Icon = item.structure
                        ? Layers3
                        : iconMap[item.icon];
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
                            <small>
                              {item.connectorKind
                                ? 'Connectable network path'
                                : item.category}
                            </small>
                          </span>
                          <Plus />
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
          {!libraryCollapsed && (
            <button
              type="button"
              className="panel-resizer library-resizer"
              aria-label="Resize architecture library"
              title="Drag to resize · Double-click to reset"
              onDoubleClick={() => setLibraryWidth(340)}
              onPointerDown={(event) => {
                panelResizeRef.current = {
                  side: 'library',
                  startX: event.clientX,
                  startWidth: libraryWidth,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  resizePanel(event.clientX);
              }}
              onPointerUp={() => {
                panelResizeRef.current = null;
              }}
              onPointerCancel={() => {
                panelResizeRef.current = null;
              }}
            />
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
              className={`arrow-tool ${connectMode ? 'active connect-active' : ''}`}
              onClick={() => {
                setConnectMode((value) => !value);
                setConnectionStart(null);
              }}
              title="Draw an arrow"
              aria-label="Draw an arrow"
            >
              <MoveRight />
              <b>Arrow</b>
            </button>
            <span className="tool-separator" />
            <button disabled title="Undo">
              <Undo2 />
            </button>
            <button disabled title="Redo">
              <Redo2 />
            </button>
            <span className="tool-separator" />
            <button title="Toggle grid">
              <Grid3X3 />
            </button>
          </div>
          {connectMode && (
            <div className="connect-hint">
              {connectionStart
                ? 'Now select the destination for the arrow'
                : 'Select a service, gateway, section, or subnet to start'}{' '}
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
                <LayoutTemplate />
                <strong>Start from a cloud reference pattern</strong>
                <span>
                  Use a reviewed foundation, then adapt services, boundaries,
                  and data flows to your workload.
                </span>
                <div className="template-quick-grid">
                  {architectureTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        applyTemplate(template.id);
                      }}
                    >
                      <strong>{template.name}</strong>
                      <small>{template.outcome}</small>
                    </button>
                  ))}
                </div>
                <button
                  className="blank-start-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setLibraryMode('network');
                  }}
                >
                  <SquareDashed /> Start blank instead
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
                  markerWidth="9"
                  markerHeight="9"
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" />
                </marker>
              </defs>
              {connections.map((line) => {
                const geometry = connectionGeometry(line);
                if (!geometry) return null;
                return (
                  <g key={line.id}>
                    <path
                      className={`connection-line connection-${line.kind} ${selected === line.id ? 'selected' : ''}`}
                      d={geometry.path}
                      markerEnd="url(#arrow)"
                    />
                    <path
                      className="connection-hit"
                      d={geometry.path}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelected(line.id);
                      }}
                    />
                    <text x={geometry.labelX} y={geometry.labelY}>
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
                    if (connectMode) {
                      if (event.target === event.currentTarget) {
                        event.stopPropagation();
                        connectEndpoint(group.id);
                      }
                      return;
                    }
                    if (event.target !== event.currentTarget) return;
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
                  className={`editor-node ${node.role === 'connector' ? `network-connector connector-${node.connectorKind}` : ''} ${selected === node.id ? 'selected' : ''} ${connectionStart === node.id ? 'connection-source' : ''}`}
                  style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    width: `${(node.role === 'connector' ? 132 : 96) * (node.size / 100)}px`,
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
                      width: `${(node.role === 'connector' ? 32 : 48) * (node.size / 100)}px`,
                      height: `${(node.role === 'connector' ? 32 : 48) * (node.size / 100)}px`,
                    }}
                  >
                    <Icon />
                  </span>
                  <span className="node-copy">
                    <strong style={{ fontSize: `${10 * (node.size / 100)}px` }}>
                      {node.label}
                    </strong>
                    <small>
                      {node.role === 'connector'
                        ? 'Network connector'
                        : placementLabel}
                    </small>
                  </span>
                  {provider === 'Multi-cloud' && node.provider && (
                    <span
                      className={`node-provider provider-${node.provider.toLowerCase()}`}
                    >
                      {node.provider}
                    </span>
                  )}
                  {connectMode && (
                    <>
                      <span className="node-port node-port-in" />
                      <span className="node-port node-port-out" />
                    </>
                  )}
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
        <aside
          className={`properties-panel ${propertiesCollapsed ? 'panel-collapsed' : ''}`}
        >
          <div className="properties-title">
            {!propertiesCollapsed && <strong>Properties</strong>}
            <div className="panel-title-actions">
              {!propertiesCollapsed && selected && (
                <button onClick={removeSelected} title="Delete selected">
                  <Trash2 />
                </button>
              )}
              <button
                className="panel-toggle"
                onClick={() => setPropertiesCollapsed((value) => !value)}
                title={
                  propertiesCollapsed
                    ? 'Expand properties'
                    : 'Collapse properties'
                }
                aria-label={
                  propertiesCollapsed
                    ? 'Expand properties'
                    : 'Collapse properties'
                }
              >
                {propertiesCollapsed ? <PanelRightOpen /> : <PanelRightClose />}
              </button>
            </div>
          </div>
          {!propertiesCollapsed && selectedNode && (
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
                  <small>
                    {selectedNode.role === 'connector'
                      ? 'Connectable network primitive'
                      : `${selectedNode.provider ?? provider} · ${selectedNode.category}`}
                  </small>
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
                variant="outline"
                onClick={() => {
                  setConnectMode(true);
                  setConnectionStart(selectedNode.id);
                }}
                className="full-button"
              >
                <MoveRight /> Start arrow here
              </Button>
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
          {!propertiesCollapsed && selectedGroup && (
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
          {!propertiesCollapsed && selectedConnection && (
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
              <label className="field-label" htmlFor="connection-routing">
                Arrow path
                <select
                  id="connection-routing"
                  className="property-select"
                  value={selectedConnection.routing ?? 'elbow'}
                  onChange={(event) => {
                    const routing = event.target.value as NonNullable<
                      Connection['routing']
                    >;
                    setConnections((old) =>
                      old.map((line) =>
                        line.id === selectedConnection.id
                          ? { ...line, routing }
                          : line,
                      ),
                    );
                    setSaved(false);
                  }}
                >
                  <option value="elbow">Elbow (architecture diagram)</option>
                  <option value="curved">Curved</option>
                  <option value="straight">Straight</option>
                </select>
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
          {!propertiesCollapsed &&
            !selectedNode &&
            !selectedGroup &&
            !selectedConnection && (
              <div className="editor-review-panel">
                <div className="editor-review-score">
                  <span>{liveAnalysis.score}</span>
                  <div>
                    <strong>Architecture review</strong>
                    <small>{liveAnalysis.status}</small>
                  </div>
                </div>
                <div className="editor-review-metrics">
                  <span><strong>{liveAnalysis.inventory.services}</strong> services</span>
                  <span><strong>{liveAnalysis.inventory.connections}</strong> flows</span>
                  <span><strong>{liveAnalysis.inventory.boundaries}</strong> boundaries</span>
                </div>
                <div className="editor-review-pillars">
                  {liveAnalysis.pillars.map((pillar) => (
                    <div key={pillar.key}>
                      <span>{pillar.label}</span>
                      <i><b style={{ width: `${pillar.score}%` }} /></i>
                      <strong>{pillar.score}</strong>
                    </div>
                  ))}
                </div>
                <div className="editor-review-findings">
                  <strong>Next improvements</strong>
                  {liveAnalysis.findings.slice(0, 4).map((finding) => (
                    <article key={finding.id} className={`severity-${finding.severity}`}>
                      <span>{finding.severity}</span>
                      <div>
                        <strong>{finding.title}</strong>
                        <small>{finding.recommendation}</small>
                      </div>
                    </article>
                  ))}
                  {!liveAnalysis.findings.length && (
                    <p><Check /> No obvious topology gaps detected.</p>
                  )}
                </div>
                <small className="editor-review-note">
                  Design-time guidance only. Select any canvas item to edit its properties.
                </small>
              </div>
            )}
          {!propertiesCollapsed && (
            <button
              type="button"
              className="panel-resizer properties-resizer"
              aria-label="Resize properties panel"
              title="Drag to resize · Double-click to reset"
              onDoubleClick={() => setPropertiesWidth(330)}
              onPointerDown={(event) => {
                panelResizeRef.current = {
                  side: 'properties',
                  startX: event.clientX,
                  startWidth: propertiesWidth,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  resizePanel(event.clientX);
              }}
              onPointerUp={() => {
                panelResizeRef.current = null;
              }}
              onPointerCancel={() => {
                panelResizeRef.current = null;
              }}
            />
          )}
        </aside>
      </div>
    </main>
  );
}
