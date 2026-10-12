/* mw-viscosity-pour.js — §2「粘度＝抵抗流動」傾倒演示（canvas＋liquidfun-wasm 真實粒子流體）
   故事：同一個傾倒動作三杯三種命運——水一秒流光、濃稠液體慢慢滴、膠水拉成長絲。
   三杯固定（無拉桿）：水＝低粘度流體、濃稠液體＝高粘度液體（仍是液體）、史萊姆＝高分子液
        （還是會流，但流法完全不同——整團拉出來不斷、落盤收成一坨，這就是高分子
        黏彈性體的記號；命名依模擬實際長出來的行為對號——箭射中的是史萊姆）。
        CT 裁示：本頁講黏度不講橡膠——「很黏的液體」和「高分子液」分杯並排最誠實。
   高處傾倒：杯抬高＋杯身改矮（86px），空中液流落程 ~55px→~95px——
        細流水花、慢流濃稠液體、牽絲膠水的差異要在自由落體段才看得出。
   引擎：liquidfun-wasm（Box2D＋LiquidFun，zlib）——粒子旗標對應液性：
        水＝water；濃稠液體＝water|viscous（剪切變稠的慢液體，不用 tensile——tensile 會
        把液滴收成彈性塊，看起來像固體）；膠水＝water|viscous|tensile
        （tensile 的彈性黏著＝高分子液的牽絲——在濃稠液體身上是 bug，在膠水身上是 feature）。
   世界：y 朝下、50px/m；杯＝kinematic 三面盒牆繞杯緣旋轉；盤＝static；重播＝重建世界。
   播放：8s 模擬用 13s 播（0.62× 慢放）——真實傾倒一瞬結束，慢放才看得清對比。
   載入：進視窗才動態載 lf/entry.js（失敗或 reduced-motion → 靜態示意備援）。 */
MW.register('viscosity-pour', {
  vb: [520, 340],
  alwaysTick: true,
  loop: true,
  hint: ['按「播放」傾倒——三杯同樣倒法：水秒流光、濃稠液體慢滴、史萊姆一整團',
    'Press play — same pour on three cups: water is gone, the thick liquid drips slowly, slime comes out as one blob'],

  stages: [
    { dur: 16, zh: ['傾倒模擬', '同一個傾倒動作分三段加深——水第一下就流光，濃稠液體慢慢滴，史萊姆要到最深才整團出來。'],
             en: ['Pour simulation', 'Same motion, tilted deeper in three steps — water empties at once, the thick liquid drips slowly, slime only stretches out at the deepest tilt.'] }
  ],

  /* ---- liquidfun 載入（全站共享一份 promise；失敗記 failed 走備援） ---- */
  _lf: null, _lfFailed: false,
  _loadLF: function () {
    var self = this;
    if (this._lf || this._lfFailed) return;
    this._lf = new Promise(function (res) {
      var s = document.createElement('script');
      s.src = 'lf/entry.js';
      s.setAttribute('data-box2d-dir', 'lf');
      s.onload = function () {
        window.Box2D().then(function (b2) { self._b2 = b2; res(b2); },
          function () { self._lfFailed = true; res(null); });
      };
      s.onerror = function () { self._lfFailed = true; res(null); };
      document.head.appendChild(s);
    });
  },

  /* ---- 場景幾何（canvas px，y 朝下，vb 520×340）---- */
  S: 50,                       /* px per meter */
  /* 階梯傾角（CT 裁示：三杯同步 88 停→101 停→110 停）——同一動作逐步加深，
     水第一段就流光、蜜每段都滴、史萊姆到最後一段才翻得出來，差異自己跑出來 */
  VMAX: 6,                     /* 粒子速度上限 m/s——solver 擠壓彈射曾飆 52m/s 飛出世界（93% 水消失），6 只削病態噴發 */
  VMIN: 0.45,                  /* 低速煞車閾 m/s——沉底的粒子速度殘留會被 gooey 放大成表面顫動，低於此逐步凍結 */
  _low: false,                 /* 慢裝置降級：粒徑大→數少、piter 8→4、dpr→1 */
  CUPS: [{ cx: 88, nm: ['水', 'water'] }, { cx: 260, nm: ['濃稠液體', 'thick liquid'] }, { cx: 432, nm: ['史萊姆', 'slime'] }],
  LANDDX: [90, 45, 25],         /* 各流在大淺盤上的落點偏移（備援靜態圖的液窪位置用） */
  PIVY: 120,                   /* 杯支點高——拉高才有自由落體段 */
  TRAYY: 306,                  /* 盤體中心 */
  KILLY: 6.45,                 /* 清掃線（m）：322px——低於盤底、高於地板面（335） */

  /* 傾角（度）：三段階梯——0→2.8s 到 88°（ramp 太快會甩水）停 1.1s、
     3.9→4.5s 到 101°停 0.5s、5.0→5.6s 到 110°停 1.8s（史萊姆要夠久才翻得出）、
     7.4s 起 1.2s 平滑回正 */
  _tilt: function (e) {
    var ss = function (u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
    var a = 88 * ss(e / 2.8) + 13 * ss((e - 3.9) / 0.6) + 9 * ss((e - 5.0) / 0.6);
    return a * (1 - ss((e - 7.4) / 1.2));
  },

  /* 建世界：三杯（kinematic 三牆盒繞杯緣）＋三盤＋底＋粒子 */
  _buildSim: function (b2) {
    var S = this.S, m = 1 / S, self = this;
    var g = new b2.b2Vec2(0, 9.8);
    var w = new b2.b2World(g);
    g.__destroy__();
    var sim = { w: w, b2: b2, t: 0 };

    /* 暫存向量（用完即毀） */
    var V = function (x, y) { return new b2.b2Vec2(x, y); };
    var trash = [];
    var T = function (o) { trash.push(o); return o; };

    /* ── 杯：pivot＝遠側底角 (cx-34, PIVY)，往前傾倒；
          杯內緣 pivot-rel x 4..64、y -80..-4（杯身 86px——矮杯才抬得高）；
          牆厚 8px 防穿隧 ── */
    function mkCup(cx, narrow) {
      var bd = T(new b2.b2BodyDef());
      bd.type = b2.b2_kinematicBody;
      bd.position.Set((cx - 34) * m, self.PIVY * m);
      var body = w.CreateBody(bd);
      var parts = [
        [34, -1, 36, 3, 0],      /* 底 */
        [2, -44, 4, 40, 0],      /* 左牆（遠側） */
        [66, -44, 4, 40, 0],     /* 右牆（倒側） */
        [74, -84, 6, 2, 0.588]   /* 杯嘴斜唇 */
      ];
      /* 濃稠液體不設節流——88° 傾倒下黏液自然沿右唇緣拉出細流，
         擋板實測會塞死（<26px 通道＝粒徑 4 倍以下，顆粒拱塞） */
      parts.forEach(function (p) {
        var sh = T(new b2.b2PolygonShape());
        sh.SetAsBox(p[2] * m, p[3] * m, T(V(p[0] * m, p[1] * m)), p[4]);
        body.CreateFixture(sh, 0);
      });
      return body;
    }
    sim.cups = this.CUPS.map(function (c, i) { return mkCup(c.cx, i === 1); });
    sim.pivs = this.CUPS.map(function (c) { return [(c.cx - 34) * m, self.PIVY * m]; });

    /* ── 大淺盤（CT 裁示：不要三小盤、一個寬到接全部）——底＋兩端矮擋壁，
          三種液體各自落在自己三分之一處攤成三攤 ── */
    var bd = T(new b2.b2BodyDef());
    bd.position.Set(260 * m, self.TRAYY * m);
    var basin = w.CreateBody(bd);
    var bb = T(new b2.b2PolygonShape());
    bb.SetAsBox(230 * m, 5 * m, T(V(0, 7 * m)), 0);
    basin.CreateFixture(bb, 0);
    var bl = T(new b2.b2PolygonShape());
    bl.SetAsBox(5 * m, 12 * m, T(V(-232 * m, -6 * m)), 0);
    basin.CreateFixture(bl, 0);
    var br = T(new b2.b2PolygonShape());
    br.SetAsBox(5 * m, 12 * m, T(V(232 * m, -6 * m)), 0);
    basin.CreateFixture(br, 0);
    /* 不加隔肋——CT 裁示：三流在淺盤裡相融成漸層是好事 */

    /* ── 隱形地板＋左右牆（接住飛濺，畫面外） ── */
    var fd = T(new b2.b2BodyDef()); fd.position.Set(260 * m, 345 * m);
    var fl = w.CreateBody(fd);
    var fb = T(new b2.b2PolygonShape()); fb.SetAsBox(300 * m, 10 * m);
    fl.CreateFixture(fb, 0);
    [[-6, 170], [526, 170]].forEach(function (p) {
      var sd = T(new b2.b2BodyDef()); sd.position.Set(p[0] * m, p[1] * m);
      var sb = w.CreateBody(sd);
      var sw = T(new b2.b2PolygonShape()); sw.SetAsBox(6 * m, 170 * m);
      sb.CreateFixture(sw, 0);
    });

    /* ── 粒子系統：三杯各自一組（強度參數是系統級） ── */
    function mkPS(damp, vs, st, rad) {
      var d = T(new b2.b2ParticleSystemDef());
      d.radius = self._low ? rad * 1.4 : rad;
      d.dampingStrength = damp;
      d.viscousStrength = vs;
      d.surfaceTensionPressureStrength = st;
      return w.CreateParticleSystem(d);
    }
    /* 粒子群：杯內矩形（pivot 相對座標）；dx 讓群體天生坐偏倒側（史萊姆用——早出唇緣） */
    function mkGroup(ps, piv, flags, gflags, dx) {
      var d = T(new b2.b2ParticleGroupDef());
      var sh = T(new b2.b2PolygonShape());
      sh.SetAsBox(26 * m, 28 * m, T(V((34 + (dx || 0)) * m, -44 * m)), 0);
      d.shape = sh;
      d.flags = flags;
      if (gflags) d.groupFlags = gflags;
      d.position.Set(piv[0], piv[1]);
      return ps.CreateParticleGroup(d);
    }
    sim.piter = self._low ? 4 : 8;
    /* 水：細粒徑＋自由流動——0.045 會把液面頂出杯口（同容積粒子太多），0.05 剛好；
       damp 3.2——太低水花亂彈太活潑 */
    sim.psW = mkPS(2.5, 0.4, 0.28, 0.05);
    mkGroup(sim.psW, sim.pivs[0], b2.b2_waterParticle, 0);
    /* 濃稠液體：viscous＋高表面張力（互相沾黏、不彈）——88° 傾倒下
       黏液沿唇緣一坨一坨拉長再斷成滴；表面張力抱團、viscous 拖慢，
       不加 tensile（彈性回縮是史萊姆的本色，蜜沒有） */
    sim.psH = mkPS(2.0, 1.3, 0.55, 0.05);
    mkGroup(sim.psH, sim.pivs[1], b2.b2_waterParticle | b2.b2_viscousParticle, 0);
    /* 史萊姆（高分子液）：viscous＋tensile——tensile 的彈性黏著讓它整團拉出來
       不斷、落盤不散成一坨——這正是黏彈性體的樣子；在濃稠液體身上是 bug，在
       史萊姆身上是本色演出 */
    sim.psG = mkPS(3.5, 1.8, 0.4, 0.055);
    mkGroup(sim.psG, sim.pivs[2],
      b2.b2_waterParticle | b2.b2_viscousParticle | b2.b2_tensileParticle, 0, 8);

    /* 預沉降 ~1.2s：粒子群生出來是打包矩形，直接開播液面還在沉降抖動——
       先靜置讓三杯液面躺平，t=0 起就是安靜的 */
    for (var si = 0; si < 72; si++) sim.w.Step(1 / 60, 8, 3, sim.piter);

    trash.forEach(function (o) { o.__destroy__(); });
    return sim;
  },

  /* 世界推進到目標秒（cap 每幀步數；落後太多先重建再補） */
  _sync: function (sim, target) {
    var H = 1 / 30, b2 = sim.b2, self = this;
    if (target < sim.t - 0.06) { this._destroy(sim); sim = this._buildSim(b2); }
    var steps = 0;
    while (sim.t < target - 1e-6 && steps < 8) {
      var h = Math.min(1 / 60, target - sim.t);
      /* 只設角速度讓 kinematic 體自己積分（SetTransform 瞬移會把粒子彈飛）；
         ω 用「目標角−當前角」反饋，順便修正漂移 */
      var aT = this._tilt(sim.t + h) * Math.PI / 180;
      sim.cups.forEach(function (c) {
        c.SetAngularVelocity((aT - c.GetAngle()) / h);
      });
      sim.w.Step(h, 8, 3, sim.piter);   /* 粒子迭代 8（低規 4）——預設 1 次解不開旋轉容器裡的粒子床 */
      /* 病態噴發抑制：擠壓彈射曾讓水飆 52m/s 飛出世界（實測 93% 粒子越界被清、
         盤子全空）。夾速只削超速怪點；自然傾倒落速 ~5m/s 不受影響 */
      [sim.psW, sim.psH, sim.psG].forEach(function (ps) {
        var vb = ps.GetVelocityBuffer(), fv = b2.getPointer(vb) >> 2, a = b2.HEAPF32;
        var pb = ps.GetPositionBuffer(), fp = b2.getPointer(pb) >> 2;
        var n = ps.GetParticleCount(), c2 = self.VMAX * self.VMAX, m2 = self.VMIN * self.VMIN;
        for (var i = 0; i < n; i++) {
          var vx = a[fv + i * 2], vy = a[fv + i * 2 + 1], s2 = vx * vx + vy * vy;
          if (s2 > c2) { var k = self.VMAX / Math.sqrt(s2); a[fv + i * 2] = vx * k; a[fv + i * 2 + 1] = vy * k; }
          /* 低速煞車：盤區（y>5.8m≈290px）常駐；回正（t>7.6）後擴到 y>4.5m——
             杯內慢速粒子傾倒中被凍會變整床塊狀釋放；空中滴不煞（凍在半空會像懸浮） */
          else if (s2 < m2 && (a[fp + i * 2 + 1] > 5.8 || (sim.t > 7.4 && a[fp + i * 2 + 1] > 4.5))) { a[fv + i * 2] = vx * 0.4; a[fv + i * 2 + 1] = vy * 0.4; }
        }
      });
      sim.t += h; steps++;
    }
    /* 越界清理：殺穿牆/穿地板的走失粒子，加上地板線(KILLY)以下全清——
       那條線以下物理上已在盤體/地板底下，留下的都是畫面雜點；
       噴到畫面上方的不殺：重力會帶它們落回盤/地板 */
    sim._sweep = (sim._sweep || 0) + 1;
    if (sim._sweep >= 30) {
      sim._sweep = 0;
      [sim.psW, sim.psH, sim.psG].forEach(function (ps) {
        var n = ps.GetParticleCount();
        var buf = ps.GetPositionBuffer(), fp = b2.getPointer(buf) >> 2, a = b2.HEAPF32;
        for (var i = n - 1; i >= 0; i--) {
          var x = a[fp + i * 2], y = a[fp + i * 2 + 1];
          if (x < -0.35 || x > 10.75 || y > self.KILLY) ps.DestroyParticle(i);
        }
      });
    }
    return sim;
  },

  _destroy: function (sim) { if (sim && sim.w) sim.w.__destroy__(); },

  /* ---- 建構：canvas 取代 svg（面板內容＝canvas；svg 退役移除）。
     粒子層獨立一張 canvas 疊在線稿下層：SVG gooey 濾鏡（feGaussianBlur＋
     feFuncA 門檻）把圓點融合成液面——真正對 alpha 做閾值才有金屬球感；
     濾鏡不支援時退回未融合圓點（仍可讀） ---- */
  build: function (svgs, U) {
    var svg = svgs[0], panel = svg.parentElement;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!document.getElementById('mw-goo')) {
      var holder = document.createElement('div');
      holder.innerHTML = '<svg width="0" height="0" style="position:absolute"><defs>' +
        '<filter id="mw-goo" x="-20%" y="-20%" width="140%" height="140%">' +
        '<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/>' +
        '<feComponentTransfer in="b"><feFuncA type="linear" slope="18" intercept="-7.2"/></feComponentTransfer>' +
        '</filter></defs></svg>';
      document.body.appendChild(holder.firstChild);
    }
    var bcv = document.createElement('canvas');
    bcv.width = 520 * dpr; bcv.height = 340 * dpr;
    bcv.className = 'mw-blobcv';
    panel.appendChild(bcv);
    var cv = document.createElement('canvas');
    cv.width = 520 * dpr; cv.height = 340 * dpr;
    cv.className = 'mw-svg mw-pourcv';
    panel.appendChild(cv);
    panel.removeChild(svg);
    panel.style.position = 'relative';

    var r = {
      cv: cv, cx2d: cv.getContext('2d'), dpr: dpr, sim: null,
      bcv: bcv, bx2d: bcv.getContext('2d'), blobR: 8
    };
    var self = this;
    var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* 進視窗才載 wasm；減少動態模式下不自動載——等讀者明確按播放
       （手勢＝同意動畫）才載入真實模擬，否則全程停在靜態完成態 */
    if ('IntersectionObserver' in window && !REDUCED) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { self._loadLF(); io.disconnect(); } });
      }, { threshold: 0.2 });
      io.observe(panel);
    } else if (!REDUCED) this._loadLF();
    var mroot = panel.closest ? panel.closest('.mw') : null;
    if (mroot) ['play', 'replay'].forEach(function (a) {
      var b = mroot.querySelector('[data-a="' + a + '"]');
      if (b) b.addEventListener('click', function () { self._loadLF(); });
    });
    return r;
  },

  /* ---- 每幀 ---- */
  apply: function (r, ctx) {
    var P = MW.PAL, self = this;
    var g = r.cx2d, S = this.S, dpr = r.dpr;
    var target = ctx.u * 9;
    var COLS = [P.acc, P.rub, P.ok];   /* 水＝藍、濃稠液體＝橘、膠水＝綠 */

    /* 模擬就緒判定 */
    if (!r.sim && this._b2 && !this._lfFailed) r.sim = this._buildSim(this._b2);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, 520, 340);   /* 不鋪白底：下層 blob canvas 要透出來（卡片本體即白） */

    /* 慢裝置降級偵測：幀距連續偏長（<~25fps 維持約 1s）→ 重建低負載版（只降一次） */
    if (!this._low && r.sim) {
      var now = performance.now();
      var fdt = now - (r._fdt || now); r._fdt = now;
      r._slowN = Math.max(0, (r._slowN || 0) + (fdt > 40 ? 1 : -0.5));
      if (r._slowN > 25) {
        this._low = true;
        if (r.cv.width !== 520) { r.cv.width = 520; r.cv.height = 340; r.bcv.width = 520; r.bcv.height = 340; r.dpr = 1; }
        this._destroy(r.sim); r.sim = this._buildSim(this._b2);
      }
    }

    if (r.sim) r.sim = this._sync(r.sim, target);
    /* 驗收偵錯掛點 */
    r.cv._dbg = { sim: !!r.sim, t: r.sim ? +r.sim.t.toFixed(2) : null,
      nW: r.sim ? r.sim.psW.GetParticleCount() : 0,
      nH: r.sim ? r.sim.psH.GetParticleCount() : 0,
      nG: r.sim ? r.sim.psG.GetParticleCount() : 0,
      b2: !!this._b2, failed: this._lfFailed, low: this._low };

    /* ── 大淺盤（一個寬盤接全部，與 basin 同位） ── */
    var TY = this.TRAYY - 4;   /* 盤面線稿頂邊 */
    g.beginPath();
    g.moveTo(22, TY); g.lineTo(498, TY); g.lineTo(488, TY + 16); g.lineTo(32, TY + 16); g.closePath();
    g.fillStyle = P.soft; g.fill();
    g.strokeStyle = P.mut; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke();


    var tiltRad = r.sim ? this._tilt(r.sim.t) * Math.PI / 180 : this._tilt(target) * Math.PI / 180;
    /* ── 杯體：先畫半透明填充（粒子前），描線最後蓋（玻璃在液體前） ── */
    var cupPath = function () {
      g.beginPath();
      g.roundRect ? g.roundRect(-2, -88, 72, 90, 9) : g.rect(-2, -88, 72, 90);
      g.moveTo(64, -88); g.lineTo(80, -80); g.lineTo(67, -72); g.closePath();
    };
    this.CUPS.forEach(function (c) {
      g.save(); g.translate(c.cx - 34, self.PIVY); g.rotate(tiltRad);
      cupPath(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
      g.restore();
    });
    /* ── 粒子（真實模擬）或靜態液體（備援） ── */
    /* 粒子畫到下層 blob canvas（液面由 gooey 濾鏡融合） */
    var drawParts = function (ps, col) {
      var n = ps.GetParticleCount(); if (!n) return;
      var buf = ps.GetPositionBuffer();
      var ptr = r.sim.b2.getPointer(buf);
      var f32 = r.sim.b2.HEAPF32.subarray(ptr >> 2, (ptr >> 2) + n * 2);
      var ctx = r.bx2d, rr = r.blobR;
      ctx.fillStyle = col;
      ctx.beginPath();
      for (var i = 0; i < n; i++) {
        var x = f32[i * 2] * S, y = f32[i * 2 + 1] * S;
        ctx.moveTo(x + rr, y); ctx.arc(x, y, rr, 0, 6.2832);
      }
      ctx.fill();
    };

    r.bx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    r.bx2d.clearRect(0, 0, 520, 340);
    if (r.sim) {
      drawParts(r.sim.psW, COLS[0]);
      drawParts(r.sim.psH, COLS[1]);
      drawParts(r.sim.psG, COLS[2]);
    } else {
      /* 備援靜態示意：杯內液量＋盤中積液近似（載入中／wasm 失敗／reduced-motion）
         水約1s倒完、濃稠液體~5s、史萊姆最慢（整團~7s） */
      var pW = Math.max(0, Math.min(1, (target - 0.8) / 1.2));
      var pH = Math.max(0, Math.min(1, (target - 1.2) / 5));
      var pG = Math.max(0, Math.min(1, (target - 1.5) / 6.5));
      [[0, pW, COLS[0]], [1, pH, COLS[1]], [2, pG, COLS[2]]].forEach(function (c) {
        var cx = self.CUPS[c[0]].cx, p = c[1], col = c[2];
        var f = Math.max(0, 1 - p * 0.97);
        g.save(); g.translate(cx - 34, self.PIVY); g.rotate(tiltRad);
        g.beginPath(); g.rect(4, -80, 60, 76); g.clip();
        g.fillStyle = col;
        g.fillRect(4, -4 - 76 * f, 60, 76 * f);
        g.restore();
        if (p > 0.01) {
          var spr = 40 * Math.pow(p, 0.7), md = 2.4 + Math.pow(p, 0.8) * 4;
          g.fillStyle = col; g.globalAlpha = 0.8;
          g.beginPath(); g.ellipse(cx + self.LANDDX[c[0]], TY + 9 - md, 5 + spr, md, 0, 0, 6.2832); g.fill();
          g.globalAlpha = 1;
        }
      });
    }
    this.CUPS.forEach(function (c) {
      g.save(); g.translate(c.cx - 34, self.PIVY); g.rotate(tiltRad);
      cupPath(); g.strokeStyle = P.mut; g.lineWidth = 2.2; g.stroke();
      g.restore();
    });

    /* ── 標註（canvas 文字依當前語言） ── */
    var en = document.body.classList.contains('show-en');
    var FAM = '"PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    g.fillStyle = P.mut; g.font = '600 12.5px ' + FAM; g.textAlign = 'center';
    this.CUPS.forEach(function (c) { g.fillText(en ? c.nm[1] : c.nm[0], c.cx, 26); });
    if (!r.sim && !this._lfFailed && this._lf) {
      g.fillStyle = P.mut; g.font = '12px ' + FAM;
      g.fillText(en ? 'loading fluid engine…' : '流體引擎載入中…', 260, 170);
    }
  },

  readout: function (ctx) {
    return [
      ['水 · 約 <b>1 秒</b>流光', 'Water · gone in ~<b>1 s</b>'],
      ['濃稠液體 · 還是液體，只是慢——<b>慢慢滴</b>', 'Thick liquid · still a liquid, just slow — <b>slow drips</b>'],
      ['史萊姆 · 高分子液——<b>拉出來不斷</b>、落盤收成一團', 'Slime · a polymer liquid — <b>stretches without breaking</b>, lands as one blob']
    ];
  },

  guide: function (ctx) {
    return ['同樣的倒法三種流法：水一秒流光、濃稠那杯還是液體只是懶得動、史萊姆拉出來一整團不斷——黏度是抵抗流動的程度；高分子液那種「黏彈性」已經是另一種故事，後面木尼章節會接上。',
      'Same pour, three ways of flowing: water is gone in a second, the thick one is a liquid but lazy, slime stretches out as one unbroken blob — viscosity is resistance to flow; the viscoelasticity of a polymer liquid is another story, picked up in the Mooney chapters.'];
  }
});
