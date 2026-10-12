/* mw-relaxation.js — §4 應力鬆弛：轉子停後扭矩掉多快＝膠的彈性（雙面板）
   故事：左面板線性座標看衰減快慢，右面板同一段畫到 log–log 上變直線，斜率 a 即鬆弛指數。
   互動：三階段敘事＋「彈性成分」拉桿——拖越快衰越慢（彈性強）、斜率越平。 */
MW.register('relaxation', {
  vb: [[360, 280], [360, 280]],
  hint: ['拖「彈性成分」看衰減快慢與 log–log 斜率怎麼連動', 'Drag the elasticity slider to see decay speed and the log–log slope move together'],

  stages: [
    { dur: 2.4, zh: ['轉子停了', '第 5 分鐘轉子停止，扭矩開始往下掉——掉的快慢就是膠的「彈性」。'],
             en: ['The rotor stops', 'At minute 5 the rotor stops and torque begins to decay — how fast it falls is the rubber’s "elasticity".'] },
    { dur: 2.6, zh: ['快衰 vs 慢衰', '灰影是中間彈性的對照線。拖「彈性成分」拉桿：黏性膠快速掉到底、彈性膠撐著不散。'],
             en: ['Fast vs slow decay', 'The gray shadow is a mid-elasticity reference. Drag the slider: viscous rubber drops fast, elastic rubber holds on.'] },
    { dur: 2.6, zh: ['log–log 上的斜率', '同一段衰減畫到 log–log 座標上變成一條直線——斜率 a 就是鬆弛指數。'],
             en: ['The slope on log–log', 'The same decay plotted on log–log axes becomes a straight line — its slope a is the relaxation index.'] }
  ],

  params: [
    { key: 'elas', type: 'range', min: 0, max: 100, step: 1, def: 50,
      zh: '彈性成分', en: 'Elastic component', fmt: function (v) { return v + ' %'; } }
  ],

  build: function (svgs, U) {
    var P = U.PAL, r = {};
    var svgL = svgs[0], svgR = svgs[1];

    /* ---------- 左面板：線性座標衰減 t 4.5→9 min ---------- */
    var PX0 = 42, PX1 = 348, PY0 = 248, PY1 = 16;
    var X = function (t) { return PX0 + ((t - 4.5) / 4.5) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / 55) * (PY0 - PY1); };
    r.XL = X; r.YL = Y; r.PX0 = PX0;

    U.el('rect', { x: 0, y: 0, width: 360, height: 280, fill: '#fff' }, svgL);
    U.bi({ x: PX0, y: 10, 'font-size': 9, fill: P.mut }, '線性座標', 'linear axes', svgL);

    [0, 10, 20, 30, 40, 50].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m ? 0.8 : 1.4 }, svgL);
      U.txt({ x: PX0 - 5, y: Y(m) + 3, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, String(m), svgL);
    });
    [5, 6, 7, 8, 9].forEach(function (t) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svgL);
      U.txt({ x: X(t), y: PY0 + 13, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut }, String(t), svgL);
    });
    U.el('line', { x1: PX0, y1: PY1 - 4, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svgL);
    U.txt({ x: PX1, y: PY0 + 24, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, 'min', svgL);
    U.txt({ x: PX0 - 5, y: PY1 - 6, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, 'MU', svgL);

    /* 轉子停標線 */
    r.stop = U.el('g', { opacity: 0 }, svgL);
    U.el('line', { x1: X(5), y1: PY1, x2: X(5), y2: PY0, stroke: P.warn, 'stroke-width': 1.1, 'stroke-dasharray': '4 3' }, r.stop);
    U.bi({ x: X(5) + 5, y: PY1 + 12, 'font-size': 9, fill: P.warn, 'font-weight': 600 }, '轉子停', 'rotor stops', r.stop);

    /* 對照影線（固定 λ = 1.5，elas 50） */
    var dRef = '';
    for (var i = 0; i <= 220; i++) {
      var tt = 4.5 + i / 220 * 4.5;
      dRef += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._decay(tt, 1.5)).toFixed(1) + ' ';
    }
    r.ref = U.path(dRef, { fill: 'none', stroke: P.mut, 'stroke-width': 1.6, 'stroke-dasharray': '6 4', opacity: 0 }, svgL);
    r.refLbl = U.el('g', { opacity: 0 }, svgL);
    U.bi({ x: X(8.95), y: Y(this._decay(9, 1.5)) + 14, 'font-size': 9, 'text-anchor': 'end', fill: P.mut },
      '對照：彈性 50%', 'ref: elasticity 50%', r.refLbl);

    /* 主線＋clip 揭露（第 1 段畫入） */
    var clip = U.el('clipPath', { id: 'rxclip' + U.uid }, svgL);
    r.clipRect = U.el('rect', { x: PX0, y: 0, width: 0, height: 280 }, clip);
    r.curve = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.4, 'clip-path': 'url(#rxclip' + U.uid + ')' }, svgL);

    /* ---------- 右面板：log–log 直線 τ 1→240 s ---------- */
    var QX0 = 46, QX1 = 348, QY0 = 248, QY1 = 16;
    var LOG = function (v) { return Math.log(v) / Math.LN10; };
    var X2 = function (tau) { return QX0 + (LOG(tau) / LOG(240)) * (QX1 - QX0); };
    var Y2 = function (m) { return QY0 - ((LOG(m) - LOG(2)) / (LOG(60) - LOG(2))) * (QY0 - QY1); };
    r.X2 = X2; r.Y2 = Y2; r.LOG = LOG; r.QX0 = QX0;

    U.el('rect', { x: 0, y: 0, width: 360, height: 280, fill: '#fff' }, svgR);
    U.bi({ x: QX0, y: 10, 'font-size': 9, fill: P.mut }, 'log–log 座標', 'log–log axes', svgR);

    [5, 10, 20, 50].forEach(function (m) {
      U.el('line', { x1: QX0, y1: Y2(m), x2: QX1, y2: Y2(m), stroke: P.grid, 'stroke-width': 0.8 }, svgR);
      U.txt({ x: QX0 - 5, y: Y2(m) + 3, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, String(m), svgR);
    });
    [1, 10, 100].forEach(function (tau) {
      U.el('line', { x1: X2(tau), y1: QY0, x2: X2(tau), y2: QY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svgR);
      U.txt({ x: X2(tau), y: QY0 + 13, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut }, String(tau), svgR);
    });
    U.el('line', { x1: QX0, y1: QY1 - 4, x2: QX0, y2: QY0, stroke: P.mut, 'stroke-width': 1.2 }, svgR);
    U.bi({ x: QX1, y: QY0 + 24, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, '停後秒數 s', 's after stop', svgR);
    U.txt({ x: QX0 - 5, y: QY1 - 6, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, 'MU', svgR);

    /* 擬合直線＋clip 揭露（第 3 段畫入） */
    var clip2 = U.el('clipPath', { id: 'rxclip2' + U.uid }, svgR);
    r.clipRect2 = U.el('rect', { x: QX0, y: 0, width: 0, height: 280 }, clip2);
    r.line = U.el('line', { stroke: P.acc2, 'stroke-width': 2.4, 'clip-path': 'url(#rxclip2' + U.uid + ')' }, svgR);
    r.aLbl = U.txt({ 'font-size': 10, fill: P.acc2, 'font-weight': 700, opacity: 0 }, '', svgR);

    return r;
  },

  /* 左面板衰減：M = 50·exp(−λ(t−5)·0.8)，t≤5 平在 50 */
  _decay: function (t, lam) {
    if (t <= 5) return 50;
    return 50 * Math.exp(-lam * (t - 5) * 0.8);
  },
  _lam: function (elas) { return 2.5 - elas / 50; },
  _a: function (elas) { return -0.55 + elas * 0.004; },

  apply: function (r, ctx) {
    var s = ctx.s, sp = ctx.sp, elas = ctx.params.elas;
    var lam = this._lam(elas), a = this._a(elas);

    /* 左：第 1 段內畫完衰減曲線 */
    var drawT = s === 0 ? 4.5 + Math.min(1, sp) * 4.5 : 9;
    r.clipRect.setAttribute('width', Math.max(0, r.XL(drawT) - r.PX0));
    var d = '';
    for (var i = 0; i <= 220; i++) {
      var tt = 4.5 + i / 220 * 4.5;
      d += (i ? 'L' : 'M') + r.XL(tt).toFixed(1) + ' ' + r.YL(this._decay(tt, lam)).toFixed(1) + ' ';
    }
    r.curve.setAttribute('d', d);

    /* 轉子停標線＋對照影線 */
    r.stop.setAttribute('opacity', s === 0 ? Math.min(1, sp * 2) : 1);
    var ro = s > 1 ? 0.7 : (s === 1 ? Math.min(1, sp * 2) * 0.7 : 0);
    r.ref.setAttribute('opacity', ro);
    r.refLbl.setAttribute('opacity', ro > 0 ? 1 : 0);

    /* 右：log–log 直線 M = 50·τ^a，第 3 段揭露 */
    var lo = s >= 2 ? Math.min(1, sp * 2) : 0;
    r.clipRect2.setAttribute('width', lo * (348 - r.QX0));
    r.line.setAttribute('x1', r.X2(1)); r.line.setAttribute('y1', r.Y2(50));
    r.line.setAttribute('x2', r.X2(240)); r.line.setAttribute('y2', r.Y2(50 * Math.pow(240, a)));
    r.aLbl.setAttribute('x', r.X2(30)); r.aLbl.setAttribute('y', r.Y2(50 * Math.pow(30, a)) - 10);
    r.aLbl.setAttribute('opacity', lo);
    r.aLbl.textContent = 'a = ' + a.toFixed(2);
  },

  readout: function (ctx) {
    var elas = ctx.params.elas;
    var lam = this._lam(elas), a = this._a(elas);
    var half = Math.LN2 / (lam * 0.8);          /* 衰減半期（min） */
    var halfTxt = half >= 1 ? half.toFixed(1) + ' min' : (half * 60).toFixed(0) + ' s';
    var feel = elas < 34 ? ['偏黏性——掉得快', 'viscous — falls fast']
      : elas > 66 ? ['偏彈性——撐得住', 'elastic — holds on']
      : ['中間彈性', 'mid-elasticity'];
    return [
      ['彈性成分 <b>' + elas + '</b> %', 'Elastic component <b>' + elas + '</b> %'],
      ['衰減半期 ≈ <b>' + halfTxt + '</b>', 'Half-life ≈ <b>' + halfTxt + '</b>'],
      ['a = <b>' + a.toFixed(2) + '</b>（' + feel[0] + '）', 'a = <b>' + a.toFixed(2) + '</b> (' + feel[1] + ')']
    ];
  }
});
