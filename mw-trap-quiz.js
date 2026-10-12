/* mw-trap-quiz.js — §5 判讀陷阱練習：「這兩個數字能直接比嗎？」
   四題情境（寫死資料）：①轉子不同 ②讀值時間 ③同條件可比 ④高粘度≠壞膠。
   實作：DOM 題目卡建在 .mw-panel 容器內（svg 隱藏不用）；作答狀態存 refs，
        經 ctx.params._qz 給 readout/guide 讀；alwaysTick 保持同步。
   評分：每題只算第一次作答。 */
MW.register('trap-quiz', {
  alwaysTick: true,
  hint: ['先判斷再按按鈕 · 每題只算第一次作答', 'Decide, then click — only the first try counts'],

  params: [
    { key: 'q', type: 'choice', def: '1', zh: '題目', en: 'Question',
      options: [
        { v: '1', zh: '第 1 題', en: 'Q1' },
        { v: '2', zh: '第 2 題', en: 'Q2' },
        { v: '3', zh: '第 3 題', en: 'Q3' },
        { v: '4', zh: '第 4 題', en: 'Q4' }
      ] }
  ],

  /* 題庫：情境 zh/en、兩個數字 va/vb、按鈕標籤 btns、正解 ans（索引）、陷阱 trap、解說 why */
  _Q: [
    { zh: 'A 廠報告：ML(1+4)100°C = 55；B 廠報告：MS(1+4)100°C = 58。哪家的膠比較黏——能直接比嗎？',
      en: 'Mill A reports ML(1+4)100°C = 55; mill B reports MS(1+4)100°C = 58. Whose rubber is more viscous — can you compare directly?',
      va: ['ML(1+4)100°C = 55', 'ML(1+4)100°C = 55'],
      vb: ['MS(1+4)100°C = 58', 'MS(1+4)100°C = 58'],
      btns: [['能直接比', 'Comparable'], ['不能直接比', 'Not comparable']],
      ans: 1,
      trap: ['陷阱①：轉子不同', 'Trap ①: different rotors'],
      why: ['不能直接比——L 是大轉子、S 是小轉子，兩把尺基準不同；58 看起來大，卻跟 55 不在同一把尺上。',
            'Not comparable — L is the large rotor and S the small one; different baselines. 58 looks bigger but sits on a different scale from 55.'] },
    { zh: '同一批膠：照規矩第 4 分鐘讀到 ML = 50；好奇讓它繼續轉到第 8 分鐘再讀——44。這兩個讀值能直接比嗎？',
      en: 'Same lot: the proper reading at minute 4 gives ML = 50; curiosity keeps it shearing to minute 8 — 44. Comparable?',
      va: ['ML(1+4) = 50', 'ML(1+4) = 50'],
      vb: ['同批第 8 分鐘 = 44', 'same lot @ min 8 = 44'],
      btns: [['能直接比', 'Comparable'], ['不能直接比', 'Not comparable']],
      ans: 1,
      trap: ['陷阱②：讀值時間', 'Trap ②: reading time'],
      why: ['不能直接比——膠有觸變性，剪越久讀值越低；差在時間不是品質。這正是標準把讀值時間寫死的原因。',
            'Not comparable — rubber is thixotropic and softens under shear; the gap is timing, not quality. That is why the standard fixes the reading time.'] },
    { zh: '兩批同牌號的膠，同一台機器、同樣寫法 ML(1+4)100°C：一批 52、一批 55。能直接比嗎？',
      en: 'Two lots of the same grade on the same machine, same notation ML(1+4)100°C: 52 vs 55. Comparable?',
      va: ['52', '52'],
      vb: ['55', '55'],
      btns: [['能直接比', 'Comparable'], ['不能直接比', 'Not comparable']],
      ans: 0,
      trap: ['這題能——同條件', 'This one can — same conditions'],
      why: ['能比——寫法完全相同，55 就是比 52 硬一點；同條件的數字才談得上大小。',
            'Yes — identical notation, so 55 is simply a bit stiffer than 52. Only same-condition numbers can be ranked.'] },
    { zh: '倉庫裡有 ML = 80 的膠和 ML = 45 的膠。有人說「80 是壞膠」——這個判斷成立嗎？',
      en: 'The warehouse holds an ML 80 rubber and an ML 45 rubber. Someone claims “80 is bad rubber.” Does that hold?',
      va: ['ML = 80', 'ML = 80'],
      vb: ['ML = 45', 'ML = 45'],
      btns: [['成立', 'Holds'], ['不成立', 'Doesn’t hold']],
      ans: 1,
      trap: ['陷阱③：把粘度當品質', 'Trap ③: viscosity ≠ quality'],
      why: ['不成立——木尼值只說「難不難加工」，不說品質好壞；80 可能只是產品需要的高分子量膠。',
            'Does not hold — Mooney only says how hard the rubber is to process, not whether it is good; 80 may be exactly the high-MW character the product needs.'] }
  ],

  build: function (svgs, U) {
    var P = U.PAL, r = { ans: {}, first: {}, qi: -1 };
    var svg = svgs[0];
    svg.style.display = 'none';                 /* 題目走 DOM，SVG 不用 */
    var host = svg.parentElement;               /* .mw-panel 容器 */

    var box = document.createElement('div');
    box.setAttribute('style', 'background:#fff;border:1px solid ' + P.line + ';border-radius:8px;padding:14px 18px;');
    host.appendChild(box);

    /* 情境 */
    var sc = document.createElement('div');
    sc.setAttribute('style', 'font-size:14.5px;line-height:1.7;color:' + P.ink + ';');
    r.qzh = document.createElement('span'); r.qzh.className = 'lang-zh';
    r.qen = document.createElement('span'); r.qen.className = 'lang-en';
    sc.appendChild(r.qzh); sc.appendChild(r.qen);
    box.appendChild(sc);

    /* 兩個數字卡 */
    var vs = document.createElement('div');
    vs.setAttribute('style', 'display:flex;align-items:center;gap:14px;margin:12px 0 2px;flex-wrap:wrap;');
    function chip() {
      var c = document.createElement('span');
      c.setAttribute('style', 'font-family:"SF Mono",Menlo,Consolas,monospace;font-size:14px;font-weight:700;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;background:' + P.soft + ';');
      return c;
    }
    var ca = chip(), cb = chip();
    r.az = document.createElement('span'); r.az.className = 'lang-zh';
    r.ae = document.createElement('span'); r.ae.className = 'lang-en';
    ca.appendChild(r.az); ca.appendChild(r.ae);
    r.bz = document.createElement('span'); r.bz.className = 'lang-zh';
    r.be = document.createElement('span'); r.be.className = 'lang-en';
    cb.appendChild(r.bz); cb.appendChild(r.be);
    var vsm = document.createElement('span');
    vsm.setAttribute('style', 'color:' + P.mut + ';font-size:13px;');
    vsm.innerHTML = '<span class="lang-zh">對</span><span class="lang-en">vs</span>';
    vs.appendChild(ca); vs.appendChild(vsm); vs.appendChild(cb);
    box.appendChild(vs);

    /* 作答鈕（沿用 mw-btn 樣式） */
    var row = document.createElement('div');
    row.setAttribute('style', 'display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;');
    function mkbtn(i) {
      var b = document.createElement('button');
      b.className = 'mw-btn'; b.type = 'button';
      var z = document.createElement('span'); z.className = 'lang-zh';
      var e = document.createElement('span'); e.className = 'lang-en';
      b.appendChild(z); b.appendChild(e);
      b.addEventListener('click', function () {
        if (r.qi < 0) return;
        r.ans[r.qi] = i;
        if (r.first[r.qi] === undefined) r.first[r.qi] = i;
      });
      row.appendChild(b);
      return [b, z, e];
    }
    var b0 = mkbtn(0), b1 = mkbtn(1);
    r.b0 = b0[0]; r.b0z = b0[1]; r.b0e = b0[2];
    r.b1 = b1[0]; r.b1z = b1[1]; r.b1e = b1[2];
    box.appendChild(row);

    /* 判定回饋（詳細解說在 guide 列） */
    r.fb = document.createElement('div');
    r.fb.setAttribute('style', 'display:none;margin-top:12px;padding-left:12px;border-left:4px solid ' + P.mut + ';font-size:13.5px;line-height:1.6;');
    r.fz = document.createElement('span'); r.fz.className = 'lang-zh'; r.fz.style.fontWeight = '600';
    r.fe = document.createElement('span'); r.fe.className = 'lang-en'; r.fe.style.fontWeight = '600';
    r.fb.appendChild(r.fz); r.fb.appendChild(r.fe);
    box.appendChild(r.fb);

    return r;
  },

  apply: function (r, ctx) {
    var P = MW.PAL;
    if (!ctx.params._qz) ctx.params._qz = r;    /* readout/guide 讀作答狀態用 */
    var qi = Math.max(0, Math.min(3, (parseInt(ctx.params.q, 10) || 1) - 1));
    var Q = this._Q[qi];

    /* 換題→重填題目卡 */
    if (qi !== r.qi) {
      r.qi = qi;
      r.qzh.textContent = Q.zh; r.qen.textContent = Q.en;
      r.az.textContent = Q.va[0]; r.ae.textContent = Q.va[1];
      r.bz.textContent = Q.vb[0]; r.be.textContent = Q.vb[1];
      r.b0z.textContent = Q.btns[0][0]; r.b0e.textContent = Q.btns[0][1];
      r.b1z.textContent = Q.btns[1][0]; r.b1e.textContent = Q.btns[1][1];
    }

    var ch = r.ans[qi];
    r.b0.classList.toggle('on', ch === 0);
    r.b1.classList.toggle('on', ch === 1);
    if (ch == null) { r.fb.style.display = 'none'; return; }
    var ok = ch === Q.ans;
    r.fb.style.display = 'block';
    r.fb.style.borderLeftColor = ok ? P.ok : P.warn;
    r.fz.textContent = (ok ? '✓ 答對了——' : '✗ 再想想——') + Q.trap[0];
    r.fe.textContent = (ok ? '✓ Correct — ' : '✗ Not quite — ') + Q.trap[1];
    r.fb.style.color = ok ? P.ok : P.warn;
  },

  readout: function (ctx) {
    var r = ctx.params._qz, n = 0, m = 0, i;
    var qi = Math.max(0, Math.min(3, (parseInt(ctx.params.q, 10) || 1) - 1));
    if (r) for (i = 0; i < 4; i++) {
      if (r.ans[i] !== undefined) n++;
      if (r.first[i] !== undefined && r.first[i] === this._Q[i].ans) m++;
    }
    var rows = [
      ['已作答 <b>' + n + '</b> / 4 題', '<b>' + n + '</b> / 4 answered'],
      ['第一次就答對 <b>' + m + '</b> 題', '<b>' + m + '</b> right on first try']
    ];
    if (r && r.ans[qi] !== undefined) {
      var Q = this._Q[qi], ok = r.ans[qi] === Q.ans;
      rows.push(ok ? ['本題：<b>答對</b>——' + Q.trap[0], 'This one: <b>correct</b> — ' + Q.trap[1]]
                   : ['本題：<b>答錯</b>——' + Q.trap[0], 'This one: <b>missed</b> — ' + Q.trap[1]]);
    }
    return rows;
  },

  guide: function (ctx) {
    var r = ctx.params._qz;
    var qi = Math.max(0, Math.min(3, (parseInt(ctx.params.q, 10) || 1) - 1));
    var Q = this._Q[qi];
    if (r && r.ans[qi] != null) return [Q.why[0], Q.why[1]];
    return ['兩個數字擺在一起——先想清楚「能不能直接比」，再按按鈕。',
      'Two numbers side by side — decide “directly comparable or not” before you click.'];
  }
});
