/* mw-a-grades.js — 專題A · 18 品級的 (a+1) 排序（Maláč 2011 Table 1 原值；Fig. 11）
   故事：(a+1) 恆正、越大越彈；18 品級全落在 0.62–0.80——偏彈但沒有一個接近「純彈」1.0。
   互動：hover 任一長條看品級名與值；虛線是理論上限 1.0。 */
MW.register('a-grades', {
  vb: [560, 300],
  hint: ['滑到長條上看是哪個品級', 'Hover a bar to see which grade it is'],

  scrub: { panel: 0, fn: function (x01, st) {
    var px = x01 * 560;
    var i = Math.floor((px - 42) / ((550 - 42) / 18));
    st.params.hov = Math.max(-1, Math.min(17, (px < 40 || px > 552) ? -1 : i));
  } },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = {};
    var PX0 = 42, PX1 = 552, PY0 = 232, PY1 = 30;
    var VMAX = 1.0;
    var Y = function (v) { return PY0 - v / VMAX * (PY0 - PY1); };
    var pitch = (PX1 - PX0) / 18, bw = pitch - 6;
    r.PX0 = PX0; r.PY0 = PY0; r.Y = Y; r.pitch = pitch;

    U.el('rect', { x: 0, y: 0, width: 560, height: 300, fill: '#fff' }, svg);
    U.bi({ x: (PX0 + PX1) / 2, y: 14, 'font-size': 12, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 },
      '18 品級的彈性指數 (a+1)——按值排序', '(a+1) elasticity index of the 18 grades — ranked', svg);

    /* 網格＋軸（0–1.0） */
    var yl = ['0', '.25', '.50', '.75', '1.0'];
    [0, 0.25, 0.5, 0.75, 1.0].forEach(function (v, i) {
      U.el('line', { x1: PX0, y1: Y(v), x2: PX1, y2: Y(v), stroke: v ? P.grid : P.mut, 'stroke-width': v ? 0.8 : 1.2 }, svg);
      U.txt({ x: PX0 - 6, y: Y(v) + 3, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, yl[i], svg);
    });
    U.el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: P.mut, 'stroke-width': 1.2 }, svg);
    U.bi({ x: PX0 - 6, y: PY1 - 10, 'font-size': 10, 'text-anchor': 'end', fill: P.mut }, '(a+1)', '(a+1)', svg);

    /* 理論上限 1.0 虛線 */
    U.el('line', { x1: PX0, y1: Y(1), x2: PX1, y2: Y(1), stroke: P.warn, 'stroke-width': 1.4, 'stroke-dasharray': '7 5' }, svg);
    U.bi({ x: PX1 - 4, y: Y(1) - 6, 'font-size': 10, 'text-anchor': 'end', fill: P.warn },
      '理論上限 1.0＝儲能完全不衰減', 'theoretical max 1.0 = stored energy never decays', svg);

    /* 18 條（(a+1) 降冪排序）＋旋轉品級名 */
    r.bars = []; r.order = A_GRD_ORD;
    for (var i = 0; i < 18; i++) {
      var gi = r.order[i], v = A_GRD_T[gi][5];
      var x = PX0 + i * pitch + 3;
      var bar = U.el('rect', {
        x: x.toFixed(1), y: Y(v).toFixed(1), width: bw.toFixed(1),
        height: (PY0 - Y(v)).toFixed(1), fill: P.ok, opacity: 0.6
      }, svg);
      r.bars.push(bar);
      /* 品級名（旋轉避免擁擠） */
      var nx = x + bw / 2;
      U.txt({ x: nx, y: PY0 + 6, 'font-size': 8.5, 'text-anchor': 'end', fill: P.mut,
              transform: 'rotate(-55 ' + nx.toFixed(1) + ' ' + (PY0 + 6) + ')' }, A_GRD_T[gi][0], svg);
      /* 名次編號在條內底部 */
      U.txt({ x: nx, y: PY0 - 4, 'font-size': 8, 'text-anchor': 'middle', fill: '#fff' }, String(i + 1), svg);
    }

    /* hover 值標籤 */
    r.valTxt = U.txt({ x: 0, y: 0, 'font-size': 11, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700, opacity: 0 }, '', svg);

    return r;
  },

  apply: function (r, ctx) {
    var hov = ctx.params.hov;
    if (hov == null) hov = -1;
    for (var i = 0; i < 18; i++) {
      var on = (i === hov);
      r.bars[i].setAttribute('opacity', hov < 0 ? 0.6 : (on ? 1 : 0.3));
      r.bars[i].setAttribute('stroke', on ? MW.PAL.ink : 'none');
    }
    if (hov >= 0) {
      var gi = r.order[hov], v = A_GRD_T[gi][5];
      var x = r.PX0 + hov * r.pitch + 3 + (r.pitch - 6) / 2;
      r.valTxt.setAttribute('x', x);
      r.valTxt.setAttribute('y', r.Y(v) - 8);
      r.valTxt.setAttribute('opacity', 1);
      r.valTxt.textContent = v.toFixed(2);
    } else {
      r.valTxt.setAttribute('opacity', 0);
    }
  },

  readout: function (ctx) {
    var hov = ctx.params.hov;
    if (hov == null || hov < 0) {
      return [
        ['全部落在 <b>0.62–0.80</b>，離上限 1.0 都還有距離', 'all within <b>0.62–0.80</b>, still far from the limit 1.0'],
        ['滑到長條上看品級', 'hover a bar for its grade']
      ];
    }
    var gi = A_GRD_ORD[hov];
    var g = A_GRD_T[gi];
    var tag = hov === 0 ? ['——18 品級中最彈', '— the most elastic of the 18']
            : hov === 17 ? ['——18 品級中最黏', '— the most viscous of the 18'] : ['', ''];
    return [
      ['#<b>' + (hov + 1) + '</b>/18　<b>' + g[0] + '</b>', '#<b>' + (hov + 1) + '</b>/18　<b>' + g[0] + '</b>'],
      ['(a+1) = <b>' + g[5].toFixed(2) + '</b>（a = −' + Math.abs(g[3]).toFixed(3) + '）' + tag[0],
       '(a+1) = <b>' + g[5].toFixed(2) + '</b> (a = −' + Math.abs(g[3]).toFixed(3) + ')' + tag[1]]
    ];
  },

  guide: function () {
    return ['(a+1) 恆為正值、越大越彈——天然膠全在中上段，但沒有一個品級接近「純彈」。',
            '(a+1) is always positive, higher means more elastic — all NR grades sit in the upper-middle band, none near "purely elastic".'];
  }
});

/* ---- 批次 S3 真值表（Maláč 2011 Table 1，18 品級全） ----
   [品級, 初始峰, ML, a, k, (a+1)] */
var A_GRD_T = [
  ['SVR 10, 1144', 120.7, 96.1, -0.211, 74.5, 0.79],
  ['NAT 10, 1045', 123.4, 94.8, -0.226, 72.2, 0.77],
  ['NAT 10, 1042', 131.3, 91.6, -0.248, 70.3, 0.75],
  ['NAT 10, 1046', 143.6, 94.0, -0.238, 73.0, 0.76],
  ['SMR L',        108.4, 64.8, -0.247, 40.9, 0.75],
  ['PAKRUB 10, 1022', 132.0, 97.3, -0.216, 75.5, 0.78],
  ['PAKRUB 10, 1025', 122.7, 94.6, -0.232, 71.7, 0.77],
  ['PAKRUB 10, 1024', 128.5, 96.8, -0.218, 73.9, 0.78],
  ['NR SVR 10',     62.2, 58.0, -0.251, 42.0, 0.75],
  ['NR SVR 3L',    179.0, 97.5, -0.201, 76.5, 0.80],
  ['NR PANRUB 5L', 198.7, 83.9, -0.254, 63.2, 0.75],
  ['NR SVR CV 60', 105.3, 62.6, -0.377, 44.5, 0.62],
  ['PANRUB 5 CV 60', 130.3, 72.2, -0.291, 52.5, 0.71],
  ['SVR 10, 1383', 113.2, 97.4, -0.250, 75.1, 0.75],
  ['NAT 10, 20',   103.3, 85.8, -0.311, 65.3, 0.69],
  ['NAT 10, 22',    88.2, 78.2, -0.316, 56.4, 0.68],
  ['SVR 3L, 1100', 137.5, 81.5, -0.239, 58.7, 0.76],
  ['SVR CV 60, 31', 118.5, 71.6, -0.214, 48.4, 0.79]
];
/* (a+1) 欄位（index 5）降冪排序 */
var A_GRD_ORD = (function () {
  var idx = [];
  for (var i = 0; i < 18; i++) idx.push(i);
  idx.sort(function (p, q) { return A_GRD_T[q][5] - A_GRD_T[p][5]; });
  return idx;
})();
