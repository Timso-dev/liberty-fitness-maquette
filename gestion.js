/* Espace gestion de la maquette : préfigure l'administration WordPress.
   Les changements sont enregistrés dans ce navigateur uniquement. */
(function () {
  const { data, DEFAUT, enregistrer, reinitialiser, lundi, decaler, dateDe, JOURS, MOIS, heure, minutes, encre, esc, today } = window.LF;
  const $ = id => document.getElementById(id);

  function sauver(msg) {
    const ok = enregistrer(data);
    const s = $('g-statut');
    s.textContent = ok ? (msg || 'Enregistré.') : 'Ce navigateur bloque l’enregistrement : les changements disparaîtront à la fermeture de la page.';
    s.className = 'g-statut ' + (ok ? 'ok' : 'warn');
    clearTimeout(sauver.t); sauver.t = setTimeout(() => { s.textContent = ''; }, 4000);
  }

  // Bouton à double clic de confirmation (les boîtes de dialogue sont bloquées dans la visionneuse)
  function confirmer(btn, question, action) {
    const libelle = btn.textContent;
    btn.addEventListener('click', () => {
      if (btn.dataset.arme) { delete btn.dataset.arme; btn.textContent = libelle; action(); return; }
      btn.dataset.arme = '1'; btn.textContent = question();
      setTimeout(() => { if (btn.dataset.arme) { delete btn.dataset.arme; btn.textContent = libelle; } }, 5000);
    });
  }

  /* ---------- Onglets ---------- */
  const onglets = document.querySelectorAll('[role="tab"]');
  onglets.forEach(t => t.addEventListener('click', () => {
    onglets.forEach(x => { x.setAttribute('aria-selected', x === t); $(x.getAttribute('aria-controls')).hidden = x !== t; });
    try { sessionStorage.setItem('g-onglet', t.id); } catch (e) {}
  }));
  try { const o = sessionStorage.getItem('g-onglet'); if (o && $(o)) $(o).click(); } catch (e) {}

  /* ---------- Bandeau ---------- */
  const fb = $('f-bandeau');
  const champs = ['actif', 'type', 'message', 'lienTexte', 'lien', 'du', 'au'];
  function remplirBandeau() {
    champs.forEach(c => { const el = fb.elements[c]; if (el.type === 'checkbox') el.checked = !!data.bandeau[c]; else el.value = data.bandeau[c] || ''; });
    apercu();
  }
  function lireBandeau() {
    const b = {}; champs.forEach(c => { const el = fb.elements[c]; b[c] = el.type === 'checkbox' ? el.checked : el.value.trim(); }); return b;
  }
  function apercu() {
    const b = lireBandeau();
    const p = $('g-apercu');
    p.className = 'bandeau ' + b.type;
    p.innerHTML = `<div class="wrap"><p>${esc(b.message || 'Votre message apparaîtra ici.')}${b.lien ? ` <a href="#" tabindex="-1">${esc(b.lienTexte || 'En savoir plus')}</a>` : ''}</p></div>`;
    $('g-compteur').textContent = `${b.message.length} / 140`;
    let etat;
    if (!b.actif) etat = 'Bandeau désactivé : il n’apparaît nulle part.';
    else if (b.du && today < b.du) etat = `Programmé : il apparaîtra le ${dateDe(b.du).toLocaleDateString('fr-FR')}.`;
    else if (b.au && today > b.au) etat = 'Date de fin dépassée : il n’apparaît plus.';
    else etat = 'En ligne sur toutes les pages' + (b.au ? ` jusqu’au ${dateDe(b.au).toLocaleDateString('fr-FR')}.` : '.');
    $('g-etat').textContent = etat;
  }
  fb.addEventListener('input', apercu);
  fb.addEventListener('submit', e => {
    e.preventDefault();
    const b = lireBandeau();
    if (b.du && b.au && b.au < b.du) { $('g-etat').textContent = 'La date de fin est avant la date de début : corrigez-la pour enregistrer.'; return; }
    data.bandeau = b; sauver('Bandeau enregistré.');
    try { sessionStorage.removeItem('bandeau-ferme'); } catch (e2) {}
    window.LF.rendreBandeau();
  });
  remplirBandeau();

  /* ---------- Planning ---------- */
  let cle = lundi(new Date());
  let enEdition = null; // index du cours modifié
  const fc = $('f-cours');

  function optionsEtiquettes() {
    fc.elements.etiquette.innerHTML = data.etiquettes.map(e => `<option value="${esc(e.id)}">${esc(e.nom)}</option>`).join('');
    const titres = new Set(), coachs = new Set();
    Object.values(data.semaines).flat().forEach(c => { titres.add(c.titre); if (c.coach) coachs.add(c.coach); });
    ['Dimitri', 'Damien', 'Adeline', 'Laurent', 'Pauline', 'Lily'].forEach(n => coachs.add(n));
    $('dl-titres').innerHTML = [...titres].sort().map(t => `<option value="${esc(t)}">`).join('');
    $('dl-coachs').innerHTML = [...coachs].sort().map(t => `<option value="${esc(t)}">`).join('');
  }

  function rendrePlanning() {
    const d0 = dateDe(cle), d6 = dateDe(decaler(cle, 6));
    $('g-semaine').textContent = `Semaine du ${d0.getDate()} ${MOIS[d0.getMonth()]} au ${d6.getDate()} ${MOIS[d6.getMonth()]} ${d6.getFullYear()}`;
    $('g-date').value = cle;
    const cours = data.semaines[cle] || [];
    $('g-nb').textContent = cours.length ? `${cours.length} cours publiés` : 'Aucun cours : la page Planning affiche « pas encore publié ».';
    const liste = $('g-liste');
    if (!cours.length) { liste.innerHTML = '<p class="vide">Ajoutez un cours avec le formulaire, ou copiez la semaine précédente.</p>'; return; }
    const idx = cours.map((c, i) => [c, i]).sort(([a], [b]) => a.jour - b.jour || minutes(a.debut) - minutes(b.debut));
    let html = '', jour = 0;
    idx.forEach(([c, i]) => {
      if (c.jour !== jour) { if (jour) html += '</ul>'; jour = c.jour; html += `<h4>${JOURS[jour]}</h4><ul class="g-rows">`; }
      const e = data.etiquettes.find(x => x.id === c.etiquette) || { nom: '?', couleur: '#5a6354' };
      html += `<li${enEdition === i ? ' class="edit"' : ''}><time>${heure(c.debut)}–${heure(c.fin)}</time>
        <span class="g-titre"><b>${esc(c.titre)}</b>${c.coach ? ` · ${esc(c.coach)}` : ''}</span>
        <span class="g-etiq" style="--c:${e.couleur};--t:${encre(e.couleur)}">${esc(e.nom)}</span>
        <span class="g-actions"><button type="button" data-edit="${i}">Modifier</button><button type="button" data-del="${i}">Supprimer</button></span></li>`;
    });
    liste.innerHTML = html + '</ul>';
  }

  function reinitForm() {
    enEdition = null; fc.reset();
    fc.elements.jour.value = '1'; fc.elements.debut.value = '18:25'; fc.elements.fin.value = '19:10';
    $('g-form-titre').textContent = 'Ajouter un cours'; $('g-submit').textContent = 'Ajouter au planning'; $('g-annuler').hidden = true;
    $('g-erreur').textContent = '';
  }

  $('g-liste').addEventListener('click', ev => {
    const cours = data.semaines[cle] || [];
    if (ev.target.dataset.del !== undefined) {
      cours.splice(Number(ev.target.dataset.del), 1); if (!cours.length) delete data.semaines[cle];
      reinitForm(); sauver('Cours supprimé.'); rendrePlanning();
    } else if (ev.target.dataset.edit !== undefined) {
      enEdition = Number(ev.target.dataset.edit); const c = cours[enEdition];
      ['jour', 'debut', 'fin', 'titre', 'etiquette', 'coach'].forEach(k => fc.elements[k].value = c[k]);
      $('g-form-titre').textContent = 'Modifier le cours'; $('g-submit').textContent = 'Enregistrer la modification'; $('g-annuler').hidden = false;
      rendrePlanning(); fc.elements.titre.focus();
    }
  });
  $('g-annuler').addEventListener('click', () => { reinitForm(); rendrePlanning(); });

  fc.addEventListener('submit', e => {
    e.preventDefault();
    const c = { jour: Number(fc.elements.jour.value), debut: fc.elements.debut.value, fin: fc.elements.fin.value,
      titre: fc.elements.titre.value.trim(), etiquette: fc.elements.etiquette.value, coach: fc.elements.coach.value.trim() };
    if (!c.titre) { $('g-erreur').textContent = 'Donnez un nom au cours.'; return; }
    if (!c.debut || !c.fin || minutes(c.fin) <= minutes(c.debut)) { $('g-erreur').textContent = 'L’heure de fin doit être après l’heure de début.'; return; }
    const cours = data.semaines[cle] || (data.semaines[cle] = []);
    if (enEdition !== null) cours[enEdition] = c; else cours.push(c);
    const msg = enEdition !== null ? 'Cours modifié.' : 'Cours ajouté.';
    reinitForm(); optionsEtiquettes(); sauver(msg); rendrePlanning();
  });

  function changerSemaine(k) { cle = k; reinitForm(); rendrePlanning(); }
  $('g-prec').addEventListener('click', () => changerSemaine(decaler(cle, -7)));
  $('g-suiv').addEventListener('click', () => changerSemaine(decaler(cle, 7)));
  $('g-date').addEventListener('change', e => { if (e.target.value) changerSemaine(lundi(dateDe(e.target.value))); });

  const source = () => Object.keys(data.semaines).filter(k => k < cle && data.semaines[k].length).sort().pop();
  confirmer($('g-copier'), () => (data.semaines[cle] || []).length ? 'Remplacer les cours de cette semaine ? Cliquez pour confirmer' : 'Cliquez pour confirmer la copie', () => {
    const k = source();
    if (!k) { $('g-nb').textContent = 'Aucune semaine précédente à copier.'; return; }
    data.semaines[cle] = JSON.parse(JSON.stringify(data.semaines[k]));
    sauver(`Semaine du ${dateDe(k).getDate()} ${MOIS[dateDe(k).getMonth()]} copiée.`); rendrePlanning();
  });
  confirmer($('g-vider'), () => 'Supprimer tous les cours de la semaine ? Cliquez pour confirmer', () => {
    delete data.semaines[cle]; reinitForm(); sauver('Semaine vidée.'); rendrePlanning();
  });

  /* ---------- Étiquettes ---------- */
  function utilisations(id) { return Object.values(data.semaines).flat().filter(c => c.etiquette === id).length; }
  function rendreEtiquettes() {
    $('g-etiquettes').innerHTML = data.etiquettes.map((e, i) => {
      const n = utilisations(e.id);
      return `<li data-i="${i}">
        <input type="color" name="couleur" value="${esc(e.couleur)}" aria-label="Couleur de ${esc(e.nom)}">
        <input name="nom" value="${esc(e.nom)}" aria-label="Nom de l'étiquette">
        <input name="description" value="${esc(e.description || '')}" placeholder="Description courte" aria-label="Description de ${esc(e.nom)}">
        <span class="g-usage">${n} cours</span>
        <button type="button" data-supp="${i}" ${n ? 'disabled title="Utilisée dans le planning : changez d’abord l’étiquette de ces cours"' : ''}>Supprimer</button>
      </li>`;
    }).join('');
  }
  $('g-etiquettes').addEventListener('change', ev => {
    const li = ev.target.closest('li'); if (!li) return;
    const e = data.etiquettes[Number(li.dataset.i)];
    const v = ev.target.value.trim();
    if (ev.target.name === 'nom' && !v) { ev.target.value = e.nom; return; }
    e[ev.target.name] = v;
    optionsEtiquettes(); sauver('Étiquette mise à jour.'); rendrePlanning();
  });
  $('g-etiquettes').addEventListener('click', ev => {
    if (ev.target.dataset.supp === undefined) return;
    data.etiquettes.splice(Number(ev.target.dataset.supp), 1);
    optionsEtiquettes(); rendreEtiquettes(); sauver('Étiquette supprimée.');
  });
  $('f-etiquette').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, nom = f.elements.nom.value.trim();
    if (!nom) return;
    let id = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'etiquette';
    while (data.etiquettes.some(x => x.id === id)) id += '-2';
    data.etiquettes.push({ id, nom, couleur: f.elements.couleur.value, description: f.elements.description.value.trim() });
    f.reset(); f.elements.couleur.value = '#a5f906';
    optionsEtiquettes(); rendreEtiquettes(); sauver(`Étiquette « ${nom} » créée.`);
  });

  /* ---------- Réinitialiser ---------- */
  confirmer($('g-reset'), () => 'Tout remettre comme au départ ? Cliquez pour confirmer', () => {
    const neuf = reinitialiser();
    Object.keys(data).forEach(k => delete data[k]); Object.assign(data, neuf);
    remplirBandeau(); optionsEtiquettes(); rendreEtiquettes(); reinitForm(); rendrePlanning(); window.LF.rendreBandeau();
    sauver('Démo réinitialisée.');
  });

  optionsEtiquettes(); rendreEtiquettes(); reinitForm(); rendrePlanning();
})();
