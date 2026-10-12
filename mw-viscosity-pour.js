/* mw-viscosity-pour.js — §2「粘度＝抵抗流動」傾倒演示（canvas＋liquidfun-wasm 真實粒子流體）
   故事：同一個傾倒動作，水一秒流光、蜂蜜慢慢爬——粘度就是抵抗流動的程度。
   互動：播放鍵＝傾倒（單段 8 秒）；拉桿改右杯粘度——1≈水、85≈蜂蜜、100＝橡膠。
   引擎：liquidfun-wasm（Box2D＋LiquidFun，zlib）——粒子旗標對應液性：
        水＝water|powder（攤開）、糖漿＝water|tensile、蜂蜜＝water|viscous|tensile、
        橡膠＝solid|rigid 粒子群（剛體不流）。
   世界：y 朝下、50px/m；杯＝kinematic 三面盒牆繞杯緣旋轉；盤＝static；重播＝重建世界。
   載入：進視窗才動態載 lf/entry.js（失敗或 reduced-motion → 靜態示意備援）。 */
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

  /* 倒完秒數（教學近似，供讀數顯示；實際傾倒由粒子模擬決定） */
  _pourTime: function (v) { return v >= 99.5 ? Infinity : 1 + (v - 1) * 5 / 84; },

  _fluid: function (v, P) {
    if (v < 3) return { nm: ['水', 'water'], col: P.acc };
    if (v >= 99.5) return { nm: ['橡膠', 'rubber'], col: P.acc2 };
    if (v >= 60) return { nm: ['蜂蜜', 'honey'], col: P.rub };
    return { nm: ['糖漿', 'syrup'], col: P.rub };
  },

  /* ---- liquidfun 載入（全站共享一份 promise；失敗記 failed 走備援） ---- */
  _lf: null, _lfFailed: false,
  _loadLF: function () {
    var self = this;
    if (this._lf || this._lfFailed) return;
    var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (REDUCED) { this._lfFailed = true; return; }
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

  /* ---- 場景幾何（canvas px，y 朝下）---- */
  S: 50,                       /* px per meter */
  TILT: 118,                   /* 最大傾角——真物理下杯口要過水平線才倒得出來（支點＝遠側底角） */
  TILT_T: 1.5,                 /* 傾倒時間（秒）——1.5s＋damp1.2 水花最收斂（node 調參） */
  CUPL: { cx: 135 }, CUPR: { cx: 355 },
  TXL: 203, TXR: 423,

  /* 傾角（度）：1.2s ease-out 傾倒、最後 1s 回正 */
  _tilt: function (e) {
    var tu = Math.min(1, e / this.TILT_T);
    var m = e > 7 ? Math.max(0, 8 - e) : 1;
    return this.TILT * tu * (2 - tu) * m;
  },

  /* 粘度→右杯粒子組態（水＝純 water；powder 水花四散不採用） */
  _rconf: function (v, b2) {
    var W = b2.b2_waterParticle, F = { f: W, g: 0, damp: 1.2, vs: 0.4 };
    if (v >= 3 && v < 60)  F = { f: W | b2.b2_tensileParticle, g: 0, damp: 1.4, vs: 0.8 };
    if (v >= 60 && v < 99.5) F = { f: W | b2.b2_viscousParticle | b2.b2_tensileParticle, g: 0, damp: 3.2, vs: 1.6 };
    if (v >= 99.5) F = { f: W | b2.b2_viscousParticle | b2.b2_tensileParticle,
      g: b2.b2_solidParticleGroup | b2.b2_rigidParticleGroup, damp: 1, vs: 1 };
    return F;
  },

  /* 建世界：杯（kinematic 三牆盒繞杯緣）＋盤＋底＋粒子 */
  _buildSim: function (b2) {
    var S = this.S, m = 1 / S;
    var g = new b2.b2Vec2(0, 9.8);
    var w = new b2.b2World(g);
    g.__destroy__();
    var sim = { w: w, b2: b2, t: 0 };

    /* 暫存向量（用完即毀） */
    var V = function (x, y) { return new b2.b2Vec2(x, y); };
    var trash = [];
    var T = function (o) { trash.push(o); return o; };

    /* ── 杯：pivot＝遠側底角 (cx-34,148)，往前傾倒；
          杯內緣 pivot-rel x 4..64、y -104..-4；牆厚 8px 防穿隧。
          lid＝杯口隱形擋板（僅橡膠）：倒置時膠塊頂住不脫落——
          生膠本來就黏，模擬成「黏在杯裡不流」比「整塊掉出」更貼近教學敘事 ── */
    function mkCup(cx, lid) {
      var bd = T(new b2.b2BodyDef());
      bd.type = b2.b2_kinematicBody;
      bd.position.Set((cx - 34) * m, 148 * m);
      var body = w.CreateBody(bd);
      var parts = [
        [34, -1, 36, 3, 0],      /* 底 */
        [2, -54, 4, 54, 0],      /* 左牆（遠側） */
        [66, -54, 4, 54, 0],     /* 右牆（倒側） */
        [74, -100, 6, 2, 0.588]  /* 杯嘴斜唇 */
      ];
      if (lid) parts.push([40, -100, 38, 3, 0]);
      parts.forEach(function (p) {
        var sh = T(new b2.b2PolygonShape());
        sh.SetAsBox(p[2] * m, p[3] * m, T(V(p[0] * m, p[1] * m)), p[4]);
        body.CreateFixture(sh, 0);
      });
      return body;
    }
    sim.cupL = mkCup(this.CUPL.cx, false);
    sim.cupR = mkCup(this.CUPR.cx, this._curVisc >= 99.5);
    sim.pivL = [(this.CUPL.cx - 34) * m, 148 * m];
    sim.pivR = [(this.CUPR.cx - 34) * m, 148 * m];

    /* ── 盤：底＋左右斜壁（加厚防穿隧） ── */
    function mkTray(tx) {
      var bd = T(new b2.b2BodyDef());
      bd.position.Set(tx * m, 268 * m);
      var body = w.CreateBody(bd);
      var bt = T(new b2.b2PolygonShape());
      bt.SetAsBox(53 * m, 5 * m, T(V(0, 7 * m)), 0);
      body.CreateFixture(bt, 0);
      var sl = T(new b2.b2PolygonShape());
      sl.SetAsBox(12 * m, 4 * m, T(V(-57 * m, -8 * m)), 0.93);
      body.CreateFixture(sl, 0);
      var sr = T(new b2.b2PolygonShape());
      sr.SetAsBox(12 * m, 4 * m, T(V(57 * m, -8 * m)), 2.21);
      body.CreateFixture(sr, 0);
      return body;
    }
    mkTray(this.TXL); mkTray(this.TXR);

    /* ── 隱形地板＋左右牆（接住飛濺，畫面外） ── */
    var fd = T(new b2.b2BodyDef()); fd.position.Set(260 * m, 320 * m);
    var fl = w.CreateBody(fd);
    var fb = T(new b2.b2PolygonShape()); fb.SetAsBox(300 * m, 10 * m);
    fl.CreateFixture(fb, 0);
    [[-6, 150], [526, 150]].forEach(function (p) {
      var sd = T(new b2.b2BodyDef()); sd.position.Set(p[0] * m, p[1] * m);
      var sb = w.CreateBody(sd);
      var sw = T(new b2.b2PolygonShape()); sw.SetAsBox(6 * m, 160 * m);
      sb.CreateFixture(sw, 0);
    });

    /* ── 粒子系統：左水右液各自一組（強度參數是系統級） ── */
    function mkPS(damp, vs) {
      var d = T(new b2.b2ParticleSystemDef());
      d.radius = 0.055;
      d.dampingStrength = damp;
      d.viscousStrength = vs;
      d.surfaceTensionPressureStrength = 0.4;
      return w.CreateParticleSystem(d);
    }
    sim.psL = mkPS(1.2, 0.4);

    /* 粒子群：杯內矩形（pivot 相對座標） */
    function mkGroup(ps, piv, flags, gflags) {
      var d = T(new b2.b2ParticleGroupDef());
      var sh = T(new b2.b2PolygonShape());
      sh.SetAsBox(26 * m, 34 * m, T(V(34 * m, -54 * m)), 0);
      d.shape = sh;
      d.flags = flags;
      if (gflags) d.groupFlags = gflags;
      d.position.Set(piv[0], piv[1]);
      return ps.CreateParticleGroup(d);
    }
    mkGroup(sim.psL, sim.pivL, b2.b2_waterParticle, 0);

    var rc = this._rconf(this._curVisc, b2);
    sim.psR = mkPS(rc.damp, rc.vs);
    mkGroup(sim.psR, sim.pivR, rc.f, rc.g);
    sim.visc = this._curVisc;

    trash.forEach(function (o) { o.__destroy__(); });
    return sim;
  },

  /* 世界推進到目標秒（cap 每幀步數；落後太多先重建再補） */
  _sync: function (sim, target, v) {
    var H = 1 / 30, b2 = sim.b2, self = this;
    if (target < sim.t - 0.06) { this._destroy(sim); sim = this._buildSim(b2); }
    if (v !== sim.visc) {
      if ((v >= 99.5) !== (sim.visc >= 99.5) || !sim._deb || performance.now() - sim._deb > 150) {
        sim._deb = performance.now();
        this._destroy(sim); sim = this._buildSim(b2);
      }
    }
    var steps = 0;
    while (sim.t < target - 1e-6 && steps < 8) {
      var h = Math.min(1 / 60, target - sim.t);
      /* 只設角速度讓 kinematic 體自己積分（SetTransform 瞬移會把粒子彈飛）；
         ω 用「目標角−當前角」反饋，順便修正漂移 */
      var aT = this._tilt(sim.t + h) * Math.PI / 180;
      [sim.cupL, sim.cupR].forEach(function (c) {
        c.SetAngularVelocity((aT - c.GetAngle()) / h);
      });
      sim.w.Step(h, 8, 3, 8);   /* 粒子迭代固定 8——預設 1 次解不開旋轉容器裡的粒子床 */
      sim.t += h; steps++;
    }
    /* 越界清理：只殺真正走失的——穿過側牆或沉到地板下（穿隧）。
       噴到畫面上方的粒子不殺：重力會帶它們落回盤/地板，殺了反而讓水變少 */
    sim._sweep = (sim._sweep || 0) + 1;
    if (sim._sweep >= 30) {
      sim._sweep = 0;
      [sim.psL, sim.psR].forEach(function (ps) {
        var n = ps.GetParticleCount();
        var buf = ps.GetPositionBuffer(), fp = b2.getPointer(buf) >> 2, a = b2.HEAPF32;
        for (var i = n - 1; i >= 0; i--) {
          var x = a[fp + i * 2], y = a[fp + i * 2 + 1];
          if (x < -0.35 || x > 10.75 || y > 6.8) ps.DestroyParticle(i);
        }
      });
    }
    return sim;
  },

  _destroy: function (sim) { if (sim && sim.w) sim.w.__destroy__(); },

  /* ---- 建構：canvas 取代 svg（面板內容＝canvas；svg 退役移除） ---- */
  build: function (svgs, U) {
    var svg = svgs[0], panel = svg.parentElement;
    var cv = document.createElement('canvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = 520 * dpr; cv.height = 300 * dpr;
    cv.className = 'mw-svg mw-pourcv';
    panel.appendChild(cv);
    panel.removeChild(svg);

    var r = { cv: cv, cx2d: cv.getContext('2d'), dpr: dpr, sim: null };
    var self = this;
    /* 進視窗才載 wasm */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { self._loadLF(); io.disconnect(); } });
      }, { threshold: 0.2 });
      io.observe(panel);
    } else this._loadLF();
    return r;
  },

  /* ---- 每幀 ---- */
  apply: function (r, ctx) {
    var P = MW.PAL, v = ctx.params.visc, self = this;
    this._curVisc = v;
    var g = r.cx2d, S = this.S, dpr = r.dpr;
    var target = ctx.u * 8;

    /* 模擬就緒判定 */
    if (!r.sim && this._b2 && !this._lfFailed) r.sim = this._buildSim(this._b2);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, 520, 300);
    g.fillStyle = '#fff'; g.fillRect(0, 0, 520, 300);

    var fl = this._fluid(v, P);
    if (r.sim) r.sim = this._sync(r.sim, target, v);
    /* 驗收偵錯掛點 */
    r.cv._dbg = { sim: !!r.sim, t: r.sim ? +r.sim.t.toFixed(2) : null,
      nL: r.sim ? r.sim.psL.GetParticleCount() : 0,
      nR: r.sim ? r.sim.psR.GetParticleCount() : 0,
      b2: !!this._b2, failed: this._lfFailed, v: v };
    if (r.sim) {
      var bb = r.sim.psL.GetPositionBuffer(), np = r.sim.psL.GetParticleCount();
      var fp = r.sim.b2.getPointer(bb) >> 2;
      var a = r.sim.b2.HEAPF32;
      var xs = [], ys = [];
      for (var di = 0; di < np; di++) { xs.push(a[fp + di * 2]); ys.push(a[fp + di * 2 + 1]); }
      r.cv._dbg.xr = [Math.min.apply(0, xs).toFixed(2), Math.max.apply(0, xs).toFixed(2)];
      r.cv._dbg.yr = [Math.min.apply(0, ys).toFixed(2), Math.max.apply(0, ys).toFixed(2)];
      r.cv._dbg.p0 = [a[fp].toFixed(2), a[fp + 1].toFixed(2)];
    }

    /* ── 盤面 ── */
    [this.TXL, this.TXR].forEach(function (tx) {
      g.beginPath();
      g.moveTo(tx - 63, 252); g.lineTo(tx + 63, 252); g.lineTo(tx + 51, 268); g.lineTo(tx - 51, 268); g.closePath();
      g.fillStyle = P.soft; g.fill();
      g.strokeStyle = P.mut; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke();
    });

    var tiltRad = r.sim ? this._tilt(r.sim.t) * Math.PI / 180 : this._tilt(target) * Math.PI / 180;
    /* ── 杯體：先畫半透明填充（粒子前），描線最後蓋（玻璃在液體前） ── */
    var cupPath = function () {
      g.beginPath();
      g.roundRect ? g.roundRect(-2, -108, 72, 110, 9) : g.rect(-2, -108, 72, 110);
      g.moveTo(64, -108); g.lineTo(80, -100); g.lineTo(67, -92); g.closePath();
    };
    [this.CUPL.cx, this.CUPR.cx].forEach(function (cx) {
      g.save(); g.translate(cx - 34, 148); g.rotate(tiltRad);
      cupPath(); g.fillStyle = 'rgba(255,255,255,0.55)'; g.fill();
      g.restore();
    });
    /* ── 粒子（真實模擬）或靜態液體（備援） ── */
    var drawParts = function (ps, col) {
      var n = ps.GetParticleCount(); if (!n) return;
      var buf = ps.GetPositionBuffer();
      var ptr = r.sim.b2.getPointer(buf);
      var f32 = r.sim.b2.HEAPF32.subarray(ptr >> 2, (ptr >> 2) + n * 2);
      g.fillStyle = col; g.globalAlpha = 0.85;
      g.beginPath();
      for (var i = 0; i < n; i++) {
        var x = f32[i * 2] * S, y = f32[i * 2 + 1] * S;
        g.moveTo(x + 4.2, y); g.arc(x, y, 4.2, 0, 6.2832);
      }
      g.fill(); g.globalAlpha = 1;
    };

    if (r.sim) {
      drawParts(r.sim.psL, P.acc);
      drawParts(r.sim.psR, fl.col);
    } else {
      /* 備援靜態示意：杯內液量＋盤中積液近似（載入中／wasm 失敗／reduced-motion） */
      var ptR = this._pourTime(v);
      var p = ptR === Infinity ? 0 : Math.max(0, Math.min(1, (target - 0.8) / ptR));
      [[this.CUPL.cx, 1, P.acc, this.TXL], [this.CUPR.cx, ptR, fl.col, this.TXR]].forEach(function (c) {
        var f = c[1] === Infinity ? 0.9 : Math.max(0, 1 - p * 0.97);
        g.save(); g.translate(c[0] - 34, 148); g.rotate(tiltRad);
        g.beginPath(); g.rect(4, -104, 60, 100); g.clip();
        g.fillStyle = c[2];
        g.fillRect(4, -4 - 100 * f, 60, 100 * f);
        g.restore();
        var spr = 46 * Math.pow(p, 0.7), md = 2.4 + Math.pow(p, 0.8) * 4;
        if (p > 0.01 && c[1] !== Infinity) {
          g.fillStyle = c[2]; g.globalAlpha = 0.8;
          g.beginPath(); g.ellipse(c[3], 261 - md, 5 + spr, md, 0, 0, 6.2832); g.fill();
          g.globalAlpha = 1;
        }
      });
    }
    [this.CUPL.cx, this.CUPR.cx].forEach(function (cx) {
      g.save(); g.translate(cx - 34, 148); g.rotate(tiltRad);
      cupPath(); g.strokeStyle = P.mut; g.lineWidth = 2.2; g.stroke();
      g.restore();
    });

    /* ── 標註（canvas 文字依當前語言） ── */
    var en = document.body.classList.contains('show-en');
    var FAM = '"PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    g.fillStyle = P.mut; g.font = '600 12.5px ' + FAM; g.textAlign = 'center';
    g.fillText(en ? 'water' : '水', 135, 26);
    g.fillText(en ? fl.nm[1] : fl.nm[0], 355, 26);
    if (v >= 99.5) {
      g.fillStyle = P.warn; g.font = '700 11px ' + FAM;
      g.fillText(en ? 'won’t flow on its own' : '不會自己流', this.TXR, 235);
    }
    if (!r.sim && !this._lfFailed) {
      g.fillStyle = P.mut; g.font = '12px ' + FAM;
      g.fillText(en ? 'loading fluid engine…' : '流體引擎載入中…', 260, 150);
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
