// ===== MOTEUR DE RENDU — vue unique (notes visibles, texte complet replié) =====
const DATA_BASE = 'data';
const DEBUG = new URLSearchParams(location.search).get('debug') === '1';

// Grammaire d'emojis par type
const TYPE_EMOJI = {
  trajet: '🚗', boucle: '👣', visite: '👣', portion: '🏁', observation: '🔭',
  parking: '🅿️', repas: '🍽️', hebergement: '🏨', checkin: '🏨',
  courses: '🛒', degustation: '🍷', train: '🚄', vol: '✈️', monument: '🏛️'
};

// Markdown : accepte une chaîne ou l'ancien format tableau
function parseMarkdown(val) {
  if (!val) return '';
  const str = Array.isArray(val) ? val.join('\n') : val;
  return marked.parse(str);
}

// Vrai si une valeur (chaîne ou tableau) contient du texte
function hasContent(v) {
  if (!v) return false;
  if (Array.isArray(v)) return v.some(x => String(x || '').trim().length > 0);
  return String(v).trim().length > 0;
}

async function loadJSON(path) {
  const res = await fetch(`${DATA_BASE}/${path}`);
  if (!res.ok) throw new Error(`Introuvable: ${path}`);
  return res.json();
}
const cache = { sites: {}, recits: {}, hebergements: {}, restaurants: {}, parcours: {} };
async function getSite(id) { if (!cache.sites[id]) cache.sites[id] = await loadJSON(`sites/${id}.json`); return cache.sites[id]; }
async function getRecit(id) { if (!cache.recits[id]) cache.recits[id] = await loadJSON(`recits/${id}.json`); return cache.recits[id]; }
async function getHeberg(id) { if (!cache.hebergements[id]) cache.hebergements[id] = await loadJSON(`hebergements/${id}.json`); return cache.hebergements[id]; }
async function getResto(id) { if (!cache.restaurants[id]) cache.restaurants[id] = await loadJSON(`restaurants/${id}.json`); return cache.restaurants[id]; }

function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
function mapBtn(url) { return url ? `<a class="map-btn" href="${url}">🗺️</a>` : ''; }
function lignesHtml(arr) {
  if (typeof arr === 'string') {
    return `<div class="ligne">${autolink(arr)}</div>`;
  }
  return (arr || []).map(l => `<div class="${l.includes('❗️') ? 'ligne flag' : 'ligne'}">${autolink(l)}</div>`).join('');
}

function autolink(txt) {
  return (txt || '').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:var(--terra);text-decoration:none;font-weight:600">🗺️ Maps</a>');
}

// Pli « Texte complet » : affiché seulement si un texte existe.
// Fermé par défaut ; ouvert d'office quand il n'y a aucune note à côté.
function texteComplet(val, ouvert) {
  if (!hasContent(val)) return '';
  return `<details class="texte-complet"${ouvert ? ' open' : ''}><summary>Texte complet</summary><div class="original">${parseMarkdown(val)}</div></details>`;
}

// ===== Durées =====
function parseDuree(str) {
  if (!str) return 0; let min = 0;
  const h = str.match(/(\d+)\s*h\s*(\d*)/);
  if (h) { min += parseInt(h[1]) * 60; if (h[2]) min += parseInt(h[2]); }
  else { const m = str.match(/(\d+)\s*min/); if (m) min += parseInt(m[1]); }
  return min;
}
function formatDuree(min) { if (min < 60) return `${min} min`; const h = Math.floor(min/60), m = min%60; return m===0 ? `${h}h` : `${h}h${String(m).padStart(2,'0')}`; }
function dureeTotale(c) {
  const t = parseDuree(c.trajet && c.trajet.duree);
  const v = parseDuree(c.visite && c.visite.duree);
  // Visite seule : durée affichée telle qu'écrite (garde « ~ » et les fourchettes)
  if (!t && c.visite && c.visite.duree) return c.visite.duree;
  const tot = t + v;
  return tot > 0 ? formatDuree(tot) : (c.duree || '');
}

// ===== Guides oraux =====
function guideHref(g) { return g.id ? `guide.html?id=${g.id}` : (g.lien || g.obsidian); }
function guideBtns(obj) {
  const liste = obj.guides || (obj.guide ? [obj.guide] : []);
  return liste.map(g => `<a class="btn-obsidian" href="${guideHref(g)}">🎙️ ${g.nom}</a>`).join('');
}
function renderGuides(obj) {
  const btns = guideBtns(obj);
  return btns ? `<div class="guide-oral"><div class="guide-oral-btns">${btns}</div></div>` : '';
}

// ===== Récit =====
function renderRecit(recit, key) {
  const rid = `recit-${key}`;
  const titre = recit.titre ? `<div class="titre-recit">${recit.titre}</div>` : '';
  const aNotes = hasContent(recit.lignes);
  const lignes = aNotes ? lignesHtml(recit.lignes) : '';
  const speak = recit.speak ? `<div class="speak">${recit.speak}</div>` : '';
  return {
    bouton: `<button class="btn-recit" onclick="toggleRecit('${rid}')">${recit.titre || 'Récit'}</button>`,
    bloc: `<div class="recit" id="${rid}">${titre}${lignes}${speak}${texteComplet(recit.texte_original, !aNotes)}</div>`
  };
}

// ===== Point (notes + texte complet replié + récits + guide oral) =====
async function renderPoint(point, key) {
  const aNotes = hasContent(point.aide_memoire);
  const aide = (aNotes || point.photo) ? `<div class="aide">${aNotes ? lignesHtml(point.aide_memoire) : ''}${point.photo ? `<div class="photo">${point.photo}</div>` : ''}</div>` : '';

  let boutons = '', blocs = '';
  if (point.recits && point.recits.length) {
    for (let i = 0; i < point.recits.length; i++) {
      const r = renderRecit(await getRecit(point.recits[i]), `${key}-${i}`);
      boutons += r.bouton; blocs += r.bloc;
    }
  }
  boutons += guideBtns(point);
  const acces = boutons ? `<div class="acces-rangee">${boutons}</div>${blocs}` : '';
  const meta = point.prix ? `<span class="point-meta">· ${point.prix}</span>` : '';
  const billet = point.billet ? `<span class="point-meta">· <a href="${point.billet.obsidian}" style="color:var(--purple);text-decoration:none">📄 Billet</a></span>` : '';

  return `
    <div class="point">
      <div class="point-tete"><span class="point-nom">${point.emoji || ''} ${point.nom}</span>${mapBtn(point.maps)}${meta}${billet}</div>
      ${aide}${texteComplet(point.texte_original, !aNotes)}${acces}
    </div>`;
}

function renderNote(note, key) {
  const nid = `note-${key}`;
  return `<div class="note-pratique"><button class="note-toggle" onclick="toggleNote('${nid}')"><span>${note.titre}</span><span>▼</span></button><div class="note-body" id="${nid}">${lignesHtml(note.lignes)}</div></div>`;
}
function renderNotes(obj, cid) {
  let out = '';
  if (obj.note_pratique) out += renderNote(obj.note_pratique, `${cid}-n0`);
  if (obj.notes_pratiques) obj.notes_pratiques.forEach((n,i)=> out += renderNote(n, `${cid}-n${i+1}`));
  return out;
}

function parkingsHtml(liste) {
  return (liste || []).map(p => `${p.nom} ${mapBtn(p.maps)}`).join(' · ');
}

// Compléments portés par le créneau lui-même (texte, lignes, notes, option)
function extrasCreneau(c, cid) {
  let out = '';
  if (c.texte) out += `<div class="bloc-texte">${autolink(c.texte)}</div>`;
  if (c.maps) out += `<div class="segment">📍 Lieu ${mapBtn(c.maps)}</div>`;
  if (hasContent(c.lignes)) out += `<div class="aide">${lignesHtml(c.lignes)}</div>`;
  out += renderNotes(c, `${cid}-c`);
  if (c.option) out += `<div class="option-bloc">${c.option.texte || c.option}</div>`;
  return out;
}

function billetBar(site) {
  return site.billet ? `<div class="info-bar">🎟️ ${site.billet.ref || 'Réservé'} · <a href="${site.billet.obsidian}">📄 Billet</a></div>` : '';
}

// ===== Créneaux par type =====
async function cr_boucle(c, idx) {
  const site = await getSite(c.site); const cid = `c-${idx}`; const b = site.boucle;
  let segs = '';
  if (c.trajet) { const t = c.trajet; const pk = parkingsHtml(site.parkings); segs += `<div class="segment">🚗 ${t.duree}${t.km?' · '+t.km+'km':''} — ${t.depuis} → ${site.nom}${pk?' · 🅿️ '+pk:''}</div>`; }
  if (c.visite) segs += `<div class="segment">👣 ${c.visite.duree} — Visite</div>`;
  const bar = `<div class="boucle-bar">👣 Boucle pédestre · ${b.marche_min} min · ${b.distance_m}m ${mapBtn(b.itineraire_maps)}</div>`;
  let pts = ''; for (let i=0;i<b.points.length;i++) pts += await renderPoint(b.points[i], `${cid}-${i}`);
  const opt = site.option ? `<div class="option-bloc">${site.option.texte}</div>` : '';
  return wrap(cid, c.heure, site.nom, dureeTotale(c), `${segs}${extrasCreneau(c, cid)}${billetBar(c)}${billetBar(site)}${bar}${pts}${renderNotes(site, cid)}${opt}${renderGuides(site)}`);
}

async function cr_visite(c, idx) {
  const site = await getSite(c.site); const cid = `c-${idx}`;
  let segs = '';
  if (c.trajet) { const t = c.trajet; const pk = parkingsHtml(site.parkings); segs += `<div class="segment">🚗 ${t.duree}${t.km?' · '+t.km+'km':''} — ${t.depuis} → ${site.nom}${pk?' · 🅿️ '+pk:''}</div>`; }
  if (c.visite) segs += `<div class="segment">👣 ${c.visite.duree} — Visite</div>`;
  const liste = Array.isArray(site.points) ? site.points : (site.points ? [site.points] : []);
  let pts = ''; for (let i=0;i<liste.length;i++) pts += await renderPoint(liste[i], `${cid}-${i}`);
  const optV = site.option ? `<div class="option-bloc">${site.option.texte}</div>` : '';
  return wrap(cid, c.heure, c.titre || site.nom, dureeTotale(c), `${segs}${extrasCreneau(c, cid)}${billetBar(c)}${billetBar(site)}${pts}${renderNotes(site, cid)}${optV}${renderGuides(site)}`);
}

async function cr_trajet(c, idx) {
  const cid = `c-${idx}`;
  const emoji = c.emoji || '🚗';
  const pk = parkingsHtml(c.parkings);
  const seg = (c.duree || c.km || pk) ? `<div class="segment">${emoji} ${c.duree||''}${c.km?' · '+c.km+'km':''}${pk?' · 🅿️ '+pk:''}</div>` : '';
  return wrap(cid, c.heure, `${emoji} ${c.titre}`, c.duree||'', `${seg}${extrasCreneau(c, cid)}`);
}

// Étape simple (à pied, stationnement, explications…) : emoji libre
async function cr_etape(c, idx) {
  const cid = `c-${idx}`;
  const emoji = c.emoji || '📍';
  const pk = parkingsHtml(c.parkings);
  const seg = pk ? `<div class="segment">🅿️ ${pk}</div>` : '';
  return wrap(cid, c.heure, `${emoji} ${c.titre}`, c.duree||'', `${seg}${extrasCreneau(c, cid)}`);
}

function restoHtml(r) {
  const tel = r.tel ? `<div class="ligne">☎️ ${r.tel}</div>` : '';
  const aide = `<div class="aide">${lignesHtml(r.aide_memoire)}${tel}${r.prix_indicatif?`<div class="ligne" style="color:var(--orange)">💶 ${r.prix_indicatif}</div>`:''}${r.adresse?`<div class="photo">📍 ${r.adresse}</div>`:''}</div>`;
  const tete = `<div class="point-tete"><span class="point-nom">${r.nom}</span>${mapBtn(r.maps)}</div>`;
  return `<div class="point">${tete}${aide}${texteComplet(r.texte_original, false)}</div>`;
}

async function cr_repas(c, idx) {
  const cid = `c-${idx}`;
  const refs = c.restaurants || [c.restaurant];
  const restos = [];
  for (const r of refs) restos.push(typeof r === 'string' ? await getResto(r) : r);
  const r0 = restos[0] || { nom: c.titre || 'Repas' };
  // Réservation : portée par le créneau (propre au circuit) ou, à défaut, par le restaurant
  const rv = c.reservation || (restos.length === 1 ? r0.reservation : null);
  const resa = rv ? `${rv.statut||''}${rv.heure?' à '+rv.heure:''}${rv.tel?' · ☎️ '+rv.tel:''}` : '';
  // Un seul restaurant : son nom en titre (comme avant) ; plusieurs : titre du créneau
  const titre = (restos.length > 1 && c.titre) ? c.titre : r0.nom;
  return wrap(cid, c.heure, `🍽️ ${titre}`, `${c.duree||''}${resa?' · '+resa:''}`, `${extrasCreneau(c, cid)}${restos.map(restoHtml).join('')}`);
}

async function cr_degustation(c, idx) {
  const cid = `c-${idx}`;
  const prix = c.prix ? `<div class="resa-bar">💶 ${c.prix}</div>` : '';
  const tete = c.maps ? `<div class="point-tete"><span class="point-nom">📍 ${c.titre}</span>${mapBtn(c.maps)}</div>` : '';
  return wrap(cid, c.heure, `🍷 ${c.titre}`, c.duree||'', `${prix}${tete}`);
}

async function cr_courses(c, idx) {
  const cid = `c-${idx}`;
  const segs = (c.segments||[]).map(s=>`<div class="segment">${autolink(s)}</div>`).join('');
  const adr = c.adresse ? `<div class="photo" style="font-size:12px;color:var(--ink-soft);margin-top:6px">📍 ${c.adresse}</div>` : '';
  const note = c.note_pratique ? renderNote(c.note_pratique, `${cid}-note`) : '';
  // Emoji : 🛒 par défaut, sauf si le titre commence déjà par un emoji
  const hasEmoji = /^[\p{Emoji}]/u.test(c.titre||'');
  const titreAff = hasEmoji ? c.titre : `🛒 ${c.titre}`;
  return wrap(cid, c.heure, titreAff, c.duree||'', `${segs}${adr}${note}`);
}

async function cr_checkin(c, idx) {
  const cid = `c-${idx}`;
  const pk = parkingsHtml(c.parkings);
  const seg = pk ? `<div class="segment">🅿️ ${pk}</div>` : '';
  const texte = c.texte ? `<div class="bloc-texte">${autolink(c.texte)}</div>` : '';
  const reste = extrasCreneau(Object.assign({}, c, { texte: null }), cid);
  return wrap(cid, c.heure, `🏨 ${c.titre}`, c.duree||'', `${texte}${seg}${reste}`);
}

// Intertitre dans la liste des créneaux (ex. « Option A »)
async function cr_section(c) {
  const sous = c.texte ? `<div class="section-creneaux-sous">${autolink(c.texte)}</div>` : '';
  return `<div class="section-creneaux"><div class="section-creneaux-titre">${c.titre}</div>${sous}</div>`;
}

async function getParcours(id) { if (!cache.parcours[id]) cache.parcours[id] = await loadJSON(`parcours/${id}.json`); return cache.parcours[id]; }
async function cr_portion(c, idx) {
  const cid = `c-${idx}`;
  try {
    // Parcours réutilisable (par id) OU inline (points dans le circuit)
    let p = c, titre = c.titre, guideSrc = c;
    if (c.parcours) { p = await getParcours(c.parcours); titre = p.nom; guideSrc = p; }
    const points = p.points || [];
    // En-tête départ → arrivée si fournis par le circuit
    let entete = '';
    if (c.depart || c.arrivee) {
      const km = c.trajet_km ? ' · ' + c.trajet_km + 'km' : '';
      const td = c.trajet_duree ? c.trajet_duree : '';
      const itin = p.itineraire_maps ? ' ' + mapBtn(p.itineraire_maps) : '';
      entete = `<div class="segment">🚗 ${td}${km} — ${c.depart||''} → ${c.arrivee||''}${itin}</div>`;
    } else if (p.itineraire_maps) {
      entete = `<div class="segment">🏁 Itinéraire ${mapBtn(p.itineraire_maps)}</div>`;
    }
    let arr = '';
    if (DEBUG) arr += `<div class="segment" style="color:green">DEBUG: ${points.length} points · parcours=${c.parcours||'(inline)'}</div>`;
    for (let i=0;i<points.length;i++) {
      const a = points[i];
      const aNotes = hasContent(a.aide_memoire);
      const aide = (aNotes || a.photo) ? `<div class="aide">${aNotes ? lignesHtml(a.aide_memoire) : ''}${a.photo?`<div class="photo">${a.photo}</div>`:''}</div>` : '';
      const detail = a.detail ? `<div class="segment">${a.detail}${a.trajet_maps?' '+mapBtn(a.trajet_maps):''}${a.parking_maps?' · 🅿️ '+mapBtn(a.parking_maps):''}</div>` : '';
      let boutons='',blocs='';
      if (a.recits&&a.recits.length){for(let k=0;k<a.recits.length;k++){const r=renderRecit(await getRecit(a.recits[k]),`${cid}-${i}-${k}`);boutons+=r.bouton;blocs+=r.bloc;}}
      boutons += guideBtns(a);
      const acces = boutons?`<div class="acces-rangee">${boutons}</div>${blocs}`:'';
      arr += `<div class="point"><div class="point-tete"><span class="point-nom">${a.emoji||'🏁'} ${a.nom}</span><span class="point-meta">· ${a.duree||''}</span></div>${aide}${texteComplet(a.texte_original, !aNotes)}${detail}${acces}</div>`;
    }
    return wrap(cid, c.heure, `🏁 ${titre}`, c.duree||'', `${entete}${extrasCreneau(c, cid)}${arr}${renderGuides(guideSrc)}`);
  } catch (e) {
    return wrap(cid, c.heure, `🏁 ${c.titre||'portion'}`, '', `<div class="segment" style="color:#A33B2E">ERREUR: ${e.message}</div>`);
  }
}

// Enveloppe commune d'un créneau
function wrap(cid, heure, titre, duree, body) {
  return `
    <div class="creneau" id="${cid}">
      <div class="creneau-header" onclick="ouvrir('${cid}')">
        <div class="creneau-time">${heure || ''}</div>
        <div style="flex:1"><div class="creneau-titre">${titre}</div><div class="creneau-duree">${duree}</div></div>
        <div class="chev">▼</div>
      </div>
      <div class="creneau-body">${body}</div>
    </div>`;
}

const DISPATCH = { boucle: cr_boucle, visite: cr_visite, trajet: cr_trajet, etape: cr_etape, repas: cr_repas, degustation: cr_degustation, courses: cr_courses, checkin: cr_checkin, portion: cr_portion, section: cr_section };
async function renderCreneau(c, idx) {
  const fn = DISPATCH[c.type];
  if (fn) return fn(c, idx);
  return wrap(`c-${idx}`, c.heure, c.titre || `(type ${c.type})`, '', '');
}

// ===== Abstract + Hébergement =====
function renderWarnings(jour) {
  if (!jour.warnings) return '';
  return jour.warnings.map(w => `
    <div class="day-warning">
      <div class="day-warning-titre">⚠️ ${w.titre}</div>
      ${w.lignes.map(l => `<div class="day-warning-l">${autolink(l)}</div>`).join('')}
    </div>`).join('');
}

function renderAbstract(jour) {
  if (!jour.abstract) return '';
  const rows = jour.abstract.map(r => {
    const billet = r.billet ? ` · <a href="${r.billet}">📄 Billet</a>` : '';
    const heure = r.heure_cle ? ` à <span class="heure-cle">${r.heure_cle}</span>` : '';
    const ref = r.ref ? ` <span class="ref">· ${r.ref}</span>` : '';
    const cls = r.alerte ? 'abstract-row alerte' : 'abstract-row';
    return `<div class="${cls}">${r.emoji||''} ${r.texte}${heure}${ref}${billet}</div>`;
  }).join('');
  const alerte = jour.alerte ? `<div class="abstract-row alerte">${jour.alerte}</div>` : '';
  return `<div class="abstract"><div class="abstract-title">📋 Abstract du jour</div>${rows}${alerte}</div>`;
}
async function renderHeberg(jour) {
  let h = jour.hebergement; if (!h) return '';
  if (typeof h === 'string') h = await getHeberg(h);
  const aNotes = hasContent(h.aide_memoire);
  const aide = aNotes ? `<div class="aide">${lignesHtml(h.aide_memoire)}</div>` : '';
  const details = hasContent(jour.hebergement_details) ? `<div class="aide heberg-details">${lignesHtml(jour.hebergement_details)}</div>` : '';
  // récits éventuels
  let boutons='',blocs='';
  if (h.recits&&h.recits.length){for(let i=0;i<h.recits.length;i++){const r=renderRecit(await getRecit(h.recits[i]),`heb-${i}`);boutons+=r.bouton;blocs+=r.bloc;}}
  boutons += guideBtns(h);
  const acces = boutons?`<div class="acces-rangee">${boutons}</div>${blocs}`:'';
  return `
    <div class="heberg" id="heberg">
      <div class="heberg-header">
        <div class="heberg-titre-zone" onclick="toggleHeberg()">
          <div class="heberg-titre">🏨 Hébergement ce soir — ${h.nom}<div class="sub">${h.sous||''}</div></div>
          <div class="chev">▼</div>
        </div>
        ${mapBtn(h.maps)}
      </div>
      <div class="heberg-body">
        ${h.parking?`<div class="segment">${h.parking}</div>`:''}
        ${h.note?`<div class="segment">📍 ${h.note}</div>`:''}
        ${aide}${details}${texteComplet(h.texte_original, false)}${acces}
      </div>
    </div>`;
}

function renderNotesJour(jour) {
  if (!jour.notes_pratiques || !jour.notes_pratiques.length) return '';
  return `<div class="notes-jour">${jour.notes_pratiques.map((n,i) => renderNote(n, `jour-${i}`)).join('')}</div>`;
}

async function renderJour(jour) {
  const root = document.getElementById('app');
  root.innerHTML = `
    <div class="day-label">${jour.date}</div>
    <div class="day-title">${jour.jour} — ${jour.titre}</div>
    ${renderAbstract(jour)}
    ${renderWarnings(jour)}
    ${renderGuides(jour)}
    ${await renderHeberg(jour)}
    <div id="creneaux"></div>
    ${renderNotesJour(jour)}
    ${jour.obsidian?`<div class="footer">${jour.jour} · ${jour.date}<br><a href="${jour.obsidian}">📖 Feuille de route complète · Obsidian</a></div>`:''}`;
  const cont = document.getElementById('creneaux');
  for (let i=0;i<jour.creneaux.length;i++) cont.appendChild(el(await renderCreneau(jour.creneaux[i], i)));
}

// ===== Interactions =====
function ouvrir(id) {
  const cible = document.getElementById(id); const dejaOuvert = cible.classList.contains('ouvert');
  document.querySelectorAll('.creneau').forEach(c=>{c.classList.remove('ouvert');c.classList.remove('actif');});
  if (!dejaOuvert) { cible.classList.add('ouvert'); cible.classList.add('actif'); setTimeout(()=>cible.scrollIntoView({behavior:'smooth',block:'start'}),50); }
}
function toggleRecit(id){ event.stopPropagation(); document.getElementById(id).classList.toggle('ouvert'); }
function toggleNote(id){ event.stopPropagation(); document.getElementById(id).classList.toggle('ouvert'); }
function toggleHeberg(){ document.getElementById('heberg').classList.toggle('ouvert'); }

function getParam(name){ return new URLSearchParams(window.location.search).get(name); }
(async function () {
  const j = getParam('j') || 'J1';
  const c = getParam('c') || '2026-0718';
  // Le lien « ← Dashboard » ramène au circuit affiché
  const retour = document.querySelector('.retour-dash');
  if (retour) retour.href = `index.html?c=${encodeURIComponent(c)}`;
  try { await renderJour(await loadJSON(`circuits/${c}/${j}.json`)); }
  catch (e) { document.getElementById('app').innerHTML = `<div style="padding:20px;color:#A33B2E">Erreur: ${e.message}</div>`; }
})();
