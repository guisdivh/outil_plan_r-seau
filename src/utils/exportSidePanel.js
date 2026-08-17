// Géométrie du panneau latéral d'export (légende VLAN + récap branchements) —
// partagée entre son rendu (ExportSidePanel.vue) et le calcul de la taille de
// l'export (setViewForExport dans le store), pour que l'image capturée soit
// toujours assez large/haute pour le contenir entièrement.
export const SIDE_PANEL_WIDTH = 240
export const SIDE_PANEL_GAP = 20

export function legendHeight(vlanCount) {
  return vlanCount ? 26 + vlanCount * 18 : 0
}

export function cablingHeight(linkCount) {
  return linkCount ? 26 + linkCount * 28 : 0
}

export function sidePanelHeight(vlanCount, linkCount) {
  const legend = legendHeight(vlanCount)
  const cabling = cablingHeight(linkCount)
  return legend + (legend && cabling ? 12 : 0) + cabling
}

// Largeur totale à réserver à droite du contenu du plan (0 si le panneau est
// entièrement vide, pour ne pas élargir l'export pour rien).
export function sidePanelFootprint(vlanCount, linkCount) {
  const height = sidePanelHeight(vlanCount, linkCount)
  return { width: height ? SIDE_PANEL_GAP + SIDE_PANEL_WIDTH : 0, height }
}
