export const SITE_COLLAPSED_WIDTH = 160
export const SITE_COLLAPSED_HEIGHT = 60

export function pointInSite(site, x, y) {
  return x >= site.x && x <= site.x + site.width && y >= site.y && y <= site.y + site.height
}

export function siteDisplaySize(site) {
  return site.collapsed
    ? { width: SITE_COLLAPSED_WIDTH, height: SITE_COLLAPSED_HEIGHT }
    : { width: site.width, height: site.height }
}

// Remplace la position des nœuds appartenant à un site replié par le centre
// du bloc replié, pour que les câbles/tunnels qui les touchaient continuent
// de pointer quelque part de sensé au lieu de rester dans le vide.
export function resolveEffectiveNodes(nodes, sites) {
  const collapsedSites = new Map(sites.filter((s) => s.collapsed).map((s) => [s.id, s]))
  if (!collapsedSites.size) return nodes
  return nodes.map((node) => {
    const site = node.siteId ? collapsedSites.get(node.siteId) : null
    if (!site) return node
    const { width, height } = siteDisplaySize(site)
    return { ...node, x: site.x + width / 2, y: site.y + height / 2 }
  })
}
