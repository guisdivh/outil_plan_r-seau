// Catalogue des types d'équipements affichables dans la palette et sur le canvas.
export const EQUIPMENT_TYPES = [
  { type: 'router', label: 'Routeur', icon: 'IconRouter' },
  { type: 'switch', label: 'Switch', icon: 'IconSwitch' },
  { type: 'firewall', label: 'Firewall', icon: 'IconFirewall' },
  { type: 'ap', label: 'Point d’accès', icon: 'IconAccessPoint' },
  { type: 'server', label: 'Serveur', icon: 'IconServer' },
  { type: 'pc', label: 'Poste', icon: 'IconWorkstation' },
  { type: 'iot', label: 'IoT', icon: 'IconIot' },
]

export const NODE_SIZE = 56

export function equipmentByType(type) {
  return EQUIPMENT_TYPES.find((e) => e.type === type)
}
