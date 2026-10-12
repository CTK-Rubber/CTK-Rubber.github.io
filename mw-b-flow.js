/* mw-b-flow.js — 專題 B（fig-topic-b-melt-fracture）：雙對數流動曲線三條
   GP A 老化／GP B 老化／GP B 新鮮：低速端分開（30–55 MU）→ 各自折點
   （GP A≈0.2、GP B≈1.5 rpm）→ 高轉速收斂 95–100 平台＝熔體破裂支線；
   標準 2 rpm 讀值處三線擠一團。曲線為教學近似（膝點平滑化），關鍵數字照 figcaption。 */
MW.register('b-flow', {
  vb: [520, 300],
  hint: ['播放看曲線長出來；之後滑到圖上讀任一轉速的三線值', 'Play to grow the curves, then hover to read all three at any speed'],

  stages: [
    { dur: 2.2, zh: ['低速端分開', '雙對數座標上三條曲線從低速端出發——這一段拉得開的，才是各膠真正的粘度差。'],
             en: ['Apart at low speed', 'On log–log axes the three curves start apart — the separation here carries the real viscosity differences.'] },
    { dur: 2.4, zh: ['各自的折點', '升到臨界轉速斜率驟降：GP A 約 0.2 rpm、GP B 約 1.5 rpm——流動在這裡轉成撕裂。'],
             en: ['Each curve’s kink', 'Past a critical speed the slope collapses — GP A near 0.2 rpm, GP B near 1.5 rpm: flow turns to tearing.'] },
    { dur: 2.0, zh: ['收斂的平台', '高轉速端三線收斂到 95–100 MU 的平台——這段是熔體破裂支線，扭矩量的是撕裂位準。'],
             en: ['Converged plateau', 'At high speed all three converge onto a 95–100 MU plateau — the melt-fracture branch, where torque reads the tearing level.'] },
    { dur: 2.4, zh: ['2 rpm 讀值點', '標準 ML(1+4) 在 2 rpm 讀——三線在這裡擠作一團、分不出高下。滑到圖上掃掃看。'],
             en: ['The 2 rpm reading point', 'Standard ML(1+4) is read at 2 rpm — the curves bunch up there. Hover the chart to scan.'] }
  ],

  scrub: { panel: 0, x0: 50, x1: 508, fn: function (x01, st) { st.params.hx = x01; } },

  /* log10 範圍：x 0.05–20 rpm、y 20–120 MU */
  _LR0: -1.30103, _LRS: 2.60206,
  _LY0: 1.30103, _LYS: 0.77815,

  _cs: [
    { zh: 'GP A 老化', en: 'GP A aged',  col: 'acc',  M0: 55, rc: 0.2, plat: 98, dash: '' },
    { zh: 'GP B 老化', en: 'GP B aged',  col: 'acc2', M0: 36, rc: 1.5, plat: 96, dash: '' },
    { zh: 'GP B 新鮮', en: 'GP B fresh', col: 'acc2', M0: 30, rc: 1.5, plat: 95, dash: '5 4' }
  ],

  /* 流動曲線：log–log 上升支線 →（臨界轉速 rc 處 logistic 平滑折點）→ 近乎水平的破裂支線 */
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

    /* 破裂支線平台帶（x>2 處三線已全進平台） */
    r.band = U.el('rect', { x: X(2), y: Y(104), width: PX1 - X(2), height: Y(92) - Y(104), fill: P.rub, opacity: 0 }, svg);
    r.bandLbl = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: X(2.4), y: Y(101.5), 'font-size': 10, fill: P.acc2, 'font-weight': 600 }, '熔體破裂支線 95–100 MU', 'melt-fracture branch, 95–100 MU', r.bandLbl);

    /* 曲線（clip 揭露） */
    var clip = U.el('clipPath', { id: 'bfclip' + U.uid }, svg);
    r.clipRect = U.el('rect', { x: PX0, y: 0, width: 0, height: 300 }, clip);
    r.curves = this._cs.map(function (c) {
      var a = { fill: 'none', stroke: P[c.col], 'stroke-width': 2.4, 'clip-path': 'url(#bfclip' + U.uid + ')' };
      if (c.dash) a['stroke-dasharray'] = c.dash;
      return U.path('', a, svg);
    });

    /* 折點標記 */
    r.knees = U.el('g', { opacity: 0 }, svg);
    this._cs.forEach(function (c) {
      U.el('circle', { cx: X(c.rc), cy: Y(c.plat), r: 4, fill: '#fff', stroke: P[c.col], 'stroke-width': 2 }, r.knees);
    });
    U.bi({ x: X(0.14), y: Y(106), 'font-size': 9, fill: P.acc }, '折點 ≈0.2 rpm', 'kink ≈0.2 rpm', r.knees);
    U.bi({ x: X(1.75), y: Y(89), 'font-size': 9, fill: P.acc2 }, '折點 ≈1.5 rpm', 'kink ≈1.5 rpm', r.knees);

    /* 左端線名 */
    r.labs = this._cs.map(function (c, i) {
      var g = U.el('g', { opacity: 0 }, svg);
      U.bi({ x: PX0 + 5, y: Y(c.M0) + (i === 0 ? -5 : i === 1 ? 3 : 12), 'font-size': 9, fill: P[c.col], 'font-weight': 600 }, c.zh, c.en, g);
      return g;
    });

    /* 2 rpm 標準讀值豎線＋三線擠點 */
    r.v2 = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(2), y1: PY0, x2: X(2), y2: PY1 - 4, stroke: P.warn, 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }, r.v2);
    U.bi({ x: X(2), y: PY1 + 2, 'font-size': 10, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 700 }, '標準讀值點 2 rpm', 'standard reading point 2 rpm', r.v2);
    r.dots2 = this._cs.map(function (c) {
      return U.el('circle', { r: 3.5, fill: P[c.col], stroke: '#fff', 'stroke-width': 1.2 }, r.v2);
    });

    /* 游標（同 clip：未揭露處不顯示） */
    r.cursor = U.el('g', { opacity: 0, 'clip-path': 'url(#bfclip' + U.uid + ')' }, svg);
    r.curLine = U.el('line', { x1: PX0, y1: PY1, x2: PX0, y2: PY0, stroke: P.ink, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.55 }, r.cursor);
    r.cDots = this._cs.map(function (c) {
      return U.el('circle', { r: 3.6, fill: P[c.col], stroke: '#fff', 'stroke-width': 1.2 }, r.cursor);
    });
    return r;
  },

  apply: function (r, ctx) {
    var s = ctx.s, sp = ctx.sp, self = this;
    /* 揭露進度：s0→0.19（~0.15rpm）、s1→0.63（~2.2rpm）、s2→1 */
    var F = s === 0 ? sp * 0.19 : s === 1 ? 0.19 + sp * 0.44 : s === 2 ? 0.63 + sp * 0.37 : 1;
    this._F = F;
    r.clipRect.setAttribute('width', Math.max(0, F * (r.PX1 - r.PX0)));

    this._cs.forEach(function (c, i) {
      var d = '';
      for (var k = 0; k <= 260; k++) {
        var rpm = Math.pow(10, self._LR0 + k / 260 * self._LRS);
        d += (k ? 'L' : 'M') + r.X(rpm).toFixed(1) + ' ' + r.Y(self._m(c, rpm)).toFixed(1) + ' ';
      }
      r.curves[i].setAttribute('d', d);
    });

    r.labs.forEach(function (g) { g.setAttribute('opacity', Math.min(1, sp * 2)); });
    r.knees.setAttribute('opacity', s >= 1 ? Math.min(1, sp * 2) : 0);
    r.band.setAttribute('opacity', s >= 2 ? 0.10 * Math.min(1, sp * 2) : 0);
    r.bandLbl.setAttribute('opacity', s >= 2 ? Math.min(1, sp * 2) : 0);
    r.v2.setAttribute('opacity', s >= 3 ? Math.min(1, sp * 2.5) : 0);
    this._cs.forEach(function (c, i) {
      r.dots2[i].setAttribute('cx', r.X(2));
      r.dots2[i].setAttribute('cy', r.Y(self._m(c, 2)));
    });

    /* 游標 */
    var hx = ctx.params.hx;
    if (typeof hx === 'number') {
      var rpm = Math.pow(10, self._LR0 + Math.max(0, Math.min(1, hx)) * self._LRS);
      r.curLine.setAttribute('x1', r.X(rpm)); r.curLine.setAttribute('x2', r.X(rpm));
      this._cs.forEach(function (c, i) {
        r.cDots[i].setAttribute('cx', r.X(rpm));
        r.cDots[i].setAttribute('cy', r.Y(self._m(c, rpm)));
      });
      r.cursor.setAttribute('opacity', hx <= F + 0.02 ? 1 : 0);
    } else {
      r.cursor.setAttribute('opacity', 0);
    }
  },

  readout: function (ctx) {
    var hx = ctx.params.hx, self = this, rows = [];
    if (typeof hx === 'number' && hx <= (this._F || 0) + 0.02) {
      var rpm = Math.pow(10, this._LR0 + Math.max(0, Math.min(1, hx)) * this._LRS);
      rows.push(['轉速 ≈ <b>' + (rpm < 1 ? rpm.toFixed(2) : rpm.toFixed(1)) + '</b> rpm',
                 'Speed ≈ <b>' + (rpm < 1 ? rpm.toFixed(2) : rpm.toFixed(1)) + '</b> rpm']);
      var v = this._cs.map(function (c) { return self._m(c, rpm); });
      rows.push(['A老 <b>' + v[0].toFixed(0) + '</b> · B老 <b>' + v[1].toFixed(0) + '</b> · B新 <b>' + v[2].toFixed(0) + '</b> MU',
                 'A-aged <b>' + v[0].toFixed(0) + '</b> · B-aged <b>' + v[1].toFixed(0) + '</b> · B-fresh <b>' + v[2].toFixed(0) + '</b> MU']);
      rows.push(rpm < 0.2 ? ['流動區——這一段量的才是真粘度', 'Flow region — this stretch reads real viscosity']
                : rpm < 1.5 ? ['GP A 已進破裂支線、GP B 還在過渡', 'GP A is already fracturing; GP B is still transitioning']
                : ['破裂支線上——扭矩量的是撕裂位準，不是粘度', 'On the fracture branch — torque reads the tearing level, not viscosity']);
    } else {
      rows.push(['三條流動曲線：低速分開 → 高速擠進 95–100 平台', 'Three flow curves: apart at low speed, bunched into the 95–100 plateau']);
      rows.push(['滑到圖上讀任一轉速的三線值', 'Hover the chart to read the three curves at any speed']);
    }
    return rows;
  },

  guide: function (ctx) {
    if (ctx.s >= 3) {
      return ['謎底就在這裡：標準轉速三線幾乎同高——0.05 rpm 處 55/36/30 分得清清楚楚，2 rpm 處全擠在 95 上下。', 'Here is the answer: at the standard speed the three curves sit nearly level — 55/36/30 apart at 0.05 rpm, all near 95 at 2 rpm.'];
    }
    return null;
  }
});
