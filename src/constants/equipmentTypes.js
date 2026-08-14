// Catalogue des types d'équipements affichables dans la palette et sur le canvas.
// rackSpan : nombre d'U occupées par défaut quand l'équipement est monté en baie.
export const EQUIPMENT_TYPES = [
  { type: 'router', label: 'Routeur', icon: 'IconRouter', rackSpan: 1 },
  { type: 'switch', label: 'Switch', icon: 'IconSwitch', rackSpan: 1 },
  { type: 'firewall', label: 'Firewall', icon: 'IconFirewall', rackSpan: 1 },
  { type: 'ap', label: 'Point d’accès', icon: 'IconAccessPoint', rackSpan: 1 },
  { type: 'server', label: 'Serveur', icon: 'IconServer', rackSpan: 2 },
  { type: 'pc', label: 'Poste', icon: 'IconWorkstation', rackSpan: 1 },
  { type: 'iot', label: 'IoT', icon: 'IconIot', rackSpan: 1 },
]

export const NODE_SIZE = 56

export function equipmentByType(type) {
  return EQUIPMENT_TYPES.find((e) => e.type === type)
}

export function rackSpanByType(type) {
  return equipmentByType(type)?.rackSpan ?? 1
}
