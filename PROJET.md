# PROJET — Application feuilles de route guide touristique

> Document de reprise (état du système). À garder dans le dépôt et lire au début
> de chaque nouvelle conversation, avec GUIDE-NOUVEAU-CIRCUIT.md.

## Vue d’ensemble

Application web statique de consultation de feuilles de route, pour un guide
touristique en circuit. Usage terrain sur mobile. Hébergée sur GitHub Pages.

- Dépôt : `yunimes/circuits`
- Live : `https://yunimes.github.io/circuits/`
- Atelier de préparation des contenus : Obsidian (iPhone)
- Déploiement : interface web GitHub (Add file / edit / delete)

## Principe fondateur

Séparation **contenu / présentation / assemblage**. Tout contenu réutilisable
(sites, hébergements, restaurants, parcours, récits, guides) vit dans des
fichiers autonomes, référencés par `id`. Un circuit (un jour) ne fait
qu’**assembler** ces entités en y ajoutant le variable (horaires, durées,
départ/arrivée). Une entité écrite une fois ressert sur tout autre circuit.

## Architecture des fichiers

```
circuits/  (racine du dépôt)
├── index.html        ← Dashboard : métadonnées circuit + accès aux jours
├── jour.html?j=JX    ← Moteur : affiche une feuille de jour  (charge marked.js puis app.js)
├── guide.html?id=X   ← Affiche un guide (Markdown → sections repliables)
├── app.js            ← Moteur de rendu (générique, ne dépend d'aucun pays)
├── style.css         ← Palette terreuse Provence + bloc warning de jour
└── data/
    ├── sites/         ← Lieux de visite (boucle, ou points[])
    ├── hebergements/  ← Où on dort
    ├── restaurants/   ← Où on mange
    ├── parcours/      ← Roadtrips réutilisables, extrémités modulables
    ├── recits/        ← Modules narratifs réutilisables
    ├── guides/        ← Guides oraux en Markdown brut (.md)
    └── circuits/
        └── AAAA-MMJJ/  ← un dossier par circuit
            ├── circuit.json  ← données dashboard
            └── J1..Jn.json   ← assemblage de chaque jour
```

Plusieurs circuits coexistent : chaque dossier sous `circuits/` est indépendant.
Le circuit Nîmes→Nice (`2026-0618/`) est complet. Un nouveau circuit = un
nouveau dossier, sans toucher au reste.

## Règles & conventions (IMPORTANT)

1. **id = nom de fichier** (sans extension), minuscules, tirets, sans accents.
   `"id": "porto"` → `data/sites/porto.json`, guide → `data/guides/porto.md`.
1. **FIDÉLITÉ AU SOURCE — non négociable.** Ne jamais condenser/omettre/
   reformuler les feuilles de route. Respecter l’intention structurelle
   (ex. un `[!warning]` de tête de journée = bloc `warnings[]` AVANT les
   créneaux, pas une note de créneau ; une consigne logistique s’attache au
   segment précis concerné).
1. **Cache Safari** : après déploiement, si rien ne change → vider le cache
   AVANT de chercher un bug. Cause n°1 des faux problèmes.
1. **fetch() = GitHub Pages only.** Ouvrir les fichiers en local échoue : normal.

## STRUCTURE UNIFIÉE « points » (évolution importante)

Tout lieu/arrêt visitable est désormais dans un tableau **`points`**, partout :

- Site à lieu unique  → `"points": [ {…} ]`
- Site à plusieurs lieux → `"points": [ …, … ]`
- Boucle pédestre → `"boucle": { "points": [ … ] }`
- Parcours (roadtrip) → `"points": [ … ]`  (anciennement `arrets`, supprimé)

Le champ `arrets` et le `point` singulier n’existent plus. Cette unification
permet d’écrire des scripts de traitement génériques (un seul chemin d’accès aux
contenus). Pour de NOUVEAUX fichiers, toujours `points: [...]`.

## CONTENU DES TEXTES

- `aide_memoire` : condensé terrain. Tableau de lignes (`["...", "..."]`).
- `texte_original` : version longue (mode Révision). Accepte une **chaîne**
  (recommandé pour les longs textes) avec Markdown (`## titres`, paragraphes,
  `\n`). Rendu via `parseMarkdown()` (bibliothèque marked.js, chargée dans
  jour.html et guide.html). Peut aussi être un tableau.
- `recits[]` : liste d’`id` de récits (fichiers `data/recits/`).
- Les URL `https://…` dans aide_memoire / segments / warnings deviennent
  automatiquement des boutons 🗺️ cliquables (fonction `autolink`).

## Types de créneaux (dans les Jn.json)

`boucle` (site + boucle pédestre) · `visite` (site + points) · `trajet`
(déplacement seul) · `repas` (restaurant par id OU objet inline) ·
`degustation` · `courses` (segments[] + note_pratique optionnelle ; emoji du
titre respecté s’il est déjà présent) · `checkin` (étape simple) · `portion`
(roadtrip : `"parcours": "id"` + depart/arrivee/durées, OU points inline).

Fonctionnalités moteur : note_pratique (singulier) + notes_pratiques (pluriel) ;
option (encart) ; récits dans les points de parcours ; warnings de jour ;
hébergement enrichi (aide_memoire + texte_original + récits + guide) ;
en-tête de parcours départ→arrivée avec bouton itinéraire.

## MODE DEBUG

Ajouter `?debug=1` (ou `&debug=1`) à l’URL d’un jour
(ex. `jour.html?j=J1&debug=1`) affiche des diagnostics dans les créneaux
`portion` : « DEBUG: X points · parcours=… » en vert, ou « ERREUR: … » en rouge.
Invisible sans le paramètre. Pratique pour diagnostiquer un parcours vide.

## PIÈGES VÉCUS (à ne pas refaire)

- **Roadtrip vide** : un créneau roadtrip DOIT être `{"type":"portion", "parcours":"id", "depart":..., "arrivee":..., "duree":...}`. S’il a un
  `"titre"` + `"arrets"`/`"points"` inline et PAS de `"parcours"`, le moteur ne
  charge jamais le fichier parcours → arrêts vides. (Vécu sur J1 Camargue.)
- **Désynchro app.js / données** : si on renomme une clé (ex. arrets→points),
  déployer le code ET les données ensemble, sinon rendu vide.
- **J6 condensé** : sur les journées denses, risque de reformuler le source.
  Toujours revérifier la fidélité avant de déployer.
- **Guide introuvable** : l’`id` du guide doit matcher exactement le nom du
  fichier `.md`. Si on sépare/renomme un guide, mettre à jour les références.

## Correspondance callouts Obsidian → système

|Source Obsidian              |Système                                      |
|-----------------------------|---------------------------------------------|
|`[!abstract]` résumé jour    |`abstract[]` du Jn.json                      |
|`[!warning]` tête de journée |`warnings[]` du Jn.json (bloc avant créneaux)|
|`[!success]` hébergement     |`hebergement` (réf id)                       |
|`[!example]-` boucle/parcours|type `boucle` / `portion`                    |
|`[!tip]-` guide oral         |`recits[]` ou guide .md                      |
|`[!info]-` resto             |`restaurants/`                               |
|`[!note]-` point isolé       |point dans site, ou note_pratique            |

## État d’avancement

- Système complet et déployé : dashboard, moteur jour, moteur guide, palette.
- Circuit Nîmes→Nice (`2026-0618/`) : 6 jours (J1–J6) migrés et fonctionnels.
- Structure `points` unifiée appliquée. parseMarkdown + autolink + mode debug
  en place.
- Reste (confort) : finir de remplir les `texte_original` ; affiner l’UI/palette
  (reporté) ; vérifier/compléter certains liens Maps.

## Pour reprendre

- Activer le **connecteur GitHub** (bouton + → Add from GitHub → dépôt circuits)
  pour repartir sur l’état réel des fichiers.
- Pour créer un NOUVEAU circuit (ex. Portugal), suivre
  **GUIDE-NOUVEAU-CIRCUIT.md**.