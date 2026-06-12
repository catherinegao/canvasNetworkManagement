import type { TopologyEvent } from '../types/network'

const T0 = Date.parse('2026-06-11T13:00:00Z')

export const sampleEvents: TopologyEvent[] = [
  {
    id: 'evt-001',
    timestamp: T0 + 0,
    kind: 'utilization-spike',
    targetId: 'l-r1-r2',
    targetType: 'link',
    message: 'Inter-core link utilization rising on Core-RTR-01 <-> Core-RTR-02',
    before: { utilization: 22 },
    after: { utilization: 64 }
  },
  {
    id: 'evt-002',
    timestamp: T0 + 30_000,
    kind: 'node-warning',
    targetId: 'srv-db',
    targetType: 'node',
    message: 'db-primary CPU climbing past 80%',
    before: { status: 'healthy', cpu: 55 },
    after: { status: 'warning', cpu: 84 }
  },
  {
    id: 'evt-003',
    timestamp: T0 + 60_000,
    kind: 'link-degraded',
    targetId: 'l-swb-db',
    targetType: 'link',
    message: 'Dist-SW-B <-> db-primary link degraded (high errors)',
    before: { status: 'up', utilization: 38 },
    after: { status: 'degraded', utilization: 78 }
  },
  {
    id: 'evt-004',
    timestamp: T0 + 95_000,
    kind: 'link-down',
    targetId: 'l-r1-r2',
    targetType: 'link',
    message: 'Core link Core-RTR-01 <-> Core-RTR-02 went DOWN',
    before: { status: 'up', utilization: 64 },
    after: { status: 'down', utilization: 0 }
  },
  {
    id: 'evt-005',
    timestamp: T0 + 120_000,
    kind: 'node-critical',
    targetId: 'rtr-core-2',
    targetType: 'node',
    message: 'Core-RTR-02 reporting critical (control-plane congestion)',
    before: { status: 'healthy', cpu: 31 },
    after: { status: 'critical', cpu: 92 }
  },
  {
    id: 'evt-006',
    timestamp: T0 + 150_000,
    kind: 'node-offline',
    targetId: 'srv-cache',
    targetType: 'node',
    message: 'cache-cluster lost heartbeat (offline)',
    before: { status: 'healthy', cpu: 27 },
    after: { status: 'offline', cpu: 0 }
  },
  {
    id: 'evt-007',
    timestamp: T0 + 180_000,
    kind: 'config-change',
    targetId: 'rtr-core-1',
    targetType: 'node',
    message: 'Operator pushed BGP failover config to Core-RTR-01',
    before: { meta: {} },
    after: { meta: { lastChange: 'bgp-failover-v3' } }
  },
  {
    id: 'evt-008',
    timestamp: T0 + 210_000,
    kind: 'link-up',
    targetId: 'l-r1-r2',
    targetType: 'link',
    message: 'Core link Core-RTR-01 <-> Core-RTR-02 restored',
    before: { status: 'down', utilization: 0 },
    after: { status: 'up', utilization: 28 }
  },
  {
    id: 'evt-009',
    timestamp: T0 + 240_000,
    kind: 'node-recovered',
    targetId: 'rtr-core-2',
    targetType: 'node',
    message: 'Core-RTR-02 recovered (CPU back to nominal)',
    before: { status: 'critical', cpu: 92 },
    after: { status: 'healthy', cpu: 36 }
  },
  {
    id: 'evt-010',
    timestamp: T0 + 270_000,
    kind: 'node-recovered',
    targetId: 'srv-cache',
    targetType: 'node',
    message: 'cache-cluster heartbeat restored',
    before: { status: 'offline', cpu: 0 },
    after: { status: 'healthy', cpu: 24 }
  },
  {
    id: 'evt-011',
    timestamp: T0 + 300_000,
    kind: 'link-up',
    targetId: 'l-swb-db',
    targetType: 'link',
    message: 'Dist-SW-B <-> db-primary link healthy again',
    before: { status: 'degraded', utilization: 78 },
    after: { status: 'up', utilization: 35 }
  },
  {
    id: 'evt-012',
    timestamp: T0 + 330_000,
    kind: 'node-recovered',
    targetId: 'srv-db',
    targetType: 'node',
    message: 'db-primary stabilized after replica failover',
    before: { status: 'warning', cpu: 84 },
    after: { status: 'healthy', cpu: 48 }
  }
]
