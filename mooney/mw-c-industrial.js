/* mw-c-industrial.js — 專題 C：IA/IB/IC 工業 TSR5CV60 色譜＋VR 讀值（fig-topic-c-sec-industrial）
   教什麼：規格同級（VR2 全在 60±5）、分布不同型——IA 雙峰肩＋長鏈尾（VR0.05=33），
   IB/IC 近單峰短尾（VR0.05=22/19）。規格上看不出的差異，結構＋低速端一目了然。
   色譜為教學近似；Mn/Mw/VR 為 Table 1 原值。 */
MW.register('c-industrial', {
  vb: [560, 300],
  hint: ['按鈕選一個樣品，對照看它的色譜與讀值', 'Pick a sample — compare its chromatogram and readings'],

  params: [
    { key: 'samp', type: 'choice', def: 'IA', zh: '樣品', en: 'Sample',
      options: [
        { v: 'IA', zh: 'IA', en: 'IA' },
        { v: 'IB', zh: 'IB', en: 'IB' },
        { v: 'IC', zh: 'IC', en: 'IC' }
      ] }
  ],

  /* 真值（Table 1）：名, Mn, Mw, VR2, VR0.2, VR0.05, 色鍵, 峰形(教學近似) */
  _D: {
    IA: { mn: 505, mw: 1581, v2: 57, v02: 46, v005: 33, c: 0, pk: [[2.65, 0.38, 0.05], [3.02, 0.95, 0.10], [3.48, 0.30, 0.10]], tag: ['雙峰肩＋長鏈尾', 'bimodal shoulder + long-chain tail'] },
    IB: { mn: 450, mw: 920,  v2: 63, v02: 37, v005: 22, c: 1, pk: [[2.90, 1.0, 0.095]], tag: ['近單峰、尾巴短', 'near-unimodal, short tail'] },
    IC: { mn: 400, mw: 870,  v2: 59, v02: 32, v005: 19, c: 2, pk: [[2.86, 1.0, 0.09]], tag: ['近單峰、尾巴更短', 'near-unimodal, even shorter tail'] }
  },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    r.cs = [P.acc, P.acc2, P.warn];
    var PX0 = 46, PX1 = 336, PY0 = 250, PY1 = 30;
    var L0 = 2.30, L1 = 3.60;
    var X = function (m) { return PX0 + (Math.log(m) / Math.LN10 - L0) / (L1 - L0) * (PX1 - PX0); };
    var Y = function (v) { return PY0 - v / 1.15 * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.L0 = L0; r.L1 = L1;

    U.el('rect', { x: 0, y: 0, width: 560, height: 300, fill: '#fff' }, svg);

    /* 左：色譜軸 */
    [0, 0.5, 1].forEach(function (v) {
      U.el('line', { x1: PX0, y1: Y(v), x2: PX1, y2: Y(v), stroke: P.grid, 'stroke-width': v ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(v) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, v ? String(v) : '0', svg);
    });
    [300, 500, 1000, 2000, 3000].forEach(function (m) {
      U.el('line', { x1: X(m), y1: PY0, x2: X(m), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(m), y: PY0 + 13, 'font-size': 9.5, 'text-anchor': 'middle', fill: P.mut }, String(m), svg);
    });
    U.el('line', { x1: PX0, y1: PY1 - 4, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.bi({ x: PX1, y: PY0 + 26, 'font-size': 9.5, 'text-anchor': 'end', fill: P.mut }, '分子量 kg/mol（對數）', 'MW kg/mol (log)', svg);

    /* 分隔線 */
    U.el('line', { x1: 352, y1: PY1 - 6, x2: 352, y2: PY0, stroke: P.grid, 'stroke-width': 1 }, svg);

    /* 三條色譜 */
    var self = this;
    r.curves = {};
    ['IA', 'IB', 'IC'].forEach(function (k) {
      var d = '', i, n = 240;
      for (i = 0; i <= n; i++) {
        var L = L0 + i / n * (L1 - L0), v = 0;
        for (var j = 0; j < self._D[k].pk.length; j++) {
          var pk = self._D[k].pk[j], z = (L - pk[0]) / pk[2];
          v += pk[1] * Math.exp(-z * z / 2);
        }
        d += (i ? 'L' : 'M') + X(Math.pow(10, L)).toFixed(1) + ' ' + Y(v).toFixed(1) + ' ';
      }
      r.curves[k] = U.path(d, { fill: 'none', stroke: r.cs[self._D[k].c], 'stroke-width': 1.8, opacity: 0.4 }, svg);
      /* 名標在峰頂 */
      var pkL = self._D[k].pk[self._D[k].pk.length > 1 ? 1 : 0][0];
      var t = U.txt({ x: X(Math.pow(10, pkL)), y: Y(1.08), 'font-size': 10, 'text-anchor': 'middle', fill: r.cs[self._D[k].c], 'font-weight': 700, opacity: 0.7 }, k, svg);
      r.curves[k]._nm = t;
    });

    /* 選中樣品的 Mn/Mw 標線 */
    r.mnL = U.el('line', { y1: PY1, y2: PY0, stroke: P.acc2, 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }, svg);
    r.mwL = U.el('line', { y1: PY1, y2: PY0, stroke: P.ok, 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }, svg);
    r.mnT = [U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 700 }, '', svg, 'zh'),
             U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 700 }, '', svg, 'en')];
    r.mwT = [U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.ok, 'font-weight': 700 }, '', svg, 'zh'),
             U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.ok, 'font-weight': 700 }, '', svg, 'en')];

    /* 右：兩組 VR 長條（共用 0–70 刻度） */
    var BX0 = 372, BW = 62, BY0 = PY0, V1 = 70;
    var BY = function (v) { return BY0 - v / V1 * (BY0 - PY1 - 10); };
    r.BY = BY;
    /* 合格帶（只跨 VR2 組） */
    var cx0 = BX0, cx1 = BX0 + BW;
    U.el('rect', { x: cx0, y: BY(65), width: BW, height: BY(55) - BY(65), fill: P.ok, opacity: 0.16 }, svg);
    U.bi({ x: (cx0 + cx1) / 2, y: BY(65) - 4, 'font-size': 9, 'text-anchor': 'middle', fill: P.ok, 'font-weight': 600 }, '60±5', '60±5', svg);
    U.el('line', { x1: BX0 - 6, y1: BY0, x2: BX0 - 6, y2: PY1 - 4, stroke: P.mut, 'stroke-width': 1 }, svg);
    [0, 35, 70].forEach(function (v) {
      U.el('line', { x1: BX0 - 10, y1: BY(v), x2: BX0 - 6, y2: BY(v), stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: BX0 - 12, y: BY(v) + 3, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, String(v), svg);
    });

    /* 兩組 bar：VR2 / VR0.05 */
    r.bars = {}; r.barT = {};
    var groups = [['v2', BX0], ['v005', BX0 + 96]];
    groups.forEach(function (gp) {
      var gx = gp[1];
      ['IA', 'IB', 'IC'].forEach(function (k, i) {
        var bx = gx + 4 + i * 19;
        var b = U.el('rect', { x: bx, width: 15, fill: r.cs[self._D[k].c], opacity: 0.45 }, svg);
        var t = U.txt({ x: bx + 7.5, 'font-size': 9, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700, opacity: 0.45 }, '', svg);
        (r.bars[k] = r.bars[k] || {})[gp[0]] = b;
        (r.barT[k] = r.barT[k] || {})[gp[0]] = t;
      });
      U.bi({ x: gx + BW / 2, y: BY0 + 16, 'font-size': 9.5, 'text-anchor': 'middle', fill: P.mut },
        gp[0] === 'v2' ? 'VR2' : 'VR0.05', gp[0] === 'v2' ? 'VR2' : 'VR0.05', svg);
    });
    U.bi({ x: BX0 + 70, y: PY1 - 12, 'font-size': 10, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 },
      'VR 讀值（MU）', 'VR readings (MU)', svg);

    return r;
  },

  apply: function (r, ctx) {
    var sel = ctx.params.samp in this._D ? ctx.params.samp : 'IA';
    var d = this._D[sel], X = r.X, BY = r.BY;

    /* 色譜亮滅＋標線 */
    var self = this;
    ['IA', 'IB', 'IC'].forEach(function (k) {
      var on = k === sel;
      r.curves[k].setAttribute('opacity', on ? 1 : 0.3);
      r.curves[k].setAttribute('stroke-width', on ? 2.4 : 1.4);
      r.curves[k]._nm.setAttribute('opacity', on ? 1 : 0.4);
    });
    r.mnL.setAttribute('x1', X(d.mn)); r.mnL.setAttribute('x2', X(d.mn));
    r.mwL.setAttribute('x1', X(d.mw)); r.mwL.setAttribute('x2', X(d.mw));
    r.mnT[0].textContent = 'Mn=' + d.mn; r.mnT[1].textContent = 'Mn=' + d.mn;
    r.mwT[0].textContent = 'Mw=' + d.mw; r.mwT[1].textContent = 'Mw=' + d.mw;
    r.mnT[0].setAttribute('x', X(d.mn)); r.mnT[1].setAttribute('x', X(d.mn));
    r.mwT[0].setAttribute('x', X(d.mw)); r.mwT[1].setAttribute('x', X(d.mw));
    r.mnT[0].setAttribute('y', 236); r.mnT[1].setAttribute('y', 236);
    r.mwT[0].setAttribute('y', 236); r.mwT[1].setAttribute('y', 236);

    /* 長條 */
    ['IA', 'IB', 'IC'].forEach(function (k) {
      var dd = self._D[k], on = k === sel;
      var b2 = r.bars[k].v2, b5 = r.bars[k].v005;
      b2.setAttribute('y', BY(dd.v2)); b2.setAttribute('height', BY(0) - BY(dd.v2));
      b5.setAttribute('y', BY(dd.v005)); b5.setAttribute('height', BY(0) - BY(dd.v005));
      b2.setAttribute('opacity', on ? 1 : 0.35);
      b5.setAttribute('opacity', on ? 1 : 0.35);
      var t2 = r.barT[k].v2, t5 = r.barT[k].v005;
      t2.setAttribute('y', BY(dd.v2) - 3); t2.textContent = dd.v2;
      t5.setAttribute('y', BY(dd.v005) - 3); t5.textContent = dd.v005;
      t2.setAttribute('opacity', on ? 1 : 0.35);
      t5.setAttribute('opacity', on ? 1 : 0.35);
    });
  },

  readout: function (ctx) {
    var sel = ctx.params.samp in this._D ? ctx.params.samp : 'IA';
    var d = this._D[sel];
    return [
      ['樣品 <b>' + sel + '</b>（' + d.tag[0] + '）', 'Sample <b>' + sel + '</b> (' + d.tag[1] + ')'],
      ['Mn <b>' + d.mn + '</b> · Mw <b>' + d.mw + '</b>', 'Mn <b>' + d.mn + '</b> · Mw <b>' + d.mw + '</b>'],
      ['VR2 <b>' + d.v2 + '</b>（合格帶內） · VR0.05 <b>' + d.v005 + '</b>',
       'VR2 <b>' + d.v2 + '</b> (in spec) · VR0.05 <b>' + d.v005 + '</b>']
    ];
  },

  guide: function (ctx) {
    var sel = ctx.params.samp;
    if (sel === 'IA') return ['IA 帶雙峰肩與長鏈尾（Mw 1581）——所以 VR0.05 撐在 33；看右邊長條：它的低速端比另兩個高五成。', 'IA carries a bimodal shoulder and long-chain tail (Mw 1581) — that is why VR0.05 holds at 33; look at the bars: its low-speed reading is 50% above the other two.'];
    if (sel === 'IB') return ['IB 近單峰、尾巴短（Mw 920）——結構其實像塑解膠；VR2 63 最高卻全在帶內，VR0.05 掉到 22 才現形。', 'IB is near-unimodal with a short tail (Mw 920) — structurally closer to a peptized rubber; its VR2 63 is the highest yet still in-spec, while VR0.05 drops to 22.'];
    return ['IC 分布最窄、Mw 最低（870）——VR2 59 合格，VR0.05 只有 19：規格抓不到的差異，低速端抓得到。', 'IC is the narrowest, lowest-Mw (870) — VR2 59 passes, VR0.05 only 19: the difference spec cannot catch, the low-speed end can.'];
  }
});
