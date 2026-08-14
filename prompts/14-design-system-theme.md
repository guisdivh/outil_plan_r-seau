# Prompt K — Système de design + thème clair/sombre

Dans le projet plans réseau, pose les fondations visuelles avant de retoucher les composants. Objectif : une interface d'outil technique soignée, pas un template générique.

- Définis un système de design en variables CSS (`:root`) : palette (fonds, surfaces, bordures, texte, accent, états), une échelle d'espacements, des rayons, une typo lisible et un peu caractérisée.
- Deux thèmes, clair et sombre, via un attribut sur `<html>` (ex. `data-theme`), avec un switch dans l'interface. Tout doit passer par les variables, aucune couleur codée en dur dans les composants.
- Ne change aucun comportement ni disposition : c'est un habillage. Le but est esthétique, pas fonctionnel.

Montre-moi d'abord la palette et les tokens (les deux thèmes) avant d'appliquer. Explique comment tu gères le switch.
