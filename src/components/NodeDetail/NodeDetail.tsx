import { useNetworkStore, selectCurrentTopology } from '../../store/networkStore'
import type { NetworkLink, NetworkNode } from '../../types/network'

export function NodeDetail(): JSX.Element {
  const topology = useNetworkStore(selectCurrentTopology)
  const selectedNodeId = useNetworkStore(s => s.selectedNodeId)
  const selectedLinkId = useNetworkStore(s => s.selectedLinkId)

  if (selectedNodeId) {
    const node = topology.nodes.find(n => n.id === selectedNodeId)
    if (!node) return <EmptyDetail />
    const adjacent = topology.links.filter(
      l => l.source === node.id || l.target === node.id
    )
    return <NodePanel node={node} adjacent={adjacent} />
  }

  if (selectedLinkId) {
    const link = topology.links.find(l => l.id === selectedLinkId)
    if (!link) return <EmptyDetail />
    const source = topology.nodes.find(n => n.id === link.source)
    const target = topology.nodes.find(n => n.id === link.target)
    return <LinkPanel link={link} source={source} target={target} />
  }

  return <EmptyDetail />
}

function EmptyDetail(): JSX.Element {
  return (
    <section className="detail detail--empty" aria-label="Selection details">
      <h2>Inspector</h2>
      <p>Click any node or link in the canvas to inspect its current state.</p>
      <ul className="detail__hints">
        <li>
          <kbd>Space</kbd> Play / pause replay
        </li>
        <li>
          <kbd>←</kbd>/<kbd>→</kbd> Step through history
        </li>
        <li>
          <kbd>Home</kbd>/<kbd>End</kbd> Jump to baseline / latest
        </li>
        <li>Drag the canvas to pan, scroll to zoom.</li>
      </ul>
    </section>
  )
}

function NodePanel({
  node,
  adjacent
}: {
  node: NetworkNode
  adjacent: NetworkLink[]
}): JSX.Element {
  return (
    <section className="detail" aria-label="Node details">
      <header className="detail__header">
        <span className={`detail__pill tone-${node.status}`}>{node.status}</span>
        <div>
          <h2>{node.label}</h2>
          <p>
            {node.kind} · {node.id}
          </p>
        </div>
      </header>
      <dl className="detail__grid">
        {node.ip && (
          <div>
            <dt>IP</dt>
            <dd>{node.ip}</dd>
          </div>
        )}
        {typeof node.cpu === 'number' && (
          <div>
            <dt>CPU</dt>
            <dd>
              <Bar value={node.cpu} />
              <span>{node.cpu}%</span>
            </dd>
          </div>
        )}
        {typeof node.mem === 'number' && (
          <div>
            <dt>Memory</dt>
            <dd>
              <Bar value={node.mem} />
              <span>{node.mem}%</span>
            </dd>
          </div>
        )}
        <div>
          <dt>Adjacent links</dt>
          <dd>{adjacent.length}</dd>
        </div>
      </dl>
      {node.meta && Object.keys(node.meta).length > 0 && (
        <div className="detail__meta">
          <h3>Metadata</h3>
          <ul>
            {Object.entries(node.meta).map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <span>{String(v)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="detail__links">
        <h3>Connections</h3>
        <ul>
          {adjacent.map(link => (
            <li key={link.id} className={`tone-link-${link.status}`}>
              <span>
                {link.source} ↔ {link.target}
              </span>
              <span>
                {link.utilization}% · {link.status}
              </span>
            </li>
          ))}
          {adjacent.length === 0 && <li className="muted">No adjacent links</li>}
        </ul>
      </div>
    </section>
  )
}

function LinkPanel({
  link,
  source,
  target
}: {
  link: NetworkLink
  source?: NetworkNode
  target?: NetworkNode
}): JSX.Element {
  return (
    <section className="detail" aria-label="Link details">
      <header className="detail__header">
        <span className={`detail__pill tone-link-${link.status}`}>{link.status}</span>
        <div>
          <h2>
            {source?.label ?? link.source} ↔ {target?.label ?? link.target}
          </h2>
          <p>{link.id}</p>
        </div>
      </header>
      <dl className="detail__grid">
        <div>
          <dt>Bandwidth</dt>
          <dd>{(link.bandwidthMbps / 1000).toFixed(1)} Gbps</dd>
        </div>
        <div>
          <dt>Utilization</dt>
          <dd>
            <Bar value={link.utilization} />
            <span>{link.utilization}%</span>
          </dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{source?.label ?? link.source}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{target?.label ?? link.target}</dd>
        </div>
      </dl>
    </section>
  )
}

function Bar({ value }: { value: number }): JSX.Element {
  const v = Math.max(0, Math.min(100, value))
  const tone = v >= 80 ? 'critical' : v >= 60 ? 'warning' : 'healthy'
  return (
    <div className={`bar bar--${tone}`}>
      <div className="bar__fill" style={{ width: `${v}%` }} />
    </div>
  )
}
