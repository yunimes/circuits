// ===== MOTEUR DE RENDU — version complète =====
const DATA_BASE = 'data';

// Grammaire d'emojis par type
const TYPE_EMOJI = {
  trajet: '🚗', boucle: '👣', visite: '👣', portion: '🏁', observation: '🔭',
  parking: '🅿️', repas: '🍽️', hebergement: '🏨', checkin: '🏨',
  courses: '🛒', degustation: '🍷', train: '🚄', vol: '✈️', monument: '🏛️'
};

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
function lignesHtml(arr) { return (arr || []).map(l => `<div class="${l.includes('❗️') ? 'ligne flag' : 'ligne'}">${l}</div>`).join(''); }

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
  const tot = t + v;
  return tot > 0 ? formatDuree(tot) : (c.duree || '');
}

// ===== Récit (avec texte original) =====
function renderRecit(recit, key) {
  const rid = `recit-${key}`;
  const cond = `<div class="lignes-recit">${recit.titre ? `<div class="titre-recit">${recit.titre}</div>` : ''}${lignesHtml(recit.lignes)}${recit.speak ? `<div class="speak">${recit.speak}</div>` : ''}</div>`;
  const orig = `<div class="original-recit">${recit.titre ? `<div class="titre-recit">${recit.titre}</div>` : ''}${recit.texte_original ? lignesHtml(recit.texte_original) : '<div class="ligne vide">(texte original à compléter)</div>'}</div>`;
  return {
    bouton: `<button class="btn-recit" onclick="toggleRecit('${rid}')">${recit.titre || 'Récit'}</button>`,
    bloc: `<div class="recit" id="${rid}">${cond}${orig}</div>`
  };
}

// ===== Point (aide-mémoire + texte original + récits) =====
async function renderPoint(point, key) {
  const aide = `<div class="aide">${lignesHtml(point.aide_memoire)}${point.photo ? `<div class="photo">${point.photo}</div>` : ''}</div>`;
  const orig = `<div class="original">${point.texte_original ? lignesHtml(point.texte_original) : '<div class="ligne vide">(texte original à compléter)</div>'}${point.photo ? `<div class="photo">${point.photo}</div>` : ''}</div>`;

  let boutons = '', blocs = '';
  if (point.recits && point.recits.length) {
    for (let i = 0; i < point.recits.length; i++) {
      const r = renderRecit(await getRecit(point.recits[i]), `${key}-${i}`);
      boutons += r.bouton; blocs += r.bloc;
    }
  }
  const acces = boutons ? `<div class="acces-rangee">${boutons}</div>${blocs}` : '';
  const meta = point.prix ? `<span class="point-meta">· ${point.prix}</span>` : '';
  const billet = point.billet ? `<span class="point-meta">· <a href="${point.billet.obsidian}" style="color:var(--purple);text-decoration:none">📄 Billet</a></span>` : '';

  return `
    <div class="point">
      <div class="point-tete"><span class="point-nom">${point.emoji || ''} ${point.nom}</span>${mapBtn(point.maps)}${meta}${billet}</div>
      ${aide}${orig}${acces}
    </div>`;
}

function renderNote(note, key) {
  const nid = `note-${key}`;
  return `<div class="note-pratique"><button class="note-toggle" onclick="toggleNote('${nid}')"><span>${note.titre}</span><span>▼</span></button><div class="note-body" id="${nid}">${lignesHtml(note.lignes)}</div></div>`;
}
function renderNotes(site, cid) {
  let out = '';
  if (site.note_pratique) out += renderNote(site.note_pratique, `${cid}-n0`);
  if (site.notes_pratiques) site.notes_pratiques.forEach((n,i)=> out += renderNote(n, `${cid}-n${i}`));
  return out;
}

function guideHref(g) { return g.id ? `guide.html?id=${g.id}` : (g.lien || g.obsidian); }
function renderGuides(obj) {
  let btns = '';
  if (obj.guides) obj.guides.forEach(g => btns += `<a class="btn-obsidian" href="${guideHref(g)}">🎙️ ${g.nom}</a>`);
  else if (obj.guide) btns = `<a class="btn-obsidian" href="${guideHref(obj.guide)}">🎙️ ${obj.guide.nom}</a>`;
  return btns ? `<div class="guide-oral"><div class="guide-oral-btns">${btns}</div></div>` : '';
}

function billetBar(site) {
  return site.billet ? `<div class="info-bar">🎟️ ${site.billet.ref || 'Réservé'} · <a href="${site.billet.obsidian}">📄 Billet</a></div>` : '';
}

// ===== Créneaux par type =====
async function cr_boucle(c, idx) {
  const site = await getSite(c.site); const cid = `c-${idx}`; const b = site.boucle;
  let segs = '';
  if (c.trajet) { const t = c.trajet; const pk = (site.parkings||[]).map(p=>`${p.nom} ${mapBtn(p.maps)}`).join(' · '); segs += `<div class="segment">🚗 ${t.duree}${t.km?' · '+t.km+'km':''} — ${t.depuis} → ${site.nom}${pk?' · 🅿️ '+pk:''}</div>`; }
  if (c.visite) segs += `<div class="segment">👣 ${c.visite.duree} — Visite</div>`;
  const bar = `<div class="boucle-bar">👣 Boucle pédestre · ${b.marche_min} min · ${b.distance_m}m ${mapBtn(b.itineraire_maps)}</div>`;
  let pts = ''; for (let i=0;i<b.points.length;i++) pts += await renderPoint(b.points[i], `${cid}-${i}`);
  const opt = site.option ? `<div class="option-bloc">${site.option.texte}</div>` : '';
  return wrap(cid, c.heure, site.nom, dureeTotale(c), `${segs}${billetBar(site)}${bar}${pts}${renderNotes(site, cid)}${opt}${renderGuides(site)}`);
}

async function cr_visite(c, idx) {
  const site = await getSite(c.site); const cid = `c-${idx}`;
  let segs = '';
  if (c.trajet) { const t = c.trajet; const pk = (site.parkings||[]).map(p=>`${p.nom} ${mapBtn(p.maps)}`).join(' · '); segs += `<div class="segment">🚗 ${t.duree}${t.km?' · '+t.km+'km':''} — ${t.depuis} → ${site.nom}${pk?' · 🅿️ '+pk:''}</div>`; }
  if (c.visite) segs += `<div class="segment">👣 ${c.visite.duree} — Visite</div>`;
  const liste = site.points || (site.point ? [site.point] : []);
  let pts = ''; for (let i=0;i<liste.length;i++) pts += await renderPoint(liste[i], `${cid}-${i}`);
  const optV = site.option ? `<div class="option-bloc">${site.option.texte}</div>` : '';
  return wrap(cid, c.heure, site.nom, dureeTotale(c), `${segs}${billetBar(site)}${pts}${renderNotes(site, cid)}${optV}${renderGuides(site)}`);
}

async function cr_trajet(c, idx) {
  const cid = `c-${idx}`;
  const pk = (c.parkings||[]).map(p=>`${p.nom} ${mapBtn(p.maps)}`).join(' · ');
  const body = `<div class="segment">🚗 ${c.duree||''}${c.km?' · '+c.km+'km':''}${pk?' · 🅿️ '+pk:''}</div>`;
  return wrap(cid, c.heure, `🚗 ${c.titre}`, c.duree||'', body);
}

async function cr_repas(c, idx) {
  const cid = `c-${idx}`;
  let r = c.restaurant;
  if (typeof r === 'string') r = await getResto(r);
  const resa = r.reservation ? `${r.reservation.statut||''}${r.reservation.heure?' à '+r.reservation.heure:''}${r.reservation.tel?' · ☎️ '+r.reservation.tel:''}` : '';
  const aide = `<div class="aide">${lignesHtml(r.aide_memoire)}${r.prix_indicatif?`<div class="ligne" style="color:var(--orange)">💶 ${r.prix_indicatif}</div>`:''}${r.adresse?`<div class="photo">📍 ${r.adresse}</div>`:''}</div>`;
  const tete = `<div class="point-tete"><span class="point-nom">${r.nom}</span>${mapBtn(r.maps)}</div>`;
  return wrap(cid, c.heure, `🍽️ ${r.nom}`, `${c.duree||''}${resa?' · '+resa:''}`, `${tete}${aide}`);
}

async function cr_degustation(c, idx) {
  const cid = `c-${idx}`;
  const prix = c.prix ? `<div class="resa-bar">💶 ${c.prix}</div>` : '';
  const tete = c.maps ? `<div class="point-tete"><span class="point-nom">📍 ${c.titre}</span>${mapBtn(c.maps)}</div>` : '';
  return wrap(cid, c.heure, `🍷 ${c.titre}`, c.duree||'', `${prix}${tete}`);
}

async function cr_courses(c, idx) {
  const cid = `c-${idx}`;
  const segs = (c.segments||[]).map(s=>`<div class="segment">${s}</div>`).join('');
  const tete = `<div class="point-tete"><span class="point-nom">🛒 ${c.titre}</span>${mapBtn(c.maps)}</div>`;
  const adr = c.adresse ? `<div class="photo" style="font-size:12px;color:var(--ink-soft);margin-top:6px">📍 ${c.adresse}</div>` : '';
  return wrap(cid, c.heure, `🛒 ${c.titre}`, c.duree||'', `${tete}${segs}${adr}`);
}

async function cr_checkin(c, idx) {
  const cid = `c-${idx}`;
  return wrap(cid, c.heure, `🏨 ${c.titre}`, c.duree||'', `<div class="bloc-texte">${c.texte||''}</div>`);
}

async function getParcours(id) { if (!cache.parcours[id]) cache.parcours[id] = await loadJSON(`parcours/${id}.json`); return cache.parcours[id]; }
async function cr_portion(c, idx) {
  const cid = `c-${idx}`;
  // Parcours réutilisable (par id) OU inline (arrets dans le circuit)
  let p = c, titre = c.titre, guideSrc = c;
  if (c.parcours) { p = await getParcours(c.parcours); titre = p.nom; guideSrc = p; }
  const arrets = p.arrets || [];
  // En-tête départ → arrivée si fournis par le circuit
  let entete = '';
  if (c.depart || c.arrivee) {
    const km = c.trajet_km ? ' · ' + c.trajet_km + 'km' : '';
    const td = c.trajet_duree ? c.trajet_duree : '';
    entete = `<div class="segment">🚗 ${td}${km} — ${c.depart||''} → ${c.arrivee||''}</div>`;
  }
  let arr = '';
  for (let i=0;i<arrets.length;i++) {
    const a = arrets[i];
    const aide = `<div class="aide">${lignesHtml(a.aide_memoire)}${a.photo?`<div class="photo">${a.photo}</div>`:''}</div>`;
    const orig = `<div class="original">${a.texte_original?lignesHtml(a.texte_original):'<div class="ligne vide">(texte original à compléter)</div>'}</div>`;
    const detail = a.detail ? `<div class="segment">${a.detail}${a.trajet_maps?' '+mapBtn(a.trajet_maps):''}${a.parking_maps?' · 🅿️ '+mapBtn(a.parking_maps):''}</div>` : '';
    let boutons='',blocs='';
    if (a.recits&&a.recits.length){for(let k=0;k<a.recits.length;k++){const r=renderRecit(await getRecit(a.recits[k]),`${cid}-${i}-${k}`);boutons+=r.bouton;blocs+=r.bloc;}}
    const acces = boutons?`<div class="acces-rangee">${boutons}</div>${blocs}`:'';
    arr += `<div class="point"><div class="point-tete"><span class="point-nom">${a.emoji||'🏁'} ${a.nom}</span><span class="point-meta">· ${a.duree||''}</span></div>${aide}${orig}${detail}${acces}</div>`;
  }
  return wrap(cid, c.heure, `🏁 ${titre}`, c.duree||'', `${entete}${arr}${renderGuides(guideSrc)}`);
}

// Enveloppe commune d'un créneau
function wrap(cid, heure, titre, duree, body) {
  return `
    <div class="creneau" id="${cid}">
      <div class="creneau-header" onclick="ouvrir('${cid}')">
        <div class="creneau-time">${heure}</div>
        <div style="flex:1"><div class="creneau-titre">${titre}</div><div class="creneau-duree">${duree}</div></div>
        <div class="chev">▼</div>
      </div>
      <div class="creneau-body">${body}</div>
    </div>`;
}

const DISPATCH = { boucle: cr_boucle, visite: cr_visite, trajet: cr_trajet, repas: cr_repas, degustation: cr_degustation, courses: cr_courses, checkin: cr_checkin, portion: cr_portion };
async function renderCreneau(c, idx) {
  const fn = DISPATCH[c.type];
  if (fn) return fn(c, idx);
  return wrap(`c-${idx}`, c.heure, c.titre || `(type ${c.type})`, '', '');
}

// ===== Abstract + Hébergement =====
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
  const aide = (h.aide_memoire&&h.aide_memoire.length)?`<div class="aide">${lignesHtml(h.aide_memoire)}</div>`:'';
  const orig = (h.texte_original&&h.texte_original.length)?`<div class="original">${lignesHtml(h.texte_original)}</div>`:'';
  // récits éventuels
  let boutons='',blocs='';
  if (h.recits&&h.recits.length){for(let i=0;i<h.recits.length;i++){const r=renderRecit(await getRecit(h.recits[i]),`heb-${i}`);boutons+=r.bouton;blocs+=r.bloc;}}
  const guideBtn = h.guide?`<a class="btn-obsidian" href="${guideHref(h.guide)}">🎙️ ${h.guide.nom}</a>`:'';
  const acces = (boutons||guideBtn)?`<div class="acces-rangee">${boutons}${guideBtn}</div>${blocs}`:'';
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
        ${aide}${orig}${acces}
      </div>
    </div>`;
}

async function renderJour(jour) {
  const root = document.getElementById('app');
  root.innerHTML = `
    <div class="day-label">${jour.date}</div>
    <div class="day-title">${jour.jour} — ${jour.titre}</div>
    <div class="mode-bar">
      <div class="mode-btn actif" id="mb-terrain" onclick="setMode('terrain')">👣 Terrain</div>
      <div class="mode-btn" id="mb-revision" onclick="setMode('revision')">📖 Révision</div>
    </div>
    ${renderAbstract(jour)}
    ${await renderHeberg(jour)}
    <div id="creneaux"></div>
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
function setMode(m) {
  document.body.classList.toggle('mode-revision', m === 'revision');
  document.getElementById('mb-terrain').classList.toggle('actif', m === 'terrain');
  document.getElementById('mb-revision').classList.toggle('actif', m === 'revision');
}

function getParam(name){ return new URLSearchParams(window.location.search).get(name); }
(async function () {
  const j = getParam('j') || 'J1';
  try { await renderJour(await loadJSON(`circuits/2026-0618/${j}.json`)); }
  catch (e) { document.getElementById('app').innerHTML = `<div style="padding:20px;color:#A33B2E">Erreur: ${e.message}</div>`; }
})();
