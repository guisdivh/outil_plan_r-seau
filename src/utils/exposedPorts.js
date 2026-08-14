// Types d'équipement sur lesquels l'UI des ports exposés s'affiche (firewall,
// et routeurs faisant du NAT). Le champ exposedPorts reste présent sur tous
// les nœuds (comme interfaces), mais n'est exploité que pour ces types.
export const EXPOSED_PORT_TYPES = ['firewall', 'router']

export function canExposePorts(node) {
  return EXPOSED_PORT_TYPES.includes(node.type)
}

export function parseWhitelist(text) {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function formatWhitelist(rule) {
  return rule.whitelist.join(', ')
}

// Résumé compact pour le tooltip (survol) du badge canvas.
export function summarizeRule(rule) {
  const status = rule.status === 'active' ? '' : ' (inactif)'
  const alias = rule.alias || 'sans alias'
  return `${alias} — ${rule.protocol.toUpperCase()} ${rule.port ?? '?'} → ${rule.destinationIp || '?'}:${rule.destinationPort ?? '?'}${status}`
}
