# 🚀 Déploiement de la valise

La valise est un **site statique** : pas de base de données, pas de build, pas de
dépendances. Tout le contenu des fiches est embarqué dans `assets/contenu.js`,
généré depuis les fichiers `.md` par `outils/generer-contenu.js`.

---

## 1. Déployer sur Vercel

### Depuis GitHub (recommandé)

1. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer le dépôt.
2. Laisser les réglages par défaut :
   - **Framework Preset** : `Other`
   - **Build Command** : *(vide)*
   - **Output Directory** : `.` (racine)
   - **Install Command** : *(vide)*
3. **Deploy**. Le fichier `vercel.json` du dépôt applique tout le reste.

Chaque `git push` sur la branche de production redéploie le site ; les autres
branches produisent une *preview* avec sa propre URL.

### Depuis la ligne de commande

```bash
npm i -g vercel
vercel          # déploiement de test (preview)
vercel --prod   # mise en production
```

---

## 2. Ce que fait `vercel.json`

| Réglage | Effet |
|---|---|
| `redirects` | `/` renvoie directement vers `Presentation-valise.html` (307), sans écran intermédiaire |
| `headers` (global) | `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` |
| `headers` HTML & JS | `must-revalidate` : une mise à jour de fiche est visible immédiatement |
| `headers` `.md` / `.docx` / `.xlsx` | types MIME corrects + cache d'une heure pour les téléchargements |
| `framework: null`, `outputDirectory: "."` | site statique servi depuis la racine, aucun build |

`.vercelignore` empêche la publication des fichiers de travail (`outils/`,
`.claude/`, scripts `.py` et `.bat`) : ils restent dans le dépôt mais ne sont
jamais servis, comme le faisait la règle `RewriteRule ^outils/` du `.htaccess`.

---

## 3. Mettre à jour le contenu

Après toute modification, ajout ou suppression d'une fiche `.md` :

```bash
node outils/generer-contenu.js     # ou double-clic sur outils/METTRE-A-JOUR.bat
git add -A && git commit -m "Mise à jour des fiches" && git push
```

> ⚠️ Sans cette régénération, le site déployé continue d'afficher l'ancien texte :
> l'interface lit `assets/contenu.js`, pas les fichiers `.md` directement.
> Les `.md` et `.docx` ne servent qu'aux téléchargements.

---

## 4. Autres hébergements

- **Apache / hébergement mutualisé** : le `.htaccess` fourni reste valable
  (index, types MIME, blocage de `outils/`, compression). Il est ignoré par Vercel.
- **Netlify, GitHub Pages, S3…** : déposer la racine du dépôt telle quelle ;
  `index.html` redirige vers la présentation sur tous les serveurs.
- **En local** : `python -m http.server 8765`, puis ouvrir <http://localhost:8765>.
  Le double-clic direct sur `Presentation-valise.html` fonctionne également.

---

## 5. Domaine personnalisé

Vercel → projet → **Settings → Domains** → ajouter le domaine, puis créer chez le
registrar l'enregistrement DNS indiqué (`A` vers `76.76.21.21` pour un domaine
racine, ou `CNAME` vers `cname.vercel-dns.com` pour un sous-domaine).
Le certificat HTTPS est émis automatiquement.
