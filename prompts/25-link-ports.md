# Prompt U — Ports de branchement sur les câbles

Dans le projet plans réseau, ajoute la notion de port physique de branchement sur les liens (câbles).

- Un lien porte deux champs optionnels : sourcePort et targetPort (ex. « port 12 », « GE0/1 » — texte libre pour rester souple).
- Édition dans le panneau de propriétés quand un câble est sélectionné : je saisis le port côté source et côté cible.
- Ces ports n'apparaissent PAS sur le tracé du câble dans le canvas (ça surchargerait). Ils sont visibles seulement dans le panneau de propriétés à l'écran.
- Inclure sourcePort/targetPort dans l'export/import JSON. Un lien sans ces champs reste valide (compatibilité ascendante).

Ne confonds pas ces ports physiques avec les interfaces IP (qui sont sur le nœud) ni avec les ports exposés du firewall (règles NAT) : ce sont trois notions distinctes. Montre-moi où tu ajoutes les champs avant de coder.
