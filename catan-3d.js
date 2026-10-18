// Tablero 3D de Catán dibujado en SVG con proyección propia: se puede girar, inclinar y acercar.
// Hexágonos con volumen (prismas con capas), piezas en 3D (casas, ciudades, caminos), decorado de pie.
// Uso: const b = Catan3D.create(wrapEl, board); b.draw({ g, colors, spots, collect });
(function (root) {
  const Board = root.CatanBoard;
  const SZ = 60, PERSP = 0.00045;
  const HT = { ore: 30, brick: 23, wood: 21, wool: 16, grain: 14, desert: 11 };
  const INS = 6, RB = SZ - 1; // chaflán de la cara superior y radio del cuerpo
  const TOP = { wood: ['#4b8f52', '#245a2e'], brick: ['#d97650', '#a24a2c'], wool: ['#aadb70', '#72ad46'], grain: ['#f5d468', '#d1a53c'], ore: ['#b4bbc6', '#737c89'], desert: ['#f2e3b4', '#cebb7f'] };
  const BAND = { wood: '#2b6c37', brick: '#9c4528', wool: '#62a03a', grain: '#b88c2d', ore: '#5f6874', desert: '#bba672' };
  const DIRT = '#5b4229';
  const LIGHT = (() => { const l = [-0.45, -0.55, 0.7], m = Math.hypot(l[0], l[1], l[2]); return l.map((v) => v / m); })();
  const RESCOL = { wood: '#3b7a45', brick: '#c0583a', wool: '#9ccf63', grain: '#e8c04b', ore: '#8d95a2' };

  // ---------- utilidades ----------
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (k <= 1) { r *= k; g *= k; b *= k; } else { const t = Math.min(1, k - 1); r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; }
    const hx = (v) => ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2);
    return '#' + hx(r) + hx(g) + hx(b);
  }
  const f1 = (v) => (Math.round(v * 10) / 10);
  const poly = (pts) => pts.map((p) => f1(p.x) + ',' + f1(p.y)).join(' ');
  const hexLocal = (r) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return f1(r * Math.cos(a)) + ',' + f1(r * Math.sin(a)); }).join(' ');
  const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

  // ---------- decorado de cada hexágono ----------
  // ground: dibujo plano sobre el suelo (en coordenadas locales). objs: elementos de pie (se dibujan siempre de frente).
  function decor(res, r) {
    const ground = [], objs = [];
    const spread = (n, minD, rmin, rmax) => {
      const out = []; let tries = 0;
      while (out.length < n && tries < 400) {
        tries++;
        const a = r() * 6.283, d = (rmin + r() * (rmax - rmin)) * SZ * 0.9, x = Math.cos(a) * d, y = Math.sin(a) * d;
        if (out.every((p) => Math.hypot(p.x - x, p.y - y) > minD)) out.push({ x, y });
      }
      return out;
    };
    if (res === 'wood') {
      spread(11, 13, 0.4, 0.82).forEach((p) => {
        const k = 0.85 + r() * 0.45;
        if (r() < 0.3) objs.push({ x: p.x, y: p.y, s: k, svg: '<ellipse cy="10" rx="9" ry="2.8" fill="rgba(0,0,0,.28)"/><rect x="-1.8" y="1" width="3.6" height="10" fill="#4b2e17"/><circle cx="-5" cy="-3" r="7" fill="#2f7d3b"/><circle cx="5" cy="-4" r="7.5" fill="#3a9148"/><circle cx="0" cy="-10" r="8" fill="#47a655"/><circle cx="-2.5" cy="-12.5" r="3.4" fill="#7fd18a" opacity=".6"/>' });
        else objs.push({ x: p.x, y: p.y, s: k, svg: '<ellipse cy="10" rx="8" ry="2.6" fill="rgba(0,0,0,.28)"/><rect x="-1.7" y="4" width="3.4" height="7" fill="#4b2e17"/><polygon points="0,-22 8,-9 -8,-9" fill="#1d5a2d"/><polygon points="0,-14 10,0 -10,0" fill="#27703a"/><polygon points="0,-6 12,7 -12,7" fill="#2e8040"/><polygon points="0,-22 3,-16 -2,-15" fill="#52ad62"/><polygon points="0,-14 4,-8 -2,-7" fill="#46a05a" opacity=".8"/>' });
      });
      spread(14, 9, 0.2, 0.9).forEach((p) => ground.push(`<ellipse cx="${f1(p.x)}" cy="${f1(p.y)}" rx="10" ry="6.5" fill="#143d1f" opacity=".38"/>`));
      spread(10, 8, 0.2, 0.9).forEach((p) => ground.push(`<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="1.5" fill="${r() < 0.5 ? '#e8d0a0' : '#c9473a'}" opacity=".9"/>`));
    } else if (res === 'wool') {
      spread(6, 19, 0.45, 0.8).forEach((p) => {
        const k = 1 + r() * 0.3, f = r() < 0.5 ? 1 : -1;
        objs.push({ x: p.x, y: p.y, s: k, f, svg: '<ellipse cy="9" rx="8.5" ry="2.6" fill="rgba(0,0,0,.24)"/><ellipse cy="1" rx="8.2" ry="5.8" fill="#f8f5ea" stroke="#c4bea8" stroke-width=".8"/><circle cx="7" cy="-1.5" r="3" fill="#3a3834"/><rect x="-4.5" y="4" width="2" height="5.5" fill="#3a3834"/><rect x="3" y="4" width="2" height="5.5" fill="#3a3834"/>' });
      });
      spread(30, 6, 0.1, 0.92).forEach((p) => ground.push(`<path d="M${f1(p.x)} ${f1(p.y)} l1.2 -4 M${f1(p.x + 3)} ${f1(p.y)} l-1 -3.4" stroke="#d6f5a0" stroke-width="1.2" stroke-linecap="round" opacity=".7" fill="none"/>`));
      spread(16, 7, 0.15, 0.9).forEach((p) => { const c = ['#fff6f0', '#ffd24a', '#f59ac0', '#b7a6ff'][Math.floor(r() * 4)]; ground.push(`<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="1.7" fill="${c}"/><circle cx="${f1(p.x)}" cy="${f1(p.y)}" r=".6" fill="#e08a1a"/>`); });
    } else if (res === 'grain') {
      for (let k = -7; k <= 7; k++) {
        ground.push(`<line x1="${k * 9}" y1="-62" x2="${k * 9}" y2="62" stroke="#b98a22" stroke-width="3.4" opacity=".4"/>`);
        ground.push(`<line x1="${k * 9 + 3}" y1="-62" x2="${k * 9 + 3}" y2="62" stroke="#fff3b8" stroke-width="2" stroke-dasharray="2 5" opacity=".55"/>`);
      }
      spread(2, 30, 0.5, 0.78).forEach((p) => objs.push({ x: p.x, y: p.y, s: 1, svg: '<ellipse cy="8" rx="11" ry="3" fill="rgba(0,0,0,.25)"/><rect x="-9" y="-6" width="18" height="13" rx="6" fill="#e0b14a" stroke="#8f6a14" stroke-width="1"/><ellipse cx="-9" cy=".5" rx="2.6" ry="6.5" fill="#f1cd6e" stroke="#8f6a14" stroke-width=".8"/><path d="M-6 -3 H8 M-6 1 H8 M-6 5 H8" stroke="#a97d1c" stroke-width=".9" opacity=".7"/>' }));
      spread(10, 13, 0.4, 0.82).forEach((p) => {
        const k = 0.9 + r() * 0.3;
        objs.push({ x: p.x, y: p.y, s: k, svg: '<ellipse cy="9" rx="8" ry="2.2" fill="rgba(0,0,0,.2)"/><path d="M-4.5 9 L-5.5 -7 M0 9 L0 -10 M4.5 9 L5.5 -7" stroke="#b98a22" stroke-width="1.7" fill="none"/><g fill="#eab93a" stroke="#9a6f12" stroke-width=".6"><ellipse cx="-5.5" cy="-9" rx="2.2" ry="4.8"/><ellipse cx="0" cy="-12" rx="2.2" ry="4.8"/><ellipse cx="5.5" cy="-9" rx="2.2" ry="4.8"/></g>' });
      });
    } else if (res === 'brick') {
      spread(8, 17, 0.42, 0.8).forEach((p) => {
        const k = 0.9 + r() * 0.5;
        objs.push({ x: p.x, y: p.y, s: k, svg: '<ellipse cy="9" rx="13" ry="3.2" fill="rgba(0,0,0,.25)"/><path d="M-13 8 Q0 -17 13 8 Z" fill="#a7472a" stroke="#6f2a16" stroke-width="1.1"/><path d="M-7 4 Q0 -8 6 -2" fill="none" stroke="#e8946a" stroke-width="1.8" opacity=".85"/><path d="M2 8 Q8 -2 12 6" fill="none" stroke="#7d3219" stroke-width="1.2" opacity=".7"/>' });
      });
      spread(10, 10, 0.1, 0.9).forEach((p) => ground.push(`<path d="M${f1(p.x - 5)} ${f1(p.y)} h10 M${f1(p.x - 3)} ${f1(p.y + 3)} h8" stroke="#8c3b21" stroke-width="1.4" opacity=".5" fill="none"/>`));
    } else if (res === 'ore') {
      spread(5, 26, 0.4, 0.8).forEach((p) => {
        const k = 0.7 + r() * 0.34;
        objs.push({ x: p.x, y: p.y, s: k, svg: '<ellipse cy="10" rx="15" ry="3.4" fill="rgba(0,0,0,.28)"/><polygon points="0,-24 15,10 -15,10" fill="#8b93a1" stroke="#3b4350" stroke-width="1.1"/><polygon points="0,-24 15,10 5,10" fill="#5c6471"/><polygon points="0,-24 6,-9 1,-12 -6,-8" fill="#f6f8fb"/><polygon points="-15,10 -6,-8 -2,10" fill="#a4abb8"/>' });
      });
      spread(7, 12, 0.3, 0.85).forEach((p) => objs.push({ x: p.x, y: p.y, s: 0.8 + r() * 0.5, svg: '<ellipse cy="5" rx="8" ry="2.2" fill="rgba(0,0,0,.25)"/><polygon points="-7,5 -4,-3 3,-5 8,2 6,5" fill="#7d8695" stroke="#3b4350" stroke-width=".9"/><polygon points="-4,-3 3,-5 1,0" fill="#b9c0cc"/>' }));
      spread(14, 8, 0.1, 0.9).forEach((p) => ground.push(`<polygon points="${f1(p.x)},${f1(p.y - 3)} ${f1(p.x + 4)},${f1(p.y + 2)} ${f1(p.x - 4)},${f1(p.y + 2)}" fill="#5b6370" opacity=".5"/>`));
    } else if (res === 'desert') {
      [-32, -14, 5, 24, 42].forEach((y, i) => ground.push(`<path d="M-48 ${y} Q-24 ${y - 10} 0 ${y} T48 ${y}" fill="none" stroke="${i % 2 ? '#fbf1cb' : '#bfa465'}" stroke-width="2.4" opacity=".75"/>`));
      objs.push({ x: -30, y: 20, s: 1.15, svg: '<ellipse cy="9" rx="8" ry="2.2" fill="rgba(0,0,0,.2)"/><rect x="-2" y="-10" width="4" height="19" rx="2" fill="#4e8c49"/><rect x="-8" y="-4" width="3.4" height="8" rx="1.7" fill="#4e8c49"/><rect x="4.6" y="-6" width="3.4" height="8" rx="1.7" fill="#4e8c49"/>' });
      objs.push({ x: 8, y: -26, s: 1.1, svg: '<ellipse cy="9" rx="9" ry="2.4" fill="rgba(0,0,0,.2)"/><path d="M0 9 Q-2 -4 1 -14" stroke="#7a5a2c" stroke-width="2.6" fill="none" stroke-linecap="round"/><g fill="#4e9a4a"><path d="M1 -14 Q-10 -17 -15 -9 Q-6 -14 1 -12Z"/><path d="M1 -14 Q10 -18 16 -10 Q8 -14 1 -12Z"/><path d="M1 -14 Q-4 -23 -11 -21 Q-4 -19 1 -12Z"/><path d="M1 -14 Q6 -23 13 -20 Q6 -18 1 -12Z"/></g>' });
      objs.push({ x: 24, y: 28, s: 0.9, svg: '<ellipse cy="8" rx="9" ry="2.4" fill="rgba(0,0,0,.2)"/><path d="M-9 8 Q-5 -3 0 -1 Q6 -5 10 8 Z" fill="#d9c284" stroke="#a89154" stroke-width="1"/>' });
    }
    return { ground: ground.join(''), objs };
  }

  const ROBBER = '<ellipse cy="15" rx="13" ry="4" fill="rgba(0,0,0,.45)"/><path d="M-10 15 Q-11 -4 0 -7 Q11 -4 10 15 Z" fill="#16110c" stroke="#000" stroke-width="1.5"/><circle cy="-13" r="7" fill="#16110c" stroke="#000" stroke-width="1.5"/><circle cx="-2.6" cy="-13" r="1.2" fill="#e8b04a"/><circle cx="2.6" cy="-13" r="1.2" fill="#e8b04a"/>';

  // ---------- mallas 3D de las piezas ----------
  const norm3 = (v) => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
  // caja orientada (ángulo ang alrededor de z); devuelve caras con normal
  function box(cx, cy, z0, w, d, h, ang, col) {
    const c = Math.cos(ang), s = Math.sin(ang);
    const R = (x, y, z) => [cx + x * c - y * s, cy + x * s + y * c, z];
    const hw = w / 2, hd = d / 2;
    const rn = (x, y) => [x * c - y * s, x * s + y * c, 0];
    return [
      { pts: [R(-hw, hd, z0), R(hw, hd, z0), R(hw, hd, z0 + h), R(-hw, hd, z0 + h)], n: rn(0, 1), col },
      { pts: [R(hw, -hd, z0), R(hw, hd, z0), R(hw, hd, z0 + h), R(hw, -hd, z0 + h)], n: rn(1, 0), col },
      { pts: [R(-hw, -hd, z0), R(hw, -hd, z0), R(hw, -hd, z0 + h), R(-hw, -hd, z0 + h)], n: rn(0, -1), col },
      { pts: [R(-hw, -hd, z0), R(-hw, hd, z0), R(-hw, hd, z0 + h), R(-hw, -hd, z0 + h)], n: rn(-1, 0), col },
      { pts: [R(-hw, -hd, z0 + h), R(hw, -hd, z0 + h), R(hw, hd, z0 + h), R(-hw, hd, z0 + h)], n: [0, 0, 1], col },
    ];
  }
  // tejado a dos aguas con cumbrera a lo largo de x
  function gable(cx, cy, z0, w, d, rise, col) {
    const W = w / 2, D = d / 2, P = (x, y, z) => [cx + x, cy + y, z0 + z];
    return [
      { pts: [P(-W, D, 0), P(W, D, 0), P(W, 0, rise), P(-W, 0, rise)], n: norm3([0, rise, D]), col },
      { pts: [P(-W, -D, 0), P(W, -D, 0), P(W, 0, rise), P(-W, 0, rise)], n: norm3([0, -rise, D]), col },
      { pts: [P(W, -D, 0), P(W, D, 0), P(W, 0, rise)], n: [1, 0, 0], col },
      { pts: [P(-W, -D, 0), P(-W, D, 0), P(-W, 0, rise)], n: [-1, 0, 0], col },
    ];
  }
  function pyramid(cx, cy, z0, w, d, rise, col) {
    const W = w / 2, D = d / 2, P = (x, y, z) => [cx + x, cy + y, z0 + z];
    return [
      { pts: [P(-W, D, 0), P(W, D, 0), P(0, 0, rise)], n: norm3([0, rise, D]), col },
      { pts: [P(-W, -D, 0), P(W, -D, 0), P(0, 0, rise)], n: norm3([0, -rise, D]), col },
      { pts: [P(W, -D, 0), P(W, D, 0), P(0, 0, rise)], n: norm3([rise, 0, W]), col },
      { pts: [P(-W, -D, 0), P(-W, D, 0), P(0, 0, rise)], n: norm3([-rise, 0, W]), col },
    ];
  }
  function houseMesh(x, y, z, col) {
    return box(x, y, z, 21, 16, 13, 0, col).slice(0, 4).concat(gable(x, y, z + 13, 25.5, 20, 11, shade(col, 0.7)))
      .concat(box(x - 4, y + 8.3, z, 5, 0.6, 8.5, 0, '#3a2412').slice(0, 1))
      .concat(box(x + 5, y + 8.3, z + 5, 5, 0.6, 4.5, 0, '#ffe9a8').slice(0, 1))
      .concat(box(x + 7, y - 2, z + 14, 4.4, 4.4, 11, 0, '#7a5a44'));
  }
  function cityMesh(x, y, z, col) {
    const roof = shade(col, 0.72);
    return box(x + 4, y + 1, z, 31, 20, 15, 0, col).slice(0, 4)
      .concat(gable(x + 4, y + 1, z + 15, 35, 24, 8, roof))
      .concat(box(x + 8, y + 11.3, z, 6, 0.6, 9, 0, '#3a2412').slice(0, 1))
      .concat(box(x + 18, y + 11.3, z + 6, 5, 0.6, 5, 0, '#ffe9a8').slice(0, 1))
      .concat(box(x - 11, y + 4.3, z + 18, 5, 0.6, 7, 0, '#ffe9a8').slice(0, 1))
      .concat(box(x - 11, y - 3, z, 14, 14, 33, 0, col).slice(0, 4))
      .concat(pyramid(x - 11, y - 3, z + 33, 18, 18, 14, roof));
  }

  // ---------- creación del tablero ----------
  function create(wrap, board, opts) {
    opts = opts || {};
    const tiles = board.tiles, G = Board.buildGraph(tiles);
    const C = { x: board.center.x * SZ, y: board.center.y * SZ };
    const T = tiles.map((t, i) => {
      const c = Board.hexCenter(t), d = decor(t.res, rng(i * 7919 + 13));
      return { i, x: c.x * SZ - C.x, y: c.y * SZ - C.y, h: HT[t.res] + (rng(i * 31 + 5)() * 4 - 2), res: t.res, num: t.num, ground: d.ground, objs: d.objs };
    });
    const V = G.verts.map((v) => ({ x: v.x * SZ - C.x, y: v.y * SZ - C.y, h: Math.max.apply(null, v.tiles.map((ti) => T[ti].h)) }));
    const E = G.edges.map((e) => ({ a: e.a, b: e.b, h: Math.max.apply(null, e.tiles.map((ti) => T[ti].h)) }));
    let R = 0;
    T.forEach((t) => { R = Math.max(R, Math.hypot(t.x, t.y) + SZ * 1.08); });
    board.harbors.forEach((h) => { const A = V[h.a], B = V[h.b], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, l = Math.hypot(mx, my); R = Math.max(R, l + SZ * 0.98 + 24); });

    // cámara
    const cam = { yaw: 28, pitch: 52, zoom: 1 };
    try { const s = JSON.parse(localStorage.getItem('mesa-cam') || 'null'); if (s && isFinite(s.yaw) && isFinite(s.pitch) && isFinite(s.zoom)) Object.assign(cam, s); } catch (e) {}
    const clampCam = () => { cam.pitch = Math.max(0, Math.min(68, cam.pitch)); cam.zoom = Math.max(0.6, Math.min(2.4, cam.zoom)); cam.yaw = ((cam.yaw % 360) + 360) % 360; };
    const saveCam = () => { try { localStorage.setItem('mesa-cam', JSON.stringify(cam)); } catch (e) {} };

    // SVG base
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('id', 'cg-board');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    const grads = Object.keys(TOP).map((k) => `<radialGradient id="gr-${k}" cx="50%" cy="42%" r="72%"><stop offset="0" stop-color="${TOP[k][0]}"/><stop offset="1" stop-color="${TOP[k][1]}"/></radialGradient>`).join('');
    const nr = rng(5), dots = [];
    for (let i = 0; i < 70; i++) dots.push(`<circle cx="${(nr() * 40).toFixed(1)}" cy="${(nr() * 40).toFixed(1)}" r="${(0.5 + nr() * 1.1).toFixed(1)}" fill="${nr() < 0.5 ? '#000' : '#fff'}" opacity="${(0.06 + nr() * 0.1).toFixed(2)}"/>`);
    svg.innerHTML = `<defs>
${grads}
<pattern id="noise" width="40" height="40" patternUnits="userSpaceOnUse">${dots.join('')}</pattern>
<clipPath id="hexclip"><polygon points="${hexLocal(RB - INS)}"/></clipPath>
<radialGradient id="tokG" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e6d6a8"/></radialGradient>
<linearGradient id="bevel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>
<radialGradient id="shadowG"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".6" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
</defs>
<g id="scene"></g>`;
    // El mar va en su propio SVG detrás (se anima sin repintar el tablero)
    const sea = document.createElementNS(NS, 'svg');
    sea.setAttribute('id', 'cg-sea');
    sea.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    sea.innerHTML = `<defs><radialGradient id="seaG" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${Math.round(R * 1.9)}"><stop offset="0" stop-color="#3cb0b0"/><stop offset=".4" stop-color="#238a94"/><stop offset=".75" stop-color="#14606f"/><stop offset="1" stop-color="#0a3340"/></radialGradient>
<radialGradient id="glintG"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect x="-6000" y="-6000" width="12000" height="12000" fill="url(#seaG)"/><g id="waves"><g class="wv1"></g><g class="wv2"></g><g class="gl"></g></g>`;
    wrap.insertBefore(svg, wrap.firstChild);
    wrap.insertBefore(sea, svg);
    const sceneG = svg.querySelector('#scene'), wavesG = sea.querySelector('#waves');
    const wr = rng(11), wv1 = [], wv2 = [], gl = [];
    for (let i = 0; i < 190; i++) {
      const a = wr() * 6.283, d = Math.sqrt(wr()) * R * 2.3, x = Math.cos(a) * d, y = Math.sin(a) * d;
      (i % 2 ? wv1 : wv2).push(`<path d="M${x.toFixed(0)} ${y.toFixed(0)} q9 -5 18 0 t18 0" fill="none" stroke="#fff" stroke-width="1.6" opacity="${(0.07 + wr() * 0.15).toFixed(2)}"/>`);
    }
    for (let i = 0; i < 26; i++) {
      const a = wr() * 6.283, d = Math.sqrt(wr()) * R * 1.9;
      gl.push(`<ellipse cx="${(Math.cos(a) * d).toFixed(0)}" cy="${(Math.sin(a) * d).toFixed(0)}" rx="${(5 + wr() * 7).toFixed(0)}" ry="2.2" fill="url(#glintG)" style="animation-delay:${(wr() * 5).toFixed(1)}s"/>`);
    }
    wavesG.querySelector('.wv1').innerHTML = wv1.join(''); wavesG.querySelector('.wv2').innerHTML = wv2.join(''); wavesG.querySelector('.gl').innerHTML = gl.join('');

    // controles de cámara
    const ctl = document.createElement('div');
    ctl.className = 'cam';
    const L = opts.labels || {};
    ctl.innerHTML = `<button class="camtog" data-cam="toggle" title="${L.toggle || ''}">🎥</button><div class="camtools"><button data-cam="left" title="${L.left || ''}">⟲</button><button data-cam="right" title="${L.right || ''}">⟳</button><button data-cam="up" title="${L.up || ''}">▲</button><button data-cam="down" title="${L.down || ''}">▼</button><button data-cam="in" title="${L.in || ''}">＋</button><button data-cam="out" title="${L.out || ''}">－</button><button data-cam="flat" title="${L.flat || ''}">2D</button><button data-cam="reset" title="${L.reset || ''}">⌂</button><span class="camhint">${L.hint || ''}</span></div>`;
    try { if (localStorage.getItem('mesa-camui') === 'min') ctl.classList.add('min'); } catch (e) {}
    wrap.appendChild(ctl);

    let last = null, raf = 0, animUntil = 0, anim = false;
    const seen = {};   // pieza -> instante de nacimiento (ms)
    let first = true, robPrev = null, rob = null;

    // ---------- proyección ----------
    let cs, sn, cp, sp;
    function setTrig() { const th = cam.yaw * Math.PI / 180, ph = cam.pitch * Math.PI / 180; cs = Math.cos(th); sn = Math.sin(th); cp = Math.cos(ph); sp = Math.sin(ph); }
    function P(x, y, z) {
      const xr = x * cs - y * sn, yr = x * sn + y * cs;
      const D = yr * sp + z * cp, k = 1 / (1 - D * PERSP);
      return { x: xr * k, y: (yr * cp - z * sp) * k, d: D, k };
    }
    const aff = (x, y, z) => { // matriz de un plano horizontal alrededor de (x,y,z)
      const p0 = P(x, y, z), px = P(x + 1, y, z), py = P(x, y + 1, z);
      return `matrix(${(px.x - p0.x).toFixed(4)} ${(px.y - p0.y).toFixed(4)} ${(py.x - p0.x).toFixed(4)} ${(py.y - p0.y).toFixed(4)} ${p0.x.toFixed(2)} ${p0.y.toFixed(2)})`;
    };
    const facing = (n) => { const nyr = n[0] * sn + n[1] * cs; return nyr * sp + n[2] * cp > 0.02; };
    function meshSVG(faces, dz) {
      const out = [];
      faces.forEach((f) => {
        if (!facing(f.n)) return;
        const pts = f.pts.map((q) => P(q[0], q[1], q[2] + dz));
        let d = 0; pts.forEach((p) => { d += p.d; }); d /= pts.length;
        const lit = Math.max(0, f.n[0] * LIGHT[0] + f.n[1] * LIGHT[1] + f.n[2] * LIGHT[2]);
        out.push({ d, s: `<polygon points="${poly(pts)}" fill="${shade(f.col, 0.58 + 0.62 * lit)}" stroke="#1b1208" stroke-width="1.3" stroke-linejoin="round"/>` });
      });
      out.sort((a, b) => a.d - b.d);
      return out.map((o) => o.s).join('');
    }
    const born = (key, now) => { if (seen[key] === undefined) { seen[key] = first ? -1e9 : now; } return seen[key]; };
    const dropOf = (t0, now) => { const a = (now - t0) / 480; if (a >= 1) return 0; anim = true; return (1 - ease(a)) * 34; };

    // ---------- dibujo ----------
    function render(now) {
      if (!last) return;
      const { g, colors, spots, collect, labels } = last;
      const LAB = [];
      const lab = (x, y, n, k) => LAB.push(`<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(Math.max(0.8, k) * 1.15)})" pointer-events="none"><circle r="10" fill="#140d06" fill-opacity=".88" stroke="#ffe9a6" stroke-width="1.4"/><text y="4" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800" font-size="${n > 99 ? 8 : n > 9 ? 10.5 : 12}" fill="#fff">${n}</text></g>`);
      anim = false;
      const lite = !!(drag && drag.on);
      setTrig();
      const cw = wrap.clientWidth || 800, ch = wrap.clientHeight || 600;
      const halfW = R * 1.04, halfH = R * cp + 40 * sp + 26;
      const sc = Math.min(cw / (2 * halfW), ch / (2 * halfH)) * cam.zoom;
      const vw = cw / sc, vh = ch / sc;
      const vb = `${(-vw / 2).toFixed(1)} ${(-vh / 2 - 6).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`;
      svg.setAttribute('viewBox', vb); sea.setAttribute('viewBox', vb);
      wavesG.setAttribute('transform', aff(0, 0, 0));
      wavesG.style.display = lite ? 'none' : ''; // al arrastrar no se dibujan las olas
      const S = [];

      // espuma de la costa
      T.forEach((t) => {
        const ring = (r) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return P(t.x + r * Math.cos(a), t.y + r * Math.sin(a), 0); });
        if (!lite) S.push(`<polygon points="${poly(ring(SZ * 1.62))}" fill="#5fd6d0" opacity=".07"/>`); S.push(`<polygon points="${poly(ring(SZ * 1.34))}" fill="#7fe3df" opacity=".13"/><polygon points="${poly(ring(SZ * 1.13))}" fill="#fff" opacity=".28"/>`);
      });

      // hexágonos de atrás hacia delante
      const order = T.map((t) => ({ t, d: P(t.x, t.y, 0).d })).sort((a, b) => a.d - b.d);
      order.forEach(({ t }) => {
        const ringAt = (rad, z) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return P(t.x + rad * Math.cos(a), t.y + rad * Math.sin(a), z); });
        const rc = (rad) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return [t.x + rad * Math.cos(a), t.y + rad * Math.sin(a)]; });
        const corners = rc(RB), bevel = Math.min(5.5, t.h * 0.2), zt = t.h - bevel, band = Math.min(5, zt * 0.34), z1 = zt - band;
        const inner = rc(RB - INS);
        for (let i = 0; i < 6; i++) {
          const na = Math.PI / 180 * 60 * i, n = [Math.cos(na), Math.sin(na), 0];
          if (!facing(n)) continue;
          const A = corners[i], B = corners[(i + 1) % 6];
          const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1]), k = 0.55 + 0.65 * lit;
          const q = (z) => [P(A[0], A[1], z), P(B[0], B[1], z)];
          const lo = q(0), mid = q(z1), hi = q(zt);
          S.push(`<polygon points="${poly([lo[0], lo[1], mid[1], mid[0]])}" fill="${shade(DIRT, k)}" stroke="#2a1b0e" stroke-width="1"/>`);
          if (!lite) [0.33, 0.66].forEach((f) => { const l = q(z1 * f); S.push(`<line x1="${f1(l[0].x)}" y1="${f1(l[0].y)}" x2="${f1(l[1].x)}" y2="${f1(l[1].y)}" stroke="#000" stroke-opacity=".2" stroke-width="1.4"/>`); });
          S.push(`<polygon points="${poly([mid[0], mid[1], hi[1], hi[0]])}" fill="${shade(BAND[t.res], k)}" stroke="#2a1b0e" stroke-width="1"/>`);
          const nb = norm3([n[0] * bevel, n[1] * bevel, INS]);
          if (facing(nb)) {
            const ci = [P(inner[i][0], inner[i][1], t.h), P(inner[(i + 1) % 6][0], inner[(i + 1) % 6][1], t.h)];
            const lb = Math.max(0, nb[0] * LIGHT[0] + nb[1] * LIGHT[1] + nb[2] * LIGHT[2]);
            S.push(`<polygon points="${poly([hi[0], hi[1], ci[1], ci[0]])}" fill="${shade(TOP[t.res][1], 0.7 + 0.5 * lb)}" stroke="#2c1e12" stroke-width=".8" stroke-linejoin="round"/>`);
          }
        }
        const top = ringAt(RB - INS, t.h);
        S.push(`<polygon points="${poly(top)}" fill="url(#gr-${t.res})" stroke="#2c1e12" stroke-width="1.4" stroke-linejoin="round"/>`);
        S.push(`<polygon points="${poly(top)}" fill="url(#bevel)"/>`);
        for (let i = 0; i < 6 && !lite; i++) {
          const na = Math.PI / 180 * (60 * i), lit = Math.cos(na) * LIGHT[0] + Math.sin(na) * LIGHT[1];
          S.push(`<line x1="${f1(top[i].x)}" y1="${f1(top[i].y)}" x2="${f1(top[(i + 1) % 6].x)}" y2="${f1(top[(i + 1) % 6].y)}" stroke="${lit > 0 ? '#fff' : '#000'}" stroke-opacity="${(Math.abs(lit) * 0.4).toFixed(2)}" stroke-width="2.2" stroke-linecap="round"/>`);
        }
        if (!lite) S.push(`<g transform="${aff(t.x, t.y, t.h)}"><g clip-path="url(#hexclip)">${t.ground}<polygon points="${hexLocal(SZ)}" fill="url(#noise)"/></g><polygon points="${hexLocal(RB - INS - 3.5)}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1.2"/></g>`);
        const mine = [];
        t.objs.forEach((o, oi) => {
          if (lite && oi % 2) return;
          const p = P(t.x + o.x, t.y + o.y, t.h);
          mine.push({ d: p.d + 0.001 * p.y, s: `<g transform="translate(${f1(p.x)},${f1(p.y - 10 * p.k * o.s)}) scale(${f1(p.k * o.s * (o.f || 1))},${f1(p.k * o.s)})">${o.svg}</g>` });
        });
        mine.sort((a, b) => a.d - b.d).forEach((it) => S.push(it.s));
        if (t.num) {
          const p = P(t.x, t.y, t.h), top2 = P(t.x, t.y, t.h + 7), k = p.k, hot = t.num === 6 || t.num === 8, dots = 6 - Math.abs(7 - t.num);
          S.push(`<g><ellipse cx="${f1(p.x)}" cy="${f1(p.y + 1)}" rx="${f1(22 * k)}" ry="${f1(22 * k * Math.max(0.35, cp))}" fill="url(#shadowG)"/><g transform="translate(${f1(top2.x)},${f1(top2.y)}) scale(${f1(k)})"><ellipse cy="3.2" rx="17" ry="17" fill="#7a5a2c"/><circle r="17" fill="url(#tokG)" stroke="#6b4a24" stroke-width="2"/><circle r="14" fill="none" stroke="#c9b37a" stroke-width=".8"/><path d="M-12 -7 A14 14 0 0 1 4 -13.4" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55"/><text y="3" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="${t.num > 9 ? 16 : 18}" fill="${hot ? '#b3261a' : '#2b1d12'}">${t.num}</text><text y="12" text-anchor="middle" font-size="6.5" letter-spacing="1" fill="${hot ? '#b3261a' : '#2b1d12'}">${'●'.repeat(dots)}</text></g></g>`);
        }
      });

      // embarcaderos de los puertos
      const harborPos = board.harbors.map((h) => {
        const A = V[h.a], B = V[h.b], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, len = Math.hypot(mx, my) || 1;
        return { h, A, B, x: mx + mx / len * SZ * 0.98, y: my + my / len * SZ * 0.98 };
      });
      harborPos.forEach((p) => {
        const m = P(p.x, p.y, 1.5);
        [p.A, p.B].forEach((v) => {
          const a = P(v.x, v.y, v.h - 1);
          S.push(`<line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(m.x)}" y2="${f1(m.y)}" stroke="#2c1e12" stroke-width="${f1(7 * m.k)}" stroke-linecap="round"/><line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(m.x)}" y2="${f1(m.y)}" stroke="#b98a52" stroke-width="${f1(4 * m.k)}" stroke-linecap="round"/>`);
        });
      });

      // caminos (planos sobre el suelo, con volumen)
      const items = [];
      const roadFaces = [];
      Object.keys(g.roads).forEach((e) => {
        const ed = E[e], A = V[ed.a], B = V[ed.b], len = Math.hypot(B.x - A.x, B.y - A.y), ang = Math.atan2(B.y - A.y, B.x - A.x);
        const key = 'r' + e, t0 = born(key, now), dz = dropOf(t0, now);
        const col = colors[g.roads[e]];
        const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2;
        roadFaces.push({ d: P(cx, cy, ed.h).d, s: meshSVG(box(cx, cy, ed.h, len - 25, 8.5, 5.5, ang, col), dz) });
      });
      roadFaces.sort((a, b) => a.d - b.d).forEach((r) => S.push(r.s));

      // puertos
      harborPos.forEach((p) => {
        const m = P(p.x, p.y, 2), k = m.k, ty = p.h.type, col = ty === 'any' ? '#e9dcb8' : RESCOL[ty];
        const inner = ty === 'any'
          ? '<text y="5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="14" fill="#2b1d12">3:1</text>'
          : `<g transform="translate(-9,-15)"><svg width="18" height="18"><use href="#i-${ty}"/></svg></g><text y="12.5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="10" fill="#1d130a">2:1</text>`;
        items.push({ d: m.d, s: `<g><ellipse cx="${f1(m.x)}" cy="${f1(m.y + 3)}" rx="${f1(19 * k)}" ry="${f1(8 * k * Math.max(0.4, cp))}" fill="#000" opacity=".3"/><g transform="translate(${f1(m.x)},${f1(m.y - 6 * k)}) scale(${f1(k)})"><circle r="19" fill="#2a1c10"/><circle r="16.5" fill="${col}" stroke="#f3e6c4" stroke-width="2"/>${inner}</g></g>` });
      });

      // construcciones
      Object.keys(g.buildings).forEach((v) => {
        const b = g.buildings[v], p = V[v], key = 'b' + v + b.t, t0 = born(key, now), dz = dropOf(t0, now);
        const col = colors[b.o];
        const mesh = b.t === 'c' ? cityMesh(p.x, p.y, p.h, col) : houseMesh(p.x, p.y, p.h, col);
        const q = P(p.x, p.y, p.h);
        items.push({ d: q.d + 0.003, s: `<g><ellipse cx="${f1(q.x)}" cy="${f1(q.y + 1)}" rx="${f1((b.t === 'c' ? 38 : 24) * q.k)}" ry="${f1((b.t === 'c' ? 38 : 24) * q.k * Math.max(0.3, cp))}" fill="url(#shadowG)"/>${meshSVG(mesh, dz)}</g>` });
      });

      // ladrón (se anima al cambiar de hexágono)
      const rt = T[g.robber];
      if (robPrev === null) robPrev = g.robber;
      else if (robPrev !== g.robber) { rob = { from: T[robPrev], to: rt, t0: now }; robPrev = g.robber; }
      let rx = rt.x + 21, ry = rt.y + 14, rz = rt.h;
      if (rob) {
        const a = (now - rob.t0) / 800;
        if (a >= 1) rob = null;
        else { anim = true; const e = ease(a); rx = rob.from.x + 21 + (rt.x - rob.from.x) * e; ry = rob.from.y + 14 + (rt.y - rob.from.y) * e; rz = rob.from.h + (rt.h - rob.from.h) * e + Math.sin(Math.PI * e) * 26; }
      }
      const rp = P(rx, ry, rz), awake = g.phase === 'robber';
      items.push({ d: rp.d + 0.004, s: `<g transform="translate(${f1(rp.x)},${f1(rp.y - 15 * rp.k * 1.1)}) scale(${f1(rp.k * 1.1)})"${awake ? ' style="filter:drop-shadow(0 0 7px #ff8a3c)"' : ''}>${ROBBER}</g>` });

      items.sort((a, b) => a.d - b.d).forEach((it) => S.push(it.s));

      // zonas pulsables
      (collect || []).forEach((ti) => {
        const t = T[ti], pts = Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return P(t.x + (SZ - 3) * Math.cos(a), t.y + (SZ - 3) * Math.sin(a), t.h + 1); });
        S.push(`<polygon class="hl" data-a="collect" data-id="${ti}" points="${poly(pts)}"/>`);
      });
      if (spots && spots.kind) {
        if (spots.kind === 'road') {
          spots.ids.forEach((e, ix) => {
            const ed = E[e], A = V[ed.a], B = V[ed.b], dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy), s0 = 9 / l;
            const a = P(A.x + dx * s0, A.y + dy * s0, ed.h + 3), b = P(B.x - dx * s0, B.y - dy * s0, ed.h + 3);
 if (labels && labels.indexOf(e) >= 0) { const m = P((A.x + B.x) / 2, (A.y + B.y) / 2, ed.h + 12); lab(m.x, m.y, labels.indexOf(e) + 1, m.k); }
            S.push(`<line class="spot-e" data-a="spot-e" data-id="${e}" x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" style="stroke-width:${f1(12 * a.k)}px"/>`);
          });
        } else if (spots.kind === 'robber') {
          spots.ids.forEach((ti, ix) => {
            const t = T[ti]; if (labels && labels.indexOf(ti) >= 0) { const m = P(t.x, t.y + 26, t.h + 14); lab(m.x, m.y, labels.indexOf(ti) + 1, m.k); }
            const pts = Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return P(t.x + (SZ - 3) * Math.cos(a), t.y + (SZ - 3) * Math.sin(a), t.h + 1); });
            S.push(`<polygon class="spot-t" data-a="spot-t" data-id="${ti}" points="${poly(pts)}"/>`);
          });
        } else {
          spots.ids.forEach((v, ix) => {
            const p = V[v], q = P(p.x, p.y, p.h + (spots.kind === 'city' ? 14 : 6));
            if (labels && labels.indexOf(v) >= 0) { const m = P(p.x, p.y, p.h + 30); lab(m.x, m.y, labels.indexOf(v) + 1, m.k); }
            S.push(`<circle class="spot-v" data-a="spot-v" data-id="${v}" cx="${f1(q.x)}" cy="${f1(q.y)}" r="${f1((spots.kind === 'city' ? 22 : 15) * q.k)}"/>`);
          });
        }
      }
      sceneG.innerHTML = S.join('') + LAB.join('');
      if (anim) schedule();
    }

    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame((t) => { raf = 0; render(performance.now()); });
    }

    // ---------- interacción ----------
    let drag = null, suppress = false;
    wrap.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.cam') || e.button > 0) return;
      drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, on: false, id: e.pointerId };
    });
    wrap.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on && Math.abs(dx) + Math.abs(dy) > 6) { drag.on = true; try { wrap.setPointerCapture(e.pointerId); } catch (x) {} wrap.classList.add('dragging'); }
      if (drag.on) { cam.yaw = drag.yaw - dx * 0.4; cam.pitch = drag.pitch + dy * 0.28; clampCam(); schedule(); }
    });
    const endDrag = (e) => {
      if (!drag) return;
      const was = drag.on;
      if (was) { suppress = true; setTimeout(() => { suppress = false; }, 60); saveCam(); }
      drag = null; wrap.classList.remove('dragging');
      if (was) schedule();
    };
    wrap.addEventListener('pointerup', endDrag);
    wrap.addEventListener('pointercancel', endDrag);
    wrap.addEventListener('click', (e) => { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);
    wrap.addEventListener('wheel', (e) => { e.preventDefault(); cam.zoom *= e.deltaY < 0 ? 1.08 : 1 / 1.08; clampCam(); saveCam(); schedule(); }, { passive: false });
    const act = (a) => {
      if (a === 'toggle') { ctl.classList.toggle('min'); try { localStorage.setItem('mesa-camui', ctl.classList.contains('min') ? 'min' : 'open'); } catch (e) {} return; }
      if (a === 'left') cam.yaw -= 30; else if (a === 'right') cam.yaw += 30;
      else if (a === 'up') cam.pitch += 8; else if (a === 'down') cam.pitch -= 8;
      else if (a === 'in') cam.zoom *= 1.15; else if (a === 'out') cam.zoom /= 1.15;
      else if (a === 'flat') { cam.yaw = 0; cam.pitch = 0; cam.zoom = 1; }
      else if (a === 'reset') { cam.yaw = 28; cam.pitch = 52; cam.zoom = 1; }
      clampCam(); saveCam(); schedule();
    };
    ctl.addEventListener('click', (e) => { const b = e.target.closest('[data-cam]'); if (b) { e.stopPropagation(); act(b.dataset.cam); } });
    const onKey = (e) => {
      if (!document.body.contains(wrap)) { document.removeEventListener('keydown', onKey); return; }
      if (/INPUT|SELECT|TEXTAREA/.test((e.target && e.target.tagName) || '')) return;
      const m = { q: 'left', e: 'right', ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', '+': 'in', '-': 'out' }[e.key];
      if (m) { act(m); }
    };
    document.addEventListener('keydown', onKey);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => schedule()).observe(wrap);

    clampCam();
    return {
      cam,
      draw(ctx) { last = ctx; render(performance.now()); first = false; },
      redraw: schedule,
      destroy() { document.removeEventListener('keydown', onKey); svg.remove(); sea.remove(); ctl.remove(); },
    };
  }

  root.Catan3D = { create };
})(typeof window !== 'undefined' ? window : globalThis);
