# Otto — site

Site de présentation d'Otto (ex-Powii), recherche en vie artificielle. Statique, sans dépendance, en anglais.

```bash
npm start   # http://localhost:4173
npm test    # rejoue 769 exécutions enregistrées dans le moteur de la page
```

## Où changer quoi

- `data/map.js` : objectifs, liens, tests, escalier des onze questions, visite « Show the way up ».
- `data/results.js` : données mesurées, générées. Ne pas modifier à la main :
  `python3 tools/build_data.py /chemin/vers/Powii`
- `js/world.js` : portage du monde E0 (anneau, loi de majorité, SplitMix64), contrôlé par `tests/replay.mjs`.
- `js/hero.js` anneau vivant · `js/play.js` boîte, escalier, boucle · `js/map.js` carte · `js/results.js` expositions.
- `css/style.css` : vert `#7BC943` et bleu `#5EC3EE` du logo, fond blanc.

## Sources

Dépôt privé Powii, branche `research/g02-semantic-identifiability-v1` (G02-MEASUREMENT-V1 n'est pas dans `main`), état au 2 octobre 2026 : `research/problem_graph/`, `docs/results/`, `docs/specifications/POWII_V5.md`.

Règle du site : une cellule verte exige un résultat enregistré, et chaque résultat garde sa limite à côté.

Polices : Bagel Fat One et Jost (OFL, licences dans `assets/fonts/`).
