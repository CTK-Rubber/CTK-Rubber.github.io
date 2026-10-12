/* mw-power-law.js — §6 冪次定律 M = k·t^a：log–log 上是一條直線（雙面板）
   故事：k＝停後 1 秒的扭矩、a＝擬合線斜率＝鬆弛指數（ASTM D1646 的做法）。
   互動：拖 k 讓擬合線平移、拖 a 讓它轉動，看線怎麼貼上實測散點（散點 ±3% 固定噪）。 */
MW.register('power-law', {
  vb: [[360, 280], [360, 280]],
  hint: ['拖 k 平移擬合線、拖 a 轉斜率——看線怎麼貼上散點', 'Drag k to shift the fit line and a to rotate it — watch how it meets the data points'],

  params: [
    { key: 'k', type: 'range', min: 20, max: 80, step: 1, def: 50,
      zh: 'k（停後 1 秒的扭矩）', en: 'k (torque 1 s after stop)', fmt: function (v) { return v + ' MU'; } },
    { key: 'a', type: 'range', min: -0.6, max: -0.1, step: 0.01, def: -0.35,
      zh: 'a（鬆弛指數）', en: 'a (relaxation index)', fmt: function (v) { return v.toFixed(2); } }
  ],

  build: function (svgs, U) {
    var P = U.PAL, r = {};
    var svgL = svgs[0], svgR = svgs[1];
    var LOG = function (v) { return Math.log(v) / Math.LN10; };
    r.LOG = LOG;

    /* 固定 seed 的實測散點（±3% 噪聲，繞真值線 k=50、a=−0.35） */
    var seed = 20240817;
    function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
    var scat = [];
    for (var i = 0; i < 12; i++) {
      var ti = 1.3 * Math.pow(55 / 1.3, i / 11);
      scat.push([ti, 50 * Math.pow(ti, -0.35) * (1 + (rnd() * 2 - 1) * 0.03)]);
    }
    this._scat = scat;

    /* ---------- 左面板：衰減曲線（線性 M，log t） ---------- */
    var PX0 = 42, PX1 = 348, PY0 = 248, PY1 = 16;
    var X = function (t) { return PX0 + (LOG(t) / LOG(60)) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / 90) * (PY0 - PY1); };
    r.XL = X; r.YL = Y;

    U.el('rect', { x: 0, y: 0, width: 360, height: 280, fill: '#fff' }, svgL);
    U.bi({ x: PX0, y: 10, 'font-size': 9, fill: P.mut }, '線性 M ／ 對數 t', 'linear M, log t', svgL);

    [0, 20, 40, 60, 80].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m ? 0.8 : 1.4 }, svgL);
      U.txt({ x: PX0 - 5, y: Y(m) + 3, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, String(m), svgL);
    });
    [1, 5, 10, 20, 60].forEach(function (t) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svgL);
      U.txt({ x: X(t), y: PY0 + 13, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut }, String(t), svgL);
    });
    U.el('line', { x1: PX0, y1: PY1 - 4, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svgL);
    U.bi({ x: PX1, y: PY0 + 24, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, '停後秒數 s', 's after stop', svgL);
    U.txt({ x: PX0 - 5, y: PY1 - 6, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, 'MU', svgL);

    /* 左面板也鋪同一批散點（淡），兩邊是同一份資料 */
    scat.forEach(function (pt) {
      U.el('circle', { cx: X(pt[0]), cy: Y(pt[1]), r: 2.4, fill: P.acc, opacity: 0.3 }, svgL);
    });
    r.curve = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.2 }, svgL);

    /* k 標記：停後 1 秒的高度 */
    r.kDot = U.el('circle', { cx: X(1), r: 4.5, fill: P.acc2, stroke: '#fff', 'stroke-width': 1.4 }, svgL);
    r.kTxt = U.txt({ 'font-size': 11, fill: P.acc2, 'font-weight': 700 }, '', svgL);

    /* ---------- 右面板：log–log 直線＋散點 ---------- */
    var QX0 = 46, QX1 = 348, QY0 = 248, QY1 = 16;
    var X2 = function (t) { return QX0 + (LOG(t) / LOG(60)) * (QX1 - QX0); };
    var Y2 = function (m) { return QY0 - (LOG(m) / LOG(100)) * (QY0 - QY1); };
    r.X2 = X2; r.Y2 = Y2;

    U.el('rect', { x: 0, y: 0, width: 360, height: 280, fill: '#fff' }, svgR);
    U.bi({ x: QX0, y: 10, 'font-size': 9, fill: P.mut }, 'log–log 座標', 'log–log axes', svgR);

    [2, 5, 10, 20, 50, 100].forEach(function (m) {
      U.el('line', { x1: QX0, y1: Y2(m), x2: QX1, y2: Y2(m), stroke: P.grid, 'stroke-width': 0.8 }, svgR);
      U.txt({ x: QX0 - 5, y: Y2(m) + 3, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, String(m), svgR);
    });
    [1, 5, 10, 20, 60].forEach(function (t) {
      U.el('line', { x1: X2(t), y1: QY0, x2: X2(t), y2: QY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svgR);
      U.txt({ x: X2(t), y: QY0 + 13, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut }, String(t), svgR);
    });
    U.el('line', { x1: QX0, y1: QY1 - 4, x2: QX0, y2: QY0, stroke: P.mut, 'stroke-width': 1.2 }, svgR);
    U.bi({ x: QX1, y: QY0 + 24, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, '停後秒數 s', 's after stop', svgR);
    U.txt({ x: QX0 - 5, y: QY1 - 6, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, 'MU', svgR);

    /* 實測散點（固定不動） */
    scat.forEach(function (pt) {
      U.el('circle', { cx: X2(pt[0]), cy: Y2(pt[1]), r: 3, fill: P.acc, opacity: 0.85 }, svgR);
    });
    /* 擬合直線（隨 k、a 動） */
    r.fit = U.el('line', { stroke: P.acc2, 'stroke-width': 2.2, 'stroke-dasharray': '7 4' }, svgR);
    r.aLbl = U.txt({ 'font-size': 10, fill: P.acc2, 'font-weight': 700 }, '', svgR);
    U.bi({ x: QX1, y: QY1 + 2, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, '虛線＝冪次定律擬合', 'dashed = power-law fit', svgR);

    return r;
  },

  _M: function (t, k, a) { return k * Math.pow(t, a); },

  apply: function (r, ctx) {
    var k = ctx.params.k, a = ctx.params.a;

    /* 左：衰減曲線重畫＋k 錨點 */
    var d = '';
    for (var i = 0; i <= 200; i++) {
      var tt = Math.pow(60, i / 200);          /* log 等分 t∈[1,60] */
      d += (i ? 'L' : 'M') + r.XL(tt).toFixed(1) + ' ' + r.YL(this._M(tt, k, a)).toFixed(1) + ' ';
    }
    r.curve.setAttribute('d', d);
    r.kDot.setAttribute('cy', r.YL(k));
    r.kTxt.setAttribute('x', r.XL(1) + 9); r.kTxt.setAttribute('y', r.YL(k) - 9);
    r.kTxt.textContent = 'k = ' + k;

    /* 右：擬合線＋a 標籤跟著線走 */
    r.fit.setAttribute('x1', r.X2(1)); r.fit.setAttribute('y1', r.Y2(k));
    r.fit.setAttribute('x2', r.X2(60)); r.fit.setAttribute('y2', r.Y2(this._M(60, k, a)));
    var midM = this._M(22, k, a);
    r.aLbl.setAttribute('x', r.X2(22)); r.aLbl.setAttribute('y', r.Y2(midM) - 8);
    r.aLbl.textContent = 'a = ' + a.toFixed(2);
  },

  readout: function (ctx) {
    var k = ctx.params.k, a = ctx.params.a, scat = this._scat;
    /* R²：log 空間裡的殘差平方和 */
    var LOG = function (v) { return Math.log(v) / Math.LN10; };
    var mean = 0, i, ly;
    for (i = 0; i < scat.length; i++) mean += LOG(scat[i][1]);
    mean /= scat.length;
    var ssRes = 0, ssTot = 0;
    for (i = 0; i < scat.length; i++) {
      ly = LOG(scat[i][1]);
      ssTot += (ly - mean) * (ly - mean);
      var res = ly - LOG(this._M(scat[i][0], k, a));
      ssRes += res * res;
    }
    var r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
    var tag = r2 >= 0.98 ? ['貼合良好', 'close fit'] : r2 >= 0.9 ? ['尚可', 'fair'] : ['明顯偏離', 'poor fit'];
    return [
      ['k = <b>' + k + '</b> MU', 'k = <b>' + k + '</b> MU'],
      ['a = <b>' + a.toFixed(2) + '</b>', 'a = <b>' + a.toFixed(2) + '</b>'],
      ['R² ≈ <b>' + r2.toFixed(3) + '</b>（' + tag[0] + '）', 'R² ≈ <b>' + r2.toFixed(3) + '</b> (' + tag[1] + ')']
    ];
  }
});
