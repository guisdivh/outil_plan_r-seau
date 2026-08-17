import { siteDisplaySize } from './siteLayout'
import { RACK_WIDTH, RACK_COLLAPSED_HEIGHT } from './rackLayout'

// Remplace la position des nœuds appartenant à un site ou une baie repliés
// par le centre du bloc replié, pour que les câbles/tunnels qui les touchaient
// continuent de pointer quelque part de sensé au lieu de rester dans le vide.
export function resolveEffectiveNodes(nodes, sites, racks = []) {
  const collapsedSites = new Map(sites.filter((s) => s.collapsed).map((s) => [s.id, s]))
  const racksById = new Map(racks.map((r) => [r.id, r]))
  if (!collapsedSites.size && !racks.some((r) => r.collapsed)) return nodes

  return nodes.map((node) => {
    const rack = node.rackId ? racksById.get(node.rackId) : null
    if (rack?.collapsed) {
      return { ...node, x: rack.x + RACK_WIDTH / 2, y: rack.y + RACK_COLLAPSED_HEIGHT / 2 }
    }
    // Site rattaché directement au nœud, ou indirectement via sa baie (un
    // nœud monté en baie n'a pas de siteId propre, seule sa baie l'a).
    const siteId = node.siteId ?? rack?.siteId ?? null
    const site = siteId ? collapsedSites.get(siteId) : null
    if (site) {
      const { width, height } = siteDisplaySize(site)
      return { ...node, x: site.x + width / 2, y: site.y + height / 2 }
    }
    return node
  })
}
