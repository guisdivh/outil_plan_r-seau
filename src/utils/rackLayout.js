export const RACK_WIDTH = 220
export const RACK_UNIT_HEIGHT = 22
export const RACK_HEADER_HEIGHT = 28

export function rackHeight(rack) {
  return RACK_HEADER_HEIGHT + rack.units * RACK_UNIT_HEIGHT
}

export function rackBounds(rack) {
  return { x1: rack.x, y1: rack.y, x2: rack.x + RACK_WIDTH, y2: rack.y + rackHeight(rack) }
}

export function pointInRack(rack, x, y) {
  const b = rackBounds(rack)
  return x >= b.x1 && x <= b.x2 && y >= b.y1 && y <= b.y2
}

// Position (centre) d'un équipement monté à l'unité interne `unit` (1 = tout en haut du cadre).
export function rackSlotCenter(rack, unit, span) {
  const top = rack.y + RACK_HEADER_HEIGHT + (unit - 1) * RACK_UNIT_HEIGHT
  return { x: rack.x + RACK_WIDTH / 2, y: top + (span * RACK_UNIT_HEIGHT) / 2 }
}

// Numérotation affichée façon baie 19" réelle : U1 en bas, quel que soit `units`.
// `unit` (position interne) compte depuis le haut du cadre.
export function rackUnitLabel(rack, unit) {
  return rack.units - unit + 1
}

// Cherche la première position libre (depuis le haut) pouvant accueillir `span` U
// consécutives, en excluant l'équipement `excludeNodeId` de son propre encombrement.
// `preferredStart`, si fourni et libre, est utilisé tel quel (réordonnancement sur place).
export function findFreeRackSlot(rack, nodes, span, excludeNodeId, preferredStart) {
  const occupied = new Set()
  for (const n of nodes) {
    if (n.rackId === rack.id && n.id !== excludeNodeId && n.rackUnit) {
      for (let u = n.rackUnit; u < n.rackUnit + n.rackSpan; u++) occupied.add(u)
    }
  }

  const fits = (start) => {
    if (start < 1 || start + span - 1 > rack.units) return false
    for (let u = start; u < start + span; u++) if (occupied.has(u)) return false
    return true
  }

  if (preferredStart && fits(preferredStart)) return preferredStart
  for (let start = 1; start + span - 1 <= rack.units; start++) {
    if (fits(start)) return start
  }
  return null
}
