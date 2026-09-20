import type { CloudService } from './aws-services';

export const hybridServices: CloudService[] = [
  {
    label: 'Azure Arc',
    category: 'Hybrid connectivity',
    icon: 'network',
    tone: 'purple',
    provider: 'Hybrid',
  },
  {
    label: 'Azure Multicloud Interconnect',
    category: 'Hybrid connectivity',
    icon: 'network',
    tone: 'purple',
    provider: 'Hybrid',
  },
  {
    label: 'AWS Direct Connect',
    category: 'Hybrid connectivity',
    icon: 'network',
    tone: 'orange',
    provider: 'Hybrid',
  },
  {
    label: 'AWS Transit Gateway',
    category: 'Hybrid connectivity',
    icon: 'network',
    tone: 'orange',
    provider: 'Hybrid',
  },
  {
    label: 'Google Cloud Interconnect',
    category: 'Hybrid connectivity',
    icon: 'network',
    tone: 'blue',
    provider: 'Hybrid',
  },
  {
    label: 'Google Cross-Cloud Interconnect',
    category: 'Hybrid connectivity',
    icon: 'network',
    tone: 'blue',
    provider: 'Hybrid',
  },
  {
    label: 'Site-to-Site VPN',
    category: 'Hybrid connectivity',
    icon: 'network',
    tone: 'teal',
    provider: 'Hybrid',
  },
  {
    label: 'SD-WAN',
    category: 'Hybrid connectivity',
    icon: 'network',
    tone: 'teal',
    provider: 'Hybrid',
  },
  {
    label: 'On-premises Datacenter',
    category: 'Hybrid environment',
    icon: 'business',
    tone: 'slate',
    provider: 'Hybrid',
  },
  {
    label: 'Colocation Facility',
    category: 'Hybrid environment',
    icon: 'business',
    tone: 'slate',
    provider: 'Hybrid',
  },
];
