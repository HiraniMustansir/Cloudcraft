import type { DiagramDocument, Provider } from '@/lib/cloudcraft-types';

export type ArchitecturePillar =
  | 'security'
  | 'reliability'
  | 'performance'
  | 'cost'
  | 'operations'
  | 'sustainability';

export type ArchitectureFinding = {
  id: string;
  pillar: ArchitecturePillar;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  recommendation: string;
};

export type ArchitectureControl = {
  label: string;
  covered: boolean;
  evidence: string;
};

export type ArchitectureAnalysis = {
  score: number;
  status: 'Needs work' | 'Developing' | 'Well architected';
  pillars: Array<{
    key: ArchitecturePillar;
    label: string;
    score: number;
  }>;
  findings: ArchitectureFinding[];
  inventory: {
    services: number;
    connectors: number;
    boundaries: number;
    connections: number;
    providers: string[];
    categories: Array<{ name: string; count: number }>;
    disconnected: number;
  };
  readiness: Array<{ label: string; complete: boolean; detail: string }>;
  controls: ArchitectureControl[];
  complexity: 'Low' | 'Moderate' | 'High';
  costPressure: 'Low' | 'Moderate' | 'High';
};

type AnalysisNode = {
  id?: string;
  label?: string;
  category?: string;
  provider?: string;
  subnetId?: string;
  role?: string;
  connectorKind?: string;
};

type AnalysisGroup = {
  id?: string;
  label?: string;
  type?: string;
};

type AnalysisConnection = {
  from?: string;
  to?: string;
  kind?: string;
  label?: string;
};

const pillarLabels: Record<ArchitecturePillar, string> = {
  security: 'Security',
  reliability: 'Reliability',
  performance: 'Performance',
  cost: 'Cost optimization',
  operations: 'Operational excellence',
  sustainability: 'Sustainability',
};

const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

export function analyzeArchitecture(
  diagram: DiagramDocument,
  provider: Provider,
  context?: {
    problem?: string;
    approach?: string;
    tradeoffs?: string;
  },
): ArchitectureAnalysis {
  const nodes = (Array.isArray(diagram.nodes) ? diagram.nodes : []) as AnalysisNode[];
  const groups = (Array.isArray(diagram.groups) ? diagram.groups : []) as AnalysisGroup[];
  const connections = (Array.isArray(diagram.connections)
    ? diagram.connections
    : []) as AnalysisConnection[];
  const services = nodes.filter((node) => node.role !== 'connector');
  const connectors = nodes.filter((node) => node.role === 'connector');
  const searchable = nodes
    .map((node) => `${node.label ?? ''} ${node.category ?? ''}`.toLowerCase())
    .join(' | ');
  const groupTypes = new Set(groups.map((group) => group.type));
  const connectedIds = new Set(
    connections.flatMap((connection) => [connection.from, connection.to]),
  );
  const disconnected = services.filter(
    (node) => node.id && !connectedIds.has(node.id),
  );
  const findings: ArchitectureFinding[] = [];
  const scores: Record<ArchitecturePillar, number> = {
    security: 100,
    reliability: 100,
    performance: 100,
    cost: 100,
    operations: 100,
    sustainability: 100,
  };

  const addFinding = (
    id: string,
    pillar: ArchitecturePillar,
    severity: ArchitectureFinding['severity'],
    title: string,
    detail: string,
    recommendation: string,
  ) => {
    findings.push({ id, pillar, severity, title, detail, recommendation });
    scores[pillar] -= severity === 'high' ? 24 : severity === 'medium' ? 13 : 7;
  };

  const hasSecurity = includesAny(searchable, [
    'security',
    'firewall',
    'waf',
    'guardduty',
    'defender',
    'cloud armor',
    'security command',
  ]);
  const hasIdentity = includesAny(searchable, [
    'identity',
    'iam',
    'cognito',
    'entra',
    'active directory',
  ]);
  const hasEncryption = includesAny(searchable, [
    'kms',
    'key vault',
    'key management',
    'hsm',
    'secret',
  ]);
  const hasObservability = includesAny(searchable, [
    'cloudwatch',
    'monitor',
    'logging',
    'trace',
    'grafana',
    'prometheus',
    'observability',
    'x-ray',
  ]);
  const hasBackup = includesAny(searchable, [
    'backup',
    'disaster recovery',
    'site recovery',
    'replica',
    'multi-region',
  ]);
  const hasScaling = includesAny(searchable, [
    'auto scaling',
    'scale set',
    'autoscaler',
    'cloud run',
    'lambda',
    'functions',
    'fargate',
    'serverless',
  ]);
  const hasLoadBalancing = includesAny(searchable, [
    'load balanc',
    'application gateway',
    'front door',
    'cloudfront',
    'cloud cdn',
    'traffic manager',
  ]);
  const hasCostManagement = includesAny(searchable, [
    'cost',
    'budget',
    'billing',
    'compute optimizer',
    'advisor',
    'finops',
  ]);
  const hasQueue = includesAny(searchable, [
    'queue',
    'sqs',
    'service bus',
    'pub/sub',
    'eventbridge',
    'event grid',
    'eventarc',
  ]);
  const hasDatabase = services.some((node) =>
    includesAny(`${node.category ?? ''} ${node.label ?? ''}`.toLowerCase(), [
      'database',
      'sql',
      'dynamodb',
      'cosmos',
      'firestore',
      'spanner',
    ]),
  );

  if (!services.length) {
    addFinding(
      'empty-design',
      'operations',
      'high',
      'Architecture has no workload services',
      'The canvas does not yet describe a deployable workload.',
      'Start from a reference template or add the workload entry point, compute, data, and operational services.',
    );
  }
  if (services.length > 1 && !connections.length) {
    addFinding(
      'missing-flows',
      'reliability',
      'high',
      'Data flows are not documented',
      'Services exist, but their dependencies and failure paths are unknown.',
      'Connect services with directional, labeled arrows and choose the appropriate routing type.',
    );
  }
  if (disconnected.length) {
    addFinding(
      'disconnected-services',
      'operations',
      disconnected.length > Math.max(2, services.length / 2) ? 'high' : 'medium',
      `${disconnected.length} service${disconnected.length === 1 ? ' is' : 's are'} disconnected`,
      'Disconnected components make ownership, traffic, and dependency analysis incomplete.',
      'Connect each deployed service or mark external actors clearly outside the workload boundary.',
    );
  }
  if (services.length >= 3 && !groups.length) {
    addFinding(
      'missing-boundaries',
      'security',
      'medium',
      'Trust boundaries are not defined',
      'The design does not distinguish network, account, region, or workload boundaries.',
      'Add VPC/VNet, availability-zone, subnet, or named-section boundaries.',
    );
  }
  if (!hasSecurity && services.length >= 2) {
    addFinding(
      'missing-security-controls',
      'security',
      'high',
      'No preventive security control is shown',
      'The diagram has no visible firewall, WAF, posture-management, or threat-detection service.',
      'Add the controls that protect ingress, workloads, and sensitive data.',
    );
  }
  if (!hasIdentity && services.length >= 3) {
    addFinding(
      'missing-identity',
      'security',
      'medium',
      'Identity boundary is undocumented',
      'Human and workload authentication or authorization is not represented.',
      'Document the identity provider, workload identities, and least-privilege authorization path.',
    );
  }
  if (hasDatabase && !hasEncryption) {
    addFinding(
      'missing-key-management',
      'security',
      'medium',
      'Key and secret management is not visible',
      'A data service is present without an explicit key or secret-management control.',
      'Show managed keys, secret storage, certificate management, or note provider-managed encryption.',
    );
  }
  const publicGroupIds = new Set(
    groups.filter((group) => group.type === 'public-subnet').map((group) => group.id),
  );
  const publicDataServices = services.filter(
    (node) => node.subnetId && publicGroupIds.has(node.subnetId) &&
      includesAny(`${node.category ?? ''} ${node.label ?? ''}`.toLowerCase(), [
        'database',
        'storage',
      ]),
  );
  if (publicDataServices.length) {
    addFinding(
      'public-data-tier',
      'security',
      'high',
      'Data service is placed in a public subnet',
      `${publicDataServices.map((node) => node.label).join(', ')} should not normally accept direct internet routes.`,
      'Move the data tier into a private subnet and use private endpoints or controlled application access.',
    );
  }
  if (!hasObservability && services.length >= 2) {
    addFinding(
      'missing-observability',
      'operations',
      'high',
      'Observability is missing',
      'No monitoring, logging, tracing, or alerting service is documented.',
      'Add metrics, centralized logs, distributed traces, dashboards, and alert ownership.',
    );
  }
  const availabilityZones = groups.filter((group) => group.type === 'az').length;
  if (services.length >= 4 && availabilityZones < 2 && !hasBackup) {
    addFinding(
      'single-failure-domain',
      'reliability',
      'high',
      'No redundant failure domain is shown',
      'The design has neither multiple availability zones nor an explicit recovery service.',
      'Distribute critical tiers across failure domains and document backup, restore, RTO, and RPO.',
    );
  } else if (hasDatabase && !hasBackup) {
    addFinding(
      'missing-recovery',
      'reliability',
      'medium',
      'Recovery strategy is not visible',
      'A stateful service exists without backup, replication, or disaster-recovery context.',
      'Document backups, restore testing, replication, RTO, and RPO.',
    );
  }
  if (services.length >= 4 && !hasScaling) {
    addFinding(
      'missing-scaling',
      'performance',
      'medium',
      'Scaling behavior is unclear',
      'No elastic compute or autoscaling component is represented.',
      'Document horizontal scaling, concurrency limits, queues, and expected peak load.',
    );
  }
  if (services.length >= 4 && !hasLoadBalancing && !hasQueue) {
    addFinding(
      'synchronous-bottleneck',
      'performance',
      'low',
      'Traffic distribution is not visible',
      'The workload has several services without a load balancer, edge tier, or asynchronous buffer.',
      'Show how bursts are distributed, cached, throttled, or buffered.',
    );
  }
  if (!hasCostManagement && services.length >= 5) {
    addFinding(
      'missing-finops',
      'cost',
      'medium',
      'Cost controls are not documented',
      'The design has enough components to benefit from budgets, allocation tags, and anomaly detection.',
      'Add budgets, cost allocation, anomaly alerts, and an owner for recurring optimization.',
    );
  }
  if (services.length >= 9) {
    addFinding(
      'service-sprawl',
      'cost',
      'low',
      'Service count increases operating cost',
      'Each additional managed service adds spend, ownership, quotas, and integration overhead.',
      'Confirm every component has a measurable requirement and remove overlapping capabilities.',
    );
    addFinding(
      'service-sprawl-sustainability',
      'sustainability',
      'low',
      'Resource footprint should be reviewed',
      'A broad service footprint can create idle capacity and unnecessary data movement.',
      'Prefer elastic or serverless capacity, right-size retention, and minimize cross-region transfers.',
    );
  }

  const providers = Array.from(
    new Set(
      services
        .map((node) => node.provider)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  if (!providers.length && provider !== 'Multi-cloud') providers.push(provider);
  const hasHybridPath = connections.some((connection) => connection.kind === 'hybrid') ||
    connectors.some((node) => node.connectorKind === 'hybrid');
  if ((provider === 'Multi-cloud' || providers.length > 1) && !hasHybridPath) {
    addFinding(
      'missing-hybrid-path',
      'reliability',
      'high',
      'Cross-cloud connectivity is not defined',
      'Multiple providers are present without an explicit VPN, private interconnect, SD-WAN, or hybrid-management path.',
      'Add the cross-cloud connection and document routing, encryption, failover, and bandwidth constraints.',
    );
  }

  if (context && !context.tradeoffs?.trim()) {
    addFinding(
      'missing-tradeoffs',
      'operations',
      'low',
      'Trade-offs are not recorded',
      'Future reviewers cannot tell which risks and constraints were intentionally accepted.',
      'Record rejected alternatives, cost implications, operational burden, and known limitations.',
    );
  }

  for (const key of Object.keys(scores) as ArchitecturePillar[])
    scores[key] = Math.max(20, Math.min(100, scores[key]));
  const score = Math.round(
    Object.values(scores).reduce((total, value) => total + value, 0) / 6,
  );
  const categoryCounts = new Map<string, number>();
  for (const node of services) {
    const category = node.category?.trim() || 'Uncategorized';
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
  const complexityPoints = services.length + connections.length * 0.6 + groups.length * 0.8;
  const expensiveServices = services.filter((node) =>
    includesAny(`${node.label ?? ''} ${node.category ?? ''}`.toLowerCase(), [
      'database',
      'warehouse',
      'kubernetes',
      'virtual machine',
      'ec2',
      'interconnect',
      'direct connect',
      'firewall',
    ]),
  ).length;
  const costPoints = services.length + expensiveServices * 2 + providers.length * 2;

  return {
    score,
    status: score >= 82 ? 'Well architected' : score >= 62 ? 'Developing' : 'Needs work',
    pillars: (Object.keys(scores) as ArchitecturePillar[]).map((key) => ({
      key,
      label: pillarLabels[key],
      score: scores[key],
    })),
    findings: findings.sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 };
      return rank[a.severity] - rank[b.severity];
    }),
    inventory: {
      services: services.length,
      connectors: connectors.length,
      boundaries: groups.length,
      connections: connections.length,
      providers,
      categories: Array.from(categoryCounts, ([name, count]) => ({ name, count })).sort(
        (a, b) => b.count - a.count,
      ),
      disconnected: disconnected.length,
    },
    readiness: [
      { label: 'Workload context', complete: Boolean(context?.problem?.trim()), detail: 'Problem and constraints are documented.' },
      { label: 'Architecture narrative', complete: Boolean(context?.approach?.trim()), detail: 'Service responsibilities and flows are explained.' },
      { label: 'Connected topology', complete: services.length > 0 && connections.length > 0 && !disconnected.length, detail: 'Deployed components have explicit dependencies.' },
      { label: 'Security controls', complete: hasSecurity && hasIdentity, detail: 'Preventive controls and identity are represented.' },
      { label: 'Operations', complete: hasObservability, detail: 'Monitoring, logging, or tracing is included.' },
      { label: 'Recovery', complete: !hasDatabase || hasBackup || availabilityZones >= 2, detail: 'Stateful recovery or redundant failure domains are shown.' },
      { label: 'Trade-off record', complete: Boolean(context?.tradeoffs?.trim()), detail: 'Known limitations and accepted risks are recorded.' },
    ],
    controls: [
      { label: 'Network isolation', covered: groupTypes.has('private-subnet') || groupTypes.has('vpc'), evidence: 'Private subnet or network boundary' },
      { label: 'Identity and access', covered: hasIdentity, evidence: 'IAM or identity service' },
      { label: 'Edge protection', covered: hasSecurity, evidence: 'Firewall, WAF, or threat protection' },
      { label: 'Encryption and secrets', covered: hasEncryption, evidence: 'Managed keys, HSM, or secrets service' },
      { label: 'Detection and telemetry', covered: hasObservability, evidence: 'Logs, metrics, traces, or security monitoring' },
      { label: 'Backup and recovery', covered: hasBackup || availabilityZones >= 2, evidence: 'Backup, replication, or multiple failure domains' },
      { label: 'Financial governance', covered: hasCostManagement, evidence: 'Budgets, billing, cost management, or FinOps' },
    ],
    complexity: complexityPoints >= 18 ? 'High' : complexityPoints >= 8 ? 'Moderate' : 'Low',
    costPressure: costPoints >= 20 ? 'High' : costPoints >= 9 ? 'Moderate' : 'Low',
  };
}
