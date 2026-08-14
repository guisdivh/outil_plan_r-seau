<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'
import { pointInSite } from '../utils/siteLayout'

const props = defineProps({
  zone: { type: Object, required: true },
})

const store = usePlanStore()
const isSelected = computed(() => store.selectedIds.includes(props.zone.id))
const isAssignedToSelected = computed(() =>
  store.selectedNodes.some((n) => n.zoneId === props.zone.id),
)
const siteName = computed(() => store.sites.find((s) => s.id === props.zone.siteId)?.name ?? null)

const PALETTE = ['#38bdf8', '#a78bfa', '#4ade80', '#fb923c', '#f472b6', '#94a3b8']

function toSvgPoint(svg, event) {
  const rect = svg.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

let dragOffset = null
function onBodyPointerDown(event) {
  event.stopPropagation()

  if (event.ctrlKey || event.metaKey) {
    store.toggleSelected(props.zone.id)
    return
  }
  if (!store.selectedIds.includes(props.zone.id)) {
    store.select(props.zone.id)
  }

  const svg = event.currentTarget.ownerSVGElement
  const point = toSvgPoint(svg, event)
  dragOffset = { dx: point.x - props.zone.x, dy: point.y - props.zone.y }
  window.addEventListener('pointermove', onBodyPointerMove)
  window.addEventListener('pointerup', onBodyPointerUp)
}
function onBodyPointerMove(event) {
  if (!dragOffset) return
  const svg = document.querySelector('.canvas-board svg')
  const point = toSvgPoint(svg, event)
  store.moveZone(props.zone.id, point.x - dragOffset.dx, point.y - dragOffset.dy)
}
function onBodyPointerUp() {
  dragOffset = null
  window.removeEventListener('pointermove', onBodyPointerMove)
  window.removeEventListener('pointerup', onBodyPointerUp)

  // Lâchée dans un site : s'y rattache ; lâchée en dehors : s'en détache.
  const centerX = props.zone.x + props.zone.width / 2
  const centerY = props.zone.y + props.zone.height / 2
  const site = store.sites.find((s) => pointInSite(s, centerX, centerY))
  if (site) {
    store.assignZoneToSite(props.zone.id, site.id)
  } else if (props.zone.siteId) {
    store.removeZoneFromSite(props.zone.id)
  }
}

let resizeStart = null
function onResizePointerDown(event) {
  event.stopPropagation()
  store.select(props.zone.id)
  const svg = event.currentTarget.ownerSVGElement
  const point = toSvgPoint(svg, event)
  resizeStart = { startX: point.x, startY: point.y, width: props.zone.width, height: props.zone.height }
  window.addEventListener('pointermove', onResizePointerMove)
  window.addEventListener('pointerup', onResizePointerUp)
}
function onResizePointerMove(event) {
  if (!resizeStart) return
  const svg = document.querySelector('.canvas-board svg')
  const point = toSvgPoint(svg, event)
  store.resizeZone(
    props.zone.id,
    resizeStart.width + (point.x - resizeStart.startX),
    resizeStart.height + (point.y - resizeStart.startY),
  )
}
function onResizePointerUp() {
  resizeStart = null
  window.removeEventListener('pointermove', onResizePointerMove)
  window.removeEventListener('pointerup', onResizePointerUp)
}

function rename() {
  const name = window.prompt('Nom de la zone', props.zone.name)
  if (name) store.renameZone(props.zone.id, name)
}
</script>

<template>
  <g class="zone" :class="{ selected: isSelected }">
    <rect
      v-if="isAssignedToSelected"
      :x="zone.x - 4"
      :y="zone.y - 4"
      :width="zone.width + 8"
      :height="zone.height + 8"
      rx="10"
      class="zone-assigned-highlight"
    />
    <rect
      :x="zone.x"
      :y="zone.y"
      :width="zone.width"
      :height="zone.height"
      rx="8"
      :fill="zone.color"
      fill-opacity="0.15"
      :stroke="zone.color"
      :stroke-width="isSelected ? 3 : 2"
      @pointerdown="onBodyPointerDown"
      @dblclick="rename"
    />
    <text :x="zone.x + 10" :y="zone.y + 18" class="zone-label" :fill="zone.color" @dblclick="rename">
      {{ zone.name }}
    </text>
    <text v-if="isSelected" :x="zone.x + 10" :y="zone.y + 32" class="zone-site-label">
      {{ siteName ? `site : ${siteName}` : 'aucun site' }}
    </text>

    <g v-if="isSelected" class="zone-palette">
      <circle
        v-for="(color, i) in PALETTE"
        :key="color"
        :cx="zone.x + 10 + i * 16"
        :cy="zone.y + zone.height - 12"
        r="6"
        :fill="color"
        stroke="var(--color-surface)"
        stroke-width="1"
        @pointerdown.stop="store.setZoneColor(zone.id, color)"
      />
    </g>

    <rect
      v-if="isSelected"
      :x="zone.x + zone.width - 10"
      :y="zone.y + zone.height - 10"
      width="10"
      height="10"
      class="resize-handle"
      @pointerdown="onResizePointerDown"
    />
  </g>
</template>

<style scoped>
.zone-label {
  font-size: 12px;
  font-weight: 600;
  user-select: none;
}
.zone-site-label {
  font-size: 10px;
  font-style: italic;
  fill: var(--color-site-border);
  user-select: none;
}
.zone-assigned-highlight {
  fill: none;
  stroke: var(--color-success);
  stroke-width: 3;
  stroke-dasharray: 6 3;
  pointer-events: none;
}
.resize-handle {
  fill: var(--color-text);
  cursor: nwse-resize;
}
.zone-palette circle {
  cursor: pointer;
}
</style>
