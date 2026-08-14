<script setup>
import { computed } from 'vue'
import { usePlanStore } from '../stores/plan'
import { siteDisplaySize } from '../utils/siteLayout'
import { screenToCanvas } from '../utils/viewport'

const props = defineProps({
  site: { type: Object, required: true },
})

const store = usePlanStore()
const isSelected = computed(() => store.selectedIds.includes(props.site.id))
const size = computed(() => siteDisplaySize(props.site))
const memberCount = computed(() => store.nodes.filter((n) => n.siteId === props.site.id).length)

function toSvgPoint(svg, event) {
  return screenToCanvas(event.clientX, event.clientY, svg, { x: store.viewPanX, y: store.viewPanY }, store.viewZoom)
}

let dragOffset = null
function onHeaderPointerDown(event) {
  event.stopPropagation()
  if (event.ctrlKey || event.metaKey) {
    store.toggleSelected(props.site.id)
    return
  }
  if (!store.selectedIds.includes(props.site.id)) {
    store.select(props.site.id)
  }
  const svg = event.currentTarget.ownerSVGElement
  const point = toSvgPoint(svg, event)
  dragOffset = { dx: point.x - props.site.x, dy: point.y - props.site.y }
  window.addEventListener('pointermove', onHeaderPointerMove)
  window.addEventListener('pointerup', onHeaderPointerUp)
}
function onHeaderPointerMove(event) {
  if (!dragOffset) return
  const svg = document.querySelector('.canvas-board svg')
  const point = toSvgPoint(svg, event)
  store.moveSite(props.site.id, point.x - dragOffset.dx, point.y - dragOffset.dy)
}
function onHeaderPointerUp() {
  dragOffset = null
  window.removeEventListener('pointermove', onHeaderPointerMove)
  window.removeEventListener('pointerup', onHeaderPointerUp)
}

let resizeStart = null
function onResizePointerDown(event) {
  event.stopPropagation()
  store.select(props.site.id)
  const svg = event.currentTarget.ownerSVGElement
  const point = toSvgPoint(svg, event)
  resizeStart = { startX: point.x, startY: point.y, width: props.site.width, height: props.site.height }
  window.addEventListener('pointermove', onResizePointerMove)
  window.addEventListener('pointerup', onResizePointerUp)
}
function onResizePointerMove(event) {
  if (!resizeStart) return
  const svg = document.querySelector('.canvas-board svg')
  const point = toSvgPoint(svg, event)
  store.resizeSite(
    props.site.id,
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
  const name = window.prompt('Nom du site', props.site.name)
  if (name) store.renameSite(props.site.id, name)
}
</script>

<template>
  <g class="site" :class="{ selected: isSelected }">
    <rect
      :x="site.x"
      :y="site.y"
      :width="size.width"
      :height="size.height"
      rx="6"
      class="site-body"
      @pointerdown="onHeaderPointerDown"
      @dblclick="rename"
    />
    <text :x="site.x + 10" :y="site.y + 20" class="site-title" @dblclick="rename">🏢 {{ site.name }}</text>
    <text
      class="site-toggle"
      :x="site.x + size.width - 10"
      :y="site.y + 20"
      text-anchor="end"
      @pointerdown.stop="store.toggleSiteCollapsed(site.id)"
    >
      {{ site.collapsed ? '▸ déplier' : '▾ replier' }}
    </text>

    <text
      v-if="site.collapsed"
      :x="site.x + size.width / 2"
      :y="site.y + size.height / 2 + 14"
      text-anchor="middle"
      class="site-count"
    >
      {{ memberCount }} équipement{{ memberCount > 1 ? 's' : '' }}
    </text>

    <rect
      v-if="isSelected && !site.collapsed"
      :x="site.x + site.width - 10"
      :y="site.y + site.height - 10"
      width="10"
      height="10"
      class="resize-handle"
      @pointerdown="onResizePointerDown"
    />
  </g>
</template>

<style scoped>
.site-body {
  fill: var(--color-site-bg);
  stroke: var(--color-site-border);
  stroke-width: 2;
  stroke-dasharray: 8 4;
}
.selected .site-body {
  stroke-width: 3;
}
.site-title {
  font-size: 13px;
  font-weight: 700;
  fill: var(--color-site-border);
  user-select: none;
}
.site-toggle {
  font-size: 10px;
  fill: var(--color-site-border);
  cursor: pointer;
  user-select: none;
}
.site-count {
  font-size: 12px;
  fill: var(--color-site-border);
  font-style: italic;
  user-select: none;
}
.resize-handle {
  fill: var(--color-text);
  cursor: nwse-resize;
}
</style>
