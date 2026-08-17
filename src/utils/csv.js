import { downloadText } from './download'

function csvEscape(value) {
  const s = String(value ?? '')
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Table de câblage exhaustive (contrairement au récap synthétique du PNG,
// une ligne par câble ici, sans omission) : équipement/port de chaque côté,
// VLAN, label.
export function exportCablingCsv(links, nodes, vlans, filename) {
  const header = ['Équipement source', 'Port source', 'Équipement cible', 'Port cible', 'VLAN', 'Label']
  const rows = links.map((l) => {
    const source = nodes.find((n) => n.id === l.sourceId)?.label ?? '?'
    const target = nodes.find((n) => n.id === l.targetId)?.label ?? '?'
    const vlan = vlans.find((v) => v.id === l.vlanId)
    return [
      source,
      l.sourcePort || '',
      target,
      l.targetPort || '',
      vlan ? `${vlan.number} - ${vlan.name}` : '',
      l.label || '',
    ]
  })
  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n')
  downloadText(csv, filename, 'text/csv;charset=utf-8')
}
