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

// Clone le SVG affiché en figeant sa taille en pixels (au lieu de 100%/100%)
// pour obtenir un fichier exporté cohérent quelle que soit la taille de la fenêtre.
function serializeSvg(svgEl) {
  const rect = svgEl.getBoundingClientRect()
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

export function exportSvg(svgEl, filename) {
  const { markup } = serializeSvg(svgEl)
  downloadBlob(new Blob([markup], { type: 'image/svg+xml' }), filename)
}

export function exportPng(svgEl, filename) {
  const { markup, width, height } = serializeSvg(svgEl)
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
