// Motor de reglas de Catán (juego base). Lo ejecuta SOLO el anfitrión; los demás reciben vistas filtradas.
(function (root) {
  const Board = typeof module !== 'undefined' && module.exports ? require('./catan-board.js') : root.CatanBoard;
  const RES = Board.RES;
  const COST = {
    road: { wood: 1, brick: 1 },
    settlement: { wood: 1, brick: 1, wool: 1, grain: 1 },
    city: { grain: 2, ore: 3 },
    dev: { wool: 1, grain: 1, ore: 1 },
  };
  const LIMIT = { road: 15, settlement: 5, city: 4 };
  const DEV_DECK = { knight: 14, vp: 5, roads: 2, plenty: 2, monopoly: 2 };
  const WIN_VP = 10;

  const emptyRes = () => ({ wood: 0, brick: 0, wool: 0, grain: 0, ore: 0 });
  const sum = (o) => RES.reduce((a, r) => a + (o[r] || 0), 0);
  const isRes = (r) => RES.indexOf(r) >= 0;
  const rnd = (n) => Math.floor(Math.random() * n);

  function CatanGame(ids, board) {
    this.ids = ids;
    this.n = ids.length;
    this.board = board;
    this.G = Board.buildGraph(board.tiles);
    const deck = [];
    Object.keys(DEV_DECK).forEach((k) => { for (let i = 0; i < DEV_DECK[k]; i++) deck.push(k); });
    const order = [];
    for (let i = 0; i < this.n; i++) order.push(i);
    for (let i = this.n - 1; i >= 0; i--) order.push(i);
    this.s = {
      phase: 'setup', turn: 0, setup: { order, step: 0, stage: 'settlement', last: null },
      dice: null, rollId: 0, buildings: {}, roads: {}, robber: board.robber,
      pl: ids.map(() => ({ res: emptyRes(), dev: [], newDev: [], vp: 0, knights: 0 })),
      deck: Board.shuffle(deck), devPlayed: false, freeRoads: 0, returnPhase: null,
      discard: {}, offer: null, longest: { o: null, len: 0 }, army: { o: null, n: 0 },
      lens: ids.map(() => 0), victims: [], winner: null, log: [], seq: 0,
    };
  }

  const P = CatanGame.prototype;

  P.log = function (k, o) {
    const s = this.s;
    s.log.push(Object.assign({ s: ++s.seq, k }, o || {}));
    if (s.log.length > 80) s.log.shift();
  };

  // ---------- consultas ----------
  P.used = function (pi) {
    const s = this.s, u = { settlement: 0, city: 0, road: 0 };
    Object.keys(s.buildings).forEach((v) => { const b = s.buildings[v]; if (b.o === pi) u[b.t === 'c' ? 'city' : 'settlement']++; });
    Object.keys(s.roads).forEach((e) => { if (s.roads[e] === pi) u.road++; });
    return u;
  };
  P.publicVP = function (pi) {
    const s = this.s, u = this.used(pi);
    return u.settlement + 2 * u.city + (s.longest.o === pi ? 2 : 0) + (s.army.o === pi ? 2 : 0);
  };
  P.totalVP = function (pi) { return this.publicVP(pi) + this.s.pl[pi].vp; };
  P.afford = function (pi, cost) { const r = this.s.pl[pi].res; return Object.keys(cost).every((k) => r[k] >= cost[k]); };
  P.pay = function (pi, cost) { const r = this.s.pl[pi].res; Object.keys(cost).forEach((k) => { r[k] -= cost[k]; }); };
  P.ratio = function (pi, res) {
    const s = this.s;
    let r = 4;
    this.board.harbors.forEach((h) => {
      const own = [h.a, h.b].some((v) => s.buildings[v] && s.buildings[v].o === pi);
      if (!own) return;
      if (h.type === 'any') r = Math.min(r, 3);
      else if (h.type === res) r = Math.min(r, 2);
    });
    return r;
  };

  P.canSettle = function (v, pi, setup) {
    const s = this.s, G = this.G;
    if (s.buildings[v]) return false;
    if (G.verts[v].adj.some((n) => s.buildings[n])) return false;
    if (setup) return true;
    return G.verts[v].edges.some((e) => s.roads[e] === pi);
  };
  P.canRoad = function (e, pi) {
    const s = this.s, G = this.G;
    if (s.roads[e] !== undefined) return false;
    const ed = G.edges[e];
    if (s.phase === 'setup') return ed.a === s.setup.last || ed.b === s.setup.last;
    return [ed.a, ed.b].some((v) => {
      const b = s.buildings[v];
      if (b) return b.o === pi;
      return G.verts[v].edges.some((x) => x !== e && s.roads[x] === pi);
    });
  };

  P.longestOf = function (pi) {
    const s = this.s, G = this.G, adj = {};
    Object.keys(s.roads).forEach((e) => {
      if (s.roads[e] !== pi) return;
      const ed = G.edges[e];
      (adj[ed.a] = adj[ed.a] || []).push(+e);
      (adj[ed.b] = adj[ed.b] || []).push(+e);
    });
    let best = 0;
    const used = new Set();
    const dfs = (v, len) => {
      if (len > best) best = len;
      const b = s.buildings[v];
      if (len > 0 && b && b.o !== pi) return; // un poblado rival corta el camino
      (adj[v] || []).forEach((e) => {
        if (used.has(e)) return;
        used.add(e);
        const ed = G.edges[e];
        dfs(ed.a === v ? ed.b : ed.a, len + 1);
        used.delete(e);
      });
    };
    Object.keys(adj).forEach((v) => dfs(+v, 0));
    return best;
  };

  P.updateRoad = function () {
    const s = this.s;
    const lens = this.ids.map((_, i) => this.longestOf(i));
    s.lens = lens;
    const max = Math.max.apply(null, lens), cur = s.longest.o;
    let owner = null;
    if (max >= 5) {
      const holders = lens.map((l, i) => (l === max ? i : -1)).filter((i) => i >= 0);
      if (cur !== null && lens[cur] === max) owner = cur;
      else if (holders.length === 1) owner = holders[0];
    }
    if (owner !== null && owner !== cur) this.log('longest', { p: owner });
    s.longest = { o: owner, len: owner === null ? 0 : lens[owner] };
  };

  P.checkWin = function () {
    const s = this.s;
    if (s.phase === 'over') return;
    if (this.totalVP(s.turn) >= WIN_VP) {
      s.phase = 'over'; s.winner = s.turn; s.offer = null;
      this.log('win', { p: s.turn });
    }
  };

  // ---------- ladrón ----------
  P.finishRobber = function () {
    const s = this.s;
    s.victims = [];
    s.phase = s.returnPhase || 'main';
    s.returnPhase = null;
  };
  P.steal = function (pi, vi) {
    const s = this.s, pool = [];
    RES.forEach((r) => { for (let i = 0; i < s.pl[vi].res[r]; i++) pool.push(r); });
    if (pool.length) {
      const r = pool[rnd(pool.length)];
      s.pl[vi].res[r]--; s.pl[pi].res[r]++;
      this.log('steal', { p: pi, v: vi });
    }
    this.finishRobber();
  };
  P.afterSeven = function () {
    const s = this.s;
    s.discard = {};
    s.pl.forEach((p, i) => { const n = sum(p.res); if (n > 7) s.discard[i] = Math.floor(n / 2); });
    s.phase = Object.keys(s.discard).length ? 'discard' : 'robber';
    s.returnPhase = 'main';
  };

  P.produce = function (n) {
    const s = this.s, G = this.G;
    const gains = this.ids.map(emptyRes);
    this.board.tiles.forEach((t, ti) => {
      if (t.num !== n || ti === s.robber) return;
      G.tileVerts[ti].forEach((v) => { const b = s.buildings[v]; if (b) gains[b.o][t.res] += b.t === 'c' ? 2 : 1; });
    });
    let any = false;
    gains.forEach((g, i) => {
      if (!sum(g)) return;
      any = true;
      RES.forEach((r) => { s.pl[i].res[r] += g[r]; });
      this.log('produce', { p: i, res: g });
    });
    if (!any) this.log('nothing');
  };

  // ---------- vista para un jugador (oculta la información privada) ----------
  P.legalFor = function (me) {
    const s = this.s, G = this.G, L = {};
    if (s.turn !== me) return L;
    const list = (n, f) => { const o = []; for (let i = 0; i < n; i++) if (f(i)) o.push(i); return o; };
    if (s.phase === 'setup') {
      if (s.setup.stage === 'settlement') L.settlement = list(G.verts.length, (v) => this.canSettle(v, me, true));
      else L.road = list(G.edges.length, (e) => this.canRoad(e, me));
    } else if (s.phase === 'main') {
      L.road = list(G.edges.length, (e) => this.canRoad(e, me));
      L.settlement = list(G.verts.length, (v) => this.canSettle(v, me, false));
      L.city = list(G.verts.length, (v) => s.buildings[v] && s.buildings[v].o === me && s.buildings[v].t === 's');
    } else if (s.phase === 'roadbuilding') {
      L.road = list(G.edges.length, (e) => this.canRoad(e, me));
    } else if (s.phase === 'robber') {
      L.robber = list(this.board.tiles.length, (ti) => ti !== s.robber);
    } else if (s.phase === 'steal') {
      L.steal = s.victims.slice();
    }
    return L;
  };

  P.view = function (pid) {
    const s = this.s, me = this.ids.indexOf(pid), over = s.phase === 'over';
    const ratios = {};
    if (me >= 0) RES.forEach((r) => { ratios[r] = this.ratio(me, r); });
    return JSON.parse(JSON.stringify({
      me, board: this.board, phase: s.phase, turn: s.turn, setup: { stage: s.setup.stage, step: s.setup.step, total: s.setup.order.length },
      dice: s.dice, rollId: s.rollId, buildings: s.buildings, roads: s.roads, robber: s.robber,
      devPlayed: s.devPlayed, freeRoads: s.freeRoads, discard: s.discard, offer: s.offer, deckN: s.deck.length,
      longest: s.longest, army: s.army, winner: s.winner, log: s.log.slice(-40), seq: s.seq, victims: s.victims,
      ratios, legal: me >= 0 ? this.legalFor(me) : {},
      players: s.pl.map((p, i) => {
        const showHidden = i === me || over;
        return {
          res: i === me ? p.res : null, resN: sum(p.res),
          dev: i === me ? p.dev : null, newDev: i === me ? p.newDev : null,
          devN: p.dev.length + p.newDev.length + p.vp,
          vp: showHidden ? p.vp : null, knights: p.knights, pub: this.publicVP(i), total: showHidden ? this.totalVP(i) : null,
          len: s.lens[i], used: this.used(i),
        };
      }),
    }));
  };

  // ---------- acciones ----------
  // Devuelve null si todo va bien, o una clave de error ('e.*') para mostrar al jugador.
  P.act = function (pid, m) {
    const s = this.s, pi = this.ids.indexOf(pid);
    if (pi < 0 || !m || typeof m.t !== 'string') return 'e.invalid';
    if (s.phase === 'over') return null;
    const my = s.turn === pi, p = s.pl[pi], G = this.G;
    const err = (() => {
      switch (m.t) {
        case 'discard': {
          const need = s.discard[pi];
          if (s.phase !== 'discard' || !need) return 'e.phase';
          const c = m.cards || {};
          let tot = 0;
          for (const r of RES) {
            const n = Math.floor(+c[r] || 0);
            if (n < 0 || n > p.res[r]) return 'e.invalid';
            tot += n;
          }
          if (tot !== need) return 'e.discardCount';
          RES.forEach((r) => { p.res[r] -= Math.floor(+c[r] || 0); });
          delete s.discard[pi];
          this.log('discard', { p: pi, n: need });
          if (!Object.keys(s.discard).length) s.phase = 'robber';
          return null;
        }
        case 'respond': {
          if (s.phase !== 'main' || !s.offer || s.offer.from === pi) return 'e.phase';
          s.offer.resp[pi] = m.accept && this.afford(pi, s.offer.want) ? 1 : 0;
          return null;
        }
        case 'roll': {
          if (!my || s.phase !== 'roll') return 'e.phase';
          const d = [1 + rnd(6), 1 + rnd(6)], tot = d[0] + d[1];
          s.dice = d; s.rollId++;
          this.log('roll', { p: pi, d1: d[0], d2: d[1] });
          if (tot === 7) this.afterSeven();
          else { this.produce(tot); s.phase = 'main'; }
          return null;
        }
        case 'build': return this.doBuild(pi, m);
        case 'buyDev': {
          if (!my || s.phase !== 'main') return 'e.phase';
          if (!s.deck.length) return 'e.deckEmpty';
          if (!this.afford(pi, COST.dev)) return 'e.afford';
          this.pay(pi, COST.dev);
          const c = s.deck.pop();
          if (c === 'vp') p.vp++; else p.newDev.push(c);
          this.log('buyDev', { p: pi });
          this.checkWin();
          return null;
        }
        case 'playDev': return this.doPlayDev(pi, m);
        case 'moveRobber': {
          if (!my || s.phase !== 'robber') return 'e.phase';
          const ti = m.tile;
          if (!Number.isInteger(ti) || ti < 0 || ti >= this.board.tiles.length || ti === s.robber) return 'e.invalid';
          s.robber = ti;
          this.log('robber', { p: pi });
          const vs = [];
          G.tileVerts[ti].forEach((v) => {
            const b = s.buildings[v];
            if (b && b.o !== pi && sum(s.pl[b.o].res) > 0 && vs.indexOf(b.o) < 0) vs.push(b.o);
          });
          if (!vs.length) this.finishRobber();
          else if (vs.length === 1) this.steal(pi, vs[0]);
          else { s.victims = vs; s.phase = 'steal'; }
          return null;
        }
        case 'steal': {
          if (!my || s.phase !== 'steal' || s.victims.indexOf(m.from) < 0) return 'e.phase';
          this.steal(pi, m.from);
          return null;
        }
        case 'bank': {
          if (!my || s.phase !== 'main') return 'e.phase';
          if (!isRes(m.give) || !isRes(m.get) || m.give === m.get) return 'e.invalid';
          const r = this.ratio(pi, m.give);
          if (p.res[m.give] < r) return 'e.afford';
          p.res[m.give] -= r; p.res[m.get]++;
          this.log('bank', { p: pi, give: m.give, get: m.get, n: r });
          return null;
        }
        case 'offer': {
          if (!my || s.phase !== 'main') return 'e.phase';
          const give = emptyRes(), want = emptyRes();
          for (const r of RES) {
            give[r] = Math.max(0, Math.min(19, Math.floor(+(m.give || {})[r] || 0)));
            want[r] = Math.max(0, Math.min(19, Math.floor(+(m.want || {})[r] || 0)));
            if (give[r] > 0 && want[r] > 0) return 'e.offerSame';
          }
          if (!sum(give) || !sum(want)) return 'e.offerEmpty';
          if (!this.afford(pi, give)) return 'e.afford';
          s.offer = { from: pi, give, want, resp: {} };
          this.log('offer', { p: pi });
          return null;
        }
        case 'cancelOffer': {
          if (!my || !s.offer) return 'e.phase';
          s.offer = null;
          return null;
        }
        case 'confirm': {
          if (!my || s.phase !== 'main' || !s.offer) return 'e.phase';
          const o = s.offer, w = m.with;
          if (!Number.isInteger(w) || w === pi || !s.pl[w] || o.resp[w] !== 1) return 'e.invalid';
          if (!this.afford(pi, o.give) || !this.afford(w, o.want)) { s.offer = null; return 'e.afford'; }
          RES.forEach((r) => {
            s.pl[pi].res[r] += o.want[r] - o.give[r];
            s.pl[w].res[r] += o.give[r] - o.want[r];
          });
          this.log('trade', { p: pi, v: w });
          s.offer = null;
          return null;
        }
        case 'end': {
          if (!my || s.phase !== 'main') return 'e.phase';
          p.dev = p.dev.concat(p.newDev); p.newDev = [];
          s.devPlayed = false; s.offer = null; s.dice = null;
          s.turn = (s.turn + 1) % this.n;
          s.phase = 'roll';
          return null;
        }
        default: return 'e.invalid';
      }
    })();
    if (!err) this.checkWin();
    return err;
  };

  P.doBuild = function (pi, m) {
    const s = this.s, p = s.pl[pi], my = s.turn === pi, G = this.G, u = this.used(pi);
    const id = m.id;
    if (!my || !Number.isInteger(id)) return 'e.phase';
    if (s.phase === 'setup') {
      const st = s.setup;
      if (m.kind === 'settlement' && st.stage === 'settlement') {
        if (id < 0 || id >= G.verts.length || !this.canSettle(id, pi, true)) return 'e.spot';
        s.buildings[id] = { o: pi, t: 's' };
        if (st.step >= this.n) {
          G.verts[id].tiles.forEach((ti) => { const t = this.board.tiles[ti]; if (t.res !== 'desert') p.res[t.res]++; });
        }
        st.stage = 'road'; st.last = id;
        this.log('setupSettle', { p: pi });
        this.updateRoad();
        return null;
      }
      if (m.kind === 'road' && st.stage === 'road') {
        if (id < 0 || id >= G.edges.length || !this.canRoad(id, pi)) return 'e.spot';
        s.roads[id] = pi;
        st.step++; st.stage = 'settlement'; st.last = null;
        if (st.step >= st.order.length) { s.phase = 'roll'; s.turn = 0; }
        else s.turn = st.order[st.step];
        this.log('setupRoad', { p: pi });
        this.updateRoad();
        return null;
      }
      return 'e.phase';
    }
    if (s.phase === 'roadbuilding') {
      if (m.kind !== 'road') return 'e.phase';
      if (id < 0 || id >= G.edges.length || !this.canRoad(id, pi)) return 'e.spot';
      s.roads[id] = pi; s.freeRoads--;
      this.log('build', { p: pi, what: 'road' });
      this.updateRoad();
      this.endRoadBuilding(pi);
      return null;
    }
    if (s.phase !== 'main') return 'e.phase';
    if (m.kind === 'road') {
      if (u.road >= LIMIT.road) return 'e.limit';
      if (!this.afford(pi, COST.road)) return 'e.afford';
      if (id < 0 || id >= G.edges.length || !this.canRoad(id, pi)) return 'e.spot';
      this.pay(pi, COST.road); s.roads[id] = pi;
    } else if (m.kind === 'settlement') {
      if (u.settlement >= LIMIT.settlement) return 'e.limit';
      if (!this.afford(pi, COST.settlement)) return 'e.afford';
      if (id < 0 || id >= G.verts.length || !this.canSettle(id, pi, false)) return 'e.spot';
      this.pay(pi, COST.settlement); s.buildings[id] = { o: pi, t: 's' };
    } else if (m.kind === 'city') {
      if (u.city >= LIMIT.city) return 'e.limit';
      if (!this.afford(pi, COST.city)) return 'e.afford';
      const b = s.buildings[id];
      if (!b || b.o !== pi || b.t !== 's') return 'e.spot';
      this.pay(pi, COST.city); b.t = 'c';
    } else return 'e.invalid';
    this.log('build', { p: pi, what: m.kind });
    this.updateRoad();
    return null;
  };

  P.endRoadBuilding = function (pi) {
    const s = this.s, G = this.G;
    const any = s.freeRoads > 0 && this.used(pi).road < LIMIT.road && G.edges.some((e) => this.canRoad(e.id, pi));
    if (!any) { s.freeRoads = 0; s.phase = s.returnPhase || 'main'; s.returnPhase = null; }
  };

  P.doPlayDev = function (pi, m) {
    const s = this.s, p = s.pl[pi];
    if (s.turn !== pi || (s.phase !== 'main' && s.phase !== 'roll')) return 'e.phase';
    if (s.devPlayed) return 'e.devOnce';
    const i = p.dev.indexOf(m.card);
    if (i < 0 || m.card === 'vp') return 'e.dev';
    if (m.card === 'plenty' && !(isRes(m.a) && isRes(m.b))) return 'e.invalid';
    if (m.card === 'monopoly' && !isRes(m.res)) return 'e.invalid';
    p.dev.splice(i, 1);
    s.devPlayed = true;
    if (m.card === 'knight') {
      p.knights++;
      this.log('knight', { p: pi });
      if (p.knights >= 3 && p.knights > s.army.n) {
        if (s.army.o !== pi) this.log('army', { p: pi });
        s.army = { o: pi, n: p.knights };
      }
      s.returnPhase = s.phase; s.phase = 'robber';
    } else if (m.card === 'roads') {
      this.log('playRoads', { p: pi });
      s.freeRoads = Math.min(2, LIMIT.road - this.used(pi).road);
      s.returnPhase = s.phase; s.phase = 'roadbuilding';
      this.endRoadBuilding(pi);
    } else if (m.card === 'plenty') {
      p.res[m.a]++; p.res[m.b]++;
      this.log('playPlenty', { p: pi, a: m.a, b: m.b });
    } else if (m.card === 'monopoly') {
      let tot = 0;
      s.pl.forEach((q, j) => { if (j !== pi) { tot += q.res[m.res]; p.res[m.res] += q.res[m.res]; q.res[m.res] = 0; } });
      this.log('playMonopoly', { p: pi, res: m.res, n: tot });
    }
    return null;
  };

  const api = { CatanGame, COST, LIMIT, WIN_VP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatanEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
