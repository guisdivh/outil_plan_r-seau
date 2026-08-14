import { NODE_SIZE } from '../constants/equipmentTypes'

export function rectIntersectionArea(a, b) {
  const width = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1))
  const height = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1))
  return width * height
}

// Zone qui couvre au moins la moitié de la boîte englobante du nœud (pas
// juste son centre). En cas de chevauchement, la zone la plus petite (la
// plus spécifique) gagne ; à égalité, la dernière du tableau (topmost).
export function findZoneForNode(node, zones) {
  const half = NODE_SIZE / 2
  const nodeArea = NODE_SIZE * NODE_SIZE
  const nodeBox = { x1: node.x - half, y1: node.y - half, x2: node.x + half, y2: node.y + half }

  let best = null
  let bestArea = Infinity
  zones.forEach((zone) => {
    const zoneBox = { x1: zone.x, y1: zone.y, x2: zone.x + zone.width, y2: zone.y + zone.height }
    const overlap = rectIntersectionArea(nodeBox, zoneBox)
    if (overlap < nodeArea / 2) return

    const zoneArea = zone.width * zone.height
    if (zoneArea <= bestArea) {
      best = zone
      bestArea = zoneArea
    }
  })
  return best
}
