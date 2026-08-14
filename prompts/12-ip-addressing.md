# Prompt I — Adressage IP structuré (multi-IP par équipement)

Dans le projet plans réseau, structure l'adressage IP des équipements.

- Un équipement peut porter plusieurs interfaces, chacune avec : un rôle (LAN / WAN / publique / management…), une adresse IP, un masque (CIDR ou masque décimal), et un VLAN optionnel (parmi ceux définis).
- Édition via le panneau de propriétés (prompt H).
- Affichage optionnel des IP sur le canvas, à côté de l'équipement (activable/désactivable pour ne pas surcharger le plan).
- Inclure tout ça dans l'export/import JSON et la sauvegarde, sans casser les plans existants (un équipement sans IP reste valide).

Montre-moi la structure de données des interfaces avant de coder. Fais attention à la compatibilité ascendante : les anciens plans n'ont pas ce champ.
