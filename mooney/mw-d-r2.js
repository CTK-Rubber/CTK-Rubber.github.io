/* mw-d-r2.js — 專題D · 14 樣品×4 模型的擬合 R²（Ehabe et al. 2005 Table 2 原值）
   故事：每個樣品 4 個點（4 模型）——Maxwell 全部貼在 0.994 以上、每個樣品都第一；
        冪次與 KWW 明顯掉落且逐樣品波動。「平均排名 1.0」的背後是這種一面倒分布。
   互動：模型選擇器亮一組＋該模型均值標線；hover 任一點看樣品與 R²。 */
MW.register('d-r2', {
  vb: [560, 300],
  hint: ['選一個模型看它的 14 條成績；滑到點上看是哪個樣品', 'Pick a model to see its 14 scores; hover a dot for the sample'],

  params: [
    { key: 'model', type: 'choice', def: 'all',
      zh: '模型', en: 'Model',
      options: [
        { v: 'all', zh: '全部對比', en: 'all four' },
        { v: 'maxwell', zh: 'Maxwell', en: 'Maxwell' },
        { v: 'wa', zh: 'Wu–Abbott', en: 'Wu–Abbott' },
        { v: 'pl', zh: '冪次定律', en: 'power law' },
        { v: 'kww', zh: '拉伸指數', en: 'stretched exp' }
      ] }
  ],

  scrub: { panel: 0, fn: function (x01, st) {
    /* x → 最近的（樣品欄, 模型點）：每欄 4 點各有固定偏移 */
    var PX0 = 34, CW = 37.3, OFF = [-10.5, -3.5, 3.5, 10.5];
    var px = x01 * 560;
    var bi = -1, bj = -1, bd = 1e9;
    for (var i = 0; i < 14; i++) {
      for (var j = 0; j < 4; j++) {
        var d = Math.abs(PX0 + i * CW + OFF[j] - px);
        if (d < bd) { bd = d; bi = i; bj = j; }
      }
    }
    st.params.hov = bi * 10 + bj;
  } },

  /* 14 樣品×4 模型 R²（原文 Table 2 原值）：欄序 [Maxwell, Wu–Abbott, 冪次, KWW] */
  _T: [
    ['IR305',   '合成',   0.9984, 0.9965, 0.9672, 0.9676],
    ['Natsyn',  '合成',   0.9965, 0.9935, 0.9606, 0.8761],
    ['1SAP1CV', 'GT1',    0.9974, 0.9943, 0.9965, 0.9409],
    ['1SAP2CV', 'PR107',  0.9941, 0.9880, 0.9174, 0.8727],
    ['1SAP3CV', 'PB217',  0.9991, 0.9965, 0.9134, 0.9906],
    ['1SAP11',  'GT1',    0.9983, 0.9967, 0.9922, 0.9681],
    ['1SAP21',  'PR107',  0.9988, 0.9914, 0.9731, 0.9867],
    ['1SAP31',  'PB217',  0.9995, 0.9984, 0.9362, 0.9962],
    ['1SAP14',  'GT1',    0.9979, 0.9969, 0.9882, 0.9782],
    ['1SAP24',  'PR107',  0.9990, 0.9974, 0.9907, 0.9800],
    ['1SAP34',  'PB217',  0.9987, 0.9977, 0.9691, 0.9890],
    ['1SAP121', 'GT1',    0.9985, 0.9974, 0.9818, 0.9769],
    ['1SAP221', 'PR107',  0.9983, 0.9976, 0.9838, 0.9821],
    ['1SAP321', 'PB217',  0.9986, 0.9969, 0.9869, 0.9664]
  ],
  _MEAN: { maxwell: 0.9981, wa: 0.9957, pl: 0.9684, kww: 0.9622 },
  _RANK: { maxwell: '1.0', wa: '2.1', pl: '3.3', kww: '3.6' },
  _MC: { maxwell: '#4a7a4a', wa: '#2c5f8a', pl: '#b3372f', kww: '#8a4a2c' },
  _MN: {
    maxwell: ['廣義 Maxwell（三指數）', 'generalized Maxwell'],
    wa: ['Wu–Abbott', 'Wu–Abbott'],
    pl: ['冪次定律', 'power law'],
    kww: ['拉伸指數', 'stretched exponential']
  },
  _MKEY: ['maxwell', 'wa', 'pl', 'kww'],

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 34, CW = 37.3, PX1 = 556;
    var PY0 = 258, PY1 = 16;
    var YMIN = 0.84, YMAX = 1.0;
    var OFF = [-10.5, -3.5, 3.5, 10.5];
    var X = function (i, j) { return PX0 + i * CW + OFF[j]; };
    var Y = function (v) { return PY0 - (v - YMIN) / (YMAX - YMIN) * (PY0 - PY1); };
    r.X = X; r.Y = Y;

    U.el('rect', { x: 0, y: 0, width: 560, height: 300, fill: '#fff' }, svg);

    /* 網格＋y 軸（R² 0.84–1.00，放大區間才分得出高下） */
    [0.84, 0.88, 0.92, 0.96, 1.00].forEach(function (v) {
      U.el('line', { x1: PX0 - 8, y1: Y(v), x2: PX1, y2: Y(v), stroke: P.grid, 'stroke-width': v === 0.84 ? 1.4 : 0.8 }, svg);
      U.txt({ x: PX0 - 12, y: Y(v) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, v.toFixed(2), svg);
    });
    U.el('line', { x1: PX0 - 8, y1: PY1 - 6, x2: PX0 - 8, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.el('line', { x1: PX0 - 8, y1: PY0, x2: PX1, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.txt({ x: PX0 - 12, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'R²', svg);
    U.bi({ x: PX1, y: PY1 + 9, 'font-size': 9, 'text-anchor': 'end', fill: P.mut },
      'R² 只畫 0.84–1.00 區間（放大差距）', 'axis zoomed to 0.84–1.00 to show gaps', svg);

    /* 樣品名標籤（短名）＋品系分組線 */
    var SHORT = ['IR305', 'Natsyn', '1CV', '2CV', '3CV', '1-1', '2-1', '3-1', '1-4', '2-4', '3-4', '1-21', '2-21', '3-21'];
    for (var i = 0; i < 14; i++) {
      U.txt({ x: PX0 + i * CW, y: PY0 + 13, 'font-size': 8, 'text-anchor': 'middle', fill: P.mut }, SHORT[i], svg);
    }
    /* 品系標記：合成(0-1) 與 NR 交錯群(2-13) */
    U.bi({ x: PX0 + CW, y: PY0 + 25, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut }, '合成', 'synth.', svg);
    U.bi({ x: PX0 + CW * 7.5, y: PY0 + 25, 'font-size': 9, 'text-anchor': 'middle', fill: P.mut },
      'NR：GT1 · PR107 · PB217 交錯', 'NR: GT1 · PR107 · PB217', svg);

    /* 均值標線（每模型一條，選中才亮） */
    r.meanLine = {}; r.meanTxt = {};
    var self = this;
    this._MKEY.forEach(function (k) {
      var c = self._MC[k];
      r.meanLine[k] = U.el('line', { x1: PX0 - 8, y1: Y(self._MEAN[k]), x2: PX1, y2: Y(self._MEAN[k]),
        stroke: c, 'stroke-width': 1.2, 'stroke-dasharray': '5 4', opacity: 0 }, svg);
      r.meanTxt[k] = U.txt({ x: PX1 - 2, y: Y(self._MEAN[k]) - 3, 'font-size': 9, 'text-anchor': 'end', fill: c, 'font-weight': 700 }, '', svg);
    });

    /* 散點：14×4 */
    r.dots = [];
    for (var s = 0; s < 14; s++) {
      var row = this._T[s], col = [];
      for (var j = 0; j < 4; j++) {
        col.push(U.el('circle', {
          cx: X(s, j), cy: Y(row[2 + j]), r: 3.4,
          fill: this._MC[this._MKEY[j]], opacity: 0.8, stroke: '#fff', 'stroke-width': 0.8
        }, svg));
      }
      r.dots.push(col);
    }

    /* hover 標籤（雙語） */
    r.tag = U.el('g', { opacity: 0 }, svg);
    r.tagZh = U.txt({ x: 0, y: 0, 'font-size': 10, fill: P.ink, 'font-weight': 600, 'class': 'lang-zh' }, '', r.tag);
    r.tagEn = U.txt({ x: 0, y: 0, 'font-size': 10, fill: P.ink, 'font-weight': 600, 'class': 'lang-en' }, '', r.tag);

    /* 圖例（四模型色點，左上，雙語） */
    var LG = [['maxwell', 'Maxwell', 'Maxwell'], ['wa', 'Wu–Abbott', 'Wu–Abbott'],
              ['pl', '冪次', 'PL'], ['kww', '拉伸指數', 'KWW']];
    var lx = PX0 + 4;
    LG.forEach(function (g2) {
      var gi = U.el('g', {}, svg);
      U.el('circle', { cx: lx, cy: PY1 + 6, r: 4, fill: self._MC[g2[0]], opacity: 0.85 }, gi);
      U.bi({ x: lx + 7, y: PY1 + 9, 'font-size': 9, fill: P.mut }, g2[1], g2[2], gi);
      lx += 8 + Math.max(g2[1].length, g2[2].length) * 5.5 + 14;
    });

    return r;
  },

  apply: function (r, ctx) {
    var self = this, P = MW.PAL;
    var model = ctx.params.model;
    var hov = ctx.params.hov;
    var hi = -1, hj = -1;
    if (hov != null && hov >= 0) { hi = Math.floor(hov / 10); hj = hov % 10; }

    /* 點的強調/淡出 */
    for (var i = 0; i < 14; i++) {
      for (var j = 0; j < 4; j++) {
        var mk = self._MKEY[j], dot = r.dots[i][j];
        var sel = (model === 'all' || model === mk);
        var on = (i === hi && j === hj);
        dot.setAttribute('r', on ? 6.5 : (sel ? (model === 'all' ? 3.4 : 4.6) : 2.6));
        dot.setAttribute('fill', on ? P.warn : self._MC[mk]);
        dot.setAttribute('opacity', on ? 1 : (sel ? (model === 'all' ? 0.8 : 0.95) : 0.22));
      }
    }

    /* 均值標線：全部模式四條淡顯，單選模式亮該條＋註值 */
    self._MKEY.forEach(function (k) {
      var sel = (model === 'all' || model === k);
      r.meanLine[k].setAttribute('opacity', model === 'all' ? 0.35 : (k === model ? 0.9 : 0));
      r.meanTxt[k].setAttribute('opacity', k === model ? 1 : 0);
      if (k === model) r.meanTxt[k].textContent = 'mean ' + self._MEAN[k].toFixed(4);
    });

    /* hover 標籤（雙語） */
    if (hi >= 0) {
      var row = self._T[hi], mk2 = self._MKEY[hj];
      var x = r.X(hi, hj), y = r.Y(row[2 + hj]) - 10;
      var anchor = x > 480 ? 'end' : 'middle';
      var xx = Math.min(Math.max(x, 60), 530);
      r.tag.setAttribute('opacity', 1);
      r.tagZh.setAttribute('x', xx); r.tagZh.setAttribute('y', Math.max(y, 26));
      r.tagZh.setAttribute('text-anchor', anchor);
      r.tagZh.textContent = row[0] + ' · ' + self._MN[mk2][0] + ' ' + row[2 + hj].toFixed(4);
      r.tagEn.setAttribute('x', xx); r.tagEn.setAttribute('y', Math.max(y, 26));
      r.tagEn.setAttribute('text-anchor', anchor);
      r.tagEn.textContent = row[0] + ' · ' + self._MN[mk2][1] + ' ' + row[2 + hj].toFixed(4);
    } else {
      r.tag.setAttribute('opacity', 0);
    }
  },

  readout: function (ctx) {
    var self = this;
    var model = ctx.params.model, hov = ctx.params.hov;
    var rows = [];
    if (model !== 'all') {
      rows.push([self._MN[model][0] + '：平均 R² <b>' + self._MEAN[model].toFixed(4) + '</b> · 平均排名 <b>' + self._RANK[model] + '</b>',
        self._MN[model][1] + ': mean R² <b>' + self._MEAN[model].toFixed(4) + '</b> · mean rank <b>' + self._RANK[model] + '</b>']);
    } else {
      rows.push(['四模型全上：Maxwell 全貼頂、冪次與 KWW 明顯掉落', 'all four models: Maxwell hugs the top; power law and KWW drop visibly']);
    }
    if (hov != null && hov >= 0) {
      var i = Math.floor(hov / 10), j = hov % 10, row = self._T[i];
      rows.push(['<b>' + row[0] + '</b>（' + row[1] + '）：Maxwell ' + row[2].toFixed(4) + ' · WA ' + row[3].toFixed(4) + ' · 冪次 ' + row[4].toFixed(4) + ' · KWW ' + row[5].toFixed(4),
        '<b>' + row[0] + '</b> (' + row[1] + '): Maxwell ' + row[2].toFixed(4) + ' · WA ' + row[3].toFixed(4) + ' · PL ' + row[4].toFixed(4) + ' · KWW ' + row[5].toFixed(4)]);
    }
    return rows;
  },

  guide: function (ctx) {
    var g = {
      all: ['14 個樣品每個都是同一排名——「平均排名」的背後是一面倒。選一個模型看它的均值線。', 'every sample ranks the same way — the "mean rank" sits on a one-sided distribution. Pick a model to see its mean line.'],
      maxwell: ['14 樣品全部貼在 0.994 以上、每個都第一——物理基礎模型贏得乾淨俐落。', 'all 14 samples above 0.994 and every one ranks first — the physics-based model wins outright.'],
      wa: ['第二名穩穩跟在 Maxwell 後面——番茄硬度經驗式搬到橡膠也成立。', 'a steady second behind Maxwell — the tomato-firmness empirical form works on rubber too.'],
      pl: ['ASTM 標配掉到第三：R² 還有 0.97，但逐樣品起伏大——形狀不對的代價。', 'the ASTM default drops to third: R² still ~0.97, but it fluctuates sample to sample — the cost of a wrong shape.'],
      kww: ['墊底且波動最大（Natsyn 0.876、1SAP2CV 0.873）——玻璃態的形狀套錯地方。', 'last place and the wildest swings (Natsyn 0.876, 1SAP2CV 0.873) — a glassy-state shape in the wrong place.']
    };
    return g[ctx.params.model] || g.all;
  }
});
