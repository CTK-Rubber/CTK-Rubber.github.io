/* mw-scorch-t5.js — §3 同一批膠放三週，t5 從 18 提前到 12
   故事：膠在倉庫裡也會慢慢「熟」——最低點不變，但回升提早，安全加工時間在流失。
   互動：拖「存放週數」拉桿，主線回升段左移；灰影線固定在入庫狀態（t5 = 18）作對照。 */
MW.register('scorch-t5', {
  vb: [520, 300],
  hint: ['拖「存放週數」看安全加工時間怎麼流失', 'Drag the storage-weeks slider to see the safe processing window drain'],

  params: [
    { key: 'weeks', type: 'range', min: 0, max: 3, step: 0.5, def: 0,
      zh: '存放週數', en: 'Weeks in storage', fmt: function (v) { return v.toFixed(1) + ' wk'; } }
  ],

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var T_END = 24, M_LO = 35, M_HI = 75;
    var X = function (t) { return PX0 + (t / T_END) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - ((m - M_LO) / (M_HI - M_LO)) * (PY0 - PY1); };
    r.X = X; r.Y = Y;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 流失的安全窗（t5 到 18 之間的紅色帶） */
    r.lost = U.el('rect', { y: PY1, height: PY0 - PY1, fill: P.warn, opacity: 0 }, svg);
    r.lostLbl = U.el('g', { opacity: 0 }, svg);
    r.lostZh = U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.warn }, '', r.lostLbl, 'zh');
    r.lostEn = U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.warn }, '', r.lostLbl, 'en');

    /* 網格＋軸 */
    [40, 50, 60, 70].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': 0.8 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    for (var t = 0; t <= 24; t += 4) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(t), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), svg);
    }
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.txt({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'min', svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'MU', svg);

    /* 最低點參考線（不隨週數變） */
    U.el('line', { x1: PX0, y1: Y(42), x2: PX1, y2: Y(42), stroke: P.line, 'stroke-width': 1, 'stroke-dasharray': '4 4' }, svg);
    U.bi({ x: PX0 + 4, y: Y(42) + 13, 'font-size': 9, fill: P.mut }, '最低點 ~42 不變', 'minimum ~42 unchanged', svg);

    /* 灰影對照線：固定 t5 = 18 */
    var dRef = '';
    for (var i = 0; i <= 360; i++) {
      var tt = i / 360 * T_END;
      dRef += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._visc(tt, this._C(0))).toFixed(1) + ' ';
    }
    r.ref = U.path(dRef, { fill: 'none', stroke: P.mut, 'stroke-width': 1.8, 'stroke-dasharray': '6 4', opacity: 0.65 }, svg);
    U.el('line', { x1: X(18), y1: Y(47) - 26, x2: X(18), y2: PY0, stroke: P.mut, 'stroke-width': 1, 'stroke-dasharray': '4 4' }, svg);
    U.el('circle', { cx: X(18), cy: Y(47), r: 3.5, fill: 'none', stroke: P.mut, 'stroke-width': 1.4 }, svg);
    U.bi({ x: X(18), y: Y(47) - 32, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, '入庫 t5 = 18', 'intake t5 = 18', svg);

    /* 主線＋t5 旗標（隨拉桿） */
    r.curve = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.4 }, svg);
    r.flagLine = U.el('line', { y2: PY0, stroke: P.warn, 'stroke-width': 1.4 }, svg);
    r.flagDot = U.el('circle', { cy: Y(47), r: 4.5, fill: P.warn, stroke: '#fff', 'stroke-width': 1.4 }, svg);
    r.flagTxt = U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 700 }, '', svg);

    return r;
  },

  /* 回升係數：讓 M(t5) = 47（最低點 +5） */
  _C: function (weeks) {
    var t5 = 18 - 2 * weeks;
    return 5 / ((t5 - 2.5) * (t5 - 2.5));
  },
  _visc: function (t, C) {
    if (t < 2.5) return 42 + 16 * Math.exp(-1.6 * t);
    return 42 + C * (t - 2.5) * (t - 2.5);
  },

  apply: function (r, ctx) {
    var w = ctx.params.weeks, P = MW.PAL;
    var X = r.X, Y = r.Y;
    var t5 = 18 - 2 * w, C = this._C(w);

    /* 主線重畫 */
    var d = '';
    for (var i = 0; i <= 360; i++) {
      var tt = i / 360 * 24;
      d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._visc(tt, C)).toFixed(1) + ' ';
    }
    r.curve.setAttribute('d', d);

    /* t5 旗標跟著走 */
    r.flagLine.setAttribute('x1', X(t5)); r.flagLine.setAttribute('x2', X(t5));
    r.flagLine.setAttribute('y1', Y(47) - 26);
    r.flagDot.setAttribute('cx', X(t5));
    r.flagTxt.setAttribute('x', X(t5)); r.flagTxt.setAttribute('y', Y(47) - 32);
    r.flagTxt.textContent = 't5 = ' + t5.toFixed(1) + ' min';

    /* 流失窗：t5 與 18 之間 */
    var lost = w > 0.001;
    r.lost.setAttribute('x', X(t5));
    r.lost.setAttribute('width', Math.max(0, X(18) - X(t5)));
    r.lost.setAttribute('opacity', lost ? 0.08 : 0);
    r.lostLbl.setAttribute('opacity', lost ? 1 : 0);
    if (lost) {
      var mx = (X(t5) + X(18)) / 2;
      r.lostZh.setAttribute('x', mx); r.lostZh.setAttribute('y', Y(68));
      r.lostZh.textContent = '流失的安全窗 ' + (2 * w).toFixed(1) + ' min';
      r.lostEn.setAttribute('x', mx); r.lostEn.setAttribute('y', Y(68));
      r.lostEn.textContent = 'window lost: ' + (2 * w).toFixed(1) + ' min';
    }
  },

  readout: function (ctx) {
    var w = ctx.params.weeks, t5 = 18 - 2 * w;
    var cmp = w <= 0.001
      ? ['入庫基準線', 'Intake baseline']
      : ['比入庫早 <b>' + (2 * w).toFixed(1) + '</b> min 熟', '<b>' + (2 * w).toFixed(1) + '</b> min earlier than intake'];
    return [
      ['存放 <b>' + w.toFixed(1) + '</b> 週', 'Stored <b>' + w.toFixed(1) + '</b> wk'],
      ['t5 = <b>' + t5.toFixed(1) + '</b> min', 't5 = <b>' + t5.toFixed(1) + '</b> min'],
      [cmp[0], cmp[1]]
    ];
  },

  guide: function (ctx) {
    var w = ctx.params.weeks, t5 = 18 - 2 * w;
    if (w <= 0.001) return ['這是入庫時的曲線——t5 = 18 分鐘，安全加工時間還算寬。', 'The curve at intake — t5 = 18 min, a comfortable processing window.'];
    if (w < 3) return ['存放 ' + w.toFixed(1) + ' 週：最低點沒變，但回升提早了——安全窗剩 ' + t5.toFixed(1) + ' 分鐘。',
      'After ' + w.toFixed(1) + ' wk: same minimum, but the rise came earlier — the safe window is down to ' + t5.toFixed(1) + ' min.'];
    return ['三週過去，t5 從 18 掉到 12——膠還沒上機台就先熟了 6 分鐘。',
      'Three weeks in, t5 fell from 18 to 12 — the compound "cooked" 6 minutes of its window away in storage.'];
  }
});
