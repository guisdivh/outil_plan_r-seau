<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'
import { NODE_SIZE, equipmentByType } from '../constants/equipmentTypes'
import { RACK_WIDTH, RACK_UNIT_HEIGHT, pointInRack } from '../utils/rackLayout'
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

const isSelected = computed(() => store.selectedIds.includes(props.node.id))
const isLinkSource = computed(() => store.linkingFromId === props.node.id)
const zoneName = computed(() => store.zones.find((z) => z.id === props.node.zoneId)?.name ?? null)
const isRacked = computed(() => !!props.node.rackId)
const rackNodeHeight = computed(() => props.node.rackSpan * RACK_UNIT_HEIGHT - 2)

let dragAnchor = null
let dragIds = []

function onPointerDown(event) {
  event.stopPropagation()

  // Ctrl/Cmd+clic bascule l'appartenance à la sélection en priorité absolue,
  // même si le mode relier est actif (sinon il devient impossible à utiliser).
  if (event.ctrlKey || event.metaKey) {
    store.toggleSelected(props.node.id)
    return
  }

  // Mode « relier » actif, ou Alt/clic droit en raccourci : tire un câble plutôt qu'un déplacement.
  if (store.linkMode || event.altKey || event.button === 2) {
    store.select(props.node.id)
    if (store.linkingFromId) {
      store.finishLinking(props.node.id)
    } else {
      store.startLinking(props.node.id)
    }
    return
  }

  // Cliquer un nœud déjà dans une sélection multiple déplace tout le groupe ;
  // sinon un clic simple remplace la sélection par ce seul nœud.
  if (!store.selectedIds.includes(props.node.id)) {
    store.select(props.node.id)
  }

  dragIds = store.selectedIds.includes(props.node.id) ? store.selectedNodeIds : [props.node.id]

  // Un déplacement groupé détache immédiatement les équipements en baie qu'il
  // contient : le placement en baie n'a de sens que pour un nœud à la fois.
  if (dragIds.length > 1) {
    for (const id of dragIds) {
      const n = store.nodes.find((x) => x.id === id)
      if (n?.rackId) store.removeNodeFromRack(id, n.x, n.y)
    }
  }

  const svg = event.currentTarget.ownerSVGElement
  dragAnchor = toSvgPoint(svg, event)

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event) {
  if (!dragAnchor) return
  const svg = document.querySelector('.canvas-board svg')
  const point = toSvgPoint(svg, event)
  const dx = point.x - dragAnchor.x
  const dy = point.y - dragAnchor.y
  dragAnchor = point

  store.moveNodesBy(dragIds, dx, dy)
}

function onPointerUp() {
  // Un nœud seul déposé sur une baie s'y aligne ; déposé hors baie, il s'en détache.
  if (dragIds.length === 1) {
    const node = store.nodes.find((n) => n.id === dragIds[0])
    if (node) {
      const rack = store.racks.find((r) => pointInRack(r, node.x, node.y))
      if (rack) {
        store.assignNodeToRack(node.id, rack.id)
      } else if (node.rackId) {
        store.removeNodeFromRack(node.id, node.x, node.y)
      }
    }
  }

  dragAnchor = null
  dragIds = []
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
    v-if="!isRacked"
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
    <text v-if="isSelected" :x="NODE_SIZE / 2" y="80" text-anchor="middle" class="node-zone-label">
      {{ zoneName ? `zone : ${zoneName}` : 'aucune zone' }}
    </text>
  </g>

  <!-- Monté en baie : bande compacte pleine largeur, plutôt que l'icône libre. -->
  <g
    v-else
    class="network-node racked"
    :class="{ selected: isSelected }"
    :transform="`translate(${node.x - RACK_WIDTH / 2 + 4}, ${node.y - rackNodeHeight / 2})`"
    @pointerdown="onPointerDown"
    @contextmenu.prevent
  >
    <rect :width="RACK_WIDTH - 8" :height="rackNodeHeight" rx="3" class="rack-node-bg" />
    <g transform="translate(2,2) scale(0.286)">
      <component :is="iconComponent" v-if="iconComponent" />
      <rect v-else width="56" height="56" rx="8" fill="#9ca3af" />
    </g>
    <text :x="24" :y="rackNodeHeight / 2 + 4" class="rack-node-label">{{ node.label }}</text>
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
.node-zone-label {
  font-size: 10px;
  font-style: italic;
  fill: #2563eb;
  user-select: none;
}
.rack-node-bg {
  fill: #f9fafb;
  stroke: #9ca3af;
  stroke-width: 1;
}
.racked.selected .rack-node-bg {
  stroke: #2563eb;
  stroke-width: 2;
}
.rack-node-label {
  font-size: 10px;
  fill: #374151;
  user-select: none;
}
</style>
