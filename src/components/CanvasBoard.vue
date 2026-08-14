<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { usePlanStore } from '../stores/plan'
import NetworkNode from './NetworkNode.vue'
import NetworkLink from './NetworkLink.vue'
import ZoneRect from './ZoneRect.vue'
import RackFrame from './RackFrame.vue'
import { rackBounds } from '../utils/rackLayout'

const store = usePlanStore()
const cursor = ref({ x: 0, y: 0 })
const marquee = ref(null)

const linkSourceNode = computed(() => store.nodes.find((n) => n.id === store.linkingFromId) ?? null)

let marqueeStart = null
let didDrag = false
const DRAG_THRESHOLD = 4

function onSvgPointerDown(event) {
  if (store.linkingFromId) {
    // Clic dans le vide pendant un câble en cours de tracé : annule (le mode reste actif).
    store.cancelLinking()
    return
  }
  if (store.linkMode) return // mode relier en attente du premier nœud : rien à faire sur fond vide

  const rect = event.currentTarget.getBoundingClientRect()
  marqueeStart = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  didDrag = false
  window.addEventListener('pointermove', onMarqueeMove)
  window.addEventListener('pointerup', onMarqueeUp)
}

function onMarqueeMove(event) {
  if (!marqueeStart) return
  const svg = document.querySelector('.canvas-board svg')
  const rect = svg.getBoundingClientRect()
  const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
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

    store.selectIds([...nodeIds, ...zoneIds, ...rackIds], { additive: event.ctrlKey || event.metaKey })
  } else {
    store.clearSelection()
  }

  marquee.value = null
  marqueeStart = null
  didDrag = false
}

function onPointerMove(event) {
  if (!store.linkingFromId) return
  const rect = event.currentTarget.getBoundingClientRect()
  cursor.value = { x: event.clientX - rect.left, y: event.clientY - rect.top }
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
    } else if (store.linkMode) {
      store.exitLinkMode()
    } else {
      store.clearSelection()
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="canvas-board">
    <svg width="100%" height="100%" @pointerdown="onSvgPointerDown" @pointermove="onPointerMove">
      <rect width="100%" height="100%" fill="#fafafa" />

      <ZoneRect v-for="zone in store.zones" :key="zone.id" :zone="zone" />
      <RackFrame v-for="rack in store.racks" :key="rack.id" :rack="rack" />
      <NetworkLink v-for="link in store.links" :key="link.id" :link="link" />
      <NetworkNode v-for="node in store.nodes" :key="node.id" :node="node" />

      <line
        v-if="linkSourceNode"
        :x1="linkSourceNode.x"
        :y1="linkSourceNode.y"
        :x2="cursor.x"
        :y2="cursor.y"
        class="ghost-link"
      />

      <rect
        v-if="marquee"
        :x="marquee.x"
        :y="marquee.y"
        :width="marquee.width"
        :height="marquee.height"
        class="marquee-rect"
      />
    </svg>
  </div>
</template>

<style scoped>
.canvas-board {
  flex: 1;
  height: 100%;
}
svg {
  display: block;
}
.ghost-link {
  stroke: #f59e0b;
  stroke-width: 2;
  stroke-dasharray: 5 4;
  pointer-events: none;
}
.marquee-rect {
  fill: rgba(37, 99, 235, 0.1);
  stroke: #2563eb;
  stroke-width: 1;
  stroke-dasharray: 4 3;
  pointer-events: none;
}
</style>
