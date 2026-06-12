import type {
  LinkStatus,
  NetworkLink,
  NetworkNode,
  NetworkTopology,
  NodeKind,
  NodeStatus
} from '../../types/network'

export interface RenderOptions {
  width: number
  height: number
  scale: number
  offsetX: number
  offsetY: number
  selectedNodeId: string | null
  selectedLinkId: string | null
  hoverNodeId: string | null
  hoverLinkId: string | null
}

const NODE_RADIUS = 28

const NODE_COLORS: Record<NodeStatus, string> = {
  healthy: '#3ddc97',
  warning: '#ffb547',
  critical: '#ff5a5a',
  offline: '#7a7a8a'
}

const LINK_COLORS: Record<LinkStatus, string> = {
  up: '#5a9bff',
  degraded: '#ffb547',
  down: '#ff5a5a'
}

const NODE_GLYPHS: Record<NodeKind, string> = {
  router: 'R',
  switch: 'S',
  server: '▢',
  firewall: 'F',
  cloud: '☁',
  client: 'C'
}

export function renderTopology(
  ctx: CanvasRenderingContext2D,
  topology: NetworkTopology,
  options: RenderOptions
): void {
  const { width, height, scale, offsetX, offsetY } = options
  ctx.save()
  ctx.clearRect(0, 0, width, height)
  drawBackground(ctx, width, height)
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  for (const link of topology.links) {
    drawLink(ctx, link, topology, options)
  }
  for (const node of topology.nodes) {
    drawNode(ctx, node, options)
  }

  ctx.restore()
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, '#0e1320')
  gradient.addColorStop(1, '#080b14')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = 'rgba(90, 110, 160, 0.08)'
  ctx.lineWidth = 1
  const grid = 40
  for (let x = 0; x < width; x += grid) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y < height; y += grid) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

function drawLink(
  ctx: CanvasRenderingContext2D,
  link: NetworkLink,
  topology: NetworkTopology,
  options: RenderOptions
): void {
  const source = topology.nodes.find(n => n.id === link.source)
  const target = topology.nodes.find(n => n.id === link.target)
  if (!source || !target) return

  const isSelected = options.selectedLinkId === link.id
  const isHover = options.hoverLinkId === link.id
  const baseColor = LINK_COLORS[link.status]

  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = baseColor
  ctx.globalAlpha = link.status === 'down' ? 0.55 : 0.9

  const utilization = Math.max(0, Math.min(100, link.utilization))
  const widthBase = 1.2 + utilization / 25
  ctx.lineWidth = isSelected ? widthBase + 3 : isHover ? widthBase + 1.5 : widthBase

  if (link.status === 'down') {
    ctx.setLineDash([6, 6])
  } else if (link.status === 'degraded') {
    ctx.setLineDash([10, 4])
  }

  ctx.beginPath()
  ctx.moveTo(source.x, source.y)
  ctx.lineTo(target.x, target.y)
  ctx.stroke()
  ctx.setLineDash([])

  const midX = (source.x + target.x) / 2
  const midY = (source.y + target.y) / 2
  const labelText = `${formatBandwidth(link.bandwidthMbps)} · ${utilization}%`
  drawPillLabel(ctx, midX, midY, labelText, baseColor, isSelected || isHover)
  ctx.restore()
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  node: NetworkNode,
  options: RenderOptions
): void {
  const isSelected = options.selectedNodeId === node.id
  const isHover = options.hoverNodeId === node.id
  const color = NODE_COLORS[node.status]

  ctx.save()
  if (isSelected || isHover) {
    ctx.shadowColor = color
    ctx.shadowBlur = isSelected ? 22 : 14
  }

  ctx.beginPath()
  ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2)
  const grad = ctx.createRadialGradient(
    node.x - NODE_RADIUS / 3,
    node.y - NODE_RADIUS / 3,
    2,
    node.x,
    node.y,
    NODE_RADIUS
  )
  grad.addColorStop(0, mix(color, '#ffffff', 0.35))
  grad.addColorStop(1, mix(color, '#000000', 0.35))
  ctx.fillStyle = grad
  ctx.fill()

  ctx.lineWidth = isSelected ? 3 : 1.5
  ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.4)'
  ctx.stroke()

  ctx.shadowBlur = 0
  ctx.fillStyle = '#0b0f1a'
  ctx.font = '600 18px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(NODE_GLYPHS[node.kind], node.x, node.y + 1)

  ctx.fillStyle = '#e6ecff'
  ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif'
  ctx.fillText(node.label, node.x, node.y + NODE_RADIUS + 16)

  if (node.ip) {
    ctx.fillStyle = 'rgba(230,236,255,0.55)'
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
    ctx.fillText(node.ip, node.x, node.y + NODE_RADIUS + 32)
  }

  if (node.status !== 'healthy') {
    drawStatusBadge(ctx, node.x + NODE_RADIUS - 4, node.y - NODE_RADIUS + 4, node.status)
  }
  ctx.restore()
}

function drawStatusBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  status: NodeStatus
): void {
  const color = NODE_COLORS[status]
  ctx.beginPath()
  ctx.arc(x, y, 7, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#0b0f1a'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#0b0f1a'
  ctx.font = '700 9px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const glyph = status === 'critical' ? '!' : status === 'warning' ? '!' : '×'
  ctx.fillText(glyph, x, y + 0.5)
}

function drawPillLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  accent: string,
  emphasized: boolean
): void {
  ctx.save()
  ctx.font = '11px ui-sans-serif, system-ui, sans-serif'
  const padX = 6
  const padY = 3
  const metrics = ctx.measureText(text)
  const w = metrics.width + padX * 2
  const h = 16
  ctx.globalAlpha = emphasized ? 1 : 0.78
  ctx.fillStyle = 'rgba(15,20,35,0.9)'
  roundRect(ctx, x - w / 2, y - h / 2, w, h, 8)
  ctx.fill()
  ctx.strokeStyle = accent
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = '#dbe6ff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y + 0.5)
  ctx.restore()
  void padY
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function formatBandwidth(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(0)}G`
  return `${mbps}M`
}

function mix(c1: string, c2: string, ratio: number): string {
  const a = hexToRgb(c1)
  const b = hexToRgb(c2)
  const r = Math.round(a.r * (1 - ratio) + b.r * ratio)
  const g = Math.round(a.g * (1 - ratio) + b.g * ratio)
  const bl = Math.round(a.b * (1 - ratio) + b.b * ratio)
  return `rgb(${r},${g},${bl})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const bigint = parseInt(
    h.length === 3
      ? h
          .split('')
          .map(c => c + c)
          .join('')
      : h,
    16
  )
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  }
}

export function hitTestNode(
  topology: NetworkTopology,
  worldX: number,
  worldY: number
): NetworkNode | null {
  for (let i = topology.nodes.length - 1; i >= 0; i--) {
    const n = topology.nodes[i]
    const dx = worldX - n.x
    const dy = worldY - n.y
    if (dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS) return n
  }
  return null
}

export function hitTestLink(
  topology: NetworkTopology,
  worldX: number,
  worldY: number
): NetworkLink | null {
  const tolerance = 6
  for (const link of topology.links) {
    const a = topology.nodes.find(n => n.id === link.source)
    const b = topology.nodes.find(n => n.id === link.target)
    if (!a || !b) continue
    if (pointToSegmentDistance(worldX, worldY, a.x, a.y, b.x, b.y) <= tolerance) return link
  }
  return null
}

function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return Math.hypot(px - cx, py - cy)
}
