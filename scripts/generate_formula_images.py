#!/usr/bin/env python3
"""Generate VSTEP scoring formula diagrams with matplotlib mathtext (no texlive needed)."""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

plt.rcParams['mathtext.fontset'] = 'stix'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 11

OUT_DIR = '/Users/nghiahoang/Dev/VSTEP/scripts/output'
os.makedirs(OUT_DIR, exist_ok=True)

BG = '#0a0a1a'
BB = '#1a1a2e'
CR = '#e94560'   # red
CG = '#f0a500'   # gold
CN = '#16c79a'   # green
CB = '#0f3460'   # blue
CL = '#ff6b6b'   # LLM pink
CW = '#ffffff'
CD = '#cccccc'
GY = '#888888'


def mathtext(text):
    """Wrap text in $...$ for mathtext rendering."""
    return f'${text}$'


def fb(ax, x, y, label, detail='', result='', c=CR):
    """Formula box: LaTeX label, plain detail, result badge."""
    ax.text(x, y, label, fontsize=11, color=c, va='center')
    if detail:
        ax.text(x + 0.44, y, detail, fontsize=9, color=CD, va='center')
    if result:
        ax.text(0.96, y, result, fontsize=8.5, fontweight='bold', color=CN,
                ha='right', va='center',
                bbox=dict(boxstyle='round,pad=0.25', facecolor='#16213e', edgecolor=CB, alpha=0.8))


def section(ax, x, y, n, title, c):
    ax.text(x, y, f'{n}. {title}', fontsize=14, fontweight='bold', color=CW,
            bbox=dict(boxstyle='round,pad=0.3', facecolor=c, alpha=0.9))
    return y - 0.7


def overall_bar(ax, y, formula, c=CR):
    ax.text(0.5, y, formula, fontsize=14, fontweight='bold', color=CW, ha='center',
            bbox=dict(boxstyle='round,pad=0.5', facecolor=c, alpha=0.9))
    return y - 0.8


def setup_fig(title, subtitle, h=14):
    fig, ax = plt.subplots(figsize=(17, h))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, h)
    ax.axis('off')
    ax.set_facecolor(BG)
    fig.patch.set_facecolor(BG)
    ax.text(0.5, h - 0.5, title, fontsize=19, fontweight='bold', color=CR, ha='center',
            bbox=dict(boxstyle='round,pad=0.6', facecolor=BB, edgecolor=CR, alpha=0.9))
    if subtitle:
        ax.text(0.5, h - 1.1, subtitle, fontsize=10, color=GY, ha='center')
    return fig, ax, h - 1.5


# ═══════════════════════════════════════════════════════════════
# SPEAKING
# ═══════════════════════════════════════════════════════════════

def generate_speaking():
    fig, ax, y = setup_fig(
        'VSTEP SPEAKING — Cong thuc cham diem',
        '5 tieu chi | deterministic formula | rubric params tu DB  |  Thong tu 23/2017/TT-BGDDT',
        h=15)

    # 1. GRAMMAR
    y = section(ax, 0.05, y, '1', 'GRAMMAR — Ngu phap', CR)
    fb(ax, 0.08, y,
       mathtext(r'G = \mathrm{clampRound}\left(\frac{\mathrm{range} + \mathrm{accuracy}}{2}\right)'),
       '', '[1.0, 10.0], step 0.5')
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{range} = f(\mathrm{typeCount})'),
       '0 types -> 5,  1 -> 6,  3 -> 7,  5 -> 8,  6 -> 9,  7+ -> 10',
       'SyntaxAnalyzer regex', CG)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{accuracy} = \min\left(\mathrm{maxAcc},\ \max(0,\ 10 - \frac{\mathrm{errors}}{\mathrm{sentences}} \times 5)\right)'),
       'maxAcc: 0-2 types -> 7,  3-4 -> 9,  5+ -> 10',
       'LangTool / LT=0 speaking', CB)

    # 2. VOCABULARY
    y -= 0.8
    y = section(ax, 0.05, y, '2', 'VOCABULARY — Tu vung', CG)
    fb(ax, 0.08, y,
       mathtext(r'V = \min\left(\mathrm{cap},\ \mathrm{clampRound}(\mathrm{base} + B_u + B_l + B_r + B_c)\right)'),
       'base = 3,  cap = 8', '[1.0, 8.0]')
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_u = \mathrm{bonus}(\mathrm{unique\_ratio})'),
       'ratio > 0.45 -> 1,  > 0.55 -> 2,  > 0.65 -> 3', 'do da dang tu', CN)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_l = \mathrm{bonus}(\mathrm{avg\_word\_len})'),
       'len > 4.5 -> 1,  > 5.5 -> 2', 'do phuc tap tu', CN)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_r = \mathrm{bonus}(\mathrm{readability\_grade})'),
       'grade > 8 -> 1,  > 10 -> 2', 'Flesch-Kincaid', GY)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_c = \mathrm{bonus}(\mathrm{complex\_vocab\_count})'),
       'count > 2 -> 1,  > 5 -> 2', 'tu B2+', GY)

    # 3. FLUENCY
    y -= 0.8
    y = section(ax, 0.05, y, '3', 'FLUENCY — Do troi chay', CN)
    fb(ax, 0.08, y,
       mathtext(r'F = \mathrm{clampRound}(\mathrm{base} + \mathrm{rateBonus} - \mathrm{pausePenalty})'),
       'base = 3', '[1.0, 10.0]')
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{rateBonus} = \mathrm{bonus}(\mathrm{wpm})'),
       'wpm >= 60 -> 1,  >= 90 -> 2,  >= 120 -> 3,  >= 150 -> 4',
       'Azure word timing', CB)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{pausePenalty} = \mathrm{penalty}(\mathrm{pauses\_per\_100w})'),
       'pauses/100w > 8% -> 1,  > 15% -> 2', 'Azure word timing', CB)

    # 4. DISCOURSE
    y -= 0.8
    y = section(ax, 0.05, y, '4', 'DISCOURSE — Kiem soat dien ngon', CR)
    fb(ax, 0.08, y,
       mathtext(r'D = \mathrm{clampRound}\left((\mathrm{base} + B_l + B_v) \times \mathrm{contentFactor}\right)'),
       'base = 1,  contentFactor in [0.5, 1.0]', '[1.0, 10.0]')
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_l = \min(\mathrm{cap},\ \mathrm{linking\_count} \times 0.5)'),
       'cap = 3,  factor = 0.5', 'SyntaxAnalyzer', CG)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_v = \mathrm{bonus}(\mathrm{sentence\_variety\_stddev})'),
       'stddev > 4 -> 1,  > 6 -> 2', 'SyntaxAnalyzer', CG)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{contentFactor} = 0.5 + \frac{\mathrm{covered}}{\mathrm{required}} \times 0.5'),
       '[LLM] Exam: kiem tra transcript vs task.  Practice: 1.0.  LLM fail -> 1.0',
       'exam only', CL)

    # 5. PRONUNCIATION
    y -= 0.8
    y = section(ax, 0.05, y, '5', 'PRONUNCIATION — Phat am', CN)
    fb(ax, 0.08, y,
       mathtext(r'P = \mathrm{clampRound}(\mathrm{AzurePA\_score})'),
       'Azure PA mandatory, no fallback', '[1.0, 10.0], step 0.5', CB)

    y = overall_bar(ax, y - 0.6,
                    mathtext(r'\mathbf{OVERALL = round(mean(G, V, F, D, P),\ 0.5)}'))

    ax.text(0.5, 0.5, 'Nguon band descriptors: Thong tu 23/2017/TT-BGDDT, Phu luc III',
            fontsize=8, color='#555555', ha='center')

    plt.tight_layout()
    plt.savefig(f'{OUT_DIR}/speaking_formulas.png', dpi=200, bbox_inches='tight',
                facecolor=BG, edgecolor='none')
    plt.close()
    print('speaking_formulas.png')


# ═══════════════════════════════════════════════════════════════
# WRITING
# ═══════════════════════════════════════════════════════════════

def generate_writing():
    fig, ax, y = setup_fig(
        'VSTEP WRITING — Cong thuc cham diem',
        '4 tieu chi + Sanity Penalty + Composite | 5-layer pipeline | Thong tu 23/2017/TT-BGDDT',
        h=16.5)

    # 1. GRAMMAR
    y = section(ax, 0.05, y, '1', 'GRAMMAR — Ngu phap', CR)
    fb(ax, 0.08, y,
       mathtext(r'G = \mathrm{clampRound}\left(\frac{\mathrm{range} + \mathrm{accuracy}}{2}\right)'),
       '', '[1.0, 10.0], step 0.5')
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{range} = f(\mathrm{typeCount})'),
       '0 types -> 5,  1 -> 6,  3 -> 7,  5 -> 8,  6 -> 9,  7+ -> 10',
       'SyntaxAnalyzer (10 types)', CG)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{accuracy} = \min\left(\mathrm{maxAcc},\ \max(0,\ 10 - \frac{\mathrm{errors}}{\mathrm{sentences}} \times 5)\right)'),
       'maxAcc: 0-2 types -> 7,  3-4 -> 9,  5+ -> 10',
       'LanguageTool errors', CB)

    # 2. VOCABULARY
    y -= 0.8
    y = section(ax, 0.05, y, '2', 'VOCABULARY — Tu vung', CG)
    fb(ax, 0.08, y,
       mathtext(r'V = \min\left(\mathrm{cap},\ \mathrm{clampRound}(\mathrm{base} + B_u + B_l + B_r + B_c)\right)'),
       'base = 3,  cap = 8', '[1.0, 8.0]')
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_u = \mathrm{bonus}(\mathrm{unique\_ratio})'),
       'ratio > 0.45 -> 1,  > 0.55 -> 2,  > 0.65 -> 3', 'do da dang tu', CN)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_l = \mathrm{bonus}(\mathrm{avg\_word\_len})'),
       'len > 4.5 -> 1,  > 5.5 -> 2', 'do phuc tap tu', CN)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_r = \mathrm{bonus}(\mathrm{readability\_grade})'),
       'grade > 8 -> 1,  > 10 -> 2', 'Flesch-Kincaid', GY)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'B_c = \mathrm{bonus}(\mathrm{complex\_vocab\_count})'),
       'count > 2 -> 1,  > 5 -> 2', 'tu B2+', GY)

    # 3. TASK FULFILLMENT
    y -= 0.8
    y = section(ax, 0.05, y, '3', 'TASK FULFILLMENT — Hoan thanh yeu cau  [LLM evidence]', CR)
    fb(ax, 0.08, y,
       mathtext(r'T = \mathrm{clampRound}\left(\frac{\mathrm{covered}}{\mathrm{required}} \times M + \mathrm{position} - \mathrm{irrelevant}\right)'),
       'M = 7 (multiplier),  position = +1,  irrelevant = -2', '[1.0, 10.0]')
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{covered},\ \mathrm{required} = \mathrm{LLM\_evidence}'),
       '[LLM] dem yeu cau da dap ung / tong yeu cau (T=0 -> deterministic)',
       'LLM extract', CL)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{position} = \mathrm{has\_clear\_position}\ ?\ 1 : 0'),
       'co quan diem ro rang -> +1', 'LLM boolean', CL)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'\mathrm{irrelevant} = \mathrm{has\_irrelevant\_content}\ ?\ 2 : 0'),
       'co noi dung lac de -> -2', 'LLM boolean', CL)

    # 4. ORGANIZATION
    y -= 0.8
    y = section(ax, 0.05, y, '4', 'ORGANIZATION — Bo cuc', CN)
    fb(ax, 0.08, y,
       mathtext(r'O = \mathrm{clampRound}(\mathrm{base} + P + L + V - C)'),
       'base = 1', '[1.0, 10.0]')
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'P = \mathrm{bonus}(\mathrm{paragraph\_count})'),
       '1 doan -> 1,  2 doan -> 3,  3+ doan -> 4', 'RuleBasedScoring', CG)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'L = \min(\mathrm{cap},\ \mathrm{linking\_count} \times \mathrm{factor})'),
       'cap = 3,  factor = 0.5', 'tu noi (linking words)', CG)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'V = \mathrm{bonus}(\mathrm{sentence\_variety\_stddev})'),
       'stddev > 4 -> 1,  > 6 -> 2', 'do da dang cau', CG)
    y -= 0.5
    fb(ax, 0.1, y,
       mathtext(r'C = \mathrm{penalty}(1\ \mathrm{para}\ \mathrm{and}\ \mathrm{sentences} > 8)'),
       '1 doan + > 8 cau -> -1  ("wall of text")', 'compact penalty', GY)

    # SANITY + COMPOSITE
    y -= 1.0
    ax.text(0.5, y,
            mathtext(r'\mathbf{Sanity Penalty:  W_i = W_i \times \min(1,\ words/120)}'),
            fontsize=12, fontweight='bold', color=CL, ha='center',
            bbox=dict(boxstyle='round,pad=0.4', facecolor=BB, edgecolor=CL, alpha=0.9))
    y -= 0.8
    ax.text(0.5, y,
            mathtext(r'\mathbf{Composite:\ \ W = \mathrm{round}\left(\frac{W_1 + 2W_2}{3},\ 0.5\right)}'),
            fontsize=12, fontweight='bold', color=CW, ha='center',
            bbox=dict(boxstyle='round,pad=0.4', facecolor=BB, edgecolor=CN, alpha=0.9))
    y -= 0.8
    ax.text(0.5, y, 'Nguon composite: ULIS-VNU (VNU J. Foreign Studies, 2018)',
            fontsize=8, color='#555555', ha='center')

    ax.text(0.5, 0.5, 'Nguon band descriptors: Thong tu 23/2017/TT-BGDDT, Phu luc III',
            fontsize=8, color='#555555', ha='center')

    plt.tight_layout()
    plt.savefig(f'{OUT_DIR}/writing_formulas.png', dpi=200, bbox_inches='tight',
                facecolor=BG, edgecolor='none')
    plt.close()
    print('writing_formulas.png')


# ═══════════════════════════════════════════════════════════════
# PIPELINE OVERVIEW
# ═══════════════════════════════════════════════════════════════

def generate_pipeline():
    fig, ax = plt.subplots(figsize=(20, 7.5))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 6.5)
    ax.axis('off')
    ax.set_facecolor(BG)
    fig.patch.set_facecolor(BG)

    ax.text(0.5, 6.2, 'VSTEP — SCORING PIPELINE', fontsize=18, fontweight='bold',
            color=CR, ha='center')

    positions = [0.05, 0.21, 0.37, 0.53, 0.69, 0.85]

    # WRITING
    ax.text(0.5, 5.4, 'WRITING (5-layer)', fontsize=13, fontweight='bold', color=CW, ha='center')
    w = [
        ('Input:\nText', CR),
        ('Layer 1:\nLanguageTool\n(errors)', CB),
        ('Layer 2:\nSyntaxAnalyzer\n+ Metrics\n(10 types)', CG),
        ('Layer 3:\nLLM Evidence\n(requirements)\nT=0 degrees', CL),
        ('Layer 4:\nFormula\n(4 criteria)\nDB params', CN),
        ('Layer 5:\nSanity\nW x w/120\nround 0.5', GY),
    ]
    for i, (label, color) in enumerate(w):
        x = positions[i]
        ax.text(x, 4.5, label, fontsize=9, fontweight='bold', color=CW, ha='center',
                bbox=dict(boxstyle='round,pad=0.4', facecolor=color, alpha=0.9))
        if i < len(w) - 1:
            ax.annotate('', xy=(positions[i+1] - 0.06, 4.5), xytext=(x + 0.09, 4.5),
                       arrowprops=dict(arrowstyle='->', color='#444444', lw=2))

    ax.text(0.5, 3.6,
            mathtext(r'\mathbf{Composite:\ \mathrm{round}((W_1 + 2W_2)/3,\ 0.5)}'),
            fontsize=10, color=GY, ha='center')

    # SPEAKING
    ax.text(0.5, 3.0, 'SPEAKING (5-layer)', fontsize=13, fontweight='bold', color=CW, ha='center')
    s = [
        ('Input:\nAudio', CR),
        ('Layer 1:\nAzure STT +\nPronunciation\n(mandatory)', CB),
        ('Layer 2:\nSyntaxAnalyzer\n+ Metrics\n(same as writing)', CG),
        ('Layer 3:\nLLM Content\n(Exam only)\nT=0 degrees', CL),
        ('Layer 4:\nFormula\n(5 criteria)\nDB params', CN),
        ('Layer 5:\nOverall\nround(mean, 0.5)\n-> Level', GY),
    ]
    for i, (label, color) in enumerate(s):
        x = positions[i]
        ax.text(x, 2.1, label, fontsize=9, fontweight='bold', color=CW, ha='center',
                bbox=dict(boxstyle='round,pad=0.4', facecolor=color, alpha=0.9))
        if i < len(s) - 1:
            ax.annotate('', xy=(positions[i+1] - 0.06, 2.1), xytext=(x + 0.09, 2.1),
                       arrowprops=dict(arrowstyle='->', color='#444444', lw=2))

    # MCQ
    ax.text(0.5, 1.2, 'MCQ (Listening + Reading): L = round(CL/35 x 10, 1)    R = round(CR/40 x 10, 1)',
            fontsize=10, color=GY, ha='center')

    # FINAL
    ax.text(0.5, 0.5, 'Overall = round((L + R + W + S)/4, 0.5)  ->  B1(4.0-5.5)  B2(6.0-8.0)  C1(8.5-10.0)',
            fontsize=10, color=GY, ha='center')

    plt.tight_layout()
    plt.savefig(f'{OUT_DIR}/pipeline_overview.png', dpi=200, bbox_inches='tight',
                facecolor=BG, edgecolor='none')
    plt.close()
    print('pipeline_overview.png')


# ═══════════════════════════════════════════════════════════════
# OVERALL LEVEL
# ═══════════════════════════════════════════════════════════════

def generate_level():
    fig, ax = plt.subplots(figsize=(16, 4))
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 3.2)
    ax.set_facecolor(BG)
    fig.patch.set_facecolor(BG)

    ax.text(5, 2.9, 'VSTEP  ->  CEFR LEVEL MAPPING', fontsize=15, fontweight='bold',
            color=CR, ha='center')

    levels = [
        (0, 3.5, 'KHONG DAT', '#555555'),
        (4.0, 5.5, 'B1 (Bac 3)', CG),
        (6.0, 8.0, 'B2 (Bac 4)', CN),
        (8.5, 10.0, 'C1 (Bac 5)', CR),
    ]

    for xmin, xmax, label, color in levels:
        ax.axvspan(xmin, xmax, alpha=0.25, color=color)
        ax.text((xmin + xmax) / 2, 1.4, label, fontsize=13, fontweight='bold',
                color=CW, ha='center', va='center',
                bbox=dict(boxstyle='round,pad=0.4', facecolor=color, alpha=0.9))

    ax.set_xticks(range(0, 11))
    ax.set_xticklabels([str(i) for i in range(0, 11)], color=CW, fontsize=10)
    ax.tick_params(axis='y', left=False, labelleft=False)
    for spine in ax.spines.values():
        spine.set_visible(False)

    ax.text(5, 2.2, 'Overall = round((Listening + Reading + Writing + Speaking) / 4, 0.5)',
            fontsize=10, color=GY, ha='center')
    ax.text(5, 1.8, 'Nguon: Thong tu 23/2017/TT-BGDDT  |  vstep.ftu.edu.vn',
            fontsize=8, color='#555555', ha='center')

    plt.tight_layout()
    plt.savefig(f'{OUT_DIR}/overall_level.png', dpi=200, bbox_inches='tight',
                facecolor=BG, edgecolor='none')
    plt.close()
    print('overall_level.png')


if __name__ == '__main__':
    generate_speaking()
    generate_writing()
    generate_pipeline()
    generate_level()
    print(f'\nDone! Output: {OUT_DIR}/')
