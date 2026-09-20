'use client';

import { useId } from 'react';
import {
  BrainCircuit,
  BriefcaseBusiness,
  Code2,
  Cpu,
  Database,
  Grid3X3,
  HardDrive,
  Layers3,
  Network,
  RadioTower,
  Settings2,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import type { DiagramDocument } from '@/lib/cloudcraft-types';
import {
  getConnectionGeometry,
  type ConnectionRouting,
} from '@/lib/diagram-geometry';

type PreviewNode = {
  id: string;
  label: string;
  category?: string;
  icon?: string;
  tone?: string;
  x: number;
  y: number;
  size?: number;
  role?: 'service' | 'connector';
  connectorKind?: string;
  provider?: 'AWS' | 'Azure' | 'GCP' | 'Hybrid';
};

type PreviewGroup = {
  id: string;
  label: string;
  type: string;
  theme?: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type PreviewConnection = {
  id: string;
  from: string;
  to: string;
  kind?: string;
  label?: string;
  routing?: ConnectionRouting;
};

const icons = {
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function DiagramPreview({
  diagram,
  compact = false,
}: {
  diagram: DiagramDocument;
  compact?: boolean;
}) {
  const markerId = `diagram-arrow-${useId().replaceAll(':', '')}`;
  const nodes = (Array.isArray(diagram?.nodes) ? diagram.nodes : []).filter(
    (value): value is PreviewNode => {
      const node = value as Partial<PreviewNode>;
      return (
        typeof node.id === 'string' &&
        typeof node.label === 'string' &&
        isFiniteNumber(node.x) &&
        isFiniteNumber(node.y)
      );
    },
  );
  const groups = (Array.isArray(diagram?.groups) ? diagram.groups : []).filter(
    (value): value is PreviewGroup => {
      const group = value as Partial<PreviewGroup>;
      return (
        typeof group.id === 'string' &&
        typeof group.label === 'string' &&
        typeof group.type === 'string' &&
        isFiniteNumber(group.x) &&
        isFiniteNumber(group.y) &&
        isFiniteNumber(group.w) &&
        isFiniteNumber(group.h)
      );
    },
  );
  const connections = (
    Array.isArray(diagram?.connections) ? diagram.connections : []
  ).filter((value): value is PreviewConnection => {
    const connection = value as Partial<PreviewConnection>;
    return (
      typeof connection.id === 'string' &&
      typeof connection.from === 'string' &&
      typeof connection.to === 'string'
    );
  });

  const endpointBounds = (id: string) => {
    const node = nodes.find((item) => item.id === id);
    if (node) {
      const scale = (node.size ?? 100) / 100;
      return {
        x: node.x * 10,
        y: node.y * 6.2,
        w: (node.role === 'connector' ? 128 : 88) * scale,
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

  const connectionGeometry = (connection: PreviewConnection) => {
    const fromBounds = endpointBounds(connection.from);
    const toBounds = endpointBounds(connection.to);
    if (!fromBounds || !toBounds) return null;
    return getConnectionGeometry(fromBounds, toBounds, connection.routing);
  };

  if (!nodes.length && !groups.length) {
    return (
      <div className={`diagram-renderer empty ${compact ? 'compact' : ''}`}>
        <Layers3 />
        {!compact && <span>No canvas elements have been added yet.</span>}
      </div>
    );
  }

  return (
    <div
      className={`diagram-renderer ${compact ? 'compact' : ''}`}
      aria-label="Saved cloud architecture diagram"
    >
      <svg
        className="diagram-renderer-lines"
        viewBox="0 0 1000 620"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <marker
            id={markerId}
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
        {connections.map((connection) => {
          const geometry = connectionGeometry(connection);
          if (!geometry) return null;
          return (
            <g key={connection.id}>
              <path
                className={`diagram-connection connection-${connection.kind ?? 'data'}`}
                d={geometry.path}
                markerEnd={`url(#${markerId})`}
              />
              {!compact && connection.label && (
                <text x={geometry.labelX} y={geometry.labelY}>
                  {connection.label}
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
            className={`diagram-renderer-group ${group.type} theme-${group.theme ?? 'neutral'}`}
            style={{
              left: `${group.x}%`,
              top: `${group.y}%`,
              width: `${group.w}%`,
              height: `${group.h}%`,
            }}
          >
            <span>{group.label}</span>
          </div>
        ))}

      {nodes.map((node) => {
        const Icon = icons[node.icon as keyof typeof icons] ?? Settings2;
        const scale = Math.max(0.6, Math.min(1.8, (node.size ?? 100) / 100));
        return (
          <div
            key={node.id}
            className={`diagram-renderer-node ${node.role === 'connector' ? `network-connector connector-${node.connectorKind ?? 'routing'}` : ''}`}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${(node.role === 'connector' ? 132 : 96) * scale}px`,
            }}
          >
            <i
              className={`service-icon ${node.tone ?? 'purple'}`}
              style={{
                width: `${(node.role === 'connector' ? 30 : 48) * scale}px`,
                height: `${(node.role === 'connector' ? 30 : 48) * scale}px`,
              }}
            >
              <Icon />
            </i>
            <strong style={{ fontSize: `${10 * scale}px` }}>
              {node.label}
            </strong>
            {node.provider && (
              <small
                className={`preview-node-provider provider-${node.provider.toLowerCase()}`}
              >
                {node.provider}
              </small>
            )}
          </div>
        );
      })}
    </div>
  );
}
