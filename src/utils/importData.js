// Format d'import volontairement simple, en colonnes/clés :
//   id     : identifiant unique dans le fichier (sert juste à résoudre "links")
//   type   : router | switch | firewall | ap | server | pc | iot
//   label  : nom affiché
//   links  : autres id auxquels ce nœud est relié
//
// CSV   : id,type,label,links   (links séparés par "|", ex: "sw-1|sw-2")
// JSON  : tableau d'objets [{ id, type, label, links: [] }]

export function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return []

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idIdx = header.indexOf('id')
  const typeIdx = header.indexOf('type')
  const labelIdx = header.indexOf('label')
  const linksIdx = header.indexOf('links')

  return lines.slice(1).map((line, i) => {
    const cols = line.split(',').map((c) => c.trim())
    const id = idIdx >= 0 && cols[idIdx] ? cols[idIdx] : String(i + 1)
    const label = labelIdx >= 0 && cols[labelIdx] ? cols[labelIdx] : id
    const type = typeIdx >= 0 && cols[typeIdx] ? cols[typeIdx].toLowerCase() : 'pc'
    const links =
      linksIdx >= 0 && cols[linksIdx]
        ? cols[linksIdx].split('|').map((s) => s.trim()).filter(Boolean)
        : []
    return { id, type, label, links }
  })
}

export function parseImportItems(filename, text) {
  if (filename.toLowerCase().endsWith('.json')) {
    const data = JSON.parse(text)
    const items = Array.isArray(data) ? data : data.items
    if (!Array.isArray(items)) {
      throw new Error("Format JSON invalide : attendu un tableau d'objets {id, type, label, links}.")
    }
    return items.map((item, i) => ({
      id: String(item.id ?? i + 1),
      type: String(item.type ?? 'pc').toLowerCase(),
      label: item.label ?? String(item.id ?? item.type ?? 'pc'),
      links: Array.isArray(item.links) ? item.links.map(String) : [],
    }))
  }
  return parseCsv(text)
}
