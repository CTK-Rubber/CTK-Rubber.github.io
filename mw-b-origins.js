/* mw-b-origins.js — 專題 B（fig-topic-b-ml-rpm）：各族生膠流動曲線
   RSS3（泰／越）／SIR20C／TSR20／TSR5CV 五族——低速端分得開、標準 2 rpm 處擠成一團；
   連恒黏級 TSR5CV 的折點也在 2 rpm 以下。曲線為教學近似（依原圖各族站位形狀重造）。 */
MW.register('b-origins', {
  vb: [520, 300],
  hint: ['播放後滑到圖上掃轉速，或按族別只亮一族', 'Play, then hover to scan speed — or pick a family to spotlight'],

  stages: [
    { dur: 2.2, zh: ['低速端分得開', '各族生膠的流動曲線從低速端出發——誰軟誰硬，這一段一目了然。'],
             en: ['Apart at low speed', 'The flow curves of each rubber family start at the low-speed end — soft vs stiff is plain to see here.'] },
    { dur: 2.2, zh: ['折點陸續出現', '往高轉速走，各族陸續撞上臨界轉速轉平——連恒黏級 TSR5CV 的折點也在 2 rpm 以下。'],
             en: ['Kinks one after another', 'Climbing in speed, each family hits its critical speed and flattens — even viscosity-stabilized TSR5CV breaks below 2 rpm.'] },
    { dur: 2.4, zh: ['標準讀值點', '2 rpm 豎線就是標準 ML 的讀值位置——低速端分開的五族，在這裡擠成一團。'],
             en: ['The standard reading point', 'The 2 rpm line is where standard ML is read — five families that separate at low speed bunch together here.'] }
  ],

  params: [
    { key: 'fam', type: 'choice', def: 'all', zh: '族別', en: 'Family',
      options: [
        { v: 'all', zh: '全部',          en: 'All' },
        { v: 'f0',  zh: 'RSS3（泰）',     en: 'RSS3 (THA)' },
        { v: 'f1',  zh: 'RSS3（越）',     en: 'RSS3 (VIE)' },
        { v: 'f2',  zh: 'SIR20C（印尼）', en: 'SIR20C (IDN)' },
        { v: 'f3',  zh: 'TSR20（馬）',    en: 'TSR20 (MYS)' },
        { v: 'f4',  zh: 'TSR5CV（恒黏）', en: 'TSR5CV (CV)' }
      ] }
  ],

  scrub: { panel: 0, x0: 50, x1: 508, fn: function (x01, st) { st.params.hx = x01; } },

  _LR0: -1.30103, _LRS: 2.60206,   /* x: log10 0.05–20 rpm */
  _LY0: 1.30103, _LYS: 0.77815,    /* y: log10 20–120 MU */

  /* 五族：M0＝0.05rpm 讀值、rc＝臨界轉速、plat＝高轉速位準 */
  _fams: [
    { zh: 'RSS3（泰）',     en: 'RSS3 (THA)',   col: 'acc',  M0: 62, rc: 0.35, plat: 96 },
    { zh: 'RSS3（越）',     en: 'RSS3 (VIE)',   col: 'acc2', M0: 54, rc: 0.55, plat: 95 },
    { zh: 'SIR20C（印尼）', en: 'SIR20C (IDN)', col: 'ok',   M0: 46, rc: 0.80, plat: 95 },
    { zh: 'TSR20（馬）',    en: 'TSR20 (MYS)',  col: 'rub',  M0: 40, rc: 1.10, plat: 94 },
    { zh: 'TSR5CV（恒黏）', en: 'TSR5CV (CV)',  col: 'ink',  M0: 31, rc: 1.40, plat: 93 }
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

    /* 曲線（clip 揭露） */
    var clip = U.el('clipPath', { id: 'boclip' + U.uid }, svg);
    r.clipRect = U.el('rect', { x: PX0, y: 0, width: 0, height: 300 }, clip);
    r.curves = this._fams.map(function (c) {
      return U.path('', { fill: 'none', stroke: P[c.col], 'stroke-width': 2.4, 'clip-path': 'url(#boclip' + U.uid + ')' }, svg);
    });

    /* 左端族名標籤 */
    r.labs = this._fams.map(function (c, i) {
      var g = U.el('g', { opacity: 0 }, svg);
      U.bi({ x: PX0 + 5, y: Y(c.M0) + (i === 4 ? 11 : 4), 'font-size': 9, fill: P[c.col], 'font-weight': 600 }, c.zh, c.en, g);
      return g;
    });

    /* 各族折點 */
    r.knees = U.el('g', { opacity: 0 }, svg);
    this._fams.forEach(function (c) {
      U.el('circle', { cx: X(c.rc), cy: Y(c.plat), r: 2.8, fill: '#fff', stroke: P[c.col], 'stroke-width': 1.6 }, r.knees);
    });

    /* 2 rpm 標準讀值豎線 */
    r.v2 = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: X(2), y1: PY0, x2: X(2), y2: PY1 - 4, stroke: P.warn, 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }, r.v2);
    U.bi({ x: X(2), y: PY1 + 2, 'font-size': 10, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 700 }, '標準讀值點 2 rpm', 'standard reading point 2 rpm', r.v2);
    r.dots2 = this._fams.map(function (c) {
      return U.el('circle', { r: 3.2, fill: P[c.col], stroke: '#fff', 'stroke-width': 1.1 }, r.v2);
    });

    /* 游標（同 clip） */
    r.cursor = U.el('g', { opacity: 0, 'clip-path': 'url(#boclip' + U.uid + ')' }, svg);
    r.curLine = U.el('line', { x1: PX0, y1: PY1, x2: PX0, y2: PY0, stroke: P.ink, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.55 }, r.cursor);
    r.cDots = this._fams.map(function (c) {
      return U.el('circle', { r: 3.4, fill: P[c.col], stroke: '#fff', 'stroke-width': 1.1 }, r.cursor);
    });
    return r;
  },

  apply: function (r, ctx) {
    var s = ctx.s, sp = ctx.sp, self = this, P = MW.PAL;
    var F = s === 0 ? sp * 0.19 : s === 1 ? 0.19 + sp * 0.44 : 0.63 + sp * 0.37;
    this._F = F;
    r.clipRect.setAttribute('width', Math.max(0, Math.min(1, F)) * (r.PX1 - r.PX0));

    var fam = String(ctx.params.fam);
    this._fams.forEach(function (c, i) {
      var on = fam === 'all' || fam === 'f' + i;
      var d = '';
      for (var k = 0; k <= 260; k++) {
        var rpm = Math.pow(10, self._LR0 + k / 260 * self._LRS);
        d += (k ? 'L' : 'M') + r.X(rpm).toFixed(1) + ' ' + r.Y(self._m(c, rpm)).toFixed(1) + ' ';
      }
      r.curves[i].setAttribute('d', d);
      r.curves[i].setAttribute('stroke-width', on ? 2.6 : 1.3);
      r.curves[i].setAttribute('opacity', on ? 1 : 0.25);
      r.labs[i].setAttribute('opacity', (on ? 1 : 0.25) * Math.min(1, sp * 2));
      r.dots2[i].setAttribute('cx', r.X(2));
      r.dots2[i].setAttribute('cy', r.Y(self._m(c, 2)));
      r.dots2[i].setAttribute('opacity', on ? 1 : 0.25);
    });

    r.knees.setAttribute('opacity', s >= 1 ? Math.min(1, sp * 2) * 0.8 : 0);
    r.v2.setAttribute('opacity', s >= 2 ? Math.min(1, sp * 2.5) : 0);

    /* 游標 */
    var hx = ctx.params.hx;
    if (typeof hx === 'number') {
      var rpm = Math.pow(10, self._LR0 + Math.max(0, Math.min(1, hx)) * self._LRS);
      r.curLine.setAttribute('x1', r.X(rpm)); r.curLine.setAttribute('x2', r.X(rpm));
      this._fams.forEach(function (c, i) {
        var on = fam === 'all' || fam === 'f' + i;
        r.cDots[i].setAttribute('cx', r.X(rpm));
        r.cDots[i].setAttribute('cy', r.Y(self._m(c, rpm)));
        r.cDots[i].setAttribute('opacity', on ? 1 : 0.25);
      });
      r.cursor.setAttribute('opacity', hx <= F + 0.02 ? 1 : 0);
    } else {
      r.cursor.setAttribute('opacity', 0);
    }
  },

  readout: function (ctx) {
    var hx = ctx.params.hx, fam = String(ctx.params.fam), self = this, rows = [];
    if (typeof hx === 'number' && hx <= (this._F || 0) + 0.02) {
      var rpm = Math.pow(10, this._LR0 + Math.max(0, Math.min(1, hx)) * this._LRS);
      rows.push(['轉速 ≈ <b>' + (rpm < 1 ? rpm.toFixed(2) : rpm.toFixed(1)) + '</b> rpm',
                 'Speed ≈ <b>' + (rpm < 1 ? rpm.toFixed(2) : rpm.toFixed(1)) + '</b> rpm']);
      var v = this._fams.map(function (c) { return self._m(c, rpm); });
      if (fam !== 'all') {
        var i = parseInt(fam.slice(1), 10), c = this._fams[i];
        rows.push([c.zh + ' ≈ <b>' + v[i].toFixed(0) + '</b> MU', c.en + ' ≈ <b>' + v[i].toFixed(0) + '</b> MU']);
      } else {
        var hi = Math.max.apply(null, v), lo = Math.min.apply(null, v);
        rows.push(['五族散布 <b>' + lo.toFixed(0) + '–' + hi.toFixed(0) + '</b> MU（Δ≈' + (hi - lo).toFixed(0) + '）',
                   'Five-family spread <b>' + lo.toFixed(0) + '–' + hi.toFixed(0) + '</b> MU (Δ≈' + (hi - lo).toFixed(0) + ')']);
      }
      rows.push(rpm < 0.5 ? ['低速端——各族分得出誰是誰', 'Low-speed end — the families are told apart here']
                : rpm < 2 ? ['接近各自折點——開始收攏', 'Near the kinks — starting to bunch up']
                : ['標準轉速區——擠成一團，分不出高下', 'Standard-speed zone — bunched together, indistinguishable']);
    } else {
      rows.push(['五族生膠流動曲線：低速分開、2 rpm 擠在 93–97', 'Flow curves of five rubber families: apart at low speed, bunched 93–97 at 2 rpm']);
      rows.push(['滑到圖上掃轉速，或按族別只亮一族', 'Hover to scan speed, or pick a family to spotlight']);
    }
    return rows;
  },

  guide: function (ctx) {
    if (ctx.s >= 2) {
      return ['標準 ML 就在這條豎線上讀——各族擠在 93–97、難怪排序對不上 Wallace；要分得開，得降到低速端。', 'Standard ML is read right on this line — the families squeeze into 93–97, no wonder the ranking misses Wallace; to separate them you have to drop to the low-speed end.'];
    }
    return null;
  }
});
