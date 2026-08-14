import { defineStore } from 'pinia'
import { equipmentByType } from '../constants/equipmentTypes'
import { autoLayout } from '../utils/autoLayout'

const STORAGE_KEY = 'outil-plan-reseau:plan'

let idCounter = 0
function nextId(prefix) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

// Après un import, on repart d'un compteur au-dessus du plus grand id chargé
// pour éviter toute collision avec les futurs nœuds/liens/zones créés.
function bumpIdCounterFrom(collections) {
  let max = 0
  for (const list of collections) {
    for (const item of list) {
      const n = Number(String(item.id).split('-').pop())
      if (Number.isFinite(n) && n > max) max = n
    }
  }
  idCounter = Math.max(idCounter, max)
}

export const usePlanStore = defineStore('plan', {
  state: () => ({
    nodes: [],
    links: [],
    zones: [],
    selectedId: null,
    // id du nœud depuis lequel on est en train de tirer un câble, ou null
    linkingFromId: null,
  }),

  getters: {
    selectedNode: (state) => state.nodes.find((n) => n.id === state.selectedId) ?? null,
  },

  actions: {
    addNode(type, x, y) {
      const def = equipmentByType(type)
      const node = {
        id: nextId('node'),
        type,
        label: def ? def.label : type,
        x,
        y,
        zoneId: null,
      }
      this.nodes.push(node)
      this.selectedId = node.id
      this.recomputeZoneAssignments()
      return node
    },

    moveNode(id, x, y) {
      const node = this.nodes.find((n) => n.id === id)
      if (!node) return
      node.x = x
      node.y = y
      this.recomputeZoneAssignments()
    },

    select(id) {
      this.selectedId = id
    },

    clearSelection() {
      this.selectedId = null
    },

    startLinking(id) {
      this.linkingFromId = id
    },

    cancelLinking() {
      this.linkingFromId = null
    },

    // Termine la création d'un câble vers le nœud ciblé, si valide.
    finishLinking(targetId) {
      const sourceId = this.linkingFromId
      this.linkingFromId = null
      if (!sourceId || sourceId === targetId) return
      const alreadyLinked = this.links.some(
        (l) =>
          (l.sourceId === sourceId && l.targetId === targetId) ||
          (l.sourceId === targetId && l.targetId === sourceId),
      )
      if (alreadyLinked) return
      this.links.push({ id: nextId('link'), sourceId, targetId, label: '' })
    },

    addZone(x = 80, y = 80, width = 220, height = 160) {
      const zone = {
        id: nextId('zone'),
        name: `Zone ${this.zones.length + 1}`,
        color: '#38bdf8',
        x,
        y,
        width,
        height,
      }
      this.zones.push(zone)
      this.selectedId = zone.id
      this.recomputeZoneAssignments()
      return zone
    },

    moveZone(id, x, y) {
      const zone = this.zones.find((z) => z.id === id)
      if (!zone) return
      zone.x = x
      zone.y = y
      this.recomputeZoneAssignments()
    },

    resizeZone(id, width, height) {
      const zone = this.zones.find((z) => z.id === id)
      if (!zone) return
      zone.width = Math.max(80, width)
      zone.height = Math.max(60, height)
      this.recomputeZoneAssignments()
    },

    renameZone(id, name) {
      const zone = this.zones.find((z) => z.id === id)
      if (zone && name) zone.name = name
    },

    setZoneColor(id, color) {
      const zone = this.zones.find((z) => z.id === id)
      if (zone) zone.color = color
    },

    // Rattache chaque nœud à la zone (topmost) dont le rectangle le contient.
    recomputeZoneAssignments() {
      for (const node of this.nodes) {
        let match = null
        for (const zone of this.zones) {
          if (
            node.x >= zone.x &&
            node.x <= zone.x + zone.width &&
            node.y >= zone.y &&
            node.y <= zone.y + zone.height
          ) {
            match = zone
          }
        }
        node.zoneId = match ? match.id : null
      }
    },

    deleteSelection() {
      const id = this.selectedId
      if (!id) return
      this.nodes = this.nodes.filter((n) => n.id !== id)
      this.links = this.links.filter((l) => l.sourceId !== id && l.targetId !== id)
      this.zones = this.zones.filter((z) => z.id !== id)
      this.selectedId = null
      this.recomputeZoneAssignments()
    },

    // Génère des nœuds/liens à partir d'un import CSV/JSON (voir utils/importData.js).
    // Cohabite avec le dessin manuel : ajoute au plan existant, décalé à droite,
    // sans jamais toucher aux nœuds/liens/zones déjà présents.
    generateFromImport(items) {
      if (!items.length) return

      const baseOffsetX = this.nodes.length ? Math.max(...this.nodes.map((n) => n.x)) + 140 : 80

      const idMap = new Map()
      const createdNodes = items.map((item) => {
        const def = equipmentByType(item.type)
        const node = {
          id: nextId('node'),
          type: item.type,
          label: item.label || (def ? def.label : item.type),
          x: 0,
          y: 0,
          zoneId: null,
        }
        this.nodes.push(node)
        idMap.set(item.id, node)
        return node
      })

      const layoutLinks = []
      items.forEach((item, i) => {
        const node = createdNodes[i]
        for (const targetExternalId of item.links) {
          const target = idMap.get(targetExternalId)
          if (!target || target.id === node.id) continue
          layoutLinks.push({ sourceId: node.id, targetId: target.id })
        }
      })

      const positions = autoLayout(createdNodes, layoutLinks, baseOffsetX)
      for (const node of createdNodes) {
        const p = positions.get(node.id)
        if (p) {
          node.x = p.x
          node.y = p.y
        }
      }

      for (const l of layoutLinks) {
        const exists = this.links.some(
          (e) =>
            (e.sourceId === l.sourceId && e.targetId === l.targetId) ||
            (e.sourceId === l.targetId && e.targetId === l.sourceId),
        )
        if (!exists) this.links.push({ id: nextId('link'), sourceId: l.sourceId, targetId: l.targetId, label: '' })
      }

      this.selectedId = null
      this.recomputeZoneAssignments()
    },

    toJSON() {
      return JSON.stringify({ nodes: this.nodes, links: this.links, zones: this.zones }, null, 2)
    },

    loadFromData(data) {
      this.nodes = Array.isArray(data.nodes) ? data.nodes : []
      this.links = Array.isArray(data.links) ? data.links : []
      this.zones = Array.isArray(data.zones) ? data.zones : []
      this.selectedId = null
      this.linkingFromId = null
      bumpIdCounterFrom([this.nodes, this.links, this.zones])
    },

    saveToLocalStorage() {
      localStorage.setItem(STORAGE_KEY, this.toJSON())
    },

    loadFromLocalStorage() {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      try {
        this.loadFromData(JSON.parse(raw))
      } catch {
        // Contenu localStorage corrompu : on ignore et repart d'un plan vide.
      }
    },
  },
})
