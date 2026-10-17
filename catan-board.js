// Geometría y generación del tablero de Catán (compartido por motor y cliente).
// Hexágonos con coordenadas axiales (punta arriba). Recursos con claves internas en inglés.
// generateBoard(n): con 5 o más jugadores usa el tablero ampliado de la extensión 5-6 (30 hexágonos).
(function (root) {
  const RES = ['wood', 'brick', 'wool', 'grain', 'ore'];
  const RES_BASE = [
    ...Array(4).fill('wood'), ...Array(3).fill('brick'), ...Array(4).fill('wool'),
    ...Array(4).fill('grain'), ...Array(3).fill('ore'), 'desert',
  ];
  const NUMBERS_BASE = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  const RES_EXT = [
    ...Array(6).fill('wood'), ...Array(5).fill('brick'), ...Array(6).fill('wool'),
    ...Array(6).fill('grain'), ...Array(5).fill('ore'), 'desert', 'desert',
  ];
  const NUMBERS_EXT = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12];
  const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  const SQ3 = Math.sqrt(3);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function hexRing(radius) {
    const out = [];
    for (let q = -radius; q <= radius; q++) {
      for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) out.push({ q, r });
    }
    return out;
  }

  // Isla ampliada: filas de 3,4,5,6,5,4,3 hexágonos (30)
  function extPositions() {
    const lens = [3, 4, 5, 6, 5, 4, 3], out = [];
    lens.forEach((L, i) => {
      const r = i - 2, q0 = -(L - 1) / 2 - r / 2;
      for (let k = 0; k < L; k++) out.push({ q: q0 + k, r });
    });
    return out;
  }

  const hexCenter = (t) => ({ x: SQ3 * (t.q + t.r / 2), y: 1.5 * t.r });

  function neighbors(t, tiles) {
    return DIRS.map(([dq, dr]) => tiles.find((x) => x.q === t.q + dq && x.r === t.r + dr)).filter(Boolean);
  }

  // Regla oficial: ningún 6 u 8 pegado a otro 6 u 8
  function hasHotAdjacent(tiles) {
    const hot = (t) => t.num === 6 || t.num === 8;
    return tiles.some((t) => hot(t) && neighbors(t, tiles).some(hot));
  }

  // Grafo de vértices y aristas, determinista según el orden de los tiles. Radio de hexágono = 1.
  function buildGraph(tiles) {
    const verts = [], edges = [], vk = new Map(), ek = new Map(), tileVerts = [];
    tiles.forEach((t, ti) => {
      const c = hexCenter(t), ids = [];
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30), x = c.x + Math.cos(a), y = c.y + Math.sin(a);
        const k = Math.round(x * 20) + ',' + Math.round(y * 20);
        let id = vk.get(k);
        if (id === undefined) { id = verts.length; vk.set(k, id); verts.push({ id, x, y, tiles: [], adj: [], edges: [] }); }
        verts[id].tiles.push(ti);
        ids.push(id);
      }
      tileVerts.push(ids);
      for (let i = 0; i < 6; i++) {
        const a = ids[i], b = ids[(i + 1) % 6], k = a < b ? a + '-' + b : b + '-' + a;
        let e = ek.get(k);
        if (e === undefined) {
          e = edges.length; ek.set(k, e);
          edges.push({ id: e, a, b, tiles: [] });
          verts[a].adj.push(b); verts[b].adj.push(a);
          verts[a].edges.push(e); verts[b].edges.push(e);
        }
        edges[e].tiles.push(ti);
      }
    });
    return { verts, edges, tileVerts };
  }

  // Puertos repartidos por la costa. Base: 9 (4 genéricos 3:1 + 5 de recurso 2:1). Ampliado: 11 (6 + 5).
  function placeHarbors(g, tiles, ext) {
    let cx = 0, cy = 0;
    tiles.forEach((t) => { const c = hexCenter(t); cx += c.x; cy += c.y; });
    cx /= tiles.length; cy /= tiles.length;
    const coast = g.edges.filter((e) => e.tiles.length === 1).map((e) => {
      const A = g.verts[e.a], B = g.verts[e.b];
      return { e: e.id, a: e.a, b: e.b, ang: Math.atan2((A.y + B.y) / 2 - cy, (A.x + B.x) / 2 - cx) };
    }).sort((p, q) => p.ang - q.ang);
    const count = ext ? 11 : 9;
    const types = shuffle([...Array(count - 5).fill('any'), ...RES]);
    // reparto uniforme; aseguramos que dos puertos no compartan vértice
    const step = coast.length / count, out = [];
    const used = new Set();
    for (let n = 0; n < count; n++) {
      let i = Math.round(n * step) % coast.length, tries = 0;
      while ((used.has(coast[i].a) || used.has(coast[i].b)) && tries < coast.length) { i = (i + 1) % coast.length; tries++; }
      used.add(coast[i].a); used.add(coast[i].b);
      out.push({ e: coast[i].e, a: coast[i].a, b: coast[i].b, type: types[n] });
    }
    return out;
  }

  function generateBoard(n) {
    const ext = (n || 0) >= 5;
    const positions = ext ? extPositions() : hexRing(2);
    const resSrc = ext ? RES_EXT : RES_BASE, numSrc = ext ? NUMBERS_EXT : NUMBERS_BASE;
    let tiles, tries = 0;
    do {
      const res = shuffle(resSrc), nums = shuffle(numSrc);
      let k = 0;
      tiles = positions.map((p, i) => ({ q: p.q, r: p.r, res: res[i], num: res[i] === 'desert' ? null : nums[k++] }));
      tries++;
    } while (hasHotAdjacent(tiles) && tries < 20000);
    const g = buildGraph(tiles);
    let cx = 0, cy = 0;
    tiles.forEach((t) => { const c = hexCenter(t); cx += c.x; cy += c.y; });
    return {
      ext, tiles, robber: tiles.findIndex((t) => t.res === 'desert'), harbors: placeHarbors(g, tiles, ext),
      center: { x: cx / tiles.length, y: cy / tiles.length },
    };
  }

  const api = { RES, generateBoard, buildGraph, hexCenter, shuffle };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatanBoard = api;
})(typeof window !== 'undefined' ? window : globalThis);
