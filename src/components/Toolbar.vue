<script setup>
import { ref } from 'vue'
import { usePlanStore } from '../stores/plan'
import { downloadText } from '../utils/download'
import { exportSvg, exportPng } from '../utils/export'
import { parseImportItems } from '../utils/importData'
import VlanPanel from './VlanPanel.vue'

const store = usePlanStore()
const fileInput = ref(null)
const dataFileInput = ref(null)
const showVlans = ref(false)

function addZone() {
  store.addZone()
}

function addRack() {
  store.addRack()
}

function exportJson() {
  downloadText(store.toJSON(), 'plan-reseau.json', 'application/json')
}

function triggerImport() {
  fileInput.value?.click()
}

async function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    store.loadFromData(JSON.parse(await file.text()))
  } catch {
    window.alert('Fichier JSON invalide.')
  }
  event.target.value = ''
}

function triggerGenerate() {
  dataFileInput.value?.click()
}

async function onDataFileChange(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    const items = parseImportItems(file.name, await file.text())
    store.generateFromImport(items)
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'Fichier invalide.')
  }
  event.target.value = ''
}

function onExportSvg() {
  exportSvg(document.querySelector('.canvas-board svg'), 'plan-reseau.svg')
}

function onExportPng() {
  exportPng(document.querySelector('.canvas-board svg'), 'plan-reseau.png')
}
</script>

<template>
  <header class="toolbar">
    <strong class="title">Outil Plan Réseau</strong>

    <button type="button" @click="addZone">+ Zone</button>
    <button type="button" @click="addRack">+ Baie</button>
    <button type="button" class="mode-button" :class="{ active: showVlans }" @click="showVlans = !showVlans">
      VLANs
    </button>
    <VlanPanel v-if="showVlans" @close="showVlans = false" />
    <button
      type="button"
      class="mode-button"
      :class="{ active: store.linkMode }"
      title="Clic sur un nœud source puis un nœud cible pour créer un câble. Échap pour annuler/sortir."
      @click="store.toggleLinkMode()"
    >
      {{ store.linkMode ? '✓ Mode relier' : 'Mode relier' }}
    </button>

    <span class="sep" />

    <button type="button" @click="exportJson">Exporter JSON</button>
    <button type="button" @click="triggerImport">Importer JSON</button>
    <input ref="fileInput" type="file" accept="application/json" class="hidden-input" @change="onFileChange" />

    <span class="sep" />

    <button type="button" @click="onExportPng">Exporter PNG</button>
    <button type="button" @click="onExportSvg">Exporter SVG</button>

    <span class="sep" />

    <button
      type="button"
      title="CSV: colonnes id,type,label,links (links séparés par |). JSON: tableau [{id, type, label, links}]."
      @click="triggerGenerate"
    >
      Générer depuis CSV/JSON
    </button>
    <input
      ref="dataFileInput"
      type="file"
      accept=".csv,.json,text/csv,application/json"
      class="hidden-input"
      @change="onDataFileChange"
    />
  </header>
</template>

<style scoped>
.toolbar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #e5e7eb;
}
.title {
  margin-right: 16px;
}
.sep {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 4px;
}
button {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
button:hover {
  background: #f3f4f6;
}
.hidden-input {
  display: none;
}
.mode-button.active {
  background: #f59e0b;
  border-color: #d97706;
  color: #fff;
}
</style>
