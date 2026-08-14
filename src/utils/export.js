import { downloadBlob } from './download'

// Les couleurs (variables CSS des tokens + classes scoped Vue) vivent dans le
// <head> de la page : invisibles pour un SVG autonome (fichier ouvert ailleurs,
// <img> hors page). On les récupère pour les embarquer dans le SVG exporté.
function collectStylesheetText() {
  let css = ''
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        css += rule.cssText + '\n'
      }
    } catch {
      // Feuille externe/cross-origin inaccessible : ignorée (aucune dans cette appli).
    }
  }
  return css
}

// Clone le SVG affiché en figeant sa taille en pixels (au lieu de 100%/100%).
// `size` (optionnel) force une largeur/hauteur explicite : indispensable pour
// l'export, où on veut capturer tout le contenu du plan (voir setViewForExport
// dans le store), pas juste la fenêtre visible à l'écran.
function serializeSvg(svgEl, size) {
  const rect = size ?? svgEl.getBoundingClientRect()
  const clone = svgEl.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', rect.width)
  clone.setAttribute('height', rect.height)
  // Force le thème clair sur le SVG exporté lui-même (indépendant du thème
  // à l'écran) : voir tokens.css, où :root sans data-theme="light" peut
  // suivre le thème sombre du système/de la page qui affiche le SVG.
  clone.setAttribute('data-theme', 'light')

  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = collectStylesheetText()
  clone.insertBefore(style, clone.firstChild)

  const markup = new XMLSerializer().serializeToString(clone)
  return { markup, width: rect.width, height: rect.height }
}

export function exportSvg(svgEl, filename, size) {
  const { markup } = serializeSvg(svgEl, size)
  downloadBlob(new Blob([markup], { type: 'image/svg+xml' }), filename)
}

export function exportPng(svgEl, filename, size) {
  const { markup, width, height } = serializeSvg(svgEl, size)
  const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  const image = new Image()
  image.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(image, 0, 0, width, height)
    URL.revokeObjectURL(url)
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, filename)
    }, 'image/png')
  }
  image.src = url
}
