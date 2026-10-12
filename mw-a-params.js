/* mw-a-params.js — 專題A · 哪個參數帶獨立情報？（Maláč 2011 Table 1 原值，Fig. 4/6/8）
   故事：18 品級真值作圖——峰對 ML 散（R²=0.238）、k 對 ML 貼線（R²=0.982）、a 對 ML 散（R²=0.293）。
   互動：三幅散點切換；hover 點看是哪個品級。回歸線只在 k 圖畫（k = 0.9312·ML − 15.53）。 */
MW.register('a-params', {
  vb: [520, 300],
  hint: ['切換三幅散點，滑到點上看是哪個品級', 'Switch scatter views; hover a dot to see its grade'],

  params: [
    { key: 'view', type: 'choice', def: 'peak',
      zh: '縱軸參數', en: 'Y-axis parameter',
      options: [
        { v: 'peak', zh: '初始峰 對 ML', en: 'peak vs ML' },
        { v: 'k', zh: 'k 對 ML', en: 'k vs ML' },
        { v: 'a', zh: 'a 對 ML', en: 'a vs ML' }
      ] }
  ],

  scrub: { panel: 0, fn: function (x01, st) {
    /* 三圖共用 ML 橫軸：找 ML 距離最近的點 */
    var px = x01 * 520;
    var ml = 55 + (px - 52) / (505 - 52) * (100 - 55);
    var best = -1, bd = 1e9;
    for (var i = 0; i < 18; i++) {
      var dd = Math.abs(A_PARAMS_T[i][2] - ml);
      if (dd < bd) { bd = dd; best = i; }
    }
    st.params.hov = best;
  } },

  /* 18 品級真值表（Maláč 2011 Table 1）：[品級, 初始峰, ML, a, k, (a+1)] */
  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 52, PX1 = 505, PY0 = 256, PY1 = 20;
    var X = function (ml) { return PX0 + (ml - 55) / (100 - 55) * (PX1 - PX0); };
    r.PX0 = PX0; r.PX1 = PX1; r.PY0 = PY0; r.PY1 = PY1; r.X = X;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 橫軸 ML（三圖共用） */
    r.xaxis = U.el('g', {}, svg);
    [60, 70, 80, 90, 100].forEach(function (m) {
      U.el('line', { x1: X(m), y1: PY0, x2: X(m), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, r.xaxis);
      U.txt({ x: X(m), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(m), r.xaxis);
    });
    U.el('line', { x1: PX0, y1: PY0, x2: PX1, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, r.xaxis);
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, r.xaxis);
    U.txt({ x: PX1, y: PY0 + 27, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'ML(1+4)', r.xaxis);

    /* 三組子圖（各自網格、縱軸、散點、回歸線），apply 只亮一組 */
    var V = A_PARAMS_V;
    r.groups = {};
    for (var vk in V) {
      var cf = V[vk], g = U.el('g', { opacity: 0 }, svg);
      var gg = { g: g, dots: [] };
      var Yv = function (v, c) { return PY0 - (v - c.ymin) / (c.ymax - c.ymin) * (PY0 - PY1); };
      cf.ticks.forEach(function (tv) {
        U.el('line', { x1: PX0, y1: Yv(tv, cf), x2: PX1, y2: Yv(tv, cf), stroke: P.grid, 'stroke-width': 0.8 }, g);
        U.txt({ x: PX0 - 6, y: Yv(tv, cf) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut },
          String(tv).replace('-', '−'), g);
      });
      U.bi({ x: (PX0 + PX1) / 2, y: PY1 - 6, 'font-size': 11, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 },
        cf.ttl[0], cf.ttl[1], g);
      /* 散點 */
      for (var i = 0; i < 18; i++) {
        var gr = A_PARAMS_T[i];
        var dot = U.el('circle', {
          cx: X(gr[2]), cy: Yv(gr[cf.yi], cf), r: 4,
          fill: P.acc, opacity: 0.75, stroke: '#fff', 'stroke-width': 1
        }, g);
        dot._gi = i;
        gg.dots.push(dot);
      }
      /* k 圖的回歸線 k = 0.9312·ML − 15.53 */
      if (cf.line) {
        var m1 = 56, m2 = 99;
        gg.reg = U.el('line', {
          x1: X(m1), y1: Yv(cf.line[0] * m1 + cf.line[1], cf),
          x2: X(m2), y2: Yv(cf.line[0] * m2 + cf.line[1], cf),
          stroke: P.warn, 'stroke-width': 1.6, 'stroke-dasharray': '6 4'
        }, g);
        gg.regTxt = U.txt({ x: X(97), y: Yv(cf.line[0] * 97 + cf.line[1], cf) + 14, 'font-size': 9.5, 'text-anchor': 'end', fill: P.warn },
          'k = 0.9312·ML − 15.53', g);
      }
      /* R² 徽章 */
      gg.r2 = U.el('g', {}, g);
      U.el('rect', { x: PX0 + 6, y: PY1 + 2, width: 96, height: 20, rx: 4, fill: P.soft, stroke: P.line, 'stroke-width': 0.8 }, gg.r2);
      U.txt({ x: PX0 + 12, y: PY1 + 16, 'font-size': 11, fill: P.ink, 'font-weight': 700 }, 'R² = ' + cf.r2, gg.r2);
      r.groups[vk] = gg;
    }

    /* hover 標籤（一個共用，跟著最近點） */
    r.tag = U.el('g', { opacity: 0 }, svg);
    r.tagTxt = U.txt({ x: 0, y: 0, 'font-size': 10, fill: P.ink, 'font-weight': 600 }, '', r.tag);

    return r;
  },

  apply: function (r, ctx) {
    var view = ctx.params.view, hov = ctx.params.hov;
    for (var vk in r.groups) {
      r.groups[vk].g.setAttribute('opacity', vk === view ? 1 : 0);
    }
    var cf = A_PARAMS_V[view];
    var Yv = function (v) { return r.PY0 - (v - cf.ymin) / (cf.ymax - cf.ymin) * (r.PY0 - r.PY1); };
    var dots = r.groups[view].dots;
    for (var i = 0; i < dots.length; i++) {
      var on = (i === hov);
      dots[i].setAttribute('r', on ? 6 : 4);
      dots[i].setAttribute('fill', on ? MW.PAL.acc2 : MW.PAL.acc);
      dots[i].setAttribute('opacity', hov == null || hov < 0 ? 0.75 : (on ? 1 : 0.4));
    }
    if (hov != null && hov >= 0) {
      var gr = A_PARAMS_T[hov];
      var x = r.X(gr[2]), y = Yv(gr[cf.yi]) - 10;
      if (x > 400) x = x - 4;
      r.tag.setAttribute('opacity', 1);
      r.tagTxt.setAttribute('x', Math.min(x + 2, 505));
      r.tagTxt.setAttribute('y', Math.max(y, 30));
      r.tagTxt.setAttribute('text-anchor', x > 400 ? 'end' : 'middle');
      r.tagTxt.textContent = gr[0];
    } else {
      r.tag.setAttribute('opacity', 0);
    }
  },

  readout: function (ctx) {
    var cf = A_PARAMS_V[ctx.params.view], hov = ctx.params.hov;
    var rows = [
      [cf.ttl[0] + '　R² = <b>' + cf.r2 + '</b>', cf.ttl[1] + '　R² = <b>' + cf.r2 + '</b>'],
      [cf.rd[0], cf.rd[1]]
    ];
    if (hov != null && hov >= 0) {
      var g = A_PARAMS_T[hov];
      rows.push(['<b>' + g[0] + '</b>：ML ' + g[2] + ' · 峰 ' + g[1] + ' · k ' + g[4] + ' · a ' + String(g[3]).replace('-', '−'),
        '<b>' + g[0] + '</b>: ML ' + g[2] + ' · peak ' + g[1] + ' · k ' + g[4] + ' · a ' + g[3]]);
    }
    return rows;
  },

  guide: function (ctx) {
    return A_PARAMS_V[ctx.params.view].gd;
  }
});

/* ---- 共用資料（批次 S3 真值表，18 品級全） ----
   [品級, 初始峰, ML, a, k, (a+1)] */
var A_PARAMS_T = [
  ['SVR 10, 1144', 120.7, 96.1, -0.211, 74.5, 0.79],
  ['NAT 10, 1045', 123.4, 94.8, -0.226, 72.2, 0.77],
  ['NAT 10, 1042', 131.3, 91.6, -0.248, 70.3, 0.75],
  ['NAT 10, 1046', 143.6, 94.0, -0.238, 73.0, 0.76],
  ['SMR L',        108.4, 64.8, -0.247, 40.9, 0.75],
  ['PAKRUB 10, 1022', 132.0, 97.3, -0.216, 75.5, 0.78],
  ['PAKRUB 10, 1025', 122.7, 94.6, -0.232, 71.7, 0.77],
  ['PAKRUB 10, 1024', 128.5, 96.8, -0.218, 73.9, 0.78],
  ['NR SVR 10',     62.2, 58.0, -0.251, 42.0, 0.75],
  ['NR SVR 3L',    179.0, 97.5, -0.201, 76.5, 0.80],
  ['NR PANRUB 5L', 198.7, 83.9, -0.254, 63.2, 0.75],
  ['NR SVR CV 60', 105.3, 62.6, -0.377, 44.5, 0.62],
  ['PANRUB 5 CV 60', 130.3, 72.2, -0.291, 52.5, 0.71],
  ['SVR 10, 1383', 113.2, 97.4, -0.250, 75.1, 0.75],
  ['NAT 10, 20',   103.3, 85.8, -0.311, 65.3, 0.69],
  ['NAT 10, 22',    88.2, 78.2, -0.316, 56.4, 0.68],
  ['SVR 3L, 1100', 137.5, 81.5, -0.239, 58.7, 0.76],
  ['SVR CV 60, 31', 118.5, 71.6, -0.214, 48.4, 0.79]
];

/* 三幅散點設定：縱軸欄位 yi（真值表欄序）、範圍、刻度、R² 與一句讀法 */
var A_PARAMS_V = {
  peak: {
    yi: 1, ymin: 40, ymax: 210, ticks: [50, 100, 150, 200], line: null, r2: '0.238',
    ttl: ['初始扭矩峰 對 ML', 'initial torque peak vs ML'],
    rd: ['峰與 ML 只有弱相關——過衝高不代表難加工，峰說的是生膠強度',
         'Peak correlates with ML only weakly — a tall overshoot does not mean hard to process; the peak speaks of green strength'],
    gd: ['第一幅：點是散的——峰高低幾乎預測不了 ML。', 'First view: the dots scatter — peak height barely predicts ML.']
  },
  k: {
    yi: 4, ymin: 35, ymax: 80, ticks: [40, 50, 60, 70, 80], line: [0.9312, -15.53], r2: '0.982',
    ttl: ['k 對 ML', 'k vs ML'],
    rd: ['k 幾乎是 ML 的直線——它只是用鬆弛段把粘度再說一遍，不是新情報',
         'k sits almost on a line through ML — it merely restates viscosity from the relaxation segment, no new information'],
    gd: ['第二幅：點全貼在線上——k 不能當彈性指標，它帶的還是粘度。', 'Second view: dots hug the line — k is no elasticity index; what it carries is still viscosity.']
  },
  a: {
    yi: 3, ymin: -0.40, ymax: -0.16, ticks: [-0.4, -0.3, -0.2], line: null, r2: '0.293',
    ttl: ['鬆弛指數 a 對 ML', 'relaxation exponent a vs ML'],
    rd: ['a 與 ML 幾乎無關——同樣的 ML，彈性可以差很多；a 帶的是 ML 看不到的那一面',
         'a is essentially uncorrelated with ML — same ML, very different elasticity; a carries the side ML cannot see'],
    gd: ['第三幅：又散開了——這次散得好：a 說的是 ML 量不到的彈性。', 'Third view: scattered again — but this scatter is the point: a reports the elasticity ML cannot measure.']
  }
};
