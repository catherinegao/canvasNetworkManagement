import { useEffect } from 'react'
import { NetworkCanvas } from './components/NetworkCanvas/NetworkCanvas'
import { Toolbar } from './components/Toolbar/Toolbar'
import { TimelineControls } from './components/TimelineControls/TimelineControls'
import { EventLog } from './components/EventLog/EventLog'
import { NodeDetail } from './components/NodeDetail/NodeDetail'
import { useNetworkStore } from './store/networkStore'
import { useReplay } from './hooks/useReplay'

export default function App(): JSX.Element {
  useReplay()

  const stepBackward = useNetworkStore(s => s.stepBackward)
  const stepForward = useNetworkStore(s => s.stepForward)
  const jumpToStart = useNetworkStore(s => s.jumpToStart)
  const jumpToEnd = useNetworkStore(s => s.jumpToEnd)
  const toggleReplay = useNetworkStore(s => s.toggleReplay)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
      if (e.key === ' ') {
        e.preventDefault()
        toggleReplay()
      } else if (e.key === 'ArrowLeft') {
        stepBackward()
      } else if (e.key === 'ArrowRight') {
        stepForward()
      } else if (e.key === 'Home') {
        jumpToStart()
      } else if (e.key === 'End') {
        jumpToEnd()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleReplay, stepForward, stepBackward, jumpToStart, jumpToEnd])

  return (
    <div className="app-shell">
      <Toolbar />
      <main className="app-main">
        <section className="app-canvas-region">
          <NetworkCanvas />
          <TimelineControls />
        </section>
        <aside className="app-sidebar">
          <NodeDetail />
          <EventLog />
        </aside>
      </main>
    </div>
  )
}
