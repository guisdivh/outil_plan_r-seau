<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'
import { NODE_SIZE, equipmentByType } from '../constants/equipmentTypes'
import { RACK_WIDTH, RACK_UNIT_HEIGHT, pointInRack } from '../utils/rackLayout'
import { formatInterface } from '../utils/interfaces'
import { pointInSite } from '../utils/siteLayout'
import { canExposePorts, summarizeRule } from '../utils/exposedPorts'
import { screenToCanvas } from '../utils/viewport'
import { canBeTunnelEndpoint } from '../constants/equipmentTypes'
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
// En mode tunnel, seuls routeurs/firewalls peuvent servir d'extrémité :
// les autres nœuds sont visuellement désactivés pour éviter un clic sans effet.
const isTunnelIneligible = computed(
  () => store.tunnelMode && !canBeTunnelEndpoint(props.node.type),
)
const zoneName = computed(() => store.zones.find((z) => z.id === props.node.zoneId)?.name ?? null)
const isRacked = computed(() => !!props.node.rackId)
const rackNodeHeight = computed(() => props.node.rackSpan * RACK_UNIT_HEIGHT - 2)

// Étiquettes IP sur le canvas : activables globalement, masquées en baie (pas la place).
const ipLabels = computed(() =>
  store.showIpLabels || store.exportMode ? props.node.interfaces.map(formatInterface).filter(Boolean) : [],
)
const ipLabelStartY = computed(() => (isSelected.value ? 92 : 80))

// Badge discret (ports exposés) : uniquement firewall/routeur, masqué à l'export
// (remplacé par l'encart détaillé — voir FirewallRulesExport.vue).
const exposedRules = computed(() => (canExposePorts(props.node) ? props.node.exposedPorts : []))
const rulesTooltip = computed(() => exposedRules.value.map(summarizeRule).join('\n'))

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

  // Mode « relier » ou « tunnel IPsec » actif, ou Alt/clic droit en raccourci
  // (toujours un câble) : tire un lien plutôt qu'un déplacement.
  if (store.linkMode || store.tunnelMode || event.altKey || event.button === 2) {
    store.select(props.node.id)
    if (store.linkingFromId) {
      store.finishLinking(props.node.id)
    } else {
      const kind = event.altKey || event.button === 2 ? 'cable' : store.tunnelMode ? 'tunnel' : 'cable'
      store.startLinking(props.node.id, kind)
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
      // Une baie repliée n'affiche plus ses U : pas de dépôt possible dedans.
      const rack = store.racks.find((r) => !r.collapsed && pointInRack(r, node.x, node.y))
      if (rack) {
        store.assignNodeToRack(node.id, rack.id)
      } else if (node.rackId) {
        store.removeNodeFromRack(node.id, node.x, node.y)
      }

      const site = store.sites.find((s) => pointInSite(s, node.x, node.y))
      if (site) {
        store.assignNodeToSite(node.id, site.id)
      } else if (node.siteId) {
        store.removeNodeFromSite(node.id)
      }
    }
  }

  dragAnchor = null
  dragIds = []
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function toSvgPoint(svg, event) {
  return screenToCanvas(event.clientX, event.clientY, svg, { x: store.viewPanX, y: store.viewPanY }, store.viewZoom)
}
</script>

<template>
  <g
    v-if="!isRacked"
    class="network-node"
    :class="{ selected: isSelected, linking: isLinkSource, 'tunnel-ineligible': isTunnelIneligible }"
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
    <rect width="56" height="56" rx="10" class="node-card" />
    <component :is="iconComponent" v-if="iconComponent" />
    <rect v-else width="56" height="56" rx="8" fill="var(--color-text-muted)" />
    <text :x="NODE_SIZE / 2" y="68" text-anchor="middle" class="node-label">{{ node.label }}</text>
    <text v-if="isSelected" :x="NODE_SIZE / 2" y="80" text-anchor="middle" class="node-zone-label">
      {{ zoneName ? `zone : ${zoneName}` : 'aucune zone' }}
    </text>
    <text
      v-for="(line, i) in ipLabels"
      :key="i"
      :x="NODE_SIZE / 2"
      :y="ipLabelStartY + i * 11"
      text-anchor="middle"
      class="node-ip-label"
    >
      {{ line }}
    </text>
    <g v-if="exposedRules.length && !store.exportMode" transform="translate(40,-6)" class="port-badge">
      <rect width="20" height="14" rx="7" class="port-badge-bg" />
      <text x="10" y="10" text-anchor="middle" class="port-badge-text">{{ exposedRules.length }}</text>
      <title>{{ rulesTooltip }}</title>
    </g>
  </g>

  <!-- Monté en baie : bande compacte pleine largeur, plutôt que l'icône libre. -->
  <g
    v-else
    class="network-node racked"
    :class="{ selected: isSelected, 'tunnel-ineligible': isTunnelIneligible }"
    :transform="`translate(${node.x - RACK_WIDTH / 2 + 4}, ${node.y - rackNodeHeight / 2})`"
    @pointerdown="onPointerDown"
    @contextmenu.prevent
  >
    <rect :width="RACK_WIDTH - 8" :height="rackNodeHeight" rx="3" class="rack-node-bg" />
    <g transform="translate(2,2) scale(0.286)">
      <component :is="iconComponent" v-if="iconComponent" />
      <rect v-else width="56" height="56" rx="8" fill="var(--color-text-muted)" />
    </g>
    <text :x="24" :y="rackNodeHeight / 2 + 4" class="rack-node-label">{{ node.label }}</text>
  </g>
</template>

<style scoped>
.network-node {
  cursor: grab;
}
.network-node.tunnel-ineligible {
  cursor: not-allowed;
  opacity: 0.55;
}
.node-card {
  fill: var(--color-surface);
  stroke: var(--color-border);
  stroke-width: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.12));
}
.node-highlight {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 2;
  stroke-dasharray: 4 2;
}
.linking .node-highlight {
  stroke: var(--color-warning);
}
.node-label {
  font-size: 11px;
  fill: var(--color-text);
  user-select: none;
}
.node-zone-label {
  font-size: 10px;
  font-style: italic;
  fill: var(--color-accent);
  user-select: none;
}
.node-ip-label {
  font-size: 9px;
  fill: var(--color-success);
  font-family: var(--font-mono);
  user-select: none;
}
.port-badge-bg {
  fill: var(--color-warning);
  stroke: var(--color-surface);
  stroke-width: 1.5;
}
.port-badge-text {
  font-size: 9px;
  font-weight: 700;
  fill: #fff;
  user-select: none;
}
.rack-node-bg {
  fill: var(--color-surface);
  stroke: var(--color-border-strong);
  stroke-width: 1;
}
.racked.selected .rack-node-bg {
  stroke: var(--color-accent);
  stroke-width: 2;
}
.rack-node-label {
  font-size: 10px;
  fill: var(--color-text);
  user-select: none;
}
</style>
