/* mw-rotovisc.js — §2 一般旋轉黏度計演示（轉子在液體內）
   故事：一般流體的黏度這樣量——一根轉子在液體裡轉，量它遇到的抗力。
        水轉得飛快、蜂蜜拖得慢、橡膠根本轉不動——所以橡膠需要密閉加壓的木尼。
   互動：轉速＝流體讓它轉多快（跟粘度反比）；錶針＝抗力讀數（跟粘度正比）；
        「流體粘度」拉桿 1≈水、85≈蜂蜜、100＝橡膠（轉不動）。 */
MW.register('rotovisc', {
  vb: [520, 300],
  alwaysTick: true,
  loop: true,
  hint: ['拖「流體粘度」拉桿——看轉子轉多快、錶針讀數多大', 'Drag the viscosity slider — watch rotor speed and the gauge reading'],

  stages: [
    { dur: 6, zh: ['轉子在液體裡轉', '一般黏度計的原理：轉子在液體裡被帶著轉，機器量它遇到的抗力——抗力換算成粘度讀數。'],
            en: ['Rotor in liquid', 'How a rotational viscometer works: a spindle turns inside the fluid and the machine reads its drag — drag becomes the viscosity reading.'] }
  ],

  params: [
    { key: 'visc', type: 'range', min: 1, max: 100, step: 1, def: 40,
      zh: '流體粘度', en: 'Fluid viscosity',
      fmt: function (v) { return v >= 99.5 ? '橡膠 rubber' : (v < 8 ? '≈水 water' : String(v)); } }
  ],

  _fluid: function (v, P) {
    if (v < 8) return { nm: ['水', 'water'], col: P.acc };
    if (v >= 99.5) return { nm: ['橡膠', 'rubber'], col: '#8a5a2e' };
    if (v >= 60) return { nm: ['蜂蜜', 'honey'], col: P.rub };
    return { nm: ['糖漿', 'syrup'], col: P.rub };
  },

  /* 轉速比例：水 1.0、蜂蜜 0.25、橡膠 0（轉不動只剩抖動） */
  _spin: function (v) { return v >= 99.5 ? 0 : Math.max(0.06, 1.05 - v / 100); },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* ---- 左半：黏度計本體 ---- */
    /* 立架 */
    U.el('rect', { x: 40, y: 30, width: 10, height: 238, rx: 3, fill: '#c9ced6', stroke: P.mut, 'stroke-width': 1.4 }, svg);
    U.el('rect', { x: 26, y: 266, width: 70, height: 10, rx: 3, fill: '#c9ced6', stroke: P.mut, 'stroke-width': 1.4 }, svg);
    /* 橫臂＋驅動頭 */
    U.el('rect', { x: 50, y: 36, width: 110, height: 10, rx: 3, fill: '#c9ced6', stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.el('rect', { x: 118, y: 44, width: 86, height: 34, rx: 7, fill: P.soft, stroke: P.mut, 'stroke-width': 1.8 }, svg);
    U.bi({ x: 161, y: 65, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 600 }, '驅動頭', 'drive head', svg);
    /* 轉子轉動指示（頭上小箭頭圈） */
    r.spinArrow = U.path('M196 52 a9 9 0 1 1 -6 8', { fill: 'none', stroke: P.acc, 'stroke-width': 2 }, svg);
    U.path('M189 55 l-4 7 l8 -1 z', { fill: P.acc }, svg);

    /* 主軸（頂到轉子盤面） */
    U.el('rect', { x: 158, y: 78, width: 6, height: 119, fill: '#8a9099', stroke: 'none' }, svg);
    /* 轉子（圓盤＋轉向刻線，沉在液面下） */
    r.rotorG = U.el('g', {}, svg);
    r.rotorDisc = U.el('ellipse', { cx: 161, cy: 0, rx: 26, ry: 8, fill: '#6b7280', stroke: '#4b5563', 'stroke-width': 1.4 }, r.rotorG);
    r.rotorMark = U.el('line', { x1: 137, y1: 0, x2: 185, y2: 0, stroke: '#e5e7eb', 'stroke-width': 2.4 }, r.rotorG);

    /* 燒杯（開口容器）＋液體 */
    r.liquid = U.el('rect', { x: 112, y: 160, width: 98, height: 78, fill: P.acc, opacity: 0.75 }, svg);
    /* 液面橢圓 */
    r.surface = U.el('ellipse', { cx: 161, cy: 160, rx: 49, ry: 7, fill: P.acc, opacity: 0.45 }, svg);
    /* 杯壁（後描線才看得到液體） */
    U.path('M112 118 L112 246 Q112 254 120 254 L202 254 Q210 254 210 246 L210 118',
      { fill: 'none', stroke: P.mut, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, svg);
    U.el('line', { x1: 112, y1: 118, x2: 210, y2: 118, stroke: P.mut, 'stroke-width': 1.2, 'stroke-dasharray': '4 4', opacity: 0.5 }, svg);

    /* 液內旋渦線：兩道弧繞轉子——轉速跟流體走 */
    r.swirl1 = U.path('', { fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-dasharray': '10 14', 'stroke-linecap': 'round', opacity: 0 }, svg);
    r.swirl2 = U.path('', { fill: 'none', stroke: '#fff', 'stroke-width': 1.6, 'stroke-dasharray': '7 12', 'stroke-linecap': 'round', opacity: 0 }, svg);

    U.bi({ x: 161, y: 276, 'font-size': 11, 'text-anchor': 'middle', fill: P.mut }, '開放式燒杯——液體就在空氣裡', 'Open beaker — fluid sits in air', svg);

    /* ---- 右半：讀數錶 ---- */
    var GX = 368, GY = 118, GR = 62;
    r.GX = GX; r.GY = GY;
    U.el('circle', { cx: GX, cy: GY, r: GR + 12, fill: '#fff', stroke: P.mut, 'stroke-width': 2 }, svg);
    /* 刻度弧 210°→−30°（左低右高） */
    for (var ti = 0; ti <= 10; ti++) {
      var a = (210 - ti * 24) * Math.PI / 180;
      var x1 = GX + (GR - 8) * Math.cos(a), y1 = GY - (GR - 8) * Math.sin(a);
      var x2 = GX + GR * Math.cos(a), y2 = GY - GR * Math.sin(a);
      U.el('line', { x1: x1, y1: y1, x2: x2, y2: y2, stroke: ti >= 9 ? P.warn : P.mut, 'stroke-width': ti % 5 ? 1.2 : 2.2 }, svg);
      if (ti % 5 === 0) U.txt({ x: GX + (GR - 22) * Math.cos(a), y: GY - (GR - 22) * Math.sin(a) + 4, 'font-size': 10, 'text-anchor': 'middle', fill: ti >= 9 ? P.warn : P.mut }, String(ti * 10), svg);
    }
    /* 紅區（90–100） */
    var a90 = (210 - 9 * 24) * Math.PI / 180, a100 = (210 - 10 * 24) * Math.PI / 180;
    U.path('M' + (GX + (GR - 4) * Math.cos(a90)) + ' ' + (GY - (GR - 4) * Math.sin(a90)) +
      ' A' + (GR - 4) + ' ' + (GR - 4) + ' 0 0 1 ' + (GX + (GR - 4) * Math.cos(a100)) + ' ' + (GY - (GR - 4) * Math.sin(a100)),
      { fill: 'none', stroke: P.warn, 'stroke-width': 5, opacity: 0.55 }, svg);
    r.needle = U.el('line', { x1: GX, y1: GY, x2: GX + GR - 16, y2: GY, stroke: P.warn, 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
    U.el('circle', { cx: GX, cy: GY, r: 5, fill: P.warn }, svg);
    r.gaugeTxt = U.txt({ x: GX, y: GY + 34, 'font-size': 13, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 }, '', svg);
    U.bi({ x: GX, y: GY + 52, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, '抗力讀數', 'drag reading', svg);

    /* 橡膠警示 */
    r.stall = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: GX, y: 232, 'font-size': 11.5, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 700 }, '轉不動', 'can’t turn it', r.stall);

    /* 對照說明（錶下方，不壓燒杯註解） */
    r.bridge = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: GX, y: 252, 'font-size': 10, 'text-anchor': 'middle', fill: P.ink },
      '所以要密閉模腔＋加熱加壓（木尼）',
      'hence the sealed, heated, pressurized Mooney die', r.bridge);

    return r;
  },

  apply: function (r, ctx) {
    var P = MW.PAL, v = ctx.params.visc;
    var fl = this._fluid(v, P);
    var spin = this._spin(v);

    /* 液體色＋名 */
    r.liquid.setAttribute('fill', fl.col);
    r.surface.setAttribute('fill', fl.col);

    /* 轉子角：alwaysTick 的 ctx.t 連續轉；橡膠只剩原地抖 */
    var ang = v >= 99.5
      ? Math.sin(ctx.t * 6) * 6
      : ctx.t * 120 * spin;
    r.rotorG.setAttribute('transform', 'translate(0 205)');
    r.rotorMark.setAttribute('transform', 'rotate(' + (ang % 360).toFixed(1) + ' 161 0)');

    /* 旋渦：dashoffset 走動＝環流；稀的快滿杯、黏的只貼轉子 */
    var off = -ctx.t * 60 * spin;
    var rx1 = 40, ry1 = 15;
    var cx = 161, cyv = 208;
    r.swirl1.setAttribute('d', 'M' + (cx - rx1) + ' ' + cyv + ' a' + rx1 + ' ' + ry1 + ' 0 1 0 ' + (rx1 * 2) + ' 0 a' + rx1 + ' ' + ry1 + ' 0 1 0 ' + (-rx1 * 2) + ' 0');
    r.swirl2.setAttribute('d', 'M' + (cx - 28) + ' ' + (cyv - 14) + ' a28 10 0 1 0 56 0 a28 10 0 1 0 -56 0');
    r.swirl1.setAttribute('stroke-dashoffset', off.toFixed(1));
    r.swirl2.setAttribute('stroke-dashoffset', (off * 1.4).toFixed(1));
    r.swirl1.setAttribute('opacity', v >= 99.5 ? 0 : Math.min(0.75, 0.25 + spin * 0.6));
    r.swirl2.setAttribute('opacity', v >= 99.5 ? 0 : Math.min(0.6, 0.2 + spin * 0.5));

    /* 轉向箭頭：轉速→角速度縮放視覺（簡化：轉得動才亮） */
    r.spinArrow.setAttribute('opacity', v >= 99.5 ? 0.25 : 0.9);

    /* 錶針：粘度→角度（0→210°、100→−30°） */
    var na = (210 - Math.min(100, v) * 2.4) * Math.PI / 180;
    var GX = r.GX, GY = r.GY, GR = 62;
    r.needle.setAttribute('x2', GX + (GR - 16) * Math.cos(na));
    r.needle.setAttribute('y2', GY - (GR - 16) * Math.sin(na));
    r.gaugeTxt.textContent = v >= 99.5 ? 'MAX' : String(Math.round(v));
    r.stall.setAttribute('opacity', v >= 99.5 ? 1 : 0);
    r.bridge.setAttribute('opacity', v >= 99.5 ? 1 : 0);
  },

  readout: function (ctx) {
    var v = ctx.params.visc, fl = this._fluid(v, MW.PAL), spin = this._spin(v);
    return [
      ['流體 <b>' + fl.nm[0] + '</b>（粘度 ' + v + '）', 'Fluid <b>' + fl.nm[1] + '</b> (viscosity ' + v + ')'],
      v >= 99.5
        ? ['轉速 <b>0</b>——轉不動', 'Rotor speed <b>0</b> — can’t turn']
        : ['轉速 ≈ <b>' + (spin * 60).toFixed(0) + '</b> rpm', 'Rotor speed ≈ <b>' + (spin * 60).toFixed(0) + '</b> rpm'],
      v >= 99.5
        ? ['抗力讀數 <b>破表</b>——儀器吃不消', 'Drag reading <b>pegged</b> — beyond the instrument']
        : ['抗力讀數 <b>' + Math.round(v) + '</b>', 'Drag reading <b>' + Math.round(v) + '</b>']
    ];
  },

  guide: function (ctx) {
    var v = ctx.params.visc;
    if (v >= 99.5) return ['橡膠放進來：轉子原地抖、錶針打到紅區——這就是為什麼橡膠要用密閉模腔的木尼粘度計，不是這種開放式黏度計。',
      'Drop rubber in: the rotor just twitches and the needle pegs — that is why rubber needs the sealed-die Mooney, not an open viscometer.'];
    if (v < 8) return ['水幾乎沒有抗力——轉子飛轉、讀數貼零。一般流體用這台就夠。', 'Water gives almost no drag — the rotor spins freely and the reading hugs zero. An open viscometer is enough for ordinary fluids.'];
    return ['黏一點的流體：轉子被拖慢、錶針爬高——抗力讀數就是粘度的量測。', 'A thicker fluid drags the rotor down and the needle climbs — the drag reading is the viscosity measurement.'];
  }
});
