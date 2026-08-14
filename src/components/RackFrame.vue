<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'
import {
  RACK_WIDTH,
  RACK_UNIT_HEIGHT,
  RACK_HEADER_HEIGHT,
  rackDisplayHeight,
  rackUnitLabel,
} from '../utils/rackLayout'
import { pointInSite } from '../utils/siteLayout'
import { screenToCanvas } from '../utils/viewport'

const props = defineProps({
  rack: { type: Object, required: true },
})

const store = usePlanStore()
const isSelected = computed(() => store.selectedIds.includes(props.rack.id))
const height = computed(() => rackDisplayHeight(props.rack))
const unitRows = computed(() => Array.from({ length: props.rack.units }, (_, i) => i + 1))
const siteName = computed(() => store.sites.find((s) => s.id === props.rack.siteId)?.name ?? null)
const memberCount = computed(() => store.nodes.filter((n) => n.rackId === props.rack.id).length)

function toSvgPoint(svg, event) {
  return screenToCanvas(event.clientX, event.clientY, svg, { x: store.viewPanX, y: store.viewPanY }, store.viewZoom)
}

let dragOffset = null
function onFramePointerDown(event) {
  event.stopPropagation()

  if (event.ctrlKey || event.metaKey) {
    store.toggleSelected(props.rack.id)
    return
  }
  if (!store.selectedIds.includes(props.rack.id)) {
    store.select(props.rack.id)
  }

  const svg = event.currentTarget.ownerSVGElement
  const point = toSvgPoint(svg, event)
  dragOffset = { dx: point.x - props.rack.x, dy: point.y - props.rack.y }
  window.addEventListener('pointermove', onFramePointerMove)
  window.addEventListener('pointerup', onFramePointerUp)
}
function onFramePointerMove(event) {
  if (!dragOffset) return
  const svg = document.querySelector('.canvas-board svg')
  const point = toSvgPoint(svg, event)
  store.moveRack(props.rack.id, point.x - dragOffset.dx, point.y - dragOffset.dy)
}
function onFramePointerUp() {
  dragOffset = null
  window.removeEventListener('pointermove', onFramePointerMove)
  window.removeEventListener('pointerup', onFramePointerUp)

  // Lâchée dans un site : s'y rattache ; lâchée en dehors : s'en détache.
  const centerX = props.rack.x + RACK_WIDTH / 2
  const centerY = props.rack.y + height.value / 2
  const site = store.sites.find((s) => pointInSite(s, centerX, centerY))
  if (site) {
    store.assignRackToSite(props.rack.id, site.id)
  } else if (props.rack.siteId) {
    store.removeRackFromSite(props.rack.id)
  }
}

function rename() {
  const name = window.prompt('Nom de la baie', props.rack.name)
  if (name) store.renameRack(props.rack.id, name)
}

function editUnits() {
  const input = window.prompt("Nombre d'U de la baie", String(props.rack.units))
  if (!input) return
  const units = Number(input)
  if (!Number.isFinite(units) || units < 1) return
  const ok = store.resizeRackUnits(props.rack.id, units)
  if (!ok) {
    window.alert("Impossible : des équipements occupent des U au-delà de cette taille.")
  }
}
</script>

<template>
  <g class="rack" :class="{ selected: isSelected }">
    <rect
      :x="rack.x"
      :y="rack.y"
      :width="RACK_WIDTH"
      :height="height"
      rx="4"
      class="rack-body"
      @pointerdown="onFramePointerDown"
    />

    <rect :x="rack.x" :y="rack.y" :width="RACK_WIDTH" :height="RACK_HEADER_HEIGHT" rx="4" class="rack-header" @pointerdown="onFramePointerDown" @dblclick="rename" />
    <text :x="rack.x + 8" :y="rack.y + 18" class="rack-title" @dblclick="rename">{{ rack.name }}</text>
    <text
      :x="rack.x + RACK_WIDTH - 34"
      :y="rack.y + 18"
      text-anchor="end"
      class="rack-toggle"
      @pointerdown.stop="store.toggleRackCollapsed(rack.id)"
    >
      {{ rack.collapsed ? '▸' : '▾' }}
      <title>{{ rack.collapsed ? 'Étendre la baie' : 'Replier la baie' }}</title>
    </text>
    <text :x="rack.x + RACK_WIDTH - 8" :y="rack.y + 18" text-anchor="end" class="rack-units" @dblclick.stop="editUnits">
      {{ rack.units }} U
    </text>

    <template v-if="!rack.collapsed">
      <g v-for="u in unitRows" :key="u">
        <line
          :x1="rack.x"
          :x2="rack.x + RACK_WIDTH"
          :y1="rack.y + RACK_HEADER_HEIGHT + (u - 1) * RACK_UNIT_HEIGHT"
          :y2="rack.y + RACK_HEADER_HEIGHT + (u - 1) * RACK_UNIT_HEIGHT"
          class="rack-unit-line"
        />
        <text
          :x="rack.x + RACK_WIDTH + 4"
          :y="rack.y + RACK_HEADER_HEIGHT + (u - 1) * RACK_UNIT_HEIGHT + RACK_UNIT_HEIGHT / 2 + 3"
          class="rack-unit-label"
        >
          {{ rackUnitLabel(rack, u) }}
        </text>
      </g>
    </template>
    <text v-else :x="rack.x + RACK_WIDTH / 2" :y="rack.y + RACK_HEADER_HEIGHT + 14" text-anchor="middle" class="rack-summary">
      {{ memberCount }} équipement{{ memberCount > 1 ? 's' : '' }}
    </text>

    <text v-if="isSelected" :x="rack.x" :y="rack.y + height + 14" class="rack-site-label">
      {{ siteName ? `site : ${siteName}` : 'aucun site' }}
    </text>
  </g>
</template>

<style scoped>
.rack-body {
  fill: var(--color-surface-2);
  stroke: var(--color-border-strong);
  stroke-width: 2;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1));
}
.selected .rack-body {
  stroke: var(--color-accent);
}
/* Bandeau volontairement sombre quel que soit le thème : évoque la façade
   d'une vraie baie 19", une identité "matériel" plutôt qu'un élément de thème. */
.rack-header {
  fill: #4b5563;
  cursor: grab;
}
.rack-title {
  font-size: 12px;
  font-weight: 600;
  fill: #fff;
  user-select: none;
}
.rack-units {
  font-size: 10px;
  fill: #e5e7eb;
  cursor: pointer;
  user-select: none;
}
.rack-toggle {
  font-size: 11px;
  fill: #e5e7eb;
  cursor: pointer;
  user-select: none;
}
.rack-summary {
  font-size: 11px;
  font-style: italic;
  fill: var(--color-text-muted);
  user-select: none;
}
.rack-unit-line {
  stroke: var(--color-border);
  stroke-width: 1;
}
.rack-unit-label {
  font-size: 9px;
  fill: var(--color-text-muted);
  user-select: none;
}
.rack-site-label {
  font-size: 10px;
  font-style: italic;
  fill: var(--color-site-border);
  user-select: none;
}
</style>
