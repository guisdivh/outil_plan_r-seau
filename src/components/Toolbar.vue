<script setup>
import { nextTick, ref } from 'vue'
import { usePlanStore } from '../stores/plan'
import { downloadText } from '../utils/download'
import { exportSvg, exportPng } from '../utils/export'
import { parseImportItems } from '../utils/importData'
import VlanPanel from './VlanPanel.vue'
import { applyTheme, effectiveTheme } from '../utils/theme'

const store = usePlanStore()
const fileInput = ref(null)
const dataFileInput = ref(null)
const showVlans = ref(false)
const theme = ref(effectiveTheme())

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  applyTheme(theme.value)
}

function addZone() {
  store.addZone()
}

function addRack() {
  const input = window.prompt("Nombre d'U de la nouvelle baie", '12')
  if (input === null) return
  const units = Number(input)
  store.addRack(undefined, undefined, Number.isFinite(units) && units > 0 ? Math.round(units) : 12)
}

function addSite() {
  store.addSite()
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

// Bascule brièvement en mode « tout afficher » + thème clair forcé le temps
// de la capture, puis restaure l'affichage écran tel qu'il était. Le clonage
// du SVG dans exportSvg/exportPng est synchrone : on peut annuler dès après.
// L'export doit capturer tout le plan, pas seulement la fenêtre actuellement
// visible/zoomée : on cadre temporairement la vue sur le contenu entier
// (setViewForExport) et on restaure le pan/zoom de l'utilisateur ensuite.
async function withExportMode(capture) {
  const previousTheme = document.documentElement.dataset.theme
  const previousView = { x: store.viewPanX, y: store.viewPanY, zoom: store.viewZoom }
  document.documentElement.dataset.theme = 'light'
  store.setExportMode(true)
  const size = store.setViewForExport()
  await nextTick()
  try {
    capture(size)
  } finally {
    store.setExportMode(false)
    store.setPan(previousView.x, previousView.y)
    store.setZoom(previousView.zoom)
    if (previousTheme) {
      document.documentElement.dataset.theme = previousTheme
    } else {
      delete document.documentElement.dataset.theme
    }
  }
}

function onExportSvg() {
  withExportMode((size) => exportSvg(document.querySelector('.canvas-board svg'), 'plan-reseau.svg', size))
}

function onExportPng() {
  withExportMode((size) => exportPng(document.querySelector('.canvas-board svg'), 'plan-reseau.png', size))
}
</script>

<template>
  <header class="toolbar">
    <strong class="title">Outil Plan Réseau</strong>

    <div class="toolbar-group">
      <button type="button" @click="addZone">+ Zone</button>
      <button type="button" @click="addRack">+ Baie</button>
      <button type="button" @click="addSite">+ Site</button>
    </div>

    <span class="sep" />

    <div class="toolbar-group">
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
      <button
        type="button"
        class="mode-button tunnel"
        :class="{ active: store.tunnelMode }"
        title="Clic sur une passerelle source (routeur/firewall) puis une passerelle cible pour créer un tunnel IPsec. Échap pour annuler/sortir."
        @click="store.toggleTunnelMode()"
      >
        {{ store.tunnelMode ? '✓ Tunnel IPsec' : 'Tunnel IPsec' }}
      </button>
      <button
        type="button"
        class="mode-button"
        :class="{ active: store.showIpLabels }"
        title="Afficher/masquer les adresses IP des interfaces sur le canvas."
        @click="store.toggleIpLabels()"
      >
        Afficher IP
      </button>
    </div>

    <span class="sep" />

    <div class="toolbar-group">
      <button type="button" @click="exportJson">Exporter JSON</button>
      <button type="button" @click="triggerImport">Importer JSON</button>
      <input ref="fileInput" type="file" accept="application/json" class="hidden-input" @change="onFileChange" />
      <button type="button" @click="onExportPng">Exporter PNG</button>
      <button type="button" @click="onExportSvg">Exporter SVG</button>
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
    </div>

    <span class="spacer" />

    <button type="button" class="theme-toggle" title="Basculer entre thème clair et sombre." @click="toggleTheme">
      {{ theme === 'dark' ? '☀️ Clair' : '🌙 Sombre' }}
    </button>
  </header>
</template>

<style scoped>
.toolbar {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.title {
  margin-right: var(--space-2);
  color: var(--color-text);
  font-size: var(--text-md);
}
.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.sep {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 var(--space-1);
}
.spacer {
  flex: 1;
}
button {
  height: 32px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}
button:hover {
  background: var(--color-surface-2);
  border-color: var(--color-border-strong);
}
.hidden-input {
  display: none;
}
/* Boutons de mode (bascule persistante) : forme en pilule pour se distinguer
   visuellement des actions ponctuelles (rectangulaires) du reste de la barre. */
.mode-button {
  border-radius: var(--radius-lg);
}
.mode-button.active {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: var(--color-accent-contrast);
}
.mode-button.tunnel.active {
  background: var(--color-tunnel);
  border-color: var(--color-tunnel);
  color: #fff;
}
.theme-toggle {
  border-radius: var(--radius-lg);
}
</style>
