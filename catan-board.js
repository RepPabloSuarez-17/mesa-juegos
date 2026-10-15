// Generador del tablero estándar de Catán (19 hexágonos, coordenadas axiales).
(function (root) {
  const RESOURCES_BASE = [
    ...Array(4).fill('bosque'), ...Array(4).fill('pasto'), ...Array(4).fill('trigo'),
    ...Array(3).fill('arcilla'), ...Array(3).fill('piedra'), 'desierto',
  ];
  const NUMBERS_BASE = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

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

  function neighbors(t, tiles) {
    return DIRS.map(([dq, dr]) => tiles.find((x) => x.q === t.q + dq && x.r === t.r + dr)).filter(Boolean);
  }

  // Regla oficial: ningún 6 u 8 pegado a otro 6 u 8
  function hasHotAdjacent(tiles) {
    const hot = (t) => t.num === 6 || t.num === 8;
    return tiles.some((t) => hot(t) && neighbors(t, tiles).some(hot));
  }

  function generateBoard() {
    const positions = hexRing(2);
    let tiles;
    do {
      const res = shuffle(RESOURCES_BASE);
      const nums = shuffle(NUMBERS_BASE);
      let n = 0;
      tiles = positions.map((p, i) => ({ q: p.q, r: p.r, res: res[i], num: res[i] === 'desierto' ? null : nums[n++] }));
    } while (hasHotAdjacent(tiles));
    const d = tiles.find((t) => t.res === 'desierto');
    return { tiles, robber: { q: d.q, r: d.r } };
  }

  const api = { generateBoard };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatanBoard = api;
})(typeof window !== 'undefined' ? window : globalThis);
