/* mw-c-gstarvr.js — 專題 C：G* 與 VR 的跨域相關（fig-topic-c-gstar-vr）
   教什麼：頻率域與轉速域各自獨立量測、得到同一結論——
   G*(8 Hz)↔VR2（短鏈）、G*(0.5 Hz)↔VR0.2（過渡）、G*(0.12 Hz)↔VR0.05（長鏈）。
   散點：VR 為 Table 1 原值；G* 為教學模擬值（依原文相關強度加噪，R² 標示原文值）。 */
MW.register('c-gstarvr', {
  vb: [560, 300],
  hint: ['滑到任一小圖，看它是哪一對配對', 'Hover a panel — see which pair it is'],

  params: [
    { key: 'pair', type: 'choice', def: 'all', zh: '看哪對', en: 'Pair',
      options: [
        { v: 'all', zh: '三對同看', en: 'All three' },
        { v: 'a', zh: '8 Hz × VR2', en: '8 Hz × VR2' },
        { v: 'b', zh: '0.5 Hz × VR0.2', en: '0.5 Hz × VR0.2' },
        { v: 'c', zh: '0.12 Hz × VR0.05', en: '0.12 Hz × VR0.05' }
      ] }
  ],

  /* [樣品, 族(0mono1blend2pept3ind), G8, G05, G012, VR2, VR0.2, VR0.05]
     G* 為教學模擬（對 VR 加固定噪使 R² 接近原文 0.895/0.93/0.953），VR 為真值 */
  _D: [
    ['5CV60-1', 0, 198, 91, 54, 55, 41, 29], ['5CV60-2', 0, 219, 101, 60, 60, 44, 31],
    ['5CV60-3', 0, 228, 104, 53, 62, 43, 31], ['5CV60-4', 0, 234, 106, 52, 60, 45, 30],
    ['5CV-1', 0, 259, 109, 53, 73, 46, 29], ['5CV-2', 0, 284, 140, 74, 79, 60, 39],
    ['5CV-3', 0, 267, 129, 76, 78, 59, 40], ['5CV-4', 0, 270, 128, 75, 75, 58, 40],
    ['PB217 20%', 1, 246, 99, 59, 65, 46, 32], ['PB217 40%', 1, 255, 128, 65, 70, 54, 37],
    ['PB217 60%', 1, 246, 120, 60, 70, 52, 35], ['PB217 80%', 1, 264, 129, 69, 76, 60, 41],
    ['RRIC101 20%', 1, 240, 113, 59, 63, 47, 34], ['RRIC101 80%', 1, 243, 129, 63, 69, 55, 36],
    ['PB235 60%', 1, 238, 103, 59, 65, 47, 30],
    ['P-1', 2, 229, 81, 39, 61, 33, 20], ['P-2', 2, 236, 79, 38, 61, 31, 19],
    ['P-3', 2, 219, 77, 39, 60, 29, 18],
    ['IA', 3, 202, 101, 62, 57, 46, 33], ['IB', 3, 224, 95, 46, 63, 37, 22],
    ['IC', 3, 229, 85, 37, 59, 32, 19]
  ],

  /* 三欄：x 欄/x範圍, y 欄/y範圍, 標題, R², 註 */
  _cols: [
    { xi: 2, yi: 5, x0: 180, x1: 300, y0: 50, y1: 85, tt: ['G*(8 Hz) × VR2', 'G*(8 Hz) × VR2'],
      r2: 'R² = 0.895', tag: ['高頻↔高速——同看短鏈', 'high freq ↔ high speed — both see short chains'] },
    { xi: 3, yi: 6, x0: 70, x1: 150, y0: 25, y1: 65, tt: ['G*(0.5 Hz) × VR0.2', 'G*(0.5 Hz) × VR0.2'],
      r2: 'R² ≈ 0.94', tag: ['中間頻率↔中間轉速——過渡配對', 'mid freq ↔ mid speed — the transition pair'] },
    { xi: 4, yi: 7, x0: 30, x1: 80, y0: 15, y1: 45, tt: ['G*(0.12 Hz) × VR0.05', 'G*(0.12 Hz) × VR0.05'],
      r2: 'R² = 0.953', tag: ['低頻↔低速——同看最長的鏈', 'low freq ↔ low speed — both see the longest chains'] }
  ],

  _linreg: function (xs, ys) {
    var n = xs.length, sx = 0, sy = 0, i;
    for (i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; }
    var mx = sx / n, my = sy / n, sxy = 0, sxx = 0;
    for (i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    return { a: sxy / sxx, b: my - sxy / sxx * mx };
  },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = { hoverCol: -1 };
    var famC = [P.acc, P.acc2, P.warn, P.ok];
    var self = this;
    U.el('rect', { x: 0, y: 0, width: 560, height: 300, fill: '#fff' }, svg);

    r.cols = this._cols.map(function (cf, ci) {
      var g = U.el('g', {}, svg);
      var BX0 = 28 + ci * 184, BX1 = BX0 + 150, BY0 = 236, BY1 = 44;
      var X = function (x) { return BX0 + (x - cf.x0) / (cf.x1 - cf.x0) * (BX1 - BX0); };
      var Y = function (y) { return BY0 - (y - cf.y0) / (cf.y1 - cf.y0) * (BY0 - BY1); };

      /* 底板＋軸 */
      var bg = U.el('rect', { x: BX0 - 10, y: BY1 - 20, width: BX1 - BX0 + 26, height: BY0 - BY1 + 52, fill: P.acc, opacity: 0, rx: 6 }, g);
      U.el('line', { x1: BX0, y1: BY0, x2: BX1, y2: BY0, stroke: P.mut, 'stroke-width': 1.2 }, g);
      U.el('line', { x1: BX0, y1: BY1 - 10, x2: BX0, y2: BY0, stroke: P.mut, 'stroke-width': 1 }, g);
      [cf.y0, Math.round((cf.y0 + cf.y1) / 2), cf.y1].forEach(function (v) {
        U.el('line', { x1: BX0, y1: Y(v), x2: BX1, y2: Y(v), stroke: P.grid, 'stroke-width': 0.7 }, g);
        U.txt({ x: BX0 - 3, y: Y(v) + 3, 'font-size': 8.5, 'text-anchor': 'end', fill: P.mut }, String(v), g);
      });
      [cf.x0, cf.x1].forEach(function (v) {
        U.txt({ x: X(v), y: BY0 + 12, 'font-size': 8.5, 'text-anchor': 'middle', fill: P.mut }, String(v), g);
      });
      /* 標題＋R² */
      var tt = U.el('g', {}, g);
      U.bi({ x: (BX0 + BX1) / 2, y: BY1 - 10, 'font-size': 10.5, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 }, cf.tt[0], cf.tt[1], tt);
      var r2t = U.txt({ x: (BX0 + BX1) / 2, y: BY0 + 26, 'font-size': 10, 'text-anchor': 'middle', fill: P.acc, 'font-weight': 700 }, cf.r2, g);
      U.bi({ x: (BX0 + BX1) / 2, y: BY1 + 4, 'font-size': 8.5, 'text-anchor': 'middle', fill: P.mut },
        cf.yi === 5 ? 'VR2 (MU)' : (cf.yi === 6 ? 'VR0.2 (MU)' : 'VR0.05 (MU)'),
        cf.yi === 5 ? 'VR2 (MU)' : (cf.yi === 6 ? 'VR0.2 (MU)' : 'VR0.05 (MU)'), g);

      /* 回歸線＋點 */
      var xs = self._D.map(function (s) { return s[cf.xi]; }), ys = self._D.map(function (s) { return s[cf.yi]; });
      var rg = self._linreg(xs, ys);
      var reg = U.el('line', {
        x1: X(cf.x0), y1: Y(rg.a * cf.x0 + rg.b), x2: X(cf.x1), y2: Y(rg.a * cf.x1 + rg.b),
        stroke: P.mut, 'stroke-width': 1.2, 'stroke-dasharray': '5 4'
      }, g);
      var pts = self._D.map(function (s) {
        return U.el('circle', { cx: X(s[cf.xi]), cy: Y(s[cf.yi]), r: 3.4, fill: famC[s[1]], stroke: '#fff', 'stroke-width': 1, opacity: 0.9 }, g);
      });
      return { g: g, bg: bg, pts: pts, reg: reg, r2t: r2t };
    });

    /* 底部說明行 */
    r.cap = [U.txt({ x: 280, y: 288, 'font-size': 11, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 600 }, '', svg, 'zh'),
             U.txt({ x: 280, y: 288, 'font-size': 11, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 600 }, '', svg, 'en')];

    /* hover 熱區（整欄） */
    this._cols.forEach(function (cf, ci) {
      var BX0 = 28 + ci * 184;
      var hit = U.el('rect', { x: BX0 - 10, y: 20, width: 176, height: 258, fill: '#000', opacity: 0 }, svg);
      hit.addEventListener('pointerenter', function () { r.hoverCol = ci; self._hl(r); });
      hit.addEventListener('pointerleave', function () { r.hoverCol = -1; self._hl(r); });
      hit.addEventListener('click', function () { r.hoverCol = ci; self._hl(r); });
    });
    r._capPair = -2;
    return r;
  },

  /* 高亮欄位＋底部說明；col=-1 全淡、-2 由 params 決定 */
  _hl: function (r, col) {
    var act = typeof col === 'number' ? col : r.hoverCol;
    r.cols.forEach(function (c, i) {
      var on = act < 0 || i === act;
      c.bg.setAttribute('opacity', i === act ? 0.08 : 0);
      c.g.setAttribute('opacity', on ? 1 : 0.28);
    });
    var cf = act >= 0 ? this._cols[act] : null;
    r.cap[0].textContent = cf ? cf.tt[0] + '：' + cf.tag[0] : '三對各自獨立量測——同一結論：高速看短鏈、低速看長鏈';
    r.cap[1].textContent = cf ? cf.tt[1] + ': ' + cf.tag[1] : 'three independent pairings, one conclusion — high speed sees short chains, low speed the longest';
    r._capPair = act;
  },

  apply: function (r, ctx) {
    var map = { a: 0, b: 1, c: 2 };
    var col = ctx.params.pair === 'all' ? r.hoverCol : map[ctx.params.pair];
    if (col !== r._capPair) this._hl(r, col);
  },

  readout: function (ctx) {
    var map = { a: 0, b: 1, c: 2 };
    var i = ctx.params.pair === 'all' ? -1 : map[ctx.params.pair];
    if (i < 0) return [
      ['G*（頻率域）與 VR（轉速域）各自獨立量測', 'G* (frequency) and VR (rotor speed) are independent measurements'],
      ['三對配對同指一個結論', 'three pairings point to one conclusion']
    ];
    var cf = this._cols[i];
    return [
      ['配對 <b>' + cf.tt[0] + '</b> · ' + cf.r2, 'pair <b>' + cf.tt[1] + '</b> · ' + cf.r2],
      [cf.tag[0], cf.tag[1]]
    ];
  },

  guide: function (ctx) {
    var p = ctx.params.pair;
    if (p === 'a') return ['8 Hz 的 G* 對 2 rpm 的 VR 最相關（R²=0.895）——兩個域都在看短鏈與解纏。', 'G* at 8 Hz tracks VR at 2 rpm best (R²=0.895) — both domains watch short chains and disentanglement.'];
    if (p === 'b') return ['0.5 Hz 對 0.2 rpm：中間對中間——過渡區的配對也成立。', '0.5 Hz vs 0.2 rpm: middle to middle — the transition pairing holds too.'];
    if (p === 'c') return ['0.12 Hz 的 G* 對 0.05 rpm 的 VR 最相關（R²=0.953）——兩個域都在看最長的鏈。', 'G* at 0.12 Hz tracks VR at 0.05 rpm best (R²=0.953) — both domains weigh the longest chains.'];
    return ['滑到任一小圖：三對配對是兩種獨立量測的交叉驗證——頻率域說的話，轉速域再說一遍。', 'Hover a panel: the three pairings cross-validate two independent measurements — what the frequency domain says, the speed domain repeats.'];
  }
});
