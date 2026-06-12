import { create } from 'zustand'
import type {
  NetworkLink,
  NetworkNode,
  NetworkTopology,
  Snapshot,
  TopologyEvent
} from '../types/network'
import { sampleTopology } from '../data/sampleTopology'
import { sampleEvents } from '../data/sampleEvents'

function cloneTopology(topology: NetworkTopology): NetworkTopology {
  return {
    nodes: topology.nodes.map(n => ({ ...n, meta: { ...(n.meta ?? {}) } })),
    links: topology.links.map(l => ({ ...l }))
  }
}

function applyEvent(topology: NetworkTopology, event: TopologyEvent): NetworkTopology {
  const next = cloneTopology(topology)
  if (event.targetType === 'node') {
    const idx = next.nodes.findIndex(n => n.id === event.targetId)
    if (idx >= 0 && event.after) {
      const merged: NetworkNode = {
        ...next.nodes[idx],
        ...(event.after as Partial<NetworkNode>),
        meta: {
          ...(next.nodes[idx].meta ?? {}),
          ...((event.after as Partial<NetworkNode>).meta ?? {})
        }
      }
      next.nodes[idx] = merged
    }
  } else {
    const idx = next.links.findIndex(l => l.id === event.targetId)
    if (idx >= 0 && event.after) {
      next.links[idx] = { ...next.links[idx], ...(event.after as Partial<NetworkLink>) }
    }
  }
  return next
}

function buildSnapshots(initial: NetworkTopology, events: TopologyEvent[]): Snapshot[] {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  const snapshots: Snapshot[] = []
  const t0 = sorted.length > 0 ? sorted[0].timestamp : Date.now()
  snapshots.push({
    id: 'snap-initial',
    timestamp: t0 - 1000,
    topology: cloneTopology(initial),
    description: 'Baseline topology — all systems nominal'
  })
  let current = cloneTopology(initial)
  for (const evt of sorted) {
    current = applyEvent(current, evt)
    snapshots.push({
      id: `snap-${evt.id}`,
      timestamp: evt.timestamp,
      topology: current,
      triggeringEventId: evt.id,
      description: evt.message
    })
  }
  return snapshots
}

export interface NetworkState {
  baselineTopology: NetworkTopology
  events: TopologyEvent[]
  snapshots: Snapshot[]
  cursor: number
  selectedNodeId: string | null
  selectedLinkId: string | null
  isReplaying: boolean
  replaySpeed: number
  setCursor: (cursor: number) => void
  stepForward: () => void
  stepBackward: () => void
  jumpToStart: () => void
  jumpToEnd: () => void
  selectNode: (id: string | null) => void
  selectLink: (id: string | null) => void
  toggleReplay: () => void
  setReplaying: (v: boolean) => void
  setReplaySpeed: (s: number) => void
  resetToBaseline: () => void
}

const initialSnapshots = buildSnapshots(sampleTopology, sampleEvents)

export const useNetworkStore = create<NetworkState>((set, get) => ({
  baselineTopology: sampleTopology,
  events: sampleEvents,
  snapshots: initialSnapshots,
  cursor: 0,
  selectedNodeId: null,
  selectedLinkId: null,
  isReplaying: false,
  replaySpeed: 1,

  setCursor: cursor => {
    const { snapshots } = get()
    const clamped = Math.max(0, Math.min(snapshots.length - 1, cursor))
    set({ cursor: clamped })
  },

  stepForward: () => {
    const { cursor, snapshots } = get()
    if (cursor < snapshots.length - 1) set({ cursor: cursor + 1 })
  },

  stepBackward: () => {
    const { cursor } = get()
    if (cursor > 0) set({ cursor: cursor - 1 })
  },

  jumpToStart: () => set({ cursor: 0, isReplaying: false }),

  jumpToEnd: () => {
    const { snapshots } = get()
    set({ cursor: snapshots.length - 1, isReplaying: false })
  },

  selectNode: id => set({ selectedNodeId: id, selectedLinkId: null }),

  selectLink: id => set({ selectedLinkId: id, selectedNodeId: null }),

  toggleReplay: () => {
    const { isReplaying, cursor, snapshots } = get()
    if (!isReplaying && cursor >= snapshots.length - 1) {
      set({ cursor: 0, isReplaying: true })
    } else {
      set({ isReplaying: !isReplaying })
    }
  },

  setReplaying: v => set({ isReplaying: v }),

  setReplaySpeed: s => set({ replaySpeed: s }),

  resetToBaseline: () =>
    set({
      cursor: 0,
      isReplaying: false,
      selectedNodeId: null,
      selectedLinkId: null
    })
}))

export function selectCurrentTopology(state: NetworkState): NetworkTopology {
  return state.snapshots[state.cursor].topology
}

export function selectCurrentSnapshot(state: NetworkState): Snapshot {
  return state.snapshots[state.cursor]
}
