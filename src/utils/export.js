import { downloadBlob } from './download'

// Clone le SVG affiché en figeant sa taille en pixels (au lieu de 100%/100%)
// pour obtenir un fichier exporté cohérent quelle que soit la taille de la fenêtre.
function serializeSvg(svgEl) {
  const rect = svgEl.getBoundingClientRect()
  const clone = svgEl.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', rect.width)
  clone.setAttribute('height', rect.height)
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
