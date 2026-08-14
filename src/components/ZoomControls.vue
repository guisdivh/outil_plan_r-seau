<script setup>
import { usePlanStore } from '../stores/plan'

const store = usePlanStore()

function viewportCenter() {
  const el = document.querySelector('.canvas-board')
  return el ? { x: el.clientWidth / 2, y: el.clientHeight / 2 } : { x: 0, y: 0 }
}

function zoomIn() {
  const c = viewportCenter()
  store.zoomAtScreenPoint(c.x, c.y, 1.2)
}

function zoomOut() {
  const c = viewportCenter()
  store.zoomAtScreenPoint(c.x, c.y, 1 / 1.2)
}

function fit() {
  const el = document.querySelector('.canvas-board')
  if (el) store.fitToContent(el.clientWidth, el.clientHeight)
}
</script>

<template>
  <div class="zoom-controls">
    <button type="button" title="Zoom arrière" @click="zoomOut">−</button>
    <span class="zoom-level">{{ Math.round(store.viewZoom * 100) }}%</span>
    <button type="button" title="Zoom avant" @click="zoomIn">+</button>
    <span class="sep" />
    <button type="button" title="Ajuster à l'écran (raccourci : 0)" @click="fit">Ajuster</button>
    <button type="button" title="Zoom 100 %" @click="store.resetView()">100 %</button>
  </div>
</template>

<style scoped>
.zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
button {
  padding: 4px 8px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-sm);
  cursor: pointer;
}
button:hover {
  background: var(--color-surface-2);
}
.zoom-level {
  min-width: 42px;
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}
.sep {
  width: 1px;
  height: 18px;
  background: var(--color-border);
  margin: 0 2px;
}
</style>
