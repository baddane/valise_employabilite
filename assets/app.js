/* Valise Employabilité — interface de navigation (page unique, routage par #). */
(function () {
  'use strict';

  var DATA = window.VALISE_CONTENU;
  var app = document.getElementById('app');
  if (!DATA) {
    app.innerHTML = '<div class="wrap empty"><h2>Contenu introuvable</h2><p>Le fichier <code>assets/contenu.js</code> est absent. ' +
      'Lancez <code>outils/METTRE-A-JOUR.bat</code> pour le régénérer.</p></div>';
    return;
  }

  /* ------------------------------------------------------------------
   * Métadonnées des modules (titres, descriptions, familles)
   * ------------------------------------------------------------------ */
  var GROUPS = [
    { id: 'fond', label: 'Fondations — diagnostic & projet' },
    { id: 'acc', label: 'Accompagnement & outillage' },
    { id: 'pil', label: 'Cadre & pilotage' },
    { id: 'ref', label: 'Socle — cadre de référence' }
  ];
  var META = {
    '01': { t: "Accueil & diagnostic", d: 'Accueil, orientation vers un mode d’accompagnement, dossier unique, grille /24, freins, compétences.', tag: '5 outils', g: 'fond' },
    '02': { t: "Marché de l'emploi", d: 'Analyse territoriale : secteurs, métiers en tension, salaires.', tag: 'Veille', g: 'fond' },
    '03': { t: 'Projet & plan d’action', d: 'Construction, validation « feu tricolore » et plan d’action individuel signé.', tag: '3 outils', g: 'fond' },
    '04': { t: 'Publics & partenaires', d: '15 profils (dont NEET, rural, informel) et cartographie des partenaires.', tag: '15 profils', g: 'fond' },
    '05': { t: 'Techniques de recherche', d: 'CV avec l’IA, message de candidature, LinkedIn, Facebook, WhatsApp, TikTok, entretien, négo.', tag: '7 guides', g: 'acc' },
    '06': { t: 'Coaching', d: 'Confiance, stress, posture, motivation — modèle GROW.', tag: 'Boîte à outils', g: 'acc' },
    '07': { t: 'Entreprises & placement', d: 'Prospection, analyse de poste, présélection, mise en relation, job dating.', tag: '3 outils', g: 'acc' },
    '08': { t: 'Ingénierie des compétences', d: 'Référentiel, bilan, plan de développement, VAE.', tag: 'Référentiel', g: 'acc' },
    '09': { t: "Techniques d'entretien", d: 'Écoute active, questionnement, entretien motivationnel.', tag: 'Conseiller', g: 'acc' },
    '10': { t: 'Suivi & clôture', d: 'Suivi post-embauche, relance des décrocheurs, clôture et satisfaction.', tag: 'J+1 → M12', g: 'acc' },
    '17': { t: 'Création d’activité', d: 'Auto-emploi : faisabilité, modèle économique, financement, statut, suivi.', tag: 'Auto-emploi', g: 'acc' },
    '11': { t: 'Cadre juridique & dispositifs', d: 'Code du travail, Idmaj, Taehil, Tahfiz, auto-emploi, CNSS / IPE.', tag: 'Repères Maroc', g: 'pil' },
    '12': { t: 'Données & KPI', d: 'Tableau de bord, cohortes, équité, du chiffre à l’action.', tag: 'Excel', g: 'pil' },
    '13': { t: "Animation d'ateliers", d: 'Formats courts (candidature avec l’IA, réseaux, entretien IA) et ateliers collectifs.', tag: '9 formats', g: 'pil' },
    '14': { t: 'Outils numériques & IA', d: 'L’IA à chaque étape, simulation d’entretien, tri des CV, règles d’usage.', tag: 'IA & digital', g: 'pil' },
    '15': { t: "Pilotage d'agence", d: 'Stratégie territoriale, management d’équipe, auto-évaluation.', tag: 'Direction', g: 'pil' },
    '16': { t: 'Cadre de référence', d: 'Théories, recherche, bibliographie, niveaux de preuve et avis d’experts qui fondent la valise.', tag: 'Socle scientifique', g: 'ref' }
  };

  var MODULES = DATA.modules.map(function (m) {
    var meta = META[m.num] || {
      t: m.folder.slice(3).toLowerCase().replace(/-/g, ' ').replace(/^./, function (c) { return c.toUpperCase(); }),
      d: '', tag: '', g: 'pil'
    };
    return {
      num: m.num, folder: m.folder, title: meta.t, desc: meta.d, tag: meta.tag, group: meta.g,
      docs: DATA.docs.filter(function (d) { return d.folder === m.num; }),
      files: DATA.attachments.filter(function (a) { return a.folder === m.num; })
    };
  });
  var MOD_BY_NUM = {};
  MODULES.forEach(function (m) { MOD_BY_NUM[m.num] = m; });

  var DOC_BY_ID = {}, DOC_BY_BASENAME = {};
  DATA.docs.forEach(function (d) {
    DOC_BY_ID[d.id] = d;
    DOC_BY_BASENAME[d.file.split('/').pop().toLowerCase()] = d;
  });
  var SOMMAIRE = DATA.docs.filter(function (d) { return d.folder === '00'; })[0];
  // ordre de lecture (pour « précédent / suivant »)
  var ORDER = (SOMMAIRE ? [SOMMAIRE] : []).concat([].concat.apply([], MODULES.map(function (m) { return m.docs; })));

  /* ------------------------------------------------------------------
   * Utilitaires
   * ------------------------------------------------------------------ */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function href(p) { return encodeURI(p).replace(/#/g, '%23'); }
  function slug(s) {
    return 's-' + fold(s).replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  // minuscules sans accents, même longueur que la chaîne d'origine (pour surligner)
  function fold(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      out += c.length === 1 ? c : s[i].toLowerCase().charAt(0) || s[i];
    }
    return out;
  }
  function fmtSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' Mo' : Math.max(1, Math.round(n / 1024)) + ' Ko'; }
  function docTitle(d) { return (d.icon ? d.icon + ' ' : '') + d.title; }
  function modLabel(num) { var m = MOD_BY_NUM[num]; return m ? num + ' · ' + m.title : 'Sommaire'; }
  function storage(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
  }

  /* ------------------------------------------------------------------
   * Rendu Markdown (sous-ensemble utilisé par les fiches)
   * ------------------------------------------------------------------ */
  function inline(src) {
    var codes = [];
    var s = src.replace(/`([^`]+)`/g, function (_, c) {
      codes.push(c);
      return '\u0000' + (codes.length - 1) + '\u0000';
    });
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) {
      var ext = /^https?:/i.test(u);
      return '<a href="' + u + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
    });
    s = s.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*\w])\*(?=\S)([^*]*?\S)\*(?!\w)/g, '$1<em>$2</em>');
    s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) {
      var c = codes[+i];
      var target = DOC_BY_BASENAME[c.split('/').pop().toLowerCase()];
      if (target) {
        return '<a class="xref" href="#/d/' + href(target.id) + '" title="Ouvrir la fiche">' +
          '<span aria-hidden="true">↗</span> ' + esc(target.title) + '</a>';
      }
      return '<code>' + esc(c) + '</code>';
    });
    return s;
  }

  var RE = {
    fence: /^\s*```/,
    heading: /^(#{1,6})\s+(.*?)\s*#*\s*$/,
    hr: /^\s*([-*_])(\s*\1){2,}\s*$/,
    quote: /^\s*>/,
    list: /^(\s*)([-*+]|\d+[.)])\s+(.*)$/,
    tsep: /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/
  };
  function isTableStart(lines, i) {
    return /\|/.test(lines[i]) && i + 1 < lines.length && RE.tsep.test(lines[i + 1]) && /\|/.test(lines[i + 1]);
  }
  function splitRow(line) {
    var l = line.trim().replace(/^\|/, '').replace(/\|$/, '');
    var cells = [], cur = '', inCode = false;
    for (var i = 0; i < l.length; i++) {
      var ch = l[i];
      if (ch === '`') inCode = !inCode;
      if (ch === '\\' && l[i + 1] === '|') { cur += '|'; i++; continue; }
      if (ch === '|' && !inCode) { cells.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  }

  function renderList(lines, i, headings) {
    var first = lines[i].match(RE.list);
    var indent = first[1].replace(/\t/g, '    ').length;
    var ordered = /\d/.test(first[2]);
    var start = ordered ? parseInt(first[2], 10) : 1;
    var items = [];
    while (i < lines.length) {
      var m = lines[i].match(RE.list);
      if (!m) break;
      var ind = m[1].replace(/\t/g, '    ').length;
      if (ind < indent) break;
      if (ind > indent) {
        var sub = renderList(lines, i, headings);
        if (items.length) items[items.length - 1].sub += sub.html;
        i = sub.next;
        continue;
      }
      if (/\d/.test(m[2]) !== ordered) break;
      var item = { text: m[3], sub: '' };
      i++;
      // lignes de continuation (indentées, non vides, pas un nouvel item)
      while (i < lines.length && lines[i].trim() && !RE.list.test(lines[i]) &&
             /^\s+/.test(lines[i]) && !RE.fence.test(lines[i])) {
        item.text += '\n' + lines[i].trim();
        i++;
      }
      items.push(item);
      // une ligne vide suivie d'un item de même niveau reste dans la liste
      if (i + 1 < lines.length && !lines[i].trim() && RE.list.test(lines[i + 1])) {
        var nm = lines[i + 1].match(RE.list);
        if (nm[1].replace(/\t/g, '    ').length >= indent) i++;
      }
    }
    var tag = ordered ? 'ol' : 'ul';
    var task = items.some(function (it) { return /^\[[ xX]\]\s/.test(it.text); });
    var html = '<' + tag + (ordered && start !== 1 ? ' start="' + start + '"' : '') + (task ? ' class="tasks"' : '') + '>';
    items.forEach(function (it) {
      var t = it.text, box = '';
      var tm = t.match(/^\[([ xX])\]\s+/);
      if (tm) {
        box = '<input type="checkbox"' + (tm[1] !== ' ' ? ' checked' : '') + '> ';
        t = t.slice(tm[0].length);
      }
      html += '<li>' + box + inline(t).replace(/\n/g, '<br>') + it.sub + '</li>';
    });
    return { html: html + '</' + tag + '>', next: i };
  }

  function renderMd(md, headings) {
    var lines = md.replace(/\r\n?/g, '\n').split('\n');
    var out = [], i = 0, firstH1 = true;
    while (i < lines.length) {
      var line = lines[i];
      if (!line.trim()) { i++; continue; }

      if (RE.fence.test(line)) {
        var lang = line.trim().slice(3).trim(), buf = [];
        i++;
        while (i < lines.length && !RE.fence.test(lines[i])) buf.push(lines[i++]);
        i++;
        out.push('<pre class="code"' + (lang ? ' data-lang="' + esc(lang) + '"' : '') + '><code>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }
      var h = line.match(RE.heading);
      if (h) {
        var lvl = h[1].length, txt = h[2];
        if (lvl === 1 && firstH1) { firstH1 = false; i++; continue; } // titre affiché dans l'en-tête
        var id = slug(txt), n = 2, base = id;
        while (headings && headings.ids[id]) id = base + '-' + (n++);
        if (headings) { headings.ids[id] = 1; if (lvl <= 3) headings.list.push({ id: id, lvl: lvl, text: txt }); }
        out.push('<h' + lvl + ' id="' + id + '">' + inline(txt) + '</h' + lvl + '>');
        i++;
        continue;
      }
      if (RE.hr.test(line)) { out.push('<hr>'); i++; continue; }
      if (RE.quote.test(line)) {
        var q = [];
        while (i < lines.length && RE.quote.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ''));
        out.push('<blockquote>' + renderMd(q.join('\n'), null) + '</blockquote>');
        continue;
      }
      if (isTableStart(lines, i)) {
        var head = splitRow(lines[i]);
        var align = splitRow(lines[i + 1]).map(function (c) {
          return /^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : '';
        });
        i += 2;
        var t = '<div class="table"><table><thead><tr>';
        head.forEach(function (c, k) { t += '<th' + (align[k] ? ' style="text-align:' + align[k] + '"' : '') + '>' + inline(c) + '</th>'; });
        t += '</tr></thead><tbody>';
        while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim()) {
          var cells = splitRow(lines[i++]);
          t += '<tr>';
          for (var k = 0; k < head.length; k++) {
            var c = cells[k] || '';
            t += '<td' + (align[k] ? ' style="text-align:' + align[k] + '"' : '') + (c ? '' : ' class="blank"') + '>' + inline(c) + '</td>';
          }
          t += '</tr>';
        }
        out.push(t + '</tbody></table></div>');
        continue;
      }
      if (RE.list.test(line)) {
        var r = renderList(lines, i, headings);
        out.push(r.html);
        i = r.next;
        continue;
      }
      var para = [];
      while (i < lines.length && lines[i].trim() && !RE.fence.test(lines[i]) && !RE.heading.test(lines[i]) &&
             !RE.hr.test(lines[i]) && !RE.quote.test(lines[i]) && !RE.list.test(lines[i]) && !isTableStart(lines, i)) {
        para.push(lines[i++].trim());
      }
      out.push('<p>' + inline(para.join('\n')).replace(/\n/g, '<br>') + '</p>');
    }
    return out.join('\n');
  }

  /* ------------------------------------------------------------------
   * Carte mentale : construction de l'arbre et montage du composant
   * ------------------------------------------------------------------ */
  function arbre() {
    var nFiches = DATA.docs.filter(function (d) { return d.folder !== '00'; }).length;
    return {
      id: 'root', kind: 'root', label: 'Valise employabilité',
      sub: MODULES.length + ' modules · ' + nFiches + ' fiches',
      children: GROUPS.map(function (g) {
        return {
          id: g.id, kind: 'group', label: g.label.split(' — ')[0],
          children: MODULES.filter(function (m) { return m.group === g.id; }).map(function (m) {
            var enfants = m.docs.map(function (d) {
              return {
                id: 'd:' + d.id, kind: 'doc', label: d.title, sub: '~' + d.minutes + ' min',
                icon: d.icon || '📄', href: '#/d/' + href(d.id),
                tip: d.title + (d.summary ? ' — ' + d.summary : '')
              };
            }).concat(m.files.map(function (f) {
              return {
                id: 'f:' + f.file, kind: 'file', label: f.name.replace(/\.[^.]+$/, '').replace(/-/g, ' '),
                sub: f.name.split('.').pop().toUpperCase() + ' · ' + fmtSize(f.size), icon: '⇩',
                href: href(f.file), download: true, tip: 'Télécharger ' + f.name
              };
            }));
            return {
              id: 'm:' + m.num, kind: 'module', num: m.num, label: m.title,
              sub: enfants.length + ' fiche' + (enfants.length > 1 ? 's' : ''),
              href: '#/m/' + m.num, children: enfants
            };
          })
        };
      }).filter(function (g) { return g.children.length; })
    };
  }

  /* Filtre de la carte : titres + texte intégral des fiches. */
  function carteMatch(n, q) {
    var f = fold(q);
    if (fold(n.label).indexOf(f) >= 0) return true;
    if (n.kind !== 'doc') return false;
    var rec = INDEX_BY_ID[n.id.slice(2)];
    return !!rec && rec.fplain.indexOf(f) >= 0;
  }

  var carte = null;
  function monterCarte(hote, plein) {
    if (!window.ValiseCarte || !hote) return;
    if (carte) { carte.detruire(); carte = null; }
    carte = ValiseCarte(hote, {
      tree: arbre(),
      match: carteMatch,
      wheelZoom: plein,
      hint: plein
        ? 'Cliquez un module pour déplier ses fiches · glissez pour déplacer · molette pour zoomer · ↗ ouvre la page du module'
        : 'Cliquez un module pour déplier ses fiches · glissez pour déplacer · Ctrl + molette pour zoomer',
      onOpen: closeDrawer
    });
    return carte;
  }

  /* ------------------------------------------------------------------
   * Barre latérale
   * ------------------------------------------------------------------ */
  var side = document.getElementById('side-nav');
  function buildSidebar() {
    var h = '<a class="s-link" data-route="home" href="#/"><span class="s-ic">⌂</span>Accueil</a>';
    if (SOMMAIRE) h += '<a class="s-link" data-route="d/' + esc(SOMMAIRE.id) + '" href="#/d/' + href(SOMMAIRE.id) + '"><span class="s-ic">☰</span>Sommaire général</a>';
    h += '<a class="s-link" data-route="carte" href="#/carte"><span class="s-ic">✳</span>Carte de la valise</a>';
    h += '<a class="s-link" data-route="telechargements" href="#/telechargements"><span class="s-ic">⇩</span>Téléchargements</a>';
    GROUPS.forEach(function (g) {
      var mods = MODULES.filter(function (m) { return m.group === g.id; });
      if (!mods.length) return;
      h += '<div class="s-group">' + esc(g.label.split(' — ')[0]) + '</div>';
      mods.forEach(function (m) {
        h += '<details class="s-mod" data-num="' + m.num + '"><summary>' +
          '<a class="s-link s-modlink" data-route="m/' + m.num + '" href="#/m/' + m.num + '"><span class="s-num">' + m.num + '</span>' + esc(m.title) + '</a>' +
          '</summary><div class="s-docs">';
        m.docs.forEach(function (d) {
          h += '<a class="s-doc" data-route="d/' + esc(d.id) + '" href="#/d/' + href(d.id) + '">' + esc(d.title) + '</a>';
        });
        m.files.forEach(function (f) {
          h += '<a class="s-doc s-file" href="' + href(f.file) + '" download>⇩ ' + esc(f.name) + '</a>';
        });
        h += '</div></details>';
      });
    });
    side.innerHTML = h;
    // un clic sur le titre d'un module navigue (et ouvre) sans replier
    side.addEventListener('click', function (e) {
      var a = e.target.closest('.s-modlink');
      if (a) { e.preventDefault(); a.closest('details').open = true; location.hash = a.getAttribute('href'); }
    });
  }
  function markActive(route) {
    side.querySelectorAll('[data-route]').forEach(function (a) {
      var on = a.getAttribute('data-route') === route;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var num = null, m;
    if ((m = route.match(/^m\/(\d{2})/))) num = m[1];
    else if ((m = route.match(/^d\/(.+)$/)) && DOC_BY_ID[m[1]]) num = DOC_BY_ID[m[1]].folder;
    if (num) {
      var det = side.querySelector('details[data-num="' + num + '"]');
      if (det) {
        det.open = true;
        var cur = side.querySelector('.on');
        if (cur && cur.scrollIntoView) {
          var r = cur.getBoundingClientRect(), sr = side.getBoundingClientRect();
          if (r.top < sr.top || r.bottom > sr.bottom) cur.scrollIntoView({ block: 'center' });
        }
      }
    }
  }

  /* ------------------------------------------------------------------
   * Vues
   * ------------------------------------------------------------------ */
  function crumbs(parts) {
    return '<nav class="crumbs" aria-label="Fil d’Ariane"><a href="#/">Accueil</a>' + parts.map(function (p) {
      return '<span class="sep">›</span>' + (p.href ? '<a href="' + p.href + '">' + esc(p.t) + '</a>' : '<span>' + esc(p.t) + '</span>');
    }).join('') + '</nav>';
  }
  function docCard(d) {
    return '<article class="dcard">' +
      '<a class="dcard-main" href="#/d/' + href(d.id) + '">' +
      '<div class="dcard-ic" aria-hidden="true">' + esc(d.icon || '📄') + '</div>' +
      '<div><h3>' + esc(d.title) + '</h3>' + (d.summary ? '<p>' + esc(d.summary) + '</p>' : '') +
      '<div class="meta">' + d.sections + ' sections · ~' + d.minutes + ' min de lecture</div></div></a>' +
      '<div class="dcard-act"><a class="btn" href="#/d/' + href(d.id) + '">Lire</a>' +
      (d.docx ? '<a class="btn ghost" href="' + href(d.docx) + '" download>Word</a>' : '') + '</div></article>';
  }
  function fileCard(f) {
    var ext = f.name.split('.').pop().toUpperCase();
    return '<article class="dcard file"><div class="dcard-main"><div class="dcard-ic xl" aria-hidden="true">' + esc(ext) + '</div>' +
      '<div><h3>' + esc(f.name.replace(/\.[^.]+$/, '').replace(/-/g, ' ')) + '</h3><p>Classeur ' + esc(ext) +
      ' à calcul automatique — à ouvrir dans Excel ou LibreOffice.</p><div class="meta">' + fmtSize(f.size) + '</div></div></div>' +
      '<div class="dcard-act"><a class="btn" href="' + href(f.file) + '" download>Télécharger</a></div></article>';
  }

  function viewHome(anchor) {
    var tpl = document.getElementById('tpl-home');
    app.innerHTML = tpl.innerHTML;
    var n = app.querySelector('[data-count="docs"]');
    if (n) n.textContent = DATA.docs.filter(function (d) { return d.folder !== '00'; }).length;
    var mc = app.querySelector('[data-count="modules"]');
    if (mc) mc.textContent = MODULES.filter(function (m) { return m.group !== 'ref'; }).length;
    // grille des modules (liens)
    var host = app.querySelector('#home-modules');
    if (host) {
      host.innerHTML = GROUPS.filter(function (g) { return g.id !== 'ref'; }).map(function (g) {
        var mods = MODULES.filter(function (m) { return m.group === g.id; });
        if (!mods.length) return '';
        return '<div class="group-label">' + esc(g.label) + '</div><div class="grid">' + mods.map(function (m) {
          return '<a class="mod reveal" href="#/m/' + m.num + '"><div class="num">' + m.num + '</div><h3>' + esc(m.title) +
            '</h3><p>' + esc(m.desc) + '</p><span class="tag">' + esc(m.tag || (m.docs.length + ' fiche(s)')) + '</span>' +
            '<span class="go" aria-hidden="true">→</span></a>';
        }).join('') + '</div>';
      }).join('');
    }
    monterCarte(app.querySelector('#carte-hote'), false);
    reveal();
    document.title = "Valise de l'expert en employabilité";
    if (anchor) {
      var el = document.getElementById(anchor);
      if (el) setTimeout(function () { el.scrollIntoView(); }, 0);
    }
  }

  function viewCarte(num) {
    app.innerHTML = '<div class="page wrap mapfull">' + crumbs([{ t: 'Carte de la valise' }]) +
      '<header class="dhead"><h1>Carte de la valise</h1>' +
      '<p class="lead">Les ' + MODULES.length + ' modules et leurs fiches, reliés par famille. ' +
      'Dépliez, filtrez, ouvrez — tout est à un clic.</p></header>' +
      '<div id="carte-hote"><p class="muted">Carte indisponible — utilisez le menu de gauche pour naviguer.</p></div></div>';
    document.title = 'Carte de la valise — Valise Employabilité';
    var c = monterCarte(app.querySelector('#carte-hote'), true);
    if (c && num && MOD_BY_NUM[num]) setTimeout(function () { c.ouvrirModule('m:' + num); }, 260);
  }

  function viewModule(num) {
    var m = MOD_BY_NUM[num];
    if (!m) return viewNotFound();
    var idx = MODULES.indexOf(m), prev = MODULES[idx - 1], next = MODULES[idx + 1];
    var grp = GROUPS.filter(function (g) { return g.id === m.group; })[0];
    app.innerHTML = '<div class="page wrap">' + crumbs([{ t: 'Module ' + m.num }]) +
      '<header class="mhead"><div class="mnum">' + m.num + '</div><div>' +
      '<div class="eyebrow">' + esc(grp ? grp.label : 'Module') + '</div>' +
      '<h1>' + esc(m.title) + '</h1>' + (m.desc ? '<p class="lead">' + esc(m.desc) + '</p>' : '') +
      '<div class="mstats">' + m.docs.length + ' fiche' + (m.docs.length > 1 ? 's' : '') +
      (m.files.length ? ' · ' + m.files.length + ' classeur' : '') + ' · dossier <code>' + esc(m.folder) + '/</code></div>' +
      '<div class="dactions"><a class="btn ghost" href="#/carte?m=' + m.num + '">✳ Voir dans la carte</a></div>' +
      '</div></header>' +
      '<div class="dlist">' + m.docs.map(docCard).join('') + m.files.map(fileCard).join('') + '</div>' +
      '<nav class="pager">' +
      (prev ? '<a href="#/m/' + prev.num + '"><small>← Module précédent</small>' + prev.num + ' · ' + esc(prev.title) + '</a>' : '<span></span>') +
      (next ? '<a class="nx" href="#/m/' + next.num + '"><small>Module suivant →</small>' + next.num + ' · ' + esc(next.title) + '</a>' : '<span></span>') +
      '</nav></div>';
    document.title = m.num + ' · ' + m.title + ' — Valise Employabilité';
  }

  // section : numéro de la section (## ) à atteindre, ou identifiant de titre
  function viewDoc(id, query, section) {
    var d = DOC_BY_ID[id];
    if (!d) return viewNotFound();
    var headings = { ids: {}, list: [] };
    var body = renderMd(d.md, headings);
    var pos = ORDER.indexOf(d), prev = ORDER[pos - 1], next = ORDER[pos + 1];
    var m = MOD_BY_NUM[d.folder];
    var toc = headings.list.filter(function (x) { return x.lvl === 2; });
    app.innerHTML = '<div class="page wrap docpage">' +
      crumbs(m ? [{ t: 'Module ' + m.num + ' · ' + m.title, href: '#/m/' + m.num }, { t: d.title }] : [{ t: d.title }]) +
      '<div class="doclayout"><article class="doc">' +
      '<header class="dhead"><div class="eyebrow">' + esc(modLabel(d.folder)) + '</div>' +
      '<h1><span class="dic" aria-hidden="true">' + esc(d.icon) + '</span>' + esc(d.title) + '</h1>' +
      '<div class="dactions">' +
      (d.docx ? '<a class="btn" href="' + href(d.docx) + '" download>⇩ Version Word</a>' : '') +
      '<button class="btn ghost" type="button" data-act="print">🖨 Imprimer</button>' +
      '<a class="btn ghost" href="' + href(d.file) + '" download>Source .md</a>' +
      '<button class="btn ghost" type="button" data-act="copy">🔗 Copier le lien</button>' +
      '</div></header>' +
      '<div class="md">' + body + '</div>' +
      '<nav class="pager">' +
      (prev ? '<a href="#/d/' + href(prev.id) + '"><small>← Fiche précédente</small>' + esc(prev.title) + '</a>' : '<span></span>') +
      (next ? '<a class="nx" href="#/d/' + href(next.id) + '"><small>Fiche suivante →</small>' + esc(next.title) + '</a>' : '<span></span>') +
      '</nav></article>' +
      (toc.length > 1 ? '<aside class="toc" aria-label="Dans cette fiche"><div class="toc-t">Dans cette fiche</div>' +
        toc.map(function (x) { return '<a href="#' + x.id + '" data-scroll="' + x.id + '">' + inline(x.text) + '</a>'; }).join('') +
        '</aside>' : '') +
      '</div></div>';
    document.title = d.title + ' — Valise Employabilité';
    spy();
    if (query) highlight(app.querySelector('.md'), query);
    else if (section) {
      var target = /^\d+$/.test(section) ? toc[+section - 1] : { id: section };
      var el = target && document.getElementById(target.id);
      if (el) setTimeout(function () { el.scrollIntoView(); el.classList.add('flash'); }, 0);
    }
  }

  function viewDownloads() {
    var h = '<div class="page wrap">' + crumbs([{ t: 'Téléchargements' }]) +
      '<header class="mhead plain"><div><div class="eyebrow">Tous les fichiers</div><h1>Téléchargements</h1>' +
      '<p class="lead">Chaque fiche existe en version Word (.docx) prête à imprimer et à remplir, et en source Markdown.</p></div></header>';
    var groups = [{ num: '00', title: 'Sommaire général', docs: SOMMAIRE ? [SOMMAIRE] : [], files: [] }].concat(MODULES);
    h += groups.map(function (m) {
      if (!m.docs.length && !m.files.length) return '';
      return '<section class="dlgroup"><h2><a href="' + (m.num === '00' ? '#/d/' + href(SOMMAIRE.id) : '#/m/' + m.num) + '">' +
        (m.num === '00' ? '' : '<span class="s-num">' + m.num + '</span>') + esc(m.title) + '</a></h2><table class="dltable"><tbody>' +
        m.docs.map(function (d) {
          return '<tr><td><a href="#/d/' + href(d.id) + '">' + esc(d.title) + '</a></td><td class="r">' +
            (d.docx ? '<a class="btn sm" href="' + href(d.docx) + '" download>.docx</a>' : '') +
            '<a class="btn sm ghost" href="' + href(d.file) + '" download>.md</a></td></tr>';
        }).join('') +
        m.files.map(function (f) {
          return '<tr><td>' + esc(f.name) + ' <span class="muted">· ' + fmtSize(f.size) + '</span></td><td class="r">' +
            '<a class="btn sm" href="' + href(f.file) + '" download>.' + esc(f.name.split('.').pop()) + '</a></td></tr>';
        }).join('') + '</tbody></table></section>';
    }).join('');
    app.innerHTML = h + '</div>';
    document.title = 'Téléchargements — Valise Employabilité';
  }

  function viewNotFound() {
    app.innerHTML = '<div class="page wrap empty"><h1>Page introuvable</h1><p>Cette rubrique n’existe pas ou a été déplacée.</p>' +
      '<p><a class="btn" href="#/">Retour à l’accueil</a></p></div>';
    document.title = 'Introuvable — Valise Employabilité';
  }

  /* ------------------------------------------------------------------
   * Routeur
   * ------------------------------------------------------------------ */
  var HOME_ANCHORS = { parcours: 1, modules: 1, publics: 1, competences: 1, formats: 1, references: 1 };
  function route() {
    var raw = location.hash.replace(/^#/, '');
    // ancres internes à la fiche : on défile sans changer de vue
    if (/^s-/.test(raw) && document.getElementById(raw)) { document.getElementById(raw).scrollIntoView(); return; }
    var path = raw.replace(/^\//, ''), params = {};
    var qi = path.indexOf('?');
    if (qi >= 0) {
      path.slice(qi + 1).split('&').forEach(function (kv) {
        var p = kv.split('=');
        try { params[p[0]] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); } catch (e) { params[p[0]] = p[1]; }
      });
      path = path.slice(0, qi);
    }
    var query = params.q || '', section = params.s || '';
    try { path = decodeURI(path); } catch (e) { /* garde tel quel */ }
    var key = 'home', m;
    closeDrawer();
    closeSearch();
    if (!path || path === 'accueil') viewHome();
    else if (HOME_ANCHORS[path]) viewHome(path);
    else if (path === 'carte') { key = 'carte'; viewCarte(params.m); }
    else if ((m = path.match(/^m\/(\d{2})$/))) { key = 'm/' + m[1]; viewModule(m[1]); }
    else if ((m = path.match(/^d\/(.+)$/))) { key = 'd/' + m[1]; viewDoc(m[1], query, section); }
    else if (path === 'telechargements') { key = 'telechargements'; viewDownloads(); }
    else { key = ''; viewNotFound(); }
    markActive(key);
    if (!HOME_ANCHORS[path] && !query && !section) window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------
   * Sommaire de fiche : défilement + suivi de la section courante
   * ------------------------------------------------------------------ */
  var spyObs = null;
  function spy() {
    if (spyObs) spyObs.disconnect();
    var toc = app.querySelector('.toc');
    if (!toc || !('IntersectionObserver' in window)) return;
    var links = {};
    toc.querySelectorAll('[data-scroll]').forEach(function (a) { links[a.getAttribute('data-scroll')] = a; });
    spyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          toc.querySelectorAll('.on').forEach(function (x) { x.classList.remove('on'); });
          links[en.target.id].classList.add('on');
        }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    Object.keys(links).forEach(function (id) { var el = document.getElementById(id); if (el) spyObs.observe(el); });
  }

  app.addEventListener('click', function (e) {
    var s = e.target.closest('[data-scroll]');
    if (s) {
      e.preventDefault();
      var el = document.getElementById(s.getAttribute('data-scroll'));
      if (el) el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      return;
    }
    var act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.getAttribute('data-act') === 'print') window.print();
    if (act.getAttribute('data-act') === 'copy') {
      var url = location.href.replace(/\?q=[^#]*$/, '');
      var done = function () { var t = act.textContent; act.textContent = '✓ Lien copié'; setTimeout(function () { act.textContent = t; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Lien :', url); });
      else prompt('Lien :', url);
    }
  });

  /* ------------------------------------------------------------------
   * Recherche plein texte
   * ------------------------------------------------------------------ */
  var INDEX = DATA.docs.map(function (d) {
    var plain = d.md.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*`|]/g, ' ').replace(/-{3,}/g, ' ')
      .replace(/_{3,}/g, ' ').replace(/[ \t]+/g, ' ');
    return { d: d, plain: plain, fplain: fold(plain), ftitle: fold(d.title) };
  });
  var INDEX_BY_ID = {};
  INDEX.forEach(function (r) { INDEX_BY_ID[r.d.id] = r; });

  function search(q) {
    var terms = fold(q).split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) return [];
    var res = [];
    INDEX.forEach(function (x) {
      var score = 0, first = -1;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i], inT = x.ftitle.indexOf(t) >= 0, p = x.fplain.indexOf(t);
        if (!inT && p < 0) return;
        if (inT) score += 20;
        if (p >= 0) {
          if (first < 0 || p < first) first = p;
          var c = 0, from = 0;
          while ((from = x.fplain.indexOf(t, from)) >= 0 && c < 50) { c++; from += t.length; }
          score += c;
        }
      }
      res.push({ d: x.d, score: score, snip: snippet(x, first, terms) });
    });
    return res.sort(function (a, b) { return b.score - a.score; }).slice(0, 12);
  }
  function snippet(x, pos, terms) {
    if (pos < 0) return esc(x.d.summary || '');
    var a = Math.max(0, pos - 60), b = Math.min(x.plain.length, pos + 110);
    while (a > 0 && /\S/.test(x.plain[a - 1])) a--;
    var raw = x.plain.slice(a, b).replace(/\s+/g, ' '), fr = fold(raw), marks = [];
    terms.forEach(function (t) {
      var i = 0;
      while ((i = fr.indexOf(t, i)) >= 0) { marks.push([i, i + t.length]); i += t.length; }
    });
    marks.sort(function (p, q) { return p[0] - q[0]; });
    var html = '', last = 0;
    marks.forEach(function (m) {
      if (m[0] < last) return;
      html += esc(raw.slice(last, m[0])) + '<mark>' + esc(raw.slice(m[0], m[1])) + '</mark>';
      last = m[1];
    });
    return (a > 0 ? '… ' : '') + html + esc(raw.slice(last)) + (b < x.plain.length ? ' …' : '');
  }

  function highlight(root, q) {
    var terms = fold(q).split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!root || !terms.length) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    var firstMark = null;
    nodes.forEach(function (node) {
      var text = node.nodeValue, ft = fold(text), ranges = [];
      terms.forEach(function (t) { var i = 0; while ((i = ft.indexOf(t, i)) >= 0) { ranges.push([i, i + t.length]); i += t.length; } });
      if (!ranges.length) return;
      ranges.sort(function (a, b) { return a[0] - b[0]; });
      var frag = document.createDocumentFragment(), last = 0;
      ranges.forEach(function (r) {
        if (r[0] < last) return;
        frag.appendChild(document.createTextNode(text.slice(last, r[0])));
        var mk = document.createElement('mark');
        mk.textContent = text.slice(r[0], r[1]);
        frag.appendChild(mk);
        if (!firstMark) firstMark = mk;
        last = r[1];
      });
      frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
    if (firstMark) setTimeout(function () { firstMark.scrollIntoView({ block: 'center' }); }, 30);
  }

  var sInput = document.getElementById('q'), sPanel = document.getElementById('q-results'), sTimer, sSel = -1;
  function renderResults() {
    var q = sInput.value.trim();
    if (q.length < 2) { closeSearch(); return; }
    var res = search(q);
    sSel = -1;
    sPanel.innerHTML = res.length ? res.map(function (r) {
      return '<a class="sr" href="#/d/' + href(r.d.id) + '?q=' + encodeURIComponent(q) + '">' +
        '<span class="sr-m">' + esc(modLabel(r.d.folder)) + '</span>' +
        '<span class="sr-t">' + esc(r.d.icon + ' ' + r.d.title) + '</span>' +
        '<span class="sr-s">' + r.snip + '</span></a>';
    }).join('') : '<div class="sr-none">Aucun résultat pour « ' + esc(q) + ' »</div>';
    sPanel.hidden = false;
    sInput.setAttribute('aria-expanded', 'true');
  }
  function closeSearch() { sPanel.hidden = true; sInput.setAttribute('aria-expanded', 'false'); }
  sInput.addEventListener('input', function () { clearTimeout(sTimer); sTimer = setTimeout(renderResults, 120); });
  sInput.addEventListener('focus', function () { if (sInput.value.trim().length > 1) renderResults(); });
  sInput.addEventListener('keydown', function (e) {
    var items = sPanel.querySelectorAll('.sr');
    if (e.key === 'Escape') { closeSearch(); sInput.blur(); return; }
    if (!items.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sSel = (sSel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach(function (x, i) { x.classList.toggle('sel', i === sSel); });
      items[sSel].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter') { e.preventDefault(); location.hash = items[Math.max(0, sSel)].getAttribute('href'); sInput.blur(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search')) closeSearch();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); sInput.focus(); sInput.select(); }
  });

  /* ------------------------------------------------------------------
   * Tiroir mobile, thème, animations
   * ------------------------------------------------------------------ */
  var body = document.body, menuBtn = document.getElementById('menu');
  function closeDrawer() { body.classList.remove('drawer'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var on = body.classList.toggle('drawer');
    menuBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
  });
  document.getElementById('scrim').addEventListener('click', closeDrawer);

  var root = document.documentElement, saved = storage('valise-theme');
  if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  document.getElementById('tg').addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var nxt = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', nxt);
    storage('valise-theme', nxt);
  });

  function reveal() {
    var els = app.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  }

  buildSidebar();
  window.addEventListener('hashchange', route);
  route();
})();
