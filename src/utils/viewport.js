export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

// Convertit une position écran (clientX/Y) en coordonnées "plan", en tenant
// compte du pan/zoom actuel — le seul endroit où cette conversion doit exister
// (tous les composants qui gèrent un glisser-déposer passent par ici).
export function screenToCanvas(clientX, clientY, svgEl, pan, zoom) {
  const rect = svgEl.getBoundingClientRect()
  return {
    x: (clientX - rect.left - pan.x) / zoom,
    y: (clientY - rect.top - pan.y) / zoom,
  }
}
