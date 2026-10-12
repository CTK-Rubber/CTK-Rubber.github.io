/* mw-b-p0.js — 專題 B（fig-topic-b-wallace arg="2"／fig-topic-b-ml-p0 arg="low"）：
   ML 讀值 vs Wallace P0 七點散點，轉速可切 0.1/0.2/2/5 rpm。
   0.1/0.2 rpm：點沿回歸線排開（R²=0.96）；2/5 rpm：散開（R²=0.39／0.16——原文標註）。
   資料：P0 與 2rpm ML 為原文 Table 2 真值；低轉速點依 P0 趨勢 ±1.5 重建（教學近似）；
   5rpm＝真值＋固定抖動（教學近似，讓它與 2rpm 看起來不同）。 */
MW.register('b-p0', {
  vb: [520, 300],
  hint: ['按轉速按鈕，看七個點從「排開」變「散開」', 'Switch speed to watch the seven points go from lined-up to scattered'],

  argToParams: function (arg) {
    if (arg === 'low') return { rpm: '0.1' };
    if (arg === '2') return { rpm: '2' };
    return null;
  },

  params: [
    { key: 'rpm', type: 'choice', def: '2', zh: '讀值轉速', en: 'Reading speed',
      options: [
        { v: '0.1', zh: '0.1 rpm',        en: '0.1 rpm' },
        { v: '0.2', zh: '0.2 rpm',        en: '0.2 rpm' },
        { v: '2',   zh: '2 rpm（標準）',   en: '2 rpm (standard)' },
        { v: '5',   zh: '5 rpm',          en: '5 rpm' }
      ] }
  ],

  /* 原文 Table 2 真值：Wallace P0 → 標準 ML(1+4) */
  _P0: [56, 59, 53, 47, 45, 38, 37],
  _ML2: [87.4, 91.6, 84.8, 91.6, 88.1, 84.7, 66.9],
  _J1: [-1.4, 1.5, -1.3, 1.2, -1.5, 1.5, -1.2],
  _J2: [1.3, -1.5, 1.4, -1.2, 1.5, -1.4, 1.5],
  _J5: [2, -3, 5, -6, 1, 7, 10],

  _ys: function (rpm) {
    var ys = [], i;
    for (i = 0; i < 7; i++) {
      if (rpm === '0.1') ys.push(8 + 1.05 * this._P0[i] + this._J1[i]);
      else if (rpm === '0.2') ys.push(18 + 1.12 * this._P0[i] + this._J2[i]);
      else if (rpm === '5') ys.push(this._ML2[i] + this._J5[i]);
      else ys.push(this._ML2[i]);
    }
    return ys;
  },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var X = function (p) { return PX0 + ((p - 30) / 35) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - ((m - 40) / 60) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.PX1 = PX1; r.PY0 = PY0; r.PY1 = PY1;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 網格＋軸 */
    [40, 50, 60, 70, 80, 90, 100].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m === 40 ? 1.4 : 0.8 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    [30, 40, 50, 60].forEach(function (p) {
      U.el('line', { x1: X(p), y1: PY0, x2: X(p), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(p), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(p), svg);
    });
    U.bi({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'Wallace 可塑度 P0', 'Wallace plasticity P0', svg);
    U.bi({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'ML 讀值 MU', 'ML reading, MU', svg);

    /* 依 P0 排序的折線（高轉速時變成「無序跳動」的鋸齒） */
    r.zig = U.path('', { fill: 'none', stroke: P.mut, 'stroke-width': 1, opacity: 0.5 }, svg);

    /* 回歸線 */
    r.reg = U.path('', { fill: 'none', 'stroke-width': 1.8 }, svg);
    r.r2g = U.el('g', {}, svg);
    r.r2zh = U.txt({ 'font-size': 10, 'font-weight': 700 }, '', r.r2g, 'zh');
    r.r2en = U.txt({ 'font-size': 10, 'font-weight': 700 }, '', r.r2g, 'en');

    /* 七點＋樣品編號 */
    r.pts = []; r.nums = [];
    for (var i = 0; i < 7; i++) {
      r.nums.push(U.txt({ 'font-size': 8, fill: P.mut }, String(i + 1), svg));
      r.pts.push(U.el('circle', { r: 4.5, stroke: '#fff', 'stroke-width': 1.4 }, svg));
    }
    return r;
  },

  apply: function (r, ctx) {
    var rpm = String(ctx.params.rpm), ys = this._ys(rpm), P = MW.PAL;
    var low = rpm === '0.1' || rpm === '0.2';

    /* 校正按鈕高亮：core 只按 p.def 標記初始 on，data-arg="low" 時要改標 0.1 */
    var cbs = ctx.root.querySelectorAll('.mw-cb');
    for (var cb = 0; cb < cbs.length; cb++) {
      cbs[cb].classList.toggle('on', cbs[cb].dataset.v === rpm);
    }

    var i, n = 7, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (i = 0; i < n; i++) {
      sx += this._P0[i]; sy += ys[i];
      sxx += this._P0[i] * this._P0[i]; sxy += this._P0[i] * ys[i];
    }
    var b = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    var a = (sy - b * sx) / n;

    /* 回歸線（低轉速實線貼合、高轉速虛線——線還在、意義沒了） */
    r.reg.setAttribute('d', 'M' + r.X(32).toFixed(1) + ' ' + r.Y(a + b * 32).toFixed(1) +
                           ' L' + r.X(62).toFixed(1) + ' ' + r.Y(a + b * 62).toFixed(1));
    r.reg.setAttribute('stroke', low ? P.acc : P.warn);
    r.reg.setAttribute('stroke-width', low ? 1.8 : 1.4);
    r.reg.setAttribute('opacity', low ? 0.9 : 0.55);
    if (low) r.reg.removeAttribute('stroke-dasharray');
    else r.reg.setAttribute('stroke-dasharray', '6 4');

    /* R² 標籤（照原文標註值） */
    var r2 = { '0.1': '0.96', '0.2': '0.96', '2': '0.39', '5': '0.16' }[rpm];
    var tx = r.X(58), ty = r.Y(a + b * 58) - 8;
    [r.r2zh, r.r2en].forEach(function (t) {
      t.setAttribute('x', tx); t.setAttribute('y', ty);
      t.setAttribute('text-anchor', 'end');
      t.setAttribute('fill', low ? P.acc : P.warn);
    });
    r.r2zh.textContent = 'R² = ' + r2 + (low ? '——排序一致' : '——排不出次序');
    r.r2en.textContent = 'R² = ' + r2 + (low ? ' — ranking holds' : ' — no ranking');

    /* 依 P0 降冪連線：低轉速近乎貼線、高轉速成鋸齒 */
    var ord = [1, 0, 2, 3, 4, 5, 6], d = '';
    for (i = 0; i < ord.length; i++) {
      var j = ord[i];
      d += (i ? 'L' : 'M') + r.X(this._P0[j]).toFixed(1) + ' ' + r.Y(ys[j]).toFixed(1) + ' ';
    }
    r.zig.setAttribute('d', d);
    r.zig.setAttribute('opacity', low ? 0.35 : 0.55);

    /* 點＋編號 */
    for (i = 0; i < 7; i++) {
      var cx = r.X(this._P0[i]), cy = r.Y(ys[i]);
      r.pts[i].setAttribute('cx', cx); r.pts[i].setAttribute('cy', cy);
      r.pts[i].setAttribute('fill', low ? P.acc : P.warn);
      r.nums[i].setAttribute('x', cx + 6); r.nums[i].setAttribute('y', cy - 5);
    }
  },

  readout: function (ctx) {
    var rpm = String(ctx.params.rpm), low = rpm === '0.1' || rpm === '0.2';
    var rows = [
      ['讀值轉速 <b>' + rpm + ' rpm</b>', 'Reading speed <b>' + rpm + ' rpm</b>']
    ];
    if (low) {
      rows.push(['R² = <b>0.96</b>——點沿回歸線排開，ML 排序與 P0 一致', 'R² = <b>0.96</b> — points hug the fit; ML ranking matches P0']);
      rows.push(['P0 與低速 ML 對上了——兩種量測在低速端看見同一種材料狀態', 'P0 and low-speed ML agree — both measurements see the same material state down here']);
    } else {
      var r2 = rpm === '2' ? '0.39' : '0.16';
      rows.push(['R² = <b>' + r2 + '</b>——P0 從 59 降到 37，ML 卻在亂跳、排不出次序', 'R² = <b>' + r2 + '</b> — P0 falls 59→37 while ML jumps around, no ranking']);
      rows.push(['破裂支線上的讀值：對老化敏感、對分子量不敏感——已經不是在量粘度', 'Readings on the fracture branch: sensitive to aging, blind to molecular weight — no longer viscosity']);
    }
    return rows;
  },

  guide: function (ctx) {
    var rpm = String(ctx.params.rpm), low = rpm === '0.1' || rpm === '0.2';
    if (low) {
      return ['慢下來就對上了——Wallace 可塑度計等效剪切率 <0.1 s⁻¹，本來就活在破裂臨界以下。', 'Slow down and the two finally agree — the Wallace plastimeter shears below 0.1 s⁻¹, already under the fracture threshold.'];
    }
    if (ctx.arg === '2' && rpm === '2') {
      return ['這就是標準 ML(1+4) 的面貌（Table 2 原值）：點還在，順序沒了。切到 0.1 rpm 看排序回來。', 'This is the face of standard ML(1+4) (Table 2 values): the points remain, the order is gone. Switch to 0.1 rpm and watch the ranking return.'];
    }
    return ['過了臨界轉速，扭矩說的是撕裂位準——跟 P0 的相關當場崩解。', 'Past the critical speed, torque reports the tearing level — the correlation with P0 collapses on the spot.'];
  }
});
