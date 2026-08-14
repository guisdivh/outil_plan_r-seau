<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'
import { NODE_SIZE, equipmentByType } from '../constants/equipmentTypes'
import IconRouter from './icons/IconRouter.vue'
import IconSwitch from './icons/IconSwitch.vue'
import IconFirewall from './icons/IconFirewall.vue'
import IconAccessPoint from './icons/IconAccessPoint.vue'
import IconServer from './icons/IconServer.vue'
import IconWorkstation from './icons/IconWorkstation.vue'
import IconIot from './icons/IconIot.vue'

const ICONS = {
  IconRouter,
  IconSwitch,
  IconFirewall,
  IconAccessPoint,
  IconServer,
  IconWorkstation,
  IconIot,
}

const props = defineProps({
  node: { type: Object, required: true },
})

const store = usePlanStore()

const iconComponent = computed(() => {
  const def = equipmentByType(props.node.type)
  return def ? ICONS[def.icon] : null
})

const isSelected = computed(() => store.selectedId === props.node.id)
const isLinkSource = computed(() => store.linkingFromId === props.node.id)

let dragOffset = null

function onPointerDown(event) {
  event.stopPropagation()
  store.select(props.node.id)

  // Alt/clic droit démarre ou termine un câble plutôt qu'un déplacement.
  if (event.altKey || event.button === 2) {
    if (store.linkingFromId) {
      store.finishLinking(props.node.id)
    } else {
      store.startLinking(props.node.id)
    }
    return
  }

  const svg = event.currentTarget.ownerSVGElement
  const point = toSvgPoint(svg, event)
  dragOffset = { dx: point.x - props.node.x, dy: point.y - props.node.y }

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event) {
  if (!dragOffset) return
  const svg = document.querySelector('.canvas-board svg')
  const point = toSvgPoint(svg, event)
  store.moveNode(props.node.id, point.x - dragOffset.dx, point.y - dragOffset.dy)
}

function onPointerUp() {
  dragOffset = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function toSvgPoint(svg, event) {
  const rect = svg.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}
</script>

<template>
  <g
    class="network-node"
    :class="{ selected: isSelected, linking: isLinkSource }"
    :transform="`translate(${node.x - 28}, ${node.y - 28})`"
    @pointerdown="onPointerDown"
    @contextmenu.prevent
  >
    <rect
      v-if="isSelected || isLinkSource"
      :width="NODE_SIZE"
      :height="NODE_SIZE"
      rx="8"
      class="node-highlight"
    />
    <component :is="iconComponent" v-if="iconComponent" />
    <rect v-else width="56" height="56" rx="8" fill="#9ca3af" />
    <text :x="NODE_SIZE / 2" y="68" text-anchor="middle" class="node-label">{{ node.label }}</text>
  </g>
</template>

<style scoped>
.network-node {
  cursor: grab;
}
.node-highlight {
  fill: none;
  stroke: #2563eb;
  stroke-width: 2;
  stroke-dasharray: 4 2;
}
.linking .node-highlight {
  stroke: #f59e0b;
}
.node-label {
  font-size: 11px;
  fill: #374151;
  user-select: none;
}
</style>
