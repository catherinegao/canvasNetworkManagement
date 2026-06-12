import type { NetworkLink, NetworkNode, NetworkTopology } from '../types/network'

const nodes: NetworkNode[] = [
  {
    id: 'cloud-1',
    label: 'Internet',
    kind: 'cloud',
    x: 600,
    y: 80,
    status: 'healthy',
    meta: { region: 'public' }
  },
  {
    id: 'fw-1',
    label: 'Edge-FW-01',
    kind: 'firewall',
    x: 600,
    y: 200,
    status: 'healthy',
    cpu: 22,
    mem: 41,
    ip: '10.0.0.1'
  },
  {
    id: 'rtr-core-1',
    label: 'Core-RTR-01',
    kind: 'router',
    x: 380,
    y: 320,
    status: 'healthy',
    cpu: 35,
    mem: 52,
    ip: '10.0.1.1'
  },
  {
    id: 'rtr-core-2',
    label: 'Core-RTR-02',
    kind: 'router',
    x: 820,
    y: 320,
    status: 'healthy',
    cpu: 31,
    mem: 49,
    ip: '10.0.1.2'
  },
  {
    id: 'sw-a',
    label: 'Dist-SW-A',
    kind: 'switch',
    x: 220,
    y: 460,
    status: 'healthy',
    cpu: 12,
    mem: 28,
    ip: '10.1.0.10'
  },
  {
    id: 'sw-b',
    label: 'Dist-SW-B',
    kind: 'switch',
    x: 540,
    y: 460,
    status: 'healthy',
    cpu: 14,
    mem: 31,
    ip: '10.1.0.11'
  },
  {
    id: 'sw-c',
    label: 'Dist-SW-C',
    kind: 'switch',
    x: 880,
    y: 460,
    status: 'healthy',
    cpu: 18,
    mem: 33,
    ip: '10.1.0.12'
  },
  {
    id: 'srv-app-1',
    label: 'app-server-01',
    kind: 'server',
    x: 140,
    y: 600,
    status: 'healthy',
    cpu: 41,
    mem: 62,
    ip: '10.2.0.21'
  },
  {
    id: 'srv-app-2',
    label: 'app-server-02',
    kind: 'server',
    x: 300,
    y: 600,
    status: 'healthy',
    cpu: 39,
    mem: 58,
    ip: '10.2.0.22'
  },
  {
    id: 'srv-db',
    label: 'db-primary',
    kind: 'server',
    x: 540,
    y: 600,
    status: 'healthy',
    cpu: 55,
    mem: 71,
    ip: '10.2.0.30'
  },
  {
    id: 'srv-cache',
    label: 'cache-cluster',
    kind: 'server',
    x: 800,
    y: 600,
    status: 'healthy',
    cpu: 27,
    mem: 44,
    ip: '10.2.0.40'
  },
  {
    id: 'srv-edge',
    label: 'edge-worker',
    kind: 'server',
    x: 960,
    y: 600,
    status: 'healthy',
    cpu: 33,
    mem: 47,
    ip: '10.2.0.50'
  }
]

const links: NetworkLink[] = [
  { id: 'l-cloud-fw', source: 'cloud-1', target: 'fw-1', bandwidthMbps: 10000, utilization: 12, status: 'up' },
  { id: 'l-fw-r1', source: 'fw-1', target: 'rtr-core-1', bandwidthMbps: 10000, utilization: 18, status: 'up' },
  { id: 'l-fw-r2', source: 'fw-1', target: 'rtr-core-2', bandwidthMbps: 10000, utilization: 16, status: 'up' },
  { id: 'l-r1-r2', source: 'rtr-core-1', target: 'rtr-core-2', bandwidthMbps: 40000, utilization: 22, status: 'up' },
  { id: 'l-r1-swa', source: 'rtr-core-1', target: 'sw-a', bandwidthMbps: 10000, utilization: 14, status: 'up' },
  { id: 'l-r1-swb', source: 'rtr-core-1', target: 'sw-b', bandwidthMbps: 10000, utilization: 19, status: 'up' },
  { id: 'l-r2-swb', source: 'rtr-core-2', target: 'sw-b', bandwidthMbps: 10000, utilization: 21, status: 'up' },
  { id: 'l-r2-swc', source: 'rtr-core-2', target: 'sw-c', bandwidthMbps: 10000, utilization: 17, status: 'up' },
  { id: 'l-swa-app1', source: 'sw-a', target: 'srv-app-1', bandwidthMbps: 1000, utilization: 23, status: 'up' },
  { id: 'l-swa-app2', source: 'sw-a', target: 'srv-app-2', bandwidthMbps: 1000, utilization: 25, status: 'up' },
  { id: 'l-swb-db', source: 'sw-b', target: 'srv-db', bandwidthMbps: 1000, utilization: 38, status: 'up' },
  { id: 'l-swc-cache', source: 'sw-c', target: 'srv-cache', bandwidthMbps: 1000, utilization: 19, status: 'up' },
  { id: 'l-swc-edge', source: 'sw-c', target: 'srv-edge', bandwidthMbps: 1000, utilization: 22, status: 'up' }
]

export const sampleTopology: NetworkTopology = { nodes, links }
