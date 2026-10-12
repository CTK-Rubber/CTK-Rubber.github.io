/* mw-a-curve.js — 專題A · 一條實測木尼曲線的全貌（Maláč 2011 Fig.1 數位化重繪）
   故事：預熱段近零 → 啟動過衝 ~140 → 衰減到第 4 分鐘 ML≈91 → t≈4.7 停轉後繼續鬆弛到 ~18。
   互動：播放分段揭露；hover 曲線任一點讀 t、M 與所在區段。 */
MW.register('a-curve', {
  vb: [520, 300],
  hint: ['滑到圖上任意位置，讀那一點的時間與扭矩', 'Hover anywhere on the chart to read time and torque'],

  stages: [
    { dur: 2.0, zh: ['啟動過衝', '轉子一轉，扭矩瞬間衝上 ~140 MU——真實膠的峰比示意圖高得多，這是生膠強度在說話。'],
             en: ['Startup overshoot', 'The instant the rotor turns, torque spikes to ~140 MU — a real peak far taller than the textbook sketch; this is green strength talking.'] },
    { dur: 2.7, zh: ['衰減到平台', '剪切讓膠一路軟化，第 4 分鐘的平穩值 ≈91 MU 就是 ML(1+4)。'],
             en: ['Decay to plateau', 'Shear softens the rubber all the way down; the plateau at minute 4, ≈91 MU, is the ML(1+4).'] },
    { dur: 2.3, zh: ['停轉還在說話', 't≈4.7 分轉子停——扭矩不歸零，沿著鬆弛曲線再掉到 ~18；這段的形狀就是 k 與 a 的來源。'],
             en: ['Still talking after the stop', 'At t≈4.7 the rotor stops — torque does not drop to zero but relaxes toward ~18; the shape of this tail is where k and a come from.'] }
  ],

  scrub: { panel: 0, x0: 46, x1: 508, fn: function (x01, st) {
    /* hover 直接對應全域進度：曲線畫到滑到的位置 */
    st.u = Math.max(0.001, Math.min(1, x01));
  } },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var T_END = 7, M_MAX = 160;
    var X = function (t) { return PX0 + (t / T_END) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / M_MAX) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.PX1 = PX1; r.PY0 = PY0; r.PY1 = PY1; r.T_END = T_END;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸 */
    [0, 40, 80, 120, 160].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    for (var t = 0; t <= 7; t++) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(t), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), svg);
    }
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.txt({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'min', svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'MU', svg);

    /* 曲線（clip 揭露） */
    var clip = U.el('clipPath', { id: 'acclip' + U.uid }, svg);
    r.clipRect = U.el('rect', { x: PX0, y: 0, width: 0, height: 300 }, clip);
    r.curve = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.4, 'clip-path': 'url(#acclip' + U.uid + ')' }, svg);

    /* 預熱段標籤（第一段浮現） */
    r.preheat = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: X(0.5), y: Y(9), 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, '預熱段 ≈ 0', 'preheat ≈ 0', r.preheat);

    /* 過衝峰標註 */
    r.peak = U.el('g', { opacity: 0 }, svg);
    U.el('circle', { cx: X(1.28), cy: Y(140), r: 5, fill: 'none', stroke: P.acc2, 'stroke-width': 2 }, r.peak);
    U.bi({ x: X(1.5), y: Y(148), 'font-size': 11, fill: P.acc2, 'font-weight': 600 }, '初始峰 ~140', 'initial peak ~140', r.peak);

    /* ML 平台標註 */
    r.ml = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(4), y1: Y(91), x2: PX1, y2: Y(91), stroke: P.acc2, 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, r.ml);
    U.el('circle', { cx: X(4), cy: Y(91), r: 5, fill: P.acc2 }, r.ml);
    U.bi({ x: X(4.1), y: Y(101), 'font-size': 11, fill: P.acc2, 'font-weight': 600 }, 'ML(1+4) ≈ 91', 'ML(1+4) ≈ 91', r.ml);

    /* 停轉標註 */
    r.stop = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(4.7), y1: PY1, x2: X(4.7), y2: PY0, stroke: P.warn, 'stroke-width': 1.1, 'stroke-dasharray': '4 3' }, r.stop);
    U.bi({ x: X(4.78), y: PY1 + 10, 'font-size': 10, fill: P.warn }, 't≈4.7 停轉', 't≈4.7 rotor stops', r.stop);
    U.el('circle', { cx: X(7), cy: Y(18), r: 4, fill: 'none', stroke: P.ok, 'stroke-width': 2 }, r.stop);
    U.bi({ x: X(6.95), y: Y(30), 'font-size': 10, 'text-anchor': 'end', fill: P.ok }, '鬆弛到 ~18', 'relaxes to ~18', r.stop);

    /* 游標 */
    r.cursor = U.el('g', {}, svg);
    r.curLine = U.el('line', { x1: PX0, y1: PY1, x2: PX0, y2: PY0, stroke: P.acc, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.5 }, r.cursor);
    r.curDot = U.el('circle', { cx: PX0, cy: PY0, r: 4, fill: P.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);

    return r;
  },

  /* 實測曲線（教學近似重繪 Fig.1）：0–1min 預熱近零；1.28 達峰 140；衰減到 91；
     t=4.7 停轉後指數鬆弛到 ~18（t=7）。 */
  _M: function (t) {
    if (t < 1) return 1.5;
    var pk = 140;
    if (t < 1.28) { var u = (t - 1) / 0.28; return 1.5 + (pk - 1.5) * (1 - Math.pow(1 - u, 3)); }
    if (t < 3.9) return 91 + (pk - 91) * Math.exp(-1.5 * (t - 1.28));
    if (t < 4.7) return 91;
    return 91 * Math.exp(-0.75 * (t - 4.7));
  },

  _region: function (t) {
    if (t < 1) return ['預熱段（近零）', 'preheat (near zero)'];
    if (t < 1.4) return ['過衝峰', 'overshoot peak'];
    if (t < 3.9) return ['剪切衰減', 'shear decay'];
    if (t < 4.7) return ['ML 平台', 'ML plateau'];
    return ['停轉鬆弛', 'relaxation after stop'];
  },

  apply: function (r, ctx) {
    var X = r.X, Y = r.Y, T_END = r.T_END;
    var s = ctx.s, sp = ctx.sp;

    /* 全曲線（d 固定，揭露靠 clip 寬度） */
    var d = '';
    for (var i = 0; i <= 350; i++) {
      var tt = i / 350 * T_END;
      d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._M(tt)).toFixed(1) + ' ';
    }
    r.curve.setAttribute('d', d);

    var drawT = ctx.u * T_END;
    r.clipRect.setAttribute('width', Math.max(0, X(drawT) - r.PX0));

    /* 標註一旦亮出就保留（跨段不回滅） */
    r.preheat.setAttribute('opacity', s === 0 ? Math.min(1, sp * 2) : 1);
    r.peak.setAttribute('opacity', s === 0 ? Math.max(0, (sp - 0.45) * 2) : 1);
    r.ml.setAttribute('opacity', s === 0 ? 0 : (s === 1 ? Math.min(1, sp * 2.5) : 1));
    r.stop.setAttribute('opacity', s < 2 ? 0 : (s === 2 ? Math.min(1, sp * 2.5) : 1));

    /* 游標跟著揭露位置 */
    r.curLine.setAttribute('x1', X(drawT)); r.curLine.setAttribute('x2', X(drawT));
    r.curDot.setAttribute('cx', X(drawT));
    r.curDot.setAttribute('cy', Y(this._M(drawT)));
  },

  readout: function (ctx) {
    var t = ctx.u * 7, m = this._M(t), rg = this._region(t);
    return [
      ['t = <b>' + t.toFixed(1) + '</b> min', 't = <b>' + t.toFixed(1) + '</b> min'],
      ['M ≈ <b>' + Math.round(m) + '</b> MU', 'M ≈ <b>' + Math.round(m) + '</b> MU'],
      ['區段：<b>' + rg[0] + '</b>', 'region: <b>' + rg[1] + '</b>']
    ];
  }
});
