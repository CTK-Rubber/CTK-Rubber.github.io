/* mw-a-energy.js — 專題A 核心 · (a+1) 是儲能項的指數（依 Maláč Eq.8 自繪）
   左面板：log–log 上 M = k·t^a（k 固定 50），a 拉桿轉斜率，所有線都過 (1 s, 50)。
   右面板：儲能釋放 Es = k/(a+1)·(t^(a+1) − 1) 累積曲線，虛線 t¹ = (a+1)=1 理論上限。
   互動：拖 a——左圖斜率與右圖儲能曲線一起變；(a+1) 越大越貼近上限＝彈性越強。 */
MW.register('a-energy', {
  vb: [[380, 280], [380, 280]],
  hint: ['拖「鬆弛指數 a」拉桿——左圖斜率與右圖儲能曲線一起變', 'Drag the a slider — the decay slope and the stored-energy curve move together'],

  params: [
    { key: 'a', type: 'range', min: -0.45, max: -0.15, step: 0.01, def: -0.25,
      zh: '鬆弛指數 a', en: 'relaxation exponent a',
      fmt: function (v) { return '−' + Math.abs(v).toFixed(2); } }
  ],

  build: function (svgs, U) {
    var P = U.PAL, r = {};

    /* ===== 左面板：log–log 衰減 ===== */
    var s0 = svgs[0];
    var LX0 = 46, LX1 = 368, LY0 = 248, LY1 = 24;
    var T1 = 1, T2 = 100, MLO = 6, MHI = 60;
    var LX = function (t) { return LX0 + (Math.log(t) / Math.LN10 - 0) / 2 * (LX1 - LX0); };
    var LY = function (m) { return LY0 - (Math.log(m) / Math.LN10 - Math.log(MLO) / Math.LN10) / (Math.log(MHI) / Math.LN10 - Math.log(MLO) / Math.LN10) * (LY0 - LY1); };
    r.LX = LX; r.LY = LY;

    U.el('rect', { x: 0, y: 0, width: 380, height: 280, fill: '#fff' }, s0);
    U.bi({ x: (LX0 + LX1) / 2, y: 13, 'font-size': 11, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 },
      '扭矩衰減（log–log）：M = 50·t^a', 'torque decay (log–log): M = 50·t^a', s0);

    /* x 軸 log ticks：1, 10, 100 s */
    [1, 10, 100].forEach(function (t) {
      U.el('line', { x1: LX(t), y1: LY0, x2: LX(t), y2: LY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, s0);
      U.txt({ x: LX(t), y: LY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), s0);
      U.el('line', { x1: LX(t), y1: LY1, x2: LX(t), y2: LY0, stroke: P.grid, 'stroke-width': 0.7 }, s0);
    });
    /* y 軸 log ticks */
    [10, 20, 50].forEach(function (m) {
      U.el('line', { x1: LX0, y1: LY(m), x2: LX1, y2: LY(m), stroke: P.grid, 'stroke-width': 0.7 }, s0);
      U.txt({ x: LX0 - 5, y: LY(m) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(m), s0);
    });
    U.el('line', { x1: LX0, y1: LY0, x2: LX1, y2: LY0, stroke: P.mut, 'stroke-width': 1.2 }, s0);
    U.el('line', { x1: LX0, y1: LY1 - 4, x2: LX0, y2: LY0, stroke: P.mut, 'stroke-width': 1.2 }, s0);
    U.bi({ x: (LX0 + LX1) / 2, y: LY0 + 27, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut },
      '停轉後秒數 t (s)', 'time after rotor stops t (s)', s0);
    U.txt({ x: LX0 - 5, y: LY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'MU', s0);

    /* 18 品級實測範圍的兩條虛線界：a=−0.20（最彈）、a=−0.38（最黏） */
    [[-0.20, 'a=−0.20（最彈）', 'a=−0.20 (most elastic)'], [-0.38, 'a=−0.38（最黏）', 'a=−0.38 (most viscous)']].forEach(function (b, i) {
      var y2 = LY(50 * Math.pow(100, b[0]));
      U.el('line', { x1: LX(1), y1: LY(50), x2: LX(100), y2: y2, stroke: P.mut, 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: 0.55 }, s0);
      var g = U.el('g', {}, s0);
      U.bi({ x: LX(100) - 2, y: y2 + (i ? 12 : -4), 'font-size': 9, 'text-anchor': 'end', fill: P.mut }, b[1], b[2], g);
    });

    /* 主衰減線＋樞紐點（k=50 → 所有線都過 t=1, M=50） */
    r.decay = U.el('line', { x1: LX(1), y1: LY(50), x2: LX(100), y2: LY(50), stroke: P.acc, 'stroke-width': 2.4 }, s0);
    U.el('circle', { cx: LX(1), cy: LY(50), r: 4, fill: P.acc2, stroke: '#fff', 'stroke-width': 1.2 }, s0);
    U.bi({ x: LX(1) + 6, y: LY(50) - 8, 'font-size': 9.5, fill: P.acc2 }, 'k = 50（t=1s）', 'k = 50 (t = 1 s)', s0);
    r.decayVal = U.txt({ x: 0, y: 0, 'font-size': 10, fill: P.acc, 'font-weight': 700 }, '', s0);

    /* ===== 右面板：儲能釋放 Es ===== */
    var s1 = svgs[1];
    var RX0 = 46, RX1 = 368, RY0 = 248, RY1 = 24;
    var ES_MAX = 5000;   /* t¹ 上限在 t=100 的值：k·(100−1)≈4950 */
    var RX = function (t) { return RX0 + t / 100 * (RX1 - RX0); };
    var RY = function (e) { return RY0 - e / ES_MAX * (RY0 - RY1); };
    r.RX = RX; r.RY = RY;

    U.el('rect', { x: 0, y: 0, width: 380, height: 280, fill: '#fff' }, s1);
    U.bi({ x: (RX0 + RX1) / 2, y: 13, 'font-size': 11, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 },
      '累積儲能釋放 Es ∝ t^(a+1) / (a+1)', 'cumulative stored-energy release Es ∝ t^(a+1) / (a+1)', s1);

    [0, 20, 40, 60, 80, 100].forEach(function (t) {
      U.el('line', { x1: RX(t), y1: RY0, x2: RX(t), y2: RY0 + 4, stroke: P.mut, 'stroke-width': 0.8 }, s1);
      U.txt({ x: RX(t), y: RY0 + 14, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, String(t), s1);
      if (t) U.el('line', { x1: RX(t), y1: RY1, x2: RX(t), y2: RY0, stroke: P.grid, 'stroke-width': 0.7 }, s1);
    });
    [0, 2500, 5000].forEach(function (e) {
      U.el('line', { x1: RX0, y1: RY(e), x2: RX1, y2: RY(e), stroke: e ? P.grid : P.mut, 'stroke-width': e ? 0.7 : 1.2 }, s1);
      U.txt({ x: RX0 - 5, y: RY(e) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, String(e / 1000) + 'k', s1);
    });
    U.el('line', { x1: RX0, y1: RY1 - 4, x2: RX0, y2: RY0, stroke: P.mut, 'stroke-width': 1.2 }, s1);
    U.bi({ x: (RX0 + RX1) / 2, y: RY0 + 27, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut },
      '停轉後秒數 t (s)', 'time after rotor stops t (s)', s1);
    U.bi({ x: RX0 - 5, y: RY1 - 8, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, 'Es（任意單位）', 'Es (arb. units)', s1);

    /* 虛線 t¹：理論上限 (a+1)=1（儲能完全不衰減） */
    U.el('line', { x1: RX(1), y1: RY(0), x2: RX(100), y2: RY(4950), stroke: P.mut, 'stroke-width': 1.4, 'stroke-dasharray': '7 5' }, s1);
    U.bi({ x: RX(55), y: RY(50 * (55 - 1)) + 15, 'font-size': 10, fill: P.mut }, '虛線 t¹——上限 (a+1)=1', 'dashed t¹ — limit (a+1)=1', s1);

    r.es = U.path('', { fill: 'none', stroke: P.ok, 'stroke-width': 2.4 }, s1);
    r.esDot = U.el('circle', { cx: 0, cy: 0, r: 4, fill: P.ok, stroke: '#fff', 'stroke-width': 1.2 }, s1);
    r.esVal = U.txt({ x: 0, y: 0, 'font-size': 10, fill: P.ok, 'font-weight': 700 }, '', s1);

    return r;
  },

  apply: function (r, ctx) {
    var a = ctx.params.a, a1 = a + 1;

    /* 左：log–log 直線（過樞紐 50） */
    var m2 = 50 * Math.pow(100, a);
    r.decay.setAttribute('x2', r.LX(100));
    r.decay.setAttribute('y2', r.LY(m2));
    r.decayVal.setAttribute('x', r.LX(100) - 4);
    r.decayVal.setAttribute('y', r.LY(m2) - 6);
    r.decayVal.setAttribute('text-anchor', 'end');
    r.decayVal.textContent = 'M(100s) ≈ ' + m2.toFixed(1);

    /* 右：Es(t) = 50/(a+1)·(t^(a+1) − 1)，t∈[1,100] */
    var d = '';
    for (var i = 0; i <= 80; i++) {
      var t = 1 + i / 80 * 99;
      var es = 50 / a1 * (Math.pow(t, a1) - 1);
      d += (i ? 'L' : 'M') + r.RX(t).toFixed(1) + ' ' + r.RY(es).toFixed(1) + ' ';
    }
    r.es.setAttribute('d', d);
    var esEnd = 50 / a1 * (Math.pow(100, a1) - 1);
    r.esDot.setAttribute('cx', r.RX(100));
    r.esDot.setAttribute('cy', r.RY(esEnd));
    r.esVal.setAttribute('x', r.RX(100) - 6);
    r.esVal.setAttribute('y', Math.max(30, r.RY(esEnd)) + (r.RY(esEnd) < 60 ? 12 : 4));
    r.esVal.setAttribute('text-anchor', 'end');
    r.esVal.textContent = '≈ ' + Math.round(esEnd);
  },

  readout: function (ctx) {
    var a = ctx.params.a, a1 = a + 1;
    var zone;
    if (a1 > 0.80) zone = ['比 18 品級最彈端（0.80）還彈', 'more elastic than the best measured grade (0.80)'];
    else if (a1 >= 0.62) zone = ['落在 18 品級實測範圍 0.62–0.80 內', 'inside the measured range of the 18 grades, 0.62–0.80'];
    else zone = ['比實測最黏端（0.62）還黏——ASTM 範例膠的 0.42 更低', 'more viscous than the most viscous measured grade (0.62) — the ASTM example sits lower at 0.42'];
    return [
      ['a = <b>−' + Math.abs(a).toFixed(2) + '</b>', 'a = <b>−' + Math.abs(a).toFixed(2) + '</b>'],
      ['彈性指數 (a+1) = <b>' + a1.toFixed(2) + '</b>', 'elasticity index (a+1) = <b>' + a1.toFixed(2) + '</b>'],
      [zone[0], zone[1]]
    ];
  },

  guide: function (ctx) {
    var a1 = ctx.params.a + 1;
    if (a1 > 0.80) return ['右圖曲線快貼上 t¹ 虛線了——這種膠的彈性儲能釋放最持久。', 'The right-hand curve nearly hugs the t¹ dashed line — this rubber releases its stored elastic energy the longest.'];
    if (a1 >= 0.62) return ['(a+1) 越大，右圖越貼近 t¹ 直線——儲能釋放越持久，就是彈性越強。', 'Larger (a+1) pulls the right-hand curve toward the t¹ line — longer-sustained energy release means stronger elasticity.'];
    return ['(a+1) 小於實測範圍——曲線早早彎平，儲能一下放完，是偏黏的膠。', 'Below the measured range — the curve flattens early; the stored energy is spent quickly, a viscous-leaning rubber.'];
  }
});
