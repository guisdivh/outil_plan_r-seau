const NODE_GAP = 100
const LAYER_HEIGHT = 110
const TOP = 80

// Place les nœuds par composante connexe : dans chaque composante, la couche 0
// est le nœud le plus connecté (effet "étoile"), puis on étale ses voisins par
// couches successives (BFS) — plus lisible qu'une simple grille pour un réseau.
export function autoLayout(nodes, links, offsetX = 80) {
  const positions = new Map()
  if (!nodes.length) return positions

  const adjacency = new Map(nodes.map((n) => [n.id, new Set()]))
  for (const link of links) {
    adjacency.get(link.sourceId)?.add(link.targetId)
    adjacency.get(link.targetId)?.add(link.sourceId)
  }

  const visited = new Set()
  let cursorX = offsetX

  for (const seed of nodes) {
    if (visited.has(seed.id)) continue

    const component = []
    const inComponent = new Set([seed.id])
    const queue = [seed.id]
    while (queue.length) {
      const id = queue.shift()
      component.push(id)
      for (const neighbor of adjacency.get(id) ?? []) {
        if (!inComponent.has(neighbor)) {
          inComponent.add(neighbor)
          queue.push(neighbor)
        }
      }
    }

    const root = component.reduce((best, id) =>
      (adjacency.get(id)?.size ?? 0) > (adjacency.get(best)?.size ?? 0) ? id : best,
    component[0])

    const layers = [[root]]
    visited.add(root)
    let frontier = [root]
    while (frontier.length) {
      const next = []
      for (const id of frontier) {
        for (const neighbor of adjacency.get(id) ?? []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor)
            next.push(neighbor)
          }
        }
      }
      if (next.length) layers.push(next)
      frontier = next
    }

    const componentWidth = Math.max(...layers.map((l) => l.length)) * NODE_GAP
    layers.forEach((layerIds, layerIndex) => {
      const layerWidth = layerIds.length * NODE_GAP
      const startX = cursorX + (componentWidth - layerWidth) / 2 + NODE_GAP / 2
      layerIds.forEach((id, i) => {
        positions.set(id, { x: startX + i * NODE_GAP, y: TOP + layerIndex * LAYER_HEIGHT })
      })
    })

    cursorX += componentWidth + NODE_GAP
  }

  return positions
}
