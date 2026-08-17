import { orthogonalPath, laneOffset } from './linkRouting'

// Un bus n'a de sens que si au moins 2 câbles le composent encore (un ou
// zéro membre = rien à simplifier visuellement) : filtre partagé par tous
// les getters qui doivent savoir quels bus sont réellement affichables.
export function visibleBusesOf(buses, links) {
  return buses.filter((b) => links.filter((l) => l.busId === b.id).length >= 2)
}

// Regroupe visuellement les câbles d'un bus : un tronc unique du hub vers le
// centroïde des équipements du groupe, puis une courte dérivation orthogonale
// de ce point vers chaque équipement — même primitive de tracé en Z que le
// routage individuel (linkRouting.js), juste appliquée à d'autres paires de
// points. Aucune donnée de lien n'est lue ni modifiée au-delà de sourceId/
// targetId/busId : c'est un mode de rendu, pas une transformation des câbles.
export function computeBusRoutes(buses, links, nodes) {
  const nodesById = new Map(nodes.map((n) => [n.id, n]))
  const routes = new Map()

  for (const bus of buses) {
    const memberLinks = links.filter((l) => l.busId === bus.id)
    if (memberLinks.length < 2) continue
    const hub = nodesById.get(bus.hubId)
    if (!hub) continue

    const others = memberLinks
      .map((l) => ({ link: l, other: nodesById.get(l.sourceId === bus.hubId ? l.targetId : l.sourceId) }))
      .filter((e) => e.other)
    if (!others.length) continue

    const busPoint = {
      x: others.reduce((sum, e) => sum + e.other.x, 0) / others.length,
      y: others.reduce((sum, e) => sum + e.other.y, 0) / others.length,
    }

    const trunk = orthogonalPath(hub, busPoint, laneOffset(bus.id))
    const derivations = new Map()
    for (const { link, other } of others) {
      derivations.set(link.id, orthogonalPath(busPoint, other, laneOffset(link.id)))
    }

    routes.set(bus.id, { hub, busPoint, trunk, derivations, memberLinkIds: others.map((e) => e.link.id) })
  }

  return routes
}
