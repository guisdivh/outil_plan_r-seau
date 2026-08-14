<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'

const props = defineProps({
  link: { type: Object, required: true },
})

const store = usePlanStore()

const source = computed(() => store.nodes.find((n) => n.id === props.link.sourceId))
const target = computed(() => store.nodes.find((n) => n.id === props.link.targetId))
const isSelected = computed(() => store.selectedIds.includes(props.link.id))

const vlan = computed(() => store.vlans.find((v) => v.id === props.link.vlanId) ?? null)
const color = computed(() => vlan.value?.color ?? '#64748b')

const vlanSwatches = computed(() => [{ id: null, color: '#94a3b8' }, ...store.vlans.map((v) => ({ id: v.id, color: v.color }))])

// Tracé orthogonal auto (avec écartement des câbles d'un même équipement), ou
// tracé libre à travers les waypoints manuels s'il y en a — voir utils/linkRouting.js.
const points = computed(() => store.linkRoutes.get(props.link.id) ?? [])
const pointsAttr = computed(() => points.value.map((p) => `${p.x},${p.y}`).join(' '))

// Milieu du segment central du tracé : reste lisible même avec des waypoints.
const midPoint = computed(() => {
  const pts = points.value
  if (!pts.length) return { x: 0, y: 0 }
  const i = Math.floor((pts.length - 1) / 2)
  const a = pts[i]
  const b = pts[i + 1] ?? a
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
})

function toSvgPoint(svg, event) {
  const rect = svg.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function onLinePointerDown(event) {
  event.stopPropagation()
  if (event.ctrlKey || event.metaKey) {
    store.toggleSelected(props.link.id)
  } else {
    store.select(props.link.id)
  }
}

function onLineDoubleClick(event) {
  event.stopPropagation()
  const svg = event.currentTarget.ownerSVGElement
  const point = toSvgPoint(svg, event)
  store.addLinkWaypoint(props.link.id, point.x, point.y)
}

let dragIndex = null
function onWaypointPointerDown(event, index) {
  event.stopPropagation()
  store.select(props.link.id)
  dragIndex = index
  window.addEventListener('pointermove', onWaypointPointerMove)
  window.addEventListener('pointerup', onWaypointPointerUp)
}
function onWaypointPointerMove(event) {
  if (dragIndex === null) return
  const svg = document.querySelector('.canvas-board svg')
  const point = toSvgPoint(svg, event)
  store.moveLinkWaypoint(props.link.id, dragIndex, point.x, point.y)
}
function onWaypointPointerUp() {
  dragIndex = null
  window.removeEventListener('pointermove', onWaypointPointerMove)
  window.removeEventListener('pointerup', onWaypointPointerUp)
}
function onWaypointDoubleClick(event, index) {
  event.stopPropagation()
  store.removeLinkWaypoint(props.link.id, index)
}

function rename() {
  const name = window.prompt('Nom du câble', props.link.label || '')
  if (name !== null) store.renameLink(props.link.id, name)
}
</script>

<template>
  <g v-if="source && target" class="network-link-group">
    <!-- Zone de clic élargie et invisible : le trait visible reste fin. -->
    <polyline :points="pointsAttr" fill="none" stroke="transparent" stroke-width="14" class="hit-area" @pointerdown="onLinePointerDown" @dblclick="onLineDoubleClick" />
    <polyline
      :points="pointsAttr"
      fill="none"
      :stroke="color"
      :stroke-width="isSelected ? 3 : 2"
      class="network-link"
    />

    <circle
      v-for="(wp, i) in link.waypoints"
      :key="i"
      :cx="wp.x"
      :cy="wp.y"
      r="4"
      class="waypoint"
      @pointerdown="onWaypointPointerDown($event, i)"
      @dblclick="onWaypointDoubleClick($event, i)"
    />

    <text
      v-if="link.label || isSelected"
      :x="midPoint.x"
      :y="midPoint.y - 8"
      text-anchor="middle"
      class="link-label"
      @pointerdown.stop
      @dblclick.stop="rename"
    >
      {{ link.label || 'nommer le câble' }}
    </text>

    <g v-if="isSelected" class="link-vlan-palette">
      <circle
        v-for="(sw, i) in vlanSwatches"
        :key="sw.id ?? 'none'"
        :cx="midPoint.x - (vlanSwatches.length * 16) / 2 + i * 16 + 8"
        :cy="midPoint.y + 10"
        r="6"
        :fill="sw.color"
        :stroke="link.vlanId === sw.id ? '#1f2937' : '#fff'"
        stroke-width="1.5"
        @pointerdown.stop="store.setLinkVlan(link.id, sw.id)"
      />
    </g>
  </g>
</template>

<style scoped>
.network-link {
  pointer-events: none;
}
.hit-area {
  cursor: pointer;
}
.waypoint {
  fill: #fff;
  stroke: #1f2937;
  stroke-width: 1.5;
  cursor: grab;
}
.link-label {
  font-size: 10px;
  fill: #374151;
  cursor: pointer;
  user-select: none;
}
.link-vlan-palette circle {
  cursor: pointer;
}
</style>
