# Prompt E — VLANs (prérequis des câbles taggés)

Dans le projet plans réseau, introduis la notion de VLAN comme entité de première classe, réutilisable dans tout le plan.

- Un VLAN a : un id/numéro, un nom, une couleur.
- Une liste de VLANs gérable dans l'interface (créer, renommer, changer la couleur, supprimer).
- Stocke les VLANs dans le plan et inclus-les dans l'export/import JSON et la sauvegarde locale.

C'est la base pour taguer les câbles et les zones ensuite. Ne casse pas le modèle existant. Montre-moi la structure de données des VLANs avant de coder.
