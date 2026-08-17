<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { usePlanStore } from '../stores/plan'
import NetworkNode from './NetworkNode.vue'
import NetworkLink from './NetworkLink.vue'
import ZoneRect from './ZoneRect.vue'
import RackFrame from './RackFrame.vue'
import SiteFrame from './SiteFrame.vue'
import TunnelLink from './TunnelLink.vue'
import BusGroup from './BusGroup.vue'
import ExportSidePanel from './ExportSidePanel.vue'
import FirewallRulesExport from './FirewallRulesExport.vue'
import ZoomControls from './ZoomControls.vue'
import { rackBounds } from '../utils/rackLayout'
import { siteDisplaySize } from '../utils/siteLayout'
import { screenToCanvas } from '../utils/viewport'

const store = usePlanStore()
const cursor = ref({ x: 0, y: 0 })
const marquee = ref(null)
const spacePressed = ref(false)
const isPanning = ref(false)

const linkSourceNode = computed(() => store.nodes.find((n) => n.id === store.linkingFromId) ?? null)
const exportRuleNodes = computed(() =>
  store.exportMode ? store.visibleNodes.filter((n) => n.exposedPorts.length) : [],
)

function isTypingTarget(target) {
  return ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
}

function toCanvasPoint(svg, event) {
  return screenToCanvas(event.clientX, event.clientY, svg, { x: store.viewPanX, y: store.viewPanY }, store.viewZoom)
}

let panStart = null
let marqueeStart = null
let didDrag = false
const DRAG_THRESHOLD = 4

function onSvgPointerDown(event) {
  // Pan : clic molette, clic droit, ou barre espace maintenue + clic gauche
  // (convention Figma/draw.io). Prioritaire sur tout le reste (ne doit jamais
  // démarrer un tracé de câble ni une sélection).
  if (event.button === 1 || event.button === 2 || (event.button === 0 && spacePressed.value)) {
    event.preventDefault()
    isPanning.value = true
    panStart = { x: event.clientX, y: event.clientY, panX: store.viewPanX, panY: store.viewPanY }
    window.addEventListener('pointermove', onPanMove)
    window.addEventListener('pointerup', onPanUp)
    return
  }
  // Seul le clic gauche démarre une sélection par rectangle (pas de bouton
  // « précédent »/« suivant » de souris égaré sur le fond vide).
  if (event.button !== 0) return

  if (store.linkingFromId) {
    // Clic dans le vide pendant un câble en cours de tracé : annule (le mode reste actif).
    store.cancelLinking()
    return
  }
  // Mode relier/tunnel en attente du premier nœud : rien à faire sur fond vide.
  if (store.linkMode || store.tunnelMode) return

  const point = toCanvasPoint(event.currentTarget, event)
  marqueeStart = point
  didDrag = false
  window.addEventListener('pointermove', onMarqueeMove)
  window.addEventListener('pointerup', onMarqueeUp)
}

function onPanMove(event) {
  if (!panStart) return
  store.setPan(panStart.panX + (event.clientX - panStart.x), panStart.panY + (event.clientY - panStart.y))
}
function onPanUp() {
  panStart = null
  isPanning.value = false
  window.removeEventListener('pointermove', onPanMove)
  window.removeEventListener('pointerup', onPanUp)
}

function onMarqueeMove(event) {
  if (!marqueeStart) return
  const svg = document.querySelector('.canvas-board svg')
  const point = toCanvasPoint(svg, event)
  const dx = point.x - marqueeStart.x
  const dy = point.y - marqueeStart.y

  if (!didDrag && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
    didDrag = true
  }
  if (!didDrag) return

  marquee.value = {
    x: Math.min(marqueeStart.x, point.x),
    y: Math.min(marqueeStart.y, point.y),
    width: Math.abs(dx),
    height: Math.abs(dy),
  }
}

function onMarqueeUp(event) {
  window.removeEventListener('pointermove', onMarqueeMove)
  window.removeEventListener('pointerup', onMarqueeUp)

  if (didDrag && marquee.value) {
    const box = marquee.value
    const x2 = box.x + box.width
    const y2 = box.y + box.height

    const nodeIds = store.nodes
      .filter((n) => n.x >= box.x && n.x <= x2 && n.y >= box.y && n.y <= y2)
      .map((n) => n.id)
    // Une zone n'est retenue que si elle est entièrement dans le rectangle,
    // pour ne pas la sélectionner accidentellement en englobant son contenu.
    const zoneIds = store.zones
      .filter((z) => z.x >= box.x && z.x + z.width <= x2 && z.y >= box.y && z.y + z.height <= y2)
      .map((z) => z.id)
    const rackIds = store.racks
      .filter((r) => {
        const b = rackBounds(r)
        return b.x1 >= box.x && b.x2 <= x2 && b.y1 >= box.y && b.y2 <= y2
      })
      .map((r) => r.id)
    const siteIds = store.sites
      .filter((s) => {
        const { width, height } = siteDisplaySize(s)
        return s.x >= box.x && s.x + width <= x2 && s.y >= box.y && s.y + height <= y2
      })
      .map((s) => s.id)

    store.selectIds([...nodeIds, ...zoneIds, ...rackIds, ...siteIds], {
      additive: event.ctrlKey || event.metaKey,
    })
  } else {
    store.clearSelection()
  }

  marquee.value = null
  marqueeStart = null
  didDrag = false
}

function onPointerMove(event) {
  if (!store.linkingFromId) return
  cursor.value = toCanvasPoint(event.currentTarget, event)
}

function onWheel(event) {
  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()
  const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1
  store.zoomAtScreenPoint(event.clientX - rect.left, event.clientY - rect.top, factor)
}

function fitToContent() {
  const el = document.querySelector('.canvas-board')
  if (el) store.fitToContent(el.clientWidth, el.clientHeight)
}

function onKeydown(event) {
  if (event.key === 'Delete' || event.key === 'Backspace') {
    // Backspace ne doit pas déclencher la navigation retour du navigateur.
    if (event.key === 'Backspace' && event.target !== document.body) return
    store.deleteSelection()
  }
  if (event.key === 'Escape') {
    if (store.linkingFromId) {
      // Annule seulement le câble en cours ; le mode relier reste actif.
      store.cancelLinking()
    } else if (store.linkMode || store.tunnelMode) {
      store.exitLinkingModes()
    } else {
      store.clearSelection()
    }
  }
  if (event.code === 'Space' && !isTypingTarget(event.target)) {
    // Évite que la page défile pendant qu'on maintient espace pour naviguer.
    event.preventDefault()
    spacePressed.value = true
  }
  if (event.key === '0' && !isTypingTarget(event.target)) {
    fitToContent()
  }
}

function onKeyup(event) {
  if (event.code === 'Space') spacePressed.value = false
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('keyup', onKeyup)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('keyup', onKeyup)
})
</script>

<template>
  <div class="canvas-board" :class="{ panning: isPanning, 'space-pan': spacePressed }">
    <svg
      width="100%"
      height="100%"
      @pointerdown="onSvgPointerDown"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
      @contextmenu.prevent
    >
      <defs>
        <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" class="grid-dot" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" class="canvas-bg" />

      <g :transform="store.viewTransform">
        <!-- Grille surdimensionnée pour couvrir tout panoramique raisonnable. -->
        <rect x="-20000" y="-20000" width="40000" height="40000" fill="url(#canvas-grid)" />

        <SiteFrame v-for="site in store.sites" :key="site.id" :site="site" />
        <ZoneRect v-for="zone in store.zones" :key="zone.id" :zone="zone" />
        <RackFrame v-for="rack in store.racks" :key="rack.id" :rack="rack" />
        <NetworkLink v-for="link in store.ungroupedLinks" :key="link.id" :link="link" />
        <BusGroup v-for="bus in store.visibleBuses" :key="bus.id" :bus="bus" />
        <TunnelLink v-for="tunnel in store.tunnels" :key="tunnel.id" :tunnel="tunnel" />
        <NetworkNode v-for="node in store.visibleNodes" :key="node.id" :node="node" />
        <FirewallRulesExport v-for="node in exportRuleNodes" :key="node.id" :node="node" />
        <ExportSidePanel v-if="store.exportMode" />

        <line
          v-if="linkSourceNode"
          :x1="linkSourceNode.x"
          :y1="linkSourceNode.y"
          :x2="cursor.x"
          :y2="cursor.y"
          class="ghost-link"
          :class="{ tunnel: store.tunnelMode }"
        />

        <rect
          v-if="marquee"
          :x="marquee.x"
          :y="marquee.y"
          :width="marquee.width"
          :height="marquee.height"
          class="marquee-rect"
        />
      </g>
    </svg>

    <ZoomControls />
  </div>
</template>

<style scoped>
.canvas-board {
  position: relative;
  flex: 1;
  height: 100%;
}
.canvas-board.space-pan svg {
  cursor: grab;
}
.canvas-board.panning svg {
  cursor: grabbing;
}
svg {
  display: block;
  /* Le SVG exporté est un document autonome, sans <body> pour lui transmettre
     la police via main.css : sans ceci, tout texte retombe sur le serif par
     défaut du navigateur (notes de ports, libellés...) une fois hors de la page. */
  font-family: var(--font-sans);
}
.canvas-bg {
  fill: var(--color-bg);
}
.grid-dot {
  fill: var(--color-border-strong);
  opacity: 0.5;
}
.ghost-link {
  stroke: var(--color-warning);
  stroke-width: 2;
  stroke-dasharray: 5 4;
  pointer-events: none;
}
.ghost-link.tunnel {
  stroke: var(--color-tunnel);
  stroke-dasharray: 6 4;
}
.marquee-rect {
  fill: rgba(59, 130, 246, 0.15);
  stroke: var(--color-accent);
  stroke-width: 1;
  stroke-dasharray: 4 3;
  pointer-events: none;
}
</style>
