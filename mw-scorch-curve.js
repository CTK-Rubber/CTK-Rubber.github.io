/* mw-scorch-curve.js — §3 焦燒曲線：先降後升，回升 5 格就是 t5
   故事：含硫化劑的膠在高溫下先軟化、粘度觸底，之後硫化啟動粘度回升。
   互動：分階畫入；hover 讀當下粘度與「離 t5 還有多久」。 */
MW.register('scorch-curve', {
  vb: [520, 300],
  hint: ['滑到圖上看任一時刻的粘度，以及離 t5 還有多久', 'Hover the chart for the viscosity at that moment and the time left to t5'],

  stages: [
    { dur: 2.2, zh: ['受熱先變軟', '含硫化劑的膠進入高溫模腔先軟化——粘度一路下滑。'],
             en: ['Heat softens it first', 'With curatives inside, the hot cavity softens the compound first — viscosity slides down.'] },
    { dur: 1.8, zh: ['最軟的一刻', '約第 2.5 分鐘粘度觸底（約 42 MU）——這是最好加工的時段。'],
             en: ['The softest moment', 'Viscosity bottoms out around minute 2.5 (≈42 MU) — the easiest window to process.'] },
    { dur: 3.0, zh: ['硫化回升', '最低點過後硫化啟動，粘度開始往上爬——膠正在「熟」。'],
             en: ['The cure kicks in', 'Past the minimum, vulcanization starts and viscosity climbs — the compound is beginning to "cook".'] },
    { dur: 2.2, zh: ['t5 是底線', '從最低點回升 5 個單位的時間叫 t5（約 9 分鐘）——安全加工時間的實務底線。'],
             en: ['t5 is the deadline', 'The time to rise 5 MU off the minimum is t5 (≈9 min) — the practical limit for safe processing.'] }
  ],

  scrub: { panel: 0, x0: 46, x1: 508, fn: function (x01, st) {
    var tb = this._tb, ub = this._ub;
    if (!tb) { st.u = x01; return; }
    var tau = x01 * 12, s = 0;
    while (s < tb.length - 2 && tau >= tb[s + 1]) s++;
    var span = tb[s + 1] - tb[s], f = span > 0 ? (tau - tb[s]) / span : 0;
    st.u = Math.max(0, Math.min(1, ub[s] + f * (ub[s + 1] - ub[s])));
  } },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var T_END = 12, M_LO = 35, M_HI = 65;
    var T5 = 2.5 + Math.sqrt(5 / 0.118);   /* 回升 5 MU 的時間 ≈ 9.01 */
    var X = function (t) { return PX0 + (t / T_END) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - ((m - M_LO) / (M_HI - M_LO)) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.T5 = T5;

    /* 四段：降段畫到 2.5、最低點停留、回升畫到 t5、旗標畫到 12 */
    var tb = [0, 2.5, 2.5, T5, T_END], ub = [0], acc = 0, tot = 0;
    this.stages.forEach(function (sg) { tot += sg.dur; });
    this.stages.forEach(function (sg) { acc += sg.dur; ub.push(acc / tot); });
    r.tb = tb;
    if (this.scrub) { this.scrub._tb = tb; this.scrub._ub = ub; }

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸 */
    [40, 45, 50, 55, 60].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': 0.8 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    for (var t = 0; t <= 12; t += 2) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(t), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), svg);
    }
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.txt({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'min', svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'MU', svg);

    /* 曲線＋clip 揭露 */
    var clip = U.el('clipPath', { id: 'scclip' + U.uid }, svg);
    r.clipRect = U.el('rect', { x: PX0, y: 0, width: 0, height: 300 }, clip);
    var d = '';
    for (var i = 0; i <= 360; i++) {
      var tt = i / 360 * T_END;
      d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._visc(tt)).toFixed(1) + ' ';
    }
    r.curve = U.path(d, { fill: 'none', stroke: P.acc, 'stroke-width': 2.4, 'clip-path': 'url(#scclip' + U.uid + ')' }, svg);

    /* 最低點標註（第 2 段淡入） */
    r.min = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(2.5), y1: Y(42), x2: PX1, y2: Y(42), stroke: P.mut, 'stroke-width': 1.1, 'stroke-dasharray': '5 4' }, r.min);
    U.el('circle', { cx: X(2.5), cy: Y(42), r: 4.5, fill: P.ok, stroke: '#fff', 'stroke-width': 1.4 }, r.min);
    U.bi({ x: X(2.6), y: Y(42) + 16, 'font-size': 10, fill: P.ok, 'font-weight': 600 }, '最低點 ~42', 'minimum ~42', r.min);

    /* 回升標註（第 3 段淡入） */
    r.rise = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(4.6), y1: Y(52), x2: X(6.4), y2: Y(47.5), stroke: P.acc2, 'stroke-width': 1.2, 'stroke-dasharray': '4 3' }, r.rise);
    U.bi({ x: X(5.5), y: Y(55), 'font-size': 10, 'text-anchor': 'middle', fill: P.acc2 }, '硫化中——粘度回升', 'curing — viscosity rises', r.rise);

    /* t5 旗標（第 4 段淡入）：回升 5 MU 的位置 */
    r.flag = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(T5), y1: Y(47) - 30, x2: X(T5), y2: PY0, stroke: P.warn, 'stroke-width': 1.3 }, r.flag);
    U.el('line', { x1: X(T5) + 10, y1: Y(42), x2: X(T5) + 10, y2: Y(47), stroke: P.warn, 'stroke-width': 1.4 }, r.flag);
    U.el('line', { x1: X(T5) + 6, y1: Y(42), x2: X(T5) + 14, y2: Y(42), stroke: P.warn, 'stroke-width': 1.4 }, r.flag);
    U.el('line', { x1: X(T5) + 6, y1: Y(47), x2: X(T5) + 14, y2: Y(47), stroke: P.warn, 'stroke-width': 1.4 }, r.flag);
    U.el('circle', { cx: X(T5), cy: Y(47), r: 4.5, fill: P.warn, stroke: '#fff', 'stroke-width': 1.4 }, r.flag);
    U.bi({ x: X(T5) + 16, y: Y(45.5) + 3, 'font-size': 10, fill: P.warn }, '+5 MU', '+5 MU', r.flag);
    U.bi({ x: X(T5), y: Y(47) - 36, 'font-size': 11, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 700 }, 't5 ≈ 9 min', 't5 ≈ 9 min', r.flag);

    /* 游標 */
    r.cursor = U.el('g', { opacity: 0 }, svg);
    r.curLine = U.el('line', { y1: PY1, y2: PY0, stroke: P.acc, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.5 }, r.cursor);
    r.curDot = U.el('circle', { r: 4, fill: P.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);

    return r;
  },

  /* 焦燒曲線：先衰到 42（t≈2.5），之後硫化以抛物線回升，t5 ≈ 9 */
  _visc: function (t) {
    if (t < 2.5) return 42 + 16 * Math.exp(-1.6 * t);
    return 42 + 0.118 * (t - 2.5) * (t - 2.5);
  },

  apply: function (r, ctx) {
    var X = r.X, Y = r.Y, s = ctx.s, sp = ctx.sp;
    var drawT = r.tb[s] + Math.min(1, sp) * (r.tb[s + 1] - r.tb[s]);
    r.clipRect.setAttribute('width', Math.max(0, X(drawT) - r.PX0));

    r.min.setAttribute('opacity', s > 1 ? 1 : (s === 1 ? Math.min(1, sp * 2) : 0));
    r.rise.setAttribute('opacity', s > 2 ? 1 : (s === 2 ? Math.min(1, sp * 2) : 0));
    r.flag.setAttribute('opacity', s >= 3 ? Math.min(1, sp * 2.5) : 0);

    r.cursor.setAttribute('opacity', ctx.u > 0.002 ? 1 : 0);
    r.curLine.setAttribute('x1', X(drawT)); r.curLine.setAttribute('x2', X(drawT));
    r.curDot.setAttribute('cx', X(drawT));
    r.curDot.setAttribute('cy', Y(this._visc(drawT)));
  },

  readout: function (ctx) {
    var tb = this.scrub._tb;
    var t = tb[ctx.s] + Math.min(1, ctx.sp) * (tb[ctx.s + 1] - tb[ctx.s]);
    var m = this._visc(t), T5 = 2.5 + Math.sqrt(5 / 0.118);
    var left = T5 - t, rem;
    if (left > 0) rem = ['距 t5 還有 <b>' + left.toFixed(1) + '</b> min', '<b>' + left.toFixed(1) + '</b> min left to t5'];
    else rem = ['已過 t5 <b>' + (-left).toFixed(1) + '</b> min', '<b>' + (-left).toFixed(1) + '</b> min past t5'];
    return [
      ['t = <b>' + t.toFixed(2) + '</b> min', 't = <b>' + t.toFixed(2) + '</b> min'],
      ['粘度 = <b>' + m.toFixed(1) + '</b> MU', 'Viscosity = <b>' + m.toFixed(1) + '</b> MU'],
      [rem[0], rem[1]]
    ];
  }
});
