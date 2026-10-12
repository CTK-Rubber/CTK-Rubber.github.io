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
    var svg = svgs[0], P = U.PAL, r = { TILT: 72, PIVX: 31, PIVY: 52 };
    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 杯組：杯體繞右下緣（杯嘴側底部）傾倒——真實傾倒的支點在杯緣不在中心。
       液面永遠水平：液體畫在「世界座標」裡、用旋轉後的杯內緣當 clip——
       杯子斜、液面不斜（CT 2026-10-12 指出前版液面跟著杯斜＝物理錯誤）。 */
    function cup(cx, col) {
      var c = { cx: cx };
      c.clip = U.el('clipPath', { id: 'cupclip' + U.uid + cx }, svg);
      c.clipPath = U.path('', {}, c.clip);
      c.g = U.el('g', {}, svg);
      U.el('rect', { x: -34, y: -56, width: 68, height: 108, rx: 9, fill: '#fff', stroke: 'none', opacity: 0.85 }, c.g);
      U.path('M30 -56 L46 -48 L33 -40', { fill: '#fff', opacity: 0.85 }, c.g);            /* 杯嘴體 */
      /* 液體：世界座標水平面矩形，被旋轉杯內緣裁切 */
      c.liquid = U.el('rect', { x: cx - 80, y: 0, width: 160, height: 0, fill: col, 'clip-path': 'url(#cupclip' + U.uid + cx + ')' }, svg);
      /* 杯體描線＋嘴 */
      U.el('rect', { x: -34, y: -56, width: 68, height: 108, rx: 9, fill: 'none', stroke: P.mut, 'stroke-width': 2.2 }, c.g);
      U.path('M30 -56 L46 -48 L33 -40', { fill: 'none', stroke: P.mut, 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, c.g);
      /* 杯內液面高光 */
      c.sheen = U.el('line', { stroke: '#fff', 'stroke-width': 1.2, opacity: 0 }, svg);
      /* 液線＋斷點滴 */
      c.stream = U.path('', { fill: 'none', 'stroke-linecap': 'round', opacity: 0 }, svg);
      c.drops = [];
      for (var i = 0; i < 3; i++) c.drops.push(U.el('circle', { r: 2.6, fill: col, opacity: 0 }, svg));
      c.puddle = U.el('ellipse', { cx: 0, cy: 259, rx: 5, ry: 2.4, fill: col, opacity: 0 }, svg);
      c.puddleIn = U.el('ellipse', { cx: 0, cy: 258, rx: 3, ry: 1.6, fill: col, opacity: 0 }, svg);
      c.blob = U.el('circle', { cx: 0, cy: 0, r: 4.5, fill: col, opacity: 0 }, svg);
      return c;
    }

    /* 接盤 */
    function tray(tx) {
      U.path('M' + (tx - 56) + ' 252 L' + (tx + 56) + ' 252 L' + (tx + 44) + ' 268 L' + (tx - 44) + ' 268 Z',
        { fill: P.soft, stroke: P.mut, 'stroke-width': 1.6, 'stroke-linejoin': 'round' }, svg);
    }
    r.txL = 203; r.txR = 423;
    tray(r.txL); tray(r.txR);

    r.cupL = cup(135, P.acc); r.cupR = cup(355, P.rub);
    r.cupL.puddle.setAttribute('cx', r.txL); r.cupL.puddleIn.setAttribute('cx', r.txL);
    r.cupR.puddle.setAttribute('cx', r.txR); r.cupR.puddleIn.setAttribute('cx', r.txR);

    /* 杯名 */
    U.bi({ x: 135, y: 26, 'font-size': 12.5, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 600 }, '水', 'water', svg);
    r.nmRzh = U.txt({ x: 355, y: 26, 'font-size': 12.5, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 600 }, '蜂蜜', svg, 'zh');
    r.nmRen = U.txt({ x: 355, y: 26, 'font-size': 12.5, 'text-anchor': 'middle', fill: P.mut, 'font-weight': 600 }, 'honey', svg, 'en');

    /* 橡膠標語 */
    r.note = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: r.txR, y: 235, 'font-size': 11, 'text-anchor': 'middle', fill: P.warn, 'font-weight': 700 }, '不會自己流', 'won’t flow on its own', r.note);

    return r;
  },

  /* 局部座標→世界座標（杯組 transform＝translate(cx,96)·rotate(tilt,31,52)） */
  _w: function (cx, tilt, x, y) {
    var rad = tilt * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    return [cx + 31 + (x - 31) * cos - (y - 52) * sin,
            96 + 52 + (x - 31) * sin + (y - 52) * cos];
  },

  apply: function (r, ctx) {
    var P = MW.PAL, v = ctx.params.visc;
    var elapsed = ctx.u * 8;
    var tu = Math.min(1, elapsed / 0.8);
    var tilt = r.TILT * tu * (2 - tu);
    var ptR = this._pourTime(v);
    var fl = this._fluid(v, P);

    r.nmRzh.textContent = fl.nm[0]; r.nmRen.textContent = fl.nm[1];
    r.note.setAttribute('opacity', v >= 99.5 ? 1 : 0);

    /* 杯內緣四角（局部）＋杯嘴出水點 */
    var CORNERS = [[-29, -48], [28, -48], [28, 48], [-29, 48]];
    var LIP = [40, -47];

    var cups = [
      [r.cupL, 1,   P.acc,  r.txL, 1],
      [r.cupR, ptR, fl.col, r.txR, v]
    ];
    for (var ci = 0; ci < 2; ci++) {
      var c = cups[ci][0], pt = cups[ci][1], col = cups[ci][2], tx = cups[ci][3], vv = cups[ci][4];
      c.g.setAttribute('transform', 'translate(' + c.cx + ' 96) rotate(' + tilt.toFixed(1) + ' ' + r.PIVX + ' ' + r.PIVY + ')');

      /* 旋轉後杯內緣多邊形（世界座標）→ 更新 clip */
      var dclip = '', minY = 1e9, maxY = -1e9;
      for (var k = 0; k < 4; k++) {
        var w = this._w(c.cx, tilt, CORNERS[k][0], CORNERS[k][1]);
        dclip += (k ? 'L' : 'M') + w[0].toFixed(1) + ' ' + w[1].toFixed(1);
        if (w[1] < minY) minY = w[1];
        if (w[1] > maxY) maxY = w[1];
      }
      c.clipPath.setAttribute('d', dclip + 'Z');

      /* 剩餘量 f → 世界水平液面 y（液面永遠水平，clip 決定它在杯內的形狀） */
      var p = pt === Infinity ? 0 : Math.max(0, Math.min(1, (elapsed - 0.8) / pt));
      var f = pt === Infinity ? 0.9 : Math.max(0, 1 - p * 0.97);
      var surfY = maxY - f * (maxY - minY);
      c.liquid.setAttribute('y', surfY.toFixed(1));
      c.liquid.setAttribute('height', (300 - surfY).toFixed(1));
      c.liquid.setAttribute('fill', col);
      c.sheen.setAttribute('opacity', f > 0.02 ? 0.5 : 0);

      /* 杯嘴出水點（世界座標） */
      var lip = this._w(c.cx, tilt, LIP[0], LIP[1]);
      var sx = lip[0], sy = lip[1];

      /* 液線：出水→盤面；黏的粗而繩、稀的細而直；末段變細斷開 */
      var fAll = pt === Infinity ? 0 : Math.min(1, p / 0.06);          /* 伸到盤面的進度 */
      var wob = Math.sin(ctx.t * (vv > 60 ? 2.2 : 9) + c.cx) * (vv > 60 ? 1.2 : 3 * (1 - Math.min(1, vv / 110)));
      var exx = sx + (tx - sx) * fAll, eyy = sy + (258 - sy) * fAll;
      var mx = (sx + exx) / 2 + wob, my = (sy + eyy) / 2 + 6;
      var taper = p < 0.06 ? p / 0.06 : (p > 0.88 ? Math.max(0, (1 - p) / 0.12) : 1);
      var wbase = 1.6 + 4.2 * Math.min(1, vv / 100);                   /* 黏→繩狀粗流 */
      c.stream.setAttribute('d', 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) +
        ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + exx.toFixed(1) + ' ' + eyy.toFixed(1));
      c.stream.setAttribute('stroke', col);
      c.stream.setAttribute('stroke-width', (wbase * taper).toFixed(1));
      c.stream.setAttribute('opacity', (p > 0 && p < 0.94 && pt !== Infinity) ? 0.92 : 0);

      /* 末段斷點滴：沿落下路徑錯開墜落（黏的滴得慢） */
      var dripPh = p > 0.86 && p < 1 && pt !== Infinity;
      for (var di = 0; di < 3; di++) {
        var dr = c.drops[di];
        if (dripPh) {
          var ph = ((ctx.t * (vv > 60 ? 1.4 : 3.2)) + di * 0.37) % 1;
          var px = sx + (tx - sx) * ph, py = sy + (258 - sy) * ph * ph;
          dr.setAttribute('cx', px.toFixed(1)); dr.setAttribute('cy', py.toFixed(1));
          dr.setAttribute('r', (2.6 + Math.min(1, vv / 100) * 1.4).toFixed(1));
          dr.setAttribute('opacity', 0.85 * (1 - ph * 0.5)); dr.setAttribute('fill', col);
        } else dr.setAttribute('opacity', 0);
      }

      /* 盤中積液：水攤平薄、蜜堆高成丘 */
      var spread = 46 * Math.pow(p, 0.7) * (1 - Math.min(0.55, vv / 180));
      var mound = 2.4 + Math.pow(p, 0.8) * (2 + vv / 9);
      c.puddle.setAttribute('rx', (5 + spread).toFixed(1));
      c.puddle.setAttribute('ry', mound.toFixed(1));
      c.puddle.setAttribute('cy', (261 - mound).toFixed(1));
      c.puddle.setAttribute('opacity', Math.min(1, p * 5) * 0.8);
      c.puddle.setAttribute('fill', col);
      c.puddleIn.setAttribute('cx', tx);
      c.puddleIn.setAttribute('rx', (3 + spread * 0.55).toFixed(1));
      c.puddleIn.setAttribute('ry', (mound * 0.55).toFixed(1));
      c.puddleIn.setAttribute('cy', (260 - mound).toFixed(1));
      c.puddleIn.setAttribute('opacity', Math.min(1, p * 5) * 0.35);
      c.puddleIn.setAttribute('fill', '#fff');

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
