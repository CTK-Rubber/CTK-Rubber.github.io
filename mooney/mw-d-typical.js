/* mw-d-typical.js — 專題D · 三種膠的典型木尼曲線（Ehabe et al. 2005 Fig.1，教學近似重繪）
   故事：TSR10 過衝高、TSR3CV 平緩、Natsyn 幾乎無峰——但不管峰長什麼樣，
        轉子一停，右邊那段衰減才是四個模型要擬合的考題。
   互動：分階畫入＋膠種切換（另兩條留淡影對照）；hover 沿曲線讀 t/M。 */
MW.register('d-typical', {
  vb: [520, 300],
  hint: ['換一種膠看過衝怎麼變；滑到曲線上讀數', 'Switch rubber type to compare overshoot; hover the curve to read values'],

  stages: [
    { dur: 2.2, zh: ['啟動過衝', '轉子一轉，扭矩瞬間衝頂——TSR10 衝到 ~155，這個初期峰反映生膠強度。'],
             en: ['Startup overshoot', 'The instant the rotor turns, torque spikes — TSR10 peaks near 155; the early peak speaks of green strength.'] },
    { dur: 2.6, zh: ['衰減到 ML', '剪切軟化把扭矩一路拉低，第 4 分鐘的平穩值就是 ML——TSR10 約 96。'],
             en: ['Decay to ML', 'Shear softening drags torque down; the plateau at minute 4 is the ML — about 96 for TSR10.'] },
    { dur: 3.0, zh: ['停轉才是考題', 't≈4.7 轉子停——右邊這段鬆弛衰減，就是冪次／Maxwell／Wu–Abbott／KWW 四個模型要擬合的對象。'],
             en: ['The stop is the real test', 'At t≈4.7 the rotor stops — the relaxation tail on the right is what the four models (power law, Maxwell, Wu–Abbott, KWW) must each fit.'] }
  ],

  params: [
    { key: 'rubber', type: 'choice', def: 'tsr10',
      zh: '膠種', en: 'Rubber',
      options: [
        { v: 'tsr10', zh: 'TSR10', en: 'TSR10' },
        { v: 'tsr3cv', zh: 'TSR3CV', en: 'TSR3CV' },
        { v: 'natsyn', zh: 'Natsyn', en: 'Natsyn' }
      ] }
  ],

  scrub: { panel: 0, x0: 46, x1: 508, fn: function (x01, st) {
    /* hover 直接映射全域進度：曲線走到滑到的位置 */
    st.u = Math.max(0.001, Math.min(1, x01));
  } },

  /* 三種膠曲線參數（教學近似：ML 用真值表值、峰依過衝強弱設）
     [峰 MU, 平台 ML, 鬆弛尾端 MU] */
  _RUB: {
    tsr10:  { pk: 155, ml: 96, end: 30, name: 'TSR10 (1SAP11)',  zh: '過衝高——冷膠硬、生膠強度大', en: 'tall overshoot — stiff green strength' },
    tsr3cv: { pk: 80,  ml: 66, end: 26, name: 'TSR3CV (1SAP1CV)', zh: '平緩——峰小、衰減也慢', en: 'mild — small peak, gentle decay' },
    natsyn: { pk: 90,  ml: 85, end: 55, name: 'Natsyn 2200', zh: '幾乎無過衝——合成膠起步就軟', en: 'almost no overshoot — synthetic starts soft' }
  },

  _M: function (t, rb) {
    /* 曲線：0–1 預熱 0；1–1.25 衝峰 pk；1.25–4 衰到 ml；4–4.7 平台；4.7–8 停轉鬆弛 */
    if (t < 1) return 0;
    if (t < 1.25) { var u = (t - 1) / 0.25; return rb.pk * (1 - Math.pow(1 - u, 3)); }
    if (t < 4) return rb.ml + (rb.pk - rb.ml) * Math.exp(-1.6 * (t - 1.25));
    if (t < 4.7) return rb.ml;
    /* 停轉鬆弛：歸一化尾端比例跟膠種走（TSR 掉到 ~30%，Natsyn 撐在 ~65%） */
    var frac = rb.end / rb.ml;
    return rb.ml * (frac + (1 - frac) * Math.exp(-0.9 * (t - 4.7)));
  },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var T_END = 8, M_MAX = 170;
    var X = function (t) { return PX0 + (t / T_END) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / M_MAX) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.T_END = T_END;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸 */
    [0, 40, 80, 120, 160].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    for (var t = 0; t <= 8; t++) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(t), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), svg);
    }
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.txt({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'min', svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'MU', svg);

    /* 停轉後的鬆弛區塊（第三段亮起：這段是四個模型的考題） */
    r.relaxZone = U.el('g', { opacity: 0 }, svg);
    U.el('rect', { x: X(4.7), y: PY1, width: PX1 - X(4.7), height: PY0 - PY1, fill: P.acc, opacity: 0.08 }, r.relaxZone);
    U.el('line', { x1: X(4.7), y1: PY1, x2: X(4.7), y2: PY0, stroke: P.warn, 'stroke-width': 1.1, 'stroke-dasharray': '4 3' }, r.relaxZone);
    U.el('rect', { x: X(4.82), y: PY1 + 6, width: 186, height: 34, rx: 5, fill: '#fff', stroke: P.acc, 'stroke-width': 1, opacity: 0.92 }, r.relaxZone);
    U.bi({ x: X(4.92), y: PY1 + 20, 'font-size': 10.5, fill: P.acc, 'font-weight': 700 },
      '四個模型要擬合的就是這段', 'all four models fit this segment', r.relaxZone);
    U.bi({ x: X(4.92), y: PY1 + 32, 'font-size': 9, fill: P.mut },
      '停轉後扭矩沿著鬆弛形狀慢慢散', 'torque drains after the rotor stops', r.relaxZone);

    /* 影子曲線（另兩種膠淡顯對照）＋主曲線 */
    var clip = U.el('clipPath', { id: 'dtclip' + U.uid }, svg);
    r.clipRect = U.el('rect', { x: PX0, y: 0, width: 0, height: 300 }, clip);
    r.ghost1 = U.path('', { fill: 'none', stroke: P.mut, 'stroke-width': 1.4, opacity: 0.35, 'clip-path': 'url(#dtclip' + U.uid + ')' }, svg);
    r.ghost2 = U.path('', { fill: 'none', stroke: P.mut, 'stroke-width': 1.4, opacity: 0.25, 'clip-path': 'url(#dtclip' + U.uid + ')' }, svg);
    r.curve = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.4, 'clip-path': 'url(#dtclip' + U.uid + ')' }, svg);

    /* 峰標註（第一段浮現） */
    r.peak = U.el('g', { opacity: 0 }, svg);
    r.pkCircle = U.el('circle', { r: 5, fill: 'none', stroke: P.acc2, 'stroke-width': 2 }, r.peak);
    r.pkZh = U.txt({ x: 0, y: 0, 'font-size': 11, fill: P.acc2, 'font-weight': 600, 'class': 'lang-zh' }, '', r.peak);
    r.pkEn = U.txt({ x: 0, y: 0, 'font-size': 11, fill: P.acc2, 'font-weight': 600, 'class': 'lang-en' }, '', r.peak);

    /* ML 平台標註（第二段浮現） */
    r.ml = U.el('g', { opacity: 0 }, svg);
    r.mlLine = U.el('line', { y1: 0, x2: PX1, y2: 0, stroke: P.acc2, 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, r.ml);
    r.mlDot = U.el('circle', { cx: X(4), r: 5, fill: P.acc2 }, r.ml);
    r.mlZh = U.txt({ x: X(4.1), y: 0, 'font-size': 11, fill: P.acc2, 'font-weight': 600, 'class': 'lang-zh' }, '', r.ml);
    r.mlEn = U.txt({ x: X(4.1), y: 0, 'font-size': 11, fill: P.acc2, 'font-weight': 600, 'class': 'lang-en' }, '', r.ml);

    /* 膠種名牌 */
    r.name = U.txt({ x: PX1 - 6, y: PY0 - 8, 'font-size': 11, 'text-anchor': 'end', fill: P.ink, 'font-weight': 700 }, '', svg);

    /* 游標 */
    r.cursor = U.el('g', {}, svg);
    r.curLine = U.el('line', { x1: PX0, y1: PY1, x2: PX0, y2: PY0, stroke: P.acc, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.5 }, r.cursor);
    r.curDot = U.el('circle', { cx: PX0, cy: PY0, r: 4, fill: P.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);

    return r;
  },

  _region: function (t) {
    if (t < 1) return ['預熱段（近零）', 'preheat (near zero)'];
    if (t < 1.4) return ['過衝峰', 'overshoot peak'];
    if (t < 4) return ['剪切衰減', 'shear decay'];
    if (t < 4.7) return ['ML 平台', 'ML plateau'];
    return ['停轉鬆弛——四模型的考題', 'relaxation — the four models’ exam'];
  },

  apply: function (r, ctx) {
    var self = this, P = MW.PAL;
    var X = r.X, Y = r.Y, T_END = r.T_END;
    var rb = self._RUB[ctx.params.rubber] || self._RUB.tsr10;
    var s = ctx.s, sp = ctx.sp;

    /* 主曲線與兩條影子線（其餘兩種膠） */
    var order = ['tsr10', 'tsr3cv', 'natsyn'];
    var others = order.filter(function (k) { return k !== ctx.params.rubber; });
    function draw(rb2) {
      var d = '';
      for (var i = 0; i <= 340; i++) {
        var tt = i / 340 * T_END;
        d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(self._M(tt, rb2)).toFixed(1) + ' ';
      }
      return d;
    }
    r.curve.setAttribute('d', draw(rb));
    r.ghost1.setAttribute('d', draw(self._RUB[others[0]]));
    r.ghost2.setAttribute('d', draw(self._RUB[others[1]]));

    /* 揭露進度：全域 u 驅動（三段各走完一段時間範圍） */
    var drawT = ctx.u * T_END;
    r.clipRect.setAttribute('width', Math.max(0, X(drawT) - r.PX0));

    /* 峰標註：第一段後半浮現，之後保留 */
    var pkOp = s === 0 ? Math.max(0, (sp - 0.5) * 2) : 1;
    r.peak.setAttribute('opacity', pkOp);
    r.pkCircle.setAttribute('cx', X(1.25)); r.pkCircle.setAttribute('cy', Y(rb.pk));
    r.pkZh.setAttribute('x', X(1.4)); r.pkZh.setAttribute('y', Y(rb.pk + 9));
    r.pkEn.setAttribute('x', X(1.4)); r.pkEn.setAttribute('y', Y(rb.pk + 9));
    r.pkZh.textContent = '峰 ≈ ' + rb.pk;
    r.pkEn.textContent = 'peak ≈ ' + rb.pk;

    /* ML 標註：第二段浮現 */
    var mlOp = s < 1 ? 0 : (s === 1 ? Math.min(1, sp * 2.5) : 1);
    r.ml.setAttribute('opacity', mlOp);
    r.mlLine.setAttribute('y1', Y(rb.ml)); r.mlLine.setAttribute('y2', Y(rb.ml));
    r.mlLine.setAttribute('x1', X(4));
    r.mlDot.setAttribute('cy', Y(rb.ml));
    r.mlZh.setAttribute('x', X(4.1)); r.mlZh.setAttribute('y', Y(rb.ml) + 15);
    r.mlEn.setAttribute('x', X(4.1)); r.mlEn.setAttribute('y', Y(rb.ml) + 15);
    r.mlZh.textContent = 'ML ≈ ' + rb.ml;
    r.mlEn.textContent = 'ML ≈ ' + rb.ml;

    /* 停轉區塊：第三段浮現 */
    r.relaxZone.setAttribute('opacity', s < 2 ? 0 : Math.min(1, sp * 2.5));

    r.name.textContent = rb.name;

    /* 游標 */
    r.curLine.setAttribute('x1', X(drawT)); r.curLine.setAttribute('x2', X(drawT));
    r.curDot.setAttribute('cx', X(drawT));
    r.curDot.setAttribute('cy', Y(this._M(drawT, rb)));
  },

  readout: function (ctx) {
    var rb = this._RUB[ctx.params.rubber] || this._RUB.tsr10;
    var t = ctx.u * 8, m = this._M(t, rb), rg = this._region(t);
    return [
      [rb.name, rb.name],
      ['t = <b>' + t.toFixed(1) + '</b> min　M ≈ <b>' + Math.round(m) + '</b> MU', 't = <b>' + t.toFixed(1) + '</b> min　M ≈ <b>' + Math.round(m) + '</b> MU'],
      ['ML <b>' + rb.ml + '</b> · 峰 <b>' + rb.pk + '</b>', 'ML <b>' + rb.ml + '</b> · peak <b>' + rb.pk + '</b>'],
      [rg[0], rg[1]]
    ];
  },

  guide: function (ctx) {
    var rb = this._RUB[ctx.params.rubber] || this._RUB.tsr10;
    if (ctx.s >= 2) {
      return ['現在是 ' + rb.name + '：' + rb.zh + '。換別種膠比一比——峰可以差兩倍，衰減段的形狀也會跟著變。',
              'Now showing ' + rb.name + ': ' + rb.en + '. Switch rubbers — the peak can differ twofold, and the decay tail changes with it.'];
    }
    return null;
  }
});
