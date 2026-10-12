/* mw-core.js — 木尼互動教材 widget 引擎
   每個 widget 以 MW.register('name', def) 登記；HTML 掛載點：
     <div class="mw" data-mw="name" data-arg="選填" tabindex="0"></div>
   def 欄位（全部選填，至少要有 build+apply）：
     vb:      [w,h] 或 [[w,h],[w,h]]           — 面板 viewBox（1~2 幅 SVG）
     stages:  [{dur, zh:[標題,引導], en:[t,g]}] — 分階播放；省略→純參數型（無播放鈕、無階段點）
     params:  [{key,type:'range'|'choice',min,max,step,def,options:[{v,zh,en}],zh,en,fmt(v)}]
     scrub:   {panel:0, fn(x01, st)}            — 指定面板 hover；fn 內可改 st.u 或 st.params
     hint:    [zh,en]                           — 控制列右端提示
     build(svgs, U) -> refs                     — 建 SVG 內容，回傳參照物件
     apply(refs, ctx)                           — 每幀依狀態重繪；ctx={u,s,sp,params,t,arg}
     readout(ctx) -> [[zh,en],...]              — 讀數列內容（可省）
     guide(ctx)  -> [zh,en]                     — 動態引導句（覆寫 stages 文案；可省）
   U（傳給 build 的工具包）：{el, txt, bi, PAL, arg, svgns}
   全域行為：雙語 .lang-zh/.lang-en 交給 body.show-en 切換；
             prefers-reduced-motion 不自動播；.mw-live 的 figure 螢幕藏 .mw-print、列印反之。 */
window.MW = (function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DEFS = {}, MOUNTS = [], uidc = 0;

  var PAL = {
    ink: '#1f2933', mut: '#52606d', line: '#d9e2ec',
    acc: '#2c5f8a', acc2: '#8a4a2c', ok: '#4a7a4a',
    rub: '#c98a3d', rubD: '#8a4a2c', soft: '#f5f7fa',
    grid: '#eef2f6', warn: '#b3372f'
  };

  /* ---------- SVG helpers ---------- */
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
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
  function bi(attrs, zh, en, parent) {
    txt(attrs, zh, parent, 'zh');
    var b = {}; for (var k in attrs) b[k] = attrs[k];
    txt(b, en, parent, 'en');
  }
  function path(d, attrs, parent) {
    attrs = attrs || {}; attrs.d = d;
    return el('path', attrs, parent);
  }
  /* polyline data -> path d */
  function pd(pts, X, Y) {
    var d = '';
    for (var i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + X(pts[i][0]).toFixed(1) + ' ' + Y(pts[i][1]).toFixed(1) + ' ';
    return d;
  }

  var UI = {
    badge: ['互動', 'Interactive'],
    stage: ['階段', 'Stage'],
    prev: ['◀ 上一段', '◀ Prev'], next: ['下一段 ▶', 'Next ▶'],
    play: ['▶ 播放', '▶ Play'], pause: ['❚❚ 暫停', '❚❚ Pause'], replay: ['⟲ 重播', '⟲ Replay'],
    modeSelf: ['自讀模式', 'Self-read'], modePres: ['講者模式', 'Presenter'],
    hintDef: ['拖動參數或滑到圖上看變化 · ← → 鍵步進', 'Drag a parameter or hover the chart · ← → to step'],
    show: ['顯示說明', 'Show answer'], hide: ['收起說明', 'Hide answer'],
    loop: ['⟳ 循環', '⟳ Loop'], speed: ['速度', 'Speed']
  };

  function register(name, def) { DEFS[name] = def; }

  /* ---------- scaffold ---------- */
  function mount(root) {
    var name = root.getAttribute('data-mw');
    var def = DEFS[name];
    if (!def) { root.classList.add('mw-missing'); root.textContent = '[widget ' + name + ' missing]'; return; }
    var arg = root.getAttribute('data-arg') || '';
    var uid = ++uidc;
    var fig = root.closest && root.closest('figure');
    if (fig) fig.classList.add('mw-live');

    var hasStages = !!(def.stages && def.stages.length);
    var html =
      '<div class="mw-card">' +
      '<div class="mw-head"><span class="mw-badge"><span class="lang-zh">' + UI.badge[0] + '</span><span class="lang-en">' + UI.badge[1] + '</span></span>' +
      (hasStages ? '<span class="mw-badge mw-nbadge"><span class="lang-zh">' + UI.stage[0] + '</span><span class="lang-en">' + UI.stage[1] + '</span> <b class="mw-n">1</b>/' + def.stages.length + '</span>' : '') +
      '<span class="mw-stagename"><span class="lang-zh" data-s="t0"></span><span class="lang-en" data-s="t1"></span></span></div>' +
      '<div class="mw-panels"></div>' +
      '<div class="mw-guide"><span class="lang-zh" data-s="g0"></span><span class="lang-en" data-s="g1"></span></div>' +
      '<div class="mw-readout"></div>' +
      '<div class="mw-params"></div>' +
      '<div class="mw-controls">' +
      (hasStages ?
        '<button class="mw-btn" data-a="prev"><span class="lang-zh">' + UI.prev[0] + '</span><span class="lang-en">' + UI.prev[1] + '</span></button>' +
        '<button class="mw-btn" data-a="play"><span class="lang-zh">' + UI.play[0] + '</span><span class="lang-en">' + UI.play[1] + '</span></button>' +
        '<button class="mw-btn" data-a="next"><span class="lang-zh">' + UI.next[0] + '</span><span class="lang-en">' + UI.next[1] + '</span></button>' +
        '<button class="mw-btn" data-a="replay"><span class="lang-zh">' + UI.replay[0] + '</span><span class="lang-en">' + UI.replay[1] + '</span></button>' +
        '<button class="mw-btn" data-a="loop"><span class="lang-zh">' + UI.loop[0] + '</span><span class="lang-en">' + UI.loop[1] + '</span></button>' +
        '<button class="mw-btn" data-a="speed"><span class="lang-zh">' + UI.speed[0] + ' 1×</span><span class="lang-en">' + UI.speed[1] + ' 1×</span></button>' +
        '<span class="mw-dots"></span>' : '') +
      '<button class="mw-btn" data-a="mode"><span class="lang-zh">' + UI.modePres[0] + '</span><span class="lang-en">' + UI.modePres[1] + '</span></button>' +
      '<span class="mw-hint"></span>' +
      '</div></div>';
    root.innerHTML = html;
    var card = root.firstElementChild;

    /* panels */
    var vbs = (def.vb && def.vb[0] instanceof Array) ? def.vb : [def.vb || [520, 300]];
    var panelsEl = root.querySelector('.mw-panels');
    var svgs = vbs.map(function (vb) {
      var w = document.createElement('div');
      w.className = 'mw-panel';
      var s = document.createElementNS(SVGNS, 'svg');
      s.setAttribute('viewBox', '0 0 ' + vb[0] + ' ' + vb[1]);
      s.setAttribute('class', 'mw-svg');
      w.appendChild(s); panelsEl.appendChild(w);
      return s;
    });

    var U = { el: el, txt: txt, bi: bi, path: path, pd: pd, PAL: PAL, arg: arg, svgns: SVGNS, uid: uid };
    var refs = def.build ? (def.build(svgs, U) || {}) : {};

    /* state */
    var st = {
      u: hasStages ? 0 : 1, playing: false, mode: 'self',
      started: false, holdUntil: 0, lastStage: -1, t: 0,
      params: {}, arg: arg, dirty: true,
      speed: 1, loop: !!def.loop, autoOff: false, autoPlaying: false,
      wiggled: false, wig: null
    };
    (def.params || []).forEach(function (p) { st.params[p.key] = p.def; });
    if (def.argToParams) { var pre = def.argToParams(arg); if (pre) for (var k in pre) st.params[k] = pre[k]; }

    /* stage geometry */
    var cum = [], total = 0;
    if (hasStages) def.stages.forEach(function (s) { cum.push(total); total += s.dur || 2; });
    function stageOf(u) {
      if (!hasStages) return 0;
      var tt = u * total;
      for (var i = 0; i < def.stages.length; i++) if (tt < cum[i] + (def.stages[i].dur || 2)) return i;
      return def.stages.length - 1;
    }
    function stagePhase(u) {
      if (!hasStages) return 1;
      var s = stageOf(u), tt = u * total;
      return Math.max(0, Math.min(1, (tt - cum[s]) / (def.stages[s].dur || 2)));
    }

    var nEl = root.querySelector('.mw-n');
    var t0El = root.querySelector('[data-s="t0"]'), t1El = root.querySelector('[data-s="t1"]');
    var g0El = root.querySelector('[data-s="g0"]'), g1El = root.querySelector('[data-s="g1"]');
    var readoutEl = root.querySelector('.mw-readout');
    var hintEl = root.querySelector('.mw-hint');
    hintEl.innerHTML = '<span class="lang-zh">' + ((def.hint && def.hint[0]) || UI.hintDef[0]) + '</span><span class="lang-en">' + ((def.hint && def.hint[1]) || UI.hintDef[1]) + '</span>';

    /* dots */
    var dotEls = [];
    if (hasStages) {
      var dots = root.querySelector('.mw-dots');
      def.stages.forEach(function (_, i) {
        var d = document.createElement('button');
        d.className = 'mw-dot'; d.setAttribute('aria-label', 'stage ' + (i + 1));
        d.addEventListener('click', function () { jump(cum[i] / total + 1e-4); });
        dots.appendChild(d); dotEls.push(d);
      });
    }

    /* params UI */
    var paramRefs = {}, firstRangeP = null;
    var paramsEl = root.querySelector('.mw-params');
    (def.params || []).forEach(function (p) {
      var wrap = document.createElement('div');
      wrap.className = 'mw-param';
      if (p.type === 'choice') {
        wrap.innerHTML = '<span class="mw-plabel"><span class="lang-zh">' + p.zh + '</span><span class="lang-en">' + p.en + '</span></span>';
        var grp = document.createElement('span'); grp.className = 'mw-choice';
        p.options.forEach(function (o) {
          var b = document.createElement('button');
          b.className = 'mw-btn mw-cb'; b.dataset.v = o.v;
          b.innerHTML = '<span class="lang-zh">' + o.zh + '</span><span class="lang-en">' + (o.en || o.zh) + '</span>';
          b.addEventListener('click', function () {
            st.params[p.key] = o.v; st.dirty = true;
            grp.querySelectorAll('.mw-cb').forEach(function (x) { x.classList.toggle('on', x.dataset.v === String(st.params[p.key])); });
            if (p.onSet) p.onSet(st);
          });
          if (String(o.v) === String(st.params[p.key])) b.classList.add('on');
          grp.appendChild(b);
        });
        wrap.appendChild(grp);
      } else {
        wrap.innerHTML = '<span class="mw-plabel"><span class="lang-zh">' + p.zh + '</span><span class="lang-en">' + p.en + '</span> <b class="mw-pval"></b></span>';
        var inp = document.createElement('input');
        inp.type = 'range'; inp.min = p.min; inp.max = p.max; inp.step = p.step || 1; inp.value = p.def;
        var valEl = wrap.querySelector('.mw-pval');
        var render = function () { valEl.textContent = p.fmt ? p.fmt(st.params[p.key]) : st.params[p.key]; };
        inp.addEventListener('input', function () {
          userTouch();
          st.params[p.key] = parseFloat(inp.value); st.dirty = true; render();
          if (p.onSet) p.onSet(st);
        });
        inp.value = st.params[p.key]; render();
        paramRefs[p.key] = { inp: inp, render: render };
        if (!firstRangeP) firstRangeP = p;
        wrap.appendChild(inp);
      }
      paramsEl.appendChild(wrap);
    });

    /* 使用者接管：任何觸碰都永久關掉自動行為，並還原進行中的輕擺提示 */
    function cancelWig() {
      if (!st.wig) return;
      var w = st.wig; st.wig = null;
      st.params[w.key] = w.base;
      var pr = paramRefs[w.key];
      if (pr) { pr.inp.value = w.base; pr.render(); }
      st.dirty = true;
    }
    function userTouch() {
      st.autoOff = true; st.autoPlaying = false;
      cancelWig();
    }
    function startWiggle() {
      var p = firstRangeP;
      st.wiggled = true;
      st.wig = { key: p.key, p: p, t: 0, dur: 1.6, base: st.params[p.key], amp: (p.max - p.min) * 0.09 };
    }
    root.addEventListener('pointerdown', userTouch);

    /* buttons */
    var playBtn = root.querySelector('[data-a="play"]');
    function syncPlay() {
      if (playBtn) playBtn.innerHTML = '<span class="lang-zh">' + (st.playing ? UI.pause[0] : UI.play[0]) + '</span><span class="lang-en">' + (st.playing ? UI.pause[1] : UI.play[1]) + '</span>';
    }
    function jump(u) { st.u = Math.max(0, Math.min(1, u)); st.playing = false; syncPlay(); st.dirty = true; }
    if (hasStages) {
      playBtn.addEventListener('click', function () {
        if (st.u >= 1) st.u = 0;
        st.playing = !st.playing; st.started = true; syncPlay(); st.dirty = true;
      });
      root.querySelector('[data-a="prev"]').addEventListener('click', function () {
        var s = stageOf(st.u);
        var eps = 0.5 / total;
        jump((s === 0 || st.u <= cum[s] / total + eps * 2 ? cum[Math.max(0, s - 1)] : cum[s]) / total + 1e-4);
      });
      root.querySelector('[data-a="next"]').addEventListener('click', function () {
        var s = stageOf(st.u);
        jump(s >= def.stages.length - 1 ? 1 : cum[s + 1] / total + 1e-4);
      });
      root.querySelector('[data-a="replay"]').addEventListener('click', function () {
        st.u = 0; st.playing = true; st.started = true; syncPlay(); st.dirty = true;
      });
      var loopBtn = root.querySelector('[data-a="loop"]');
      var syncLoop = function () { loopBtn.classList.toggle('on', st.loop); };
      syncLoop();
      loopBtn.addEventListener('click', function () { st.loop = !st.loop; syncLoop(); });
      var speedBtn = root.querySelector('[data-a="speed"]');
      var SPEEDS = [1, 2, 0.5];
      speedBtn.addEventListener('click', function () {
        var i = (SPEEDS.indexOf(st.speed) + 1) % SPEEDS.length;
        st.speed = SPEEDS[i];
        speedBtn.innerHTML = '<span class="lang-zh">' + UI.speed[0] + ' ' + st.speed + '×</span><span class="lang-en">' + UI.speed[1] + ' ' + st.speed + '×</span>';
      });
    }
    var modeBtn = root.querySelector('[data-a="mode"]');
    modeBtn.addEventListener('click', function () {
      st.mode = st.mode === 'self' ? 'pres' : 'self';
      card.classList.toggle('mw-presenter', st.mode === 'pres');
      modeBtn.classList.toggle('on', st.mode === 'pres');
      modeBtn.innerHTML = '<span class="lang-zh">' + (st.mode === 'pres' ? UI.modeSelf[0] : UI.modePres[0]) + '</span><span class="lang-en">' + (st.mode === 'pres' ? UI.modeSelf[1] : UI.modePres[1]) + '</span>';
      if (st.mode === 'pres') { st.playing = false; syncPlay(); }
    });
    root.addEventListener('keydown', function (e) {
      if (!hasStages) return;
      userTouch();
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); root.querySelector('[data-a="next"]').click(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); root.querySelector('[data-a="prev"]').click(); }
    });

    /* scrub：x0/x1 為該組件圖表區在 viewBox 的 x 範圍；未宣告＝整幅 */
    if (def.scrub) {
      var sp = def.scrub.panel || 0;
      var svgEl = svgs[sp], vb = vbs[sp];
      var sx0 = (def.scrub.x0 !== undefined) ? def.scrub.x0 : 0;
      var sx1 = (def.scrub.x1 !== undefined) ? def.scrub.x1 : vb[0];
      var hit = el('rect', { x: 0, y: 0, width: vb[0], height: vb[1], fill: '#fff', opacity: 0 }, svgEl);
      svgEl.style.cursor = 'crosshair';
      hit.addEventListener('pointermove', function (e) {
        var b = svgEl.getBoundingClientRect();
        if (!(b.width > 0)) return;   /* 隱藏語言副本寬度為 0，不算位移 */
        var xvb = (e.clientX - b.left) / b.width * vb[0];
        var x01 = Math.max(0, Math.min(1, (xvb - sx0) / (sx1 - sx0)));
        userTouch();
        st.playing = false; syncPlay();
        def.scrub.fn(x01, st); st.dirty = true;
      });
      hit.addEventListener('pointerleave', function () { /* 停在最後位置，不回跳 */ });
    }

    /* frame */
    function apply() {
      var s = stageOf(st.u), ph = stagePhase(st.u);
      if (hasStages && s !== st.lastStage) {
        st.lastStage = s;
        if (nEl) nEl.textContent = s + 1;
        var sg = def.stages[s];
        t0El.textContent = sg.zh[0]; t1El.textContent = sg.en[0];
        g0El.textContent = sg.zh[1] || ''; g1El.textContent = sg.en[1] || '';
        dotEls.forEach(function (d, j) {
          d.classList.toggle('on', j === s);
          d.classList.toggle('done', j < s);
        });
      }
      var ctx = { u: st.u, s: s, sp: ph, params: st.params, t: st.t, arg: arg, root: root };
      if (def.apply) def.apply(refs, ctx);
      if (def.guide) {
        var g = def.guide(ctx);
        if (g) { g0El.textContent = g[0]; g1El.textContent = g[1] || g[0]; }
      }
      if (def.readout) {
        var r = def.readout(ctx) || [];
        var h = '';
        r.forEach(function (seg) {
          if (typeof seg === 'string') h += '<span>' + seg + '</span>';
          else h += '<span><span class="lang-zh">' + seg[0] + '</span><span class="lang-en">' + seg[1] + '</span></span>';
        });
        readoutEl.innerHTML = h;
      }
      st.dirty = false;
    }

    var m = {
      tick: function (now) {
        var dt = Math.min(0.05, (now - (m._last || now)) / 1000); m._last = now;
        if (st.playing && now >= st.holdUntil) {
          var s = stageOf(st.u);
          var step = dt * st.speed / total;
          var nu = st.u + step;
          var ns = stageOf(nu);
          if (ns !== s && st.mode === 'self' && nu < 1) {
            st.u = cum[ns] / total + 1e-4;
            st.holdUntil = now + 900 / st.speed;
          } else st.u = Math.min(nu, 1);
          if (st.u >= 1) {
            if (st.loop) st.u = 0; else st.playing = false;
            syncPlay();
          }
          st.dirty = true;
        }
        if (st.wig) {
          var w = st.wig; w.t += dt;
          var k = Math.min(1, w.t / w.dur);
          st.params[w.key] = w.base + Math.sin(k * Math.PI * 3) * (1 - k) * w.amp;
          var pr = paramRefs[w.key];
          if (pr) { pr.inp.value = st.params[w.key]; pr.render(); }
          if (w.p.onSet) w.p.onSet(st);
          if (k >= 1) {
            st.params[w.key] = w.base;
            if (pr) { pr.inp.value = w.base; pr.render(); }
            st.wig = null;
          }
          st.dirty = true;
        }
        if (st.playing || def.alwaysTick) { st.t += dt * st.speed; st.dirty = true; }
        if (st.dirty) apply();
      }
    };
    MOUNTS.push(m);
    root._mwst = st;   /* 驗收偵錯掛點 */

    /* 進視窗自動行為：階段型自動播（循環型 loop:true 持續循環、敘事型每次進來播一遍）；
       純拉桿型首次進視窗讓第一支拉桿輕擺提示；使用者一碰就永久讓位（autoOff）；
       離開視窗暫停自動播；減少動態模式下完全不自動。 */
    if ('IntersectionObserver' in window && !REDUCED) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) {
            if (st.autoOff || st.mode !== 'self') return;
            if (hasStages) {
              if (st.u >= 1) st.u = 0;
              st.started = true; st.playing = true; st.autoPlaying = true;
              syncPlay(); st.dirty = true;
            } else if (firstRangeP && !st.wiggled) {
              startWiggle();
            }
          } else if (st.autoPlaying) {
            st.playing = false; st.autoPlaying = false;
            syncPlay(); st.dirty = true;
          }
        });
      }, { threshold: 0.45 }).observe(root);
    }

    apply();
  }

  /* ---------- 全域 reveal（§8、FAQ 等非 widget 收合） ---------- */
  function initReveal() {
    document.querySelectorAll('.mw-reveal').forEach(function (box) {
      var btn = box.querySelector('.mw-reveal-btn');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var open = box.classList.toggle('open');
        btn.innerHTML = '<span class="lang-zh">' + (open ? UI.hide[0] : UI.show[0]) + '</span><span class="lang-en">' + (open ? UI.hide[1] : UI.show[1]) + '</span>';
      });
    });
  }

  var lastNow = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    for (var i = 0; i < MOUNTS.length; i++) MOUNTS[i].tick(now);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.mw[data-mw]').forEach(mount);
    initReveal();
    requestAnimationFrame(loop);
  });

  /* 列印前把所有 FAQ/QA details 展開，確保內容印得出來 */
  window.addEventListener('beforeprint', function () {
    document.querySelectorAll('details.mw-faq').forEach(function (d) { d.open = true; });
  });

  return { register: register, PAL: PAL, el: el, txt: txt, bi: bi, path: path, pd: pd };
})();
