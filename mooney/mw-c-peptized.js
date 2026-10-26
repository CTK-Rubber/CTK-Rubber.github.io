/* mw-c-peptized.js — 專題 C：塑解前後的 SEC 色譜對比（fig-topic-c-sec-peptized）
   教什麼：化學塑解優先剪斷最長的鏈——分布整體左移、右尾（長鏈端）削得最多：
   Mw −38%、Mn 幾乎不動——所以 VR2 看不見、VR0.05 一看一個準。
   色譜為教學近似；Mn/Mw 位準對齊 Table 1（塑解樣品 Mw 840–960）。 */
MW.register('c-peptized', {
  vb: [520, 300],
  hint: ['按鈕切換塑解前／後／疊加，看右尾怎麼被削', 'Toggle before / after / overlay — watch the right tail get clipped'],

  params: [
    { key: 'view', type: 'choice', def: 'both', zh: '看哪條', en: 'Show',
      options: [
        { v: 'both',   zh: '疊加對比', en: 'Overlay' },
        { v: 'before', zh: '塑解前（AW/AB）', en: 'Before (AW/AB)' },
        { v: 'after',  zh: '塑解後（BV）', en: 'After (BV)' }
      ] }
  ],

  /* 教學近似：前 Mn≈500 Mw≈1450；後 Mn≈495 Mw≈900（−38%，對齊 Table 1 塑解族 840–960） */
  _mnB: 500, _mwB: 1450, _mnA: 495, _mwA: 900,
  _pkB: [[3.11, 1.0, 0.085], [3.42, 0.30, 0.10]],   /* 主峰＋長鏈尾 */
  _pkA: [[2.92, 1.0, 0.085], [3.14, 0.14, 0.07]],   /* 整體左移、尾被削 */

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 505, PY0 = 252, PY1 = 26;
    var L0 = 2.30, L1 = 3.55;
    var X = function (m) { return PX0 + (Math.log(m) / Math.LN10 - L0) / (L1 - L0) * (PX1 - PX0); };
    var Y = function (v) { return PY0 - v / 1.1 * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.L0 = L0; r.L1 = L1; r.PY0 = PY0;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    [0, 0.5, 1].forEach(function (v) {
      U.el('line', { x1: PX0, y1: Y(v), x2: PX1, y2: Y(v), stroke: P.grid, 'stroke-width': v ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(v) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, v ? String(v) : '0', svg);
    });
    [300, 500, 1000, 2000, 3000].forEach(function (m) {
      U.el('line', { x1: X(m), y1: PY0, x2: X(m), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(m), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(m), svg);
    });
    U.el('line', { x1: PX0, y1: PY1 - 4, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.bi({ x: PX1, y: PY0 + 28, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '分子量 kg/mol（對數）', 'molecular weight kg/mol (log)', svg);
    U.bi({ x: PX0 - 4, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '訊號', 'signal', svg);

    /* 長鏈尾「被削」區塊標示 */
    r.tail = U.el('g', { opacity: 0 }, svg);
    U.el('rect', { x: X(2200), y: Y(0.42), width: X(3300) - X(2200), height: Y(0.1) - Y(0.42), fill: P.warn, opacity: 0.12 }, r.tail);
    U.bi({ x: (X(2200) + X(3300)) / 2, y: Y(0.30), 'font-size': 10, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 600 },
      '最長的鏈——剪最多', 'longest chains — cut most', r.tail);

    /* 兩條色譜 */
    r.bF = U.path('', { fill: P.mut, opacity: 0.10, stroke: 'none' }, svg);
    r.bC = U.path('', { fill: 'none', stroke: P.mut, 'stroke-width': 2.2 }, svg);
    r.aF = U.path('', { fill: P.warn, opacity: 0.10, stroke: 'none' }, svg);
    r.aC = U.path('', { fill: 'none', stroke: P.warn, 'stroke-width': 2.4 }, svg);

    /* 曲線名標籤 */
    U.bi({ x: X(1290), y: Y(1.06), 'font-size': 10, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 600 }, '塑解前 AW/AB', 'before AW/AB', svg);
    U.bi({ x: X(820), y: Y(1.06), 'font-size': 10, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 600 }, '塑解後 BV', 'after BV', svg);

    /* Mn / Mw 標線 */
    r.mk = U.el('g', {}, svg);
    r.mwBL = U.el('line', { y1: PY1, y2: PY0, stroke: P.mut, 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, r.mk);
    r.mwAL = U.el('line', { y1: PY1, y2: PY0, stroke: P.ok, 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, r.mk);
    r.mnL = U.el('line', { y1: PY1, y2: PY0, stroke: P.acc2, 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, r.mk);
    r.mwBT = [U.txt({ 'font-size': 10.5, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 700 }, '', r.mk, 'zh'),
              U.txt({ 'font-size': 10.5, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 700 }, '', r.mk, 'en')];
    r.mwAT = [U.txt({ 'font-size': 10.5, 'text-anchor': 'middle', fill: P.ok, 'font-weight': 700 }, '', r.mk, 'zh'),
              U.txt({ 'font-size': 10.5, 'text-anchor': 'middle', fill: P.ok, 'font-weight': 700 }, '', r.mk, 'en')];
    r.mnT = [U.txt({ 'font-size': 10.5, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 700 }, '', r.mk, 'zh'),
             U.txt({ 'font-size': 10.5, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 700 }, '', r.mk, 'en')];
    /* −38% 落差箭頭（手畫三角頭，指向左＝Mw 下降方向） */
    r.dlt = U.el('g', { opacity: 0 }, r.mk);
    r.dltL = U.el('line', { x1: X(this._mwA), y1: 60, x2: X(this._mwB), y2: 60, stroke: P.warn, 'stroke-width': 1.6 }, r.dlt);
    r.dltT = U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 700 }, 'Mw −38%', r.dlt);
    var ax = X(this._mwA);
    U.el('path', { d: 'M' + ax + ' 60 l8 -4 l0 8 Z', fill: P.warn }, r.dlt);

    return r;
  },

  _gauss: function (pks, L) {
    var v = 0;
    for (var j = 0; j < pks.length; j++) {
      var z = (L - pks[j][0]) / pks[j][2];
      v += pks[j][1] * Math.exp(-z * z / 2);
    }
    return v;
  },
  _path: function (pks, L0, L1, X, Y, withBase) {
    var d = '', i, n = 240;
    for (i = 0; i <= n; i++) {
      var L = L0 + i / n * (L1 - L0), v = this._gauss(pks, L);
      d += (i ? 'L' : 'M') + X(Math.pow(10, L)).toFixed(1) + ' ' + Y(v).toFixed(1) + ' ';
    }
    if (withBase) d += 'L' + X(Math.pow(10, L1)) + ' ' + Y(0) + ' L' + X(Math.pow(10, L0)) + ' ' + Y(0) + ' Z';
    return d;
  },

  apply: function (r, ctx) {
    var v = ctx.params.view, X = r.X;
    var db = this._path(this._pkB, r.L0, r.L1, X, r.Y, false);
    var da = this._path(this._pkA, r.L0, r.L1, X, r.Y, false);
    var dbF = this._path(this._pkB, r.L0, r.L1, X, r.Y, true);
    var daF = this._path(this._pkA, r.L0, r.L1, X, r.Y, true);
    r.bC.setAttribute('d', db); r.bF.setAttribute('d', dbF);
    r.aC.setAttribute('d', da); r.aF.setAttribute('d', daF);

    var oB = (v === 'after') ? 0.18 : 1, oA = (v === 'before') ? 0.12 : 1;
    r.bC.setAttribute('opacity', oB); r.bF.setAttribute('opacity', oB);
    r.aC.setAttribute('opacity', oA); r.aF.setAttribute('opacity', oA);
    r.tail.setAttribute('opacity', v === 'before' ? 0 : 1);

    /* 標線 */
    r.mwBL.setAttribute('x1', X(this._mwB)); r.mwBL.setAttribute('x2', X(this._mwB));
    r.mwAL.setAttribute('x1', X(this._mwA)); r.mwAL.setAttribute('x2', X(this._mwA));
    r.mnL.setAttribute('x1', X(this._mnB)); r.mnL.setAttribute('x2', X(this._mnB));
    r.mwBT[0].textContent = 'Mw≈' + this._mwB; r.mwBT[1].textContent = 'Mw≈' + this._mwB;
    r.mwAT[0].textContent = 'Mw≈' + this._mwA; r.mwAT[1].textContent = 'Mw≈' + this._mwA;
    r.mnT[0].textContent = 'Mn≈500（幾乎不動）'; r.mnT[1].textContent = 'Mn≈500 (barely moves)';
    r.mwBT[0].setAttribute('x', X(this._mwB) + 6); r.mwBT[1].setAttribute('x', X(this._mwB) + 6);
    r.mwAT[0].setAttribute('x', X(this._mwA) - 6); r.mwAT[1].setAttribute('x', X(this._mwA) - 6);
    r.mnT[0].setAttribute('x', X(this._mnB)); r.mnT[1].setAttribute('x', X(this._mnB));
    r.mwBT[0].setAttribute('y', r.PY0 - 14); r.mwBT[1].setAttribute('y', r.PY0 - 14);
    r.mwAT[0].setAttribute('y', r.PY0 - 28); r.mwAT[1].setAttribute('y', r.PY0 - 28);
    r.mnT[0].setAttribute('y', r.PY0 - 42); r.mnT[1].setAttribute('y', r.PY0 - 42);
    r.mwBL.setAttribute('opacity', v === 'after' ? 0.35 : 1);
    r.mwAL.setAttribute('opacity', v === 'before' ? 0.35 : 1);
    r.mnL.setAttribute('opacity', 1);

    /* −38% 箭頭只在看得到兩條 Mw 時出現 */
    r.dlt.setAttribute('opacity', v === 'both' ? 1 : 0);
    r.dltL.setAttribute('x1', X(this._mwA)); r.dltL.setAttribute('x2', X(this._mwB) - 8);
    r.dltT.setAttribute('x', (X(this._mwA) + X(this._mwB)) / 2 + 10);
    r.dltT.setAttribute('y', 52);
  },

  readout: function (ctx) {
    return [
      ['Mw <b>1450 → 900</b>（−38%）', 'Mw <b>1450 → 900</b> (−38%)'],
      ['Mn <b>500 → 495</b>（幾乎不動）', 'Mn <b>500 → 495</b> (barely moves)'],
      ['VR2 看不見（60–61 照樣合格）', 'VR2 blind (still 60–61, in spec)'],
      ['VR0.05 一看一個準（掉到 18–20）', 'VR0.05 sees it (drops to 18–20)']
    ];
  },

  guide: function (ctx) {
    var v = ctx.params.view;
    if (v === 'before') return ['塑解前的分布：主峰靠右、長鏈尾拖得長——這條尾巴就是 Mw 的來源。', 'Before peptization: the main peak sits right with a long high-end tail — that tail is where Mw comes from.'];
    if (v === 'after') return ['塑解後：整體左移、右尾被削——塑解劑優先剪斷最長的鏈，所以 Mw 掉最多。', 'After: everything shifts left and the right tail is clipped — the peptizer cuts the longest chains first, so Mw falls hardest.'];
    return ['疊起來看：Mn 標線幾乎沒動、Mw 掉了 38%——這正是「VR2 看不見、VR0.05 看得見」的結構變化。', 'Overlaid: the Mn marker barely moves while Mw drops 38% — exactly the change VR2 cannot see but VR0.05 can.'];
  }
});
