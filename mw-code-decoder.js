/* mw-code-decoder.js — §3 木尼碼逐段解碼
   故事：ML(1+4)100°C = 50 不是密碼是五格資料——點碼串任何一段（或下方按鈕），
        看那格管什麼；換個例碼再拆一次。「寫法全同才能比」是這課的重點。
   實作：無 stages、無 scrub；五個 SVG 區塊自接 pointer 事件，
        透過 alwaysTick 在 apply 裡同步 ctx.params.seg 與段落按鈕。 */
MW.register('code-decoder', {
  vb: [520, 180],
  alwaysTick: true,
  hint: ['點碼串任何一段看解釋 · 右上換例碼', 'Click any segment of the code · switch examples on the right'],

  params: [
    { key: 'ex', type: 'choice', def: 'std', zh: '例碼', en: 'Example',
      options: [
        { v: 'std',   zh: 'ML(1+4)100°C = 50',  en: 'ML(1+4)100°C = 50' },
        { v: 'small', zh: 'MS(1+10)120°C = 35', en: 'MS(1+10)120°C = 35' },
        { v: 'hot',   zh: 'ML(1+8)125°C = 62',  en: 'ML(1+8)125°C = 62' }
      ] },
    { key: 'seg', type: 'choice', def: '0', zh: '段落', en: 'Segment',
      options: [
        { v: '0', zh: 'M',      en: 'M' },
        { v: '1', zh: '轉子',    en: 'rotor' },
        { v: '2', zh: '(時間)',  en: '(time)' },
        { v: '3', zh: '溫度',    en: 'temp' },
        { v: '4', zh: '＝讀值',  en: '= value' }
      ] }
  ],

  /* 例碼資料（教學近似）：segs＝五段字串；L＝大轉子；pre/run＝預熱/轉子分鐘；temp；val＝讀值 */
  _ex: {
    std:   { segs: ['M', 'L', '(1+4)',  '100°C', '= 50'], L: true,  pre: 1, run: 4,  temp: 100, val: 50 },
    small: { segs: ['M', 'S', '(1+10)', '120°C', '= 35'], L: false, pre: 1, run: 10, temp: 120, val: 35 },
    hot:   { segs: ['M', 'L', '(1+8)',  '125°C', '= 62'], L: true,  pre: 1, run: 8,  temp: 125, val: 62 }
  },
  _tags: [['測試', 'test'], ['轉子', 'rotor'], ['時間程序', 'timing'], ['溫度', 'temp'], ['讀值', 'value']],

  build: function (svgs, U) {
    var svg = svgs[0], P = U.PAL, r = { hov: -1, selFrom: null, chips: [] };
    U.el('rect', { x: 0, y: 0, width: 520, height: 180, fill: '#fff' }, svg);
    var i;
    for (i = 0; i < 5; i++) {
      (function (idx) {
        var g = U.el('g', {}, svg);
        g.style.cursor = 'pointer';
        var ch = {};
        ch.tagZ = U.txt({ x: 0, y: 52, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, '', g, 'zh');
        ch.tagE = U.txt({ x: 0, y: 52, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut }, '', g, 'en');
        ch.rect = U.el('rect', { x: 0, y: 64, width: 10, height: 46, rx: 9, fill: '#fff', stroke: P.line, 'stroke-width': 1.4 }, g);
        ch.txt  = U.txt({ x: 0, y: 94, 'font-size': 21, 'text-anchor': 'middle', fill: P.ink,
          'font-family': "'SF Mono',Menlo,Consolas,monospace", 'font-weight': 600 }, '', g);
        g.addEventListener('pointerdown', function () { r.selFrom = idx; });
        g.addEventListener('pointerenter', function () { r.hov = idx; });
        g.addEventListener('pointerleave', function () { r.hov = -1; });
        r.chips.push(ch);
      })(i);
    }
    r.caret = U.path('M-7 0 L7 0 L0 8 Z', { fill: P.acc }, svg);
    U.bi({ x: 260, y: 168, 'font-size': 10, 'text-anchor': 'middle', fill: P.mut },
      '▼ 解釋在下方引導列', '▼ explanation below', svg);
    return r;
  },

  apply: function (r, ctx) {
    var P = MW.PAL, ex = this._ex[ctx.params.ex] || this._ex.std;

    /* 碼串點選 → 同步 seg 參數與下方按鈕的 .on */
    if (r.selFrom != null) {
      ctx.params.seg = String(r.selFrom);
      r.selFrom = null;
      var wraps = ctx.root.querySelectorAll('.mw-param');
      var grp = wraps.length > 1 ? wraps[1].querySelectorAll('.mw-cb') : [];
      for (var j = 0; j < grp.length; j++) grp[j].classList.toggle('on', grp[j].dataset.v === ctx.params.seg);
    }
    var sel = Math.max(0, Math.min(4, parseInt(ctx.params.seg, 10) || 0));

    /* 依當前例碼重排五格 */
    var ws = [], tot = 0, i;
    for (i = 0; i < 5; i++) { ws[i] = 22 + ex.segs[i].length * 13; tot += ws[i]; }
    tot += 8 * 4;
    var x = (520 - tot) / 2;
    for (i = 0; i < 5; i++) {
      var ch = r.chips[i], w = ws[i], on = i === sel, hov = i === r.hov;
      ch.rect.setAttribute('x', x.toFixed(1));
      ch.rect.setAttribute('width', w.toFixed(1));
      ch.rect.setAttribute('fill', on ? '#e4ecf4' : (hov ? '#f0f4f8' : '#fff'));
      ch.rect.setAttribute('stroke', on || hov ? P.acc : P.line);
      ch.rect.setAttribute('stroke-width', on ? 2 : 1.4);
      ch.txt.setAttribute('x', (x + w / 2).toFixed(1));
      ch.txt.setAttribute('fill', on ? P.acc : P.ink);
      ch.txt.textContent = ex.segs[i];
      ch.tagZ.setAttribute('x', (x + w / 2).toFixed(1));
      ch.tagZ.setAttribute('fill', on ? P.acc : P.mut);
      ch.tagZ.textContent = this._tags[i][0];
      ch.tagE.setAttribute('x', (x + w / 2).toFixed(1));
      ch.tagE.setAttribute('fill', on ? P.acc : P.mut);
      ch.tagE.textContent = this._tags[i][1];
      if (on) r.caret.setAttribute('transform', 'translate(' + (x + w / 2).toFixed(1) + ' 122)');
      x += w + 8;
    }
  },

  readout: function (ctx) {
    var ex = this._ex[ctx.params.ex] || this._ex.std;
    var rotor = ex.L ? ['大轉子', 'large rotor'] : ['小轉子', 'small rotor'];
    return [
      ['白話＝' + rotor[0] + ' · ' + ex.temp + '°C · 預熱 ' + ex.pre + ' 分＋轉 ' + ex.run + ' 分 → <b>' + ex.val + ' MU</b>',
       'Plain reading = ' + rotor[1] + ' · ' + ex.temp + '°C · ' + ex.pre + '-min preheat + ' + ex.run + '-min run → <b>' + ex.val + ' MU</b>'],
      ['只有寫法全同的兩個數才能直接比', 'Only identical notations are directly comparable']
    ];
  },

  guide: function (ctx) {
    var ex = this._ex[ctx.params.ex] || this._ex.std;
    var s = Math.max(0, Math.min(4, parseInt(ctx.params.seg, 10) || 0));
    if (s === 0) return ['M＝Mooney 木尼測試——這整串是木尼粘度計的成績碼，後面四格是它的條件與結果。',
      'M = Mooney — this string is the viscometer’s result code; the next four segments are its conditions and result.'];
    if (s === 1) return ex.L
      ? ['L＝大轉子（38 mm），標準尺寸；寫 S 才是小轉子（30 mm，軟膠用）。轉子不同，讀值基準就不同。',
         'L = large rotor (38 mm), the standard; S means the small rotor (30 mm) for softer rubber. Different rotor, different baseline.']
      : ['S＝小轉子（30 mm）——較軟的膠用小轉子才量得動；跟 L 的數字不能互比。',
         'S = small rotor (30 mm) — used for softer rubber; its numbers cannot be compared with L.'];
    if (s === 2) return ['(' + ex.pre + '+' + ex.run + ')＝預熱 ' + ex.pre + ' 分鐘、轉子轉 ' + ex.run + ' 分鐘時讀值——時間寫法不同，同樣的膠也會讀出不同數字。',
      '(' + ex.pre + '+' + ex.run + ') = ' + ex.pre + '-min preheat, read at ' + ex.run + ' min of rotation — different timing reads differently on the same rubber.'];
    if (s === 3) return [ex.temp + '°C＝測試溫度——膠的軟硬隨溫度變，換個溫度就是另一把尺。',
      ex.temp + '°C = test temperature — rubber stiffness shifts with temperature; a different temperature is a different scale.'];
    return ['= ' + ex.val + '＝轉滿 ' + ex.run + ' 分鐘那一刻的平穩扭矩——這個數字才是報告上的木尼值（MU）。',
      '= ' + ex.val + ' = the plateau torque at minute ' + ex.run + ' — this is the reported Mooney value (MU).'];
  }
});
