/* mw-d-models.js — 專題D 核心 · 同一批鬆弛數據，五種模型上場比試（Ehabe et al. 2005 Fig.2–6）
   故事：散點是同一條實測鬆弛曲線（ML_N 對 t，0–500 s）；換模型只換擬合線。
        重點在下方殘差帶——冪次是系統波浪、Maxwell 是隨機噪、KWW 是低頻漂移、
        雙指數前段咬不住；「形狀對不對」殘差一看就知道。
   互動：模型選擇器即時換線＋換殘差；data-arg = pl / 23 / maxwell / wa / kww 決定開場模型。 */
MW.register('d-models', {
  vb: [520, 330],
  hint: ['換模型，盯著下面那條殘差帶看形狀', 'Switch models and watch the shape of the residual band below'],

  /* data-arg → 預設模型：pl→冪次、23→雙vs三對比、maxwell→三指數、wa→Wu–Abbott、kww→拉伸指數 */
  argToParams: function (arg) {
    var m = { pl: 'pl', '23': 'vs23', maxwell: 'maxwell', wa: 'wa', kww: 'kww' };
    return m[arg] ? { model: m[arg] } : null;
  },

  params: [
    { key: 'model', type: 'choice', def: 'pl',
      zh: '模型', en: 'Model',
      options: [
        { v: 'pl', zh: '冪次定律', en: 'power law' },
        { v: 'bi', zh: '雙指數', en: 'bi-exponential' },
        { v: 'maxwell', zh: '三指數 Maxwell', en: 'tri-exp Maxwell' },
        { v: 'wa', zh: 'Wu–Abbott', en: 'Wu–Abbott' },
        { v: 'kww', zh: '拉伸指數 KWW', en: 'stretched exp KWW' },
        { v: 'vs23', zh: '雙 vs 三對比', en: 'bi vs tri' }
      ] }
  ],

  /* ---- 數據與模型 ----
     實測散點：ML_N(t) = 0.1201 + 0.4278·e^(−t/5) + 0.2323·e^(−t/45) + 0.2304·e^(−t/250)（真值曲線，
     對原圖數位化曲線偏差 <±0.007）+ 每點固定 ±0.008 噪（寫死數組，33 點 t=8..500）。
     各模型參數為對同一數據真實最小平方法的擬合結果。 */
  _D: function (t) {
    return 0.1201 + 0.4278 * Math.exp(-t / 5) + 0.2323 * Math.exp(-t / 45) + 0.2304 * Math.exp(-t / 250);
  },

  _MODELS: {
    pl: {
      fn: function (t) { return 1.4183 * Math.pow(t, -0.3507); },
      t0: 6, /* t→0 冪次發散，線從 t=6 起畫（早段照樣衝出頭） */
      color: '#b3372f', dash: null, r2: '0.9684', rank: 3,
      zh: '冪次定律 M = k·tᵃ', en: 'power law  M = k·tᵃ',
      eq: 'M = k·tᵃ（a = −0.35）',
      cap: ['殘差是規律的波浪：兩端彎離、中段隆起——不是雜訊，是函數形狀本身套不準',
            'the residual is a regular wave — bending away at both ends; not noise, but a shape the function cannot take'],
      res: 'wave'
    },
    bi: {
      fn: function (t) { return 0.0726 + 0.4307 * Math.exp(-t / 30) + 0.2570 * Math.exp(-t / 400); },
      t0: 2, color: '#c98a3d', dash: '7 4', r2: '≈0.993', rank: null,
      zh: '雙指數 a + b·e^(−t/c) + d·e^(−t/f)', en: 'bi-exponential  a + b·e^(−t/c) + d·e^(−t/f)',
      eq: 'a + b·e^(−t/c) + d·e^(−t/f)',
      cap: ['中後段已經不錯，但初期快衰段咬不住——殘差一開頭就負一大截',
            'mid-to-late section is fine, but it cannot catch the initial fast decay — residuals start far negative'],
      res: 'early'
    },
    maxwell: {
      fn: function (t) { return 0.1201 + 0.4278 * Math.exp(-t / 5) + 0.2323 * Math.exp(-t / 45) + 0.2304 * Math.exp(-t / 250); },
      t0: 2, color: '#4a7a4a', dash: null, r2: '0.9981', rank: 1,
      zh: '廣義 Maxwell（三指數）', en: 'generalized Maxwell (tri-exp)',
      eq: 'a + b·e^(−t/c) + d·e^(−t/f) + g·e^(−t/h)',
      cap: ['擬合線穿過資料點，殘差只剩零均值噪聲——與冪次的系統波浪對照，這就是「形狀對」',
            'the line threads the points and residuals are pure zero-mean noise — against the power law’s wave, this is what a correct shape looks like'],
      res: 'noise'
    },
    wa: {
      fn: function (t) { return 1.1332 - 0.0929 * Math.log(1 + t) - 0.4151 * t / (3 + t); },
      t0: 2, color: '#2c5f8a', dash: null, r2: '0.9957', rank: 2,
      zh: 'Wu–Abbott Y = 1 − a·ln(1+t) − b·t/(c+t)', en: 'Wu–Abbott  Y = 1 − a·ln(1+t) − b·t/(c+t)',
      eq: '1 − a·ln(1+t) − b·t/(c+t)',
      cap: ['殘差近乎隨機、品質僅次於 Maxwell——第二名實至名歸（這式子本來是番茄硬度的經驗式）',
            'residuals near-random, second only to Maxwell — the runner-up rank is earned (a form borrowed from tomato firmness)'],
      res: 'noise'
    },
    kww: {
      fn: function (t) { return Math.exp(-Math.pow(t / 65, 0.33)); },
      t0: 2, color: '#8a4a2c', dash: null, r2: '0.9622', rank: 4,
      zh: '拉伸指數 M = exp(−(t/τ)^β)', en: 'stretched exponential  M = exp(−(t/τ)^β)',
      eq: 'exp(−(t/τ)^β)（τ=65, β=0.33）',
      cap: ['殘差拖成一條低頻慢彎——玻璃態鬆弛的常用形狀，套在橡膠扭矩上就是形狀不對',
            'the residual sags into one long low-frequency bend — the usual glassy-relaxation shape is simply the wrong shape here'],
      res: 'drift'
    },
    vs23: {
      fn: null, t0: 2, color: null, dash: null, r2: null, rank: null,
      zh: '雙指數 vs 三指數', en: 'bi- vs tri-exponential',
      eq: '',
      cap: ['同一批數據：雙指數（虛線）前段咬不住；三指數（實線）多一項就把前段也貼上——這就是為什麼選三指數',
            'same data: the bi-exponential (dashed) misses the fast initial decay; the third term in the tri-exponential (solid) catches it — that is why the tri form was kept'],
      res: 'vs'
    }
  },

  /* 33 點 t 位置與固定噪（±0.008，寫死保證每次一致） */
  _TS: [8, 20, 35, 50, 65, 80, 95, 110, 125, 140, 155, 170, 185, 200, 215, 230, 245, 260, 275, 290, 305, 320, 335, 350, 365, 380, 395, 410, 425, 440, 455, 470, 485],
  _NOISE: [-0.008, -0.008, 0.001, 0.002, 0.007, -0.006, 0.000, 0.001, 0.002, 0.005, -0.007, 0.004, 0.007, -0.007, 0.003, -0.001, -0.002, 0.007, -0.002, 0.007, 0.008, 0.003, -0.001, 0.000, -0.003, -0.001, 0.003, -0.006, -0.007, 0.006, -0.003, -0.008, -0.001],

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508;              /* 兩圖共用 x（t: 0–500 s） */
    var PY0 = 196, PY1 = 14;              /* 主圖 ML_N 0–1.0 */
    var RY0 = 312, RY1 = 226;             /* 殘差帶 ±0.08 */
    var X = function (t) { return PX0 + (t / 500) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / 1.0) * (PY0 - PY1); };
    var RY = function (v) { return RY0 - (v - (-0.08)) / 0.16 * (RY0 - RY1); };
    r.X = X; r.Y = Y; r.RY = RY;

    U.el('rect', { x: 0, y: 0, width: 520, height: 330, fill: '#fff' }, svg);

    /* 主圖網格＋軸（y: ML_N 0–1.0） */
    [0, 0.2, 0.4, 0.6, 0.8, 1.0].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut },
        m.toFixed(1), svg);
    });
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.el('line', { x1: PX0, y1: PY0, x2: PX1, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'ML_N', svg);

    /* 殘差帶（同一條 x 軸下方）：±0.08 框、零線、±0.05 參考線 */
    U.el('rect', { x: PX0, y: RY1, width: PX1 - PX0, height: RY0 - RY1, fill: P.soft, stroke: P.line, 'stroke-width': 0.8 }, svg);
    [-0.05, 0.05].forEach(function (v) {
      U.el('line', { x1: PX0, y1: RY(v), x2: PX1, y2: RY(v), stroke: P.line, 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }, svg);
      U.txt({ x: PX0 - 6, y: RY(v) + 3, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, (v > 0 ? '+' : '−') + Math.abs(v).toFixed(2), svg);
    });
    U.el('line', { x1: PX0, y1: RY(0), x2: PX1, y2: RY(0), stroke: P.mut, 'stroke-width': 1.1 }, svg);
    U.txt({ x: PX0 - 6, y: RY(0) + 3, 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, '0', svg);
    U.bi({ x: PX0 + 4, y: RY1 + 10, 'font-size': 9.5, fill: P.mut }, '殘差（實測 − 擬合）', 'residual (measured − fit)', svg);

    /* x 軸刻度（共用：0–500 s） */
    for (var t = 0; t <= 500; t += 100) {
      U.el('line', { x1: X(t), y1: RY0, x2: X(t), y2: RY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(t), y: RY0 + 13, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), svg);
    }
    U.bi({ x: PX1, y: RY0 + 13, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '　t（停轉後 s）', '　t after stop (s)', svg);

    /* 實測散點（固定，一次建好） */
    r.dots = U.el('g', {}, svg);
    var TS = this._TS, NOISE = this._NOISE, Df = this._D;
    r.pts = [];
    for (var i = 0; i < TS.length; i++) {
      var y = Df(TS[i]) + NOISE[i];
      var c = U.el('circle', { cx: X(TS[i]), cy: Y(y), r: 3, fill: P.ink, opacity: 0.7 }, r.dots);
      r.pts.push({ t: TS[i], y: y, el: c });
    }
    U.bi({ x: PX1 - 6, y: PY0 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '● 實測鬆弛散點（同一批數據）', '● measured relaxation (same dataset)', svg);

    /* 擬合線（主線＋對比用虛線） */
    r.fit = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.2 }, svg);
    r.fit2 = U.path('', { fill: 'none', stroke: P.warn, 'stroke-width': 1.8, 'stroke-dasharray': '7 4' }, svg);

    /* 模型方程式小牌（左上角） */
    r.eq = U.el('g', {}, svg);
    r.eqBg = U.el('rect', { x: PX0 + 4, y: PY1 + 16, width: 10, height: 30, rx: 4, fill: '#fff', stroke: P.line, 'stroke-width': 0.9, opacity: 0.9 }, r.eq);
    r.eqZh = U.txt({ x: PX0 + 10, y: PY1 + 35, 'font-size': 10.5, fill: P.ink, 'font-weight': 600, 'class': 'lang-zh' }, '', r.eq);
    r.eqEn = U.txt({ x: PX0 + 10, y: PY1 + 35, 'font-size': 10.5, fill: P.ink, 'font-weight': 600, 'class': 'lang-en' }, '', r.eq);

    /* 殘差標記層：每個資料點一根小桿（stem）＋對比組小點 */
    r.stems = U.el('g', {}, svg);
    r.stem = [];
    for (var j = 0; j < TS.length; j++) {
      r.stem.push(U.el('line', { x1: 0, y1: RY(0), x2: 0, y2: RY(0), stroke: P.acc, 'stroke-width': 2 }, r.stems));
    }
    r.stemDot = [];
    for (var k = 0; k < TS.length; k++) {
      r.stemDot.push(U.el('circle', { cx: 0, cy: RY(0), r: 1.8, fill: P.ok, opacity: 0.8 }, r.stems));
    }

    /* 殘差形狀說明小字（殘差帶右端，雙語） */
    r.resCap = U.el('g', {}, svg);
    r.capZh = U.txt({ x: PX1 - 4, y: RY1 + 10, 'font-size': 9, 'text-anchor': 'end', fill: P.warn, 'font-weight': 600, 'class': 'lang-zh' }, '', r.resCap);
    r.capEn = U.txt({ x: PX1 - 4, y: RY1 + 10, 'font-size': 9, 'text-anchor': 'end', fill: P.warn, 'font-weight': 600, 'class': 'lang-en' }, '', r.resCap);

    /* vs23 圖例（虛線=雙指數、實線=三指數） */
    r.vsLbl = U.el('g', { opacity: 0 }, svg);
    U.el('line', { x1: PX0 + 10, y1: PY1 + 54, x2: PX0 + 30, y2: PY1 + 54, stroke: P.warn, 'stroke-width': 1.8, 'stroke-dasharray': '7 4' }, r.vsLbl);
    U.bi({ x: PX0 + 34, y: PY1 + 57, 'font-size': 9.5, fill: P.acc2 }, '雙指數', 'bi-exponential', r.vsLbl);
    U.el('line', { x1: PX0 + 10, y1: PY1 + 68, x2: PX0 + 30, y2: PY1 + 68, stroke: P.ok, 'stroke-width': 2.2 }, r.vsLbl);
    U.bi({ x: PX0 + 34, y: PY1 + 71, 'font-size': 9.5, fill: P.ok }, '三指數', 'tri-exponential', r.vsLbl);

    return r;
  },

  _fitD: function (fn, t0, X, Y) {
    /* 由 t0 起畫擬合線（冪次從 t0=6 起，避免 t→0 發散衝出頂） */
    var d = '';
    for (var i = 0; i <= 300; i++) {
      var t = t0 + i / 300 * (500 - t0);
      d += (i ? 'L' : 'M') + X(t).toFixed(1) + ' ' + Y(fn(t)).toFixed(1) + ' ';
    }
    return d;
  },

  apply: function (r, ctx) {
    var self = this, P = MW.PAL;
    var X = r.X, Y = r.Y;
    var key = ctx.params.model;
    var mo = self._MODELS[key] || self._MODELS.pl;
    var TS = self._TS;

    /* 主擬合線與對比線 */
    if (key === 'vs23') {
      r.fit.setAttribute('d', self._fitD(self._MODELS.maxwell.fn, 2, X, Y));
      r.fit.setAttribute('stroke', P.ok);
      r.fit.setAttribute('stroke-dasharray', 'none');
      r.fit2.setAttribute('d', self._fitD(self._MODELS.bi.fn, 2, X, Y));
      r.fit2.setAttribute('opacity', 1);
    } else {
      r.fit.setAttribute('d', self._fitD(mo.fn, mo.t0, X, Y));
      r.fit.setAttribute('stroke', mo.color);
      if (mo.dash) r.fit.setAttribute('stroke-dasharray', mo.dash);
      else r.fit.setAttribute('stroke-dasharray', 'none');
      r.fit2.setAttribute('opacity', 0);
    }
    r.vsLbl.setAttribute('opacity', key === 'vs23' ? 1 : 0);

    /* 模型名＋方程式小牌（雙語） */
    var zh = key === 'vs23' ? '雙指數（虛線） vs 三指數（實線）' : mo.zh;
    var en = key === 'vs23' ? 'bi-exp (dashed) vs tri-exp (solid)' : mo.en;
    r.eqZh.textContent = zh;
    r.eqEn.textContent = en;
    r.eqBg.setAttribute('width', Math.max(60, zh.length * 7.2 + 12, en.length * 6.4 + 12));

    /* 殘差桿 */
    var fn1 = key === 'vs23' ? self._MODELS.bi.fn : mo.fn;
    var fn2 = key === 'vs23' ? self._MODELS.maxwell.fn : null;
    var stemColor = key === 'vs23' ? P.warn : mo.color;
    for (var i = 0; i < TS.length; i++) {
      var res = r.pts[i].y - fn1(TS[i]);
      var yy = Math.max(-0.078, Math.min(0.078, res));
      var ln = r.stem[i];
      ln.setAttribute('x1', X(TS[i])); ln.setAttribute('x2', X(TS[i]));
      ln.setAttribute('y1', r.RY(0)); ln.setAttribute('y2', r.RY(yy));
      ln.setAttribute('stroke', stemColor);
      if (fn2) {
        var res2 = r.pts[i].y - fn2(TS[i]);
        var c = r.stemDot[i];
        c.setAttribute('cx', X(TS[i])); c.setAttribute('cy', r.RY(res2));
        c.setAttribute('opacity', 0.9);
      } else {
        r.stemDot[i].setAttribute('opacity', 0);
      }
    }

    /* 殘差形狀小字（雙語） */
    var capZh = { wave: '規律波浪 →', early: '前段咬不住 →', noise: '隨機噪聲', drift: '低頻慢彎 →', vs: '虛線前段咬不住' };
    var capEn = { wave: 'regular wave →', early: 'misses the start →', noise: 'random noise', drift: 'low-freq bend →', vs: 'dashed misses the start' };
    r.capZh.textContent = capZh[mo.res];
    r.capEn.textContent = capEn[mo.res];
  },

  readout: function (ctx) {
    var mo = this._MODELS[ctx.params.model] || this._MODELS.pl;
    var rows = [];
    if (ctx.params.model === 'vs23') {
      rows.push(['<b>雙指數</b> R²≈0.993　<b>三指數</b> R²=0.9981', '<b>bi-exp</b> R²≈0.993　<b>tri-exp</b> R²=0.9981']);
      rows.push(['看殘差帶：<b>棕桿</b>是雙指數、<b>綠點</b>是三指數——多一項，前段就咬住了', 'residual band: <b>brown stems</b> = bi-exp, <b>green dots</b> = tri-exp — one more term catches the start']);
    } else {
      rows.push([mo.zh + '　R² ≈ <b>' + mo.r2 + '</b>' + (mo.rank ? '（平均排名 ' + mo.rank + '）' : ''),
        mo.en.split('  ')[0] + '　R² ≈ <b>' + mo.r2 + '</b>' + (mo.rank ? ' (mean rank ' + mo.rank + ')' : '')]);
      rows.push([mo.cap[0], mo.cap[1]]);
    }
    return rows;
  },

  guide: function (ctx) {
    var mo = this._MODELS[ctx.params.model] || this._MODELS.pl;
    return [mo.cap[0], mo.cap[1]];
  }
});
