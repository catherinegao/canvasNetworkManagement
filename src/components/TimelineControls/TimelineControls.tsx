import { useNetworkStore, selectCurrentSnapshot } from '../../store/networkStore'

function formatTime(ts: number, baseline: number): string {
  const delta = Math.max(0, ts - baseline)
  const totalSeconds = Math.floor(delta / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `T+${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function TimelineControls(): JSX.Element {
  const snapshots = useNetworkStore(s => s.snapshots)
  const cursor = useNetworkStore(s => s.cursor)
  const setCursor = useNetworkStore(s => s.setCursor)
  const current = useNetworkStore(selectCurrentSnapshot)

  const baseline = snapshots[0]?.timestamp ?? 0

  return (
    <section className="timeline" aria-label="Timeline scrubber">
      <div className="timeline__row">
        <span className="timeline__cursor">{formatTime(current.timestamp, baseline)}</span>
        <input
          className="timeline__slider"
          type="range"
          min={0}
          max={snapshots.length - 1}
          step={1}
          value={cursor}
          onChange={e => setCursor(parseInt(e.target.value, 10))}
          aria-label="Scrub through history"
        />
        <span className="timeline__count">
          {cursor + 1} / {snapshots.length}
        </span>
      </div>

      <div className="timeline__ticks" role="presentation">
        {snapshots.map((snap, i) => {
          const isActive = i === cursor
          const isPast = i < cursor
          return (
            <button
              key={snap.id}
              type="button"
              className={`timeline__tick ${isActive ? 'is-active' : ''} ${isPast ? 'is-past' : ''}`}
              onClick={() => setCursor(i)}
              title={`${formatTime(snap.timestamp, baseline)} — ${snap.description}`}
              aria-label={`Snapshot ${i + 1}: ${snap.description}`}
            />
          )
        })}
      </div>

      <div className="timeline__legend">
        <span className="legend">
          <i className="legend__dot legend__dot--healthy" /> Healthy
        </span>
        <span className="legend">
          <i className="legend__dot legend__dot--warning" /> Warning
        </span>
        <span className="legend">
          <i className="legend__dot legend__dot--critical" /> Critical
        </span>
        <span className="legend">
          <i className="legend__dot legend__dot--offline" /> Offline / Down
        </span>
      </div>
    </section>
  )
}
