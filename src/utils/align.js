// Calcule les nouvelles positions { id, x, y } pour un alignement/une
// distribution — pures fonctions de géométrie, appliquées ensuite par le
// store (setNodePositions). Référence : les bords de la sélection (min/max),
// pas le premier nœud sélectionné — indépendant de l'ordre de sélection.

export function alignLeft(nodes) {
  const min = Math.min(...nodes.map((n) => n.x))
  return nodes.map((n) => ({ id: n.id, x: min, y: n.y }))
}

export function alignRight(nodes) {
  const max = Math.max(...nodes.map((n) => n.x))
  return nodes.map((n) => ({ id: n.id, x: max, y: n.y }))
}

export function alignTop(nodes) {
  const min = Math.min(...nodes.map((n) => n.y))
  return nodes.map((n) => ({ id: n.id, x: n.x, y: min }))
}

export function alignBottom(nodes) {
  const max = Math.max(...nodes.map((n) => n.y))
  return nodes.map((n) => ({ id: n.id, x: n.x, y: max }))
}

export function centerHorizontal(nodes) {
  const xs = nodes.map((n) => n.x)
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2
  return nodes.map((n) => ({ id: n.id, x: mid, y: n.y }))
}

export function centerVertical(nodes) {
  const ys = nodes.map((n) => n.y)
  const mid = (Math.min(...ys) + Math.max(...ys)) / 2
  return nodes.map((n) => ({ id: n.id, x: n.x, y: mid }))
}

// Garde les deux nœuds extrêmes fixes, répartit les autres à espacement égal
// entre eux (sur les centres — les nœuds font tous la même taille, donc
// équivalent à un espacement égal entre bords).
export function distributeHorizontal(nodes) {
  if (nodes.length < 3) return nodes.map((n) => ({ id: n.id, x: n.x, y: n.y }))
  const sorted = [...nodes].sort((a, b) => a.x - b.x)
  const min = sorted[0].x
  const max = sorted[sorted.length - 1].x
  const step = (max - min) / (sorted.length - 1)
  return sorted.map((n, i) => ({ id: n.id, x: min + i * step, y: n.y }))
}

export function distributeVertical(nodes) {
  if (nodes.length < 3) return nodes.map((n) => ({ id: n.id, x: n.x, y: n.y }))
  const sorted = [...nodes].sort((a, b) => a.y - b.y)
  const min = sorted[0].y
  const max = sorted[sorted.length - 1].y
  const step = (max - min) / (sorted.length - 1)
  return sorted.map((n, i) => ({ id: n.id, x: n.x, y: min + i * step }))
}
