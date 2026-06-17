# 🧭 GUIDE DE REPRISE — Créer un nouveau circuit (Portugal)

> À lire en premier à ton retour. Ce document part du principe que tu as TOUT
> oublié. Il te fait construire le circuit Portugal pas à pas, en réutilisant
> le système Nîmes→Nice déjà en place.
> 
> Dépôt : `yunimes/circuits` · Live : `https://yunimes.github.io/circuits/`

-----

## 0. Démarrer la conversation avec Claude (2 min)

1. Ouvre une nouvelle conversation Claude.
1. Active le **connecteur GitHub** : bouton « + » → « Add from GitHub » →
   sélectionne le dépôt `circuits`. (Si jamais indisponible, colle plutôt les
   fichiers `PROJET.md` et ce guide.)
1. Premier message type :

> « Je reprends mon outil de feuilles de route (dépôt circuits). Le système
> Nîmes→Nice est en place. Je veux créer un NOUVEAU circuit : Portugal.
> Lis PROJET.md et GUIDE-NOUVEAU-CIRCUIT.md pour le contexte, puis aide-moi. »

Claude aura alors tout le contexte sans que tu réexpliques.

-----

## 1. Rappel express : comment marche le système

**Principe :** le contenu réutilisable vit dans des fichiers autonomes,
référencés par `id`. Un « jour » ne fait qu’ASSEMBLER ces fichiers en ajoutant
l’horaire et les durées.

```
data/
├── sites/         ← lieux de visite          (réutilisables)
├── hebergements/  ← où on dort                (réutilisables)
├── restaurants/   ← où on mange               (réutilisables)
├── parcours/      ← roadtrips avec arrêts      (réutilisables, extrémités modulables)
├── recits/        ← modules narratifs          (réutilisables)
├── guides/        ← guides oraux en .md         (réutilisables)
└── circuits/
    ├── 2026-0618/  ← circuit Nîmes→Nice (existant)
    └── AAAA-MMJJ/  ← TON NOUVEAU CIRCUIT PORTUGAL (à créer)
```

**Règle d’or n°1 :** `id` = nom de fichier (sans extension), minuscules, tirets,
sans accents. Ex. `"id": "porto"` → `data/sites/porto.json` et son guide
`data/guides/porto.md`.

**Règle d’or n°2 :** fidélité absolue à tes feuilles de route source. Ne jamais
condenser/reformuler. Reprendre le texte tel quel.

**Règle d’or n°3 :** après chaque déploiement, si rien ne change → vider le cache
Safari AVANT de chercher un bug.

-----

## 2. Ce que tu RÉUTILISES vs ce que tu CRÉES pour le Portugal

Le moteur (`app.js`, `style.css`, `index.html`, `jour.html`, `guide.html`) est
**générique** : il marche pour n’importe quel pays, tu n’y touches pas.

Pour le Portugal, tu crées seulement du CONTENU :

|À créer                |Où                        |Note                                               |
|-----------------------|--------------------------|---------------------------------------------------|
|1 dossier circuit      |`data/circuits/AAAA-MMJJ/`|date de départ du circuit Portugal                 |
|`circuit.json`         |dans ce dossier           |dashboard (logistique, résa, hébergements, alertes)|
|`J1.json … Jn.json`    |dans ce dossier           |un fichier par jour                                |
|Sites portugais        |`data/sites/`             |porto.json, lisbonne.json, sintra.json…            |
|Hébergements           |`data/hebergements/`      |                                                   |
|Restaurants            |`data/restaurants/`       |                                                   |
|Parcours (si roadtrips)|`data/parcours/`          |extrémités modulables                              |
|Récits                 |`data/recits/`            |tes histoires/anecdotes                            |
|Guides oraux           |`data/guides/`            |.md, copiés d’Obsidian                             |

⚠️ **Rien de la France n’est touché.** Les deux circuits coexistent. Le dashboard
de chaque circuit lit son propre `circuit.json`.

-----

## 3. Méthode de travail recommandée (la plus efficace)

C’est l’ordre qui a le mieux marché pour Nîmes→Nice :

**Étape A — Prépare tes feuilles de route dans Obsidian** (comme d’habitude).
C’est ta source. Garde la même structure de callouts qu’avant.

**Étape B — Migre les guides oraux en premier.** Copie chaque guide Obsidian en
`.md` brut dans `data/guides/` (titre `#`, sections `##`, sous-titres `###`).
C’est indépendant et rapide.

**Étape C — Demande à Claude de construire jour par jour.** Donne-lui une feuille
de route (J1 Portugal), il génère : les sites, récits, restaurants, hébergements
ET le Jn.json. Il te livre les fichiers à déployer. Tu valides la FIDÉLITÉ avant
de déployer (préviews).

**Étape D — Le dashboard en dernier** (circuit.json), une fois les jours connus.

**Étape E — Déploie sur GitHub** (Add file / edit), vide le cache, teste.

-----

## 4. Structures de référence (copier-coller)

### Un SITE à visiter (boucle pédestre)

```json
{
  "id": "porto",
  "nom": "Porto",
  "guide": { "nom": "Guide Porto", "id": "porto" },
  "parkings": [ { "nom": "...", "maps": "https://..." } ],
  "boucle": {
    "distance_m": 1500, "marche_min": 25, "itineraire_maps": "https://...",
    "points": [
      {
        "nom": "...", "emoji": "🏛️", "maps": "https://...",
        "aide_memoire": ["ligne courte terrain"],
        "texte_original": "texte long (mode Révision). Markdown OK : ## titres.",
        "photo": "📸 ...",
        "recits": ["id-recit"]
      }
    ]
  }
}
```

### Un SITE à points simples (pas de boucle fermée)

Remplace `"boucle": {...}` par `"points": [ {…}, {…} ]` directement.
(Un lieu à un seul point = `"points": [ {…} ]` — toujours un TABLEAU `points`.)

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
{ "heure": "17h00", "type": "courses", "titre": "🛒 ...", "segments": ["🚗 ...", "🛒 ..."], "note_pratique": {...} }
```

⚠️ **Le piège n°1 (vécu) :** pour un roadtrip, le créneau doit avoir
`"parcours": "id"` — PAS un `"titre"` + `"arrets"` inline. Sinon les arrêts ne
s’affichent pas. Le contenu des arrêts vit dans le fichier `parcours/`, le
créneau ne fait que le RÉFÉRENCER avec depart/arrivee/durées.

-----

## 5. Déploiement sur GitHub (rappel)

- **Créer un fichier :** Add file → Create new file → taper le chemin complet
  (ex. `data/sites/porto.json`) → coller → Commit.
- **Modifier :** ouvrir le fichier → crayon ✏️ → éditer → Commit.
- **Le dossier se crée** en tapant le chemin avec des `/`.
- **Après déploiement :** vider le cache Safari, recharger.
- **Si un parcours est vide :** ajouter `&debug=1` à l’URL
  (ex. `jour.html?j=J1&debug=1`) → le moteur affiche le diagnostic.

-----

## 6. Check-list de fidélité (avant de déployer un jour)

- [ ] Tous les textes des feuilles source sont présents, non condensés
- [ ] Les callouts `[!warning]` de tête de journée → `warnings[]` (pas dans un créneau)
- [ ] Les consignes logistiques attachées au bon segment précis
- [ ] Les sous-horaires exacts respectés
- [ ] Les liens Maps vérifiés
- [ ] `id` des guides = noms réels des fichiers `.md`
- [ ] Les roadtrips référencés par `"parcours": "id"` (piège n°1)

-----

## 7. Si quelque chose ne marche pas

1. Vider le cache Safari (80% des cas).
1. Vérifier que `app.js` ET les JSON sont cohérents et déployés.
1. Ouvrir le JSON directement par son URL
   (`yunimes.github.io/circuits/data/.../fichier.json`) pour vérifier qu’il est
   bien servi.
1. Ajouter `&debug=1` à l’URL du jour pour voir les diagnostics de parcours.
1. Demander à Claude en lui donnant : l’URL, ce que tu vois, le fichier concerné.

-----

Bon circuit en Provence — et bonne construction du Portugal à ton retour.
Tout est déjà en place ; tu n’as qu’à ajouter du contenu. 🇵🇹