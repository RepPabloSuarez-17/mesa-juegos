// Motor del juego de unicornios: estado 100% serializable, efectos como pequeñas "máquinas" con pausas.
(function (root) {
  const CARDS = (typeof module !== 'undefined' && module.exports) ? require('./unicorns-cards.js') : root.UnicornCards;
  const { C, DECK, BABIES } = CARDS;
  const UNI = { baby: 1, basic: 1, magical: 1 };
  const isUni = (k) => !!UNI[C[k].type];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const matchType = (k, t) => t === 'any' || (t === 'unicorn' ? isUni(k) : C[k].type === t);

  class Game {
    constructor(ids, st) {
      this.ids = ids.slice();
      if (st) { this.s = st; return; }
      const s = this.s = { inst: {}, deck: [], discard: [], nursery: [], pl: [], turn: 0, phase: 'begin', t: { acts: 0, bonus: 0 }, stack: [], pending: null, react: null, log: [], seq: 0, winner: null, endBy: null, tie: false };
      let nid = 1; const mk = (k) => { s.inst[nid] = k; return nid++; };
      BABIES.forEach((b) => s.nursery.push(mk(b))); shuffle(s.nursery);
      Object.keys(DECK).forEach((k) => { for (let n = 0; n < DECK[k]; n++) s.deck.push(mk(k)); }); shuffle(s.deck);
      ids.forEach(() => s.pl.push({ hand: [], stable: [s.nursery.pop()] }));
      for (let r = 0; r < 5; r++) s.pl.forEach((p) => p.hand.push(s.deck.pop()));
      s.turn = Math.floor(Math.random() * ids.length);
      this.L('turn', s.turn);
      this.run();
    }
    static restore(ids, s) { return new Game(ids, s); }
    snapshot() { return { ids: this.ids, s: this.s }; }

    // ---------- utilidades
    key(id) { return this.s.inst[id]; }
    def(id) { return C[this.s.inst[id]]; }
    L(code, p, c, x) { const s = this.s; s.log.push([code, p == null ? -1 : p, c || '', x == null ? -1 : x]); if (s.log.length > 80) s.log.shift(); s.seq++; }
    ownerOf(id) { return this.s.pl.findIndex((p) => p.stable.includes(id)); }
    pas(i) { return this.s.pl[i].stable.map((id) => this.def(id).pas).filter(Boolean); }
    has(i, f) { return this.pas(i).some((p) => p[f]); }
    sum(i, f) { return this.pas(i).reduce((a, p) => a + (p[f] || 0), 0); }
    power(i) { return this.s.pl[i].stable.reduce((a, id) => a + (isUni(this.key(id)) ? ((this.def(id).pas && this.def(id).pas.countsAs) || 1) : 0), 0); }
    target(i) { return (this.ids.length >= 6 ? 6 : 7) + this.sum(i, 'winPlus'); }
    limit(i) { let l = 7 + this.sum(i, 'handBonus'); const caps = this.pas(i).map((p) => p.handCap).filter(Boolean); if (caps.length) l = Math.min(l, ...caps); return l; }
    allowed(i) { return 1 + this.s.t.bonus + this.sum(i, 'extra'); }
    order(from, withSelf) { const n = this.ids.length, r = []; for (let k = withSelf ? 0 : 1; k < n; k++) r.push((from + k) % n); return r; }
    toDiscard(id) { const s = this.s; (isUni(this.key(id)) && this.def(id).type === 'baby' ? s.nursery : s.discard).push(id); }
    leaveStable(id) { const o = this.ownerOf(id); if (o >= 0) { const st = this.s.pl[o].stable; st.splice(st.indexOf(id), 1); } return o; }
    draw(i) {
      const s = this.s; if (s.winner) return false;
      if (!s.deck.length) { this.endByDeck(); return false; }
      s.pl[i].hand.push(s.deck.pop()); return true;
    }
    endByDeck() {
      const s = this.s; let best = -1, w = [];
      this.ids.forEach((_, i) => { const p = this.power(i); if (p > best) { best = p; w = [i]; } else if (p === best) w.push(i); });
      s.winner = this.ids[w[0]]; s.endBy = 'deck'; s.tie = w.length > 1; s.pending = null; this.L('deckout', w[0]);
    }
    checkWin() {
      const s = this.s; if (s.winner) return;
      const ws = this.ids.map((_, i) => i).filter((i) => this.power(i) >= this.target(i));
      if (ws.length) { const i = ws.includes(s.turn) ? s.turn : ws[0]; s.winner = this.ids[i]; s.endBy = 'unicorns'; s.pending = null; this.L('win', i); }
    }
    pushFrame(p, src, ops) { this.s.stack.push({ p, src, ops: clone(ops), i: 0, v: {} }); }

    // ---------- bucle principal
    run() {
      const s = this.s; let guard = 0;
      while (!s.winner && !s.pending && guard++ < 20000) {
        this.checkWin(); if (s.winner) break;
        if (s.stack.length) { this.step(); continue; }
        const i = s.turn;
        if (s.phase === 'begin') {
          s.phase = 'draw';
          const fr = s.pl[i].stable.filter((id) => this.def(id).fx && this.def(id).fx.begin);
          for (let k = fr.length - 1; k >= 0; k--) this.pushFrame(i, fr[k], this.def(fr[k]).fx.begin);
          continue;
        }
        if (s.phase === 'draw') {
          s.phase = 'action';
          if (this.has(i, 'skipDraw')) this.L('noDraw', i); else if (this.draw(i)) this.L('draw', i);
          continue;
        }
        if (s.phase === 'action') {
          if (s.t.acts >= this.allowed(i)) { s.phase = 'end'; continue; }
          s.pending = { kind: 'action', p: i }; break;
        }
        if (s.phase === 'end') {
          const over = s.pl[i].hand.length - this.limit(i);
          if (over > 0) { s.pending = { kind: 'limit', p: i, n: over }; break; }
          s.turn = (s.turn + 1) % this.ids.length; s.phase = 'begin'; s.t = { acts: 0, bonus: 0 };
          this.L('turn', s.turn); continue;
        }
      }
      this.checkWin();
    }

    // ---------- máquina de efectos
    step() {
      const s = this.s, f = s.stack[s.stack.length - 1];
      if (f.i >= f.ops.length) { s.stack.pop(); return; }
      const r = this.exec(f, f.ops[f.i]);
      if (r === true) f.i++;
    }
    expand(f, op, list) {
      f.ops.splice(f.i, 1, ...list.map((p) => Object.assign({}, op, { who: null, p })));
    }
    lookahead(f, as) { for (let k = f.i + 1; k < f.ops.length; k++) if (f.ops[k].t === as) return f.ops[k].op; return null; }
    exec(f, op) {
      const s = this.s, v = f.v, P = op.p != null ? op.p : f.p;
      const whoList = () => op.who === 'others' ? this.order(f.p, false) : this.order(f.p, true);
      switch (op.op) {
        case 'draw': {
          if (op.who && op.who !== 'me') { this.expand(f, op, whoList()); return 'again'; }
          for (let k = 0; k < op.n; k++) if (!this.draw(P)) return true;
          this.L('drawn', P, '', op.n); return true;
        }
        case 'discard': {
          if (op.who && op.who !== 'me') { this.expand(f, op, whoList()); return 'again'; }
          const h = s.pl[P].hand;
          if (op.all) { if (h.length) { this.L('discardAll', P, '', h.length); while (h.length) this.toDiscard(h.pop()); } return true; }
          if (!h.length) return true;
          if (h.length <= op.n) { this.L('discarded', P, '', h.length); while (h.length) this.toDiscard(h.pop()); return true; }
          s.pending = { kind: 'discard', p: P, n: op.n, opts: h.slice(), src: f.src, frame: true }; return false;
        }
        case 'give': {
          this.expand(f, { op: 'giveOne' }, this.order(f.p, false)); return 'again';
        }
        case 'giveOne': {
          const h = s.pl[P].hand; if (!h.length) return true;
          if (h.length === 1) { s.pl[f.p].hand.push(h.pop()); this.L('gave', P, '', f.p); return true; }
          s.pending = { kind: 'give', p: P, n: 1, opts: h.slice(), to: f.p, src: f.src, frame: true }; return false;
        }
        case 'pickPlayer': {
          if (op.fixed) return true;
          const opts = this.order(f.p, false).filter((j) => !op.needHand || s.pl[j].hand.length);
          if (!opts.length) { v[op.as] = null; return true; }
          if (opts.length === 1) { v[op.as] = opts[0]; return true; }
          s.pending = { kind: 'player', p: f.p, opts, src: f.src, frame: true }; return false;
        }
        case 'stealRandom': {
          const j = v[op.p]; if (j == null) return true; const h = s.pl[j].hand; if (!h.length) return true;
          const id = h.splice(Math.floor(Math.random() * h.length), 1)[0]; s.pl[f.p].hand.push(id); this.L('stole', f.p, '', j); return true;
        }
        case 'pick': {
          if (op.need && v[op.need] == null) { v[op.as] = null; return true; }
          const la = this.lookahead(f, op.as);
          let ids = [];
          if (op.zone === 'discard') ids = s.discard.filter((id) => id !== f.src && matchType(this.key(id), op.types));
          else if (op.zone === 'deck') ids = s.deck.filter((id) => matchType(this.key(id), op.types));
          else {
            this.order(f.p, true).forEach((j) => {
              if (op.who === 'mine' && j !== f.p) return;
              if (op.who === 'others' && j === f.p) return;
              s.pl[j].stable.forEach((id) => {
                if (!matchType(this.key(id), op.types)) return;
                if (op.notSelf && id === f.src) return;
                if (la === 'destroy' && !this.canDestroy(id)) return;
                if (la === 'returnHand' && this.has(j, 'noBounce')) return;
                ids.push(id);
              });
            });
          }
          if (!ids.length) { v[op.as] = null; this.L('nothing', f.p, f.src ? this.key(f.src) : ''); return true; }
          if (ids.length === 1 && !op.optional && op.zone !== 'deck') { v[op.as] = ids[0]; return true; }
          s.pending = { kind: 'pick', p: f.p, opts: ids, optional: !!op.optional, zone: op.zone, src: f.src, frame: true }; return false;
        }
        case 'take': {
          const id = v[op.t]; if (id == null) return true;
          let k = s.deck.indexOf(id); if (k >= 0) s.deck.splice(k, 1); else { k = s.discard.indexOf(id); if (k >= 0) s.discard.splice(k, 1); }
          s.pl[f.p].hand.push(id); this.L('took', f.p, this.key(id)); return true;
        }
        case 'shuffleDeck': shuffle(s.deck); return true;
        case 'destroy': { const id = v[op.t]; if (id != null) this.destroy(id); return true; }
        case 'steal': {
          const id = v[op.t]; if (id == null) return true; const o = this.leaveStable(id); if (o < 0) return true;
          s.pl[f.p].stable.push(id); this.L('steal', f.p, this.key(id), o); return true;
        }
        case 'returnHand': {
          const id = v[op.t]; if (id == null) return true; const o = this.ownerOf(id); if (o < 0 || this.has(o, 'noBounce')) return true;
          this.leaveStable(id); if (this.def(id).type === 'baby') s.nursery.push(id); else s.pl[o].hand.push(id);
          this.L('bounce', o, this.key(id)); return true;
        }
        case 'revive': {
          const id = v[op.t]; if (id == null) return true; const k = s.discard.indexOf(id); if (k < 0) return true;
          s.discard.splice(k, 1); s.pl[f.p].stable.push(id); this.L('revive', f.p, this.key(id));
          if (this.def(id).fx && this.def(id).fx.enter) this.pushFrame(f.p, id, this.def(id).fx.enter);
          return true;
        }
        case 'swapStable': {
          const a = v[op.a], b = v[op.b]; if (a == null || b == null) return true;
          const oa = this.ownerOf(a), ob = this.ownerOf(b); if (oa < 0 || ob < 0 || oa === ob) return true;
          const sa = s.pl[oa].stable, sb = s.pl[ob].stable; sa[sa.indexOf(a)] = b; sb[sb.indexOf(b)] = a;
          this.L('swap', oa, this.key(a), ob); return true;
        }
        case 'swapHands': {
          const j = v[op.p]; if (j == null) return true; const t = s.pl[f.p].hand; s.pl[f.p].hand = s.pl[j].hand; s.pl[j].hand = t;
          this.L('swapHands', f.p, '', j); return true;
        }
        case 'extra': s.t.bonus += op.n; this.L('extra', f.p); return true;
        case 'peek': {
          const n = Math.min(op.n, s.deck.length); if (!n) return true;
          s.pending = { kind: 'peek', p: f.p, opts: s.deck.slice(-n), src: f.src, frame: true }; return false;
        }
      }
      return true;
    }
    canDestroy(id) {
      const o = this.ownerOf(id); if (o < 0) return false; const k = this.key(id);
      if (isUni(k)) {
        if (this.has(o, 'noDestroy')) return false;
        if (this.s.pl[o].stable.some((x) => x !== id && this.def(x).pas && this.def(x).pas.guard)) return false;
      }
      return true;
    }
    destroy(id) {
      const s = this.s, o = this.ownerOf(id); if (o < 0) return;
      if (!this.canDestroy(id)) { this.L('protected', o, this.key(id)); return; }
      const d = this.def(id);
      if (d.pas && d.pas.phoenix && !this.has(o, 'noBounce')) { this.leaveStable(id); s.pl[o].hand.push(id); this.L('phoenix', o, d.key); return; }
      this.leaveStable(id); this.toDiscard(id); this.L('destroy', o, d.key);
    }

    // ---------- jugar cartas y relinchos
    startReact(i, card, to) {
      const s = this.s, d = this.def(card), orig = { p: i, card, to };
      const free = (d.pas && d.pas.noNeigh) || (isUni(d.key) && this.has(i, 'noNeighUnicorns'));
      const queue = free ? [] : this.neighQueue(i, i);
      if (!queue.length) { this.resolvePlay(orig); return; }
      s.react = { orig, chain: [], queue };
      s.pending = { kind: 'neigh', p: queue[0] };
    }
    neighQueue(after, except) {
      const s = this.s;
      return this.order(after, false).filter((j) => j !== except && !this.has(j, 'noInstants') && s.pl[j].hand.some((id) => this.def(id).type === 'instant'));
    }
    finishReact() {
      const s = this.s, r = s.react; s.react = null; s.pending = null;
      r.chain.forEach((c) => s.discard.push(c.card));
      if (r.chain.length % 2 === 1) { s.discard.push(r.orig.card); this.L('stopped', r.orig.p, this.key(r.orig.card)); }
      else this.resolvePlay(r.orig);
    }
    resolvePlay(o) {
      const s = this.s, d = this.def(o.card);
      if (d.type === 'magic') { s.discard.push(o.card); this.L('cast', o.p, d.key); this.pushFrame(o.p, o.card, d.fx.cast); return; }
      s.pl[o.to].stable.push(o.card); this.L('enter', o.to, d.key, o.p);
      if (isUni(d.key) && d.fx && d.fx.enter) this.pushFrame(o.to, o.card, d.fx.enter);
    }
    canPlay(i, id) {
      const d = this.def(id), n = this.ids.length;
      if (d.type === 'instant' || d.type === 'baby') return false;
      if (d.type === 'upgrade' && this.has(i, 'noUpgrades')) return false;
      if (d.type === 'downgrade' && n < 2) return false;
      return true;
    }

    // ---------- entrada de jugadores
    act(pid, m) {
      const s = this.s; if (s.winner) return 'err.over';
      const i = this.ids.indexOf(pid); if (i < 0) return 'err.player';
      const pd = s.pending; if (!pd || pd.p !== i || !m) return 'err.turn';
      const r = this.respond(i, m, pd); if (r) return r;
      this.run(); return null;
    }
    chosen(m, pd, n) {
      const ids = Array.isArray(m.ids) ? m.ids.map(Number) : [];
      if (m.t !== 'pick' || ids.length !== n || new Set(ids).size !== n || !ids.every((x) => pd.opts.includes(x))) return null;
      return ids;
    }
    frameDone() { const f = this.s.stack[this.s.stack.length - 1]; f.i++; this.s.pending = null; return f; }
    respond(i, m, pd) {
      const s = this.s, h = s.pl[i].hand;
      switch (pd.kind) {
        case 'action': {
          if (m.t === 'draw') { if (!this.draw(i)) return null; s.t.acts++; s.pending = null; this.L('drawAct', i); return null; }
          if (m.t === 'pass') { if (s.t.acts < 1) return 'err.mustAct'; s.pending = null; s.phase = 'end'; return null; }
          if (m.t !== 'play') return 'err.bad';
          const card = Number(m.card); if (!h.includes(card)) return 'err.card';
          if (!this.canPlay(i, card)) return 'err.cantPlay';
          const d = this.def(card); let to = i;
          if (d.type === 'downgrade') { to = this.ids.indexOf(m.to); if (to < 0 || to === i) return 'err.target'; }
          h.splice(h.indexOf(card), 1); s.t.acts++; s.pending = null;
          this.L('play', i, d.key, to); this.startReact(i, card, to); return null;
        }
        case 'neigh': {
          const r = s.react;
          if (m.t === 'pass') { r.queue.shift(); if (!r.queue.length) this.finishReact(); else pd.p = r.queue[0]; return null; }
          if (m.t !== 'neigh') return 'err.bad';
          const card = Number(m.card); if (!h.includes(card) || this.def(card).type !== 'instant') return 'err.card';
          h.splice(h.indexOf(card), 1); const sup = !!this.def(card).super;
          r.chain.push({ p: i, card, sup }); this.L(sup ? 'super' : 'neigh', i, this.def(card).key);
          r.queue = sup ? [] : this.neighQueue(i, i);
          if (!r.queue.length) this.finishReact(); else pd.p = r.queue[0];
          return null;
        }
        case 'limit': {
          const ids = this.chosen(m, Object.assign({}, pd, { opts: h }), pd.n); if (!ids) return 'err.pick';
          ids.forEach((id) => { h.splice(h.indexOf(id), 1); this.toDiscard(id); }); this.L('discarded', i, '', ids.length); s.pending = null; return null;
        }
        case 'discard': {
          const ids = this.chosen(m, pd, pd.n); if (!ids) return 'err.pick';
          ids.forEach((id) => { h.splice(h.indexOf(id), 1); this.toDiscard(id); }); this.L('discarded', i, '', ids.length); this.frameDone(); return null;
        }
        case 'give': {
          const ids = this.chosen(m, pd, 1); if (!ids) return 'err.pick';
          h.splice(h.indexOf(ids[0]), 1); s.pl[pd.to].hand.push(ids[0]); this.L('gave', i, '', pd.to); this.frameDone(); return null;
        }
        case 'player': {
          const j = this.ids.indexOf(m.pid); if (m.t !== 'player' || !pd.opts.includes(j)) return 'err.target';
          const f = s.stack[s.stack.length - 1]; f.v[f.ops[f.i].as] = j; this.frameDone(); return null;
        }
        case 'pick': {
          const f = s.stack[s.stack.length - 1], as = f.ops[f.i].as;
          if (m.t === 'skip') { if (!pd.optional) return 'err.pick'; f.v[as] = null; this.frameDone(); return null; }
          const ids = this.chosen(m, pd, 1); if (!ids) return 'err.pick';
          f.v[as] = ids[0]; this.frameDone(); return null;
        }
        case 'peek': {
          const ids = this.chosen(m, pd, 1); if (!ids) return 'err.pick';
          pd.opts.forEach((id) => s.deck.splice(s.deck.indexOf(id), 1));
          h.push(ids[0]); pd.opts.filter((id) => id !== ids[0]).forEach((id) => s.deck.unshift(id));
          this.L('peeked', i); this.frameDone(); return null;
        }
      }
      return 'err.bad';
    }

    // ---------- quién debe actuar (modo local)
    actor() { const s = this.s; return this.ids[s.pending ? s.pending.p : s.turn]; }

    // ---------- vista por jugador (oculta manos ajenas y mazo)
    view(pid) {
      const s = this.s, me = this.ids.indexOf(pid), pd = s.pending, cards = {};
      const see = (id) => { cards[id] = s.inst[id]; };
      if (me >= 0) s.pl[me].hand.forEach(see);
      s.pl.forEach((p) => p.stable.forEach(see)); s.discard.forEach(see); s.nursery.forEach(see);
      if (s.react) { see(s.react.orig.card); s.react.chain.forEach((c) => see(c.card)); }
      let pend = null, playable = {};
      if (pd) {
        pend = { kind: pd.kind, pid: this.ids[pd.p], src: pd.src ? s.inst[pd.src] : null };
        if (pd.p === me) {
          if (pd.opts) { pend.opts = pd.opts.slice(); if (pd.kind === 'player') pend.opts = pd.opts.map((j) => this.ids[j]); else pd.opts.forEach(see); }
          if (pd.n) pend.n = pd.n; if (pd.optional) pend.optional = true; if (pd.zone) pend.zone = pd.zone;
          if (pd.kind === 'action') s.pl[me].hand.forEach((id) => { playable[id] = this.canPlay(me, id); });
          if (pd.kind === 'neigh') s.pl[me].hand.forEach((id) => { playable[id] = this.def(id).type === 'instant'; });
          if (pd.kind === 'limit') pend.n = pd.n;
        }
      }
      return {
        ids: this.ids.slice(), me, turn: this.ids[s.turn], phase: s.phase, seq: s.seq,
        deck: s.deck.length, discard: s.discard.slice(), nursery: s.nursery.slice(),
        pl: s.pl.map((p, j) => ({ id: this.ids[j], hand: j === me ? p.hand.slice() : p.hand.length, handN: p.hand.length, stable: p.stable.slice(), power: this.power(j), target: this.target(j), limit: this.limit(j) })),
        cards, pending: pend, playable,
        react: s.react ? { orig: { p: this.ids[s.react.orig.p], card: s.react.orig.card, to: this.ids[s.react.orig.to] }, chain: s.react.chain.map((c) => ({ p: this.ids[c.p], card: c.card })), asking: this.ids[s.pending ? s.pending.p : 0] } : null,
        acts: s.t.acts, allowed: this.allowed(s.turn),
        log: s.log.slice(-40), winner: s.winner, endBy: s.endBy, tie: s.tie,
      };
    }
  }

  const api = { Game, CARDS: C };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.UnicornEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
