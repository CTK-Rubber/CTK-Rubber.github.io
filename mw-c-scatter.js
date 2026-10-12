/* mw-c-scatter.js — 專題 C：VR 對分子量散點雙面板（fig-topic-c-mn-mw）
   教什麼：高速端 VR2 對 Mn（R²=0.851，各族成群）／低速端 VR0.05 對 Mw（R²=0.931，幾乎貼線）——
   「高速看鏈的數量、低速看最長的鏈」的直接證據。
   散點：Table 1 原值 21 樣品；回歸線為表值重算（R² 標示原文報告值）。 */
MW.register('c-scatter', {
  vb: [[470, 300], [470, 300]],
  hint: ['滑到點上看樣品名；按鈕可切單圖放大', 'Hover a point for its sample name; buttons focus one panel'],

  params: [
    { key: 'view', type: 'choice', def: 'all', zh: '看哪幅', en: 'View',
      options: [
        { v: 'all', zh: '雙面板', en: 'Both' },
        { v: 'mn', zh: 'VR2 對 Mn', en: 'VR2 vs Mn' },
        { v: 'mw', zh: 'VR0.05 對 Mw', en: 'VR0.05 vs Mw' }
      ] }
  ],

  /* [族, 樣品, Mn, Mw, VR2, VR0.2, VR0.05] — Table 1 原值 */
  _S: [
    ['mono', '5CV60-1', 480, 1450, 55, 41, 29], ['mono', '5CV60-2', 500, 1380, 60, 44, 31],
    ['mono', '5CV60-3', 520, 1380, 62, 43, 31], ['mono', '5CV60-4', 520, 1430, 60, 45, 30],
    ['mono', '5CV-1', 710, 1340, 73, 46, 29], ['mono', '5CV-2', 710, 1470, 79, 60, 39],
    ['mono', '5CV-3', 770, 1440, 78, 59, 40], ['mono', '5CV-4', 730, 1540, 75, 58, 40],
    ['blend', 'PB217 20%', 570, 1420, 65, 46, 32], ['blend', 'PB217 40%', 610, 1430, 70, 54, 37],
    ['blend', 'PB217 60%', 600, 1380, 70, 52, 35], ['blend', 'PB217 80%', 700, 1480, 76, 60, 41],
    ['blend', 'RRIC101 20%', 610, 1430, 63, 47, 34], ['blend', 'RRIC101 80%', 710, 1560, 69, 55, 36],
    ['blend', 'PB235 60%', 554, 1280, 65, 47, 30],
    ['peptized', 'P-1', 480, 910, 61, 33, 20], ['peptized', 'P-2', 520, 960, 61, 31, 19],
    ['peptized', 'P-3', 490, 840, 60, 29, 18],
    ['industrial', 'IA', 505, 1581, 57, 46, 33], ['industrial', 'IB', 450, 920, 63, 37, 22],
    ['industrial', 'IC', 400, 870, 59, 32, 19]
  ],
  _fam: { mono: 0, blend: 1, peptized: 2, industrial: 3 },
  _famC: null,   /* 在 build 以 PAL 填入 */
  _famN: [['單株', 'mono'], ['混摻', 'blend'], ['塑解', 'peptized'], ['工業', 'industrial']],

  _linreg: function (xs, ys) {
    var n = xs.length, sx = 0, sy = 0, i;
    for (i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; }
    var mx = sx / n, my = sy / n, sxy = 0, sxx = 0;
    for (i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    return { a: sxy / sxx, b: my - sxy / sxx * mx };
  },

  _panel: function (svg, U, cf) {
    var P = U.PAL;
    var PX0 = 46, PX1 = 460, PY0 = 258, PY1 = 34;
    var X = function (x) { return PX0 + (x - cf.x0) / (cf.x1 - cf.x0) * (PX1 - PX0); };
    var Y = function (y) { return PY0 - (y - cf.y0) / (cf.y1 - cf.y0) * (PY0 - PY1); };
    U.el('rect', { x: 0, y: 0, width: 470, height: 300, fill: '#fff' }, svg);
    cf.yticks.forEach(function (v) {
      U.el('line', { x1: PX0, y1: Y(v), x2: PX1, y2: Y(v), stroke: P.grid, 'stroke-width': v === cf.yticks[0] ? 1.4 : 0.8 }, svg);
      U.txt({ x: PX0 - 6, y: Y(v) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(v), svg);
    });
    cf.xticks.forEach(function (v) {
      U.el('line', { x1: X(v), y1: PY0, x2: X(v), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(v), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(v), svg);
    });
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.bi({ x: PX1, y: PY0 + 28, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, cf.xl[0], cf.xl[1], svg);
    U.bi({ x: PX0 - 4, y: PY1 - 10, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, cf.yl[0], cf.yl[1], svg);
    U.bi({ x: PX0 + 6, y: PY1 - 10, 'font-size': 11, fill: P.ink, 'font-weight': 700 }, cf.tt[0], cf.tt[1], svg);
    var dim = U.el('rect', { x: 0, y: 0, width: 470, height: 300, fill: '#fff', opacity: 0, 'pointer-events': 'none' }, svg);
    return { X: X, Y: Y, PX0: PX0, PX1: PX1, PY0: PY0, PY1: PY1, dim: dim };
  },

  build: function (svgs, U) {
    var P = U.PAL, r = {};
    this._famC = [P.acc, P.acc2, P.warn, P.ok];
    var S = this._S, self = this;

    /* 左：VR2 對 Mn */
    var L = this._panel(svgs[0], U, {
      x0: 350, x1: 820, y0: 50, y1: 85,
      xticks: [400, 500, 600, 700, 800], yticks: [50, 60, 70, 80],
      xl: ['Mn kg/mol', 'Mn kg/mol'], yl: ['VR2 (MU)', 'VR2 (MU)'],
      tt: ['VR2 對 Mn——R² = 0.851（原文）', 'VR2 vs Mn — R² = 0.851 (paper)']
    });
    r.L = L;

    /* 右：VR0.05 對 Mw */
    var R = this._panel(svgs[1], U, {
      x0: 780, x1: 1620, y0: 14, y1: 44,
      xticks: [800, 1000, 1200, 1400, 1600], yticks: [20, 30, 40],
      xl: ['Mw kg/mol', 'Mw kg/mol'], yl: ['VR0.05 (MU)', 'VR0.05 (MU)'],
      tt: ['VR0.05 對 Mw——R² = 0.931（原文）', 'VR0.05 vs Mw — R² = 0.931 (paper)']
    });
    r.R = R;

    /* 回歸線（表值重算） */
    var mns = S.map(function (s) { return s[2]; }), mws = S.map(function (s) { return s[3]; });
    var v2s = S.map(function (s) { return s[4]; }), v05s = S.map(function (s) { return s[6]; });
    var rL = this._linreg(mns, v2s), rR = this._linreg(mws, v05s);
    U.el('line', { x1: L.X(400), y1: L.Y(rL.a * 400 + rL.b), x2: L.X(770), y2: L.Y(rL.a * 770 + rL.b),
      stroke: P.mut, 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, svgs[0]);
    U.el('line', { x1: R.X(840), y1: R.Y(rR.a * 840 + rR.b), x2: R.X(1581), y2: R.Y(rR.a * 1581 + rR.b),
      stroke: P.mut, 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, svgs[1]);

    /* 圖例（左面板） */
    var lg = U.el('g', {}, svgs[0]);
    this._famN.forEach(function (f, i) {
      var gx = L.PX0 + 8 + i * 62;
      U.el('circle', { cx: gx, cy: 22, r: 4, fill: self._famC[i] }, lg);
      U.txt({ x: gx + 7, y: 25, 'font-size': 9.5, fill: P.mut }, f[0], lg, 'zh');
      U.txt({ x: gx + 7, y: 25, 'font-size': 9.5, fill: P.mut }, f[1], lg, 'en');
    });

    /* 散點＋hover 名（標籤最後建，壓在點上） */
    function dots(svg, p, fx, fy) {
      var hov;
      S.forEach(function (s) {
        var c = U.el('circle', {
          cx: p.X(fx(s)), cy: p.Y(fy(s)), r: 4.5,
          fill: self._famC[self._fam[s[0]]], stroke: '#fff', 'stroke-width': 1.2, opacity: 0.9
        }, svg);
        c.addEventListener('pointerenter', function () {
          c.setAttribute('r', 7); c.setAttribute('stroke', '#1f2933'); c.setAttribute('stroke-width', 1.6);
          var nx = Math.max(30, Math.min(440, p.X(fx(s)))), ny = Math.max(14, p.Y(fy(s)) - 10);
          hov.setAttribute('x', nx); hov.setAttribute('y', ny);
          hov.textContent = s[1]; hov.setAttribute('opacity', 1);
        });
        c.addEventListener('pointerleave', function () {
          c.setAttribute('r', 4.5); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', 1.2);
          hov.setAttribute('opacity', 0);
        });
      });
      hov = U.txt({ 'font-size': 10.5, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700, opacity: 0 }, '', svg);
    }
    dots(svgs[0], L, function (s) { return s[2]; }, function (s) { return s[4]; });
    dots(svgs[1], R, function (s) { return s[3]; }, function (s) { return s[6]; });

    return r;
  },

  apply: function (r, ctx) {
    var v = ctx.params.view;
    r.L.dim.setAttribute('opacity', v === 'mw' ? 0.72 : 0);
    r.R.dim.setAttribute('opacity', v === 'mn' ? 0.72 : 0);
    /* dim 遮罩要壓在散點上：移到 svg 末尾 */
    r.L.dim.parentNode.appendChild(r.L.dim);
    r.R.dim.parentNode.appendChild(r.R.dim);
  },

  readout: function (ctx) {
    var v = ctx.params.view;
    if (v === 'mn') return [
      ['R² = <b>0.851</b>（原文）', 'R² = <b>0.851</b> (paper)'],
      ['各族各自成群——同 Mn、分布不同，VR2 仍有差', 'families cluster — same Mn but different distributions still read differently']
    ];
    if (v === 'mw') return [
      ['R² = <b>0.931</b>（原文）', 'R² = <b>0.931</b> (paper)'],
      ['21 個樣品幾乎貼線——低速端讀值主要由最長的鏈決定', '21 samples nearly on the line — the low-speed reading is set by the longest chains']
    ];
    return [
      ['左：VR2–Mn <b>R² 0.851</b>', 'left: VR2–Mn <b>R² 0.851</b>'],
      ['右：VR0.05–Mw <b>R² 0.931</b>', 'right: VR0.05–Mw <b>R² 0.931</b>'],
      ['高速端看「鏈的數量」、低速端看「最長的鏈」', 'high speed counts chains (Mn), low speed weighs the longest (Mw)']
    ];
  },

  guide: function (ctx) {
    var v = ctx.params.view;
    if (v === 'mn') return ['放大看左圖：整體往上走（Mn 越多越黏），但各族各自成群——單靠 VR2 分不出結構差異。', 'Zoomed left: the trend rises with Mn, but families form their own clusters — VR2 alone cannot separate structure.'];
    if (v === 'mw') return ['放大看右圖：塑解、工業、單株、混摻全貼到同一條線——這就是「低速端對 Mw 敏感」。', 'Zoomed right: peptized, industrial, mono and blend all land on one line — this is what "low speed sees Mw" means.'];
    return ['兩幅對照看：同一批樣品，高速端跟 Mn 走、低速端跟 Mw 走——轉速決定木尼在看分子的哪一段。', 'Compare the panels: same samples — the high-speed reading tracks Mn, the low-speed reading tracks Mw. Rotor speed picks which part of the molecule answers.'];
  }
});
