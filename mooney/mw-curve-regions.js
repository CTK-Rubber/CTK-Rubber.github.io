/* mw-curve-regions.js — §6 一條曲線、三組資訊
   故事：標準 ML(1+4) 曲線藏三段情報——初期峰＝生膠強度、平台＝加工性(ML)、
        停轉衰減＝彈性；多數報表只摘平台那個數。
   互動：滑到曲線上自動選區（scrub 主），下方按鈕選區（輔）；
        曲線實線到 t=5（轉子停），5–7 衰減段用虛線（對應 §4 圖說）。 */
MW.register('curve-regions', {
  vb: [520, 300],
  hint: ['滑到曲線上任一區，或按下方按鈕', 'Hover any region of the curve, or use the buttons'],

  params: [
    { key: 'region', type: 'choice', def: 'plateau', zh: '區域', en: 'Region',
      options: [
        { v: 'peak',    zh: '峰',   en: 'peak' },
        { v: 'plateau', zh: '平台', en: 'plateau' },
        { v: 'decay',   zh: '衰減', en: 'decay' }
      ] }
  ],

  /* hover 自動選區：t<1 預熱無區；1–1.7 峰、1.7–5 平台、≥5 衰減 */
  scrub: { panel: 0, x0: 46, x1: 508, fn: function (x01, st) {
    var t = x01 * 7;
    st.params._ht = t;
    st.params.region = t < 1 ? '' : (t < 1.7 ? 'peak' : (t < 5 ? 'plateau' : 'decay'));
  } },

  /* 標準曲線（同 mooney-machine）：峰 88 → 平台 50 → 停轉衰減（教學近似） */
  _M: function (t) {
    if (t < 1) return 0;
    if (t < 1.15) { var u = (t - 1) / 0.15; return 88 * (1 - Math.pow(1 - u, 3)); }
    if (t <= 5) return 50 + 38 * Math.exp(-1.15 * (t - 1.15));
    return 50 * Math.pow((t - 5) * 60 + 1, -0.45);
  },

  /* 區域帶（峰 1–1.4 / 平台 2–5 / 衰減 5–7）＋代表錨點 t */
  _REG: {
    peak:    { t0: 1, t1: 1.4, col: 'rub',  at: 1.15 },
    plateau: { t0: 2, t1: 5,   col: 'ok',   at: 4 },
    decay:   { t0: 5, t1: 7,   col: 'acc2', at: 6 }
  },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var X = function (t) { return PX0 + t / 7 * (PX1 - PX0); };
    var Y = function (m) { return PY0 - m / 110 * (PY0 - PY1); };
    r.X = X; r.Y = Y;
    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸 */
    [0, 25, 50, 75, 100].forEach(function (m) {
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

    /* 三區色塊＋區名 */
    r.bands = {}; r.blab = {};
    var self = this;
    ['peak', 'plateau', 'decay'].forEach(function (k) {
      var R = self._REG[k], c = P[R.col];
      r.bands[k] = U.el('rect', { x: X(R.t0), y: PY1, width: X(R.t1) - X(R.t0), height: PY0 - PY1, fill: c, opacity: 0.1 }, svg);
      var g = U.el('g', {}, svg);
      U.bi({ x: (X(R.t0) + X(R.t1)) / 2, y: PY1 + 15, 'font-size': 10.5, 'text-anchor': 'middle', fill: c, 'font-weight': 600 },
        k === 'peak' ? '峰' : (k === 'plateau' ? '平台' : '衰減'), k, g);
      r.blab[k] = g;
    });

    /* 曲線：t≤5 實線、5–7 停轉衰減虛線 */
    var d1 = '', d2 = '', i;
    for (i = 0; i <= 200; i++) { var t1 = i / 200 * 5; d1 += (i ? 'L' : 'M') + X(t1).toFixed(1) + ' ' + Y(this._M(t1)).toFixed(1) + ' '; }
    for (i = 0; i <= 80; i++) { var t2 = 5 + i / 80 * 2; d2 += (i ? 'L' : 'M') + X(t2).toFixed(1) + ' ' + Y(this._M(t2)).toFixed(1) + ' '; }
    U.path(d1, { fill: 'none', stroke: P.acc, 'stroke-width': 2.4 }, svg);
    U.path(d2, { fill: 'none', stroke: P.acc, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg);
    U.el('line', { x1: X(5), y1: PY1, x2: X(5), y2: PY0, stroke: P.mut, 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: 0.7 }, svg);
    U.bi({ x: X(5) + 5, y: PY0 - 8, 'font-size': 9.5, fill: P.mut }, '轉子停', 'rotor off', svg);

    /* 各區焦點標註 */
    r.ann = {};
    var g1 = U.el('g', { opacity: 0 }, svg);
    U.el('circle', { cx: X(1.15), cy: Y(88), r: 5.5, fill: '#fff', stroke: P.rub, 'stroke-width': 2.2 }, g1);
    U.path('M' + X(1.32).toFixed(1) + ' ' + Y(92).toFixed(1) + ' L' + X(1.62).toFixed(1) + ' ' + Y(97).toFixed(1), { stroke: P.rub, 'stroke-width': 1, fill: 'none' }, g1);
    U.bi({ x: X(1.66), y: Y(97) + 4, 'font-size': 11, fill: P.rub, 'font-weight': 700 }, '初期峰 ≈88', 'peak ≈88', g1);
    r.ann.peak = g1;

    var g2 = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(2.4), y1: Y(50), x2: X(4.9), y2: Y(50), stroke: P.ok, 'stroke-width': 1.3, 'stroke-dasharray': '6 4' }, g2);
    U.el('circle', { cx: X(4), cy: Y(50), r: 5, fill: P.ok, stroke: '#fff', 'stroke-width': 1.4 }, g2);
    U.bi({ x: X(4.08), y: Y(62), 'font-size': 11, fill: P.ok, 'font-weight': 700 }, 'ML(1+4) = 50', 'ML(1+4) = 50', g2);
    r.ann.plateau = g2;

    var g3 = U.el('g', { opacity: 0 }, svg);
    U.path('M' + X(5.4).toFixed(1) + ' ' + (Y(this._M(5.4)) - 16).toFixed(1) +
           ' L' + X(6.6).toFixed(1) + ' ' + (Y(this._M(6.6)) - 16).toFixed(1),
      { stroke: P.acc2, 'stroke-width': 1.4, 'stroke-dasharray': '4 3', fill: 'none' }, g3);
    U.el('circle', { cx: X(6), cy: Y(this._M(6)), r: 5, fill: '#fff', stroke: P.acc2, 'stroke-width': 2.2 }, g3);
    U.bi({ x: X(5.45), y: Y(this._M(5.4)) - 24, 'font-size': 11, fill: P.acc2, 'font-weight': 700 }, '衰減快慢', 'decay rate', g3);
    r.ann.decay = g3;

    /* 游標 */
    r.cursor = U.el('g', { opacity: 0 }, svg);
    r.curLine = U.el('line', { x1: PX0, y1: PY1, x2: PX0, y2: PY0, stroke: P.acc, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.5 }, r.cursor);
    r.curDot = U.el('circle', { cx: PX0, cy: PY0, r: 4, fill: P.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);

    return r;
  },

  apply: function (r, ctx) {
    var reg = ctx.params.region, R = this._REG;

    /* 按鈕同步（scrub hover 也會改 region） */
    var cbs = ctx.root.querySelectorAll('.mw-cb');
    for (var j = 0; j < cbs.length; j++) cbs[j].classList.toggle('on', cbs[j].dataset.v === reg);

    for (var k in R) {
      var on = k === reg;
      r.bands[k].setAttribute('opacity', on ? 0.22 : 0.09);
      r.blab[k].setAttribute('opacity', on ? 1 : 0.6);
      r.ann[k].setAttribute('opacity', on ? 1 : 0);
    }

    /* 游標：hover 位置優先，否則錨在所選區代表點 */
    var ct = ctx.params._ht != null ? ctx.params._ht : (R[reg] ? R[reg].at : null);
    if (ct == null) { r.cursor.setAttribute('opacity', 0); return; }
    r.cursor.setAttribute('opacity', 1);
    r.curLine.setAttribute('x1', r.X(ct)); r.curLine.setAttribute('x2', r.X(ct));
    r.curDot.setAttribute('cx', r.X(ct)); r.curDot.setAttribute('cy', r.Y(this._M(ct)));
  },

  readout: function (ctx) {
    var reg = ctx.params.region;
    if (reg === 'peak') return [
      ['峰區（啟動瞬間）', 'Peak zone (startup)'],
      ['峰值扭矩 ≈ <b>88</b> MU', 'Peak torque ≈ <b>88</b> MU'],
      ['→ 生膠強度 · 操作手感', '→ green strength · handling']
    ];
    if (reg === 'decay') return [
      ['衰減區（轉子已停）', 'Decay zone (rotor stopped)'],
      ['鬆弛速率', 'Relaxation rate'],
      ['→ 彈性成分', '→ elastic content']
    ];
    if (reg === 'plateau') return [
      ['平台區（第 4 分鐘讀值）', 'Plateau (minute-4 reading)'],
      ['ML(1+4) = <b>50</b> MU', 'ML(1+4) = <b>50</b> MU'],
      ['→ 加工性 · 難不難推', '→ processability']
    ];
    return [['一段曲線藏三組資訊——滑上去看看', 'One curve, three readings — hover to see']];
  },

  guide: function (ctx) {
    var reg = ctx.params.region;
    if (reg === 'peak') return ['轉子啟動瞬間的最高扭矩——跟生膠強度有關：膠在開煉初期抱不抱得住、好不好操作，看這裡。',
      'The torque spike at rotor startup relates to green strength — how well the rubber holds together in early milling.'];
    if (reg === 'decay') return ['讀完值轉子停止，應力慢慢散——掉得快是黏性、撐住是彈性；同 ML 不同手感的線索在這段。',
      'After the reading the rotor stops and stress drains — fast decay means viscous, holding on means elastic; the clue to “same ML, different feel” lives here.'];
    if (reg === 'plateau') return ['第 4 分鐘的平穩值就是報告上的 ML——它只回答「難不難推」，多數報表也只摘這個數。',
      'The plateau at minute 4 is the reported ML — it only answers “how hard to push”, and most reports quote just this number.'];
    return ['這條曲線的每個區域各藏一組資訊——滑上去或按按鈕看解釋。',
      'Each region of this curve carries its own information — hover or use the buttons.'];
  }
});
