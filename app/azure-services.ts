import type { CloudService, ServiceIcon } from './aws-services';

const group = (
  category: string,
  icon: ServiceIcon,
  tone: string,
  names: string,
): CloudService[] =>
  names
    .split('|')
    .map((label) => ({ label, category, icon, tone, provider: 'Azure' }));

const services: CloudService[] = [
  ...group(
    'Compute',
    'compute',
    'blue',
    'Azure Virtual Machines|Virtual Machine Scale Sets|Azure Spot Virtual Machines|Azure Dedicated Host|Azure Compute Fleet|Azure Batch|Azure Functions|Azure App Service|Azure Spring Apps|Azure VMware Solution|Azure Quantum|Azure VM Image Builder|Azure CycleCloud|Azure HPC Cache|Azure Local|SQL Server on Azure Virtual Machines|Azure Static Web Apps|Azure Virtual Desktop|Azure Cloud Services',
  ),
  ...group(
    'Containers',
    'compute',
    'blue',
    'Azure Kubernetes Service (AKS)|Azure Container Apps|Azure Container Instances|Azure Container Registry|Azure Container Storage|Azure Red Hat OpenShift|Azure Kubernetes Fleet Manager|Azure Service Fabric',
  ),
  ...group(
    'Storage',
    'storage',
    'teal',
    'Azure Blob Storage|Azure Files|Azure Managed Disks|Azure Data Lake Storage|Azure Archive Storage|Azure Queue Storage|Azure Table Storage|Azure Elastic SAN|Azure NetApp Files|Azure Storage Actions|Azure Storage Mover|Azure Data Box|Azure Backup|Azure File Sync|Azure HPC Cache|Azure Managed Lustre|Azure Container Storage',
  ),
  ...group(
    'Databases',
    'database',
    'blue',
    'Azure Cosmos DB|Azure SQL Database|Azure SQL Managed Instance|Azure SQL|Azure Database for PostgreSQL|Azure Database for MySQL|Azure Managed Redis|Azure Cache for Redis|Azure Managed Instance for Apache Cassandra|Azure DocumentDB|Azure HorizonDB|Azure confidential ledger|Azure Database Migration Service|SQL Server on Azure Virtual Machines|Azure Table Storage',
  ),
  ...group(
    'Networking',
    'network',
    'blue',
    'Azure Virtual Network|Azure Load Balancer|Azure Application Gateway|Azure Front Door|Azure Traffic Manager|Azure DNS|Azure Private DNS|Azure CDN|Azure NAT Gateway|Azure VPN Gateway|Azure ExpressRoute|Azure Private Link|Azure Private Endpoint|Azure Virtual WAN|Azure Virtual Network Manager|Azure Network Watcher|Azure Bastion|Azure Firewall|Azure Firewall Manager|Azure DDoS Protection|Azure Web Application Firewall|Azure Route Server|Azure Multicloud Interconnect|Azure Cross-Cloud Network|Azure Peering Service|Azure Communications Gateway|Azure Operator Nexus|Azure Network Function Manager|Azure Orbital Ground Station|Azure Internet Analyzer|Azure Public IP|Azure Route Table|Azure Network Security Group',
  ),
  ...group(
    'AI + Machine Learning',
    'ai',
    'purple',
    'Microsoft Foundry|Azure OpenAI in Foundry Models|Foundry Agent Service|Foundry Models|Foundry Tools|Foundry Control Plane|Foundry IQ|Azure Machine Learning|Azure AI Search|Azure AI Bot Service|Azure AI Content Safety|Azure AI Document Intelligence|Azure AI Video Indexer|Azure AI Vision|Azure AI Speech|Azure AI Language|Azure AI Translator|Azure AI Custom Vision|Azure AI Immersive Reader|Azure Content Understanding|Azure Databricks|Azure Open Datasets|Azure Health Bot|Azure SRE Agent|Data Science Virtual Machines|Microsoft Security Copilot|Phi open models',
  ),
  ...group(
    'Analytics',
    'analytics',
    'purple',
    'Microsoft Fabric|Azure Synapse Analytics|Azure Databricks|Azure Data Explorer|Azure Stream Analytics|Azure Data Factory|Azure Event Hubs|Azure HDInsight|Azure Analysis Services|Power BI Embedded|Microsoft Purview|Azure Chaos Studio|Microsoft Graph Data Connect|Azure Managed Grafana|Azure Data Share',
  ),
  ...group(
    'Integration',
    'integration',
    'purple',
    'Azure API Management|Azure Logic Apps|Azure Service Bus|Azure Event Grid|Azure Event Hubs|Azure Data Factory|Azure Functions|Azure Relay|Azure Web PubSub|Azure SignalR Service|Azure Health Data Services|Azure Communication Services|Azure Notification Hubs',
  ),
  ...group(
    'Security',
    'security',
    'red',
    'Microsoft Defender for Cloud|Microsoft Sentinel|Azure Key Vault|Azure Managed HSM|Azure Cloud HSM|Azure Firewall|Azure DDoS Protection|Azure Web Application Firewall|Azure Bastion|Azure Confidential Computing|Microsoft Azure Attestation|Azure confidential ledger|Azure Information Protection|Azure Dedicated HSM|Azure Front Door|Azure Policy|Microsoft Purview|Microsoft Security Copilot',
  ),
  ...group(
    'Identity',
    'security',
    'red',
    'Microsoft Entra ID|Microsoft Entra Domain Services|Microsoft Entra External ID|Microsoft Entra ID Governance|Microsoft Entra Internet Access|Microsoft Entra Private Access|Microsoft Entra Verified ID|Microsoft Entra Permissions Management|Azure Managed Identities|Azure Role-Based Access Control',
  ),
  ...group(
    'Management + Governance',
    'management',
    'teal',
    'Azure Monitor|Azure Advisor|Azure Policy|Azure Resource Manager|Azure Resource Graph|Azure Resource Mover|Azure Automation|Azure Automanage|Azure Lighthouse|Azure Managed Applications|Azure Service Health|Azure Cost Management|Azure Chaos Studio|Azure Managed Grafana|Azure Network Watcher|Azure Update Manager|Azure Site Recovery|Azure Cloud Shell|Azure Deployment Environments|Azure Center for SAP solutions|Azure Infrastructure Resiliency Manager',
  ),
  ...group(
    'Developer Tools',
    'developer',
    'indigo',
    'Azure DevOps|Azure DevOps Server|Azure Repos|Azure Pipelines|Azure Boards|Azure Artifacts|Azure Test Plans|GitHub Enterprise|GitHub Actions|GitHub Advanced Security|GitHub Copilot|Visual Studio|Visual Studio Code|Azure SDK|Azure CLI|Azure Cloud Shell|Azure App Configuration|Azure DevTest Labs|Azure Load Testing|Azure Deployment Environments|Microsoft Playwright Testing|Azure Managed DevOps Pools',
  ),
  ...group(
    'Internet of Things',
    'iot',
    'teal',
    'Azure IoT Hub|Azure IoT Central|Azure IoT Edge|Azure Digital Twins|Azure IoT Operations|Azure Sphere|Azure Device Registry|Azure Maps|Windows for IoT|Azure RTOS',
  ),
  ...group(
    'Hybrid + Multicloud',
    'network',
    'purple',
    'Azure Arc|Azure Local|Azure Stack Hub|Azure Stack Edge|Azure Multicloud Interconnect|Azure ExpressRoute|Azure VPN Gateway|Azure IoT Edge|Azure Operator Nexus|Azure Operator Service Manager|Azure Storage Mover|Azure Migrate|Microsoft Defender for Cloud|Microsoft Sentinel',
  ),
  ...group(
    'Migration',
    'integration',
    'teal',
    'Azure Migrate|Azure Database Migration Service|Azure Data Box|Azure Storage Mover|Azure Site Recovery|Azure App Service Migration Assistant|Azure Data Migration Assistant|Azure Resource Mover',
  ),
  ...group(
    'Web + Mobile',
    'developer',
    'blue',
    'Azure App Service|Azure Static Web Apps|Azure Front Door|Azure Content Delivery Network|Azure SignalR Service|Azure Web PubSub|Azure Notification Hubs|Azure Communication Services|Azure Maps|Azure API Management',
  ),
  ...group(
    'Media',
    'business',
    'purple',
    'Azure AI Video Indexer|Azure Content Delivery Network|Azure Communication Services|Azure Orbital Ground Station',
  ),
];

export const azureServices = Array.from(
  new Map(services.map((service) => [service.label, service])).values(),
);
