import { defineStore } from 'pinia'
import { equipmentByType, rackSpanByType } from '../constants/equipmentTypes'
import { autoLayout } from '../utils/autoLayout'
import { findZoneForNode } from '../utils/zoneAssignment'
import { findFreeRackSlot, rackSlotCenter, RACK_WIDTH } from '../utils/rackLayout'
import { closestSegmentIndex } from '../utils/waypoints'
import { computeLinkRoutes } from '../utils/linkRouting'
import { siteDisplaySize } from '../utils/siteLayout'
import { resolveEffectiveNodes } from '../utils/nodeVisibility'
import { computePlanBounds } from '../utils/planBounds'
import { MIN_ZOOM, MAX_ZOOM } from '../utils/viewport'
import { canBeTunnelEndpoint } from '../constants/equipmentTypes'
import { sidePanelFootprint } from '../utils/exportSidePanel'
import { visibleBusesOf, computeBusRoutes } from '../utils/busRouting'

const STORAGE_KEY = 'outil-plan-reseau:plan'

let idCounter = 0
function nextId(prefix) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

// Tolère des coordonnées fournies en chaîne ("120") ; rejette tout le reste
// (undefined, texte non numérique...) plutôt que de laisser passer un NaN qui
// rendrait l'élément invisible sur le canvas sans aucune erreur visible.
function toFiniteNumber(v) {
  const n = typeof v === 'string' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined
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
    sites: [],
    tunnels: [],
    // Regroupement visuel de câbles convergeant vers un même équipement (le
    // hub) en un tronc commun + dérivations — voir prompt 27. Les câbles
    // eux-mêmes ne sont jamais modifiés au-delà de leur champ busId.
    buses: [],
    selectedIds: [],
    // id du nœud depuis lequel on est en train de tirer un câble/tunnel, ou null
    linkingFromId: null,
    // 'cable' ou 'tunnel' : décidé au premier clic (startLinking), utilisé par finishLinking
    linkingKind: 'cable',
    // mode « relier » actif : un clic gauche sur un nœud tire un câble
    // au lieu de le déplacer (Alt+clic reste un raccourci direct hors mode)
    linkMode: false,
    // mode « tunnel IPsec » : même principe que linkMode, mutuellement exclusif
    tunnelMode: false,
    // Réglages d'affichage (pas des données du plan, non exportés/sauvegardés).
    showIpLabels: false,
    // Actif brièvement pendant un export : force l'affichage exhaustif
    // (IP, labels/VLAN des câbles, phase des tunnels) sur le rendu déjà à l'écran.
    exportMode: false,
    // Vue du canvas (pan/zoom) : réglage d'affichage, pas une donnée du plan.
    viewPanX: 0,
    viewPanY: 0,
    viewZoom: 1,
  }),

  getters: {
    selectedNodes: (state) => state.nodes.filter((n) => state.selectedIds.includes(n.id)),
    selectedNodeIds: (state) =>
      state.nodes.filter((n) => state.selectedIds.includes(n.id)).map((n) => n.id),
    // Nœuds visibles sur le canvas : masque ceux dont le site ou la baie est replié.
    // Une baie repliée indirectement (son site est replié, même si elle ne
    // l'est pas elle-même) masque aussi les nœuds montés dedans — un nœud en
    // baie n'a pas son propre siteId, seule sa baie porte le rattachement.
    visibleNodes: (state) => {
      const collapsedSiteIds = new Set(state.sites.filter((s) => s.collapsed).map((s) => s.id))
      const collapsedRackIds = new Set(
        state.racks.filter((r) => r.collapsed || (r.siteId && collapsedSiteIds.has(r.siteId))).map((r) => r.id),
      )
      return state.nodes.filter(
        (n) =>
          (!n.siteId || !collapsedSiteIds.has(n.siteId)) &&
          (!n.rackId || !collapsedRackIds.has(n.rackId)),
      )
    },
    // Zones/baies visibles : même principe que visibleNodes — masquées si leur
    // site est replié (une baie n'a pas de « site » au sens d'un nœud, mais
    // elle a bien un siteId, donc la même règle s'applique).
    visibleZones: (state) => {
      const collapsedSiteIds = new Set(state.sites.filter((s) => s.collapsed).map((s) => s.id))
      return state.zones.filter((z) => !z.siteId || !collapsedSiteIds.has(z.siteId))
    },
    visibleRacks: (state) => {
      const collapsedSiteIds = new Set(state.sites.filter((s) => s.collapsed).map((s) => s.id))
      return state.racks.filter((r) => !r.siteId || !collapsedSiteIds.has(r.siteId))
    },
    // Bus dont il reste au moins 2 câbles membres (sinon rien à simplifier
    // visuellement) : c'est ce filtre, pas state.buses brut, qui doit être
    // utilisé partout où « quels bus sont affichés » importe.
    visibleBuses: (state) => visibleBusesOf(state.buses, state.links),
    // Câbles rendus individuellement : tous sauf ceux dont le bus est actuellement affiché
    // (ceux-là sont rendus une fois par bus, en tronc + dérivations — voir busRoutes).
    ungroupedLinks: (state) => {
      const visibleIds = new Set(visibleBusesOf(state.buses, state.links).map((b) => b.id))
      return state.links.filter((l) => !l.busId || !visibleIds.has(l.busId))
    },
    // Points à tracer pour chaque câble non groupé (voir utils/linkRouting.js) : un nœud dont
    // le site/la baie est replié est ancré au centre du bloc replié plutôt qu'à sa position réelle.
    linkRoutes: (state) => {
      const visibleIds = new Set(visibleBusesOf(state.buses, state.links).map((b) => b.id))
      const ungrouped = state.links.filter((l) => !l.busId || !visibleIds.has(l.busId))
      return computeLinkRoutes(ungrouped, resolveEffectiveNodes(state.nodes, state.sites, state.racks))
    },
    // Tronc + dérivations de chaque bus affiché (voir utils/busRouting.js).
    busRoutes: (state) => {
      const visible = visibleBusesOf(state.buses, state.links)
      return computeBusRoutes(visible, state.links, resolveEffectiveNodes(state.nodes, state.sites, state.racks))
    },
    // Extrémités (déjà résolues) de chaque tunnel : trait direct, pas de routage orthogonal.
    tunnelEndpoints: (state) => {
      const resolved = resolveEffectiveNodes(state.nodes, state.sites, state.racks)
      const byId = new Map(resolved.map((n) => [n.id, n]))
      const map = new Map()
      for (const t of state.tunnels) {
        const source = byId.get(t.sourceId)
        const target = byId.get(t.targetId)
        if (source && target) map.set(t.id, { source, target })
      }
      return map
    },
    viewTransform: (state) => `translate(${state.viewPanX}, ${state.viewPanY}) scale(${state.viewZoom})`,
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
        interfaces: [],
        siteId: null,
        exposedPorts: [],
      }
      this.nodes.push(node)
      this.selectedIds = [node.id]
      this.recomputeZoneAssignments()
      return node
    },

    addExposedPort(nodeId) {
      const node = this.nodes.find((n) => n.id === nodeId)
      if (!node) return
      const rule = {
        id: nextId('rule'),
        alias: '',
        port: null,
        protocol: 'tcp',
        destinationIp: '',
        destinationPort: null,
        whitelist: [],
        direction: 'inbound',
        status: 'active',
      }
      node.exposedPorts.push(rule)
      return rule
    },

    updateExposedPort(nodeId, ruleId, patch) {
      const node = this.nodes.find((n) => n.id === nodeId)
      const rule = node?.exposedPorts.find((r) => r.id === ruleId)
      if (rule) Object.assign(rule, patch)
    },

    removeExposedPort(nodeId, ruleId) {
      const node = this.nodes.find((n) => n.id === nodeId)
      if (!node) return
      node.exposedPorts = node.exposedPorts.filter((r) => r.id !== ruleId)
    },

    addInterface(nodeId) {
      const node = this.nodes.find((n) => n.id === nodeId)
      if (!node) return
      const iface = { id: nextId('iface'), role: 'lan', ip: '', mask: '', vlanId: null }
      node.interfaces.push(iface)
      return iface
    },

    updateInterface(nodeId, interfaceId, patch) {
      const node = this.nodes.find((n) => n.id === nodeId)
      const iface = node?.interfaces.find((i) => i.id === interfaceId)
      if (iface) Object.assign(iface, patch)
    },

    removeInterface(nodeId, interfaceId) {
      const node = this.nodes.find((n) => n.id === nodeId)
      if (!node) return
      node.interfaces = node.interfaces.filter((i) => i.id !== interfaceId)
    },

    toggleIpLabels() {
      this.showIpLabels = !this.showIpLabels
    },

    setExportMode(value) {
      this.exportMode = value
    },

    setPan(x, y) {
      this.viewPanX = x
      this.viewPanY = y
    },

    // Restaure un niveau de zoom exact (ex : après un cadrage temporaire pour export).
    setZoom(zoom) {
      this.viewZoom = zoom
    },

    // Zoom centré sur un point écran donné (curseur pour la molette, centre du
    // canvas pour les boutons +/-) : ce point doit rester sous le même pixel.
    zoomAtScreenPoint(screenX, screenY, factor) {
      const oldZoom = this.viewZoom
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * factor))
      const canvasX = (screenX - this.viewPanX) / oldZoom
      const canvasY = (screenY - this.viewPanY) / oldZoom
      this.viewPanX = screenX - canvasX * newZoom
      this.viewPanY = screenY - canvasY * newZoom
      this.viewZoom = newZoom
    },

    resetView() {
      this.viewPanX = 0
      this.viewPanY = 0
      this.viewZoom = 1
    },

    // Cadre l'ensemble du plan dans la zone visible (taille du conteneur canvas en px).
    fitToContent(viewportWidth, viewportHeight) {
      const bounds = computePlanBounds(this.nodes, this.zones, this.racks, this.sites, this.links)
      const margin = 60
      const contentWidth = Math.max(1, bounds.maxX - bounds.minX)
      const contentHeight = Math.max(1, bounds.maxY - bounds.minY)
      const zoom = Math.max(
        MIN_ZOOM,
        Math.min(
          MAX_ZOOM,
          Math.min(
            (viewportWidth - margin * 2) / contentWidth,
            (viewportHeight - margin * 2) / contentHeight,
          ),
        ),
      )
      this.viewZoom = zoom
      this.viewPanX = viewportWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom
      this.viewPanY = viewportHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom
    },

    // Cadre le plan entier à l'échelle 1:1 pour l'export (pas la fenêtre actuelle).
    // Retourne la taille exacte de contenu à utiliser pour dimensionner le SVG exporté.
    // Réserve aussi la place du panneau latéral (légende VLAN + branchements,
    // voir ExportSidePanel.vue) : sans ça, il serait purement et simplement
    // rogné hors du cadre de l'image exportée.
    setViewForExport() {
      const bounds = computePlanBounds(this.nodes, this.zones, this.racks, this.sites, this.links)
      const margin = 40
      const panel = sidePanelFootprint(this.vlans.length, this.links.length)
      this.viewZoom = 1
      this.viewPanX = margin - bounds.minX
      this.viewPanY = margin - bounds.minY
      return {
        width: bounds.maxX - bounds.minX + margin * 2 + panel.width,
        height: Math.max(bounds.maxY - bounds.minY, panel.height) + margin * 2,
      }
    },

    renameNode(id, label) {
      const node = this.nodes.find((n) => n.id === id)
      if (node) node.label = label
    },

    // Le rackSpan par défaut n'est recalculé que si le nœud n'est pas en baie,
    // pour ne pas perturber un emplacement déjà occupé.
    setNodeType(id, type) {
      const node = this.nodes.find((n) => n.id === id)
      if (!node) return
      node.type = type
      if (!node.rackId) node.rackSpan = rackSpanByType(type)
    },

    setNodesType(ids, type) {
      for (const id of ids) this.setNodeType(id, type)
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

    // Applique une position propre à chaque nœud (contrairement à moveNodesBy,
    // qui applique le même delta à tous) — utilisé par l'alignement/la
    // distribution. Ne touche jamais siteId (comme moveNodesBy) ; zoneId est
    // recalculé selon la nouvelle position, exactement comme un glisser-déposer.
    setNodePositions(updates) {
      const byId = new Map(updates.map((u) => [u.id, u]))
      for (const node of this.nodes) {
        const u = byId.get(node.id)
        if (u) {
          node.x = u.x
          node.y = u.y
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

    startLinking(id, kind = 'cable') {
      // Un tunnel ne peut démarrer que depuis une passerelle (routeur/firewall).
      if (kind === 'tunnel') {
        const node = this.nodes.find((n) => n.id === id)
        if (!node || !canBeTunnelEndpoint(node.type)) return
      }
      this.linkingFromId = id
      this.linkingKind = kind
    },

    cancelLinking() {
      this.linkingFromId = null
    },

    toggleLinkMode() {
      this.linkMode = !this.linkMode
      this.tunnelMode = false
      this.linkingFromId = null
    },

    toggleTunnelMode() {
      this.tunnelMode = !this.tunnelMode
      this.linkMode = false
      this.linkingFromId = null
    },

    exitLinkingModes() {
      this.linkMode = false
      this.tunnelMode = false
      this.linkingFromId = null
    },

    // Termine la création d'un câble ou d'un tunnel vers le nœud ciblé, selon
    // le type décidé au premier clic (startLinking).
    finishLinking(targetId) {
      const sourceId = this.linkingFromId
      const kind = this.linkingKind
      this.linkingFromId = null
      if (!sourceId || sourceId === targetId) return

      if (kind === 'tunnel') {
        const source = this.nodes.find((n) => n.id === sourceId)
        const target = this.nodes.find((n) => n.id === targetId)
        if (!canBeTunnelEndpoint(source?.type) || !canBeTunnelEndpoint(target?.type)) return
        const alreadyTunneled = this.tunnels.some(
          (t) =>
            (t.sourceId === sourceId && t.targetId === targetId) ||
            (t.sourceId === targetId && t.targetId === sourceId),
        )
        if (alreadyTunneled) return
        this.tunnels.push({ id: nextId('tunnel'), name: '', sourceId, targetId, phase: '' })
        return
      }

      const alreadyLinked = this.links.some(
        (l) =>
          (l.sourceId === sourceId && l.targetId === targetId) ||
          (l.sourceId === targetId && l.targetId === sourceId),
      )
      if (alreadyLinked) return
      this.links.push({
        id: nextId('link'),
        sourceId,
        targetId,
        label: '',
        vlanId: null,
        waypoints: [],
        sourcePort: '',
        targetPort: '',
        busId: null,
      })
    },

    renameTunnel(id, name) {
      const tunnel = this.tunnels.find((t) => t.id === id)
      if (tunnel && name !== null) tunnel.name = name
    },

    setTunnelPhase(id, phase) {
      const tunnel = this.tunnels.find((t) => t.id === id)
      if (tunnel && phase !== null) tunnel.phase = phase
    },

    renameLink(id, name) {
      const link = this.links.find((l) => l.id === id)
      if (link && name !== null) link.label = name
    },

    setLinkVlan(id, vlanId) {
      const link = this.links.find((l) => l.id === id)
      if (link) link.vlanId = vlanId
    },

    // Port physique de branchement (texte libre, ex. "GE0/1") — distinct des
    // interfaces IP et des règles de ports exposés, qui vivent sur le nœud.
    setLinkSourcePort(id, port) {
      const link = this.links.find((l) => l.id === id)
      if (link) link.sourcePort = port
    },

    setLinkTargetPort(id, port) {
      const link = this.links.find((l) => l.id === id)
      if (link) link.targetPort = port
    },

    // Regroupe les câbles actuellement sélectionnés (et uniquement eux) en un
    // bus, à condition qu'ils partagent un nœud commun (le hub du tronc) et
    // qu'il y en ait au moins 2 — un bus à un seul membre n'a rien à simplifier.
    // Purement additif : ne touche à aucun champ des câbles hormis busId.
    groupSelectedLinksIntoBus() {
      const ids = this.selectedIds
      const links = this.links.filter((l) => ids.includes(l.id))
      if (links.length < 2 || links.length !== ids.length) return false

      const endpointSets = links.map((l) => new Set([l.sourceId, l.targetId]))
      const hubId = [...endpointSets[0]].find((id) => endpointSets.every((set) => set.has(id)))
      if (!hubId) return false

      const bus = { id: nextId('bus'), hubId }
      this.buses.push(bus)
      for (const link of links) link.busId = bus.id
      return true
    },

    // Dissout un bus : les câbles redeviennent des liens rendus individuellement,
    // sans qu'aucune de leurs autres données n'ait jamais changé.
    ungroupBus(busId) {
      for (const link of this.links) if (link.busId === busId) link.busId = null
      this.buses = this.buses.filter((b) => b.id !== busId)
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
        siteId: null,
      }
      this.zones.push(zone)
      this.selectedIds = [zone.id]
      this.recomputeZoneAssignments()
      return zone
    },

    assignZoneToSite(zoneId, siteId) {
      const zone = this.zones.find((z) => z.id === zoneId)
      if (zone) zone.siteId = siteId
    },

    removeZoneFromSite(zoneId) {
      const zone = this.zones.find((z) => z.id === zoneId)
      if (zone) zone.siteId = null
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
      const rack = {
        id: nextId('rack'),
        name: `Baie ${this.racks.length + 1}`,
        x,
        y,
        units,
        siteId: null,
        collapsed: false,
      }
      this.racks.push(rack)
      this.selectedIds = [rack.id]
      return rack
    },

    assignRackToSite(rackId, siteId) {
      const rack = this.racks.find((r) => r.id === rackId)
      if (rack) rack.siteId = siteId
    },

    removeRackFromSite(rackId) {
      const rack = this.racks.find((r) => r.id === rackId)
      if (rack) rack.siteId = null
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

    toggleRackCollapsed(id) {
      const rack = this.racks.find((r) => r.id === id)
      if (rack) rack.collapsed = !rack.collapsed
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

    // Sans position explicite, place le site à droite du contenu existant
    // (même logique que addZone/addRack) pour ne jamais le superposer à l'existant.
    addSite(x, y, width = 320, height = 220) {
      if (x === undefined || y === undefined) {
        const rightEdges = [
          ...this.nodes.map((n) => n.x + 28),
          ...this.zones.map((z) => z.x + z.width),
          ...this.racks.map((r) => r.x + RACK_WIDTH),
          ...this.sites.map((s) => s.x + siteDisplaySize(s).width),
        ]
        const topEdges = [
          ...this.nodes.map((n) => n.y - 28),
          ...this.zones.map((z) => z.y),
          ...this.racks.map((r) => r.y),
          ...this.sites.map((s) => s.y),
        ]
        x = rightEdges.length ? Math.max(...rightEdges) + 60 : 80
        y = topEdges.length ? Math.min(...topEdges) : 80
      }
      const site = { id: nextId('site'), name: `Site ${this.sites.length + 1}`, x, y, width, height, collapsed: false }
      this.sites.push(site)
      this.selectedIds = [site.id]
      return site
    },

    // Déplace le site et translate tout ce qu'il contient du même delta :
    // équipements libres, zones, et baies (qui re-synchronisent au passage
    // leurs propres équipements montés, sans quoi ils seraient déplacés deux fois).
    moveSite(id, x, y) {
      const site = this.sites.find((s) => s.id === id)
      if (!site) return
      const dx = x - site.x
      const dy = y - site.y
      site.x = x
      site.y = y
      for (const node of this.nodes) {
        if (node.siteId === id && !node.rackId) {
          node.x += dx
          node.y += dy
        }
      }
      for (const zone of this.zones) {
        if (zone.siteId === id) {
          zone.x += dx
          zone.y += dy
        }
      }
      for (const rack of this.racks) {
        if (rack.siteId === id) {
          rack.x += dx
          rack.y += dy
          this.syncRackNodePositions(rack.id)
        }
      }
      this.recomputeZoneAssignments()
    },

    resizeSite(id, width, height) {
      const site = this.sites.find((s) => s.id === id)
      if (!site) return
      site.width = Math.max(160, width)
      site.height = Math.max(100, height)
    },

    renameSite(id, name) {
      const site = this.sites.find((s) => s.id === id)
      if (site && name) site.name = name
    },

    toggleSiteCollapsed(id) {
      const site = this.sites.find((s) => s.id === id)
      if (site) site.collapsed = !site.collapsed
    },

    assignNodeToSite(nodeId, siteId) {
      const node = this.nodes.find((n) => n.id === nodeId)
      if (node) node.siteId = siteId
    },

    removeNodeFromSite(nodeId) {
      const node = this.nodes.find((n) => n.id === nodeId)
      if (node) node.siteId = null
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
      this.sites = this.sites.filter((s) => !ids.has(s.id))
      this.tunnels = this.tunnels.filter(
        (t) => !ids.has(t.id) && !ids.has(t.sourceId) && !ids.has(t.targetId),
      )
      // Une baie/un site supprimé libère ce qu'il contenait (position conservée).
      for (const node of this.nodes) {
        if (node.rackId && !this.racks.some((r) => r.id === node.rackId)) {
          node.rackId = null
          node.rackUnit = null
        }
        if (node.siteId && !this.sites.some((s) => s.id === node.siteId)) {
          node.siteId = null
        }
      }
      for (const zone of this.zones) {
        if (zone.siteId && !this.sites.some((s) => s.id === zone.siteId)) {
          zone.siteId = null
        }
      }
      for (const rack of this.racks) {
        if (rack.siteId && !this.sites.some((s) => s.id === rack.siteId)) {
          rack.siteId = null
        }
      }
      // Un bus tombé sous 2 câbles membres (câble ou équipement supprimé) n'a
      // plus rien à simplifier visuellement : il est dissous silencieusement.
      this.buses = this.buses.filter((b) => this.links.filter((l) => l.busId === b.id).length >= 2)
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
          interfaces: [],
          siteId: null,
          exposedPorts: [],
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
        {
          nodes: this.nodes,
          links: this.links,
          zones: this.zones,
          racks: this.racks,
          vlans: this.vlans,
          sites: this.sites,
          tunnels: this.tunnels,
          buses: this.buses,
        },
        null,
        2,
      )
    },

    // Retourne un rapport { droppedNodes, droppedRacks, droppedZones, droppedSites }
    // (libellés des éléments ignorés) pour que l'appelant puisse prévenir
    // l'utilisateur : un import qui perd silencieusement des éléments est pire
    // qu'un import qui échoue bruyamment.
    loadFromData(data) {
      const dropped = { droppedNodes: [], droppedRacks: [], droppedZones: [], droppedSites: [] }

      this.racks = (Array.isArray(data.racks) ? data.racks : []).reduce((acc, r) => {
        const x = toFiniteNumber(r.x)
        const y = toFiniteNumber(r.y)
        if (x === undefined || y === undefined) {
          dropped.droppedRacks.push(r.name || r.id || '?')
          return acc
        }
        acc.push({ siteId: null, collapsed: false, ...r, x, y })
        return acc
      }, [])

      this.vlans = Array.isArray(data.vlans) ? data.vlans : []

      this.sites = (Array.isArray(data.sites) ? data.sites : []).reduce((acc, s) => {
        const x = toFiniteNumber(s.x)
        const y = toFiniteNumber(s.y)
        const width = toFiniteNumber(s.width)
        const height = toFiniteNumber(s.height)
        if ([x, y, width, height].some((v) => v === undefined)) {
          dropped.droppedSites.push(s.name || s.id || '?')
          return acc
        }
        acc.push({ collapsed: false, ...s, x, y, width, height })
        return acc
      }, [])

      this.tunnels = Array.isArray(data.tunnels) ? data.tunnels.map((t) => ({ phase: '', ...t })) : []

      this.nodes = (Array.isArray(data.nodes) ? data.nodes : []).reduce((acc, n) => {
        const x = toFiniteNumber(n.x)
        const y = toFiniteNumber(n.y)
        if (x === undefined || y === undefined) {
          dropped.droppedNodes.push(n.label || n.id || '?')
          return acc
        }
        acc.push({
          rackId: null,
          rackUnit: null,
          rackSpan: rackSpanByType(n.type),
          interfaces: [],
          siteId: null,
          exposedPorts: [],
          zoneId: null,
          ...n,
          x,
          y,
        })
        return acc
      }, [])

      this.links = Array.isArray(data.links)
        ? data.links.map((l) => ({ vlanId: null, waypoints: [], sourcePort: '', targetPort: '', busId: null, ...l }))
        : []
      this.buses = Array.isArray(data.buses) ? data.buses : []

      this.zones = (Array.isArray(data.zones) ? data.zones : []).reduce((acc, z) => {
        const x = toFiniteNumber(z.x)
        const y = toFiniteNumber(z.y)
        const width = toFiniteNumber(z.width)
        const height = toFiniteNumber(z.height)
        if ([x, y, width, height].some((v) => v === undefined)) {
          dropped.droppedZones.push(z.name || z.id || '?')
          return acc
        }
        acc.push({ subnet: '', siteId: null, ...z, x, y, width, height })
        return acc
      }, [])

      this.selectedIds = []
      this.linkingFromId = null

      // Anti-orphelin : un siteId qui ne pointe vers aucun site chargé est nettoyé,
      // plutôt que de laisser un rattachement invisible et incohérent.
      const siteIds = new Set(this.sites.map((s) => s.id))
      for (const node of this.nodes) if (node.siteId && !siteIds.has(node.siteId)) node.siteId = null
      for (const zone of this.zones) if (zone.siteId && !siteIds.has(zone.siteId)) zone.siteId = null
      for (const rack of this.racks) if (rack.siteId && !siteIds.has(rack.siteId)) rack.siteId = null

      // Anti-orphelin (bus) : un hub absent, ou un bus tombé sous 2 câbles
      // membres (fichier édité à la main), ne doit pas laisser de busId
      // pointant dans le vide.
      const nodeIds = new Set(this.nodes.map((n) => n.id))
      this.buses = this.buses.filter(
        (b) => nodeIds.has(b.hubId) && this.links.filter((l) => l.busId === b.id).length >= 2,
      )
      const busIds = new Set(this.buses.map((b) => b.id))
      for (const link of this.links) if (link.busId && !busIds.has(link.busId)) link.busId = null

      bumpIdCounterFrom([
        this.nodes,
        this.links,
        this.zones,
        this.racks,
        this.vlans,
        this.sites,
        this.tunnels,
        this.buses,
        this.nodes.flatMap((n) => n.interfaces),
        this.nodes.flatMap((n) => n.exposedPorts),
      ])

      return dropped
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
