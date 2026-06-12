import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNetworkStore, selectCurrentTopology } from '../../store/networkStore'
import { hitTestLink, hitTestNode, renderTopology } from './canvasRenderer'

export function NetworkCanvas(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const topology = useNetworkStore(selectCurrentTopology)
  const selectedNodeId = useNetworkStore(s => s.selectedNodeId)
  const selectedLinkId = useNetworkStore(s => s.selectedLinkId)
  const selectNode = useNetworkStore(s => s.selectNode)
  const selectLink = useNetworkStore(s => s.selectLink)

  const [size, setSize] = useState({ width: 800, height: 600 })
  const [viewport, setViewport] = useState({ scale: 1, offsetX: 0, offsetY: 0 })
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null)
  const [hoverLinkId, setHoverLinkId] = useState<string | null>(null)
  const [pan, setPan] = useState<{ active: boolean; startX: number; startY: number } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = size.width * ratio
    canvas.height = size.height * ratio
    canvas.style.width = `${size.width}px`
    canvas.style.height = `${size.height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    renderTopology(ctx, topology, {
      width: size.width,
      height: size.height,
      scale: viewport.scale,
      offsetX: viewport.offsetX,
      offsetY: viewport.offsetY,
      selectedNodeId,
      selectedLinkId,
      hoverNodeId,
      hoverLinkId
    })
  }, [topology, size, viewport, selectedNodeId, selectedLinkId, hoverNodeId, hoverLinkId])

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      return {
        x: (sx - viewport.offsetX) / viewport.scale,
        y: (sy - viewport.offsetY) / viewport.scale
      }
    },
    [viewport]
  )

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      if (pan?.active) {
        setViewport(v => ({
          ...v,
          offsetX: v.offsetX + (sx - pan.startX),
          offsetY: v.offsetY + (sy - pan.startY)
        }))
        setPan({ active: true, startX: sx, startY: sy })
        return
      }
      const { x, y } = screenToWorld(sx, sy)
      const n = hitTestNode(topology, x, y)
      const l = n ? null : hitTestLink(topology, x, y)
      setHoverNodeId(n?.id ?? null)
      setHoverLinkId(l?.id ?? null)
      e.currentTarget.style.cursor = n || l ? 'pointer' : pan ? 'grabbing' : 'grab'
    },
    [pan, screenToWorld, topology]
  )

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    setPan({ active: true, startX: sx, startY: sy })
  }, [])

  const onMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const isClick =
        pan && Math.abs(sx - pan.startX) < 3 && Math.abs(sy - pan.startY) < 3
      setPan(null)
      if (!isClick) return
      const { x, y } = screenToWorld(sx, sy)
      const n = hitTestNode(topology, x, y)
      if (n) {
        selectNode(n.id)
        return
      }
      const l = hitTestLink(topology, x, y)
      if (l) {
        selectLink(l.id)
        return
      }
      selectNode(null)
    },
    [pan, screenToWorld, selectLink, selectNode, topology]
  )

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    setViewport(v => {
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const nextScale = Math.max(0.4, Math.min(2.5, v.scale * factor))
      const wx = (sx - v.offsetX) / v.scale
      const wy = (sy - v.offsetY) / v.scale
      return {
        scale: nextScale,
        offsetX: sx - wx * nextScale,
        offsetY: sy - wy * nextScale
      }
    })
  }, [])

  const resetView = useCallback(() => setViewport({ scale: 1, offsetX: 0, offsetY: 0 }), [])

  const overlay = useMemo(() => {
    return (
      <div className="canvas-overlay">
        <div className="canvas-overlay__pill">
          Zoom: {(viewport.scale * 100).toFixed(0)}%
        </div>
        <button className="btn btn--ghost" onClick={resetView} type="button">
          Reset view
        </button>
      </div>
    )
  }, [resetView, viewport.scale])

  return (
    <div className="network-canvas" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onMouseMove={onMouseMove}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={() => setPan(null)}
        onWheel={onWheel}
      />
      {overlay}
    </div>
  )
}
