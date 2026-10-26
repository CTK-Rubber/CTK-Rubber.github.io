/* mw-mooney-level.js — §6 同樣的測試，膠越硬整條曲線墊越高
   故事：ML 就是第 4 分鐘的高度——拉桿改變膠的硬度，全曲線跟著縮放。
   互動：拖「這批膠的 ML」拉桿；灰影線固定 ML = 50 作對照；三個高度帶對應好推／一般／難推。 */
MW.register('mooney-level', {
  vb: [520, 300],
  hint: ['拖「這批膠的 ML」拉桿——整條曲線跟著墊高或壓低', 'Drag the lot-ML slider — the whole curve rides higher or lower'],

  params: [
    { key: 'ml', type: 'range', min: 25, max: 85, step: 1, def: 50,
      zh: '這批膠的 ML', en: 'Lot ML', fmt: function (v) { return v + ' MU'; } }
  ],

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var T_END = 5, M_MAX = 150;
    var X = function (t) { return PX0 + (t / T_END) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / M_MAX) * (PY0 - PY1); };
    r.X = X; r.Y = Y;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 三個高度帶：<40 好推／40–70 一般／>70 難推 */
    U.el('rect', { x: PX0, y: Y(40), width: PX1 - PX0, height: PY0 - Y(40), fill: P.ok, opacity: 0.07 }, svg);
    U.el('rect', { x: PX0, y: Y(70), width: PX1 - PX0, height: Y(40) - Y(70), fill: P.mut, opacity: 0.05 }, svg);
    U.el('rect', { x: PX0, y: PY1, width: PX1 - PX0, height: Y(70) - PY1, fill: P.warn, opacity: 0.06 }, svg);
    U.bi({ x: PX1 - 4, y: Y(20) - 2, 'font-size': 9, 'text-anchor': 'end', fill: P.ok }, '好推（軟）', 'easy flow (soft)', svg);
    U.bi({ x: PX1 - 4, y: Y(55) - 2, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, '一般', 'typical', svg);
    U.bi({ x: PX1 - 4, y: Y(72) + 10, 'font-size': 9, 'text-anchor': 'end', fill: P.warn }, '難推（硬）', 'stiff', svg);

    /* 網格＋軸 */
    [0, 50, 100, 150].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    for (var t = 0; t <= 5; t++) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(t), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), svg);
    }
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.txt({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'min', svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'MU', svg);

    /* 灰影對照線：固定 ML = 50 */
    var dRef = '';
    for (var i = 0; i <= 320; i++) {
      var tt = i / 320 * T_END;
      dRef += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._torque(tt, 50)).toFixed(1) + ' ';
    }
    r.ref = U.path(dRef, { fill: 'none', stroke: P.mut, 'stroke-width': 1.6, 'stroke-dasharray': '6 4', opacity: 0.6 }, svg);
    U.bi({ x: PX1 - 4, y: Y(50) + 14, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, '對照 ML = 50', 'ref ML = 50', svg);

    /* 主線（隨拉桿重畫） */
    r.curve = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.4 }, svg);

    /* 第 4 分鐘旗標 */
    U.el('line', { x1: X(4), y1: PY1, x2: X(4), y2: PY0, stroke: P.line, 'stroke-width': 1, 'stroke-dasharray': '4 4' }, svg);
    r.flagDot = U.el('circle', { cx: X(4), r: 5, fill: P.acc2, stroke: '#fff', 'stroke-width': 1.4 }, svg);
    r.flagTxt = U.txt({ 'font-size': 11, fill: P.acc2, 'font-weight': 700 }, '', svg);
    U.bi({ x: X(4), y: PY0 + 26, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut }, '第 4 分鐘讀值', 'minute-4 read', svg);

    return r;
  },

  /* 全曲線隨 ml 縮放：尖峰 = ml × 1.7，平穩值 = ml */
  _torque: function (t, ml) {
    if (t < 1) return 0;
    var pk = ml * 1.7;
    if (t < 1.15) { var u = (t - 1) / 0.15; return pk * (1 - Math.pow(1 - u, 3)); }
    if (t < 4) return ml + (pk - ml) * Math.exp(-1.4 * (t - 1.15));
    return ml;
  },

  apply: function (r, ctx) {
    var ml = ctx.params.ml;
    var X = r.X, Y = r.Y;
    var d = '';
    for (var i = 0; i <= 320; i++) {
      var tt = i / 320 * 5;
      d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._torque(tt, ml)).toFixed(1) + ' ';
    }
    r.curve.setAttribute('d', d);
    r.flagDot.setAttribute('cy', Y(ml));
    r.flagTxt.setAttribute('x', X(4) + 10);
    r.flagTxt.setAttribute('y', Y(ml) - 12);
    r.flagTxt.textContent = 'ML = ' + ml;
  },

  readout: function (ctx) {
    var ml = ctx.params.ml, d = ml - 50;
    var cmp = d === 0 ? ['跟對照線一樣高', 'Same height as the reference']
      : d > 0 ? ['比對照線高 <b>' + d + '</b> MU', '<b>' + d + '</b> MU above the reference']
      : ['比對照線低 <b>' + (-d) + '</b> MU', '<b>' + (-d) + '</b> MU below the reference'];
    var tag = ml < 40 ? ['好推（軟）', 'easy flow (soft)'] : ml > 70 ? ['難推（硬）', 'stiff'] : ['一般', 'typical'];
    return [
      ['ML = <b>' + ml + '</b> MU', 'ML = <b>' + ml + '</b> MU'],
      [cmp[0], cmp[1]],
      ['判定：<b>' + tag[0] + '</b>', 'Verdict: <b>' + tag[1] + '</b>']
    ];
  },

  guide: function (ctx) {
    var ml = ctx.params.ml;
    if (ml < 40) return ['ML ' + ml + ' 偏低——好推、好成型，但要留意強度是否足夠。', 'ML ' + ml + ' is low — easy to push and shape, but check the strength is adequate.'];
    if (ml > 70) return ['ML ' + ml + ' 偏高——混練耗能高、設備負荷大，高 ML 多半是高分子量膠。', 'ML ' + ml + ' is high — energy-hungry mixing and heavy machine load; high ML usually means high molecular weight.'];
    return ['ML ' + ml + ' 落在常見加工範圍——不高不低的中間地帶。', 'ML ' + ml + ' sits in the usual processing range — the middle ground.'];
  }
});
