import { defineStore } from 'pinia'
import { equipmentByType, rackSpanByType } from '../constants/equipmentTypes'
import { autoLayout } from '../utils/autoLayout'
import { findZoneForNode } from '../utils/zoneAssignment'
import { findFreeRackSlot, rackSlotCenter, RACK_WIDTH } from '../utils/rackLayout'
import { closestSegmentIndex } from '../utils/waypoints'
import { computeLinkRoutes } from '../utils/linkRouting'

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
    racks: [],
    vlans: [],
    selectedIds: [],
    // id du nœud depuis lequel on est en train de tirer un câble, ou null
    linkingFromId: null,
    // mode « relier » actif : un clic gauche sur un nœud tire un câble
    // au lieu de le déplacer (Alt+clic reste un raccourci direct hors mode)
    linkMode: false,
  }),

  getters: {
    selectedNodes: (state) => state.nodes.filter((n) => state.selectedIds.includes(n.id)),
    selectedNodeIds: (state) =>
      state.nodes.filter((n) => state.selectedIds.includes(n.id)).map((n) => n.id),
    // Points à tracer pour chaque câble : voir utils/linkRouting.js.
    linkRoutes: (state) => computeLinkRoutes(state.links, state.nodes),
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
        rackId: null,
        rackUnit: null,
        rackSpan: rackSpanByType(type),
      }
      this.nodes.push(node)
      this.selectedIds = [node.id]
      this.recomputeZoneAssignments()
      return node
    },

    // Déplace tous les nœuds de `ids` par le même delta (déplacement groupé).
    moveNodesBy(ids, dx, dy) {
      const idSet = new Set(ids)
      for (const node of this.nodes) {
        if (idSet.has(node.id)) {
          node.x += dx
          node.y += dy
        }
      }
      this.recomputeZoneAssignments()
    },

    select(id) {
      this.selectedIds = [id]
    },

    toggleSelected(id) {
      const i = this.selectedIds.indexOf(id)
      if (i === -1) this.selectedIds.push(id)
      else this.selectedIds.splice(i, 1)
    },

    // Sélection par rectangle : remplace la sélection, ou l'étend si additive (Ctrl/Cmd).
    selectIds(ids, { additive = false } = {}) {
      if (additive) {
        this.selectedIds = [...new Set([...this.selectedIds, ...ids])]
      } else {
        this.selectedIds = [...ids]
      }
    },

    clearSelection() {
      this.selectedIds = []
    },

    startLinking(id) {
      this.linkingFromId = id
    },

    cancelLinking() {
      this.linkingFromId = null
    },

    toggleLinkMode() {
      this.linkMode = !this.linkMode
      this.linkingFromId = null
    },

    exitLinkMode() {
      this.linkMode = false
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
      this.links.push({ id: nextId('link'), sourceId, targetId, label: '', vlanId: null, waypoints: [] })
    },

    renameLink(id, name) {
      const link = this.links.find((l) => l.id === id)
      if (link && name !== null) link.label = name
    },

    setLinkVlan(id, vlanId) {
      const link = this.links.find((l) => l.id === id)
      if (link) link.vlanId = vlanId
    },

    // Insère un waypoint au bon endroit du tracé (segment le plus proche de x,y).
    addLinkWaypoint(id, x, y) {
      const link = this.links.find((l) => l.id === id)
      if (!link) return
      const source = this.nodes.find((n) => n.id === link.sourceId)
      const target = this.nodes.find((n) => n.id === link.targetId)
      if (!source || !target) return
      const points = [source, ...link.waypoints, target]
      const segmentIndex = closestSegmentIndex({ x, y }, points)
      link.waypoints.splice(segmentIndex, 0, { x, y })
    },

    moveLinkWaypoint(id, index, x, y) {
      const link = this.links.find((l) => l.id === id)
      if (!link || !link.waypoints[index]) return
      link.waypoints[index] = { x, y }
    },

    removeLinkWaypoint(id, index) {
      const link = this.links.find((l) => l.id === id)
      if (!link) return
      link.waypoints.splice(index, 1)
    },

    // Sans position explicite, place la zone à droite du contenu existant
    // pour ne jamais apparaître superposée à des nœuds/zones déjà présents.
    addZone(x, y, width = 220, height = 160) {
      if (x === undefined || y === undefined) {
        const rightEdges = [...this.nodes.map((n) => n.x + 28), ...this.zones.map((z) => z.x + z.width)]
        const topEdges = [...this.nodes.map((n) => n.y - 28), ...this.zones.map((z) => z.y)]
        x = rightEdges.length ? Math.max(...rightEdges) + 60 : 80
        y = topEdges.length ? Math.min(...topEdges) : 80
      }
      const zone = {
        id: nextId('zone'),
        name: `Zone ${this.zones.length + 1}`,
        color: '#38bdf8',
        x,
        y,
        width,
        height,
        // Sous-réseau/VLAN logique optionnel, non exploité pour l'instant.
        subnet: '',
      }
      this.zones.push(zone)
      this.selectedIds = [zone.id]
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

    // Sans position explicite, place la baie à droite du contenu existant (même
    // logique que addZone) pour ne jamais apparaître superposée à l'existant.
    addRack(x, y, units = 12) {
      if (x === undefined || y === undefined) {
        const rightEdges = [
          ...this.nodes.map((n) => n.x + 28),
          ...this.zones.map((z) => z.x + z.width),
          ...this.racks.map((r) => r.x + RACK_WIDTH),
        ]
        const topEdges = [
          ...this.nodes.map((n) => n.y - 28),
          ...this.zones.map((z) => z.y),
          ...this.racks.map((r) => r.y),
        ]
        x = rightEdges.length ? Math.max(...rightEdges) + 60 : 80
        y = topEdges.length ? Math.min(...topEdges) : 80
      }
      const rack = { id: nextId('rack'), name: `Baie ${this.racks.length + 1}`, x, y, units }
      this.racks.push(rack)
      this.selectedIds = [rack.id]
      return rack
    },

    moveRack(id, x, y) {
      const rack = this.racks.find((r) => r.id === id)
      if (!rack) return
      rack.x = x
      rack.y = y
      this.syncRackNodePositions(id)
      this.recomputeZoneAssignments()
    },

    renameRack(id, name) {
      const rack = this.racks.find((r) => r.id === id)
      if (rack && name) rack.name = name
    },

    // Refuse de réduire une baie sous la plus haute U actuellement occupée.
    // Retourne false (et ne change rien) si le nouveau nombre d'U est trop petit.
    resizeRackUnits(id, units) {
      const rack = this.racks.find((r) => r.id === id)
      if (!rack) return false
      const safeUnits = Math.max(1, Math.round(units))
      const highestOccupied = this.nodes
        .filter((n) => n.rackId === id)
        .reduce((max, n) => Math.max(max, n.rackUnit + n.rackSpan - 1), 0)
      if (safeUnits < highestOccupied) return false
      rack.units = safeUnits
      return true
    },

    // Monte un équipement (libre ou déjà en baie) sur la première U libre de la
    // baie ciblée. Ne fait rien si la baie est pleine (le nœud reste où il était).
    assignNodeToRack(nodeId, rackId) {
      const node = this.nodes.find((n) => n.id === nodeId)
      const rack = this.racks.find((r) => r.id === rackId)
      if (!node || !rack) return
      const span = node.rackSpan || rackSpanByType(node.type)
      const preferredStart = node.rackId === rackId ? node.rackUnit : null
      const slot = findFreeRackSlot(rack, this.nodes, span, node.id, preferredStart)
      if (slot === null) return

      node.rackId = rackId
      node.rackUnit = slot
      node.rackSpan = span
      this.syncRackNodePositions(rackId)
      this.recomputeZoneAssignments()
    },

    // Sort un équipement de sa baie : redevient un nœud libre à la position donnée.
    removeNodeFromRack(nodeId, x, y) {
      const node = this.nodes.find((n) => n.id === nodeId)
      if (!node) return
      node.rackId = null
      node.rackUnit = null
      node.x = x
      node.y = y
      this.recomputeZoneAssignments()
    },

    // Recalcule x/y de tous les équipements montés dans une baie d'après sa
    // position actuelle : c'est ce qui les fait « se déplacer avec elle ».
    syncRackNodePositions(rackId) {
      const rack = this.racks.find((r) => r.id === rackId)
      if (!rack) return
      for (const node of this.nodes) {
        if (node.rackId === rackId && node.rackUnit) {
          const { x, y } = rackSlotCenter(rack, node.rackUnit, node.rackSpan)
          node.x = x
          node.y = y
        }
      }
    },

    addVlan() {
      const used = this.vlans.map((v) => v.number)
      let number = 10
      while (used.includes(number)) number += 10
      const vlan = { id: nextId('vlan'), number, name: `VLAN ${number}`, color: '#a78bfa' }
      this.vlans.push(vlan)
      return vlan
    },

    renameVlan(id, name) {
      const vlan = this.vlans.find((v) => v.id === id)
      if (vlan && name) vlan.name = name
    },

    setVlanNumber(id, number) {
      const vlan = this.vlans.find((v) => v.id === id)
      if (vlan && Number.isFinite(number) && number > 0) vlan.number = Math.round(number)
    },

    setVlanColor(id, color) {
      const vlan = this.vlans.find((v) => v.id === id)
      if (vlan) vlan.color = color
    },

    deleteVlan(id) {
      this.vlans = this.vlans.filter((v) => v.id !== id)
    },

    recomputeZoneAssignments() {
      for (const node of this.nodes) {
        const zone = findZoneForNode(node, this.zones)
        node.zoneId = zone ? zone.id : null
      }
    },

    deleteSelection() {
      const ids = new Set(this.selectedIds)
      if (!ids.size) return
      this.nodes = this.nodes.filter((n) => !ids.has(n.id))
      this.links = this.links.filter((l) => !ids.has(l.id) && !ids.has(l.sourceId) && !ids.has(l.targetId))
      this.zones = this.zones.filter((z) => !ids.has(z.id))
      this.racks = this.racks.filter((r) => !ids.has(r.id))
      // Une baie supprimée libère les équipements qu'elle contenait (ils gardent leur position).
      for (const node of this.nodes) {
        if (node.rackId && !this.racks.some((r) => r.id === node.rackId)) {
          node.rackId = null
          node.rackUnit = null
        }
      }
      this.selectedIds = []
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
          rackId: null,
          rackUnit: null,
          rackSpan: rackSpanByType(item.type),
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
        if (!exists) {
          this.links.push({
            id: nextId('link'),
            sourceId: l.sourceId,
            targetId: l.targetId,
            label: '',
            vlanId: null,
            waypoints: [],
          })
        }
      }

      this.selectedIds = []
      this.recomputeZoneAssignments()
    },

    toJSON() {
      return JSON.stringify(
        { nodes: this.nodes, links: this.links, zones: this.zones, racks: this.racks, vlans: this.vlans },
        null,
        2,
      )
    },

    loadFromData(data) {
      this.racks = Array.isArray(data.racks) ? data.racks : []
      this.vlans = Array.isArray(data.vlans) ? data.vlans : []
      this.nodes = Array.isArray(data.nodes)
        ? data.nodes.map((n) => ({ rackId: null, rackUnit: null, rackSpan: rackSpanByType(n.type), ...n }))
        : []
      this.links = Array.isArray(data.links)
        ? data.links.map((l) => ({ vlanId: null, waypoints: [], ...l }))
        : []
      this.zones = Array.isArray(data.zones) ? data.zones.map((z) => ({ subnet: '', ...z })) : []
      this.selectedIds = []
      this.linkingFromId = null
      bumpIdCounterFrom([this.nodes, this.links, this.zones, this.racks, this.vlans])
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
