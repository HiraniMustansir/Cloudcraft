import type { CloudService, ServiceIcon } from './aws-services';

const group = (
  category: string,
  icon: ServiceIcon,
  tone: string,
  names: string,
): CloudService[] =>
  names
    .split('|')
    .map((label) => ({ label, category, icon, tone, provider: 'GCP' }));

const services: CloudService[] = [
  ...group(
    'Compute',
    'compute',
    'orange',
    'Compute Engine|Cloud Run|Cloud Run functions|App Engine|Google Kubernetes Engine|Bare Metal Solution|VMware Engine|Cloud GPUs|Cloud TPUs|Batch|Sole-tenant Nodes|Migrate to Virtual Machines|Recommender|Workload Manager|Google Distributed Cloud',
  ),
  ...group(
    'Containers',
    'compute',
    'orange',
    'Google Kubernetes Engine|Cloud Run|Artifact Registry|Google Distributed Cloud|Config Sync|Binary Authorization|Cloud Build|Container-Optimized OS|Kubernetes Engine Enterprise|Managed Service for Apache Kafka',
  ),
  ...group(
    'Storage',
    'storage',
    'green',
    'Cloud Storage|Cloud Storage FUSE|Persistent Disk|Hyperdisk|Local SSD|Filestore|Parallelstore|NetApp Volumes|Backup and DR Service|Storage Transfer Service|Transfer Appliance|Google Cloud Managed Lustre',
  ),
  ...group(
    'Databases',
    'database',
    'blue',
    'Cloud SQL|AlloyDB for PostgreSQL|Spanner|Firestore|Bigtable|Memorystore|MongoDB Atlas on Google Cloud|Database Migration Service|Datastream|Bare Metal Solution|Firebase Realtime Database|Firebase Data Connect',
  ),
  ...group(
    'Data Analytics',
    'analytics',
    'blue',
    'BigQuery|BigLake|Dataflow|Dataproc|Dataplex Universal Catalog|Pub/Sub|Dataform|Cloud Composer|Looker|Looker Studio|Analytics Hub|Datastream|Data Fusion|Data Catalog|Google Earth Engine|Google Maps Platform|Chronicle Data Lake|Managed Service for Apache Kafka',
  ),
  ...group(
    'Networking',
    'network',
    'blue',
    'Virtual Private Cloud|Cloud Load Balancing|Cloud CDN|Cloud DNS|Cloud NAT|Cloud Router|Cloud VPN|Cloud Interconnect|Cross-Cloud Interconnect|Cross-Cloud Network|Private Service Connect|Network Connectivity Center|Network Service Tiers|Cloud Armor|Cloud Firewall|Firewall Insights|Network Intelligence Center|Network Management Center|Service Directory|Traffic Director|Media CDN|Telecom Network Automation|Carrier Peering|Direct Peering|Cloud Domains|Secure Web Proxy|Spectrum Access System',
  ),
  ...group(
    'AI + Machine Learning',
    'ai',
    'purple',
    'Vertex AI|Vertex AI Studio|Vertex AI Agent Builder|Vertex AI Search|Vertex AI Model Garden|Vertex AI Workbench|Vertex AI Pipelines|Vertex AI Feature Store|Gemini Enterprise Agent Platform|Gemini Enterprise|Gemini Code Assist|Gemini Cloud Assist|Document AI|Vision AI|Video Intelligence API|Speech-to-Text|Text-to-Speech|Translation AI|Natural Language AI|Recommendations AI|Contact Center AI|Dialogflow|AutoML|Cloud TPU|Deep Learning VM Images|AI Hypercomputer|Colab Enterprise|Agent Assist|Anti Money Laundering AI|Healthcare Natural Language AI',
  ),
  ...group(
    'Security + Identity',
    'security',
    'red',
    'Identity and Access Management|Cloud Identity|Identity Platform|Identity-Aware Proxy|Security Command Center|Google Security Operations|Cloud Armor|Cloud Firewall|Cloud KMS|Cloud HSM|Secret Manager|Certificate Authority Service|Certificate Manager|Binary Authorization|Assured Workloads|Confidential Computing|Confidential Space|Sensitive Data Protection|Web Risk|reCAPTCHA Enterprise|BeyondCorp Enterprise|Access Context Manager|Policy Intelligence|VPC Service Controls|Workload Identity Federation|Organization Policy Service|Titan Security Key|Risk Manager',
  ),
  ...group(
    'Operations + Management',
    'management',
    'teal',
    'Cloud Monitoring|Cloud Logging|Cloud Trace|Cloud Profiler|Error Reporting|Cloud Audit Logs|Google Cloud Observability|Managed Service for Prometheus|Cloud Asset Inventory|Cloud Billing|Cloud Billing Reports|Cloud Quotas|Cloud Console|Cloud Mobile App|Config Controller|Infrastructure Manager|Service Usage|Service Health|Personalized Service Health|Active Assist|Carbon Footprint|FinOps Hub|Application Performance Management',
  ),
  ...group(
    'Developer Tools',
    'developer',
    'indigo',
    'Cloud Build|Cloud Deploy|Cloud Code|Cloud Shell|Cloud Workstations|Artifact Registry|Secure Source Manager|Cloud Scheduler|Cloud Tasks|Cloud Profiler|Cloud Trace|Error Reporting|Google Cloud SDK|Google Cloud APIs|Gemini Code Assist|Firebase Studio|Application Integration|Developer Connect|Service Infrastructure',
  ),
  ...group(
    'Application Integration',
    'integration',
    'purple',
    'Apigee API Management|API Gateway|Cloud Endpoints|Application Integration|Integration Connectors|Pub/Sub|Eventarc|Cloud Tasks|Cloud Scheduler|Workflows|Service Directory|Cloud Healthcare API|Telecom Subscriber Insights',
  ),
  ...group(
    'Serverless + App Development',
    'developer',
    'blue',
    'Cloud Run|Cloud Run functions|App Engine|Firebase|Firebase Hosting|Firebase Authentication|Firebase Cloud Messaging|Firebase Crashlytics|Firebase App Distribution|Firebase Remote Config|Firebase Test Lab|Firebase Performance Monitoring|Firebase Data Connect|Firestore|API Gateway|Eventarc|Workflows',
  ),
  ...group(
    'Migration + Multicloud',
    'integration',
    'teal',
    'Anthos|Google Distributed Cloud|GKE Enterprise|Migrate to Virtual Machines|Migrate to Containers|Database Migration Service|Storage Transfer Service|Transfer Appliance|Cloud Interconnect|Cross-Cloud Interconnect|Cross-Cloud Network|Backup and DR Service|VMware Engine|BigQuery Migration Service|Migration Center|Rapid Migration Program',
  ),
  ...group(
    'Internet of Things + Edge',
    'iot',
    'green',
    'Google Distributed Cloud|Google Distributed Cloud Edge|Edge TPU|Coral|Pub/Sub|Dataflow|Spectrum Access System|Telecom Network Automation',
  ),
  ...group(
    'Business + Collaboration',
    'business',
    'green',
    'Google Workspace|AppSheet|Google Maps Platform|Google Earth Engine|Contact Center AI|Google Agentspace|Google Cloud Marketplace|Chrome Enterprise|Google Distributed Cloud',
  ),
  ...group(
    'Media + Games',
    'business',
    'purple',
    'Live Stream API|Transcoder API|Video Stitcher API|Media CDN|Video Intelligence API|Immersive Stream for XR|OpenCue|Agones|Google Cloud for Games',
  ),
];

export const gcpServices = Array.from(
  new Map(services.map((service) => [service.label, service])).values(),
);
