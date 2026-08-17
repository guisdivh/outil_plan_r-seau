// Écart entre deux points d'attache voisins sur un même équipement, pour que
// plusieurs câbles ne partent pas tous du même pixel.
const PORT_SPACING = 10

// Petit décalage déterministe (dérivé d'un id) sur le coude du tracé, pour
// désempiler deux routes auto qui tomberaient sinon sur la même ligne.
// Exporté : réutilisé par busRouting.js pour le tronc/les dérivations d'un bus.
export function laneOffset(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000
  return ((hash % 5) - 2) * 6
}

// Tracé orthogonal en « Z » (2 coudes) entre deux points déjà positionnés.
// Exporté : c'est le même primitive utilisée pour router un câble individuel
// ET pour router le tronc/les dérivations d'un bus (busRouting.js) — le mode
// bus ne remplace pas le routage orthogonal, il l'applique à d'autres paires
// de points (hub↔centroïde, centroïde↔équipement au lieu de source↔cible).
export function orthogonalPath(a, b, lane = 0) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (Math.abs(dx) >= Math.abs(dy)) {
    const midX = (a.x + b.x) / 2 + lane
    return [a, { x: midX, y: a.y }, { x: midX, y: b.y }, b]
  }
  const midY = (a.y + b.y) / 2 + lane
  return [a, { x: a.x, y: midY }, { x: b.x, y: midY }, b]
}

// Tracé orthogonal en « Z » (2 coudes) entre deux points d'attache déjà décalés.
function autoRoutePoints(link, source, target, sourceOffset, targetOffset) {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const len = Math.hypot(dx, dy) || 1
  const perp = { x: -dy / len, y: dx / len }

  const a = { x: source.x + perp.x * sourceOffset, y: source.y + perp.y * sourceOffset }
  const b = { x: target.x + perp.x * targetOffset, y: target.y + perp.y * targetOffset }
  return orthogonalPath(a, b, laneOffset(link.id))
}

// Calcule, pour tous les câbles, la liste de points à tracer : tracé libre à
// travers les waypoints manuels s'il y en a, sinon tracé orthogonal auto avec
// points d'attache décalés pour écarter les câbles d'un même équipement.
export function computeLinkRoutes(links, nodes) {
  const nodesById = new Map(nodes.map((n) => [n.id, n]))
  const portOffsets = new Map()

  for (const node of nodes) {
    const attached = []
    for (const link of links) {
      if (link.sourceId !== node.id && link.targetId !== node.id) continue
      const otherId = link.sourceId === node.id ? link.targetId : link.sourceId
      const other = nodesById.get(otherId)
      if (!other) continue
      attached.push({ linkId: link.id, angle: Math.atan2(other.y - node.y, other.x - node.x) })
    }
    attached.sort((a, b) => a.angle - b.angle)
    const n = attached.length
    attached.forEach((entry, i) => {
      portOffsets.set(`${entry.linkId}:${node.id}`, (i - (n - 1) / 2) * PORT_SPACING)
    })
  }

  const routes = new Map()
  for (const link of links) {
    const source = nodesById.get(link.sourceId)
    const target = nodesById.get(link.targetId)
    if (!source || !target) continue

    if (link.waypoints.length > 0) {
      routes.set(link.id, [{ x: source.x, y: source.y }, ...link.waypoints, { x: target.x, y: target.y }])
      continue
    }

    const sourceOffset = portOffsets.get(`${link.id}:${source.id}`) ?? 0
    const targetOffset = portOffsets.get(`${link.id}:${target.id}`) ?? 0
    routes.set(link.id, autoRoutePoints(link, source, target, sourceOffset, targetOffset))
  }
  return routes
}
