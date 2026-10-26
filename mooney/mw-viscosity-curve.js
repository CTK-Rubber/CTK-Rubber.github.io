/* mw-viscosity-curve.js — §2 標準測試曲線的四段旅程
   故事：一條 ML(1+4) 曲線分四段——預熱零線、啟動過衝、剪切軟化、第 4 分鐘讀值。
   互動：分階畫入＋焦點標註；hover 沿曲線讀當下的 t 與 M。 */
MW.register('viscosity-curve', {
  vb: [520, 300],
  hint: ['滑到圖上任一點，沿曲線讀當下的扭矩', 'Hover anywhere on the chart to read the torque at that moment'],

  stages: [
    { dur: 2.0, zh: ['先預熱一分鐘', '試片入模後先預熱 1 分鐘——轉子還沒轉，扭矩貼著零線。'],
             en: ['One minute of preheat', 'The specimen preheats for 1 minute before the rotor turns — torque rides the zero line.'] },
    { dur: 1.4, zh: ['啟動過衝', '轉子啟動瞬間，扭矩衝上峰頂約 88 MU——冷膠最硬的一刻。'],
             en: ['Startup overshoot', 'The instant the rotor starts, torque spikes to a peak near 88 MU — the cold rubber at its stiffest.'] },
    { dur: 3.0, zh: ['剪切軟化', '轉子持續剪切，膠受熱又受剪而軟化，扭矩一路下降——這叫剪切軟化（shear softening）。'],
             en: ['Shear softening', 'Held under shear, the rubber warms and softens; torque decays — this is shear softening.'] },
    { dur: 2.0, zh: ['第 4 分鐘讀值', '到第 4 分鐘扭矩已平穩——這個平穩值 50 就是報告上的 ML(1+4)。'],
             en: ['The minute-4 reading', 'By minute 4 the torque has settled — the plateau value of 50 is reported as ML(1+4).'] }
  ],

  scrub: { panel: 0, x0: 46, x1: 508, fn: function (x01, st) {
    /* hover x → 時間 → 反查 u（各段在 u 軸上的邊界在 build 時算好） */
    var tb = this._tb, ub = this._ub;
    if (!tb) { st.u = x01; return; }
    var tau = x01 * 5, s = 0;
    while (s < tb.length - 2 && tau >= tb[s + 1]) s++;
    var span = tb[s + 1] - tb[s], f = span > 0 ? (tau - tb[s]) / span : 0;
    st.u = Math.max(0, Math.min(1, ub[s] + f * (ub[s + 1] - ub[s])));
  } },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var T_END = 5, M_MAX = 100;
    var X = function (t) { return PX0 + (t / T_END) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / M_MAX) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0;

    /* 四個階段各畫到一個時間點：[0,1]預熱、[1,1.15]過衝、[1.15,4]軟化、[4,5]收尾 */
    var tb = [0, 1, 1.15, 4, 5], ub = [0], acc = 0, tot = 0;
    this.stages.forEach(function (sg) { tot += sg.dur; });
    this.stages.forEach(function (sg) { acc += sg.dur; ub.push(acc / tot); });
    r.tb = tb;
    if (this.scrub) { this.scrub._tb = tb; this.scrub._ub = ub; }

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 預熱區塊 */
    r.pre = U.el('rect', { x: X(0), y: PY1, width: X(1) - X(0), height: PY0 - PY1, fill: P.soft, opacity: 0 }, svg);
    r.preLbl = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: (X(0) + X(1)) / 2, y: PY1 + 16, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut },
      '預熱區（轉子未轉）', 'preheat (rotor idle)', r.preLbl);

    /* 網格＋軸 */
    [0, 25, 50, 75, 100].forEach(function (m) {
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

    /* 曲線＋clip 揭露 */
    var clip = U.el('clipPath', { id: 'vcclip' + U.uid }, svg);
    r.clipRect = U.el('rect', { x: PX0, y: 0, width: 0, height: 300 }, clip);
    var d = '';
    for (var i = 0; i <= 320; i++) {
      var tt = i / 320 * T_END;
      d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._torque(tt)).toFixed(1) + ' ';
    }
    r.curve = U.path(d, { fill: 'none', stroke: P.acc, 'stroke-width': 2.4, 'clip-path': 'url(#vcclip' + U.uid + ')' }, svg);

    /* 峰頂標註 */
    r.pk = U.el('g', { opacity: 0 }, svg);
    U.el('circle', { cx: X(1.15), cy: Y(88), r: 4.5, fill: P.warn, stroke: '#fff', 'stroke-width': 1.4 }, r.pk);
    U.bi({ x: X(1.15) + 10, y: Y(88) - 8, 'font-size': 11, fill: P.warn, 'font-weight': 700 }, '峰 ~88', 'peak ~88', r.pk);

    /* 軟化標註 */
    r.soft = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(1.9), y1: Y(72), x2: X(3.0), y2: Y(58), stroke: P.acc2, 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, r.soft);
    U.bi({ x: X(2.45), y: Y(80), 'font-size': 10, 'text-anchor': 'middle', fill: P.acc2 }, '剪切軟化', 'shear softening', r.soft);

    /* ML 旗標 */
    r.flag = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(4), y1: Y(50) - 32, x2: X(4), y2: PY0, stroke: P.acc2, 'stroke-width': 1.3 }, r.flag);
    U.el('line', { x1: X(4), y1: Y(50), x2: PX1, y2: Y(50), stroke: P.acc2, 'stroke-width': 1.3, 'stroke-dasharray': '6 4' }, r.flag);
    U.el('circle', { cx: X(4), cy: Y(50), r: 4.5, fill: P.acc2, stroke: '#fff', 'stroke-width': 1.4 }, r.flag);
    U.bi({ x: X(4) + 8, y: Y(50) - 36, 'font-size': 11, fill: P.acc2, 'font-weight': 700 }, 'ML(1+4) = 50', 'ML(1+4) = 50', r.flag);

    /* 游標 */
    r.cursor = U.el('g', { opacity: 0 }, svg);
    r.curLine = U.el('line', { y1: PY1, y2: PY0, stroke: P.acc, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.5 }, r.cursor);
    r.curDot = U.el('circle', { r: 4, fill: P.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);

    return r;
  },

  /* 標準測試曲線：峰 ~88 → 平穩值 50 */
  _torque: function (t) {
    if (t < 1) return 0;
    if (t < 1.15) { var u = (t - 1) / 0.15; return 88 * (1 - Math.pow(1 - u, 3)); }
    if (t < 4) return 50 + 38 * Math.exp(-1.6 * (t - 1.15));
    return 50;
  },

  apply: function (r, ctx) {
    var X = r.X, Y = r.Y, s = ctx.s, sp = ctx.sp;
    var drawT = r.tb[s] + Math.min(1, sp) * (r.tb[s + 1] - r.tb[s]);
    r.clipRect.setAttribute('width', Math.max(0, X(drawT) - r.PX0));

    /* 焦點標註依階段淡入 */
    r.pre.setAttribute('opacity', s === 0 ? Math.min(1, sp * 2) : (s > 0 ? 0.6 : 0));
    r.preLbl.setAttribute('opacity', s === 0 ? Math.min(1, sp * 2) : (s > 0 ? 0.6 : 0));
    r.pk.setAttribute('opacity', s > 1 ? 1 : (s === 1 ? Math.min(1, sp * 2.5) : 0));
    r.soft.setAttribute('opacity', s > 2 ? 1 : (s === 2 ? Math.min(1, sp * 2.5) : 0));
    r.flag.setAttribute('opacity', s >= 3 ? Math.min(1, sp * 2.5) : 0);

    /* 游標跟著揭露位置 */
    r.cursor.setAttribute('opacity', ctx.u > 0.002 ? 1 : 0);
    r.curLine.setAttribute('x1', X(drawT)); r.curLine.setAttribute('x2', X(drawT));
    r.curDot.setAttribute('cx', X(drawT));
    r.curDot.setAttribute('cy', Y(this._torque(drawT)));
  },

  readout: function (ctx) {
    var tb = this.scrub._tb;
    var t = tb[ctx.s] + Math.min(1, ctx.sp) * (tb[ctx.s + 1] - tb[ctx.s]);
    var m = this._torque(t), st;
    if (t < 1) st = ['預熱中', 'Preheating'];
    else if (t < 1.15) st = ['啟動過衝', 'Startup overshoot'];
    else if (t < 4) st = ['剪切軟化中', 'Shear softening'];
    else st = ['平穩值＝ML', 'Plateau = ML'];
    return [
      ['t = <b>' + t.toFixed(2) + '</b> min', 't = <b>' + t.toFixed(2) + '</b> min'],
      ['M = <b>' + m.toFixed(1) + '</b> MU', 'M = <b>' + m.toFixed(1) + '</b> MU'],
      [st[0], st[1]]
    ];
  }
});
