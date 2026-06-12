export type NodeKind =
  | 'router'
  | 'switch'
  | 'server'
  | 'firewall'
  | 'cloud'
  | 'client'

export type LinkStatus = 'up' | 'degraded' | 'down'
export type NodeStatus = 'healthy' | 'warning' | 'critical' | 'offline'

export interface NetworkNode {
  id: string
  label: string
  kind: NodeKind
  x: number
  y: number
  status: NodeStatus
  cpu?: number
  mem?: number
  ip?: string
  meta?: Record<string, string | number>
}

export interface NetworkLink {
  id: string
  source: string
  target: string
  bandwidthMbps: number
  utilization: number
  status: LinkStatus
  label?: string
}

export interface NetworkTopology {
  nodes: NetworkNode[]
  links: NetworkLink[]
}

export type EventKind =
  | 'link-down'
  | 'link-up'
  | 'link-degraded'
  | 'node-warning'
  | 'node-critical'
  | 'node-offline'
  | 'node-recovered'
  | 'utilization-spike'
  | 'config-change'

export interface TopologyEvent {
  id: string
  timestamp: number
  kind: EventKind
  targetId: string
  targetType: 'node' | 'link'
  message: string
  before?: Partial<NetworkNode> | Partial<NetworkLink>
  after?: Partial<NetworkNode> | Partial<NetworkLink>
}

export interface Snapshot {
  id: string
  timestamp: number
  topology: NetworkTopology
  triggeringEventId?: string
  description: string
}
