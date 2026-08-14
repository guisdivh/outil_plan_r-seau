export const INTERFACE_ROLES = [
  { value: 'lan', label: 'LAN' },
  { value: 'wan', label: 'WAN' },
  { value: 'public', label: 'Publique' },
  { value: 'mgmt', label: 'Management' },
]

// Étiquette compacte pour l'affichage sur le canvas : "LAN 192.168.1.10 /24".
export function formatInterface(iface) {
  if (!iface.ip) return null
  return `${iface.role.toUpperCase()} ${iface.ip}${iface.mask ? ' ' + iface.mask : ''}`
}
