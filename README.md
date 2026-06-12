# Canvas Network Management

A sample **Canvas-based Network Topology View** built with **React + TypeScript + Vite**.
It demonstrates a production-style operations UI with:

- An interactive **HTML5 Canvas** topology (pan, zoom, hit-test, hover, select)
- **Time travel** — step backward/forward through every state change
- **Replay** — auto-advance through a recorded incident timeline at adjustable speed
- A scrubbable **timeline** with per-event markers
- A live **event log** synced to the canvas state
- An **inspector panel** for the selected node or link

> Use it as a starting point for your own NMS / NOC dashboards, observability tools, or any "what changed and when?" visualization.

---

## Table of contents

- [Demo scenario](#demo-scenario)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Architecture](#architecture)
  - [Time travel model](#time-travel-model)
  - [Replay engine](#replay-engine)
  - [Canvas rendering](#canvas-rendering)
  - [State management](#state-management)
- [Sample topology](#sample-topology)
- [Sample event timeline](#sample-event-timeline)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Customizing](#customizing)
  - [Add your own topology](#add-your-own-topology)
  - [Add new event kinds](#add-new-event-kinds)
  - [Plug in a real backend](#plug-in-a-real-backend)
- [Roadmap / extension ideas](#roadmap--extension-ideas)
- [License](#license)

---

## Demo scenario

The bundled scenario simulates a **core-link incident**:

1. Inter-core link utilization spikes
2. The primary database climbs to a warning state
3. A distribution-switch link to the DB degrades
4. The core link goes **down**
5. A core router goes **critical**
6. A cache cluster falls **offline**
7. An operator pushes a BGP failover config
8. The core link recovers, then the router, then the cache, then the DB

You can scrub the timeline, jump to any moment, or hit **▶ Replay** and watch the incident play out on the canvas.

---

## Quick start

```bash
# Clone
git clone https://github.com/catherinegao/canvasNetworkManagement.git
cd canvasNetworkManagement

# Install
npm install

# Dev server (http://localhost:5173)
npm run dev

# Production build
npm run build
npm run preview
```

Requires **Node 18+** (Node 20 LTS recommended).

---

## Scripts

| Script              | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start Vite dev server with HMR                   |
| `npm run build`     | Type-check (`tsc -b`) and produce a prod bundle  |
| `npm run preview`   | Serve the built bundle locally                   |
| `npm run type-check`| Run `tsc --noEmit` only                          |
| `npm run lint`      | Alias for `type-check` (add ESLint as needed)    |

---

## Tech stack

- **React 18** + **TypeScript 5**
- **Vite 5** (fast dev, ESBuild + Rollup)
- **Zustand** for state (tiny, hook-friendly, time-travel-friendly)
- **HTML5 Canvas 2D** for topology rendering — no SVG / no third-party graph lib
- Pure CSS (custom properties / dark theme) — no UI framework lock-in

---

## Project structure

```
canvasNetworkManagement/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                     # React entry
│   ├── App.tsx                      # Layout + global key handlers
│   ├── styles/
│   │   └── global.css               # Theme & layout
│   ├── types/
│   │   └── network.ts               # Domain types: Node, Link, Event, Snapshot
│   ├── data/
│   │   ├── sampleTopology.ts        # Baseline topology
│   │   └── sampleEvents.ts          # Recorded incident timeline
│   ├── store/
│   │   └── networkStore.ts          # Zustand store, snapshots, time-travel
│   ├── hooks/
│   │   └── useReplay.ts             # Auto-advance scheduler
│   └── components/
│       ├── NetworkCanvas/
│       │   ├── NetworkCanvas.tsx    # Canvas + interactions (pan/zoom/click)
│       │   └── canvasRenderer.ts    # Pure draw + hit-test functions
│       ├── Toolbar/Toolbar.tsx
│       ├── TimelineControls/TimelineControls.tsx
│       ├── EventLog/EventLog.tsx
│       └── NodeDetail/NodeDetail.tsx
└── README.md
```

Every source file is kept under ~500 lines with single-responsibility modules so the project stays approachable.

---

## Architecture

### Time travel model

Time travel is implemented with **immutable snapshots**, not "undo/redo of mutations".

1. The app starts with a **baseline topology** (`src/data/sampleTopology.ts`).
2. A list of **events** (`src/data/sampleEvents.ts`) describes what happens, when, and what fields change.
3. On startup, `buildSnapshots()` (in `src/store/networkStore.ts`) folds the events into an array of **snapshots**:

   ```
   snapshots[0]   baseline (T-1s)
   snapshots[1]   baseline + event 1 applied
   snapshots[2]   baseline + events 1..2 applied
   ...
   snapshots[N]   baseline + all events applied
   ```

4. The store keeps a single integer `cursor` pointing into the snapshot array.
5. The canvas, inspector, and event log all read from `snapshots[cursor]`.

This gives you **O(1) random access** to any point in time, plus deterministic, reproducible state — moving the slider to position 7 produces the *exact* same UI every time.

```ts
// src/store/networkStore.ts (excerpt)
function applyEvent(topology, event) {
  const next = cloneTopology(topology)
  if (event.targetType === 'node') {
    // merge `event.after` into the matching node
  } else {
    // merge `event.after` into the matching link
  }
  return next
}

function buildSnapshots(initial, events) {
  const snapshots = [{ id: 'snap-initial', topology: initial, ... }]
  let current = initial
  for (const evt of events) {
    current = applyEvent(current, evt)
    snapshots.push({ id: `snap-${evt.id}`, topology: current, ... })
  }
  return snapshots
}
```

### Replay engine

Replay is **decoupled** from the snapshot model — it only drives the cursor.

```ts
// src/hooks/useReplay.ts
useEffect(() => {
  if (!isReplaying) return
  if (cursor >= total - 1) { setReplaying(false); return }
  const interval = Math.max(120, BASE_INTERVAL_MS / replaySpeed)
  const id = setTimeout(stepForward, interval)
  return () => clearTimeout(id)
}, [isReplaying, cursor, replaySpeed, ...])
```

- Re-runs every time `cursor` changes, scheduling the *next* step.
- Speed selector (0.5×, 1×, 2×, 4×) divides the base interval.
- Auto-stops when the cursor reaches the end.
- Pressing **Replay** again from the end **rewinds** to baseline and starts over.

### Canvas rendering

Rendering is split into a **pure** drawing module and a **React** wrapper:

- `canvasRenderer.ts` exports `renderTopology(ctx, topology, options)` plus `hitTestNode` / `hitTestLink`. No React, no DOM, no state — just functions over the topology and viewport.
- `NetworkCanvas.tsx` owns the `<canvas>` element, viewport (pan / zoom), hover state, and dispatches selection back to the store.

Why plain Canvas instead of SVG / a graph library?

- **Performance**: 1 draw per frame, no per-node React reconciliation.
- **Pixel control**: glow, gradients, dashed line patterns for `degraded` / `down` links.
- **Crisp rendering on HiDPI** via `devicePixelRatio` scaling.
- **Zero dependencies**, easy to fork and restyle.

Rendering features:

- Status-aware link color + line style (`up` solid, `degraded` long-dash, `down` short-dash + faded).
- Link **width grows with utilization**.
- Bandwidth + utilization pill at each link midpoint.
- Node radial-gradient fill keyed to status, plus a small alert badge when not `healthy`.
- Selection halo + hover glow.
- 40px grid background that pans/zooms with the scene.

### State management

A single **Zustand** store holds:

| Field             | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `baselineTopology`| Original immutable topology                      |
| `events`          | Recorded events                                  |
| `snapshots`       | Pre-computed timeline states                     |
| `cursor`          | Current snapshot index                           |
| `isReplaying`     | Replay on/off                                    |
| `replaySpeed`     | 0.5 / 1 / 2 / 4                                  |
| `selectedNodeId`  | Inspector target                                 |
| `selectedLinkId`  | Inspector target                                 |

Selectors (`selectCurrentTopology`, `selectCurrentSnapshot`) keep components decoupled from how state is stored, so you can swap the store later without touching the canvas or the inspector.

---

## Sample topology

The bundled topology models a small data center / branch network:

```
                Internet (cloud)
                     │
                  Edge-FW-01  (firewall)
                  /         \
        Core-RTR-01 ───── Core-RTR-02   (routers, with inter-core link)
          /     \             /     \
     Dist-SW-A  Dist-SW-B   Dist-SW-B  Dist-SW-C
        |         |              |         |    \
   app-server-01 db-primary  (shared)  cache-cluster  edge-worker
   app-server-02
```

12 nodes (1 cloud, 1 firewall, 2 routers, 3 switches, 5 servers) and 13 links with realistic 1G / 10G / 40G bandwidths.

---

## Sample event timeline

`src/data/sampleEvents.ts` ships 12 events spanning ~5 minutes (`T+00:00` to `T+05:30`). Each event has:

```ts
interface TopologyEvent {
  id: string
  timestamp: number
  kind: 'link-down' | 'link-up' | 'link-degraded'
       | 'node-warning' | 'node-critical' | 'node-offline'
       | 'node-recovered' | 'utilization-spike' | 'config-change'
  targetId: string
  targetType: 'node' | 'link'
  message: string
  before?: Partial<NetworkNode> | Partial<NetworkLink>
  after?: Partial<NetworkNode> | Partial<NetworkLink>
}
```

The `before` / `after` patches make events **self-describing**; the store doesn't need to know about specific event kinds — it just merges the `after` patch onto the matching entity.

---

## Keyboard shortcuts

| Key             | Action                              |
| --------------- | ----------------------------------- |
| `Space`         | Play / pause replay                 |
| `←` / `→`       | Step backward / forward             |
| `Home` / `End`  | Jump to baseline / latest           |

Plus on the canvas:

| Action          | How                                 |
| --------------- | ----------------------------------- |
| Pan             | Drag with the mouse                 |
| Zoom            | Mouse wheel (zooms toward cursor)   |
| Select node     | Click a node                        |
| Select link     | Click anywhere on a link            |
| Reset view      | Press the **Reset view** button     |

---

## Customizing

### Add your own topology

Edit `src/data/sampleTopology.ts`:

```ts
export const sampleTopology: NetworkTopology = {
  nodes: [
    { id: 'rtr-1', label: 'My-RTR', kind: 'router',
      x: 400, y: 200, status: 'healthy', cpu: 20, mem: 30, ip: '10.0.0.1' },
    // ...
  ],
  links: [
    { id: 'l1', source: 'rtr-1', target: 'rtr-2',
      bandwidthMbps: 10000, utilization: 12, status: 'up' },
    // ...
  ]
}
```

Coordinates are world-space pixels; the canvas pans / zooms around them. A typical scene fits in a ~1000 × 700 area.

### Add new event kinds

1. Extend `EventKind` in `src/types/network.ts`.
2. Add a label and tone in `src/components/EventLog/EventLog.tsx`.
3. Add events to `src/data/sampleEvents.ts` with a `before` / `after` patch describing the field changes — that's it. The store is event-kind agnostic.

### Plug in a real backend

The store is intentionally simple. To use live data:

1. Replace `sampleTopology` and `sampleEvents` with values fetched from your API.
2. For **streaming** updates: append to `events`, recompute `snapshots`, and bump `cursor` to the new end (or only when the user is "live").
3. For **on-demand history**: keep `snapshots` lazy — store events and rebuild the snapshot for `cursor` on demand.
4. Persist `cursor` + `isReplaying` to the URL (e.g. `?t=7&play=1`) for shareable deep links.

---

## Roadmap / extension ideas

- Force-directed auto-layout (e.g. d3-force) instead of hand-placed coordinates
- Multi-select + bulk actions
- Edit mode: drag nodes, draw new links, persist the topology
- Heatmap overlay (CPU / utilization / latency)
- Mini-map for large topologies
- Per-node sparklines fed from real metrics
- WebSocket adapter for live `TopologyEvent` streams
- "Compare" mode — diff snapshots A and B side-by-side
- Export current snapshot to PNG / SVG / JSON
- Tests with Vitest + Playwright

PRs welcome.

---

## License

MIT — see `LICENSE` (add one if you fork this for production use).
