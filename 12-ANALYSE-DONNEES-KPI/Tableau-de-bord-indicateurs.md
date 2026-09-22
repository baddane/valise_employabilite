# 📊 TABLEAU DE BORD & INDICATEURS DE PERFORMANCE

> Piloter par les données : mesurer l'efficacité de l'accompagnement et de l'agence.

---

## 1. Indicateurs clés (KPI)

### A. Activité
| Indicateur | Définition | Cible | Réalisé |
|---|---|---|---|
| Nombre de personnes accueillies | Flux entrant | | |
| Nombre d'entretiens réalisés | Volume d'accompagnement | | |
| Nombre d'ateliers animés | Actions collectives | | |
| Offres collectées | Développement entreprises | | |

### B. Résultats (efficacité)
| Indicateur | Définition | Cible | Réalisé |
|---|---|---|---|
| **Taux de placement** | Placés / accompagnés × 100 | | |
| **Taux d'insertion** | En emploi à N mois / total × 100 | | |
| **Taux de maintien (durable)** | Encore en poste à 6 mois × 100 | | |
| **Délai moyen de placement** | Jours entre accueil et emploi | | |
| **Durée moyenne de chômage** | Ancienneté moyenne | | |
| Taux d'accès à la formation | Formés / accompagnés × 100 | | |

### C. Qualité / satisfaction
| Indicateur | Définition | Cible | Réalisé |
|---|---|---|---|
| Satisfaction bénéficiaires | Enquête /10 | | |
| Satisfaction entreprises | Enquête /10 | | |
| Taux de rupture précoce | Ruptures < 3 mois × 100 | | |
| Taux d'offres pourvues | Offres pourvues / collectées | | |

### D. Partenariat entreprises
| Indicateur | Définition | Cible | Réalisé |
|---|---|---|---|
| Entreprises partenaires actives | Nombre sur la période | | |
| Nouvelles entreprises prospectées | Flux | | |
| Taux de fidélisation entreprises | Récurrentes / total | | |

---

## 2. Calculs de référence

```
Taux de placement (%)   = (Nb placés / Nb accompagnés) × 100
Taux d'insertion (%)    = (Nb en emploi à N mois / Nb suivis) × 100
Taux de maintien (%)    = (Nb encore en poste à 6 mois / Nb placés) × 100
Délai moyen (jours)     = Σ (date emploi − date accueil) / Nb placés
Taux de rupture (%)     = (Nb ruptures < 3 mois / Nb placés) × 100
```

---

## 3. Mesurer juste : la méthode des cohortes

> ⚠️ Diviser les **placés du mois** par les **accueillis du même mois** mélange des personnes
> différentes (les placés de mars sont souvent entrés en décembre). Ce ratio suit l'**activité**, pas
> l'**efficacité**.

**Méthode fiable :** suivre une **cohorte** = toutes les personnes entrées le même mois, et mesurer
ce qu'elles deviennent à 3, 6 et 12 mois.

```
Taux de placement à 6 mois (cohorte de janvier) =
   Nb d'entrés en janvier ayant trouvé un emploi en 6 mois ou moins / Nb d'entrés en janvier
Taux de maintien (cohorte de janvier) =
   Nb d'entrés en janvier encore en emploi 6 mois après l'embauche / Nb d'entrés en janvier placés
```

Dans le classeur Excel : saisir chaque bénéficiaire dans l'onglet **Portefeuille** ; les onglets
**Cohortes** et **Équité** se calculent seuls.

---

## 4. Indicateurs d'équité (éviter l'écrémage)

Un objectif de placement global peut pousser, sans le vouloir, à accompagner d'abord les profils les
plus faciles. Suivre les résultats **par segment** :

| Segment | Question à se poser |
|---|---|
| Genre | Les femmes accèdent-elles autant au placement que les hommes ? |
| Public (NEET, longue durée, handicap, rural…) | Les publics prioritaires ont-ils des résultats proches de la moyenne ? |
| Zone (urbaine / rurale) | Les personnes éloignées sont-elles suivies au même rythme ? |
| Mode d'accompagnement | Le mode renforcé produit-il des progrès (score /24, placement) ? |

**Règle de lecture :** un écart de **plus de 10 points** sous la moyenne (en rouge dans l'onglet
Équité) appelle une action ciblée : prospection dédiée, atelier spécifique, partenaire, formation.

**Indicateurs de fonctionnement à ajouter :** délai entre inscription et premier entretien · part des
dossiers avec PAI signé · part des orientations partenaires avec retour · part des sorties pour
abandon (S7) · taille des portefeuilles par conseiller et par mode.

---

## 5. Tableau de bord mensuel (modèle synthétique)

| Mois | Accueillis | Placés | Taux placement | Délai moyen | Satisfaction | Offres collectées |
|---|---|---|---|---|---|---|
| Jan | | | | | | |
| Fév | | | | | | |
| Mar | | | | | | |
| … | | | | | | |

---

## 6. Analyse territoriale (statistiques à suivre)

- Métiers les plus demandés / les plus offerts.
- Écarts offre / demande par secteur.
- Profils les plus / moins insérés (par public, par niveau).
- Zones géographiques en tension.

---

## 7. Du chiffre à l'action (lecture managériale)

| Constat | Question à se poser | Action possible |
|---|---|---|
| Taux de placement en baisse | Où bloque le parcours ? | Renforcer outillage / offres |
| Délai de placement long | Diagnostic ou marché ? | Cibler formations en tension |
| Ruptures précoces élevées | Qualité de la mise en relation ? | Renforcer analyse de poste + suivi |
| Peu d'offres collectées | Prospection insuffisante ? | Plan d'action entreprises |
| Faible satisfaction entreprises | Qualité des profils ? | Améliorer présélection |
| Écart d'équité > 10 pts | Un public est-il laissé de côté ? | Action ciblée (prospection, atelier, partenaire) |
| Abandons (S7) élevés | Rythme ou offre de service inadaptés ? | Relances, mode d'accompagnement revu |

> 💡 Un bon pilotage relie **chaque indicateur à une décision**. Les données ne servent que si
> elles déclenchent une action correctrice.
