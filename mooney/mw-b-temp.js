/* mw-b-temp.js — 專題 B（fig-topic-b-flow-temp）：GP A 在 80/100/130/150 °C 的流動曲線
   升溫→整線下移、臨界轉速右移；但高轉速端四線收斂同一平台——
   折點的扭矩位準不隨溫度改變（材料微結構的內在性質）。
   曲線為教學近似；關鍵事實（收斂平台、臨界轉速右移）照 figcaption。 */
MW.register('b-temp', {
  vb: [520, 300],
  hint: ['切換溫度看折點怎麼移；滑到圖上比較四線讀值', 'Switch temperature to move the kink; hover to compare the four curves'],

  params: [
    { key: 'temp', type: 'choice', def: '100', zh: '測試溫度', en: 'Test temperature',
      options: [
        { v: '80',  zh: '80 °C',          en: '80 °C' },
        { v: '100', zh: '100 °C（標準）',  en: '100 °C (standard)' },
        { v: '130', zh: '130 °C',         en: '130 °C' },
        { v: '150', zh: '150 °C',         en: '150 °C' }
      ] }
  ],

  scrub: { panel: 0, x0: 50, x1: 508, fn: function (x01, st) { st.params.hx = x01; } },

  _LR0: -1.30103, _LRS: 2.60206,   /* x: log10 0.05–20 rpm */
  _LY0: 1.30103, _LYS: 0.77815,    /* y: log10 20–120 MU */

  /* GP A 四溫度：M0＝0.05rpm 讀值、rc＝臨界轉速（升溫右移）、plat＝破裂位準（不隨溫度變） */
  _temps: [
    { t: 80,  M0: 62, rc: 0.10, plat: 97 },
    { t: 100, M0: 50, rc: 0.22, plat: 97 },
    { t: 130, M0: 36, rc: 0.80, plat: 97 },
    { t: 150, M0: 27, rc: 2.0,  plat: 97 }
  ],

  _m: function (c, rpm) {
    var lr = Math.log(rpm) / Math.LN10, lc = Math.log(c.rc) / Math.LN10;
    var sl = (Math.log(c.plat) / Math.LN10 - Math.log(c.M0) / Math.LN10) / (lc - this._LR0);
    var s = 1 / (1 + Math.exp(-(lr - lc) / 0.11));
    var lp = Math.log(c.plat) / Math.LN10;
    return Math.pow(10, (1 - s) * (lp + sl * (lr - lc)) + s * (lp + 0.006 * (lr - lc)));
  },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {}, self = this;
    var PX0 = 50, PX1 = 508, PY0 = 262, PY1 = 18;
    var X = function (rpm) { return PX0 + ((Math.log(rpm) / Math.LN10 - self._LR0) / self._LRS) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - ((Math.log(m) / Math.LN10 - self._LY0) / self._LYS) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.PX1 = PX1; r.PY0 = PY0; r.PY1 = PY1;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸（雙對數） */
    [20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m === 20 ? 1.4 : 0.8 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20].forEach(function (v) {
      U.el('line', { x1: X(v), y1: PY0, x2: X(v), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(v), y: PY0 + 13, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut }, String(v), svg);
    });
    U.bi({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '轉速 rpm（log）', 'speed rpm (log)', svg);
    U.bi({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '扭矩 MU（log）', 'torque MU (log)', svg);

    /* 高轉速收斂平台帶 */
    U.el('rect', { x: X(2.5), y: Y(103), width: PX1 - X(2.5), height: Y(91) - Y(103), fill: P.rub, opacity: 0.10 }, svg);
    U.bi({ x: X(2.8), y: Y(100.5), 'font-size': 10, fill: P.acc2, 'font-weight': 600 }, '同一破裂位準——不隨溫度變', 'same fracture level — temperature-invariant', svg);

    /* 2 rpm 標準位置（淡） */
    U.el('line', { x1: X(2), y1: PY0, x2: X(2), y2: PY1 - 4, stroke: P.mut, 'stroke-width': 0.9, 'stroke-dasharray': '4 4', opacity: 0.7 }, svg);
    U.bi({ x: X(2), y: PY1 + 2, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut }, '2 rpm', '2 rpm', svg);

    /* 四條溫度線＋左端溫度標＋折點 */
    r.curves = this._temps.map(function () {
      return U.path('', { fill: 'none', 'stroke-width': 1.2 }, svg);
    });
    r.knees = this._temps.map(function () {
      return U.el('circle', { r: 2.5, fill: '#fff', 'stroke-width': 1.6 }, svg);
    });
    r.labs = this._temps.map(function (c) {
      var g = U.el('g', {}, svg);
      U.bi({ x: PX0 + 5, y: Y(c.M0) + 4, 'font-size': 9, 'font-weight': 600 }, c.t + ' °C', c.t + ' °C', g);
      return g;
    });

    /* 所選溫度的臨界轉速標籤（位置隨選擇移動） */
    r.rcLbl = U.el('g', {}, svg);
    r.rcLblZ = U.txt({ 'font-size': 9, fill: P.acc, 'font-weight': 700 }, '', r.rcLbl, 'zh');
    r.rcLblE = U.txt({ 'font-size': 9, fill: P.acc, 'font-weight': 700 }, '', r.rcLbl, 'en');

    /* 游標＋四線讀點 */
    r.cursor = U.el('g', { opacity: 0 }, svg);
    r.curLine = U.el('line', { x1: PX0, y1: PY1, x2: PX0, y2: PY0, stroke: P.ink, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.55 }, r.cursor);
    r.cDots = this._temps.map(function () {
      return U.el('circle', { r: 3.2, stroke: '#fff', 'stroke-width': 1.2 }, r.cursor);
    });
    return r;
  },

  apply: function (r, ctx) {
    var sel = String(ctx.params.temp), self = this, P = MW.PAL;

    this._temps.forEach(function (c, i) {
      var on = String(c.t) === sel;
      var d = '';
      for (var k = 0; k <= 260; k++) {
        var rpm = Math.pow(10, self._LR0 + k / 260 * self._LRS);
        d += (k ? 'L' : 'M') + r.X(rpm).toFixed(1) + ' ' + r.Y(self._m(c, rpm)).toFixed(1) + ' ';
      }
      r.curves[i].setAttribute('d', d);
      r.curves[i].setAttribute('stroke', on ? P.acc : '#b9c4ce');
      r.curves[i].setAttribute('stroke-width', on ? 2.6 : 1.2);
      r.curves[i].setAttribute('opacity', on ? 1 : 0.75);
      r.knees[i].setAttribute('cx', r.X(c.rc)); r.knees[i].setAttribute('cy', r.Y(c.plat));
      r.knees[i].setAttribute('r', on ? 4.5 : 2.5);
      r.knees[i].setAttribute('stroke', on ? P.acc : '#b9c4ce');
      r.labs[i].setAttribute('opacity', on ? 1 : 0.45);
      var te = r.labs[i].querySelectorAll('text');
      for (var q = 0; q < te.length; q++) te[q].setAttribute('fill', on ? P.acc : P.mut);
      /* 游標讀點顏色跟線走 */
      r.cDots[i].setAttribute('fill', on ? P.acc : '#b9c4ce');
      if (on) {
        r.rcLblZ.setAttribute('x', r.X(c.rc)); r.rcLblZ.setAttribute('y', r.Y(c.plat) - 10);
        r.rcLblZ.setAttribute('text-anchor', c.rc > 5 ? 'end' : 'start');
        r.rcLblZ.textContent = '臨界轉速 ≈' + c.rc + ' rpm';
        r.rcLblE.setAttribute('x', r.X(c.rc)); r.rcLblE.setAttribute('y', r.Y(c.plat) - 10);
        r.rcLblE.setAttribute('text-anchor', c.rc > 5 ? 'end' : 'start');
        r.rcLblE.textContent = 'critical speed ≈' + c.rc + ' rpm';
      }
    });

    /* 游標 */
    var hx = ctx.params.hx;
    if (typeof hx === 'number') {
      var rpm = Math.pow(10, self._LR0 + Math.max(0, Math.min(1, hx)) * self._LRS);
      r.curLine.setAttribute('x1', r.X(rpm)); r.curLine.setAttribute('x2', r.X(rpm));
      this._temps.forEach(function (c, i) {
        r.cDots[i].setAttribute('cx', r.X(rpm));
        r.cDots[i].setAttribute('cy', r.Y(self._m(c, rpm)));
      });
      r.cursor.setAttribute('opacity', 1);
    } else {
      r.cursor.setAttribute('opacity', 0);
    }
  },

  readout: function (ctx) {
    var hx = ctx.params.hx, sel = String(ctx.params.temp), self = this, rows = [];
    var cur = this._temps.filter(function (c) { return String(c.t) === sel; })[0];
    if (typeof hx === 'number') {
      var rpm = Math.pow(10, this._LR0 + Math.max(0, Math.min(1, hx)) * this._LRS);
      rows.push(['轉速 ≈ <b>' + (rpm < 1 ? rpm.toFixed(2) : rpm.toFixed(1)) + '</b> rpm',
                 'Speed ≈ <b>' + (rpm < 1 ? rpm.toFixed(2) : rpm.toFixed(1)) + '</b> rpm']);
      var v = this._temps.map(function (c) { return self._m(c, rpm); });
      rows.push(['80→<b>' + v[0].toFixed(0) + '</b> · 100→<b>' + v[1].toFixed(0) + '</b> · 130→<b>' + v[2].toFixed(0) + '</b> · 150→<b>' + v[3].toFixed(0) + '</b> MU',
                 '80→<b>' + v[0].toFixed(0) + '</b> · 100→<b>' + v[1].toFixed(0) + '</b> · 130→<b>' + v[2].toFixed(0) + '</b> · 150→<b>' + v[3].toFixed(0) + '</b> MU']);
      rows.push(rpm < cur.rc ? ['在所選 ' + sel + ' °C 的臨界轉速以下——還是流動', 'Below the critical speed at ' + sel + ' °C — still flowing']
                             : ['過了 ' + sel + ' °C 的折點——四線在這裡量的是同一位準', 'Past the ' + sel + ' °C kink — all four curves read the same level here']);
    } else {
      rows.push(['所選 ' + sel + ' °C · 臨界轉速 ≈<b>' + cur.rc + '</b> rpm', 'Selected ' + sel + ' °C · critical speed ≈<b>' + cur.rc + '</b> rpm']);
      rows.push(['滑到圖上比較四溫度在任一轉速的讀值', 'Hover to compare all four temperatures at any speed']);
    }
    return rows;
  },

  guide: function (ctx) {
    var sel = String(ctx.params.temp);
    if (sel === '80') return ['80 °C：膠冷而硬、整線墊高——才 0.1 rpm 就衝過臨界進破裂支線。', '80 °C: cold and stiff, the whole line sits higher — it crosses the threshold already at 0.1 rpm.'];
    if (sel === '100') return ['100 °C 是標準溫度：臨界轉速 ≈0.2 rpm，所以標準 2 rpm 讀值已在破裂支線上。', '100 °C is the standard test temperature: critical speed ≈0.2 rpm, so the standard 2 rpm reading already sits on the fracture branch.'];
    if (sel === '130') return ['130 °C：線往下移、折點推到 ≈0.8 rpm——但平台的位準一格都沒動。', '130 °C: the line drops and the kink moves to ≈0.8 rpm — yet the plateau level has not moved at all.'];
    return ['150 °C：折點推到 ≈2 rpm 才出現——但高轉速端收斂的 97 MU 位準還是原來那一格。', '150 °C: the kink is pushed all the way to ≈2 rpm — yet the converged 97 MU level at the high end is the very same one.'];
  }
});
