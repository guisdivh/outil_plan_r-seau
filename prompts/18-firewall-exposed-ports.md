# Prompt O — Ports exposés sur les firewalls (motif E-Logis)

Dans le projet plans réseau, ajoute la notion de ports exposés sur les équipements de type firewall (et routeurs faisant du NAT).

- Un firewall porte une liste de règles d'exposition, chacune avec : un alias (nom lisible, ex. « E-Logis »), le port exposé et son protocole (TCP/UDP), la destination interne (IP + port de redirection / NAT), une liste blanche d'IP autorisées (whitelist, plusieurs IP/plages possibles), un sens (entrant/sortant) et un statut (actif/inactif).
- Édition via le panneau de propriétés quand un firewall est sélectionné.
- Affichage sur le canvas : un badge/compteur discret sur le firewall (ex. « 3 ports »), avec le détail au survol ou au clic. Ne surcharge pas le plan à l'écran.
- À l'export PNG en revanche, les règles doivent apparaître en entier (cohérent avec la vue d'export exhaustive), idéalement en encart/tableau lié au firewall.
- Inclure dans l'export/import JSON et la sauvegarde. Un firewall sans règle reste valide (compatibilité ascendante).

Prends l'exemple réel : alias « E-Logis », port exposé 4345, whitelist d'IP publiques. Montre-moi la structure de données d'une règle avant de coder.
