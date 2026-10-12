/* mw-d-tmgel.js — 專題D · Maxwell 總鬆弛時間 tm 對總凝膠含量（Ehabe et al. 2005 Table 1 原值）
   故事：擬合好只是入場券——參數要回接結構才算得分。tm = Σtᵢ 對總凝膠（宏觀＋微觀）
        呈正相關；兩個合成膠落在左下（凝膠 8–25%）。鬆弛聽得到凝膠，不只聽粘度。
   互動：14 點散點；hover 任一點看樣品／品系／ML／tm／凝膠。 */

/* 樣品凝膠表（原文 Table 1 原值）：[樣品, 品系zh, ML, tm(s), 總凝膠%, 品系en, 品級] */
var D_TMGEL = [
  ['IR305',    '合成',   76, 163,  8, 'synthetic', 'PI'],
  ['Natsyn',   '合成',   85, 198, 25, 'synthetic', 'PI'],
  ['1SAP1-CV', 'GT1',    66, 185, 40, 'GT1',   'TSR3CV'],
  ['1SAP2-CV', 'PR107',  54, 196, 39, 'PR107', 'TSR3CV'],
  ['1SAP3-CV', 'PB217',  85, 204, 44, 'PB217', 'TSR3CV'],
  ['1SAP1-1',  'GT1',    96, 259, 65, 'GT1',   'TSR10'],
  ['1SAP2-1',  'PR107',  91, 271, 65, 'PR107', 'TSR10'],
  ['1SAP3-1',  'PB217',  98, 253, 58, 'PB217', 'TSR10'],
  ['1SAP1-4',  'GT1',   104, 290, 67, 'GT1',   'TSR10'],
  ['1SAP2-4',  'PR107',  99, 277, 69, 'PR107', 'TSR10'],
  ['1SAP3-4',  'PB217',  95, 249, 59, 'PB217', 'TSR10'],
  ['1SAP1-21', 'GT1',   101, 261, 66, 'GT1',   'TSR10'],
  ['1SAP2-21', 'PR107', 100, 297, 70, 'PR107', 'TSR10'],
  ['1SAP3-21', 'PB217',  97, 264, 61, 'PB217', 'TSR10']
];

MW.register('d-tmgel', {
  vb: [520, 300],
  hint: ['滑到任一點，看是哪個樣品、凝膠多少', 'Hover a dot to see the sample and its gel content'],

  stages: [
    { dur: 2.6, zh: ['凝膠多，鬆弛慢', '14 個樣品：凝膠含量一路從 8% 拉到 70%，總鬆弛時間 tm 也跟著一路爬——正相關。'],
             en: ['More gel, slower relaxation', 'Across 14 samples, as total gel climbs from 8% to 70%, the total relaxation time tm climbs with it — a positive relation.'] },
    { dur: 2.4, zh: ['合成膠在左下', 'IR305 與 Natsyn 是合成聚異戊二烯，凝膠只有 8–25%，tm 也短——穩穩落在趨勢線的左下端。'],
             en: ['Synthetics sit low-left', 'IR305 and Natsyn are synthetic polyisoprenes with only 8–25% gel and short tm — they sit at the low end of the same trend.'] }
  ],

  scrub: { panel: 0, fn: function (x01, st) {
    /* x → 最近點（依凝膠% 位置） */
    var PX0 = 52, PX1 = 505;
    var gel = 5 + (x01 * 520 - PX0) / (PX1 - PX0) * (75 - 5);
    var best = -1, bd = 1e9;
    for (var i = 0; i < D_TMGEL.length; i++) {
      var d = Math.abs(D_TMGEL[i][4] - gel);
      if (d < bd) { bd = d; best = i; }
    }
    st.params.hov = best;
  } },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 52, PX1 = 505, PY0 = 258, PY1 = 18;
    var X = function (g) { return PX0 + (g - 5) / (75 - 5) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m - 130) / (310 - 130) * (PY0 - PY1); };
    r.X = X; r.Y = Y;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸：x 總凝膠 5–75%、y tm 130–310 s */
    [150, 200, 250, 300].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': 0.8 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    [10, 20, 30, 40, 50, 60, 70].forEach(function (g) {
      U.el('line', { x1: X(g), y1: PY0, x2: X(g), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(g), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(g), svg);
    });
    U.el('line', { x1: PX0, y1: PY0, x2: PX1, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.bi({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '總凝膠含量（%）', 'total gel (%)', svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'tm (s)', svg);

    /* 趨勢方向虛線（過點雲的手繪參考線，第一段浮現） */
    r.trend = U.el('line', { x1: X(10), y1: Y(168), x2: X(71), y2: Y(292),
      stroke: P.mut, 'stroke-width': 1.4, 'stroke-dasharray': '6 4', opacity: 0 }, svg);

    /* 散點（14 點；合成膠用 warn、NR 用 acc 區分） */
    r.dots = [];
    for (var i = 0; i < D_TMGEL.length; i++) {
      var smp = D_TMGEL[i];
      var syn = (smp[1] === '合成');
      r.dots.push(U.el('circle', {
        cx: X(smp[4]), cy: Y(smp[3]), r: 4.5,
        fill: syn ? P.warn : P.acc, opacity: 0.8, stroke: '#fff', 'stroke-width': 1
      }, svg));
    }

    /* 合成膠圈註（第二段浮現） */
    r.syn = U.el('g', { opacity: 0 }, svg);
    U.el('ellipse', { cx: X(16.5), cy: Y(180), rx: 46, ry: 30, fill: 'none', stroke: P.warn, 'stroke-width': 1.6, 'stroke-dasharray': '5 3' }, r.syn);
    U.bi({ x: X(30), y: Y(148), 'font-size': 10, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 600 },
      '合成膠：凝膠 8–25%', 'synthetics: 8–25% gel', r.syn);

    /* hover 標籤（雙語） */
    r.tag = U.el('g', { opacity: 0 }, svg);
    r.tagZh = U.txt({ x: 0, y: 0, 'font-size': 10, fill: P.ink, 'font-weight': 600, 'class': 'lang-zh' }, '', r.tag);
    r.tagEn = U.txt({ x: 0, y: 0, 'font-size': 10, fill: P.ink, 'font-weight': 600, 'class': 'lang-en' }, '', r.tag);

    /* 階段游標：第一段趨勢線用一個順著線走的小圓點帶路 */
    r.hint = U.el('circle', { cx: X(10), cy: Y(168), r: 5, fill: 'none', stroke: P.acc2, 'stroke-width': 2, opacity: 0 }, svg);

    return r;
  },

  apply: function (r, ctx) {
    var P = MW.PAL;
    var hov = ctx.params.hov;
    var s = ctx.s, sp = ctx.sp;

    /* 第一段：趨勢線以 clip 方式由左下往右上長出 */
    var showT = s >= 1 ? 1 : Math.min(1, sp * 1.6);
    r.trend.setAttribute('opacity', showT * 0.7);
    if (s === 0) {
      var fx = 10 + sp * (71 - 10), fy = 168 + sp * (292 - 168);
      r.hint.setAttribute('cx', r.X(fx)); r.hint.setAttribute('cy', r.Y(fy));
      r.hint.setAttribute('opacity', sp > 0.02 ? 1 : 0);
    } else {
      r.hint.setAttribute('opacity', 0);
    }

    /* 第二段：合成膠圈註 */
    r.syn.setAttribute('opacity', s < 1 ? 0 : Math.min(1, sp * 2));

    /* 點強調 */
    for (var i = 0; i < r.dots.length; i++) {
      var on = (i === hov);
      var smp = D_TMGEL[i], syn = (smp[1] === '合成');
      r.dots[i].setAttribute('r', on ? 6.5 : 4.5);
      r.dots[i].setAttribute('fill', on ? P.acc2 : (syn ? P.warn : P.acc));
      r.dots[i].setAttribute('opacity', hov == null || hov < 0 ? 0.8 : (on ? 1 : 0.35));
    }

    /* hover 標籤 */
    if (hov != null && hov >= 0) {
      var d = D_TMGEL[hov];
      var x = r.X(d[4]), y = r.Y(d[3]) - 12;
      var anchor = x > 400 ? 'end' : 'middle';
      var xx = x + (x > 400 ? -6 : 0);
      r.tag.setAttribute('opacity', 1);
      r.tagZh.setAttribute('x', xx); r.tagZh.setAttribute('y', Math.max(y, 20));
      r.tagZh.setAttribute('text-anchor', anchor);
      r.tagZh.textContent = d[0] + '（' + d[1] + '）tm ' + d[3] + 's · 凝膠 ' + d[4] + '%';
      r.tagEn.setAttribute('x', xx); r.tagEn.setAttribute('y', Math.max(y, 20));
      r.tagEn.setAttribute('text-anchor', anchor);
      r.tagEn.textContent = d[0] + ' (' + d[5] + ') tm ' + d[3] + 's · gel ' + d[4] + '%';
    } else {
      r.tag.setAttribute('opacity', 0);
    }
  },

  readout: function (ctx) {
    var hov = ctx.params.hov;
    var rows = [['tm 對總凝膠 <b>正相關</b>（宏觀＋微觀合計才算）',
                 'tm vs total gel is a <b>positive</b> relation (macro + microgel combined)']];
    if (hov != null && hov >= 0) {
      var d = D_TMGEL[hov];
      rows.push(['<b>' + d[0] + '</b>（' + d[1] + ' ' + d[6] + '）：ML ' + d[2] + ' · tm <b>' + d[3] + ' s</b> · 總凝膠 <b>' + d[4] + '%</b>',
        '<b>' + d[0] + '</b> (' + d[5] + '): ML ' + d[2] + ' · tm <b>' + d[3] + ' s</b> · total gel <b>' + d[4] + '%</b>']);
    }
    return rows;
  },

  guide: function (ctx) {
    if (ctx.s >= 1) {
      return ['重點：單看宏觀凝膠或微觀凝膠都對不上，要「總量」才相關——鬆弛聽得到的是凝膠總量，不是分子量。',
              'The catch: neither macrogel nor microgel alone correlates — only the total does. Relaxation hears total gel, not molecular weight.'];
    }
    return null;
  }
});
