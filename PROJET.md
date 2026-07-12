# PROJET — Application feuilles de route guide touristique

> Document de reprise. À uploader / coller au début de chaque nouvelle conversation
> pour redonner tout le contexte du projet.

## Vue d'ensemble

Application web statique de consultation de feuilles de route, pour un guide
touristique en circuit (groupe coréen). Conçue pour usage terrain sur mobile.
Hébergée sur **GitHub Pages**.

- Dépôt : `yunimes/circuits`
- Live : `https://yunimes.github.io/circuits/accueil.html`
- Atelier de préparation des contenus : Obsidian (iPhone)
- Déploiement : via l'interface web GitHub (Add file / edit / delete)

## Principe fondateur

**Séparation contenu / présentation / assemblage.**
Tout contenu réutilisable (lieux, récits, hébergements, restaurants, parcours,
guides) vit dans des fichiers JSON/MD autonomes, **référencés par `id`**.
Un circuit (un jour) ne fait qu'**assembler** ces entités en y ajoutant le
variable (horaires, durées allouées, départ/arrivée).

Avantage : une entité écrite une fois ressert sur tout autre circuit.

## Architecture des fichiers

```
circuits/  (racine du dépôt)
├── accueil.html           ← Page d'accueil : liste de tous les circuits
├── index.html?c=ID        ← Dashboard : métadonnées circuit + accès aux jours
├── jour.html?j=JX&c=ID    ← Moteur : affiche une feuille de jour
├── guide.html?id=X        ← Affiche un guide (Markdown → sections repliables)
├── app.js                 ← Moteur de rendu (NE PAS toucher au contenu)
├── style.css              ← Palette terreuse Provence
└── data/
    ├── circuits.json      ← Index de tous les circuits (liste pour accueil.html)
    ├── sites/             ← Lieux de visite (boucle OU points OU point unique)
    ├── hebergements/      ← Où on dort
    ├── restaurants/       ← Où on mange
    ├── parcours/          ← Roadtrips réutilisables (arrêts), extrémités modulables
    ├── recits/            ← Modules thématiques réutilisables (texte long)
    ├── guides/            ← Guides oraux en Markdown brut (.md)
    ├── circuits/2026-0618/
    │   ├── circuit.json   ← Données dashboard (logistique, résa, héberg, alertes)
    │   └── J1..J6.json    ← Assemblage de chaque jour
    └── circuits/2026-0718/
        ├── circuit.json
        └── J1..J8.json
```

### Ajouter un nouveau circuit à l'accueil

Éditer `data/circuits.json` — ajouter une entrée :
```json
{ "id": "2026-XXXX", "emoji": "🇵🇹", "titre": "...", "sous_titre": "..." }
```

## Règles & conventions (IMPORTANT)

1. **id = nom de fichier** (sans extension). Un guide `"id": "eze"` →
   `data/guides/eze.md`. Un site `"id": "nimes"` → `data/sites/nimes.json`.
   Toujours sans accents ni espaces (tirets à la place).
1. **FIDÉLITÉ AU SOURCE — non négociable.** Ne jamais condenser, omettre ou
   reformuler le contenu des feuilles de route source. Reprendre le texte tel
   quel. (Respecter aussi l'intention structurelle : un callout `[!warning]` de
   tête de journée est un bloc d'avertissement AVANT les créneaux, pas une note
   de créneau.)
1. **Deux modes de lecture** : Terrain (aide-mémoire condensé) / Révision
   (texte_original complet). Les `texte_original` peuvent être :
   - laissés vides `[]` — remplis manuellement par l'utilisateur
   - générés automatiquement via workflow GitHub Actions (voir section Workflows)
1. **note_pratique** dans les fichiers sites : toujours un **objet** `{ "titre": "...", "lignes": [...] }`,
   jamais une string. Une string produit "undefined" dans l'UI.
1. **Livraison des fichiers** : toujours via fichiers téléchargeables
   (copier-coller mobile peu fiable). Ne jamais déployer les `_preview_*.html`
   (ce sont des démos chat avec données en dur, hors architecture).
1. **Cache Safari** : après chaque déploiement, si un changement n'apparaît pas,
   VIDER LE CACHE SAFARI avant de chercher un bug ailleurs. Cause n°1 des
   « ça ne marche pas ».
1. **fetch() = GitHub Pages only.** Ouvrir les fichiers en local échoue
   (« Introuvable ») : c'est normal, le site ne tourne que déployé.

## Types de créneaux (dans les JX.json)

`boucle` (site+boucle pédestre) · `visite` (site+points/point) · `trajet`
(déplacement seul) · `repas` (restaurant par id OU objet inline) ·
`degustation` · `courses` (segments[] + note_pratique optionnelle) · `checkin`
(check-in/out, étape simple) · `portion` (roadtrip : parcours par id +
depart/arrivee/durées, OU arrets inline).

Fonctionnalités moteur : note_pratique (singulier) + notes_pratiques (pluriel) ;
option (encart) ; récits dans les arrêts de portion ; warnings de jour (bloc
avertissement avant les créneaux) ; autolink des URL en boutons 🗺️.

## Callouts source → équivalents système

|Source Obsidian              |Système                                      |
|-----------------------------|---------------------------------------------|
|`[!abstract]` résumé jour    |`abstract[]` du JX.json                      |
|`[!warning]` tête de journée |`warnings[]` du JX.json (bloc avant créneaux)|
|`[!success]` hébergement     |`hebergement` (réf id)                       |
|`[!example]-` boucle/parcours|type `boucle` / `portion`                    |
|`[!tip]-` guide oral         |`recits[]` ou guide .md                      |
|`[!info]-` resto             |`restaurants/`                               |
|`[!note]-` point isolé       |point dans site, ou note_pratique            |

## Workflows GitHub Actions

### `ecrire_text_original.yml`
Génère le `texte_original` coréen depuis l'`aide_memoire` déjà en coréen.
- Traite les points avec `aide_memoire` non vide et `texte_original` vide (Workflow 1 actif)
- Ne touche pas aux sites Nîmes déjà complétés
- Dossiers traités : `sites/`, `recits/`, `parcours/`

### `ecrire_aide_memoire.yml`
Pour les sites dont les notes sont **en français** (nouveau pays/circuit).
- Cible les fichiers avec `"langue_source": "fr"` au niveau racine du JSON
- Appelle Claude depuis ses propres connaissances (notes françaises = orientation seulement)
- Génère en un seul appel : `texte_original` (texte élaboré coréen) + `aide_memoire` (bullets coréens extraits du texte_original)
- Marque `"langue_source": "ko"` après traitement (protection contre re-traitement)
- ⚠️ Utiliser `Buffer.concat(chunks)` pour l'accumulation HTTP — évite la corruption des caractères coréens sur les grandes réponses

**Procédure pour un nouveau circuit (sites en français) :**
1. Créer les fichiers sites avec notes françaises dans `aide_memoire` et `texte_original: []`
2. Ajouter `"langue_source": "fr"` au niveau racine de chaque fichier site
3. Uploader sur GitHub
4. Lancer `ecrire_aide_memoire.yml` via Actions → Run workflow

## État d'avancement

### Circuit Nîmes → Nice · `2026-0618`
- **6 jours migrés** (18–23 juin 2026) : J1 à J6
- **Entités** : 20 sites, 3 hébergements, 6 restaurants, 3 parcours, 39 récits
- **Guides .md** : migrés directement sur GitHub par l'utilisateur

### Circuit Lisbonne · Porto · Óbidos · `2026-0718`
- **8 jours** (17–24 juillet 2026) : J1 à J8 — Groupe LEE-RYOU · 4 personnes
- **12 sites créés** : belem, baixa-chiado, cabo-da-roca, sintra-centre,
  palacio-pena, quinta-regaleira, alfama, nazare, aveiro, porto-historique,
  gaia, obidos
- **4 hébergements** : hotel-lisboa, hotel-praia-nazare, mercure-porto, casa-senhoras-rainhas
- **aide_memoire + texte_original coréens** : générés via `ecrire_aide_memoire.yml`
- **Guides .md à uploader** dans `data/guides/` : lisbonne-1, lisbonne-2,
  sintra, palais-pena, briefing-palacio-pena, quinta-da-regaleira,
  briefing-quinta-regaleira, nazare, porto-1, porto-2, obidos, aveiro, cabo-da-roca

### Navigation multi-circuits
- `accueil.html` : page d'accueil listant tous les circuits via `data/circuits.json`
- Paramètre `?c=ID` dans `index.html` et `jour.html` pour sélectionner le circuit

## Reste à faire

- Vérifier/compléter les liens Maps dans les sites Portugal (certains sont des placeholders)
- Uploader les guides oraux .md Portugal dans `data/guides/`
- Remplir les `texte_original` Nîmes (mode Révision) — à son rythme
- Migrer les guides .md Nîmes restants si pas tous faits

## Pour reprendre dans une nouvelle conversation

Option A — coller ce fichier en début de conversation.
Option B — activer le **connecteur GitHub** dans les réglages de Claude, puis
demander de lire le dépôt `circuits` : Claude repart alors sur l'état réel et
à jour des fichiers.
