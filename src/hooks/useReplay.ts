import { useEffect, useRef } from 'react'
import { useNetworkStore } from '../store/networkStore'

const BASE_INTERVAL_MS = 1200

export function useReplay(): void {
  const isReplaying = useNetworkStore(s => s.isReplaying)
  const replaySpeed = useNetworkStore(s => s.replaySpeed)
  const cursor = useNetworkStore(s => s.cursor)
  const total = useNetworkStore(s => s.snapshots.length)
  const stepForward = useNetworkStore(s => s.stepForward)
  const setReplaying = useNetworkStore(s => s.setReplaying)

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isReplaying) {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }
    if (cursor >= total - 1) {
      setReplaying(false)
      return
    }
    const interval = Math.max(120, BASE_INTERVAL_MS / replaySpeed)
    timerRef.current = window.setTimeout(() => {
      stepForward()
    }, interval)
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isReplaying, cursor, total, replaySpeed, stepForward, setReplaying])
}
