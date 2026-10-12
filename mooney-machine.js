/* 木尼粘度計導覽式互動圖
   一個時間模型同時驅動：機器剖面動作、扭矩錶針、扭矩曲線、階段引導文字。
   雙語沿用文件的 lang-zh / lang-en + body.show-en 機制。 */
(function () {
  'use strict';
  var SVG = 'http://www.w3.org/2000/svg';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 時間模型（t 單位：分鐘；t<0 是放料閉模段） ---------- */
  var T_END = 7.2;
  function torque(t) {
    if (t < 1) return 0;
    if (t < 1.15) { var u = (t - 1) / 0.15; return 88 * (1 - Math.pow(1 - u, 3)); }
    if (t <= 5) return 50 + 38 * Math.exp(-1.15 * (t - 1.15));
    return 50 * Math.pow((t - 5) * 60 + 1, -0.45);
  }

  var STAGES = [
    { t0: -0.5, t1: 0.0, dur: 1.7 },
    { t0:  0.0, t1: 1.0, dur: 2.6 },
    { t0:  1.0, t1: 1.6, dur: 1.9 },
    { t0:  1.6, t1: 4.7, dur: 3.4 },
    { t0:  4.7, t1: 5.0, dur: 2.2 },
    { t0:  5.0, t1: 7.2, dur: 4.6 }
  ];
  function stageOf(t) {
    for (var i = 0; i < STAGES.length; i++) if (t < STAGES[i].t1) return i;
    return STAGES.length - 1;
  }

  var TXT = [
    { zh: ['放料閉模', '膠片放進上下模之間，約 11.5 kN 的閉模力把膠壓進模腔、封住。'],
      en: ['Load & close', 'A rubber slab goes between the dies; ~11.5 kN of closure force presses it into the cavity and seals it.'] },
    { zh: ['預熱回溫', '預熱一分鐘讓膠回到測試溫度（本例 100°C）——轉子還沒轉，扭矩是 0。'],
      en: ['Preheat', 'One minute of preheat brings the rubber to test temperature (100°C here) — the rotor has not started; torque reads zero.'] },
    { zh: ['啟動過衝', '轉子以 2 rpm 啟動，扭矩瞬間衝到最高——這個初期峰和生膠強度有關。'],
      en: ['Startup peak', 'The rotor starts at 2 rpm and torque spikes — the initial peak relates to green strength.'] },
    { zh: ['剪切軟化', '膠受熱又受剪切、越轉越軟，扭矩一路下降——掉得越多代表觸變性越強。'],
      en: ['Shear softening', 'Heat and shear keep softening the rubber so torque keeps dropping — the bigger the drop, the stronger the thixotropy.'] },
    { zh: ['讀值時刻', '轉子轉滿 4 分鐘的這一刻讀值——平穩值 50 寫出來就是 ML(1+4)100°C = 50。'],
      en: ['The reading', 'The value at 4 minutes of rotation is what gets reported — a plateau of 50 writes up as ML(1+4)100°C = 50.'] },
    { zh: ['停轉鬆弛', '讀完值轉子立刻停止，膠內累積的應力慢慢散掉——這段衰減是下一節「應力鬆弛」的主角。'],
      en: ['Stop & relax', 'The rotor stops right after the reading and stored stress drains away — this decay is the next section’s subject, stress relaxation.'] }
  ];
  var UI = {
    stage: ['階段', 'Stage'],
    prev: ['◀ 上一段', '◀ Prev'], next: ['下一段 ▶', 'Next ▶'],
    play: ['▶ 播放', '▶ Play'], pause: ['❚❚ 暫停', '❚❚ Pause'], replay: ['⟲ 重播', '⟲ Replay'],
    /* 模式字串已隨切換鈕退役（單一自讀行為） */
    loop: ['⟳ 循環', '⟳ Loop'], speed: ['速度', 'Speed'],
    hint: ['滑到曲線任一點，看機器當下的狀態 · ← → 鍵步進', 'Hover the curve to see the machine’s state at that moment · ← → to step'],
    idle: ['轉子靜止', 'rotor idle'], spin: ['轉子 2 rpm', 'rotor 2 rpm']
  };

  /* ---------- SVG helper ---------- */
  var uidc = 0;
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVG, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(attrs, content, parent, lang) {
    var n = el('text', attrs, parent);
    if (lang) n.setAttribute('class', (attrs['class'] ? attrs['class'] + ' ' : '') + 'lang-' + lang);
    n.textContent = content;
    return n;
  }
  function bi(attrs, zh, en, parent) { txt(attrs, zh, parent, 'zh'); txt(attrs, en, parent, 'en'); }

  /* ============ 機器剖面（viewBox 0 0 330 310） ============ */
  function buildMachine(svg, uid) {
    var r = {};
    var C = {
      ink: '#1f2933', mut: '#52606d', line: '#d9e2ec', acc: '#2c5f8a', acc2: '#8a4a2c',
      steel: '#d7e0ea', steelD: '#b8c6d4', steelDD: '#93a5b8', shaft: '#9fb0bf',
      disk: '#8296a8', diskD: '#4a5560',
      rub: '#c98a3d', rubD: '#8a4a2c'
    };
    el('rect', { x: 0, y: 0, width: 330, height: 310, fill: '#fff' }, svg);

    /* 剖面線圖案：模座/台面 45°、模仁反 45°、襯套 X 交叉（依真機工程圖） */
    var defs = el('defs', {}, svg);
    function mkpat(id, w, rot, bg, sc, lw) {
      var p = el('pattern', { id: id, width: w, height: w, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(' + rot + ')' }, defs);
      el('rect', { width: w, height: w, fill: bg }, p);
      el('line', { x1: 0, y1: 0, x2: 0, y2: w, stroke: sc, 'stroke-width': lw }, p);
      return 'url(#' + id + ')';
    }
    var HA = mkpat('mmh' + uid, 6, 45, '#eef2f6', '#9aa8b5', 0.8),
        HB = mkpat('mmb' + uid, 5, -45, '#e9eef3', '#9aa8b5', 0.7),
        HW = mkpat('mmw' + uid, 9, 45, '#eef1f5', '#97a3b0', 1.1);
    var px = el('pattern', { id: 'mmx' + uid, width: 7, height: 7, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 7, height: 7, fill: '#f0f3f6' }, px);
    el('path', { d: 'M0 0 L7 7 M7 0 L0 7', stroke: '#9aa8b5', 'stroke-width': 0.7, fill: 'none' }, px);
    var HX = 'url(#mmx' + uid + ')';

    /* 彈簧袋（剖面彈簧＝鋸齒折線） */
    function spring(parent, x, y, w, h) {
      el('rect', { x: x, y: y, width: w, height: h, fill: '#fdfdfd', stroke: C.mut, 'stroke-width': .8 }, parent);
      var pts = Math.max(3, Math.round(h / 5)), d = '', i;
      for (i = 0; i <= pts; i++) d += (i ? ' L' : 'M') + (i % 2 ? x + w - 4 : x + 4) + ',' + (y + 3 + i * (h - 6) / pts).toFixed(1);
      el('path', { d: d, stroke: '#4a5560', 'stroke-width': .9, fill: 'none' }, parent);
      el('path', { d: 'M' + x + ',' + y + ' h' + w + ' M' + x + ',' + (y + h) + ' h' + w, stroke: C.ink, 'stroke-width': 1.1, fill: 'none' }, parent);
    }
    /* 測溫孔（左入盲孔管） */
    function well(parent, x, y, w, h) {
      el('rect', { x: x, y: y, width: w, height: h, rx: h / 2, fill: '#fdfdfd', stroke: C.mut, 'stroke-width': .8 }, parent);
      el('line', { x1: x + 6, y1: y + h / 2, x2: x + w - 8, y2: y + h / 2, stroke: C.mut, 'stroke-width': .7 }, parent);
    }

    /* 中心線（全長點劃線） */
    el('line', { x1: 160, y1: 26, x2: 160, y2: 306, stroke: '#4a5560', 'stroke-width': .7, 'stroke-dasharray': '12 3 2 3' }, svg);

    /* 機台台面＋懸吊軸承座（長孔＋襯套×2＋壓蓋） */
    el('rect', { x: 36, y: 152, width: 248, height: 17, fill: HW, stroke: C.mut }, svg);
    el('path', { d: 'M116,169 L204,169 L204,214 L198,214 L198,262 L198,270 L188,288 Q160,307 132,288 L122,270 L122,214 L116,214 Z', fill: HA, stroke: C.mut }, svg);
    el('path', { d: 'M136,176 L184,176 L184,266 Q184,290 160,294 Q136,290 136,266 Z', fill: '#fff', stroke: C.mut, 'stroke-width': .8 }, svg);
    [[136, 210], [168, 210], [136, 248], [168, 248]].forEach(function (b) {
      el('rect', { x: b[0], y: b[1], width: 16, height: 26, fill: HX, stroke: C.mut, 'stroke-width': .7 }, svg);
    });
    el('rect', { x: 132, y: 169, width: 56, height: 6, fill: '#e2e7ec', stroke: C.mut, 'stroke-width': .7 }, svg);

    /* 下模：模體＋模仁（銷孔兩側）＋銷孔＋左壓簧＋下測溫孔 */
    var low = el('g', {}, svg);
    el('rect', { x: 70, y: 120, width: 180, height: 32, fill: HA, stroke: C.mut }, low);
    el('rect', { x: 126, y: 122, width: 22, height: 28, fill: HB, stroke: C.mut, 'stroke-width': .7 }, low);
    el('rect', { x: 172, y: 122, width: 22, height: 28, fill: HB, stroke: C.mut, 'stroke-width': .7 }, low);
    el('rect', { x: 148, y: 120, width: 24, height: 32, fill: '#fff', stroke: C.mut, 'stroke-width': .8 }, low);
    spring(low, 84, 125, 32, 17);
    well(low, 74, 143, 58, 7);

    /* 膠片（開模置於下模面） */
    r.slab = el('g', {}, svg);
    el('ellipse', { cx: 160, cy: 117, rx: 42, ry: 5, fill: C.rub, stroke: C.rubD, 'stroke-width': .7 }, r.slab);
    el('rect', { x: 120, y: 111, width: 80, height: 6, fill: C.rub, stroke: C.rubD, 'stroke-width': .7 }, r.slab);
    el('ellipse', { cx: 160, cy: 111, rx: 40, ry: 5, fill: '#d99a4c', stroke: C.rubD, 'stroke-width': .7 }, r.slab);

    /* 上模組（閉合座標；r.up 上移開模）：模座＋側壁至分模線＋壓簧×2＋小簧袋＋上測溫孔＋模仁（凸出模穴頂面） */
    var up = r.up = el('g', {}, svg);
    el('path', { d: 'M70,56 L250,56 L250,120 L196,120 L196,80 L120,80 L120,120 L70,120 Z', fill: HA, stroke: C.mut }, up);
    spring(up, 84, 60, 28, 16);
    spring(up, 208, 60, 28, 16);
    el('rect', { x: 210, y: 84, width: 22, height: 16, fill: '#fdfdfd', stroke: C.mut, 'stroke-width': .8 }, up);
    el('path', { d: 'M213,87 l16,3 l-16,4 l16,4', stroke: '#4a5560', 'stroke-width': .8, fill: 'none' }, up);
    well(up, 74, 66, 44, 7);
    el('path', { d: 'M120,58 L194,58 L194,80 L188,80 L188,108 L132,108 L132,80 L120,80 Z', fill: HB, stroke: C.mut }, up);
    r.arrows = el('g', { opacity: 0 }, up);
    [105, 215].forEach(function (x) {
      el('line', { x1: x, y1: 30, x2: x, y2: 52, stroke: C.acc2, 'stroke-width': 2.2 }, r.arrows);
      el('path', { d: 'M' + (x - 5) + ' 48 L' + x + ' 56 L' + (x + 5) + ' 48 Z', fill: C.acc2 }, r.arrows);
    });
    r.arrowTxt = el('g', { opacity: 0 }, svg);
    bi({ x: 160, y: 24, 'font-size': 10.5, 'text-anchor': 'middle', fill: C.acc2, 'font-weight': 600 }, '閉模力 ≈ 11.5 kN', 'closure ≈ 11.5 kN', r.arrowTxt);

    /* 膠料填充態：填滿模穴剩餘空間（盤與銷之外） */
    r.rubCavity = el('g', { opacity: 0 }, svg);
    el('rect', { x: 120, y: 108, width: 76, height: 12, rx: 2, fill: C.rub, stroke: C.rubD, 'stroke-width': .7 }, r.rubCavity);
    r.dashes = el('g', {}, r.rubCavity);
    [[126, 109], [148, 109], [180, 118], [190, 118]].forEach(function (pt) {
      el('line', { x1: pt[0], y1: pt[1], x2: pt[0] + 5, y2: pt[1], stroke: C.rubD, 'stroke-width': 1.2, 'stroke-linecap': 'round' }, r.dashes);
    });

    /* 轉子銷＋長軸（下出接驅動，尾端螺紋）；軸內斜紋 clip 表旋轉 */
    var clip = el('clipPath', { id: 'mmc' + uid }, svg);
    el('rect', { x: 155, y: 176, width: 10, height: 118 }, clip);
    el('rect', { x: 153, y: 118, width: 14, height: 178, fill: '#fff', stroke: C.mut }, svg);
    el('rect', { x: 150, y: 143, width: 20, height: 7, fill: '#fff', stroke: C.mut, 'stroke-width': .7 }, svg);
    r.stripes = el('g', { 'clip-path': 'url(#mmc' + uid + ')', opacity: 0 }, svg);
    for (var i = 0; i < 6; i++) {
      el('line', { x1: 152, y1: 178 + i * 24, x2: 170, y2: 188 + i * 24, stroke: '#8b98a6', 'stroke-width': 2 }, r.stripes);
    }
    el('rect', { x: 150, y: 284, width: 20, height: 12, fill: '#fff', stroke: C.mut, 'stroke-width': .8 }, svg);
    var th = '';
    for (i = 0; i < 4; i++) th += 'M152,' + (287 + i * 3) + ' h16 ';
    el('path', { d: th, stroke: C.mut, 'stroke-width': .8, fill: 'none' }, svg);

    /* 齒面轉子盤（白體不剖；齒由 applySpin 滑動表旋轉剪切） */
    r.disk = el('rect', { x: 136, y: 110, width: 48, height: 8, rx: 1.5, fill: '#fff', stroke: C.ink }, svg);
    /* 端面垂直齒紋（真機圓周軸向溝） */
    [138.5, 141.5, 178, 181].forEach(function (x) {
      el('line', { x1: x, y1: 111, x2: x, y2: 117, stroke: '#4a5560', 'stroke-width': .9 }, svg);
    });
    r.ticks = [];
    for (i = 0; i < 16; i++) {
      r.ticks.push(el('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: '#4a5560', 'stroke-width': 1.3 }, svg));
    }

    /* 旋轉指示（軸端圓環＋軌點） */
    r.spinRing = el('g', { opacity: 0 }, svg);
    el('circle', { cx: 160, cy: 200, r: 13, fill: 'none', stroke: C.acc, 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, r.spinRing);
    r.spinDot = el('circle', { cx: 160, cy: 187, r: 2.6, fill: C.acc }, r.spinRing);
    txt({ x: 178, y: 204, 'font-size': 9.5, fill: C.acc, 'font-weight': 600 }, '2 rpm', r.spinRing);

    /* 熱＋溫度（下模測溫孔端＋模體加熱） */
    r.heat = el('g', { opacity: 0 }, svg);
    el('path', { d: 'M218 148 q3 -6 0 -12 q-3 -6 0 -11', stroke: C.acc2, 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round' }, r.heat);
    el('path', { d: 'M234 148 q3 -6 0 -12 q-3 -6 0 -11', stroke: C.acc2, 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round' }, r.heat);
    el('rect', { x: 100, y: 154, width: 32, height: 11, rx: 3, fill: '#fff', stroke: '#dfe7ef', 'stroke-width': .7 }, r.heat);
    r.bulb = el('circle', { cx: 134, cy: 146.5, r: 3.6, fill: '#9fb0bf' }, r.heat);
    r.tempTxt = txt({ x: 105, y: 163, 'font-size': 9.5, fill: C.acc2, 'font-weight': 600 }, '100°C', r.heat);

    /* 應力弧（鬆弛段） */
    r.stress = el('g', { opacity: 0 }, svg);
    el('ellipse', { cx: 160, cy: 114, rx: 52, ry: 11, fill: 'none', stroke: C.acc2, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, r.stress);
    el('ellipse', { cx: 160, cy: 114, rx: 62, ry: 15, fill: 'none', stroke: C.acc2, 'stroke-width': 1.2, 'stroke-dasharray': '4 5' }, r.stress);

    /* 扭矩錶 */
    var g2 = el('g', {}, svg);
    el('circle', { cx: 288, cy: 58, r: 22, fill: '#fff', stroke: C.mut, 'stroke-width': 1.4 }, g2);
    [-150, 0, 150].forEach(function (a) {
      var rad = (a - 90) * Math.PI / 180;
      el('line', {
        x1: 288 + 17 * Math.cos(rad), y1: 58 + 17 * Math.sin(rad),
        x2: 288 + 21 * Math.cos(rad), y2: 58 + 21 * Math.sin(rad),
        stroke: C.mut, 'stroke-width': 1.4
      }, g2);
    });
    txt({ x: 288, y: 82, 'font-size': 8, 'text-anchor': 'middle', fill: C.mut }, 'MU', g2);
    r.needle = el('line', { x1: 288, y1: 58, x2: 288, y2: 42, stroke: C.acc2, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, g2);
    el('circle', { cx: 288, cy: 58, r: 2.4, fill: C.acc2 }, g2);

    /* 矚目框 */
    r.focus = el('rect', { 'class': 'mm-focus', x: 62, y: 40, width: 206, height: 122, rx: 10, fill: 'none', stroke: C.acc, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg);

    /* legend（最上層，閉模力箭頭經過時被遮在下方而非反過來） */
    var ly = 14, lx = 16;
    [[C.rub, '膠料', 'rubber'], [HA, '上下模', 'dies'], ['#ffffff', '轉子＋軸', 'rotor + shaft']].forEach(function (it) {
      el('rect', { x: lx, y: ly - 8, width: 10, height: 10, rx: 2, fill: it[0], stroke: C.mut, 'stroke-width': .6 }, svg);
      bi({ x: lx + 14, y: ly + 1, 'font-size': 10, fill: C.mut }, it[1], it[2], svg);
      lx += it[1].length > 7 ? 96 : 78;
    });
    return r;
  }

  /* ============ 扭矩曲線（viewBox 0 0 340 310） ============ */
  var PX0 = 38, PX1 = 332, PY0 = 252, PY1 = 22;
  function X(t) { return PX0 + (t / T_END) * (PX1 - PX0); }
  function Y(m) { return PY0 - (m / 100) * (PY0 - PY1); }

  function buildCurve(svg, uid) {
    var r = {};
    var C = { ink: '#1f2933', mut: '#52606d', line: '#d9e2ec', acc: '#2c5f8a', acc2: '#8a4a2c' };
    el('rect', { x: 0, y: 0, width: 340, height: 310, fill: '#fff' }, svg);

    r.relaxZone = el('rect', { x: X(5), y: PY1, width: PX1 - X(5), height: PY0 - PY1, fill: '#c98a3d', opacity: 0 }, svg);

    [0, 25, 50, 75, 100].forEach(function (m) {
      el('line', { x1: PX0, y1: Y(m), x2: PX1, y2: Y(m), stroke: C.line, 'stroke-width': m ? .7 : 1.2 }, svg);
      txt({ x: PX0 - 5, y: Y(m) + 3, 'font-size': 9, 'text-anchor': 'end', fill: C.mut }, String(m), svg);
    });
    for (var t = 0; t <= 7; t++) {
      el('line', { x1: X(t), y1: PY0, x2: X(t), y2: PY0 + 4, stroke: C.mut, 'stroke-width': .8 }, svg);
      txt({ x: X(t), y: PY0 + 14, 'font-size': 9, 'text-anchor': 'middle', fill: C.mut }, String(t), svg);
    }
    el('line', { x1: PX0, y1: PY1 - 6, x2: PX0, y2: PY0, stroke: C.mut, 'stroke-width': 1.2 }, svg);
    el('line', { x1: PX0, y1: PY0, x2: PX1 + 4, y2: PY0, stroke: C.mut, 'stroke-width': 1.2 }, svg);
    txt({ x: PX1, y: PY0 + 26, 'font-size': 9, 'text-anchor': 'end', fill: C.mut }, 'min', svg);
    txt({ x: PX0 - 5, y: PY1 - 8, 'font-size': 9, 'text-anchor': 'end', fill: C.mut }, 'MU', svg);

    /* 事件標記 */
    [[1, '轉子啟動', 'rotor starts'], [5, '讀值＋停轉', 'read + stop']].forEach(function (ev) {
      el('line', { x1: X(ev[0]), y1: PY1, x2: X(ev[0]), y2: PY0, stroke: '#b8c6d4', 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
      bi({ x: X(ev[0]), y: PY1 - 3, 'font-size': 9, 'text-anchor': 'middle', fill: C.mut }, ev[1], ev[2], svg);
    });

    /* 曲線本體（clip 揭露） */
    var d = '';
    for (var i = 0; i <= 400; i++) {
      var tt = i / 400 * T_END;
      d += (i ? 'L' : 'M') + X(tt).toFixed(1) + ' ' + Y(torque(tt)).toFixed(1) + ' ';
    }
    var clip = el('clipPath', { id: 'mmv' + uid }, svg);
    r.clipRect = el('rect', { x: PX0, y: 0, width: 0, height: 310 }, clip);
    el('path', { d: d, fill: 'none', stroke: C.acc, 'stroke-width': 2.2, 'clip-path': 'url(#mmv' + uid + ')' }, svg);

    /* ML 讀值旗標 */
    r.mlFlag = el('g', { opacity: 0 }, svg);
    el('circle', { cx: X(5), cy: Y(50.4), r: 5, fill: 'none', stroke: C.acc2, 'stroke-width': 2 }, r.mlFlag);
    el('line', { x1: X(5), y1: Y(50.4) - 6, x2: X(5) - 30, y2: Y(74), stroke: C.acc2, 'stroke-width': 1 }, r.mlFlag);
    bi({ x: X(5) - 34, y: Y(78), 'font-size': 10, 'text-anchor': 'end', fill: C.acc2, 'font-weight': 700 }, 'ML(1+4) = 50', 'ML(1+4) = 50', r.mlFlag);

    /* 游標 */
    r.cursor = el('g', {}, svg);
    el('line', { x1: PX0, y1: PY1, x2: PX0, y2: PY0, stroke: C.acc, 'stroke-width': .9, 'stroke-dasharray': '3 3', opacity: .55 }, r.cursor);
    r.curDot = el('circle', { cx: PX0, cy: PY0, r: 3.6, fill: C.acc, stroke: '#fff', 'stroke-width': 1.4 }, r.cursor);

    r.hit = el('rect', { x: PX0, y: PY1, width: PX1 - PX0, height: PY0 - PY1, fill: '#fff', opacity: 0 }, svg);
    r.hit.style.touchAction = 'pan-y';   /* 垂直手勢讓給翻頁 */
    return r;
  }

  /* ============ 組件本體 ============ */
  var FOCUS = [
    [62, 40, 206, 122], [66, 52, 196, 104], [112, 100, 96, 26],
    [112, 100, 96, 26], [262, 30, 52, 56], [104, 94, 112, 32]
  ];

  function mount(root) {
    var uid = ++uidc;
    var fig = root.closest('figure');
    if (fig) fig.classList.add('mm-live');

    root.innerHTML =
      '<div class="mm-card">' +
      '  <div class="mm-head"><span class="mm-badge">' +
      '    <span class="lang-zh">' + UI.stage[0] + '</span><span class="lang-en">' + UI.stage[1] + '</span>' +
      ' <b class="mm-n">1</b>/6</span>' +
      '    <span class="mm-stagename"><span class="lang-zh" data-s="t0"></span><span class="lang-en" data-s="t1"></span></span></div>' +
      '  <div class="mm-panels">' +
      '    <div class="mm-machine-wrap"><svg class="mm-svg" viewBox="0 0 330 310"></svg></div>' +
      '    <div class="mm-curve-wrap"><svg class="mm-svg" viewBox="0 0 340 310"></svg></div>' +
      '  </div>' +
      '  <div class="mm-guide"><span class="lang-zh" data-s="g0"></span><span class="lang-en" data-s="g1"></span></div>' +
      '  <div class="mm-readout">' +
      '    <span>t = <b class="mm-t">0.0</b> min</span>' +
      '    <span>M = <b class="mm-m">0</b> MU</span>' +
      '    <span data-s="rs"><span class="lang-zh">' + UI.idle[0] + '</span><span class="lang-en">' + UI.idle[1] + '</span></span>' +
      '  </div>' +
      '  <div class="mm-controls">' +
      '    <button class="mm-btn" data-a="prev"><span class="lang-zh">' + UI.prev[0] + '</span><span class="lang-en">' + UI.prev[1] + '</span></button>' +
      '    <button class="mm-btn" data-a="play"><span class="lang-zh">' + UI.play[0] + '</span><span class="lang-en">' + UI.play[1] + '</span></button>' +
      '    <button class="mm-btn" data-a="next"><span class="lang-zh">' + UI.next[0] + '</span><span class="lang-en">' + UI.next[1] + '</span></button>' +
      '    <button class="mm-btn" data-a="replay"><span class="lang-zh">' + UI.replay[0] + '</span><span class="lang-en">' + UI.replay[1] + '</span></button>' +
      '    <button class="mm-btn" data-a="loop"><span class="lang-zh">' + UI.loop[0] + '</span><span class="lang-en">' + UI.loop[1] + '</span></button>' +
      '    <button class="mm-btn" data-a="speed"><span class="lang-zh">' + UI.speed[0] + ' 1×</span><span class="lang-en">' + UI.speed[1] + ' 1×</span></button>' +
      '    <span class="mm-dots"></span>' +
      '    <span class="mm-hint"><span class="lang-zh">' + UI.hint[0] + '</span><span class="lang-en">' + UI.hint[1] + '</span></span>' +
      '  </div>' +
      '</div>';

    var card = root.firstElementChild;
    var mSvg = root.querySelector('.mm-machine-wrap svg');
    var cSvg = root.querySelector('.mm-curve-wrap svg');
    var M = buildMachine(mSvg, uid);
    var C = buildCurve(cSvg, uid);

    var dots = root.querySelector('.mm-dots');
    var dotEls = [];
    for (var i = 0; i < 6; i++) {
      (function (i) {
        var d = document.createElement('button');
        d.className = 'mm-dot';
        d.setAttribute('aria-label', 'stage ' + (i + 1));
        d.addEventListener('click', function () { jump(STAGES[i].t0 + 0.001); });
        dots.appendChild(d); dotEls.push(d);
      })(i);
    }

    var state = { t: -0.5, playing: false, holdUntil: 0, started: false, rotor: 0,
      speed: 1, loop: true, autoOff: false, autoPlaying: false };
    var tEl = root.querySelector('.mm-t'), mEl = root.querySelector('.mm-m');
    var nEl = root.querySelector('.mm-n'), rsEl = root.querySelector('[data-s="rs"]');
    var t0El = root.querySelector('[data-s="t0"]'), t1El = root.querySelector('[data-s="t1"]');
    var g0El = root.querySelector('[data-s="g0"]'), g1El = root.querySelector('[data-s="g1"]');
    var playBtn = root.querySelector('[data-a="play"]');
    /* 單一自讀行為——不提供模式切換（CT 2026-10-12 裁示） */
    var lastStage = -1;

    function spinning(t) { return t >= 1 && t < 5; }

    function apply(t) {
      var s = stageOf(t);
      if (s !== lastStage) {
        lastStage = s;
        nEl.textContent = s + 1;
        t0El.textContent = TXT[s].zh[0]; t1El.textContent = TXT[s].en[0];
        g0El.textContent = TXT[s].zh[1]; g1El.textContent = TXT[s].en[1];
        var f = FOCUS[s];
        M.focus.setAttribute('x', f[0]); M.focus.setAttribute('y', f[1]);
        M.focus.setAttribute('width', f[2]); M.focus.setAttribute('height', f[3]);
        dotEls.forEach(function (d, j) {
          d.classList.toggle('on', j === s);
          d.classList.toggle('done', j < s);
        });
      }

      /* 閉合進度 0→1（t -0.5→0） */
      var c = Math.max(0, Math.min(1, (t + 0.5) / 0.5));
      M.up.setAttribute('transform', 'translate(0,' + (-(1 - c) * 26) + ')');
      M.slab.setAttribute('opacity', Math.max(0, 1 - (c - 0.55) / 0.45));
      M.rubCavity.setAttribute('opacity', Math.max(0, (c - 0.55) / 0.45));
      M.arrows.setAttribute('opacity', s === 0 ? 1 : 0);
      M.arrowTxt.setAttribute('opacity', s === 0 ? 1 : 0);

      /* 熱 */
      var h = s === 1 ? Math.min(1, t / 0.6) : (t > 1 ? 1 : 0);
      M.heat.setAttribute('opacity', (s === 1 ? 0.45 + 0.55 * h : t > 1 && t < 5 ? 0.35 : 0.12));
      M.bulb.setAttribute('fill', h > 0.7 || t >= 1 ? '#e0653a' : '#9fb0bf');

      /* 轉動 */
      var sp = spinning(t);
      M.spinRing.setAttribute('opacity', sp ? 1 : 0);
      M.stripes.setAttribute('opacity', sp ? 1 : 0);
      M.dashes.setAttribute('opacity', sp ? .9 : 0);
      rsEl.innerHTML = '<span class="lang-zh">' + (sp ? UI.spin[0] : UI.idle[0]) + '</span><span class="lang-en">' + (sp ? UI.spin[1] : UI.idle[1]) + '</span>';

      /* 錶針：0 MU→-120°、100 MU→120° */
      var m = torque(t);
      var ang = -120 + (m / 100) * 240;
      M.needle.setAttribute('transform', 'rotate(' + ang + ' 288 58)');

      /* 應力弧 */
      M.stress.setAttribute('opacity', t >= 5 ? (m / 50) * 0.8 : 0);

      /* 曲線 */
      C.clipRect.setAttribute('width', Math.max(0, X(Math.max(0, t)) - PX0));
      var cx = X(Math.max(0, Math.min(t, T_END)));
      r_set(C.cursor.firstElementChild, cx);
      C.curDot.setAttribute('cx', cx);
      C.curDot.setAttribute('cy', Y(m));
      C.mlFlag.setAttribute('opacity', t >= 4.95 ? 1 : 0);
      C.relaxZone.setAttribute('opacity', t >= 5 ? 0.10 : 0);

      tEl.textContent = Math.max(0, t).toFixed(1);
      mEl.textContent = m.toFixed(0);
    }
    function r_set(line, x) { line.setAttribute('x1', x); line.setAttribute('x2', x); }

    /* 轉子角度由連續時間推進 */
    var lastNow = 0, lastDraw = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - lastNow) / 1000 || 0); lastNow = now;
      if (!root.offsetParent) return;   /* 隱藏語言副本不重繪 */
      var advanced = false;
      if (state.playing && now >= state.holdUntil) {
        if (state.atEnd) {
          state.atEnd = false;
          if (state.loop) { state.t = -0.5; state.rotor = 0; }
          else { state.playing = false; syncPlay(); }
        }
        if (state.playing) {
          var s = stageOf(state.t), stg = STAGES[s];
          var step = dt * state.speed * (stg.t1 - stg.t0) / stg.dur;
          var nt = state.t + step;
          var ns = stageOf(nt);
          if (ns !== s && nt < T_END) {
            state.t = STAGES[ns].t0;
            state.holdUntil = now + 900 / state.speed;
          } else {
            state.t = Math.min(nt, T_END);
          }
          if (state.t >= T_END) {
            if (state.loop) { state.holdUntil = now + 1200 / state.speed; state.atEnd = true; }
            else state.playing = false;
            syncPlay();
          }
          advanced = true;
        }
      }
      if (state.playing && spinning(state.t) && !REDUCED) {
        state.rotor += dt * state.speed * 360 / 2.5; /* 視覺 2.5 秒一圈 */
        advanced = true;
      }
      if (!advanced) return;   /* 閒置不重繪——rAF 迴圈保留但零渲染成本 */
      if (now - lastDraw < 30) return;   /* 播放中限 ~30fps——手機 CPU 減半，肉眼差異有限 */
      lastDraw = now;
      applySpin();
      apply(state.t);
    }
    function applySpin() {
      var a = state.rotor;
      M.spinDot.setAttribute('cx', 160 + 13 * Math.cos(a * Math.PI / 180 - Math.PI / 2));
      M.spinDot.setAttribute('cy', 200 + 13 * Math.sin(a * Math.PI / 180 - Math.PI / 2));
      M.stripes.setAttribute('transform', 'translate(0,' + (a % 24) + ')');
      /* 齒盤齒紋：上排右移、下排左移（剖面剪切感），45° 轉角走一齒距 */
      var SP = 6, off = (a % 45) * SP / 45;
      for (var i = 0; i < 16; i++) {
        var top = i < 8;
        var tx = 136 + (i % 8) * SP + (top ? off : (SP - off));
        if (tx > 184) tx -= 48; if (tx < 136) tx += 48;
        var y = top ? 110 : 118;
        var tk = M.ticks[i];
        tk.setAttribute('x1', tx); tk.setAttribute('x2', tx);
        tk.setAttribute('y1', y); tk.setAttribute('y2', y + (top ? -2.4 : 2.4));
      }
      M.dashes.setAttribute('transform', 'translate(' + ((a / 3) % 22 - 11) + ',0)');
    }

    function jump(t) { state.t = Math.min(t, T_END); state.playing = false; syncPlay(); apply(state.t); }
    function syncPlay() {
      playBtn.innerHTML = '<span class="lang-zh">' + (state.playing ? UI.pause[0] : UI.play[0]) + '</span><span class="lang-en">' + (state.playing ? UI.pause[1] : UI.play[1]) + '</span>';
    }
    root.querySelector('[data-a="play"]').addEventListener('click', function () {
      if (state.t >= T_END) state.t = -0.5;
      state.playing = !state.playing; state.started = true; syncPlay();
    });
    root.querySelector('[data-a="prev"]').addEventListener('click', function () {
      var s = stageOf(state.t);
      jump(s === 0 || state.t <= STAGES[s].t0 + 0.05 ? STAGES[Math.max(0, s - 1)].t0 + 0.001 : STAGES[s].t0 + 0.001);
    });
    root.querySelector('[data-a="next"]').addEventListener('click', function () {
      var s = stageOf(state.t);
      jump(s >= 5 ? T_END : STAGES[s + 1].t0 + 0.001);
    });
    root.querySelector('[data-a="replay"]').addEventListener('click', function () {
      state.t = -0.5; state.rotor = 0; state.playing = true; state.started = true; syncPlay();
    });
    /* 單一自讀行為——不提供模式切換 */
    var loopBtn = root.querySelector('[data-a="loop"]');
    var syncLoop = function () { loopBtn.classList.toggle('on', state.loop); };
    syncLoop();
    loopBtn.addEventListener('click', function () { state.loop = !state.loop; syncLoop(); });
    var speedBtn = root.querySelector('[data-a="speed"]');
    var SPEEDS = [1, 2, 0.5];
    speedBtn.addEventListener('click', function () {
      var i = (SPEEDS.indexOf(state.speed) + 1) % SPEEDS.length;
      state.speed = SPEEDS[i];
      speedBtn.innerHTML = '<span class="lang-zh">' + UI.speed[0] + ' ' + state.speed + '×</span><span class="lang-en">' + UI.speed[1] + ' ' + state.speed + '×</span>';
    });
    root.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;   /* 觸控落下不算接管——可能只是翻頁起點 */
      state.autoOff = true; state.autoPlaying = false;
    });
    root.addEventListener('keydown', function (e) {
      state.autoOff = true; state.autoPlaying = false;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); root.querySelector('[data-a="next"]').click(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); root.querySelector('[data-a="prev"]').click(); }
    });

    /* 曲線 hover → 機器狀態跟隨 */
    C.hit.addEventListener('pointermove', function (e) {
      if (REDUCED) return;   /* 減少動態：曲線 scrub 不動畫面——完成態不被游標改寫 */
      if (state.playing && !e.buttons) return;   /* 播放中滑過不打斷；按住拖曳才算接管 */
      var b = cSvg.getBoundingClientRect();
      var t = (e.clientX - b.left) / b.width * 340;
      var tm = Math.max(0, Math.min(T_END, (t - PX0) / (PX1 - PX0) * T_END));
      state.t = tm; state.playing = false; syncPlay(); apply(tm);
    });

    /* 進視窗自動循環播放；離開暫停；使用者一碰永久讓位（autoOff） */
    if ('IntersectionObserver' in window && !REDUCED) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            if (state.autoOff) return;
            if (state.t >= T_END) state.t = -0.5;
            state.started = true; state.playing = true; state.autoPlaying = true; syncPlay();
          } else if (state.autoPlaying) {
            state.playing = false; state.autoPlaying = false; syncPlay();
          }
        });
      }, { threshold: 0.45 }).observe(root);
    }

    if (REDUCED) state.t = T_END;   /* 減少動態：直接停在完成態（全曲線＋開模） */
    apply(state.t);
    root._mmst = state;   /* 驗收偵錯掛點（比照 mw-core 的 _mwst） */
    requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.mooney-machine').forEach(mount);
  });
})();
