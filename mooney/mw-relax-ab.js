/* mw-relax-ab.js — §6 同 ML 不同手感：停轉後 A 掉到底、B 撐著不散
   故事：兩批膠 ML 同為 50，前 5 分鐘曲線完全疊合；停轉後 A 快衰（黏）、B 慢衰（彈）。
   互動：分階畫入；hover 讀同一時刻 A、B 的差距。 */
MW.register('relax-ab', {
  vb: [520, 300],
  hint: ['滑到圖上比較同一時刻 A、B 兩批掉了多少', 'Hover the chart to compare how much lots A and B have decayed at the same moment'],

  stages: [
    { dur: 3.0, zh: ['同一條曲線', 'A、B 兩批 ML 都是 50——前 5 分鐘兩條線完全疊在一起。'],
             en: ['The very same curve', 'Lots A and B both read ML 50 — for the first 5 minutes their curves lie exactly on top of each other.'] },
    { dur: 1.6, zh: ['轉子停了', '第 5 分鐘轉子停止，扭矩開始往下掉。'],
             en: ['The rotor stops', 'At minute 5 the rotor stops and torque begins to decay.'] },
    { dur: 3.0, zh: ['一個掉一個撐', 'A 批快速掉到底——黏性主導；B 批撐著不散——彈性主導。'],
             en: ['One drops, one holds', 'Lot A falls fast — viscous-dominated; lot B holds on — elastic-dominated.'] },
    { dur: 1.8, zh: ['手感在這裡', '同 ML 不同手感：A 押出穩定，B 出模後會回漲——差別全在停轉後這段。'],
             en: ['That is the "feel"', 'Same ML, different feel: A extrudes steadily, B swells after the die — the difference lives in this decay.'] }
  ],

  scrub: { panel: 0, x0: 46, x1: 508, fn: function (x01, st) {
    var tb = this._tb, ub = this._ub;
    if (!tb) { st.u = x01; return; }
    var tau = x01 * 9, s = 0;
    while (s < tb.length - 2 && tau >= tb[s + 1]) s++;
    var span = tb[s + 1] - tb[s], f = span > 0 ? (tau - tb[s]) / span : 0;
    st.u = Math.max(0, Math.min(1, ub[s] + f * (ub[s + 1] - ub[s])));
  } },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var T_END = 9, M_MAX = 100;
    var X = function (t) { return PX0 + (t / T_END) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / M_MAX) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.X5 = X(5);

    /* 四段：[0,5]同線、[5,5.3]停轉起步、[5.3,9]分岔、[9,9]結果牌 */
    var tb = [0, 5, 5.3, 9, 9], ub = [0], acc = 0, tot = 0;
    this.stages.forEach(function (sg) { tot += sg.dur; });
    this.stages.forEach(function (sg) { acc += sg.dur; ub.push(acc / tot); });
    r.tb = tb;
    if (this.scrub) { this.scrub._tb = tb; this.scrub._ub = ub; }

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸 */
    [0, 25, 50, 75, 100].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    for (var t = 0; t <= 9; t++) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(t), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), svg);
    }
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.txt({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'min', svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'MU', svg);

    /* 三條曲線各自 clip：同線段（灰）／A（藍）／B（棕） */
    var clipS = U.el('clipPath', { id: 'abS' + U.uid }, svg);
    r.clipS = U.el('rect', { x: PX0, y: 0, width: 0, height: 300 }, clipS);
    var clipA = U.el('clipPath', { id: 'abA' + U.uid }, svg);
    r.clipA = U.el('rect', { x: X(5), y: 0, width: 0, height: 300 }, clipA);
    var clipB = U.el('clipPath', { id: 'abB' + U.uid }, svg);
    r.clipB = U.el('rect', { x: X(5), y: 0, width: 0, height: 300 }, clipB);

    var dS = '', dA = '', dB = '';
    for (var i = 0; i <= 400; i++) {
      var tt = i / 400 * T_END;
      if (tt <= 5) dS += (dS ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._shared(tt)).toFixed(1) + ' ';
      else {
        dA += (dA ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._a(tt)).toFixed(1) + ' ';
        dB += (dB ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._b(tt)).toFixed(1) + ' ';
      }
    }
    r.pathS = U.path(dS, { fill: 'none', stroke: P.mut, 'stroke-width': 2.4, 'clip-path': 'url(#abS' + U.uid + ')' }, svg);
    r.pathB = U.path(dB, { fill: 'none', stroke: P.acc2, 'stroke-width': 2.4, 'clip-path': 'url(#abB' + U.uid + ')' }, svg);
    r.pathA = U.path(dA, { fill: 'none', stroke: P.acc, 'stroke-width': 2.4, 'clip-path': 'url(#abA' + U.uid + ')' }, svg);

    /* 端點標籤 A / B */
    r.endLbl = U.el('g', { opacity: 0 }, svg);
    U.el('circle', { cx: X(9), cy: Y(this._a(9)), r: 3.5, fill: P.acc }, r.endLbl);
    U.el('circle', { cx: X(9), cy: Y(this._b(9)), r: 3.5, fill: P.acc2 }, r.endLbl);
    U.txt({ x: X(9) - 8, y: Y(this._a(9)) + 4, 'font-size': 11, 'text-anchor': 'end', fill: P.acc, 'font-weight': 700 }, 'A', r.endLbl);
    U.txt({ x: X(9) - 8, y: Y(this._b(9)) + 4, 'font-size': 11, 'text-anchor': 'end', fill: P.acc2, 'font-weight': 700 }, 'B', r.endLbl);

    /* 停轉標線 */
    r.stop = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(5), y1: PY1, x2: X(5), y2: PY0, stroke: P.warn, 'stroke-width': 1.1, 'stroke-dasharray': '4 3' }, r.stop);
    U.el('circle', { cx: X(5), cy: Y(50), r: 4.5, fill: P.warn, stroke: '#fff', 'stroke-width': 1.4 }, r.stop);
    U.bi({ x: X(5) + 6, y: PY1 + 12, 'font-size': 9, fill: P.warn, 'font-weight': 600 }, '轉子停', 'rotor stops', r.stop);

    /* 結果牌（第 4 段淡入） */
    r.badge = U.el('g', { opacity: 0 }, svg);
    U.el('rect', { x: X(5.6), y: Y(84), width: PX1 - X(5.6) - 6, height: 40, rx: 5, fill: P.soft, stroke: P.line, 'stroke-width': 0.8 }, r.badge);
    U.el('line', { x1: X(5.8), y1: Y(76), x2: X(5.8) + 16, y2: Y(76), stroke: P.acc, 'stroke-width': 2.4 }, r.badge);
    U.bi({ x: X(5.8) + 22, y: Y(76) + 3.5, 'font-size': 10, fill: P.ink }, 'A → 押出穩定', 'A → extrudes steadily', r.badge);
    U.el('line', { x1: X(5.8), y1: Y(70), x2: X(5.8) + 16, y2: Y(70), stroke: P.acc2, 'stroke-width': 2.4 }, r.badge);
    U.bi({ x: X(5.8) + 22, y: Y(70) + 3.5, 'font-size': 10, fill: P.ink }, 'B → 出模回漲', 'B → swells after the die', r.badge);

    /* 游標：一條豎線＋在線上的點 */
    r.cursor = U.el('g', { opacity: 0 }, svg);
    r.curLine = U.el('line', { y1: PY1, y2: PY0, stroke: P.mut, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.6 }, r.cursor);
    r.dotS = U.el('circle', { r: 4, fill: P.mut, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);
    r.dotA = U.el('circle', { r: 4, fill: P.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);
    r.dotB = U.el('circle', { r: 4, fill: P.acc2, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);

    return r;
  },

  /* 停轉前兩批共用同一條線（峰 ~88 → 50） */
  _shared: function (t) {
    if (t < 1) return 0;
    if (t < 1.15) { var u = (t - 1) / 0.15; return 88 * (1 - Math.pow(1 - u, 3)); }
    return 50 + 38 * Math.exp(-1.6 * (t - 1.15));
  },
  _a: function (t) { return t <= 5 ? this._shared(t) : 50 * Math.exp(-1.8 * (t - 5)); },
  _b: function (t) { return t <= 5 ? this._shared(t) : 50 * Math.exp(-0.35 * (t - 5)); },

  apply: function (r, ctx) {
    var X = r.X, Y = r.Y, s = ctx.s, sp = ctx.sp;
    var drawT = r.tb[s] + Math.min(1, sp) * (r.tb[s + 1] - r.tb[s]);

    r.clipS.setAttribute('width', Math.max(0, Math.min(X(drawT), r.X5) - r.PX0));
    var post = Math.max(0, X(drawT) - r.X5);
    r.clipA.setAttribute('width', post);
    r.clipB.setAttribute('width', post);

    r.stop.setAttribute('opacity', s > 1 ? 1 : (s === 1 ? Math.min(1, sp * 2) : (s === 0 ? Math.min(1, sp * 2) : 0)));
    r.endLbl.setAttribute('opacity', s >= 2 ? Math.min(1, sp * 1.5) : 0);
    r.badge.setAttribute('opacity', s >= 3 ? Math.min(1, sp * 2) : 0);

    /* 游標 */
    r.cursor.setAttribute('opacity', ctx.u > 0.002 ? 1 : 0);
    r.curLine.setAttribute('x1', X(drawT)); r.curLine.setAttribute('x2', X(drawT));
    var pre = drawT <= 5;
    r.dotS.setAttribute('opacity', pre ? 1 : 0);
    r.dotA.setAttribute('opacity', pre ? 0 : 1);
    r.dotB.setAttribute('opacity', pre ? 0 : 1);
    if (pre) { r.dotS.setAttribute('cx', X(drawT)); r.dotS.setAttribute('cy', Y(this._shared(drawT))); }
    else {
      r.dotA.setAttribute('cx', X(drawT)); r.dotA.setAttribute('cy', Y(this._a(drawT)));
      r.dotB.setAttribute('cx', X(drawT)); r.dotB.setAttribute('cy', Y(this._b(drawT)));
    }
  },

  readout: function (ctx) {
    var tb = this.scrub._tb;
    var t = tb[ctx.s] + Math.min(1, ctx.sp) * (tb[ctx.s + 1] - tb[ctx.s]);
    var a = this._a(t), b = this._b(t), gap = b - a;
    return [
      ['t = <b>' + t.toFixed(2) + '</b> min', 't = <b>' + t.toFixed(2) + '</b> min'],
      ['A = <b>' + a.toFixed(1) + '</b> MU', 'A = <b>' + a.toFixed(1) + '</b> MU'],
      ['B = <b>' + b.toFixed(1) + '</b> MU', 'B = <b>' + b.toFixed(1) + '</b> MU'],
      ['差距 <b>' + gap.toFixed(1) + '</b> MU', 'gap <b>' + gap.toFixed(1) + '</b> MU']
    ];
  }
});
