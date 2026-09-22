"""
Ajoute au classeur de pilotage 3 onglets : Portefeuille (une ligne par bénéficiaire),
Cohortes (taux calculés par mois d'entrée) et Équité (résultats par genre, public, zone, mode).
Idempotent : si les onglets existent déjà, ils sont recréés.

    python outils/ajouter-onglets-pilotage.py
"""
from pathlib import Path

import openpyxl
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / '12-ANALYSE-DONNEES-KPI' / 'Classeur-pilotage-agence.xlsx'

BLUE = PatternFill('solid', fgColor='1F4E79')
TOTAL = PatternFill('solid', fgColor='C6E0B4')
CALC = PatternFill('solid', fgColor='EEF3F8')
WHITE_B = Font(bold=True, color='FFFFFF')
TITLE = Font(bold=True, color='FFFFFF', size=15)
NOTE = Font(color='595959', size=9)
THIN = Side(style='thin', color='BFBFBF')
BOX = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
CENTER = Alignment(horizontal='center', vertical='center', wrap_text=True)

N = 1000                    # lignes de saisie du portefeuille
FIRST, LAST = 5, 5 + N - 1  # plage de données
P = "Portefeuille!"


def rng(col):
    return f"{P}${col}${FIRST}:${col}${LAST}"


GENRES = ['F', 'H']
AGES = ['< 25 ans', '25–34', '35–44', '45–54', '55 et +']
PUBLICS = ['Jeune diplômé', 'Femme en reprise', 'Cadre', 'Longue durée', 'Handicap', 'Senior',
           'Aide sociale', 'Migrant', 'Étudiant', 'Jeune sans diplôme / NEET', 'Femme éloignée',
           'Milieu rural', 'Économie informelle', 'Lauréat formation pro', 'International']
NIVEAUX = ['Sans diplôme', 'Primaire/collège', 'Bac', 'Formation pro', 'Bac+2/3', 'Bac+5 et +']
ZONES = ['Urbaine', 'Périurbaine', 'Rurale']
MODES = ['Autonome', 'Guidé', 'Renforcé', 'Global', 'Auto-emploi']
CONTRATS = ['CDI', 'CDD ≥ 6 mois', 'CDD < 6 mois', "Contrat d'insertion", 'Intérim', 'Création', 'Formation']
EMPLOI6 = ['Oui', 'Non', 'En attente']
MOTIFS = ['S1 Emploi durable', 'S2 Emploi court', 'S3 Insertion/stage', 'S4 Création',
          'S5 Formation', 'S6 Partenaire', 'S7 Abandon', 'S8 Autre']


def header(ws, title, note, cols, widths):
    ws.sheet_view.showGridLines = False
    last = openpyxl.utils.get_column_letter(len(cols))
    ws.merge_cells(f'A1:{last}1')
    ws['A1'] = title
    ws['A1'].font = TITLE
    ws['A1'].fill = BLUE
    ws['A1'].alignment = Alignment(vertical='center')
    ws.row_dimensions[1].height = 30
    ws.merge_cells(f'A2:{last}2')
    ws['A2'] = note
    ws['A2'].font = NOTE
    for i, (c, w) in enumerate(zip(cols, widths), start=1):
        cell = ws.cell(row=4, column=i, value=c)
        cell.font = WHITE_B
        cell.fill = BLUE
        cell.alignment = CENTER
        cell.border = BOX
        ws.column_dimensions[openpyxl.utils.get_column_letter(i)].width = w
    ws.row_dimensions[4].height = 42


def dv_list(ws, values, col):
    dv = DataValidation(type='list', formula1='"' + ','.join(values) + '"', allow_blank=True)
    dv.add(f'{col}{FIRST}:{col}{LAST}')
    ws.add_data_validation(dv)


def build_portefeuille(wb):
    ws = wb.create_sheet('Portefeuille')
    cols = ['N° dossier', "Date d'entrée", "Mois d'entrée (auto)", 'Genre', "Tranche d'âge", 'Public',
            "Niveau d'études", 'Zone', "Mode d'accompagnement", 'Conseiller', 'Date de placement',
            'Délai (jours, auto)', 'Type de contrat', 'En emploi à 6 mois', 'Date de sortie', 'Motif de sortie']
    header(ws, '👥 PORTEFEUILLE DES BÉNÉFICIAIRES',
           "Une ligne par personne accompagnée. Cellules grises = calcul automatique. "
           "Ces données alimentent les onglets Cohortes et Équité.",
           cols, [12, 13, 14, 8, 11, 22, 16, 12, 15, 14, 13, 11, 16, 12, 13, 18])
    for r in range(FIRST, LAST + 1):
        ws[f'C{r}'] = f'=IF(B{r}="","",DATE(YEAR(B{r}),MONTH(B{r}),1))'
        ws[f'L{r}'] = f'=IF(OR(B{r}="",K{r}=""),"",K{r}-B{r})'
        for col in 'ABCDEFGHIJKLMNOP':
            ws[f'{col}{r}'].border = BOX
        for col in 'CL':
            ws[f'{col}{r}'].fill = CALC
        for col in 'BKO':
            ws[f'{col}{r}'].number_format = 'dd/mm/yyyy'
        ws[f'C{r}'].number_format = 'mmm yyyy'
    for values, col in [(GENRES, 'D'), (AGES, 'E'), (PUBLICS, 'F'), (NIVEAUX, 'G'), (ZONES, 'H'),
                        (MODES, 'I'), (CONTRATS, 'M'), (EMPLOI6, 'N'), (MOTIFS, 'P')]:
        dv_list(ws, values, col)
    ws.freeze_panes = 'B5'


def build_cohortes(wb):
    ws = wb.create_sheet('Cohortes')
    cols = ["Mois d'entrée", 'Entrés', 'Placés (à ce jour)', 'Placés en ≤ 3 mois', 'Taux à 3 mois',
            'Placés en ≤ 6 mois', 'Taux à 6 mois', 'En emploi à 6 mois', 'Taux de maintien',
            'Délai moyen (j)', 'Cohorte complète ?']
    header(ws, "📈 COHORTES — RÉSULTATS PAR MOIS D'ENTRÉE",
           "Chaque ligne suit les personnes entrées le même mois : un taux n'est fiable que lorsque la cohorte "
           "est complète (colonne K). Saisir l'année en B3.",
           cols, [14, 9, 11, 11, 10, 11, 10, 11, 11, 11, 13])
    ws['A3'] = 'Année :'
    ws['A3'].font = Font(bold=True)
    ws['B3'] = 2026
    ws['B3'].fill = PatternFill('solid', fgColor='FFF2CC')
    ws['B3'].border = BOX
    C, K, L, N_ = rng('C'), rng('K'), rng('L'), rng('N')
    for i in range(12):
        r = 5 + i
        m = f'$A{r}'
        ws[f'A{r}'] = f'=DATE($B$3,{i + 1},1)'
        ws[f'A{r}'].number_format = 'mmmm yyyy'
        ws[f'B{r}'] = f'=COUNTIFS({C},{m})'
        ws[f'C{r}'] = f'=COUNTIFS({C},{m},{K},"<>")'
        ws[f'D{r}'] = f'=COUNTIFS({C},{m},{L},"<=90")'
        ws[f'E{r}'] = f'=IFERROR(D{r}/B{r},"")'
        ws[f'F{r}'] = f'=COUNTIFS({C},{m},{L},"<=180")'
        ws[f'G{r}'] = f'=IFERROR(F{r}/B{r},"")'
        ws[f'H{r}'] = f'=COUNTIFS({C},{m},{N_},"Oui")'
        ws[f'I{r}'] = f'=IFERROR(H{r}/C{r},"")'
        ws[f'J{r}'] = f'=IFERROR(AVERAGEIFS({L},{C},{m}),"")'
        ws[f'K{r}'] = f'=IF(EDATE({m},12)<=TODAY(),"Oui","Non — en cours")'
        for col in 'EGI':
            ws[f'{col}{r}'].number_format = '0.0%'
        ws[f'J{r}'].number_format = '0'
        for col in 'ABCDEFGHIJK':
            ws[f'{col}{r}'].border = BOX
    r = 17
    ws[f'A{r}'] = 'TOTAL ANNÉE'
    for col in 'BCDFH':
        ws[f'{col}{r}'] = f'=SUM({col}5:{col}16)'
    ws[f'E{r}'] = f'=IFERROR(D{r}/B{r},"")'
    ws[f'G{r}'] = f'=IFERROR(F{r}/B{r},"")'
    ws[f'I{r}'] = f'=IFERROR(H{r}/C{r},"")'
    ws[f'J{r}'] = f'=IFERROR(AVERAGEIFS({L},{C},">="&A5,{C},"<="&A16),"")'
    for col in 'ABCDEFGHIJK':
        ws[f'{col}{r}'].fill = TOTAL
        ws[f'{col}{r}'].border = BOX
        ws[f'{col}{r}'].font = Font(bold=True)
    for col in 'EGI':
        ws[f'{col}{r}'].number_format = '0.0%'
    ws[f'J{r}'].number_format = '0'
    ws['A19'] = ("Lecture : « Taux à 6 mois » = part des personnes entrées ce mois-là qui ont trouvé un emploi "
                 "en 6 mois ou moins. Comparer les mois entre eux, pas avec le mois en cours.")
    ws['A19'].font = NOTE
    ws.freeze_panes = 'B5'


def build_equite(wb):
    ws = wb.create_sheet('Équité')
    cols = ['Axe', 'Segment', 'Accompagnés', 'Part du total', 'Placés', 'Taux de placement',
            'Écart vs moyenne (pts)', 'En emploi à 6 mois', 'Taux de maintien']
    header(ws, '⚖️ ÉQUITÉ — RÉSULTATS PAR PUBLIC, GENRE, ZONE ET MODE',
           "Repérer les publics qui ont moins accès aux résultats (écart négatif en rouge) : "
           "risque d'écrémage. Calcul automatique à partir de l'onglet Portefeuille.",
           cols, [18, 26, 13, 11, 10, 12, 13, 12, 12])
    ws['A3'] = 'Ensemble'
    ws['A3'].font = Font(bold=True)
    B = rng('B')
    K, N_ = rng('K'), rng('N')
    ws['C3'] = f'=COUNT({B})'
    ws['E3'] = f'=COUNTIFS({B},"<>",{K},"<>")'
    ws['F3'] = '=IFERROR(E3/C3,"")'
    ws['H3'] = f'=COUNTIFS({B},"<>",{N_},"Oui")'
    ws['I3'] = '=IFERROR(H3/E3,"")'
    for col in 'ACEFHI':
        ws[f'{col}3'].fill = TOTAL
        ws[f'{col}3'].border = BOX
    ws['F3'].number_format = ws['I3'].number_format = '0.0%'
    r = 5
    for axe, col, values in [('Genre', 'D', GENRES), ('Public', 'F', PUBLICS), ('Zone', 'H', ZONES),
                             ('Mode', 'I', MODES), ("Tranche d'âge", 'E', AGES), ('Niveau', 'G', NIVEAUX)]:
        R = rng(col)
        for v in values:
            ws[f'A{r}'] = axe
            ws[f'B{r}'] = v
            ws[f'C{r}'] = f'=COUNTIFS({R},$B{r})'
            ws[f'D{r}'] = f'=IFERROR(C{r}/$C$3,"")'
            ws[f'E{r}'] = f'=COUNTIFS({R},$B{r},{K},"<>")'
            ws[f'F{r}'] = f'=IFERROR(E{r}/C{r},"")'
            ws[f'G{r}'] = f'=IFERROR((F{r}-$F$3)*100,"")'
            ws[f'H{r}'] = f'=COUNTIFS({R},$B{r},{N_},"Oui")'
            ws[f'I{r}'] = f'=IFERROR(H{r}/E{r},"")'
            for c in 'DFI':
                ws[f'{c}{r}'].number_format = '0.0%'
            ws[f'G{r}'].number_format = '+0.0;-0.0;0.0'
            for c in 'ABCDEFGHI':
                ws[f'{c}{r}'].border = BOX
            r += 1
        r += 1
    ws.conditional_formatting.add(f'G5:G{r}', CellIsRule(operator='lessThan', formula=['-10'],
                                  fill=PatternFill('solid', fgColor='F8CBAD'), font=Font(color='9C0006', bold=True)))
    ws.conditional_formatting.add(f'G5:G{r}', CellIsRule(operator='greaterThan', formula=['10'],
                                  fill=PatternFill('solid', fgColor='C6EFCE')))
    ws.freeze_panes = 'C5'


def update_notice(wb):
    ws = wb['Notice']
    rows = [
        ('Portefeuille', 'NOUVEAU — une ligne par bénéficiaire : entrée, profil, mode, placement, maintien, sortie. Source des onglets Cohortes et Équité.'),
        ('Cohortes', "NOUVEAU — taux de placement et de maintien calculés par mois d'entrée (méthode fiable pour comparer les périodes)."),
        ('Équité', "NOUVEAU — résultats par genre, public, zone, mode, âge et niveau : repère les publics désavantagés (écrémage)."),
    ]
    start = ws.max_row + 2
    ws.cell(row=start, column=1, value='Onglets ajoutés').font = Font(bold=True)
    for i, (a, b) in enumerate(rows, start=start + 1):
        ws.cell(row=i, column=1, value=a).font = Font(bold=True)
        ws.cell(row=i, column=2, value=b).alignment = Alignment(wrap_text=True)
    ws.cell(row=start + 5, column=1, value='Attention').font = Font(bold=True)
    ws.cell(row=start + 5, column=2,
            value="L'onglet Tableau de bord rapporte les placés du mois aux accueillis du même mois : utile pour "
                  "suivre l'activité, mais ce ne sont pas les mêmes personnes. Pour mesurer l'efficacité, utiliser Cohortes."
            ).alignment = Alignment(wrap_text=True)


def main():
    wb = openpyxl.load_workbook(XLSX)
    for name in ['Portefeuille', 'Cohortes', 'Équité']:
        if name in wb.sheetnames:
            del wb[name]
    if 'Onglets ajoutés' not in [c.value for c in wb['Notice']['A']]:
        update_notice(wb)
    build_portefeuille(wb)
    build_cohortes(wb)
    build_equite(wb)
    wb.save(XLSX)
    print('OK :', XLSX.relative_to(ROOT).as_posix(), '→', wb.sheetnames)


if __name__ == '__main__':
    main()
