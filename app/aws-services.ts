export type ServiceIcon =
  | 'compute'
  | 'database'
  | 'storage'
  | 'network'
  | 'security'
  | 'analytics'
  | 'integration'
  | 'management'
  | 'ai'
  | 'iot'
  | 'developer'
  | 'business';

export type CloudService = {
  label: string;
  category: string;
  icon: ServiceIcon;
  tone: string;
};

const group = (
  category: string,
  icon: ServiceIcon,
  tone: string,
  names: string,
): CloudService[] =>
  names.split('|').map((label) => ({ label, category, icon, tone }));

const allServices: CloudService[] = [
  ...group(
    'Compute',
    'compute',
    'orange',
    'Amazon EC2|EC2 Auto Scaling|EC2 Image Builder|AWS Lambda|AWS Batch|AWS Elastic Beanstalk|AWS Fargate|Amazon Lightsail|AWS App Runner|AWS Outposts|AWS Wavelength|AWS Local Zones|AWS Parallel Computing Service|AWS Serverless Application Repository|VMware Cloud on AWS|AWS Nitro Enclaves|AWS Compute Optimizer|Amazon EC2 Spot',
  ),
  ...group(
    'Containers',
    'compute',
    'orange',
    'Amazon ECS|Amazon EKS|Amazon ECR|AWS Fargate|AWS App2Container|Red Hat OpenShift Service on AWS|AWS Proton|Amazon EKS Anywhere|Amazon ECS Anywhere|AWS Copilot',
  ),
  ...group(
    'Storage',
    'storage',
    'green',
    'Amazon S3|Amazon S3 Glacier|Amazon EBS|Amazon EFS|Amazon FSx|FSx for Windows File Server|FSx for Lustre|FSx for NetApp ONTAP|FSx for OpenZFS|AWS Storage Gateway|AWS Backup|AWS Elastic Disaster Recovery|AWS Snowcone|AWS Snowball Edge|AWS Snowmobile|AWS DataSync|AWS Transfer Family|AWS File Cache',
  ),
  ...group(
    'Database',
    'database',
    'blue',
    'Amazon Aurora|Amazon RDS|Amazon DynamoDB|Amazon ElastiCache|Amazon MemoryDB|Amazon Neptune|Amazon DocumentDB|Amazon Keyspaces|Amazon Timestream|Amazon QLDB|Amazon Redshift|Amazon RDS Proxy|Amazon Database Migration Service|AWS Database Migration Service Fleet Advisor|Amazon DynamoDB Accelerator|Amazon Aurora DSQL|Amazon RDS Custom|Amazon SimpleDB',
  ),
  ...group(
    'Networking & Content Delivery',
    'network',
    'purple',
    'Amazon VPC|Amazon Route 53|Elastic Load Balancing|AWS Transit Gateway|AWS PrivateLink|AWS Direct Connect|AWS Site-to-Site VPN|AWS Client VPN|AWS Cloud WAN|Amazon CloudFront|AWS Global Accelerator|AWS App Mesh|AWS Cloud Map|AWS Network Firewall|AWS Verified Access|AWS Private 5G|AWS Network Manager|VPC Lattice|AWS Network Access Analyzer|AWS Reachability Analyzer|Route 53 Resolver|Route 53 Application Recovery Controller|AWS Telco Network Builder|Elastic Fabric Adapter|AWS Direct Connect Gateway|AWS NAT Gateway|Internet Gateway|VPC Peering|Elastic Network Interface|Elastic IP Address',
  ),
  ...group(
    'Security, Identity & Compliance',
    'security',
    'red',
    'AWS Identity and Access Management|IAM Identity Center|Amazon Cognito|AWS Organizations|AWS Control Tower|AWS Directory Service|AWS Resource Access Manager|AWS Security Hub|Amazon GuardDuty|Amazon Inspector|Amazon Macie|Amazon Detective|AWS Shield|AWS WAF|AWS Firewall Manager|AWS Network Firewall|AWS Key Management Service|AWS CloudHSM|AWS Certificate Manager|AWS Private Certificate Authority|AWS Secrets Manager|AWS Artifact|AWS Audit Manager|AWS Config|AWS CloudTrail|Amazon Security Lake|AWS Signer|AWS Payment Cryptography|AWS Verified Permissions|AWS Security Incident Response|Amazon VPC Block Public Access',
  ),
  ...group(
    'Management & Governance',
    'management',
    'pink',
    'Amazon CloudWatch|AWS CloudFormation|AWS Systems Manager|AWS CloudTrail|AWS Config|AWS Control Tower|AWS Organizations|AWS Service Catalog|AWS Trusted Advisor|AWS Health Dashboard|AWS Auto Scaling|AWS Chatbot|AWS Compute Optimizer|AWS Console Mobile Application|AWS License Manager|AWS Managed Services|AWS OpsWorks|AWS Proton|AWS Resilience Hub|AWS Resource Explorer|AWS Resource Groups|AWS Service Management Connector|AWS Systems Manager Incident Manager|AWS User Notifications|AWS Well-Architected Tool|Amazon Managed Grafana|Amazon Managed Service for Prometheus',
  ),
  ...group(
    'Developer Tools',
    'developer',
    'indigo',
    'AWS CodeArtifact|AWS CodeBuild|AWS CodeCommit|AWS CodeDeploy|AWS CodePipeline|AWS Cloud9|AWS CloudShell|AWS Cloud Development Kit|AWS Command Line Interface|AWS SDKs and Tools|AWS X-Ray|Amazon CodeCatalyst|Amazon CodeGuru Reviewer|Amazon CodeGuru Profiler|Amazon Q Developer|AWS AppConfig|AWS Fault Injection Service|AWS Infrastructure Composer|AWS Tools and SDKs|AWS Device Farm',
  ),
  ...group(
    'Application Integration',
    'integration',
    'pink',
    'Amazon API Gateway|Amazon EventBridge|Amazon Simple Notification Service|Amazon Simple Queue Service|AWS Step Functions|Amazon MQ|Amazon AppFlow|AWS AppSync|Amazon Managed Workflows for Apache Airflow|Amazon Simple Email Service|AWS B2B Data Interchange|AWS Transfer Family|Amazon EventBridge Pipes|Amazon EventBridge Scheduler|AWS Express Workflows',
  ),
  ...group(
    'Analytics',
    'analytics',
    'blue',
    'Amazon Athena|Amazon EMR|Amazon Redshift|Amazon OpenSearch Service|Amazon Kinesis Data Streams|Amazon Data Firehose|Amazon Managed Service for Apache Flink|Amazon QuickSight|AWS Glue|AWS Glue DataBrew|AWS Lake Formation|Amazon DataZone|Amazon MSK|Amazon FinSpace|AWS Clean Rooms|AWS Data Exchange|AWS Entity Resolution|AWS Data Pipeline|Amazon CloudSearch|Amazon OpenSearch Serverless|Amazon Redshift Serverless|Amazon EMR Serverless|Amazon EMR on EKS|Amazon Kinesis Video Streams|AWS DataSync Discovery',
  ),
  ...group(
    'AI & Machine Learning',
    'ai',
    'purple',
    'Amazon Bedrock|Amazon SageMaker AI|SageMaker Studio|SageMaker Canvas|SageMaker Ground Truth|SageMaker Feature Store|SageMaker Model Monitor|SageMaker Pipelines|SageMaker JumpStart|SageMaker Edge Manager|Amazon Rekognition|Amazon Textract|Amazon Comprehend|Amazon Translate|Amazon Transcribe|Amazon Polly|Amazon Lex|Amazon Kendra|Amazon Personalize|Amazon Forecast|Amazon Fraud Detector|Amazon Lookout for Equipment|Amazon Lookout for Metrics|Amazon Lookout for Vision|AWS HealthScribe|AWS Panorama|AWS DeepRacer|AWS Trainium|AWS Inferentia|Amazon Q Business|Amazon Q Apps|Amazon Augmented AI|AWS Neuron|Amazon Mechanical Turk',
  ),
  ...group(
    'Migration & Transfer',
    'integration',
    'teal',
    'AWS Migration Hub|AWS Application Migration Service|AWS Database Migration Service|AWS DataSync|AWS Transfer Family|AWS Snow Family|AWS Mainframe Modernization|AWS Application Discovery Service|Migration Evaluator|AWS Migration Hub Refactor Spaces|AWS Migration Hub Strategy Recommendations|AWS Elastic Disaster Recovery|AWS Schema Conversion Tool|AWS Application Discovery Agent|AWS Transform',
  ),
  ...group(
    'Internet of Things',
    'iot',
    'green',
    'AWS IoT Core|AWS IoT Device Management|AWS IoT Device Defender|AWS IoT Greengrass|AWS IoT SiteWise|AWS IoT Events|AWS IoT Analytics|AWS IoT FleetWise|AWS IoT TwinMaker|AWS IoT Wireless|Amazon FreeRTOS|AWS IoT ExpressLink|AWS IoT Button|AWS IoT 1-Click|AWS IoT Jobs|AWS IoT Device SDK',
  ),
  ...group(
    'Front-End Web & Mobile',
    'developer',
    'indigo',
    'AWS Amplify|AWS AppSync|Amazon API Gateway|Amazon Cognito|AWS Device Farm|Amazon Location Service|Amazon Pinpoint|AWS Amplify Hosting|AWS Amplify Studio|AWS Amplify DataStore',
  ),
  ...group(
    'End User Computing',
    'business',
    'orange',
    'Amazon WorkSpaces|Amazon WorkSpaces Web|Amazon WorkSpaces Core|Amazon AppStream 2.0|Amazon WorkDocs|Amazon WorkMail|Amazon DCV|Amazon WorkSpaces Secure Browser|AWS End User Messaging|Amazon Connect',
  ),
  ...group(
    'Business Applications',
    'business',
    'teal',
    'Amazon Connect|Amazon Chime SDK|Amazon Simple Email Service|AWS Supply Chain|AWS Wickr|Amazon WorkDocs|Amazon WorkMail|AWS AppFabric|Amazon Honeycode|Amazon Pinpoint|AWS End User Messaging|Amazon One Enterprise',
  ),
  ...group(
    'Media Services',
    'business',
    'pink',
    'Amazon Elastic Transcoder|AWS Elemental MediaConnect|AWS Elemental MediaConvert|AWS Elemental MediaLive|AWS Elemental MediaPackage|AWS Elemental MediaStore|AWS Elemental MediaTailor|Amazon Interactive Video Service|Amazon Kinesis Video Streams|AWS Deadline Cloud|Amazon Nimble Studio|AWS Thinkbox Deadline|AWS Elemental Link|Amazon CloudFront',
  ),
  ...group(
    'Cloud Financial Management',
    'management',
    'green',
    'AWS Cost Explorer|AWS Budgets|AWS Cost and Usage Report|AWS Billing Conductor|AWS Cost Anomaly Detection|AWS Application Cost Profiler|Savings Plans|Reserved Instance Reporting|AWS Marketplace|AWS Purchase Orders',
  ),
  ...group(
    'Game Tech',
    'compute',
    'orange',
    'Amazon GameLift Servers|Amazon GameLift Streams|AWS GameKit|Open 3D Engine|AWS SimSpace Weaver|Amazon Lumberyard',
  ),
  ...group(
    'Blockchain',
    'database',
    'blue',
    'Amazon Managed Blockchain|Amazon Managed Blockchain Query|Amazon Quantum Ledger Database',
  ),
  ...group(
    'Robotics, Satellite & Quantum',
    'iot',
    'purple',
    'AWS RoboMaker|AWS Ground Station|Amazon Braket|AWS SimSpace Weaver',
  ),
];

export const awsServices = Array.from(
  new Map(allServices.map((service) => [service.label, service])).values(),
);

export const awsCategories = [
  'All',
  ...Array.from(new Set(awsServices.map((service) => service.category))),
];
