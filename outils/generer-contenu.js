/*
 * Génère assets/contenu.js à partir des dossiers de la valise.
 * À relancer après chaque ajout / modification d'une fiche .md :
 *     node outils/generer-contenu.js      (ou double-clic sur outils/METTRE-A-JOUR.bat)
 *
 * Le fichier produit embarque le texte de toutes les fiches : l'interface fonctionne
 * donc aussi bien en local (double-clic sur le .html) que sur un serveur web.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'contenu.js');
const WORD_DIR = 'VERSION-WORD';

// Sigles et noms propres à préserver lors de la mise en casse des titres
const KEEP = ['CV', 'LinkedIn', 'IA', 'TRE', 'KPI', 'ANAPEC', 'STAR', 'GROW', 'VAE', 'ATS',
  'RH', 'RDV', 'PME', 'TPE', 'Excel', 'Maroc', 'SMART', 'OIT', 'OCDE', 'BIT', 'ISO', 'Facebook', 'WhatsApp', 'TikTok', 'Instagram'];

const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
const exists = p => { try { fs.accessSync(p); return true; } catch { return false; } };

function prettyTitle(h1, fallback) {
  if (!h1) return { icon: '', title: fallback };
  const m = h1.match(/^([^\p{L}\p{N}]+)\s*/u);
  const icon = m ? m[1].trim() : '';
  let t = h1.slice(m ? m[0].length : 0).trim().toLocaleLowerCase('fr');
  t = t.charAt(0).toLocaleUpperCase('fr') + t.slice(1);
  for (const w of KEEP) {
    t = t.replace(new RegExp('(?<![\\p{L}])' + w.toLowerCase() + '(?![\\p{L}])', 'gu'), w);
  }
  t = t.replace(/« (\p{Ll})/gu, (_, c) => '« ' + c.toLocaleUpperCase('fr'));
  return { icon, title: t };
}

function summary(md) {
  const lines = [];
  for (const l of md.split(/\r?\n/)) {
    if (/^>/.test(l)) lines.push(l.replace(/^>\s?/, ''));
    else if (lines.length) break;
  }
  const s = lines.join(' ').replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();
  return s.length > 220 ? s.slice(0, 217).replace(/\s+\S*$/, '') + '…' : s;
}

function docEntry(absMd, folder) {
  const md = fs.readFileSync(absMd, 'utf8').replace(/^﻿/, '');
  const h1 = (md.match(/^#\s+(.+)$/m) || [])[1];
  const base = path.basename(absMd, '.md');
  const { icon, title } = prettyTitle(h1, base.replace(/-/g, ' '));
  const r = rel(absMd);
  const docx = path.join(ROOT, WORD_DIR, r.replace(/\.md$/, '.docx'));
  const words = md.replace(/[#>*|`_-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return {
    id: r.replace(/\.md$/, ''),
    folder,
    file: r,
    icon,
    title,
    summary: summary(md),
    sections: (md.match(/^##\s+/gm) || []).length,
    minutes: Math.max(1, Math.round(words / 200)),
    docx: exists(docx) ? rel(docx) : null,
    md
  };
}

const docs = [];
const attachments = [];

// Sommaire général (racine)
const readme = path.join(ROOT, '00-README-SOMMAIRE.md');
if (exists(readme)) docs.push(docEntry(readme, '00'));

const folders = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && /^\d{2}-/.test(d.name))
  .map(d => d.name)
  .sort();

const modules = folders.map(name => {
  const num = name.slice(0, 2);
  const dir = path.join(ROOT, name);
  const files = fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, 'fr'));
  for (const f of files) {
    const abs = path.join(dir, f);
    if (!fs.statSync(abs).isFile()) continue;
    if (/\.md$/i.test(f)) docs.push(docEntry(abs, num));
    else attachments.push({ folder: num, file: rel(abs), name: f, size: fs.statSync(abs).size });
  }
  return { num, folder: name };
});

const data = { generated: new Date().toISOString(), modules, docs, attachments };
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT,
  '/* Fichier généré par outils/generer-contenu.js — ne pas modifier à la main. */\n' +
  'window.VALISE_CONTENU = ' + JSON.stringify(data) + ';\n', 'utf8');

console.log(`OK : ${modules.length} modules, ${docs.length} fiches, ${attachments.length} pièce(s) jointe(s) → ${rel(OUT)}`);
