# Otto — site

Site d'Otto (ex-Powii), recherche en vie artificielle. Statique, sans dépendance, en anglais (mentions légales et confidentialité aussi en français).

```bash
npm start         # http://localhost:4173, reconstruit à chaque modification
npm test          # 769 exécutions rejouées + contrôle de toutes les pages
npm run build     # version brouillon dans dist/ (noindex tant qu'il n'y a pas d'URL)
npm run preview   # version en ligne provisoire (GitHub Pages, branche gh-pages), noindex
npm run release   # version à publier ; refuse s'il manque l'URL ou une mention légale
npm run deploy    # teste, construit et prépare le commit gh-pages par-dessus le précédent (n'envoie rien sans -- --push)
npm run rollback  # prépare le retour à la version publiée d'avant
npm run check-live # quelques lectures du site public
```

## Avant la mise en ligne

Remplir `site.config.json` : `url`, `legal.siret`, `legal.address`. Retirer `person.upcoming` quand lonjarethadrien.com répond : le lien revient. Puis `npm run release` et publier `dist/`.
Tant qu'une mention manque, toutes les pages restent en noindex, même avec une URL. L'URL active canonical, sitemap, robots ouverts, données structurées absolues et liens de `llms.txt`.
GitHub Pages n'envoie aucun en-tête réglable : la CSP et la politique de référent sont dans des balises meta. `.well-known/security.txt` est sous le chemin du projet ; renouveler `securityExpires` chaque année (le test échoue 30 jours avant).

## Où changer quoi

- `src/pages/*.html` : une page par fichier, l'en-tête JSON donne titre, description et chemin.
- `src/data/` : `map.js` (objectifs, liens, tests, escalier), `protocols.js` (fiches techniques), `faq.js` (questions, glossaire), `box.js`, `lookalikes.js`.
- `src/data/results.js` : données mesurées, générées par `python3 tools/build_data.py /chemin/vers/Powii`. Ne pas modifier à la main.
- `src/js/` : un module par partie, chargé seulement sur les pages concernées. `prefs.js` : menu Display (détail, mouvement, lettres).
- `tools/build.mjs` : gabarit, métadonnées, JSON-LD, sitemap, `llms.txt`, `llms-full.txt`, CSV.
- Vert `#7BC943` et bleu `#5EC3EE` du logo ; `--green-d` et `--blue-d` là où la couleur porte une information (contraste).

« Upcoming / À venir » : prévu, pas prêt ou pas démontré ; jamais une promesse. Un fait légal absent s'affiche ainsi et garde tout le site en noindex.

Règles du site : une cellule verte exige un résultat enregistré, chaque résultat garde sa limite à côté, rien n'est affirmé au-delà du registre.

## Sources

Dépôt privé Powii, branche `research/g02-semantic-identifiability-v1` (G02-MEASUREMENT-V1 n'est pas dans `main`), état au 2 octobre 2026.

## Police Otto Cells

Dessinée en code : `python3 tools/font/build.py` (versions dans `tools/font/requirements.txt`) écrit `src/assets/fonts/otto-cells-vf.woff2`.
Axes : `wght` 400-700, `FACE` (0 par défaut, 1 = visages), `BLKA/B/C` (paupières), `GAZX/GAZY` (regard), `MOOD` (humeur). Classe `.alive` sur le site.

Texte courant : Jost (OFL, licence dans `src/assets/fonts/`).
