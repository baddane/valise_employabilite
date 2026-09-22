/* Valise Employabilité — carte mentale interactive.
 * Composant autonome, sans dépendance : un arbre à deux branches (gauche / droite)
 * dont les nœuds sont de vrais boutons et liens HTML — donc utilisables au clavier
 * et annoncés par les lecteurs d'écran — posés sur une couche SVG qui dessine les
 * liaisons. Dépliage, zoom et déplacement animés.
 *
 * Usage :  var carte = ValiseCarte(hote, { tree: …, match: fn, onOpen: fn });
 */
(function () {
  'use strict';

  /* Géométrie : distance au centre par niveau, hauteur d'une ligne. */
  /* Les hauteurs de nœud sont figées en CSS : la disposition peut donc être
   * calculée sans mesurer le DOM. Toute modification ici doit suivre le CSS. */
  var LARGE = { xg: 152, xm: 352, xd: 610, rowDoc: 60, rowMod: 62, gapMod: 8, gapGroup: 28 };
  var ETROIT = { xg: 112, xm: 250, xd: 442, rowDoc: 58, rowMod: 60, gapMod: 6, gapGroup: 20 };
  var LARGEUR = { root: 210, group: 160, module: 204, doc: 258, file: 258 };
  var HAUTEUR = { root: 92, group: 42, module: 56, doc: 52, file: 52 };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  window.ValiseCarte = function (host, opts) {
    opts = opts || {};
    var tree = opts.tree;
    var zoomMolette = opts.wheelZoom === true;
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------------------------------------------------------- DOM */
    host.classList.add('mm');
    host.innerHTML =
      '<div class="mm-bar">' +
      '  <div class="mm-find">' +
      '    <span class="mm-find-ic" aria-hidden="true">⌕</span>' +
      '    <input type="search" class="mm-input" placeholder="Filtrer la carte…" aria-label="Filtrer la carte">' +
      '  </div>' +
      '  <div class="mm-tools">' +
      '    <button type="button" class="mm-btn mm-btn-t" data-mm="collapse">Tout replier</button>' +
      '    <button type="button" class="mm-btn" data-mm="out" title="Dézoomer" aria-label="Dézoomer">−</button>' +
      '    <button type="button" class="mm-btn" data-mm="fit" title="Recentrer" aria-label="Recentrer">⤢</button>' +
      '    <button type="button" class="mm-btn" data-mm="in" title="Zoomer" aria-label="Zoomer">+</button>' +
      '  </div>' +
      '</div>' +
      '<div class="mm-view" tabindex="0" role="region" aria-label="Carte de la valise — flèches pour déplacer, + et − pour zoomer">' +
      '  <div class="mm-stage"><svg class="mm-links" aria-hidden="true" focusable="false"></svg><div class="mm-nodes"></div></div>' +
      '</div>' +
      '<p class="mm-hint">' + esc(opts.hint || 'Cliquez un module pour déplier ses fiches · glissez pour déplacer · Ctrl + molette pour zoomer') + '</p>';

    var view = host.querySelector('.mm-view');
    var stage = host.querySelector('.mm-stage');
    var links = host.querySelector('.mm-links');
    var nodes = host.querySelector('.mm-nodes');
    var input = host.querySelector('.mm-input');

    /* ------------------------------------------------------- état interne */
    var ouvert = null;    // identifiant du module déplié (un seul à la fois)
    var filtre = '';      // texte du filtre en cours
    var vus = {};         // identifiant -> élément DOM déjà créé
    var index = {};       // identifiant -> nœud du modèle
    var k = 1, tx = 0, ty = 0;              // zoom et déplacement
    var box = { x: 0, y: 0, w: 1, h: 1 };   // boîte englobante du dessin
    var geo = LARGE;

    function largeur(n) { return LARGEUR[n.kind] || 200; }

    /* Abscisse du bord d'où part (ou où arrive) une liaison. */
    function bordSortie(p, cote) {
      var w = largeur(p);
      if (p.kind === 'root') return cote === 'g' ? -w / 2 : w / 2;
      return p._cote === 'g' ? p._x - w : p._x + w;
    }

    /* --------------------------------------------------------- disposition
     * Chaque famille de modules part à gauche ou à droite du centre ; ses
     * modules s'empilent verticalement et les fiches du module déplié se
     * déploient vers l'extérieur. Sur écran étroit, tout passe du même côté. */
    function place() {
      var uneColonne = view.clientWidth < 720;
      geo = uneColonne ? ETROIT : LARGE;
      var plan = [];
      var cotes = { d: [], g: [] };
      var groupes = tree.children.filter(function (g) {
        return g.children.some(moduleRetenu);
      });
      groupes.forEach(function (g, i) {
        cotes[uneColonne ? 'd' : (i % 2 ? 'g' : 'd')].push(g);
      });

      ['d', 'g'].forEach(function (cote) {
        var sens = cote === 'd' ? 1 : -1;
        var y = 0;
        cotes[cote].forEach(function (g, gi) {
          if (gi) y += geo.gapGroup;
          var debutG = y;
          g.children.filter(moduleRetenu).forEach(function (m, mi) {
            if (mi) y += geo.gapMod;
            var fiches = ouvert === m.id ? m.children : [];
            if (!fiches.length) {
              m._y = y + geo.rowMod / 2;
              y += geo.rowMod;
            } else {
              var debutM = y;
              fiches.forEach(function (d) {
                d._y = y + geo.rowDoc / 2;
                d._x = sens * geo.xd;
                d._cote = cote;
                y += geo.rowDoc;
              });
              m._y = (debutM + y) / 2;
            }
            m._x = sens * geo.xm;
            m._cote = cote;
            plan.push(m);
            if (fiches.length) plan.push.apply(plan, fiches);
          });
          g._y = (debutG + y) / 2;
          g._x = sens * geo.xg;
          g._cote = cote;
          plan.push(g);
        });
        // recentre le côté sur l'axe horizontal du nœud racine
        var dec = y / 2;
        cotes[cote].forEach(function (g) {
          g._y -= dec;
          g.children.filter(moduleRetenu).forEach(function (m) {
            m._y -= dec;
            if (ouvert === m.id) m.children.forEach(function (d) { d._y -= dec; });
          });
        });
      });

      tree._x = 0; tree._y = 0; tree._cote = 'c';
      plan.push(tree);
      return plan;
    }

    /* ------------------------------------------------------------ filtrage */
    function correspond(n) {
      if (!filtre) return true;
      if (opts.match) return opts.match(n, filtre);
      return n.label.toLowerCase().indexOf(filtre) >= 0;
    }
    function moduleRetenu(m) {
      return !filtre || correspond(m) || m.children.some(correspond);
    }

    /* --------------------------------------------------------- rendu nœuds */
    function contenu(n) {
      if (n.kind === 'root') {
        return '<span class="mm-mark" aria-hidden="true"></span>' +
          '<span class="mm-t">' + esc(n.label) + '</span>' +
          (n.sub ? '<span class="mm-s">' + esc(n.sub) + '</span>' : '');
      }
      if (n.kind === 'group') {
        return '<span class="mm-t">' + esc(n.label) + '</span>' +
          (n.sub ? '<span class="mm-s">' + esc(n.sub) + '</span>' : '');
      }
      if (n.kind === 'module') {
        return '<span class="mm-n" aria-hidden="true">' + esc(n.num) + '</span>' +
          '<span class="mm-t">' + esc(n.label) + '</span>' +
          '<span class="mm-s">' + esc(n.sub) + '</span>' +
          '<span class="mm-chev" aria-hidden="true">›</span>';
      }
      return '<span class="mm-ic" aria-hidden="true">' + esc(n.icon || '📄') + '</span>' +
        '<span class="mm-t">' + esc(n.label) + '</span>' +
        (n.sub ? '<span class="mm-s">' + esc(n.sub) + '</span>' : '');
    }

    function creer(n) {
      var e;
      if (n.kind === 'module') {
        // enveloppe : un bouton (déplier) + un lien (ouvrir la page du module)
        e = el('div', 'mm-node is-module');
        var b = el('button', 'mm-main', contenu(n));
        b.type = 'button';
        b.setAttribute('aria-expanded', 'false');
        b.title = 'Déplier les fiches du module ' + n.num;
        b.addEventListener('click', function (ev) { ev.preventDefault(); basculer(n.id); });
        b.addEventListener('focus', function () { amener(n); });
        var go = el('a', 'mm-go', '<span aria-hidden="true">↗</span>');
        go.href = n.href;
        go.setAttribute('aria-label', 'Ouvrir la page du module ' + n.num + ' — ' + n.label);
        go.addEventListener('click', function () { if (opts.onOpen) opts.onOpen(n); });
        e.appendChild(b);
        e.appendChild(go);
      } else if (n.kind === 'root') {
        e = el('button', 'mm-node is-root', contenu(n));
        e.type = 'button';
        e.title = 'Tout replier et recentrer';
        e.addEventListener('click', function () { ouvert = null; rendre(true); });
      } else {
        e = el('a', 'mm-node is-' + n.kind, contenu(n));
        e.href = n.href;
        if (n.download) e.setAttribute('download', '');
        if (n.tip) e.title = n.tip;
        e.addEventListener('click', function () { if (!n.download && opts.onOpen) opts.onOpen(n); });
        e.addEventListener('focus', function () { amener(n); });
      }
      e.setAttribute('data-mm-id', n.id);
      if (n.branch) e.setAttribute('data-branch', n.branch);
      nodes.appendChild(e);
      vus[n.id] = e;
      requestAnimationFrame(function () { e.classList.add('mm-in'); });
      return e;
    }

    function rendre(recentrer) {
      var plan = place();

      // boîte englobante (les nœuds sont ancrés vers l'extérieur)
      var minX = -120, maxX = 120, minY = -40, maxY = 40;
      plan.forEach(function (n) {
        var w = largeur(n);
        var x1 = n._cote === 'g' ? n._x - w : n._cote === 'c' ? -w / 2 : n._x;
        minX = Math.min(minX, x1); maxX = Math.max(maxX, x1 + w);
        var h = (HAUTEUR[n.kind] || 48) / 2;
        minY = Math.min(minY, n._y - h); maxY = Math.max(maxY, n._y + h);
      });
      box = { x: minX - 24, y: minY - 24, w: maxX - minX + 48, h: maxY - minY + 48 };
      stage.style.width = box.w + 'px';
      stage.style.height = box.h + 'px';
      links.setAttribute('viewBox', box.x + ' ' + box.y + ' ' + box.w + ' ' + box.h);
      links.setAttribute('width', box.w);
      links.setAttribute('height', box.h);

      // nœuds : création, position, états
      var presents = {};
      plan.forEach(function (n) {
        presents[n.id] = 1;
        var e = vus[n.id] || creer(n);
        var ancre = n._cote === 'g' ? 'translate(-100%,-50%)' : n._cote === 'c' ? 'translate(-50%,-50%)' : 'translate(0,-50%)';
        e.style.transform = 'translate(' + (n._x - box.x) + 'px,' + (n._y - box.y) + 'px) ' + ancre;
        e.setAttribute('data-cote', n._cote);
        // on n'atténue que les fiches : modules et familles sont le chemin vers le résultat
        e.classList.toggle('mm-dim', !!filtre && !correspond(n) && (n.kind === 'doc' || n.kind === 'file'));
        e.classList.toggle('mm-on', n.kind === 'module' && ouvert === n.id);
        if (n.kind === 'module') e.firstChild.setAttribute('aria-expanded', ouvert === n.id ? 'true' : 'false');
      });
      Object.keys(vus).forEach(function (id) {
        if (presents[id]) return;
        var e = vus[id];
        delete vus[id];
        e.classList.remove('mm-in');
        setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, reduced ? 0 : 200);
      });

      // liaisons
      var d = '';
      plan.forEach(function (n) {
        var p = n.parent;
        if (!p || !presents[p.id]) return;
        var x1 = bordSortie(p, n._cote), x2 = n._x;
        var mx = (x1 + x2) / 2;
        d += '<path class="mm-link' + (n.kind === 'doc' || n.kind === 'file' ? ' mm-link-on' : '') + '"' +
          (n.branch ? ' data-branch="' + esc(n.branch) + '"' : '') +
          ' d="M' + x1 + ',' + p._y + ' C' + mx + ',' + p._y + ' ' + mx + ',' + n._y + ' ' + x2 + ',' + n._y + '"/>';
      });
      links.innerHTML = d;

      if (recentrer) ajuster();
    }

    /* ------------------------------------------------------ zoom & cadrage */
    function appliquer(anim) {
      stage.style.transition = anim && !reduced ? 'transform .32s cubic-bezier(.4,0,.2,1)' : 'none';
      stage.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + k + ')';
    }
    function ajuster(anim) {
      var vw = view.clientWidth, vh = view.clientHeight;
      if (!vw || !vh) return;
      k = clamp(Math.min((vw - 24) / box.w, (vh - 24) / box.h), 0.62, 1);
      tx = (vw - box.w * k) / 2;
      ty = (vh - box.h * k) / 2;
      appliquer(anim !== false);
    }
    function zoomer(f, cx, cy) {
      var vw = view.clientWidth, vh = view.clientHeight;
      cx = cx == null ? vw / 2 : cx;
      cy = cy == null ? vh / 2 : cy;
      var nk = clamp(k * f, 0.3, 2.2);
      tx = cx - (cx - tx) * (nk / k);
      ty = cy - (cy - ty) * (nk / k);
      k = nk;
      appliquer(true);
    }
    /* Ramène un nœud dans le champ visible, sans toucher au zoom. */
    function amener(n) {
      if (n._x == null) return;
      var vw = view.clientWidth, vh = view.clientHeight, m = 48;
      var w = largeur(n) * k;
      var x = (n._x - box.x) * k + tx;
      var g = n._cote === 'g' ? x - w : n._cote === 'c' ? x - w / 2 : x;
      var y = (n._y - box.y) * k + ty;
      var dx = 0, dy = 0;
      if (g < m) dx = m - g; else if (g + w > vw - m) dx = vw - m - g - w;
      if (y < m) dy = m - y; else if (y > vh - m) dy = vh - m - y;
      if (dx || dy) { tx += dx; ty += dy; appliquer(true); }
    }

    /* Après un dépliage : si toute la carte tient encore à l'écran sans trop
     * rapetisser, on la recadre ; sinon on garde le zoom et on amène la branche. */
    function cadrer(n) {
      if (!n || !n.children.length) { ajuster(true); return; }
      var vw = view.clientWidth, vh = view.clientHeight;
      if (Math.min((vw - 24) / box.w, (vh - 24) / box.h) >= 0.68) { ajuster(true); return; }
      setTimeout(function () {
        amener(n.children[0]);
        amener(n.children[n.children.length - 1]);
        amener(n);
      }, 30);
    }

    function basculer(id) {
      ouvert = ouvert === id ? null : id;
      rendre(false);
      cadrer(ouvert ? index[id] : null);
    }

    /* ------------------------------------------------------------ pointeur */
    var drag = null, pointeurs = {}, ecart0 = 0, k0 = 1;
    view.addEventListener('pointerdown', function (e) {
      pointeurs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pointeurs);
      if (ids.length === 2) {
        var a = pointeurs[ids[0]], b = pointeurs[ids[1]];
        ecart0 = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        k0 = k;
        drag = null;
        return;
      }
      if (e.target.closest('.mm-node')) return;
      drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
      view.setPointerCapture(e.pointerId);
      view.classList.add('mm-grab');
    });
    view.addEventListener('pointermove', function (e) {
      if (pointeurs[e.pointerId]) { pointeurs[e.pointerId].x = e.clientX; pointeurs[e.pointerId].y = e.clientY; }
      var ids = Object.keys(pointeurs);
      if (ids.length === 2) {
        var a = pointeurs[ids[0]], b = pointeurs[ids[1]];
        var dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        var r = view.getBoundingClientRect();
        var nk = clamp(k0 * (dist / ecart0), 0.3, 2.2);
        var cx = (a.x + b.x) / 2 - r.left, cy = (a.y + b.y) / 2 - r.top;
        tx = cx - (cx - tx) * (nk / k); ty = cy - (cy - ty) * (nk / k); k = nk;
        appliquer(false);
        return;
      }
      if (!drag) return;
      tx = drag.tx + (e.clientX - drag.x);
      ty = drag.ty + (e.clientY - drag.y);
      appliquer(false);
    });
    function finPointeur(e) {
      delete pointeurs[e.pointerId];
      if (drag) { drag = null; view.classList.remove('mm-grab'); }
    }
    view.addEventListener('pointerup', finPointeur);
    view.addEventListener('pointercancel', finPointeur);

    /* Molette : zoome si la carte occupe l'écran, sinon laisse la page défiler
     * (Ctrl + molette et le pincement du trackpad zooment toujours). */
    view.addEventListener('wheel', function (e) {
      if (!zoomMolette && !e.ctrlKey) return;
      e.preventDefault();
      var r = view.getBoundingClientRect();
      zoomer(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    /* Clavier : déplacement aux flèches quand la zone de carte a le focus. */
    view.addEventListener('keydown', function (e) {
      if (e.target !== view) return;
      var pas = e.shiftKey ? 160 : 60, fait = true;
      if (e.key === 'ArrowLeft') tx += pas;
      else if (e.key === 'ArrowRight') tx -= pas;
      else if (e.key === 'ArrowUp') ty += pas;
      else if (e.key === 'ArrowDown') ty -= pas;
      else if (e.key === '+' || e.key === '=') zoomer(1.2);
      else if (e.key === '-') zoomer(1 / 1.2);
      else if (e.key === '0') ajuster(true);
      else fait = false;
      if (fait) { e.preventDefault(); if (e.key.indexOf('Arrow') === 0) appliquer(true); }
    });

    host.querySelector('.mm-tools').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mm]');
      if (!b) return;
      var a = b.getAttribute('data-mm');
      if (a === 'in') zoomer(1.2);
      else if (a === 'out') zoomer(1 / 1.2);
      else if (a === 'fit') ajuster(true);
      else if (a === 'collapse') { ouvert = null; rendre(true); }
    });

    var tFiltre;
    function appliquerFiltre() {
      var v = input.value.trim().toLowerCase();
      if (v === filtre) return;
      filtre = v;
      host.classList.toggle('mm-filtre', !!filtre);
      if (filtre) {
        // déplie le premier module dont une fiche correspond
        var cible = null;
        tree.children.forEach(function (g) {
          g.children.forEach(function (m) {
            if (!cible && !correspond(m) && m.children.some(correspond)) cible = m.id;
          });
        });
        ouvert = cible;
      }
      rendre(true);
    }
    input.addEventListener('input', function () {
      clearTimeout(tFiltre);
      tFiltre = setTimeout(appliquerFiltre, 160);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; clearTimeout(tFiltre); appliquerFiltre(); }
    });

    var tRedim;
    var ro = window.ResizeObserver ? new ResizeObserver(function () {
      clearTimeout(tRedim);
      tRedim = setTimeout(function () { rendre(true); }, 120);
    }) : null;
    if (ro) ro.observe(view);

    /* --------------------------------------------- indexation puis premier rendu */
    (function indexer(n, parent, branche) {
      n.parent = parent || null;
      n.branch = n.kind === 'group' ? n.id : branche;
      n.children = n.children || [];
      index[n.id] = n;
      n.children.forEach(function (c) { indexer(c, n, n.branch); });
    })(tree, null, null);

    rendre(true);

    return {
      ouvrirModule: function (id) {
        if (!index[id] || ouvert === id) return;
        ouvert = id;
        rendre(false);
        cadrer(index[id]);
      },
      recentrer: function () { ajuster(true); },
      detruire: function () {
        if (ro) ro.disconnect();
        clearTimeout(tFiltre); clearTimeout(tRedim);
        host.innerHTML = '';
        host.classList.remove('mm', 'mm-filtre');
      }
    };
  };
})();
