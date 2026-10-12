/* mw-c-gstar.js — 專題 C：G*–頻率圖與三個頻帶（fig-topic-c-gstar-freq）
   教什麼：動態力學 G* 是頻率域的對照量測——高頻（短時間尺度）看短鏈、
   低頻（長時間尺度）看最長的鏈；三個頻帶對應三個轉速檔位。
   曲線為教學近似（單株 8 樣品的 G*(f) 冪律族）；頻帶對應依 Table 2。 */
MW.register('c-gstar', {
  vb: [520, 300],
  hint: ['滑到圖上選頻帶，看這個頻率對應哪一段鏈', 'Hover to pick a frequency band — see which chain length answers'],

  params: [
    { key: 'lf', type: 'range', min: -1.7, max: 1.5, step: 0.01, def: -0.92,
      zh: '頻率', en: 'Frequency',
      fmt: function (v) { var f = Math.pow(10, v); return (f < 1 ? f.toFixed(2) : f.toFixed(1)) + ' Hz'; },
      onSet: function (st) { st.params._manual = 1; } }
  ],

  scrub: { panel: 0, x0: 50, x1: 505, fn: function (x01, st) {
    st.params._manual = 1;
    st.params.lf = -1.7 + x01 * 3.2;
  } },

  /* 三頻帶：[Hz, 對應轉速, zh 看什麼, en]（對應依原文 Table 2 近似） */
  _bands: [
    [0.12, '0.05 rpm', '長時間尺度——最長的鏈主導（對 Mw 敏感）', 'long timescale — the longest chains answer (Mw-sensitive)'],
    [0.5, '0.2 rpm', '過渡區——中間長度的鏈', 'transition — mid-length chains'],
    [8, '2 rpm', '短時間尺度——短鏈與解纏主導（對 Mn 敏感）', 'short timescale — short chains & disentanglement (Mn-sensitive)']
  ],

  /* 單株 8 樣品 G*(8Hz) 位準（教學近似，對齊 c-gstarvr 的合成 G* 表） */
  _g8: [198, 219, 228, 234, 259, 284, 267, 270],

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 50, PX1 = 505, PY0 = 255, PY1 = 22;
    var L0 = -1.7, L1 = 1.5;             /* 0.02 – 30 Hz */
    var Y0 = 30, Y1 = 500;               /* G* kPa（log） */
    var X = function (lf) { return PX0 + (lf - L0) / (L1 - L0) * (PX1 - PX0); };
    var Y = function (g) { var lg = Math.log(g) / Math.LN10; return PY0 - (Math.log(g) / Math.LN10 - Math.log(Y0) / Math.LN10) / (Math.log(Y1) / Math.LN10 - Math.log(Y0) / Math.LN10) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.L0 = L0; r.L1 = L1; r.PY1 = PY1; r.PY0 = PY0; r.PX1 = PX1;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 三頻帶底色 */
    r.bandEls = this._bands.map(function (b) {
      var f = Math.log(b[0]) / Math.LN10;
      return U.el('rect', {
        x: X(f - 0.12), y: PY1, width: X(f + 0.12) - X(f - 0.12), height: PY0 - PY1,
        fill: P.acc, opacity: 0.07
      }, svg);
    });
    r.bandLbl = this._bands.map(function (b, i) {
      var g = U.el('g', {}, svg);
      U.txt({ x: X(Math.log(b[0]) / Math.LN10), y: PY1 + 12, 'font-size': 10, 'text-anchor': 'middle', fill: P.acc, 'font-weight': 700 }, b[0] + ' Hz', g);
      U.bi({ x: X(Math.log(b[0]) / Math.LN10), y: PY1 + 25, 'font-size': 8.5, 'text-anchor': 'middle', fill: P.mut },
        '≈ ' + b[1], '≈ ' + b[1], g);
      return g;
    });

    /* 網格＋軸（log–log） */
    [50, 100, 200, 400].forEach(function (g) {
      U.el('line', { x1: PX0, y1: Y(g), x2: PX1, y2: Y(g), stroke: P.grid, 'stroke-width': 0.8 }, svg);
      U.txt({ x: PX0 - 6, y: Y(g) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(g), svg);
    });
    [[0.05, '0.05'], [0.1, '0.1'], [0.5, '0.5'], [1, '1'], [5, '5'], [10, '10'], [30, '30']].forEach(function (tk) {
      var lx = X(Math.log(tk[0]) / Math.LN10);
      U.el('line', { x1: lx, y1: PY0, x2: lx, y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: lx, y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, tk[1], svg);
    });
    U.el('line', { x1: PX0, y1: PY1 - 4, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.el('line', { x1: PX0, y1: PY0, x2: PX1, y2: PY0, stroke: P.mut, 'stroke-width': 1.4 }, svg);
    U.bi({ x: PX1, y: PY0 + 28, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '頻率 Hz（對數）', 'frequency Hz (log)', svg);
    U.bi({ x: PX0 - 4, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'G* kPa（對數）', 'G* kPa (log)', svg);

    /* 8 條單株 G*(f) 冪律曲線 G*=G8·(f/8)^0.3 */
    var self = this;
    this._g8.forEach(function (g8) {
      var d = '', i, n = 200;
      for (i = 0; i <= n; i++) {
        var lf = L0 + i / n * (L1 - L0);
        var g = g8 * Math.pow(Math.pow(10, lf) / 8, 0.3);
        d += (i ? 'L' : 'M') + X(lf).toFixed(1) + ' ' + Y(g).toFixed(1) + ' ';
      }
      U.path(d, { fill: 'none', stroke: P.acc, 'stroke-width': 1.5, opacity: 0.55 }, svg);
    });
    U.bi({ x: X(1.25), y: Y(60), 'font-size': 9.5, fill: P.mut }, '單株 8 樣品', '8 mono samples', svg);

    /* 掃描線＋讀值 */
    r.sline = U.el('line', { x1: X(-0.92), y1: PY1, x2: X(-0.92), y2: PY0, stroke: P.ink, 'stroke-width': 1.1, 'stroke-dasharray': '3 3', opacity: 0.55 }, svg);
    r.fT = [U.txt({ 'font-size': 12, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 }, '', svg, 'zh'),
            U.txt({ 'font-size': 12, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 }, '', svg, 'en')];

    return r;
  },

  /* 最近的頻帶 index（log 距離 <0.3 才算落在帶內） */
  _nearest: function (lf) {
    var best = -1, bd = 1e9;
    for (var i = 0; i < this._bands.length; i++) {
      var d = Math.abs(lf - Math.log(this._bands[i][0]) / Math.LN10);
      if (d < bd) { bd = d; best = i; }
    }
    return bd < 0.30 ? best : -1;
  },

  apply: function (r, ctx) {
    var lf = ctx.params.lf;
    lf = Math.max(r.L0, Math.min(r.L1, lf));
    var sx = r.X(lf);
    r.sline.setAttribute('x1', sx); r.sline.setAttribute('x2', sx);
    var bi = this._nearest(lf);
    r.bandEls.forEach(function (b, i) { b.setAttribute('opacity', i === bi ? 0.22 : 0.07); });
    r.bandLbl.forEach(function (g, i) { g.setAttribute('opacity', i === bi ? 1 : 0.55); });
    var f = Math.pow(10, lf);
    var fs = f < 1 ? f.toFixed(2) : f.toFixed(1);
    r.fT[0].textContent = fs + ' Hz'; r.fT[1].textContent = fs + ' Hz';
    var tx = Math.max(70, Math.min(r.PX1 - 40, sx));
    r.fT[0].setAttribute('x', tx); r.fT[1].setAttribute('x', tx);
    r.fT[0].setAttribute('y', r.PY0 - 6); r.fT[1].setAttribute('y', r.PY0 - 6);
    r._bi = bi; r._f = f;
  },

  readout: function (ctx) {
    var lf = Math.max(-1.7, Math.min(1.5, ctx.params.lf));
    var f = Math.pow(10, lf), fs = f < 1 ? f.toFixed(2) : f.toFixed(1);
    var bi = this._nearest(lf);
    if (bi < 0) return [
      ['當前頻率 <b>' + fs + ' Hz</b>（頻帶外）', 'Frequency <b>' + fs + ' Hz</b> (between bands)'],
      ['兩個域之間的過渡位置', 'a transition spot between domains']
    ];
    var b = this._bands[bi];
    return [
      ['頻帶 <b>' + b[0] + ' Hz</b> ≈ 轉速 <b>' + b[1] + '</b>', 'Band <b>' + b[0] + ' Hz</b> ≈ speed <b>' + b[1] + '</b>'],
      [b[2], b[3]]
    ];
  },

  guide: function (ctx) {
    var lf = Math.max(-1.7, Math.min(1.5, ctx.params.lf));
    var bi = this._nearest(lf);
    if (bi === 2) return ['高頻＝測試只給材料極短時間反應——只有短鏈來得及動；這對應 2 rpm 的木尼讀值看 Mn。', 'High frequency gives the melt very little time — only short chains can respond; that is why the 2 rpm Mooney reading tracks Mn.'];
    if (bi === 0) return ['低頻＝給材料很長時間反應——最長的鏈（纏結最久）決定響應；這對應 0.05 rpm 看 Mw。', 'Low frequency gives the melt a long time — the longest chains (slowest to relax) set the response; that is why 0.05 rpm tracks Mw.'];
    if (bi === 1) return ['中間頻率對應 0.2 rpm 過渡區——兩種機制各佔一部分。', 'The middle band maps to the 0.2 rpm transition — a share of both mechanisms.'];
    return ['滑進三個頻帶之一，看這個頻率對應哪一段鏈。', 'Slide into one of the three bands to see which chain length that frequency probes.'];
  }
});
