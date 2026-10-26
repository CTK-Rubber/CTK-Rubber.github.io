/* mw-a-bars.js — 專題A · 五個參數的品級分布全覽（Maláč 2011 Table 1 原值；Fig. 2/3/5/7/11）
   故事：峰、ML、k、a、(a+1) 五幅排序長條並列——五個參數給同一批品級排出五種名次。
   互動（核心）：hover 任一長條 → 五圖中同一品級的條全部亮起 + 五值讀數。
   資料：本檔底部 18 品級真值表（Maláč 2011 Table 1 原值）。 */
MW.register('a-bars', {
  vb: [800, 330],
  hint: ['滑到任一直條上——五幅圖會同時亮出同一品級', 'Hover any bar — the same grade lights up in all five charts'],

  scrub: { panel: 0, fn: function (x01, st) {
    /* 五欄等寬並列：x 位置同時決定欄與條序 */
    var px = x01 * 800, hit = -1, hitC = -1;
    for (var c = 0; c < 5; c++) {
      var bx0 = 34 + c * 160;
      if (px >= bx0 - 2 && px <= bx0 + 18 * 6.67 + 2) {
        var i = Math.floor((px - bx0) / 6.67);
        i = Math.max(0, Math.min(17, i));
        hit = A_BARS_ORD[c][i]; hitC = c;
        break;
      }
    }
    st.params.hov = hit; st.params.hovC = hitC;
  } },

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = { cols: [] };
    var PY1 = 34, PY0 = 250;
    r.PY0 = PY0; r.PY1 = PY1;

    U.el('rect', { x: 0, y: 0, width: 800, height: 330, fill: '#fff' }, svg);

    /* 五欄：峰 / ML / k / a / (a+1) —— a 全是負值，長條向下畫（負的讀法就是它彆扭的地方） */
    var COLS = A_BARS_COLS;
    for (var c = 0; c < 5; c++) {
      var cf = COLS[c];
      var bx0 = 34 + c * 160, bw = 120;   /* 每欄 18 條，pitch = 120/18 ≈ 6.67 */
      var pitch = bw / 18;
      var Yv = function (v) { return PY1 + (cf.ymax - v) / (cf.ymax - cf.ymin) * (PY0 - PY1); };
      var col = { cf: cf, bx0: bx0, bars: [], order: A_BARS_ORD[c] };

      /* 標題 */
      U.bi({ x: bx0 + bw / 2, y: 18, 'font-size': 12, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700 },
        cf.t[0], cf.t[1], svg);

      /* 刻度與格線 */
      cf.ticks.forEach(function (tv) {
        var yy = Yv(tv);
        U.el('line', { x1: bx0, y1: yy, x2: bx0 + bw, y2: yy, stroke: tv === 0 ? P.mut : P.grid, 'stroke-width': tv === 0 ? 1.1 : 0.8 }, svg);
        U.txt({ x: bx0 - 5, y: yy + 3, 'font-size': 9, 'text-anchor': 'end', fill: P.mut },
          String(tv).replace('-', '−'), svg);
      });

      /* 18 條（該欄自己的排序） */
      for (var i = 0; i < 18; i++) {
        var gi = col.order[i], v = A_BARS_T[gi][cf.yi];
        var y0 = Yv(Math.max(0, cf.ymin < 0 ? 0 : cf.ymin));   /* 基線：正值欄在底部、a 欄在頂部(0) */
        var yv = Yv(v);
        var bar = U.el('rect', {
          x: (bx0 + i * pitch + 0.8).toFixed(1), width: (pitch - 1.6).toFixed(1),
          y: cf.dir > 0 ? yv.toFixed(1) : y0.toFixed(1),
          height: Math.abs(yv - y0).toFixed(1),
          fill: cf.col, opacity: 0.55
        }, svg);
        col.bars.push(bar);
      }
      col.valTxt = U.txt({ x: 0, y: 0, 'font-size': 9, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700, opacity: 0 }, '', svg);
      r.cols.push(col);
    }

    /* hover 品級名（跟到所在欄下方） */
    r.nameTxt = U.txt({ x: 0, y: PY0 + 18, 'font-size': 11, 'text-anchor': 'middle', fill: P.ink, 'font-weight': 700, opacity: 0 }, '', svg);

    return r;
  },

  apply: function (r, ctx) {
    var hov = ctx.params.hov, hovC = ctx.params.hovC;
    if (hov == null) hov = -1;
    for (var c = 0; c < 5; c++) {
      var col = r.cols[c], cf = col.cf;
      var pitch = 120 / 18;
      var Yv = function (v) { return r.PY1 + (cf.ymax - v) / (cf.ymax - cf.ymin) * (r.PY0 - r.PY1); };
      var shown = false;
      for (var i = 0; i < 18; i++) {
        var gi = col.order[i], on = (gi === hov);
        col.bars[i].setAttribute('opacity', hov < 0 ? 0.55 : (on ? 1 : 0.25));
        col.bars[i].setAttribute('stroke', on ? MW.PAL.ink : 'none');
        col.bars[i].setAttribute('stroke-width', on ? 1 : 0);
        if (on) {
          /* 值標籤貼在每一欄被連動的那根條端點——五欄同時亮值 */
          var v = A_BARS_T[gi][cf.yi], yv = Yv(v);
          col.valTxt.setAttribute('x', col.bx0 + i * pitch + pitch / 2);
          col.valTxt.setAttribute('y', cf.dir > 0 ? yv - 4 : yv + 11);
          col.valTxt.setAttribute('opacity', 1);
          col.valTxt.textContent = (cf.yi === 3 ? '−' + Math.abs(v).toFixed(3) : (cf.yi === 5 ? v.toFixed(2) : v.toFixed(1)));
          shown = true;
        }
      }
      if (!shown) col.valTxt.setAttribute('opacity', 0);
    }
    if (hov >= 0 && hovC >= 0) {
      r.nameTxt.setAttribute('x', 34 + hovC * 160 + 60);
      r.nameTxt.setAttribute('opacity', 1);
      r.nameTxt.textContent = A_BARS_T[hov][0];
    } else {
      r.nameTxt.setAttribute('opacity', 0);
    }
  },

  readout: function (ctx) {
    var hov = ctx.params.hov;
    if (hov == null || hov < 0) {
      return [['滑到任一直條——五幅圖同時亮出同一品級',
               'Hover any bar — the same grade lights up across all five charts']];
    }
    var g = A_BARS_T[hov];
    /* 各欄名次（該欄排序中的位置） */
    var rk = [];
    for (var c = 0; c < 5; c++) {
      var ord = A_BARS_ORD[c];
      for (var i = 0; i < 18; i++) if (ord[i] === hov) { rk.push(i + 1); break; }
    }
    return [
      ['<b>' + g[0] + '</b>', '<b>' + g[0] + '</b>'],
      ['峰 ' + g[1] + ' · ML ' + g[2] + ' · k ' + g[4], 'peak ' + g[1] + ' · ML ' + g[2] + ' · k ' + g[4]],
      ['a ' + String(g[3]).replace('-', '−') + ' · (a+1) ' + g[5], 'a ' + g[3] + ' · (a+1) ' + g[5]],
      ['五圖名次：峰 #' + rk[0] + ' · ML #' + rk[1] + ' · k #' + rk[2] + ' · a #' + rk[3] + ' · (a+1) #' + rk[4],
       'ranks: peak #' + rk[0] + ' · ML #' + rk[1] + ' · k #' + rk[2] + ' · a #' + rk[3] + ' · (a+1) #' + rk[4]]
    ];
  },

  guide: function () {
    return ['五個參數給同一批品級排出五種名次——它們各自說的是不同的事。',
            'Five parameters rank the same grades five different ways — each one tells a different story.'];
  }
});

/* ---- 批次 S3 真值表（Maláč 2011 Table 1，18 品級全） ----
   [品級, 初始峰, ML, a, k, (a+1)] */
var A_BARS_T = [
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

/* ---- 五欄設定與排序 ----
   yi：真值表欄序 [品級,峰,ML,a,k,(a+1)]；dir=1 向上畫、-1 向下（a 皆負） */
var A_BARS_COLS = [
  { yi: 1, t: ['初始扭矩峰 (MU)', 'initial peak (MU)'], ymin: 0, ymax: 200, ticks: [0, 100, 200], dir: 1, col: '#2c5f8a' },
  { yi: 2, t: ['ML(1+4)', 'ML(1+4)'], ymin: 0, ymax: 100, ticks: [0, 50, 100], dir: 1, col: '#2c5f8a' },
  { yi: 4, t: ['k (MU)', 'k (MU)'], ymin: 0, ymax: 80, ticks: [0, 40, 80], dir: 1, col: '#2c5f8a' },
  { yi: 3, t: ['a（全是負值）', 'a (all negative)'], ymin: -0.4, ymax: 0, ticks: [0, -0.2, -0.4], dir: -1, col: '#8a4a2c' },
  { yi: 5, t: ['(a+1) 彈性指數', '(a+1) elasticity index'], ymin: 0, ymax: 1, ticks: [0, 0.5, 1], dir: 1, col: '#4a7a4a' }
];
/* 每欄各自按值降冪排序（a 欄：越不負越前＝越彈越前，與 (a+1) 同向） */
var A_BARS_ORD = (function () {
  var ord = [];
  for (var c = 0; c < 5; c++) {
    var yi = A_BARS_COLS[c].yi, idx = [];
    for (var i = 0; i < 18; i++) idx.push(i);
    idx.sort(function (p, q) { return A_BARS_T[q][yi] - A_BARS_T[p][yi]; });
    ord.push(idx);
  }
  return ord;
})();
