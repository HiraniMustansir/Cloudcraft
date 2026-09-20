import type { DiagramDocument, Provider } from '@/lib/cloudcraft-types';

export type ArchitectureTemplate = {
  id: string;
  name: string;
  description: string;
  outcome: string;
  diagram: DiagramDocument;
};

type TemplateService = {
  label: string;
  category: string;
  icon: string;
  tone: string;
};

type ProviderServices = {
  edge: TemplateService;
  api: TemplateService;
  compute: TemplateService;
  queue: TemplateService;
  database: TemplateService;
  storage: TemplateService;
  security: TemplateService;
  identity: TemplateService;
  monitoring: TemplateService;
  analytics: TemplateService;
};

const services: Record<Exclude<Provider, 'Multi-cloud'>, ProviderServices> = {
  AWS: {
    edge: { label: 'Amazon CloudFront', category: 'Networking & Content Delivery', icon: 'network', tone: 'purple' },
    api: { label: 'Amazon API Gateway', category: 'Application Integration', icon: 'integration', tone: 'pink' },
    compute: { label: 'AWS Lambda', category: 'Compute', icon: 'compute', tone: 'orange' },
    queue: { label: 'Amazon Simple Queue Service', category: 'Application Integration', icon: 'integration', tone: 'pink' },
    database: { label: 'Amazon DynamoDB', category: 'Database', icon: 'database', tone: 'blue' },
    storage: { label: 'Amazon S3', category: 'Storage', icon: 'storage', tone: 'green' },
    security: { label: 'AWS WAF', category: 'Security, Identity & Compliance', icon: 'security', tone: 'red' },
    identity: { label: 'Amazon Cognito', category: 'Security, Identity & Compliance', icon: 'security', tone: 'red' },
    monitoring: { label: 'Amazon CloudWatch', category: 'Management & Governance', icon: 'management', tone: 'pink' },
    analytics: { label: 'Amazon Redshift Serverless', category: 'Analytics', icon: 'analytics', tone: 'blue' },
  },
  Azure: {
    edge: { label: 'Azure Front Door', category: 'Networking', icon: 'network', tone: 'blue' },
    api: { label: 'Azure API Management', category: 'Integration', icon: 'integration', tone: 'teal' },
    compute: { label: 'Azure Functions', category: 'Compute', icon: 'compute', tone: 'blue' },
    queue: { label: 'Azure Service Bus', category: 'Integration', icon: 'integration', tone: 'teal' },
    database: { label: 'Azure Cosmos DB', category: 'Databases', icon: 'database', tone: 'blue' },
    storage: { label: 'Azure Blob Storage', category: 'Storage', icon: 'storage', tone: 'green' },
    security: { label: 'Azure Web Application Firewall', category: 'Security', icon: 'security', tone: 'red' },
    identity: { label: 'Microsoft Entra ID', category: 'Identity', icon: 'security', tone: 'red' },
    monitoring: { label: 'Azure Monitor', category: 'Management', icon: 'management', tone: 'pink' },
    analytics: { label: 'Azure Synapse Analytics', category: 'Analytics', icon: 'analytics', tone: 'blue' },
  },
  GCP: {
    edge: { label: 'Cloud Load Balancing', category: 'Networking', icon: 'network', tone: 'blue' },
    api: { label: 'API Gateway', category: 'API Management', icon: 'integration', tone: 'blue' },
    compute: { label: 'Cloud Run functions', category: 'Serverless', icon: 'compute', tone: 'blue' },
    queue: { label: 'Pub/Sub', category: 'Analytics', icon: 'integration', tone: 'pink' },
    database: { label: 'Firestore', category: 'Databases', icon: 'database', tone: 'blue' },
    storage: { label: 'Cloud Storage', category: 'Storage', icon: 'storage', tone: 'green' },
    security: { label: 'Cloud Armor', category: 'Security', icon: 'security', tone: 'red' },
    identity: { label: 'Identity Platform', category: 'Identity', icon: 'security', tone: 'red' },
    monitoring: { label: 'Cloud Monitoring', category: 'Management', icon: 'management', tone: 'pink' },
    analytics: { label: 'BigQuery', category: 'Analytics', icon: 'analytics', tone: 'blue' },
  },
};

const node = (
  id: string,
  service: TemplateService,
  provider: string,
  x: number,
  y: number,
  subnetId?: string,
) => ({
  id,
  ...service,
  provider,
  x,
  y,
  subnetId,
  size: 100,
  role: 'service',
});

const connection = (from: string, to: string, label: string, kind = 'data') => ({
  id: `connection-${from}-${to}`,
  from,
  to,
  label,
  kind,
  routing: 'elbow',
});

const standardGroups = () => [
  { id: 'template-vpc', label: 'Workload network', type: 'vpc', x: 8, y: 10, w: 84, h: 80, theme: 'neutral' },
  { id: 'template-public', label: 'Public edge', type: 'public-subnet', x: 13, y: 19, w: 74, h: 25, theme: 'blue' },
  { id: 'template-private', label: 'Private application and data', type: 'private-subnet', x: 13, y: 51, w: 74, h: 31, theme: 'green' },
];

export function getArchitectureTemplates(provider: Provider): ArchitectureTemplate[] {
  const primary = provider === 'Multi-cloud' ? 'AWS' : provider;
  const catalog = services[primary];
  const web: ArchitectureTemplate = {
    id: 'secure-web',
    name: 'Secure web platform',
    description: 'Edge protection, API, elastic compute, data, identity, and monitoring.',
    outcome: 'Production web workload',
    diagram: {
      groups: standardGroups(),
      nodes: [
        node('web-security', catalog.security, primary, 23, 31, 'template-public'),
        node('web-edge', catalog.edge, primary, 40, 31, 'template-public'),
        node('web-api', catalog.api, primary, 59, 31, 'template-public'),
        node('web-identity', catalog.identity, primary, 77, 31, 'template-public'),
        node('web-compute', catalog.compute, primary, 28, 66, 'template-private'),
        node('web-database', catalog.database, primary, 48, 66, 'template-private'),
        node('web-storage', catalog.storage, primary, 67, 66, 'template-private'),
        node('web-monitoring', catalog.monitoring, primary, 80, 66, 'template-private'),
      ],
      connections: [
        connection('web-security', 'web-edge', 'Filtered traffic', 'internet'),
        connection('web-edge', 'web-api', 'HTTPS'),
        connection('web-api', 'web-compute', 'Request'),
        connection('web-identity', 'web-api', 'Authorize'),
        connection('web-compute', 'web-database', 'Read / write'),
        connection('web-compute', 'web-storage', 'Objects'),
        connection('web-compute', 'web-monitoring', 'Telemetry'),
      ],
    },
  };
  const eventDriven: ArchitectureTemplate = {
    id: 'event-driven',
    name: 'Event-driven API',
    description: 'Decoupled ingestion with queueing, serverless processing, and telemetry.',
    outcome: 'Burst-tolerant integration',
    diagram: {
      groups: [
        { id: 'event-section', label: 'Event processing platform', type: 'section', x: 9, y: 13, w: 82, h: 73, theme: 'purple' },
      ],
      nodes: [
        node('event-identity', catalog.identity, primary, 17, 35, 'event-section'),
        node('event-api', catalog.api, primary, 32, 35, 'event-section'),
        node('event-queue', catalog.queue, primary, 48, 35, 'event-section'),
        node('event-compute', catalog.compute, primary, 64, 35, 'event-section'),
        node('event-database', catalog.database, primary, 80, 35, 'event-section'),
        node('event-monitoring', catalog.monitoring, primary, 56, 68, 'event-section'),
        node('event-security', catalog.security, primary, 28, 68, 'event-section'),
      ],
      connections: [
        connection('event-identity', 'event-api', 'Authorize'),
        connection('event-api', 'event-queue', 'Publish'),
        connection('event-queue', 'event-compute', 'Consume'),
        connection('event-compute', 'event-database', 'Persist'),
        connection('event-compute', 'event-monitoring', 'Telemetry'),
        connection('event-security', 'event-api', 'Protect'),
      ],
    },
  };
  const dataPlatform: ArchitectureTemplate = {
    id: 'data-platform',
    name: 'Analytics platform',
    description: 'Governed ingestion, object storage, analytics, and operational visibility.',
    outcome: 'Cloud data foundation',
    diagram: {
      groups: [
        { id: 'data-section', label: 'Governed data platform', type: 'section', x: 8, y: 12, w: 84, h: 76, theme: 'blue' },
      ],
      nodes: [
        node('data-api', catalog.api, primary, 18, 35, 'data-section'),
        node('data-queue', catalog.queue, primary, 34, 35, 'data-section'),
        node('data-storage', catalog.storage, primary, 51, 35, 'data-section'),
        node('data-analytics', catalog.analytics, primary, 69, 35, 'data-section'),
        node('data-security', catalog.security, primary, 27, 68, 'data-section'),
        node('data-identity', catalog.identity, primary, 50, 68, 'data-section'),
        node('data-monitoring', catalog.monitoring, primary, 73, 68, 'data-section'),
      ],
      connections: [
        connection('data-api', 'data-queue', 'Ingest'),
        connection('data-queue', 'data-storage', 'Land'),
        connection('data-storage', 'data-analytics', 'Transform / query'),
        connection('data-security', 'data-api', 'Protect'),
        connection('data-identity', 'data-analytics', 'Authorize'),
        connection('data-analytics', 'data-monitoring', 'Telemetry'),
      ],
    },
  };

  if (provider !== 'Multi-cloud') return [web, eventDriven, dataPlatform];

  const hybrid: ArchitectureTemplate = {
    id: 'hybrid-platform',
    name: 'Hybrid cloud platform',
    description: 'AWS workload, Azure management plane, GCP analytics, and private connectivity.',
    outcome: 'Cross-cloud foundation',
    diagram: {
      groups: [
        { id: 'hybrid-aws', label: 'AWS production', type: 'section', x: 6, y: 18, w: 27, h: 65, theme: 'amber' },
        { id: 'hybrid-core', label: 'Hybrid connectivity', type: 'section', x: 37, y: 18, w: 26, h: 65, theme: 'purple' },
        { id: 'hybrid-gcp', label: 'Google Cloud analytics', type: 'section', x: 67, y: 18, w: 27, h: 65, theme: 'blue' },
      ],
      nodes: [
        node('hybrid-compute', services.AWS.compute, 'AWS', 19, 40, 'hybrid-aws'),
        node('hybrid-db', services.AWS.database, 'AWS', 19, 67, 'hybrid-aws'),
        { id: 'hybrid-arc', label: 'Azure Arc', category: 'Hybrid connectivity', icon: 'network', tone: 'purple', provider: 'Hybrid', x: 50, y: 38, subnetId: 'hybrid-core', size: 100, role: 'connector', connectorKind: 'hybrid' },
        { id: 'hybrid-link', label: 'Cross-Cloud Interconnect', category: 'Hybrid connectivity', icon: 'network', tone: 'teal', provider: 'Hybrid', x: 50, y: 66, subnetId: 'hybrid-core', size: 100, role: 'connector', connectorKind: 'hybrid' },
        node('hybrid-analytics', services.GCP.analytics, 'GCP', 80, 40, 'hybrid-gcp'),
        node('hybrid-monitoring', services.GCP.monitoring, 'GCP', 80, 67, 'hybrid-gcp'),
      ],
      connections: [
        connection('hybrid-compute', 'hybrid-arc', 'Managed by', 'hybrid'),
        connection('hybrid-db', 'hybrid-link', 'Private data path', 'hybrid'),
        connection('hybrid-link', 'hybrid-analytics', 'Replicate', 'hybrid'),
        connection('hybrid-analytics', 'hybrid-monitoring', 'Telemetry'),
      ],
    },
  };
  return [web, eventDriven, dataPlatform, hybrid];
}
