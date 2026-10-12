/* Liberty Fitness — script commun de la maquette.
   Les données modifiables (bandeau, étiquettes, planning) vivent ici par défaut ; l'espace gestion de la
   maquette les enregistre dans le navigateur. Sur le vrai site, elles viendront de l'administration WordPress. */
(function () {
  const $ = id => document.getElementById(id);
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  const dow = now.getDay();
  const fmt = x => { const hh = Math.floor(x), mm = Math.round((x - hh) * 60); return hh + 'h' + String(mm).padStart(2, '0'); };
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const today = iso(now);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Données ---------- */
  const DEFAUT = {
    bandeau: {
      actif: true, type: 'promo',
      message: 'Sac mystère : 40 € pour plus de 100 € de surprises, jusqu’au samedi 17 octobre.',
      lien: 'actualites.html#sac-mystere', lienTexte: 'Découvrir',
      du: '2026-10-05', au: '2026-10-17'
    },
    // Reprises de la légende de l'affiche du planning
    etiquettes: [
      { id: 'renfo', nom: 'Renforcement musculaire', couleur: '#ffcf1f', description: 'Renforcement, tonification' },
      { id: 'abdos', nom: 'Abdos, cuisses, fessiers et barres', couleur: '#ff8a1f', description: 'Gainage, force, tonus' },
      { id: 'souplesse', nom: 'Souplesse et bien-être', couleur: '#f8c3d6', description: 'Stretch, Pilates, Yoga, Qi Gong' },
      { id: 'bike', nom: 'Liberty Bike et RPM', couleur: '#151515', description: 'Cardio indoor' },
      { id: 'gym', nom: 'Liberty Gym', couleur: '#e5232b', description: 'Renforcement cardio' },
      { id: 'zumba', nom: 'Zumba', couleur: '#f01d8a', description: 'Danse, fun, cardio' },
      { id: 'step', nom: 'Liberty Step', couleur: '#a8d84e', description: 'Cardio chorégraphie' },
      { id: 'intensite', nom: 'Circuit et Cross Training', couleur: '#2457e0', description: 'Intensité, performance' },
      { id: 'kids', nom: 'Multi Kids', couleur: '#c4daf6', description: 'Cours adaptés aux plus jeunes' }
    ],
    // Clé = lundi de la semaine. jour : 1 = lundi … 7 = dimanche
    semaines: {
      '2026-10-12': [
        [1, '09:30', '10:15', 'Renforcement musculaire', 'renfo'], [1, '10:20', '11:05', 'Liberty Pilates', 'souplesse'],
        [1, '17:50', '18:20', 'Renforcement abdos', 'abdos'], [1, '18:25', '19:10', 'Renforcement musculaire', 'renfo'],
        [1, '19:15', '20:15', 'Zumba officielle', 'zumba'],
        [2, '09:30', '10:15', 'Liberty Circuit Training', 'intensite'], [2, '17:50', '18:20', 'Renforcement musculaire', 'renfo'],
        [2, '18:25', '19:10', 'Liberty Gym Tonic', 'gym'], [2, '19:15', '20:00', 'Liberty Yoga', 'souplesse'],
        [3, '09:30', '10:15', 'Liberty Qi Gong', 'souplesse'], [3, '10:20', '11:05', 'Renforcement musculaire', 'renfo'],
        [3, '17:50', '18:20', 'Renforcement musculaire', 'renfo'], [3, '18:25', '19:10', 'Liberty Pilates', 'souplesse'],
        [3, '19:15', '20:00', 'Liberty Step', 'step'],
        [4, '09:30', '10:15', 'Liberty Circuit Training', 'intensite'], [4, '10:20', '11:05', 'Liberty Stretch', 'souplesse'],
        [4, '17:50', '18:20', 'Renforcement abdos', 'abdos'], [4, '18:25', '19:10', 'Liberty Bike / RPM', 'bike'],
        [4, '19:15', '20:00', 'Liberty Bike / RPM', 'bike'],
        [5, '09:30', '10:30', 'Liberty Cross Training WOD', 'intensite'], [5, '17:50', '18:35', 'Renforcement musculaire', 'renfo'],
        [5, '18:40', '19:25', 'Liberty Pilates', 'souplesse'],
        [6, '09:45', '10:45', 'Multi Kids 4/7 ans', 'kids'], [6, '11:00', '12:00', 'Multi Kids 8/14 ans', 'kids']
      ].map(([jour, debut, fin, titre, etiquette]) => ({ jour, debut, fin, titre, etiquette, coach: '' }))
    }
  };

  const CLE = 'liberty-maquette-v1';
  function charger() {
    try { const s = JSON.parse(localStorage.getItem(CLE)); if (s && s.etiquettes && s.semaines) return s; } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAUT));
  }
  function enregistrer(d) { try { localStorage.setItem(CLE, JSON.stringify(d)); return true; } catch (e) { return false; } }
  function reinitialiser() { try { localStorage.removeItem(CLE); } catch (e) {} return JSON.parse(JSON.stringify(DEFAUT)); }

  // Lundi de la semaine d'une date, au format AAAA-MM-JJ
  function lundi(d) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const j = (x.getDay() + 6) % 7; x.setDate(x.getDate() - j); return iso(x); }
  function decaler(cle, jours) { const [a, m, j] = cle.split('-').map(Number); const x = new Date(a, m - 1, j + jours); return iso(x); }
  function dateDe(cle) { const [a, m, j] = cle.split('-').map(Number); return new Date(a, m - 1, j); }
  const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const heure = t => t.replace(/^0/, '').replace(':', 'h');
  const minutes = t => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  // Texte sombre ou clair selon la couleur de l'étiquette
  function encre(hex) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    const l = c => { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
    return (0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(b)) > 0.35 ? '#0d0f0b' : '#ffffff';
  }

  const data = charger();
  window.LF = { data, DEFAUT, enregistrer, reinitialiser, lundi, decaler, dateDe, JOURS, MOIS, heure, minutes, encre, esc, iso, today };

  /* ---------- Bandeau d'information ---------- */
  function rendreBandeau() {
    const zone = $('bandeau'); if (!zone) return;
    const b = data.bandeau;
    let ferme = false; try { ferme = sessionStorage.getItem('bandeau-ferme') === b.message; } catch (e) {}
    const visible = b.actif && b.message && (!b.du || today >= b.du) && (!b.au || today <= b.au) && !ferme;
    zone.hidden = !visible;
    if (!visible) return;
    zone.className = 'bandeau ' + (b.type || 'info');
    zone.innerHTML = `<div class="wrap"><p>${esc(b.message)}${b.lien ? ` <a href="${esc(b.lien)}">${esc(b.lienTexte || 'En savoir plus')}</a>` : ''}</p>
      <button type="button" aria-label="Masquer ce message">×</button></div>`;
    zone.querySelector('button').addEventListener('click', () => { zone.hidden = true; try { sessionStorage.setItem('bandeau-ferme', b.message); } catch (e) {} });
  }
  rendreBandeau();
  window.LF.rendreBandeau = rendreBandeau;

  /* ---------- Menu mobile ---------- */
  const top = document.querySelector('.top'), burger = document.querySelector('.burger');
  if (burger) burger.addEventListener('click', () => {
    const open = top.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.textContent = open ? 'Fermer' : 'Menu';
  });

  /* ---------- Ouverture de la salle et de l'accueil ---------- */
  if ($('st-salle')) {
    const salleOpen = h >= 5;
    $('dot-salle').classList.toggle('on', salleOpen);
    $('st-salle').textContent = salleOpen ? 'Salle ouverte' : 'Salle fermée';
    $('st-salle-d').textContent = salleOpen ? "jusqu'à minuit" : 'réouverture à 5h00';
  }
  if ($('st-accueil-d')) {
    const sem = [[9.5, 13.5], [17, 19.5]];
    const plages = { 0: [], 1: sem, 2: sem, 3: sem, 4: sem, 5: sem, 6: [[9.5, 12.5]] };
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const cur = plages[dow].find(([a, b]) => h >= a && h < b);
    let txt;
    if (cur) txt = 'ouvert, jusqu’à ' + fmt(cur[1]);
    else {
      const next = plages[dow].find(([a]) => a > h);
      if (next) txt = 'fermé, ouvre à ' + fmt(next[0]);
      else {
        let d = (dow + 1) % 7; while (!plages[d].length) d = (d + 1) % 7;
        txt = 'fermé, ouvre ' + (d === (dow + 1) % 7 ? 'demain' : jours[d]) + ' à ' + fmt(plages[d][0][0]);
      }
    }
    $('dot-accueil').classList.toggle('on', !!cur);
    $('st-accueil-d').textContent = txt;
  }

  /* ---------- Planning ---------- */
  const etiq = id => data.etiquettes.find(e => e.id === id) || { nom: 'Sans étiquette', couleur: '#5a6354' };
  const coursHTML = c => {
    const e = etiq(c.etiquette);
    return `<div class="cours" data-etiquette="${esc(c.etiquette)}" style="--c:${e.couleur};--t:${encre(e.couleur)}">
      <time>${heure(c.debut)} – ${heure(c.fin)}</time><b>${esc(c.titre)}</b>${c.coach ? `<small>avec ${esc(c.coach)}</small>` : ''}<span class="duree">${minutes(c.fin) - minutes(c.debut)} min</span></div>`;
  };
  const tri = (a, b) => a.jour - b.jour || minutes(a.debut) - minutes(b.debut);

  // Page planning : grille de la semaine, navigation et filtres par étiquette
  const grille = $('planning-grille');
  if (grille) {
    let cle = lundi(now);
    const filtres = new Set();
    const legende = $('planning-legende');
    legende.innerHTML = data.etiquettes.map(e =>
      `<button type="button" class="etiq" data-id="${esc(e.id)}" aria-pressed="false" style="--c:${e.couleur}"><i></i><span><b>${esc(e.nom)}</b>${esc(e.description || '')}</span></button>`).join('');
    legende.addEventListener('click', ev => {
      const btn = ev.target.closest('.etiq'); if (!btn) return;
      const id = btn.dataset.id;
      filtres.has(id) ? filtres.delete(id) : filtres.add(id);
      btn.setAttribute('aria-pressed', filtres.has(id));
      appliquerFiltres();
    });
    // Un cours filtré reste à sa place, estompé : la grille ne bouge pas
    function appliquerFiltres() {
      grille.querySelectorAll('.tl-cours').forEach(el => { el.classList.toggle('estompe', filtres.size > 0 && !filtres.has(el.dataset.etiquette)); });
      $('planning-reset').hidden = filtres.size === 0;
    }

    // Échelle verticale : une bande par heure qui contient au moins un cours dans la semaine,
    // les heures vides consécutives réduites à une bande « pas de cours »
    const PXH = 112, PAUSE = 36;
    function echelle(cours) {
      const deb = Math.floor(Math.min(...cours.map(c => minutes(c.debut))) / 60);
      const fin = Math.ceil(Math.max(...cours.map(c => minutes(c.fin))) / 60);
      const actif = hh => cours.some(c => minutes(c.debut) < (hh + 1) * 60 && minutes(c.fin) > hh * 60);
      const segs = []; let y = 0;
      for (let hh = deb; hh < fin; hh++) {
        if (actif(hh)) { segs.push({ type: 'h', h: hh, y }); y += PXH; }
        else if (segs.length && segs.at(-1).type === 'p') segs.at(-1).a = hh + 1;
        else { segs.push({ type: 'p', de: hh, a: hh + 1, y }); y += PAUSE; }
      }
      const pos = m => {
        const s = segs.find(x => x.type === 'h' && m >= x.h * 60 && m <= (x.h + 1) * 60);
        return s ? s.y + (m - s.h * 60) / 60 * PXH : 0;
      };
      return { segs, pos, total: y, fin };
    }

    // Cours qui se chevauchent le même jour : côte à côte
    function couloirs(liste) {
      const fins = [];
      liste.forEach(c => {
        let k = fins.findIndex(f => f <= minutes(c.debut));
        if (k < 0) { k = fins.length; fins.push(0); }
        fins[k] = minutes(c.fin); c._k = k;
      });
      liste.forEach(c => { c._n = Math.max(...liste.filter(o => minutes(o.debut) < minutes(c.fin) && minutes(o.fin) > minutes(c.debut)).map(o => o._k)) + 1; });
    }

    let jourSel = null; // jour affiché sur téléphone
    function rendre() {
      const cours = (data.semaines[cle] || []).slice().sort(tri);
      const d0 = dateDe(cle), d5 = dateDe(decaler(cle, 6));
      $('planning-titre').textContent = `Du ${d0.getDate()} ${d0.getMonth() === d5.getMonth() ? '' : MOIS[d0.getMonth()] + ' '}au ${d5.getDate()} ${MOIS[d5.getMonth()]} ${d5.getFullYear()}`;
      $('planning-prec').disabled = !Object.keys(data.semaines).some(k => k < cle);
      $('planning-suiv').disabled = !Object.keys(data.semaines).some(k => k > cle);
      if (!cours.length) {
        grille.innerHTML = `<p class="vide">Le planning de cette semaine n'est pas encore publié. Il est toujours à jour dans l'application Xplor Active.</p>`;
        return;
      }
      const jours = [1, 2, 3, 4, 5, 6].concat(cours.some(c => c.jour === 7) ? [7] : []);
      const dates = jours.map(j => dateDe(decaler(cle, j - 1)));
      const auj = jours.find((j, i) => iso(dates[i]) === today);
      if (!jours.includes(jourSel)) jourSel = auj || jours[0];
      const { segs, pos, total, fin } = echelle(cours);

      // Lignes d'heure et demi-heures, identiques dans chaque colonne
      const lignes = segs.map(s => s.type === 'h'
        ? `<i class="tl-ligne" style="top:${s.y}px"></i><i class="tl-demi" style="top:${s.y + PXH / 2}px"></i>`
        : `<i class="tl-ligne" style="top:${s.y}px"></i><i class="tl-pausebande" style="top:${s.y}px;height:${PAUSE}px" title="Pas de cours de ${s.de}h à ${s.a}h"></i>`).join('') +
        `<i class="tl-ligne" style="top:${total}px"></i>`;
      const axe = segs.map(s => s.type === 'h'
        ? `<span class="tl-h" style="top:${s.y}px">${s.h}h</span>`
        : `<span class="tl-h" style="top:${s.y}px">${s.de}h</span>`).join('') +
        `<span class="tl-h" style="top:${total}px">${fin}h</span>`;

      const minNow = now.getHours() * 60 + now.getMinutes();
      const colonnes = jours.map((j, i) => {
        const liste = cours.filter(c => c.jour === j); couloirs(liste);
        const blocs = liste.map(c => {
          const e = etiq(c.etiquette), y1 = pos(minutes(c.debut)), y2 = pos(minutes(c.fin)), haut = y2 - y1;
          const court = haut < 60 ? ' court' : '';
          return `<div class="tl-cours${court}" data-etiquette="${esc(c.etiquette)}" title="${esc(c.titre)} · ${heure(c.debut)} – ${heure(c.fin)}"
            style="top:${y1 + 1}px;height:${haut - 3}px;left:calc(${c._k / c._n * 100}% + 3px);width:calc(${100 / c._n}% - 6px);--c:${e.couleur};--t:${encre(e.couleur)}">
            <time>${heure(c.debut)} – ${heure(c.fin)}</time><b>${esc(c.titre)}</b>${c.coach && !court ? `<small>avec ${esc(c.coach)}</small>` : ''}</div>`;
        }).join('');
        const estAuj = j === auj;
        const maintenant = estAuj && segs.some(s => s.type === 'h' && minNow >= s.h * 60 && minNow <= (s.h + 1) * 60)
          ? `<i class="tl-maintenant" style="top:${pos(minNow)}px"><span>${now.getHours()}h${String(now.getMinutes()).padStart(2, '0')}</span></i>` : '';
        return `<div class="tl-jour${estAuj ? ' today' : ''}${j === jourSel ? ' sel' : ''}" style="height:${total}px">${lignes}${blocs}${maintenant}</div>`;
      }).join('');

      const tetes = jours.map((j, i) => `<div class="tl-tete${j === auj ? ' today' : ''}${j === jourSel ? ' sel' : ''}"><b>${JOURS[j]}</b><small>${dates[i].getDate()} ${MOIS[dates[i].getMonth()]}</small></div>`).join('');
      const onglets = jours.map((j, i) => `<button type="button" data-j="${j}" aria-pressed="${j === jourSel}">${JOURS[j].slice(0, 3)}<small>${dates[i].getDate()}</small></button>`).join('');

      grille.style.setProperty('--n', jours.length);
      grille.innerHTML = `<div class="tl-onglets" role="group" aria-label="Choisir le jour">${onglets}</div>
        <div class="tl"><div class="tl-entete"><div></div>${tetes}</div>
        <div class="tl-corps"><div class="tl-axe" style="height:${total}px">${axe}</div>${colonnes}</div></div>`;
      grille.querySelector('.tl-onglets').addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b) return; jourSel = Number(b.dataset.j); rendre();
      });
      appliquerFiltres();
    }
    $('planning-reset').addEventListener('click', () => { filtres.clear(); legende.querySelectorAll('.etiq').forEach(b => b.setAttribute('aria-pressed', 'false')); appliquerFiltres(); });

    $('planning-prec').addEventListener('click', () => { const k = Object.keys(data.semaines).filter(x => x < cle).sort().pop(); if (k) { cle = k; rendre(); } });
    $('planning-suiv').addEventListener('click', () => { const k = Object.keys(data.semaines).filter(x => x > cle).sort()[0]; if (k) { cle = k; rendre(); } });
    rendre();
  }

  // Accueil : les cours du jour, ou du prochain jour qui en a
  const duJour = $('cours-du-jour');
  if (duJour) {
    let trouve = null;
    for (let k = 0; k < 14 && !trouve; k++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
      const liste = (data.semaines[lundi(d)] || []).filter(c => c.jour === ((d.getDay() + 6) % 7) + 1)
        .filter(c => k > 0 || minutes(c.fin) > now.getHours() * 60 + now.getMinutes()).sort(tri);
      if (liste.length) trouve = { d, k, liste };
    }
    if (trouve) {
      $('cours-du-jour-titre').textContent = trouve.k === 0 ? 'Aujourd’hui au club' : trouve.k === 1 ? 'Demain au club' : `${JOURS[((trouve.d.getDay() + 6) % 7) + 1]} au club`;
      duJour.innerHTML = trouve.liste.map(coursHTML).join('');
    } else {
      duJour.innerHTML = '<p class="vide">Le prochain planning arrive bientôt. Consultez l’application Xplor Active.</p>';
    }
  }

  /* ---------- Sélecteurs de durée (tarifs) ---------- */
  document.querySelectorAll('.plan').forEach(plan => {
    const seg = plan.querySelector('.seg'); if (!seg) return;
    seg.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
      plan.querySelector('.plan-prix').innerHTML = b.dataset.prix;
      plan.querySelector('.plan-total').textContent = b.dataset.total;
    });
  });

  /* ---------- Actualités : badge selon la date du jour ---------- */
  document.querySelectorAll('[data-start]').forEach(el => {
    const tag = el.querySelector('.when span');
    if (!tag) return;
    if (today > el.dataset.end) { tag.textContent = 'Terminé'; el.classList.add('past'); }
    else if (today >= el.dataset.start) { tag.textContent = 'En ce moment'; tag.classList.add('live'); }
    else tag.textContent = 'À venir';
  });

  /* ---------- Formulaires : maquette, rien n'est envoyé ---------- */
  document.querySelectorAll('form.panel').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    f.classList.add('done');
    f.querySelector('.sent').focus();
  }));
})();
