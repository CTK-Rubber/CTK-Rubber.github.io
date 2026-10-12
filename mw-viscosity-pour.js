/* mw-viscosity-pour.js — §2「粘度＝抵抗流動」傾倒演示
   故事：同一個傾倒動作，水一秒流光、蜂蜜慢慢爬——粘度就是抵抗流動的程度。
   互動：播放鍵＝傾倒（單段 8 秒，用 u 推進液面）；拉桿改右杯粘度——
        1≈水、85≈蜂蜜、100＝橡膠（重力推不動，標語提示要加熱加壓）。 */
MW.register('viscosity-pour', {
  vb: [520, 300],
  alwaysTick: true,
  loop: true,
  hint: ['按「播放」傾倒 · 拖「右杯粘度」看流速怎麼變', 'Press play to pour · drag the viscosity slider'],

  stages: [
    { dur: 8, zh: ['傾倒實驗', '同樣的傾斜、同樣的動作——水一下流光，右邊這杯還在慢慢爬。'],
             en: ['The pour test', 'Same tilt, same motion — water empties at once while the right cup is still crawling.'] }
  ],

  params: [
    { key: 'visc', type: 'range', min: 1, max: 100, step: 1, def: 85,
      zh: '右杯粘度', en: 'Right viscosity',
      fmt: function (v) { return v >= 99.5 ? '橡膠 rubber' : (v < 3 ? '≈水 water' : String(v)); } }
  ],

  /* 倒完秒數（教學近似）：水 1 秒、蜂蜜(85)約 6 秒；100＝橡膠級→重力推不動 */
  _pourTime: function (v) { return v >= 99.5 ? Infinity : 1 + (v - 1) * 5 / 84; },

  /* 右杯名稱＋顏色 */
  _fluid: function (v, P) {
    if (v < 3) return { nm: ['水', 'water'], col: P.acc };
    if (v >= 99.5) return { nm: ['橡膠', 'rubber'], col: P.acc2 };
    if (v >= 60) return { nm: ['蜂蜜', 'honey'], col: P.rub };
    return { nm: ['糖漿', 'syrup'], col: P.rub };
  },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = { TILT: 65 };
    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 杯組：原點在杯中心，傾倒時整組繞原點順時針轉 TILT 度 */
    function cup(cx) {
      var g = U.el('g', { transform: 'translate(' + cx + ' 96)' }, svg);
      var c = { g: g, cx: cx };
      U.el('rect', { x: -34, y: -56, width: 68, height: 108, rx: 9, fill: '#fff', stroke: 'none' }, g);
      c.liquid = U.el('rect', { x: -29, y: -40, width: 58, height: 88, fill: P.acc }, g);
      U.path('M30 -56 L44 -49 L32 -42', { fill: 'none', stroke: P.mut, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, g); /* 杯嘴 */
      U.el('rect', { x: -34, y: -56, width: 68, height: 108, rx: 9, fill: 'none', stroke: P.mut, 'stroke-width': 2.2 }, g);
      c.stream = U.path('', { fill: 'none', 'stroke-linecap': 'round', opacity: 0 }, svg);
      c.blob = U.el('circle', { cx: 0, cy: 0, r: 4.5, fill: P.acc2, opacity: 0 }, svg);
      return c;
    }

    /* 接盤 */
    function tray(tx) {
      U.path('M' + (tx - 56) + ' 252 L' + (tx + 56) + ' 252 L' + (tx + 44) + ' 268 L' + (tx - 44) + ' 268 Z',
        { fill: P.soft, stroke: P.mut, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, svg);
    }
    r.txL = 203; r.txR = 423;
    tray(r.txL); tray(r.txR);

    r.cupL = cup(135); r.cupR = cup(355);
    r.cupL.puddle = U.el('ellipse', { cx: r.txL, cy: 259, rx: 5, ry: 2.4, fill: P.acc, opacity: 0 }, svg);
    r.cupR.puddle = U.el('ellipse', { cx: r.txR, cy: 259, rx: 5, ry: 2.4, fill: P.rub, opacity: 0 }, svg);

    /* 杯名 */
    U.bi({ x: 135, y: 26, 'font-size': 12.5, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 600 }, '水', 'water', svg);
    r.nmRzh = U.txt({ x: 355, y: 26, 'font-size': 12.5, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 600 }, '蜂蜜', svg, 'zh');
    r.nmRen = U.txt({ x: 355, y: 26, 'font-size': 12.5, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 600 }, 'honey', svg, 'en');

    /* 橡膠標語 */
    r.note = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: r.txR, y: 235, 'font-size': 11, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 700 }, '不會自己流', 'won’t flow on its own', r.note);

    return r;
  },

  apply: function (r, ctx) {
    var P = MW.PAL, v = ctx.params.visc;
    var elapsed = ctx.u * 8;                                  /* 單段 8 秒＝傾倒總時長 */
    var tu = Math.min(1, elapsed / 0.8);                      /* 前 0.8 秒完成傾斜 */
    var tilt = r.TILT * tu * (2 - tu);                        /* ease-out */
    var rad = tilt * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    var ptR = this._pourTime(v);
    var fl = this._fluid(v, P);

    r.nmRzh.textContent = fl.nm[0]; r.nmRen.textContent = fl.nm[1];
    r.note.setAttribute('opacity', v >= 99.5 ? 1 : 0);

    var cups = [
      [r.cupL, 1,   P.acc,  r.txL, 1],
      [r.cupR, ptR, fl.col, r.txR, v]
    ];
    for (var ci = 0; ci < 2; ci++) {
      var c = cups[ci][0], pt = cups[ci][1], col = cups[ci][2], tx = cups[ci][3], vv = cups[ci][4];
      c.g.setAttribute('transform', 'translate(' + c.cx + ' 96) rotate(' + tilt.toFixed(1) + ')');

      /* 液面：0.8 秒傾斜完成才開始流 */
      var p = pt === Infinity ? 0 : Math.max(0, Math.min(1, (elapsed - 0.8) / pt));
      c.liquid.setAttribute('y', (-40 + 88 * p).toFixed(1));
      c.liquid.setAttribute('height', Math.max(0, 88 * (1 - p)).toFixed(1));
      c.liquid.setAttribute('fill', col);

      /* 杯嘴螢幕座標（局部 41,-50 旋轉 tilt 度） */
      var sx = c.cx + 41 * cos + 50 * sin, sy = 96 + 41 * sin - 50 * cos;

      /* 液線：前 8% 伸長到盤面；粗細、抖動跟粘度反比 */
      var f = Math.min(1, p / 0.08);
      var exx = sx + (tx - sx) * f, eyy = sy + (257 - sy) * f;
      var amp = pt === Infinity ? 0 : 3 * (1 - Math.min(1, vv / 110));
      var wob = Math.sin(ctx.t * 9 + c.cx) * amp;
      var mx = (sx + exx) / 2 + wob, my = (sy + eyy) / 2 + 4;
      c.stream.setAttribute('d', 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) +
        ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + exx.toFixed(1) + ' ' + eyy.toFixed(1));
      c.stream.setAttribute('stroke', col);
      var wbase = 1.4 + 3.4 * (1 - Math.min(1, vv / 105));
      var wfac = p < 0.06 ? p / 0.06 : (p > 0.9 ? Math.max(0.2, (1 - p) / 0.1) : 1);
      c.stream.setAttribute('stroke-width', (wbase * wfac).toFixed(1));
      c.stream.setAttribute('opacity', (p > 0 && p < 0.998 && pt !== Infinity) ? 0.92 : 0);

      /* 盤中積液 */
      c.puddle.setAttribute('rx', (5 + 42 * Math.pow(p, 0.7)).toFixed(1));
      c.puddle.setAttribute('ry', (2.4 + 4.2 * Math.pow(p, 0.9)).toFixed(1));
      c.puddle.setAttribute('opacity', Math.min(1, p * 5) * 0.8);
      c.puddle.setAttribute('fill', col);

      /* 橡膠：杯口掛一顆不走的膠 */
      var hang = pt === Infinity && elapsed > 1.0;
      c.blob.setAttribute('cx', sx.toFixed(1));
      c.blob.setAttribute('cy', (sy + 4).toFixed(1));
      c.blob.setAttribute('opacity', hang ? 0.9 : 0);
    }
  },

  readout: function (ctx) {
    var v = ctx.params.visc, pt = this._pourTime(v), P = MW.PAL;
    var fl = this._fluid(v, P);
    var rt = pt === Infinity ? '<b>不會自己流</b>（要加熱加壓）' : '約 <b>' + pt.toFixed(1) + ' 秒</b>';
    var rtE = pt === Infinity ? '<b>won’t flow on its own</b> (needs heat + pressure)' : '~<b>' + pt.toFixed(1) + ' s</b>';
    var ratio = pt === Infinity
      ? ['倒完時間比 <b>1 : ∞</b>', 'Empty-time ratio <b>1 : ∞</b>']
      : ['倒完時間比 <b>1 : ' + pt.toFixed(1) + '</b>', 'Empty-time ratio <b>1 : ' + pt.toFixed(1) + '</b>'];
    return [
      ['左杯水 · 約 <b>1 秒</b>倒完', 'Left cup (water) · empty in ~<b>1 s</b>'],
      ['右杯' + fl.nm[0] + ' · ' + rt, 'Right cup (' + fl.nm[1] + ') · ' + rtE],
      ratio
    ];
  },

  guide: function (ctx) {
    var v = ctx.params.visc;
    if (v >= 99.5) return ['粘度頂到橡膠這一級：杯斜到底它也紋風不動——要流動得加熱加壓，這正是木尼粘度計存在的原因。',
      'At rubber-grade viscosity it does not move even fully tilted — flow needs heat and pressure; that is why the Mooney viscometer exists.'];
    if (v < 3) return ['右杯也換成水了——同樣粘度同樣速度，沒得比。',
      'The right cup holds water too — same viscosity, same speed, nothing to compare.'];
    var pt = this._pourTime(v);
    return ['同樣傾斜：水約 1 秒流光、右杯要 ' + pt.toFixed(1) + ' 秒——粘度＝抵抗流動的程度，數字越大越懶得動。',
      'Same tilt: water is gone in ~1 s, the right cup takes ~' + pt.toFixed(1) + ' s — viscosity is resistance to flow; bigger number, lazier it moves.'];
  }
});
