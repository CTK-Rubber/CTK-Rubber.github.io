/* mw-spec-band.js — §1 規格帶判定互動圖（widget 參考實作）
   故事：規格寫 50±5（綠色帶 45–55），這批膠平穩在 72——收還是不收？
   互動：分階畫入 → 拉桿換一批膠 → 判定即時變；hover 看曲線任一點。 */
MW.register('spec-band', {
  vb: [520, 300],
  hint: ['拖「這批膠的 ML」拉桿換一批膠，看判定怎麼變', 'Drag the lot slider to see the verdict change'],

  stages: [
    { dur: 1.6, zh: ['規格在哪', '進料規格寫 ML 50±5——圖上綠色帶就是 45–55 的合格窗。'],
             en: ['Where the spec sits', 'The spec reads ML 50±5 — the green band is the 45–55 acceptance window.'] },
    { dur: 3.0, zh: ['這批的量測', '這批膠的扭矩曲線：轉子啟動衝高後一路降，第 4 分鐘平穩值落點就是 ML。'],
             en: ['This lot’s curve', 'The lot’s torque curve: a startup spike, then decay — the plateau at minute 4 is the ML.'] },
    { dur: 2.0, zh: ['對起來看', '平穩值 72，整條墊在規格帶上緣之外——超出上限 17 個單位。'],
             en: ['Line them up', 'The plateau lands at 72 — above the band, 17 units over the limit.'] },
    { dur: 1.6, zh: ['換你試', '用下面的拉桿把這批膠換一個值，看判定什麼時候翻。'],
             en: ['Your turn', 'Use the slider below to give this lot a different value and watch the verdict flip.'] }
  ],

  params: [
    { key: 'lot', type: 'range', min: 30, max: 90, step: 1, def: 72,
      zh: '這批膠的 ML', en: 'Lot ML', fmt: function (v) { return v + ' MU'; } }
  ],

  scrub: { panel: 0, x0: 46, x1: 508, fn: function (x01, st) {
    /* hover 只看時間位置：把 u 映射到第二段內（曲線段），不改 lot */
    st.u = Math.max(0, Math.min(1, 0.30 + x01 * 0.55));
  } },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 46, PX1 = 508, PY0 = 262, PY1 = 18;
    var T_END = 5, M_MAX = 110;
    var X = function (t) { return PX0 + (t / T_END) * (PX1 - PX0); };
    var Y = function (m) { return PY0 - (m / M_MAX) * (PY0 - PY1); };
    r.X = X; r.Y = Y; r.PX0 = PX0; r.PX1 = PX1; r.PY0 = PY0; r.PY1 = PY1; r.T_END = T_END;

    U.el('rect', { x: 0, y: 0, width: 520, height: 300, fill: '#fff' }, svg);

    /* 規格帶 */
    r.band = U.el('rect', { x: X(0), y: Y(55), width: PX1 - PX0, height: Y(45) - Y(55), fill: P.ok, opacity: 0.14 }, svg);
    r.bandEdge = U.el('line', { x1: X(0), y1: Y(55), x2: PX1, y2: Y(55), stroke: P.ok, 'stroke-width': 1.2, 'stroke-dasharray': '5 4', opacity: 0 }, svg);
    r.bandLbl = U.el('g', { opacity: 0 }, svg);
    U.bi({ x: X(0.15), y: Y(57), 'font-size': 11, fill: P.ok, 'font-weight': 600 }, '規格帶 45–55', 'spec window 45–55', r.bandLbl);

    /* 網格＋軸 */
    [0, 25, 50, 75, 100].forEach(function (m) {
      U.el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: P.grid, 'stroke-width': m ? 0.8 : 1.4 }, svg);
      U.txt({ x: PX0 - 6, y: Y(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), svg);
    });
    for (var t = 0; t <= 5; t++) {
      U.el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, svg);
      U.txt({ x: X(t), y: PY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), svg);
    }
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.txt({ x: PX1, y: PY0 + 26, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'min', svg);
    U.txt({ x: PX0 - 6, y: PY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'MU', svg);

    /* 曲線（clip 揭露） */
    var clip = U.el('clipPath', { id: 'sbclip' + U.uid }, svg);
    r.clipRect = U.el('rect', { x: PX0, y: 0, width: 0, height: 300 }, clip);
    r.curve = U.path('', { fill: 'none', stroke: P.acc, 'stroke-width': 2.4, 'clip-path': 'url(#sbclip' + U.uid + ')' }, svg);

    /* 平穩值標示 */
    r.platLine = U.el('line', { x1: X(4), y1: Y(72), x2: PX1, y2: Y(72), stroke: P.acc2, 'stroke-width': 1.4, 'stroke-dasharray': '6 4', opacity: 0 }, svg);
    r.platDot = U.el('circle', { cx: X(4.4), cy: Y(72), r: 5, fill: 'none', stroke: P.acc2, 'stroke-width': 2, opacity: 0 }, svg);
    r.delta = U.el('g', { opacity: 0 }, svg);
    r.deltaLine = U.el('line', { x1: X(4.75), y1: Y(55), x2: X(4.75), y2: Y(72), stroke: P.warn, 'stroke-width': 1.6 }, r.delta);
    r.deltaTxt = U.txt({ x: X(4.8), y: Y(64), 'font-size': 11, fill: P.warn, 'font-weight': 700 }, '', r.delta);

    /* 游標 */
    r.cursor = U.el('g', {}, svg);
    r.curLine = U.el('line', { x1: PX0, y1: PY1, x2: PX0, y2: PY0, stroke: P.acc, 'stroke-width': 0.9, 'stroke-dasharray': '3 3', opacity: 0.5 }, r.cursor);
    r.curDot = U.el('circle', { cx: PX0, cy: PY0, r: 4, fill: P.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);

    return r;
  },

  /* 這批膠的扭矩曲線：尖峰 ≈ 平穩值 × 1.32，第 4 分鐘收在平穩值 */
  _torque: function (t, lot) {
    if (t < 1) return 0;
    var pk = lot * 1.32;
    if (t < 1.15) { var u = (t - 1) / 0.15; return pk * (1 - Math.pow(1 - u, 3)); }
    if (t < 4) return lot + (pk - lot) * Math.exp(-1.15 * (t - 1.15));
    return lot;
  },

  apply: function (r, ctx) {
    var lot = ctx.params.lot, P = MW.PAL;
    var X = r.X, Y = r.Y, T_END = r.T_END;

    /* 曲線形狀跟 lot 走 */
    var d = '';
    for (var i = 0; i <= 300; i++) {
      var tt = i / 300 * T_END;
      d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(this._torque(tt, lot)).toFixed(1) + ' ';
    }
    r.curve.setAttribute('d', d);

    /* 各階段揭露 */
    var s = ctx.s, sp = ctx.sp;
    r.band.setAttribute('opacity', s >= 0 ? 0.14 : 0);
    r.bandEdge.setAttribute('opacity', s >= 0 ? 0.8 : 0);
    r.bandLbl.setAttribute('opacity', s >= 0 ? Math.min(1, sp * 2) : 0);

    /* 曲線在第 1 段開始畫；畫的比例 = 第 1~2 段的合成進度 */
    var drawP = s === 0 ? 0 : (s === 1 ? sp : 1);
    var drawT = drawP * T_END;
    r.clipRect.setAttribute('width', Math.max(0, X(drawT) - r.PX0));

    /* 平穩標示第 2 段起 */
    var showP = s >= 2 ? Math.min(1, sp * 2.5) : 0;
    r.platLine.setAttribute('opacity', showP * 0.8);
    r.platLine.setAttribute('y1', Y(lot)); r.platLine.setAttribute('y2', Y(lot));
    r.platLine.setAttribute('x1', X(3.9));
    r.platDot.setAttribute('cy', Y(lot));
    r.platDot.setAttribute('opacity', showP);

    /* 落差標示：在規格外才出現 */
    var over = lot - 55, under = 45 - lot;
    r.delta.setAttribute('opacity', (s >= 2 && (over > 0 || under > 0)) ? Math.min(1, sp * 2.5) : 0);
    if (over > 0) {
      r.deltaLine.setAttribute('y1', Y(55)); r.deltaLine.setAttribute('y2', Y(lot));
      r.deltaTxt.setAttribute('y', Y((55 + lot) / 2) + 4);
      r.deltaTxt.textContent = '+' + over;
    } else if (under > 0) {
      r.deltaLine.setAttribute('y1', Y(lot)); r.deltaLine.setAttribute('y2', Y(45));
      r.deltaTxt.setAttribute('y', Y((45 + lot) / 2) + 4);
      r.deltaTxt.textContent = '−' + under;
    }

    /* 游標跟著揭露位置 */
    var ct = s >= 1 ? drawT : 0;
    r.curLine.setAttribute('x1', X(ct)); r.curLine.setAttribute('x2', X(ct));
    r.curDot.setAttribute('cx', X(ct));
    r.curDot.setAttribute('cy', Y(this._torque(ct, lot)));
    r.cursor.setAttribute('opacity', s >= 1 ? 1 : 0);
  },

  readout: function (ctx) {
    var lot = ctx.params.lot;
    var verdict, cls;
    if (lot > 55) verdict = ['超出上限 ' + (lot - 55) + '——退貨或協議放行', 'Over limit by ' + (lot - 55) + ' — reject or negotiate'];
    else if (lot < 45) verdict = ['低於下限 ' + (45 - lot) + '——先查測試條件', 'Under limit by ' + (45 - lot) + ' — check test conditions first'];
    else verdict = ['規格內——收', 'Within spec — accept'];
    return [
      ['這批 ML = <b>' + lot + '</b> MU', 'Lot ML = <b>' + lot + '</b> MU'],
      ['規格 <b>45–55</b>', 'Spec <b>45–55</b>'],
      [verdict[0], verdict[1]]
    ];
  },

  guide: function (ctx) {
    if (ctx.s >= 3) {
      var lot = ctx.params.lot;
      if (lot > 55) return ['現在是「規格外偏硬」——產線會難推、耗能高；先核對量測條件一致再談退貨。', 'Now the lot is over-spec and stiff — harder to push, higher energy. Verify matching test conditions before rejecting.'];
      if (lot < 45) return ['低於下限多半是量測條件或試片問題——先查再判。', 'Below the limit usually means a condition or specimen issue — check before judging.'];
      return ['落在帶內——但記住：規格內只保證「難不難推」這一面。', 'Inside the band — but remember: in-spec only covers the "hard to push" side.'];
    }
    return null;
  }
});
