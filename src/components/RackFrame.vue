<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'
import { RACK_WIDTH, RACK_UNIT_HEIGHT, RACK_HEADER_HEIGHT, rackHeight, rackUnitLabel } from '../utils/rackLayout'

const props = defineProps({
  rack: { type: Object, required: true },
})

const store = usePlanStore()
const isSelected = computed(() => store.selectedIds.includes(props.rack.id))
const height = computed(() => rackHeight(props.rack))
const unitRows = computed(() => Array.from({ length: props.rack.units }, (_, i) => i + 1))

function toSvgPoint(svg, event) {
  const rect = svg.getBoundingClientRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top }
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
    <text :x="rack.x + RACK_WIDTH - 8" :y="rack.y + 18" text-anchor="end" class="rack-units" @dblclick.stop="editUnits">
      {{ rack.units }} U
    </text>

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
  </g>
</template>

<style scoped>
.rack-body {
  fill: #f3f4f6;
  stroke: #6b7280;
  stroke-width: 2;
}
.selected .rack-body {
  stroke: #2563eb;
}
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
.rack-unit-line {
  stroke: #d1d5db;
  stroke-width: 1;
}
.rack-unit-label {
  font-size: 9px;
  fill: #9ca3af;
  user-select: none;
}
</style>
