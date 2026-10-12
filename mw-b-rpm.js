/* mw-b-rpm.js — 專題 B（fig-topic-b-torque-time）：同一批 GP A（老化三個月）在
   2 rpm 與 15 rpm 的扭矩–時間對比。
   15 rpm：啟動瞬間過衝 ~142 MU 再回落，後段帶毛邊——膠在撕裂的原始訊號；
   2 rpm：平緩爬升收在 ML(1+4)≈92，尾段仍有細毛邊；0.2 rpm 淡灰線作平滑對照。
   數值依 figcaption（~142 峰、平台 ~92/97、0.2rpm ~70）；毛邊＝固定 sin 疊加（教學近似）。 */
MW.register('b-rpm', {
  vb: [520, 300],
  hint: ['切換轉速或疊加對照，滑到圖上讀任一點扭矩', 'Switch speed or overlay both, then hover to read torque'],

  params: [
    { key: 'rpm', type: 'choice', def: 'both', zh: '轉速', en: 'Rotor speed',
      options: [
        { v: 'r2',   zh: '2 rpm（標準）', en: '2 rpm (standard)' },
        { v: 'r15',  zh: '15 rpm',        en: '15 rpm' },
        { v: 'both', zh: '疊加對照',       en: 'Overlay both' }
      ] }
  ],

  scrub: { panel: 0, x0: 46, x1: 508, fn: function (x01, st) { st.params.hx = x01; } },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18, T_END = 5, M_MAX = 160;
    var X = function (t) { return PX0 + (t / T_END) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / M_MAX) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.PX1 = PX1; r.PY0 = PY0; r.PY1 = PY1; r.T_END = T_END;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸 */
    [0, 40, 80, 120, 160].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    for (var t = 0; t <= 5; t++) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(t), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), svg);
    }
    U.txt({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'min', svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'MU', svg);
    U.bi({ x: X(0.5), y: PY0 - 7, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut }, '預熱', 'preheat', svg);

    /* 曲線：0.2 淡灰對照在最下層 */
    r.c02 = U.path('', { fill: 'none', stroke: P.mut, 'stroke-width': 1.3, 'stroke-dasharray': '2 3', opacity: 0.7 }, svg);
    r.c2 = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.4 }, svg);
    r.c15 = U.path('', { fill: 'none', stroke: P.warn, 'stroke-width': 2.2 }, svg);

    /* 15 rpm 過衝標註 */
    r.pkG = U.el('g', { opacity: 0 }, svg);
    U.el('circle', { cx: X(1.02), cy: Y(142), r: 4, fill: P.warn, stroke: '#fff', 'stroke-width': 1.4 }, r.pkG);
    U.bi({ x: X(1.18), y: Y(152), 'font-size': 10, fill: P.warn, 'font-weight': 600 }, '過衝 ~142 MU', '~142 MU overshoot', r.pkG);

    /* 2 rpm 第 4 分鐘 ML 旗標 */
    r.mlG = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(4), y1: PY0, x2: X(4), y2: Y(92), stroke: P.acc, 'stroke-width': 1, 'stroke-dasharray': '4 3', opacity: 0.7 }, r.mlG);
    U.el('circle', { cx: X(4), cy: Y(92), r: 4.5, fill: P.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.mlG);
    U.bi({ x: X(3.92), y: Y(76), 'font-size': 10, 'text-anchor': 'end', fill: P.acc, 'font-weight': 600 }, 'ML(1+4) 讀值 92', 'ML(1+4) reads 92', r.mlG);

    /* 線名（右緣） */
    r.l2 = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: PX1 - 4, y: Y(80), 'font-size': 10, 'text-anchor': 'end', fill: P.acc, 'font-weight': 600 }, '2 rpm', '2 rpm', r.l2);
    r.l15 = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: PX1 - 4, y: Y(112), 'font-size': 10, 'text-anchor': 'end', fill: P.warn, 'font-weight': 600 }, '15 rpm', '15 rpm', r.l15);
    U.bi({ x: PX1 - 4, y: Y(64), 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, '0.2 rpm（平滑對照）', '0.2 rpm (smooth ref.)', svg);

    /* 游標 */
    r.cursor = U.el('g', { opacity: 0 }, svg);
    r.curLine = U.el('line', { x1: PX0, y1: PY1, x2: PX0, y2: PY0, stroke: P.ink, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.5 }, r.cursor);
    r.d02 = U.el('circle', { cx: 0, cy: 0, r: 3, fill: P.mut, stroke: '#fff', 'stroke-width': 1.2 }, r.cursor);
    r.d2 = U.el('circle', { cx: 0, cy: 0, r: 4, fill: P.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);
    r.d15 = U.el('circle', { cx: 0, cy: 0, r: 4, fill: P.warn, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);
    return r;
  },

  /* 固定噪函數（無亂數）：模擬破裂段的高頻毛邊 */
  _noise: function (t) {
    return Math.sin(t * 47.3) * 0.55 + Math.sin(t * 83.1 + 1.7) * 0.30 + Math.sin(t * 29.7 + 0.4) * 0.35;
  },

  /* GP A 老化樣品的扭矩曲線（t<1 預熱無扭矩） */
  _tq: function (t, w) {
    if (t < 1) return 0;
    var u = t - 1;
    if (w === 'r15') {
      /* 過衝 ~142 → 回落 ~97，t>1.3 後毛邊 ±3（撕裂訊號） */
      return 97 + 45 * Math.exp(-u / 0.16) + (t > 1.3 ? this._noise(t) * 2.6 : 0);
    }
    if (w === 'r02') {
      /* 平滑慢升到 ~70（真流動） */
      return 70 * (1 - Math.exp(-u / 1.15));
    }
    /* r2：小過衝 ~115 → ML 92，尾段細毛邊 ±1.2 */
    return 92 + 23 * Math.exp(-u / 0.4) + (t > 2.3 ? this._noise(t) * 1.2 : 0);
  },

  apply: function (r, ctx) {
    var mode = ctx.params.rpm, self = this;
    var show2 = mode === 'r2' || mode === 'both';
    var show15 = mode === 'r15' || mode === 'both';

    function draw(w) {
      var d = '';
      for (var i = 0; i <= 300; i++) {
        var tt = i / 300 * r.T_END;
        d += (i ? 'L' : 'M') + r.X(tt).toFixed(1) + ' ' + r.Y(self._tq(tt, w)).toFixed(1) + ' ';
      }
      return d;
    }
    r.c2.setAttribute('d', draw('r2'));
    r.c15.setAttribute('d', draw('r15'));
    r.c02.setAttribute('d', draw('r02'));
    r.c2.setAttribute('opacity', show2 ? 1 : 0);
    r.c15.setAttribute('opacity', show15 ? 1 : 0);
    r.pkG.setAttribute('opacity', show15 ? 1 : 0);
    r.mlG.setAttribute('opacity', show2 ? 1 : 0);
    r.l2.setAttribute('opacity', show2 ? 1 : 0);
    r.l15.setAttribute('opacity', show15 ? 1 : 0);

    /* 游標 */
    var hx = ctx.params.hx;
    if (typeof hx === 'number') {
      var ct = Math.max(0, Math.min(1, hx)) * r.T_END;
      r.curLine.setAttribute('x1', r.X(ct)); r.curLine.setAttribute('x2', r.X(ct));
      r.d2.setAttribute('cx', r.X(ct)); r.d2.setAttribute('cy', r.Y(this._tq(ct, 'r2')));
      r.d2.setAttribute('opacity', show2 ? 1 : 0);
      r.d15.setAttribute('cx', r.X(ct)); r.d15.setAttribute('cy', r.Y(this._tq(ct, 'r15')));
      r.d15.setAttribute('opacity', show15 ? 1 : 0);
      r.d02.setAttribute('cx', r.X(ct)); r.d02.setAttribute('cy', r.Y(this._tq(ct, 'r02')));
      r.cursor.setAttribute('opacity', 1);
    } else {
      r.cursor.setAttribute('opacity', 0);
    }
  },

  readout: function (ctx) {
    var mode = ctx.params.rpm, hx = ctx.params.hx, rows = [];
    if (typeof hx === 'number') {
      var t = Math.max(0, Math.min(1, hx)) * 5;
      rows.push(['t = <b>' + t.toFixed(1) + '</b> min', 't = <b>' + t.toFixed(1) + '</b> min']);
      if (mode !== 'r15') rows.push(['2 rpm ≈ <b>' + this._tq(t, 'r2').toFixed(0) + '</b> MU', '2 rpm ≈ <b>' + this._tq(t, 'r2').toFixed(0) + '</b> MU']);
      if (mode !== 'r2') rows.push(['15 rpm ≈ <b>' + this._tq(t, 'r15').toFixed(0) + '</b> MU', '15 rpm ≈ <b>' + this._tq(t, 'r15').toFixed(0) + '</b> MU']);
    } else {
      rows.push(['GP A（RSS3 類）老化三個月 · ML(1+4) = 92', 'GP A (RSS3-type), aged 3 months · ML(1+4) = 92']);
    }
    if (mode === 'r15') rows.push(['尖峰 ~142＋後段毛邊——膠在模腔裡撕裂的原始訊號', 'A ~142 spike plus a ragged tail — the raw signature of tearing in the cavity']);
    else if (mode === 'r2') rows.push(['第 4 分鐘讀值 92——看起來平穩，尾段其實仍有細毛邊', 'Minute-4 reading of 92 — looks calm, but the tail is still slightly ragged']);
    else rows.push(['同批膠兩種面孔：高速的峰與毛邊是破裂，不是粘度', 'One lot, two faces: the spike and raggedness at high speed is tearing, not viscosity']);
    return rows;
  },

  guide: function (ctx) {
    var mode = ctx.params.rpm;
    if (mode === 'r15') return ['毛邊不是儀器雜訊——是膠在模腔裡撕裂、扭矩讀不穩的痕跡。', 'The raggedness is not instrument noise — it is the rubber tearing in the cavity, destabilizing torque.'];
    if (mode === 'r2') return ['2 rpm 看起來平穩，其實讀值已站在破裂支線上——往下兩張圖看它為什麼對不上 Wallace。', '2 rpm looks calm, yet the reading already sits on the fracture branch — the next charts show why it misses Wallace.'];
    return ['疊起來看：高速量到的是「膠什麼時候撕」，低速量到的才是「膠多難推」。', 'Overlaid: high speed reports when the rubber tears; low speed reports how hard it is to push.'];
  }
});
