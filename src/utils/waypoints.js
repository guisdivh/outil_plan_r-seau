function distanceToSegment(p, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lengthSq = dx * dx + dy * dy
  let t = lengthSq === 0 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))
  const projX = a.x + t * dx
  const projY = a.y + t * dy
  return Math.hypot(p.x - projX, p.y - projY)
}

// Index du segment [points[i], points[i+1]] le plus proche de `point`.
// Utilisé pour insérer un nouveau waypoint au bon endroit du tracé.
export function closestSegmentIndex(point, points) {
  let bestIndex = 0
  let bestDist = Infinity
  for (let i = 0; i < points.length - 1; i++) {
    const d = distanceToSegment(point, points[i], points[i + 1])
    if (d < bestDist) {
      bestDist = d
      bestIndex = i
    }
  }
  return bestIndex
}
