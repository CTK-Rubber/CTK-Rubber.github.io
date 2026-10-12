/* mw-c-blend.js — 專題 C：GT1 × PB217 混摻比的 SEC 色譜形變（fig-topic-c-sec-blend）
   教什麼：改變混摻比，動的只有短鏈峰的量——Mn 跟著動、Mw 幾乎不動；
   這正是「VR2 對 Mn 敏感」能被驗證的樣品設計。
   色譜＝GT1 雙峰＋PB217 單峰兩條基底譜加權疊合（教學近似）；
   Mn 用數學調和平均、Mw 用線性混合（物理上正確的混合規則）。 */
MW.register('c-blend', {
  vb: [520, 300],
  hint: ['拖「PB217 佔比」拉桿，看左邊短鏈峰消長', 'Drag the PB217 share — watch the short-chain peak shrink'],

  params: [
    { key: 'pb', type: 'range', min: 0, max: 100, step: 1, def: 50,
      zh: 'PB217 佔比', en: 'PB217 share', fmt: function (v) { return v + ' %'; } }
  ],

  /* 基底譜端點（教學近似，對齊 Table 1 混摻樣品位準）：
     GT1   Mn≈540 Mw≈1400（雙峰：短鏈峰＋主體）
     PB217 Mn≈760 Mw≈1500（單峰偏右、分布寬） */
  _g1: { mn: 540, mw: 1400, pk: [[2.60, 0.45, 0.05], [3.12, 1.0, 0.085]] },
  _pb: { mn: 760, mw: 1500, pk: [[3.02, 1.0, 0.105]] },

  /* 表值實測混摻樣品（佔比 → [Mn, Mw]） */
  _real: { 20: [570, 1420], 40: [610, 1430], 60: [600, 1380], 80: [700, 1480] },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 505, PY0 = 252, PY1 = 26;
    var L0 = 2.30, L1 = 3.55;
    var X = function (m) { return PX0 + (Math.log(m) / Math.LN10 - L0) / (L1 - L0) * (PX1 - PX0); };
    var Y = function (v) { return PY0 - v / 1.1 * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.PY0 = PY0; r.L0 = L0; r.L1 = L1;

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

    /* 兩條基底譜（淡虛線）＋混摻譜（實線＋淺底） */
    r.base1 = U.path('', { fill: 'none', stroke: P.acc2, 'stroke-width': 1.2, 'stroke-dasharray': '4 4', opacity: 0.55 }, svg);
    r.base2 = U.path('', { fill: 'none', stroke: P.ok, 'stroke-width': 1.2, 'stroke-dasharray': '4 4', opacity: 0.55 }, svg);
    r.mixF = U.path('', { fill: P.acc, opacity: 0.09, stroke: 'none' }, svg);
    r.mix = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.4 }, svg);

    /* 圖例 */
    var lg = U.el('g', {}, svg);
    U.el('line', { x1: 330, y1: 16, x2: 350, y2: 16, stroke: P.acc2, 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, lg);
    U.bi({ x: 354, y: 19, 'font-size': 9.5, fill: P.mut }, 'GT1（雙峰）', 'GT1 (bimodal)', lg);
    U.el('line', { x1: 418, y1: 16, x2: 438, y2: 16, stroke: P.ok, 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, lg);
    U.bi({ x: 442, y: 19, 'font-size': 9.5, fill: P.mut }, 'PB217', 'PB217', lg);

    /* 短鏈峰標註 */
    r.pk = U.el('g', {}, svg);
    U.el('line', { x1: X(400), y1: Y(0.42), x2: X(400), y2: Y(0.62), stroke: P.warn, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, r.pk);
    U.bi({ x: X(400), y: Y(0.68), 'font-size': 10, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 600 },
      '短鏈峰——跟佔比消長', 'short-chain peak — follows the ratio', r.pk);

    /* Mn / Mw 標線＋讀數 */
    r.mnL = U.el('line', { y1: PY1, y2: PY0, stroke: P.acc2, 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }, svg);
    r.mwL = U.el('line', { y1: PY1, y2: PY0, stroke: P.ok, 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }, svg);
    r.mnT = [U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 700 }, '', svg, 'zh'),
             U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 700 }, '', svg, 'en')];
    r.mwT = [U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.ok, 'font-weight': 700 }, '', svg, 'zh'),
             U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.ok, 'font-weight': 700 }, '', svg, 'en')];

    /* 實測樣品刻度（各自 Mn 位置的小刻度，佔比接近時才亮） */
    r.real = U.el('g', { opacity: 0 }, svg);
    var RD = this._real;
    [20, 40, 60, 80].forEach(function (k) {
      var mx = X(RD[k][0]);
      U.el('line', { x1: mx, y1: PY0 - 14, x2: mx, y2: PY0 - 4, stroke: P.mut, 'stroke-width': 1.2 }, r.real);
      U.txt({ x: mx, y: PY0 - 18, 'font-size': 8.5, 'text-anchor': 'middle', fill: P.mut }, 'PB217 ' + k + '%', r.real);
    });

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

  apply: function (r, ctx) {
    var w = ctx.params.pb / 100, X = r.X, Y = r.Y;
    var L0 = r.L0, L1 = r.L1, i, n = 240;

    /* 基底譜 */
    var d1 = '', d2 = '', dm = '', df = '';
    for (i = 0; i <= n; i++) {
      var L = L0 + i / n * (L1 - L0), mx = Math.pow(10, L);
      var v1 = this._gauss(this._g1.pk, L), v2 = this._gauss(this._pb.pk, L);
      var vm = (1 - w) * v1 + w * v2;   /* 加權疊合，不歸一：短鏈峰直接消長 */
      d1 += (i ? 'L' : 'M') + X(mx).toFixed(1) + ' ' + Y(v1).toFixed(1) + ' ';
      d2 += (i ? 'L' : 'M') + X(mx).toFixed(1) + ' ' + Y(v2).toFixed(1) + ' ';
      dm += (i ? 'L' : 'M') + X(mx).toFixed(1) + ' ' + Y(vm).toFixed(1) + ' ';
    }
    df = dm + 'L' + X(Math.pow(10, L1)) + ' ' + Y(0) + ' L' + X(Math.pow(10, L0)) + ' ' + Y(0) + ' Z';
    r.base1.setAttribute('d', d1); r.base2.setAttribute('d', d2);
    r.mix.setAttribute('d', dm); r.mixF.setAttribute('d', df);

    /* Mn 調和平均（數均）、Mw 線性（重均）——Mn 動、Mw 幾乎不動 */
    var mn = 1 / ((1 - w) / this._g1.mn + w / this._pb.mn);
    var mw = (1 - w) * this._g1.mw + w * this._pb.mw;
    r.mnL.setAttribute('x1', X(mn)); r.mnL.setAttribute('x2', X(mn));
    r.mwL.setAttribute('x1', X(mw)); r.mwL.setAttribute('x2', X(mw));
    r.mnT[0].textContent = 'Mn≈' + Math.round(mn); r.mnT[1].textContent = 'Mn≈' + Math.round(mn);
    r.mwT[0].textContent = 'Mw≈' + Math.round(mw); r.mwT[1].textContent = 'Mw≈' + Math.round(mw);
    r.mnT[0].setAttribute('x', X(mn)); r.mnT[1].setAttribute('x', X(mn));
    r.mwT[0].setAttribute('x', X(mw)); r.mwT[1].setAttribute('x', X(mw));
    r.mnT[0].setAttribute('y', r.PY0 - 14); r.mnT[1].setAttribute('y', r.PY0 - 14);
    r.mwT[0].setAttribute('y', r.PY0 - 14); r.mwT[1].setAttribute('y', r.PY0 - 14);

    /* 佔比靠近實測點（±6%）時顯示實測樣品刻度 */
    var near = null;
    [20, 40, 60, 80].forEach(function (k) {
      if (Math.abs(ctx.params.pb - k) <= 6) near = k;
    });
    r.real.setAttribute('opacity', near ? 1 : 0);
    r._near = near;

    /* 短鏈峰標註淡出於純 PB217 */
    r.pk.setAttribute('opacity', Math.max(0, 1 - w * 1.15));
  },

  readout: function (ctx) {
    var w = ctx.params.pb / 100;
    var mn = 1 / ((1 - w) / this._g1.mn + w / this._pb.mn);
    var mw = (1 - w) * this._g1.mw + w * this._pb.mw;
    var rows = [
      ['PB217 佔比 <b>' + ctx.params.pb + '%</b>', 'PB217 share <b>' + ctx.params.pb + '%</b>'],
      ['Mn ≈ <b>' + Math.round(mn) + '</b>（動） · Mw ≈ <b>' + Math.round(mw) + '</b>（幾乎不動）',
       'Mn ≈ <b>' + Math.round(mn) + '</b> (moves) · Mw ≈ <b>' + Math.round(mw) + '</b> (barely)']
    ];
    var near = null;
    [20, 40, 60, 80].forEach(function (k) { if (Math.abs(ctx.params.pb - k) <= 6) near = k; });
    if (near) {
      var rv = this._real[near];
      rows.push(['實測 PB217 ' + near + '%：Mn <b>' + rv[0] + '</b> · Mw <b>' + rv[1] + '</b>',
                 'measured PB217 ' + near + '%: Mn <b>' + rv[0] + '</b> · Mw <b>' + rv[1] + '</b>']);
    }
    return rows;
  },

  guide: function (ctx) {
    var w = ctx.params.pb;
    if (w < 15) return ['幾乎純 GT1：左邊短鏈峰最明顯——這群短鏈把 Mn 壓到最低。', 'Nearly pure GT1: the short-chain peak is at its biggest — those short chains drag Mn to its lowest.'];
    if (w > 85) return ['幾乎純 PB217：短鏈峰消失、只剩單峰——Mn 跟著升到最高，Mw 卻只動了一點。', 'Nearly pure PB217: the short-chain peak is gone, one peak left — Mn climbs to its highest while Mw barely moves.'];
    return ['注意標線：拉桿一路動，Mw 線幾乎釘住、Mn 線跟著滑——所以 VR2（對 Mn 敏感）才分得出混摻比。', 'Watch the markers: as you drag, the Mw line barely budges while Mn slides — that is why VR2 (Mn-sensitive) can tell blend ratios apart.'];
  }
});
