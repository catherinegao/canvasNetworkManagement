import { useEffect, useRef } from 'react'
import { useNetworkStore } from '../../store/networkStore'
import type { EventKind, TopologyEvent } from '../../types/network'

const KIND_LABEL: Record<EventKind, string> = {
  'link-down': 'LINK DOWN',
  'link-up': 'LINK UP',
  'link-degraded': 'LINK DEGRADED',
  'node-warning': 'WARNING',
  'node-critical': 'CRITICAL',
  'node-offline': 'OFFLINE',
  'node-recovered': 'RECOVERED',
  'utilization-spike': 'UTILIZATION',
  'config-change': 'CONFIG'
}

const KIND_TONE: Record<EventKind, string> = {
  'link-down': 'critical',
  'link-up': 'healthy',
  'link-degraded': 'warning',
  'node-warning': 'warning',
  'node-critical': 'critical',
  'node-offline': 'critical',
  'node-recovered': 'healthy',
  'utilization-spike': 'warning',
  'config-change': 'info'
}

function snapshotIndexForEvent(snapshotIds: string[], eventId: string): number {
  return snapshotIds.indexOf(`snap-${eventId}`)
}

export function EventLog(): JSX.Element {
  const events = useNetworkStore(s => s.events)
  const snapshots = useNetworkStore(s => s.snapshots)
  const cursor = useNetworkStore(s => s.cursor)
  const setCursor = useNetworkStore(s => s.setCursor)

  const listRef = useRef<HTMLUListElement | null>(null)
  const snapshotIds = snapshots.map(s => s.id)
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  const currentEventId = snapshots[cursor]?.triggeringEventId ?? null

  useEffect(() => {
    const el = listRef.current?.querySelector('.event-log__item.is-active') as HTMLElement | null
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [cursor])

  const baseline = snapshots[0]?.timestamp ?? 0

  return (
    <aside className="event-log" aria-label="Event log">
      <header className="event-log__header">
        <h2>Event log</h2>
        <span className="event-log__count">{sorted.length} events</span>
      </header>
      <ul className="event-log__list" ref={listRef}>
        {sorted.map(evt => {
          const isActive = evt.id === currentEventId
          const idx = snapshotIndexForEvent(snapshotIds, evt.id)
          const isPast = idx >= 0 && idx <= cursor
          return (
            <li
              key={evt.id}
              className={`event-log__item ${isActive ? 'is-active' : ''} ${isPast ? 'is-past' : ''}`}
            >
              <button
                type="button"
                className="event-log__btn"
                onClick={() => idx >= 0 && setCursor(idx)}
              >
                <span className={`event-log__badge tone-${KIND_TONE[evt.kind]}`}>
                  {KIND_LABEL[evt.kind]}
                </span>
                <span className="event-log__time">{formatRelative(evt, baseline)}</span>
                <span className="event-log__msg">{evt.message}</span>
                <span className="event-log__target">
                  {evt.targetType}: {evt.targetId}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

function formatRelative(evt: TopologyEvent, baseline: number): string {
  const delta = Math.max(0, evt.timestamp - baseline)
  const totalSeconds = Math.floor(delta / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `T+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
