/* mw-c-mmd.js — 專題 C：單株模型膠的 SEC-MALS 色譜（fig-topic-c-sec-family）
   教什麼：GT1 雙峰——左側小峰是短鏈群（壓低 Mn）、右側主體撐 Mw；PB235 近單峰偏左。
   色譜曲線與 Mn/Mw 標線為教學近似（原文 Fig. 1 描取圖的概念重現，非原值）。 */
MW.register('c-mmd', {
  vb: [520, 300],
  hint: ['下方按鈕切換品系，看雙峰怎麼變成單峰', 'Switch clones below — watch the bimodal turn unimodal'],

  stages: [
    { dur: 2.2, zh: ['這是一條分布', 'SEC-MALS 色譜：橫軸分子量、縱軸訊號強度——一條曲線就是一整包長短不一的鏈。'],
             en: ['A distribution', 'SEC-MALS chromatogram: molecular weight across, signal up — one curve is the whole bundle of chain lengths.'] },
    { dur: 2.4, zh: ['雙峰的意義', 'GT1 左側的小峰是一群短鏈——把 Mn（數均）壓低；右側主體是長鏈——把 Mw（重均）撐高。'],
             en: ['Why two peaks', 'GT1’s small left peak is a population of short chains — it drags Mn down; the right main body holds Mw up.'] },
    { dur: 2.0, zh: ['換一個品系', '用下面按鈕換樣品：PB235 幾乎是單峰且整體偏左——分布窄、長鏈少。'],
             en: ['Try another clone', 'Switch samples below: PB235 is nearly unimodal and shifted left — narrow, with few long chains.'] }
  ],

  params: [
    { key: 'sample', type: 'choice', def: 'gt1', zh: '品系', en: 'Clone',
      options: [
        { v: 'gt1',   zh: 'GT1（雙峰）', en: 'GT1 (bimodal)' },
        { v: 'pb217', zh: 'PB217', en: 'PB217' },
        { v: 'rrim',  zh: 'RRIM600', en: 'RRIM600' },
        { v: 'pb235', zh: 'PB235（單峰偏左）', en: 'PB235 (unimodal, left)' }
      ] }
  ],

  /* 教學近似樣品：Mn/Mw 標線值約取自 Table 1 各族位準；峰形為高斯近似 */
  _samples: {
    gt1:   { mn: 490, mw: 1420, bimodal: true,  pk: [[2.60, 0.45, 0.055], [3.11, 1.0, 0.085]] },
    pb217: { mn: 640, mw: 1440, bimodal: false, pk: [[2.97, 1.0, 0.105]] },
    rrim:  { mn: 660, mw: 1500, bimodal: false, pk: [[3.00, 1.0, 0.11]] },
    pb235: { mn: 450, mw: 1150, bimodal: false, pk: [[2.79, 1.0, 0.10]] }
  },
  _names: { gt1: 'GT1', pb217: 'PB217', rrim: 'RRIM600', pb235: 'PB235' },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 505, PY0 = 252, PY1 = 26;
    var L0 = 2.30, L1 = 3.55;            /* log10(kg/mol)：200 → 3550 */
    var X = function (m) { return PX0 + (Math.log(m) / Math.LN10 - L0) / (L1 - L0) * (PX1 - PX0); };
    var Y = function (v) { return PY0 - v * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.PX1 = PX1; r.PY0 = PY0; r.L0 = L0; r.L1 = L1;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸 */
    [0, 0.5, 1].forEach(function (v) {
      U.el('line', { x1: PX0, y1: Y(v), x2: PX1, y2: Y(v), stroke: P.grid, 'stroke-width': v ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(v) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, v ? '0.5' : '0', svg);
    });
    U.txt({ x: PX0 - 6, y: Y(1) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '1.0', svg);
    [300, 500, 1000, 2000, 3000].forEach(function (m) {
      U.el('line', { x1: X(m), y1: PY0, x2: X(m), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(m), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(m), svg);
    });
    U.el('line', { x1: PX0, y1: PY1 - 4, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.bi({ x: PX1, y: PY0 + 28, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '分子量 kg/mol（對數）', 'molecular weight kg/mol (log)', svg);
    U.bi({ x: PX0 - 4, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '訊號', 'signal', svg);

    /* 曲線（clip 揭露）＋底色 */
    var clip = U.el('clipPath', { id: 'mmdc' + U.uid }, svg);
    r.clipRect = U.el('rect', { x: PX0, y: 0, width: 0, height: 300 }, clip);
    r.fillA = U.path('', { fill: P.acc, opacity: 0.08, stroke: 'none', 'clip-path': 'url(#mmdc' + U.uid + ')' }, svg);
    r.curve = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.4, 'clip-path': 'url(#mmdc' + U.uid + ')' }, svg);

    /* 峰標註（第 1 段起） */
    r.pkG = U.el('g', { opacity: 0 }, svg);
    r.pk1 = U.el('g', {}, r.pkG);
    U.el('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: P.warn, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, r.pk1).setAttribute('class', 'pkln');
    r.pk1ln = r.pk1.lastChild;
    r.pk1t = [U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 600 }, '短鏈群——壓低 Mn', r.pk1, 'zh'),
              U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 600 }, 'short chains — drag Mn down', r.pk1, 'en')];
    r.pk2 = U.el('g', {}, r.pkG);
    r.pk2ln = U.el('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: P.acc, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, r.pk2);
    r.pk2t = [U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.acc, 'font-weight': 600 }, '長鏈主體——撐高 Mw', r.pk2, 'zh'),
              U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.acc, 'font-weight': 600 }, 'main body — holds Mw up', r.pk2, 'en')];
    r.pkUni = U.el('g', {}, r.pkG);
    r.pkUln = U.el('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: P.acc2, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, r.pkUni);
    r.pkUt = [U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 600 }, '單峰——鏈長集中', r.pkUni, 'zh'),
              U.txt({ 'font-size': 10, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 600 }, 'unimodal — lengths clustered', r.pkUni, 'en')];

    /* Mn / Mw 標線（第 2 段起） */
    r.mnG = U.el('g', { opacity: 0 }, svg);
    r.mnL = U.el('line', { y1: PY1, y2: PY0, stroke: P.acc2, 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }, r.mnG);
    r.mnT = [U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 700 }, '', r.mnG, 'zh'),
             U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.acc2, 'font-weight': 700 }, '', r.mnG, 'en')];
    r.mwL = U.el('line', { y1: PY1, y2: PY0, stroke: P.ok, 'stroke-width': 1.6, 'stroke-dasharray': '6 4' }, r.mnG);
    r.mwT = [U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.ok, 'font-weight': 700 }, '', r.mnG, 'zh'),
             U.txt({ 'font-size': 11, 'text-anchor': 'middle', fill: P.ok, 'font-weight': 700 }, '', r.mnG, 'en')];

    return r;
  },

  /* 高斯近似色譜：peaks 用 [log10(mu), amp, sigma] */
  _d: function (sm, L0, L1, X, Y, withBase) {
    var d = '', i, n = 240, v, L;
    for (i = 0; i <= n; i++) {
      L = L0 + i / n * (L1 - L0);
      v = 0;
      for (var j = 0; j < sm.pk.length; j++) {
        var pk = sm.pk[j], z = (L - pk[0]) / pk[2];
        v += pk[1] * Math.exp(-z * z / 2);
      }
      if (v < 0) v = 0;
      d += (i ? 'L' : 'M') + X(Math.pow(10, L)).toFixed(1) + ' ' + Y(v).toFixed(1) + ' ';
    }
    if (withBase) d += 'L' + X(Math.pow(10, L1)) + ' ' + Y(0) + ' L' + X(Math.pow(10, L0)) + ' ' + Y(0) + ' Z';
    return d;
  },

  apply: function (r, ctx) {
    var key = ctx.params.sample in this._samples ? ctx.params.sample : 'gt1';
    var sm = this._samples[key];
    var X = r.X, Y = r.Y, s = ctx.s, sp = ctx.sp;

    /* 曲線＋揭露 */
    r.curve.setAttribute('d', this._d(sm, r.L0, r.L1, X, Y, false));
    r.fillA.setAttribute('d', this._d(sm, r.L0, r.L1, X, Y, true));
    var w = s === 0 ? sp : 1;
    r.clipRect.setAttribute('width', Math.max(0, (r.PX1 - r.PX0) * w));

    /* 峰標註：第 1 段起淡入 */
    var pkO = s >= 1 ? Math.min(1, sp * 2.5) : 0;
    r.pkG.setAttribute('opacity', pkO);
    if (sm.bimodal) {
      var x1 = X(Math.pow(10, sm.pk[0][0])), x2 = X(Math.pow(10, sm.pk[1][0]));
      r.pk1ln.setAttribute('x1', x1); r.pk1ln.setAttribute('x2', x1);
      r.pk1ln.setAttribute('y1', Y(sm.pk[0][1]) + 6); r.pk1ln.setAttribute('y2', Y(sm.pk[0][1]) + 26);
      r.pk1t[0].setAttribute('x', x1 - 6); r.pk1t[1].setAttribute('x', x1 - 6);
      r.pk1t[0].setAttribute('y', Y(sm.pk[0][1]) + 40); r.pk1t[1].setAttribute('y', Y(sm.pk[0][1]) + 40);
      r.pk2ln.setAttribute('x1', x2); r.pk2ln.setAttribute('x2', x2);
      r.pk2ln.setAttribute('y1', Y(1) + 6); r.pk2ln.setAttribute('y2', Y(1) + 26);
      r.pk2t[0].setAttribute('x', x2 + 4); r.pk2t[1].setAttribute('x', x2 + 4);
      r.pk2t[0].setAttribute('y', Y(1) + 40); r.pk2t[1].setAttribute('y', Y(1) + 40);
      r.pk1.setAttribute('opacity', 1); r.pk2.setAttribute('opacity', 1);
      r.pkUni.setAttribute('opacity', 0);
    } else {
      var xu = X(Math.pow(10, sm.pk[0][0]));
      r.pkUln.setAttribute('x1', xu); r.pkUln.setAttribute('x2', xu);
      r.pkUln.setAttribute('y1', Y(1) + 6); r.pkUln.setAttribute('y2', Y(1) + 26);
      r.pkUt[0].setAttribute('x', xu); r.pkUt[1].setAttribute('x', xu);
      r.pkUt[0].setAttribute('y', Y(1) + 40); r.pkUt[1].setAttribute('y', Y(1) + 40);
      r.pkUni.setAttribute('opacity', 1);
      r.pk1.setAttribute('opacity', 0); r.pk2.setAttribute('opacity', 0);
    }

    /* Mn / Mw 標線：第 2 段起 */
    var mkO = s >= 2 ? Math.min(1, sp * 2.5) : 0;
    r.mnG.setAttribute('opacity', mkO);
    r.mnL.setAttribute('x1', X(sm.mn)); r.mnL.setAttribute('x2', X(sm.mn));
    r.mwL.setAttribute('x1', X(sm.mw)); r.mwL.setAttribute('x2', X(sm.mw));
    r.mnT[0].textContent = 'Mn≈' + sm.mn; r.mnT[1].textContent = 'Mn≈' + sm.mn;
    r.mwT[0].textContent = 'Mw≈' + sm.mw; r.mwT[1].textContent = 'Mw≈' + sm.mw;
    r.mnT[0].setAttribute('x', X(sm.mn)); r.mnT[1].setAttribute('x', X(sm.mn));
    r.mwT[0].setAttribute('x', X(sm.mw)); r.mwT[1].setAttribute('x', X(sm.mw));
    r.mnT[0].setAttribute('y', r.PY0 - 14); r.mnT[1].setAttribute('y', r.PY0 - 14);
    r.mwT[0].setAttribute('y', r.PY0 - 14); r.mwT[1].setAttribute('y', r.PY0 - 14);
  },

  readout: function (ctx) {
    var key = ctx.params.sample in this._samples ? ctx.params.sample : 'gt1';
    var sm = this._samples[key], nm = this._names[key];
    var kind = sm.bimodal
      ? ['雙峰——兩群鏈', 'bimodal — two populations']
      : ['近單峰——鏈長集中', 'near-unimodal — clustered'];
    return [
      ['品系 <b>' + nm + '</b>', 'Clone <b>' + nm + '</b>'],
      ['Mn ≈ <b>' + sm.mn + '</b> · Mw ≈ <b>' + sm.mw + '</b> kg/mol', 'Mn ≈ <b>' + sm.mn + '</b> · Mw ≈ <b>' + sm.mw + '</b> kg/mol'],
      ['分散度 Mw/Mn ≈ <b>' + (sm.mw / sm.mn).toFixed(1) + '</b>', 'dispersity ≈ <b>' + (sm.mw / sm.mn).toFixed(1) + '</b>'],
      [kind[0], kind[1]]
    ];
  },

  guide: function (ctx) {
    if (ctx.s < 2) return null;
    var key = ctx.params.sample;
    if (key === 'gt1') return ['雙峰＝兩群鏈：Mn 被短鏈拉低、Mw 被長鏈撐住——同一條分布，兩個平均值講不同的事。', 'Bimodal = two populations: short chains drag Mn down while long chains hold Mw up — one distribution, two averages telling different stories.'];
    if (key === 'pb235') return ['單峰偏左＝鏈長集中且偏短——Mn、Mw 差距小，低速端扭矩也跟著低。', 'Unimodal and left-shifted = uniform, shorter chains — Mn and Mw close together, and low-speed torque drops too.'];
    return ['介於兩者之間：主峰居中、沒有明顯的短鏈峰——這就是「中等」分布的長相。', 'In between: a centered main peak with no obvious short-chain peak — what a middling distribution looks like.'];
  }
});
