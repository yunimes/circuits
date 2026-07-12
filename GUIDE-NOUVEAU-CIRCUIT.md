# 🧭 GUIDE DE REPRISE — Créer un nouveau circuit

> À lire en premier à ton retour. Ce document part du principe que tu as TOUT
> oublié. Il te fait construire un nouveau circuit pas à pas, en réutilisant
> le système déjà en place.
>
> Dépôt : `yunimes/circuits` · Live : `https://yunimes.github.io/circuits/accueil.html`

-----

## 0. Démarrer la conversation avec Claude (2 min)

1. Ouvre une nouvelle conversation Claude.
2. Colle le contenu de **`PROJET.md`** (dossier `Doc_projet/`) en début de message.
   C'est le document de reprise principal — il contient tout le contexte.
3. Premier message type :

> « Je reprends mon outil de feuilles de route (dépôt circuits). Lis ce
> PROJET.md, puis aide-moi à créer un nouveau circuit : [destination]. »

Claude aura alors tout le contexte sans que tu réexpliques.

> **Note :** Le **connecteur GitHub** (bouton « + » → « Add from GitHub »)
> permet à Claude de lire ton dépôt directement. Utile, mais pas indispensable
> si tu colles PROJET.md. Les deux approches fonctionnent. **PROJET.md reste
> en local Obsidian — pas besoin de l'uploader sur GitHub.**

-----

## 1. Rappel express : comment marche le système

**Principe :** le contenu réutilisable vit dans des fichiers autonomes,
référencés par `id`. Un « jour » ne fait qu’ASSEMBLER ces fichiers en ajoutant
l’horaire et les durées.

```
accueil.html           ← Page d'accueil : liste de tous les circuits
index.html?c=ID        ← Dashboard : métadonnées circuit + accès aux jours
jour.html?j=JX&c=ID   ← Moteur : affiche une feuille de jour
data/
├── circuits.json  ← Index de tous les circuits (liste pour accueil.html)
├── sites/         ← lieux de visite          (réutilisables)
├── hebergements/  ← où on dort                (réutilisables)
├── restaurants/   ← où on mange               (réutilisables)
├── parcours/      ← roadtrips avec arrêts      (réutilisables, extrémités modulables)
├── recits/        ← modules narratifs          (réutilisables)
├── guides/        ← guides oraux en .md         (réutilisables)
└── circuits/
    ├── 2026-0618/  ← circuit Nîmes→Nice
    ├── 2026-0718/  ← circuit Lisbonne·Porto·Óbidos
    └── AAAA-MMJJ/  ← TON NOUVEAU CIRCUIT (à créer)
```

**Règle d’or n°1 :** `id` = nom de fichier (sans extension), minuscules, tirets,
sans accents. Ex. `"id": "porto"` → `data/sites/porto.json` et son guide
`data/guides/porto.md`.

**Règle d’or n°2 :** fidélité absolue à tes feuilles de route source. Ne jamais
condenser/reformuler. Reprendre le texte tel quel.

**Règle d’or n°3 :** après chaque déploiement, si rien ne change → vider le cache
Safari AVANT de chercher un bug.

-----

## 2. Ce que tu RÉUTILISES vs ce que tu CRÉES pour un nouveau circuit

Le moteur (`app.js`, `style.css`, `accueil.html`, `index.html`, `jour.html`,
`guide.html`) est **générique** : il marche pour n’importe quel pays,
tu n’y touches pas.

Pour chaque nouveau circuit, tu crées seulement du CONTENU :

|À créer / modifier     |Où                        |Note                                               |
|-----------------------|--------------------------|---------------------------------------------------|
|Ajouter une entrée     |`data/circuits.json`      |Une ligne pour que l’accueil affiche le circuit    |
|1 dossier circuit      |`data/circuits/AAAA-MMJJ/`|Date de départ du circuit                          |
|`circuit.json`         |dans ce dossier           |Dashboard (logistique, résa, hébergements, alertes)|
|`J1.json … Jn.json`    |dans ce dossier           |Un fichier par jour                                |
|Sites du pays          |`data/sites/`             |porto.json, lisbonne.json, sintra.json…            |
|Hébergements           |`data/hebergements/`      |                                                   |
|Restaurants            |`data/restaurants/`       |                                                   |
|Parcours (si roadtrips)|`data/parcours/`          |Extrémités modulables                              |
|Récits                 |`data/recits/`            |Tes histoires/anecdotes                            |
|Guides oraux           |`data/guides/`            |.md, copiés d’Obsidian                             |

⚠️ **Rien des autres circuits n’est touché.** Ils coexistent. Le dashboard
de chaque circuit lit son propre `circuit.json`.

-----

## 3. Méthode de travail recommandée (la plus efficace)

**Étape A — Prépare tes feuilles de route dans Obsidian** (comme d’habitude).
C’est ta source. Garde la même structure de callouts qu’avant.

**Étape B — Migre les guides oraux en premier.** Copie chaque guide Obsidian en
`.md` brut dans `data/guides/` (titre `#`, sections `##`, sous-titres `###`).
C’est indépendant et rapide.

**Étape C — Demande à Claude de construire jour par jour.** Donne-lui une feuille
de route (J1), il génère : les sites, récits, restaurants, hébergements ET le
Jn.json. Il te livre les fichiers à déployer. Tu valides la FIDÉLITÉ avant de
déployer (préviews).

**Étape D — Le dashboard en dernier** (`circuit.json`), une fois les jours connus.

**Étape E — Ajoute le circuit à l’accueil.** Édite `data/circuits.json` et ajoute
une entrée pour le nouveau circuit (voir modèle section 4).

**Étape F — Génère les textes coréens** si les notes des sites sont en français.
Voir section 5 « Workflow textes coréens ».

**Étape G — Déploie sur GitHub** (Add file / edit), vide le cache, teste.

-----

## 4. Structures de référence (copier-coller)

### Entrée dans `data/circuits.json` (une ligne par circuit)

```json
{ "id": "2026-XXXX", "emoji": "🇵🇹", "titre": "Lisbonne · Porto · Óbidos", "sous_titre": "Groupe LEE-RYOU · 4p · 18–23 juillet 2026" }
```

### Un SITE à visiter (boucle pédestre)

```json
{
  "id": "porto",
  "nom": "Porto",
  "langue_source": "fr",
  "guide": { "nom": "Guide Porto", "id": "porto" },
  "parkings": [ { "nom": "...", "maps": "https://..." } ],
  "boucle": {
    "distance_m": 1500, "marche_min": 25, "itineraire_maps": "https://...",
    "points": [
      {
        "nom": "...", "emoji": "🏛️", "maps": "https://...",
        "aide_memoire": ["tes notes en français (orientation pour le workflow coréen)"],
        "texte_original": [],
        "photo": "📸 ...",
        "recits": ["id-recit"]
      }
    ]
  }
}
```

> **`langue_source: "fr"`** : ajouter si tes notes sont en français et que tu veux
> générer les textes coréens via `ecrire_aide_memoire.yml` (voir section 5).
> Le workflow le remplace par `"ko"` après traitement.

### Un SITE à points simples (pas de boucle fermée)

Remplace `"boucle": {...}` par `"points": [ {…}, {…} ]` directement.
(Un lieu à un seul point = `"points": [ {…} ]` — toujours un TABLEAU `points`.)

### ⚠️ Piège n°1 (vécu) : `note_pratique` est TOUJOURS un objet

```json
"note_pratique": { "titre": "Billetterie", "lignes": ["Acheter en ligne", "..."] }
```

**JAMAIS une string** `"note_pratique": "texte direct"` — ça produit "undefined" dans l'UI.

### Un RÉCIT

```json
{
  "id": "azulejos", "titre": "🔵 Les azulejos",
  "lignes": ["condensé terrain"],
  "texte_original": "texte long, markdown OK",
  "speak": "🎙️ phrase à dire (optionnel)"
}
```

### Un RESTAURANT

```json
{
  "id": "...", "nom": "...", "maps": "https://...",
  "reservation": { "statut": "Réservé 10p", "heure": "13h00", "tel": "..." },
  "aide_memoire": ["plats, ambiance"],
  "prix_indicatif": "...", "adresse": "..."
}
```

### Un HÉBERGEMENT

```json
{
  "id": "...", "nom": "...", "sous": "Ville · ☎️ ...",
  "maps": "https://...", "parking": "🅿️ ...",
  "guide": { "nom": "Guide ...", "id": "..." },
  "aide_memoire": ["..."], "texte_original": "..."
}
```

### Un PARCOURS (roadtrip réutilisable)

```json
{
  "id": "douro-vallee", "nom": "Vallée du Douro",
  "guide": { "nom": "Guide Douro", "id": "douro" },
  "itineraire_maps": "https://...",
  "points": [
    { "nom": "...", "emoji": "🏁📸", "duree": "20 min · 5km",
      "aide_memoire": ["..."], "texte_original": "...",
      "detail": "🏁 ... · 📸 ...", "trajet_maps": "https://...", "parking_maps": "https://..." }
  ]
}
```

### Un JOUR (assemblage) — `data/circuits/AAAA-MMJJ/J1.json`

```json
{
  "jour": "J1", "date": "...", "titre": "...",
  "obsidian": "obsidian://...",
  "abstract": [
    { "emoji": "🎟️", "texte": "...", "heure_cle": "10h00", "ref": "...", "billet": "obsidian://....pdf" },
    { "emoji": "⚠️", "texte": "consigne importante", "alerte": true }
  ],
  "warnings": [
    { "titre": "Consigne de tête de journée", "lignes": ["...", "lien https://... auto-cliquable"] }
  ],
  "hebergement": "id-hebergement",
  "creneaux": [ ... voir types ci-dessous ... ]
}
```

### Types de créneaux (dans `creneaux[]`)

```json
{ "heure": "09h00", "type": "trajet", "titre": "A → B", "duree": "30 min", "km": 20, "parkings": [...] }
{ "heure": "10h00", "type": "boucle", "site": "porto", "trajet": {"depuis":"...","duree":"...","km":..}, "visite": {"duree":"1h"} }
{ "heure": "12h00", "type": "visite", "site": "...", "visite": {"duree":"50 min"} }
{ "heure": "13h00", "type": "repas", "restaurant": "id-resto", "duree": "1h30" }
{ "heure": "16h00", "type": "portion", "parcours": "douro-vallee", "depart": "Porto", "arrivee": "Pinhão", "duree": "2h", "trajet_duree": "1h10", "trajet_km": 58 }
{ "heure": "18h00", "type": "checkin", "titre": "Check-in · ...", "texte": "...", "duree": "30 min" }
{ "heure": "19h00", "type": "degustation", "titre": "...", "maps": "https://...", "prix": "..." }
{ "heure": "17h00", "type": "courses", "titre": "🛒 ...", "segments": ["🚗 ...", "🛒 ..."], "note_pratique": {"titre":"...","lignes":["..."]} }
```

⚠️ **Piège n°2 :** pour un roadtrip, le créneau doit avoir
`"parcours": "id"` — PAS un `"titre"` + `"arrets"` inline. Sinon les arrêts ne
s’affichent pas. Le contenu des arrêts vit dans le fichier `parcours/`, le
créneau ne fait que le RÉFÉRENCER avec depart/arrivee/durées.

-----

## 5. Workflow : générer les textes coréens (sites en français)

Quand les notes d'un nouveau pays sont en français, utilise le workflow
`ecrire_aide_memoire.yml` pour générer automatiquement `aide_memoire` et
`texte_original` en coréen via Claude.

**Procédure :**

1. Créer les fichiers sites avec `"langue_source": "fr"` au niveau racine.
2. Mettre tes notes françaises dans `aide_memoire[]` (orientation seulement —
   Claude génère du contenu depuis ses propres connaissances, plus riche).
3. Laisser `"texte_original": []`.
4. Uploader les fichiers sur GitHub.
5. Aller dans l'onglet **Actions** du dépôt → `ecrire_aide_memoire.yml` →
   **Run workflow**.

**Ce que fait le workflow :**
- Traite uniquement les fichiers avec `"langue_source": "fr"`
- Génère d'abord un `texte_original` coréen élaboré (source de vérité)
- Extrait l'`aide_memoire` coréen depuis ce `texte_original` (cohérence garantie)
- Marque `"langue_source": "ko"` après traitement (protection anti-re-traitement)
- Les fichiers sans `langue_source: "fr"` (ex. anciens circuits Nîmes) sont marqués « Ignoré » — c'est normal

-----

## 6. Déploiement sur GitHub (rappel)

- **Créer un fichier :** Add file → Create new file → taper le chemin complet
  (ex. `data/sites/porto.json`) → coller → Commit.
- **Modifier :** ouvrir le fichier → crayon ✏️ → éditer → Commit.
- **Le dossier se crée** en tapant le chemin avec des `/`.
- **Après déploiement :** vider le cache Safari, recharger.
- **Si un parcours est vide :** ajouter `&debug=1` à l’URL
  (ex. `jour.html?j=J1&c=2026-0718&debug=1`) → le moteur affiche le diagnostic.
- **PROJET.md** : reste en local Obsidian — pas besoin de l’uploader sur GitHub.

-----

## 7. Check-list de fidélité (avant de déployer un jour)

- [ ] Tous les textes des feuilles source sont présents, non condensés
- [ ] Les callouts `[!warning]` de tête de journée → `warnings[]` (pas dans un créneau)
- [ ] Les consignes logistiques attachées au bon segment précis
- [ ] Les sous-horaires exacts respectés
- [ ] Les liens Maps vérifiés
- [ ] `id` des guides = noms réels des fichiers `.md`
- [ ] Les roadtrips référencés par `"parcours": "id"` (piège n°2)
- [ ] `note_pratique` est un objet `{ titre, lignes[] }` — jamais une string (piège n°1)
- [ ] `data/circuits.json` mis à jour avec le nouveau circuit

-----

## 8. Si quelque chose ne marche pas

1. Vider le cache Safari (80% des cas).
1. Vérifier que `app.js` ET les JSON sont cohérents et déployés.
1. Ouvrir le JSON directement par son URL
   (`yunimes.github.io/circuits/data/.../fichier.json`) pour vérifier qu’il est
   bien servi.
1. Ajouter `&debug=1` à l’URL du jour pour voir les diagnostics de parcours.
1. Demander à Claude en lui donnant : l’URL, ce que tu vois, le fichier concerné.

-----

Bon circuit — et bonne construction du prochain !
Tout est déjà en place ; tu n’as qu’à ajouter du contenu. 🗺️