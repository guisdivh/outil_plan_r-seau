import { siteDisplaySize } from './siteLayout'
import { RACK_WIDTH, RACK_COLLAPSED_HEIGHT } from './rackLayout'

// Remplace la position des nœuds appartenant à un site ou une baie repliés
// par le centre du bloc replié, pour que les câbles/tunnels qui les touchaient
// continuent de pointer quelque part de sensé au lieu de rester dans le vide.
export function resolveEffectiveNodes(nodes, sites, racks = []) {
  const collapsedSites = new Map(sites.filter((s) => s.collapsed).map((s) => [s.id, s]))
  const collapsedRacks = new Map(racks.filter((r) => r.collapsed).map((r) => [r.id, r]))
  if (!collapsedSites.size && !collapsedRacks.size) return nodes

  return nodes.map((node) => {
    if (node.rackId && collapsedRacks.has(node.rackId)) {
      const rack = collapsedRacks.get(node.rackId)
      return { ...node, x: rack.x + RACK_WIDTH / 2, y: rack.y + RACK_COLLAPSED_HEIGHT / 2 }
    }
    const site = node.siteId ? collapsedSites.get(node.siteId) : null
    if (site) {
      const { width, height } = siteDisplaySize(site)
      return { ...node, x: site.x + width / 2, y: site.y + height / 2 }
    }
    return node
  })
}
