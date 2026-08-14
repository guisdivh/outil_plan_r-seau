import { RACK_WIDTH, rackDisplayHeight } from './rackLayout'
import { siteDisplaySize } from './siteLayout'
import { NODE_SIZE } from '../constants/equipmentTypes'

// Boîte englobante de tout le contenu du plan, en coordonnées "plan" (pas écran).
// Utilisé pour l'export (capturer le plan entier, pas juste la fenêtre visible)
// et pour « ajuster à l'écran ». Retourne un rectangle par défaut si le plan est vide.
export function computePlanBounds(nodes, zones, racks, sites, links) {
  const half = NODE_SIZE / 2
  const points = []

  for (const n of nodes) {
    points.push({ x: n.x - half, y: n.y - half }, { x: n.x + half, y: n.y + half })
  }
  for (const z of zones) {
    points.push({ x: z.x, y: z.y }, { x: z.x + z.width, y: z.y + z.height })
  }
  for (const r of racks) {
    const h = rackDisplayHeight(r)
    points.push({ x: r.x, y: r.y }, { x: r.x + RACK_WIDTH, y: r.y + h })
  }
  for (const s of sites) {
    const { width, height } = siteDisplaySize(s)
    points.push({ x: s.x, y: s.y }, { x: s.x + width, y: s.y + height })
  }
  for (const l of links) {
    for (const wp of l.waypoints) points.push(wp)
  }

  if (!points.length) return { minX: 0, minY: 0, maxX: 800, maxY: 600 }

  return {
    minX: Math.min(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxX: Math.max(...points.map((p) => p.x)),
    maxY: Math.max(...points.map((p) => p.y)),
  }
}
