# Prompt 1 — Setup + socle du proto

Tu es mon copilote de dev sur un projet perso. Je veux une app web de création de plans réseau, en Vue 3 + Vite. Le cœur est un canvas de dessin manuel : poser des équipements réseau, les relier par des câbles, les regrouper dans des zones/sous-réseaux, puis exporter.

Pour ce premier jet, mets en place le projet et le socle du canvas :

- Structure Vue 3 + Vite propre et évolutive (je veux ajouter des features plus tard).
- Un canvas où je peux poser des nœuds depuis une palette latérale (au moins : routeur, switch, firewall, AP, serveur, poste, IoT — avec une icône ou forme distincte par type).
- Déplacer les nœuds à la souris, les sélectionner, les supprimer.
- Relier deux nœuds par un câble (lien qui suit les nœuds quand on les déplace).
- Recommande la lib de canvas que tu utilises et explique brièvement pourquoi.

Avant de coder, propose-moi l'arborescence de fichiers et le modèle de données (comment tu représentes un nœud, un lien, une zone). J'attends du code propre et commenté. On fera l'export et les zones dans une étape suivante.
