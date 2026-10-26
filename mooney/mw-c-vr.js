/* mw-c-vr.js — 專題 C：VR 流動曲線轉速掃描（fig-topic-c-vr-mono / vr-blends / vr-industrial / mvs）
   教什麼：2 rpm 端各曲線擠在一起（mvs/industrial 還全落在 57–63 合格帶），
   掃到 0.05 rpm 才拉開——低速端對應 Mw、高速端對應 Mn。
   掛 4 處：data-arg = mono / blends / industrial / mvs。
   數據：Kim et al. 2010 Table 1 原值（[族, 樣品, Mn, Mw, VR2, VR0.2, VR0.05]）。 */
MW.register('c-vr', {
  vb: [520, 300],
  hint: ['滑到圖上掃轉速，或拖下面拉桿——往左掃到 0.05 rpm 看分離', 'Hover to sweep rotor speed (or drag the slider) — sweep left to 0.05 rpm to see the split'],

  /* [族, 樣品, Mn, Mw, VR2, VR0.2, VR0.05] — Table 1 原值 */
  _S: [
    ['mono', '5CV60-1', 480, 1450, 55, 41, 29], ['mono', '5CV60-2', 500, 1380, 60, 44, 31],
    ['mono', '5CV60-3', 520, 1380, 62, 43, 31], ['mono', '5CV60-4', 520, 1430, 60, 45, 30],
    ['mono', '5CV-1', 710, 1340, 73, 46, 29], ['mono', '5CV-2', 710, 1470, 79, 60, 39],
    ['mono', '5CV-3', 770, 1440, 78, 59, 40], ['mono', '5CV-4', 730, 1540, 75, 58, 40],
    ['blend', 'PB217 20%', 570, 1420, 65, 46, 32], ['blend', 'PB217 40%', 610, 1430, 70, 54, 37],
    ['blend', 'PB217 60%', 600, 1380, 70, 52, 35], ['blend', 'PB217 80%', 700, 1480, 76, 60, 41],
    ['blend', 'RRIC101 20%', 610, 1430, 63, 47, 34], ['blend', 'RRIC101 80%', 710, 1560, 69, 55, 36],
    ['blend', 'PB235 60%', 554, 1280, 65, 47, 30],
    ['peptized', 'P-1', 480, 910, 61, 33, 20], ['peptized', 'P-2', 520, 960, 61, 31, 19],
    ['peptized', 'P-3', 490, 840, 60, 29, 18],
    ['industrial', 'IA', 505, 1581, 57, 46, 33], ['industrial', 'IB', 450, 920, 63, 37, 22],
    ['industrial', 'IC', 400, 870, 59, 32, 19]
  ],

  stages: [
    { dur: 2.6, zh: ['先看標準轉速', '標準測試在 2 rpm 讀值——注意這一端的讀值擠得多近。'],
             en: ['Start at standard speed', 'The standard test reads at 2 rpm — notice how tightly the readings bunch at this end.'] },
    { dur: 4.0, zh: ['往低速掃', '掃描線往左降到 0.05 rpm——同一批樣品在低速端拉開了。'],
             en: ['Sweep down', 'The scan line slides left toward 0.05 rpm — the same samples separate at the low-speed end.'] },
    { dur: 2.0, zh: ['換你掃', '滑到圖上或拖下面拉桿，自己掃一遍——2 rpm 分不出的，0.05 rpm 分得出。'],
             en: ['Your turn', 'Hover the chart or drag the slider to sweep yourself — what 2 rpm cannot tell apart, 0.05 rpm can.'] }
  ],

  params: [
    { key: 'lrpm', type: 'range', min: -1.30, max: 0.31, step: 0.01, def: 0.31,
      zh: '掃描轉速', en: 'Scan speed',
      fmt: function (v) { var r = Math.pow(10, v); return (r < 0.1 ? r.toFixed(2) : (r < 1 ? r.toFixed(1) : r.toFixed(0))) + ' rpm'; },
      onSet: function (st) { st.params._manual = 1; } }
  ],

  scrub: { panel: 0, x0: 116.7, x1: 464, fn: function (x01, st) {
    st.params._manual = 1;
    st.params.lrpm = -1.30 + x01 * 1.61;
  } },

  /* arg → 樣品子集：[名, VR2, VR0.2, VR0.05, 色]；色：P.acc/acc2/ok/rub/warn */
  _data: function (arg, PAL) {
    var S = this._S, out = [], i, s;
    function pick(f, f2) {
      var o = [];
      for (var i = 0; i < S.length; i++) if (S[i][0] === f || S[i][0] === f2) o.push(S[i]);
      return o;
    }
    if (arg === 'blends') {
      var bs = pick('blend');
      for (i = 0; i < bs.length; i++) {
        s = bs[i];
        var c = s[1].indexOf('PB217') === 0 ? PAL.acc2 : (s[1].indexOf('RRIC101') === 0 ? PAL.ok : PAL.rub);
        out.push([s[1], s[4], s[5], s[6], c]);
      }
      return { items: out, band: false };
    }
    if (arg === 'industrial') {
      var is = pick('industrial'), cs = [PAL.acc, PAL.acc2, PAL.warn];
      for (i = 0; i < is.length; i++) out.push([is[i][1], is[i][4], is[i][5], is[i][6], cs[i]]);
      return { items: out, band: true };
    }
    if (arg === 'mvs') {
      var names = { '5CV60-2': 1, 'RRIC101 20%': 1, 'IA': 1, 'P-1': 1, 'IC': 1 };
      var hi = { '5CV60-2': 1, 'RRIC101 20%': 1, 'IA': 1 };
      for (i = 0; i < S.length; i++) {
        s = S[i];
        if (names[s[1]]) out.push([s[1], s[4], s[5], s[6], hi[s[1]] ? PAL.acc : PAL.warn]);
      }
      return { items: out, band: true };
    }
    /* mono（預設）：單株 8 樣品，F1/F2 兩色系 */
    var ms = pick('mono');
    for (i = 0; i < ms.length; i++) {
      s = ms[i];
      out.push([s[1], s[4], s[5], s[6], s[1].indexOf('5CV60') === 0 ? PAL.acc : PAL.acc2]);
    }
    return { items: out, band: false };
  },

  /* 在 log10 rpm 座標上三點折線內插 */
  _vr: function (it, lr) {
    var v2 = it[1], v02 = it[2], v005 = it[3];
    if (lr >= 0.301) return v2;
    if (lr <= -1.301) return v005;
    if (lr >= -0.699) { var t = (lr + 0.699) / 1.0; return v02 + (v2 - v02) * t; }
    var t2 = (lr + 1.301) / 0.602; return v005 + (v02 - v005) * t2;
  },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 52, PX1 = 505, PY0 = 255, PY1 = 20;
    var L0 = -1.6, L1 = 0.5;             /* log10 rpm：0.025 → 3.2 */
    var V1 = 85;
    var X = function (lr) { return PX0 + (lr - L0) / (L1 - L0) * (PX1 - PX0); };
    var Y = function (v) { return PY0 - v / V1 * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.PX1 = PX1; r.PY0 = PY0; r.PY1 = PY1;

    var ds = this._data(U.arg, P);
    r.items = ds.items; r.band = ds.band; r.arg = U.arg;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 合格帶（mvs / industrial） */
    if (ds.band) {
      U.el('rect', { x: PX0, y: Y(65), width: PX1 - PX0, height: Y(55) - Y(65), fill: P.ok, opacity: 0.13 }, svg);
      U.bi({ x: PX1 - 4, y: Y(65) - 5, 'font-size': 10, 'text-anchor': 'end', fill: P.ok, 'font-weight': 600 },
        '60±5 合格帶', '60±5 spec band', svg);
    }

    /* 網格＋軸 */
    [0, 20, 40, 60, 80].forEach(function (v) {
      U.el('line', { x1: PX0, y1: Y(v), x2: PX1, y2: Y(v), stroke: P.grid, 'stroke-width': v ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(v) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(v), svg);
    });
    [[0.05, '0.05'], [0.2, '0.2'], [0.5, '0.5'], [1, '1'], [2, '2']].forEach(function (tk) {
      var lx = X(Math.log(tk[0]) / Math.LN10);
      U.el('line', { x1: lx, y1: PY0, x2: lx, y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: lx, y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, tk[1], svg);
    });
    U.el('line', { x1: PX0, y1: PY1 - 4, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.bi({ x: PX1, y: PY0 + 28, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '轉速 rpm（對數）', 'rotor speed rpm (log)', svg);
    U.bi({ x: PX0 - 4, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'VR (MU)', 'VR (MU)', svg);

    /* 三實測點連線（虛線＝點間內插，原圖慣例）＋點 */
    var XS = [-1.301, -0.699, 0.301];
    r.curves = []; r.dots = [];
    ds.items.forEach(function (it) {
      var d = 'M' + X(XS[0]).toFixed(1) + ' ' + Y(it[3]).toFixed(1) +
              ' L' + X(XS[1]).toFixed(1) + ' ' + Y(it[2]).toFixed(1) +
              ' L' + X(XS[2]).toFixed(1) + ' ' + Y(it[1]).toFixed(1);
      U.path(d, { fill: 'none', stroke: it[4], 'stroke-width': 1.6, 'stroke-dasharray': '5 4', opacity: 0.85 }, svg);
      XS.forEach(function (lx, j) {
        U.el('circle', { cx: X(lx), cy: Y(it[3 - j]), r: 3.4, fill: it[4], stroke: '#fff', 'stroke-width': 1.2 }, svg);
      });
    });

    /* 左端（0.05 rpm）樣品名標籤：依 VR0.05 排序、均勻錯開不蓋字 */
    var sorted = ds.items.slice().sort(function (a, b) { return b[3] - a[3]; });
    var lx0 = X(-1.301);
    var yTop = Y(sorted[0][3]), yBot = Y(sorted[sorted.length - 1][3]);
    if (yBot - yTop < (sorted.length - 1) * 10) {
      var mid = (yTop + yBot) / 2, half = (sorted.length - 1) * 10 / 2;
      yTop = Math.max(PY1 + 8, mid - half); yBot = Math.min(PY0 - 4, mid + half);
    }
    r.labels = [];
    for (var i = 0; i < sorted.length; i++) {
      var yy = sorted.length > 1 ? yTop + i * (yBot - yTop) / (sorted.length - 1) : (yTop + yBot) / 2;
      r.labels.push(U.txt({ x: lx0 - 6, y: yy + 3, 'font-size': 8.5, 'text-anchor': 'end', fill: sorted[i][4] }, sorted[i][1], svg));
    }

    /* 掃描線＋掃描點 */
    r.scan = U.el('g', {}, svg);
    r.sline = U.el('line', { x1: X(0.301), y1: PY1, x2: X(0.301), y2: PY0, stroke: P.ink, 'stroke-width': 1.1, 'stroke-dasharray': '3 3', opacity: 0.6 }, r.scan);
    r.sdots = ds.items.map(function (it) {
      return U.el('circle', { r: 4, fill: it[4], stroke: '#fff', 'stroke-width': 1.5 }, r.scan);
    });
    /* 範圍括弧（右緣） */
    r.brk = U.el('g', {}, r.scan);
    r.brkL = U.el('line', { x1: PX1 - 8, x2: PX1 - 8, y1: 0, y2: 0, stroke: P.warn, 'stroke-width': 1.6 }, r.brk);
    r.brkT1 = U.el('line', { x1: PX1 - 12, x2: PX1 - 4, y1: 0, y2: 0, stroke: P.warn, 'stroke-width': 1.6 }, r.brk);
    r.brkT2 = U.el('line', { x1: PX1 - 12, x2: PX1 - 4, y1: 0, y2: 0, stroke: P.warn, 'stroke-width': 1.6 }, r.brk);
    r.brkTxt = U.txt({ x: PX1 - 16, y: 0, 'font-size': 10, 'text-anchor': 'end', fill: P.warn, 'font-weight': 700 }, '', r.brk);

    /* 轉速大字（跟著掃描線） */
    r.rpmT = [U.txt({ 'font-size': 12, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 }, '', svg, 'zh'),
              U.txt({ 'font-size': 12, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 }, '', svg, 'en')];

    return r;
  },

  apply: function (r, ctx) {
    var X = r.X, Y = r.Y;
    /* 手動（scrub / 拉桿動過）優先；否則第 2 段自動掃 2 → 0.05 */
    var lr;
    if (ctx.params._manual) lr = ctx.params.lrpm;
    else lr = ctx.s >= 1 ? 0.301 - Math.min(1, ctx.sp) * 1.602 : 0.301;
    lr = Math.max(-1.301, Math.min(0.301, lr));
    r._lr = lr;

    var sx = X(lr);
    r.sline.setAttribute('x1', sx); r.sline.setAttribute('x2', sx);

    var mn = 1e9, mx = -1e9;
    for (var i = 0; i < r.items.length; i++) {
      var v = this._vr(r.items[i], lr);
      r.sdots[i].setAttribute('cx', sx); r.sdots[i].setAttribute('cy', Y(v));
      if (v < mn) mn = v; if (v > mx) mx = v;
    }
    r.brkL.setAttribute('y1', Y(mn)); r.brkL.setAttribute('y2', Y(mx));
    r.brkT1.setAttribute('y1', Y(mn)); r.brkT1.setAttribute('y2', Y(mn));
    r.brkT2.setAttribute('y1', Y(mx)); r.brkT2.setAttribute('y2', Y(mx));
    r.brkTxt.setAttribute('y', (Y(mn) + Y(mx)) / 2 + 3);
    r.brkTxt.textContent = 'Δ' + Math.round(mx - mn);

    var rpm = Math.pow(10, lr);
    var rs = rpm < 0.1 ? rpm.toFixed(2) : rpm.toFixed(1);
    r.rpmT[0].textContent = rs + ' rpm'; r.rpmT[1].textContent = rs + ' rpm';
    var tx = Math.max(r.PX0 + 26, Math.min(r.PX1 - 30, sx));
    r.rpmT[0].setAttribute('x', tx); r.rpmT[1].setAttribute('x', tx);
    r.rpmT[0].setAttribute('y', r.PY1 + 8); r.rpmT[1].setAttribute('y', r.PY1 + 8);
  },

  readout: function (ctx) {
    var lr = ctx.params._manual ? ctx.params.lrpm
      : (ctx.s >= 1 ? 0.301 - Math.min(1, ctx.sp) * 1.602 : 0.301);
    lr = Math.max(-1.301, Math.min(0.301, lr));
    var items = this._data(ctx.arg, MW.PAL).items;
    var rpm = Math.pow(10, lr), rs = rpm < 0.1 ? rpm.toFixed(2) : (rpm < 1 ? rpm.toFixed(1) : rpm.toFixed(0));
    var mn = 1e9, mx = -1e9, self = this;
    items.forEach(function (it) { var v = self._vr(it, lr); if (v < mn) mn = v; if (v > mx) mx = v; });
    var d = Math.round(mx - mn);
    var verdict;
    if (d <= 10) verdict = ['差距 ' + d + ' MU——這轉速分不出', 'spread ' + d + ' MU — indistinguishable here'];
    else verdict = ['差距 ' + d + ' MU——這轉速分得出', 'spread ' + d + ' MU — separable here'];
    return [
      ['掃描轉速 <b>' + rs + ' rpm</b>', 'Scan speed <b>' + rs + ' rpm</b>'],
      ['讀值範圍 <b>' + Math.round(mn) + '–' + Math.round(mx) + '</b> MU', 'Readings <b>' + Math.round(mn) + '–' + Math.round(mx) + '</b> MU'],
      verdict
    ];
  },

  guide: function (ctx) {
    if (!ctx.params._manual && ctx.s < 2) return null;   /* 播放中沿用階段文案 */
    var lr = ctx.params._manual ? ctx.params.lrpm : (ctx.s >= 1 ? 0.301 - Math.min(1, ctx.sp) * 1.602 : 0.301);
    var band = (ctx.arg === 'mvs' || ctx.arg === 'industrial');
    if (lr > -0.3) {
      return band
        ? ['2 rpm 端：讀值全擠在合格帶裡——高速端響應由短鏈與失效臨界主導，對 Mn 敏感、對長鏈不敏感。', 'At 2 rpm every reading sits inside the spec band — the high-speed response is ruled by short chains and failure threshold, sensitive to Mn but blind to long chains.']
        : ['2 rpm 端：各族擠成一團——高速端響應由短鏈與失效臨界主導，對 Mn 敏感。', 'At 2 rpm the curves bunch together — the high-speed response is ruled by short chains and failure threshold, sensitive to Mn.'];
    }
    if (lr > -1.0) return ['0.2 rpm 是過渡區：兩種機制混著來，差距開始展開。', '0.2 rpm is the transition zone — both mechanisms mix and the gap starts to open.'];
    return ['0.05 rpm：扭矩主要由最長的那批鏈扛——對 Mw 敏感，同規格膠在這裡才分得出。', 'At 0.05 rpm the longest chains carry the torque — sensitive to Mw; same-spec rubbers finally separate here.'];
  }
});
