import { useNetworkStore } from '../../store/networkStore'

export function Toolbar(): JSX.Element {
  const cursor = useNetworkStore(s => s.cursor)
  const total = useNetworkStore(s => s.snapshots.length)
  const isReplaying = useNetworkStore(s => s.isReplaying)
  const replaySpeed = useNetworkStore(s => s.replaySpeed)
  const stepBackward = useNetworkStore(s => s.stepBackward)
  const stepForward = useNetworkStore(s => s.stepForward)
  const jumpToStart = useNetworkStore(s => s.jumpToStart)
  const jumpToEnd = useNetworkStore(s => s.jumpToEnd)
  const toggleReplay = useNetworkStore(s => s.toggleReplay)
  const setReplaySpeed = useNetworkStore(s => s.setReplaySpeed)
  const resetToBaseline = useNetworkStore(s => s.resetToBaseline)

  return (
    <header className="toolbar">
      <div className="toolbar__brand">
        <div className="toolbar__logo" aria-hidden />
        <div className="toolbar__title">
          <h1>Canvas Network Management</h1>
          <p>Sample topology · time travel · replay</p>
        </div>
      </div>

      <div className="toolbar__group">
        <button
          className="btn"
          type="button"
          onClick={jumpToStart}
          disabled={cursor === 0}
          title="Jump to baseline (Home)"
        >
          ⏮
        </button>
        <button
          className="btn"
          type="button"
          onClick={stepBackward}
          disabled={cursor === 0}
          title="Step backward (←)"
        >
          ◀ Step
        </button>
        <button
          className={`btn btn--primary ${isReplaying ? 'btn--active' : ''}`}
          type="button"
          onClick={toggleReplay}
          title="Toggle replay (Space)"
        >
          {isReplaying ? '❚❚ Pause' : '▶ Replay'}
        </button>
        <button
          className="btn"
          type="button"
          onClick={stepForward}
          disabled={cursor >= total - 1}
          title="Step forward (→)"
        >
          Step ▶
        </button>
        <button
          className="btn"
          type="button"
          onClick={jumpToEnd}
          disabled={cursor >= total - 1}
          title="Jump to latest (End)"
        >
          ⏭
        </button>
      </div>

      <div className="toolbar__group">
        <label className="toolbar__speed">
          Speed
          <select
            value={replaySpeed}
            onChange={e => setReplaySpeed(parseFloat(e.target.value))}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
          </select>
        </label>
        <button className="btn btn--ghost" type="button" onClick={resetToBaseline}>
          Reset
        </button>
      </div>
    </header>
  )
}
