/* mw-c-mwip.js — 專題 C：VR0.05 對 Mw·Ip^(−1/2) 修正前後（fig-topic-c-vr-mwip）
   教什麼：把 Mw 乘上分散度倒數平方根修正，點往左移、更貼回歸線——
   「同 Mw、分布寬不同」的樣品才能被分開。R² 0.931 → 0.953（原文報告值）。
   散點：Table 1 原值；修正後 x = Mw·Ip^(−1/2) = √(Mn·Mw)；回歸線為表值重算。 */
MW.register('c-mwip', {
  vb: [520, 300],
  alwaysTick: true,   /* 切換時點位滑動 */
  hint: ['按「修正後」看點怎麼滑向左邊貼線', 'Hit "corrected" and watch the points slide left onto the line'],

  params: [
    { key: 'mode', type: 'choice', def: 'raw', zh: '橫軸', en: 'X axis',
      options: [
        { v: 'raw',  zh: '修正前：Mw', en: 'Before: Mw' },
        { v: 'corr', zh: '修正後：Mw·Ip⁻¹ᐟ²', en: 'After: Mw·Ip^−1/2' }
      ] }
  ],

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
  _fam: { mono: 0, blend: 1, peptized: 2, industrial: 3 },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = { cur: 0 };
    var PX0 = 50, PX1 = 505, PY0 = 255, PY1 = 24;
    var X = function (m) { return PX0 + (m - 550) / (1700 - 550) * (PX1 - PX0); };
    var Y = function (v) { return PY0 - (v - 14) / (45 - 14) * (PY0 - PY1); };
    r.X = X; r.Y = Y;
    var famC = [P.acc, P.acc2, P.warn, P.ok], self = this;
    r.famC = famC;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸 */
    [20, 30, 40].forEach(function (v) {
      U.el('line', { x1: PX0, y1: Y(v), x2: PX1, y2: Y(v), stroke: P.grid, 'stroke-width': 0.8 }, svg);
      U.txt({ x: PX0 - 6, y: Y(v) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(v), svg);
    });
    U.el('line', { x1: PX0, y1: Y(14), x2: PX1, y2: Y(14), stroke: P.mut, 'stroke-width': 1.4 }, svg);
    [600, 800, 1000, 1200, 1400, 1600].forEach(function (m) {
      U.el('line', { x1: X(m), y1: PY0, x2: X(m), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(m), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(m), svg);
    });
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.bi({ x: PX0 - 4, y: PY1 - 10, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'VR0.05 (MU)', 'VR0.05 (MU)', svg);
    r.axT = [U.txt({ x: PX1, y: PY0 + 28, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '', svg, 'zh'),
             U.txt({ x: PX1, y: PY0 + 28, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '', svg, 'en')];

    /* 回歸線 */
    r.reg = U.el('line', { stroke: P.mut, 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, svg);

    /* 散點＋hover 名（標籤最後建，壓在點上） */
    r.pts = this._S.map(function (s) {
      return U.el('circle', { r: 4.5, fill: famC[self._fam[s[0]]], stroke: '#fff', 'stroke-width': 1.2, opacity: 0.9 }, svg);
    });
    r.hov = U.txt({ 'font-size': 10.5, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700, opacity: 0 }, '', svg);
    this._S.forEach(function (s, i) {
      var c = r.pts[i];
      c.addEventListener('pointerenter', function () {
        c.setAttribute('r', 7); c.setAttribute('stroke', '#1f2933'); c.setAttribute('stroke-width', 1.6);
        r.hov.setAttribute('x', c.getAttribute('cx'));
        r.hov.setAttribute('y', Math.max(14, parseFloat(c.getAttribute('cy')) - 10));
        r.hov.textContent = s[1] + '（Ip ' + (s[3] / s[2]).toFixed(1) + '）';
        r.hov.setAttribute('opacity', 1);
      });
      c.addEventListener('pointerleave', function () {
        c.setAttribute('r', 4.5); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', 1.2);
        r.hov.setAttribute('opacity', 0);
      });
    });

    /* IA 追蹤標籤（修正後貼線的範例） */
    r.iaT = U.txt({ 'font-size': 9.5, fill: P.ok, 'font-weight': 700, opacity: 0 }, 'IA', svg);

    /* R² 標示（兩枚交叉淡入淡出） */
    r.r2raw = U.el('g', { opacity: 1 }, svg);
    U.bi({ x: PX0 + 10, y: PY1 + 8, 'font-size': 11, fill: P.ink, 'font-weight': 700 }, 'R² = 0.931（原文）', 'R² = 0.931 (paper)', r.r2raw);
    r.r2cor = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: PX0 + 10, y: PY1 + 8, 'font-size': 11, fill: P.ok, 'font-weight': 700 }, 'R² = 0.953（原文）', 'R² = 0.953 (paper)', r.r2cor);
    r.note = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: PX0 + 10, y: PY1 + 24, 'font-size': 10, fill: P.mut }, '同 Mw、分布越寬（Ip 越大）往左移越多', 'same Mw — wider distributions (higher Ip) slide further left', r.note);

    return r;
  },

  apply: function (r, ctx) {
    var X = r.X, Y = r.Y;
    var tgt = ctx.params.mode === 'corr' ? 1 : 0;
    r.cur += (tgt - r.cur) * 0.12;
    if (Math.abs(tgt - r.cur) < 0.005) r.cur = tgt;
    var c = r.cur;

    /* 點位：x = Mw·(Mn/Mw)^(c/2)；c=0 → Mw，c=1 → √(Mn·Mw) */
    var S = this._S, i;
    for (i = 0; i < S.length; i++) {
      var s = S[i], x = s[3] * Math.pow(s[2] / s[3], c / 2);
      r.pts[i].setAttribute('cx', X(x).toFixed(1));
      r.pts[i].setAttribute('cy', Y(s[6]).toFixed(1));
    }

    /* 回歸線：兩端態表值重算係數間內插（raw 0.0271·x−4.77；corr 0.0476·x−10.53） */
    var a = 0.0271 + (0.0476 - 0.0271) * c, b = -4.77 + (-10.53 + 4.77) * c;
    var x0 = 840 + (640 - 840) * c, x1 = 1581 + (1060 - 1581) * c;
    r.reg.setAttribute('x1', X(x0)); r.reg.setAttribute('y1', Y(a * x0 + b));
    r.reg.setAttribute('x2', X(x1)); r.reg.setAttribute('y2', Y(a * x1 + b));

    /* IA 標籤跟著 IA 點（index 18） */
    var iax = parseFloat(r.pts[18].getAttribute('cx')), iay = parseFloat(r.pts[18].getAttribute('cy'));
    r.iaT.setAttribute('x', iax + 8); r.iaT.setAttribute('y', iay - 6);
    r.iaT.setAttribute('opacity', Math.max(0, c * 2 - 0.6));

    r.r2raw.setAttribute('opacity', 1 - c);
    r.r2cor.setAttribute('opacity', c);
    r.note.setAttribute('opacity', Math.max(0, c * 1.6 - 0.6));

    var raw = c < 0.5;
    r.axT[0].textContent = raw ? 'Mw kg/mol' : 'Mw·Ip⁻¹ᐟ²（= √(Mn·Mw)）kg/mol';
    r.axT[1].textContent = raw ? 'Mw kg/mol' : 'Mw·Ip^−1/2 (= √(Mn·Mw)) kg/mol';
  },

  readout: function (ctx) {
    if (ctx.params.mode === 'corr') return [
      ['橫軸 <b>Mw·Ip⁻¹ᐟ²</b>＝分散度修正分子量', 'X axis <b>Mw·Ip^−1/2</b> — dispersity-corrected Mw'],
      ['R² = <b>0.953</b>（原文）', 'R² = <b>0.953</b> (paper)'],
      ['IA 類寬分布樣品被拉回線上', 'wide-distribution samples like IA pull back onto the line']
    ];
    return [
      ['橫軸 <b>Mw</b> kg/mol', 'X axis <b>Mw</b> kg/mol'],
      ['R² = <b>0.931</b>（原文）', 'R² = <b>0.931</b> (paper)'],
      ['已經很貼——但寬分布的樣品還在線外', 'already tight — but wide-distribution samples still sit off the line']
    ];
  },

  guide: function (ctx) {
    if (ctx.params.mode === 'corr')
      return ['修正＝承認「分布寬的膠，同 Mw 也比較軟」：Ip 越大往左移越多——IA 這種雙峰寬分布樣品被拉回線上。', 'The correction admits “same Mw, wider distribution = softer”: higher Ip slides further left — bimodal IA-type samples land back on the line.'];
    return ['VR0.05 對 Mw 已經很貼（R² 0.931）——但仔細看：雙峰／寬分布的樣品仍偏離線，單靠 Mw 還差一步。', 'VR0.05 vs Mw is already tight (R² 0.931) — but look closely: bimodal / wide-distribution samples still sit off the line. Mw alone is one step short.'];
  }
});
