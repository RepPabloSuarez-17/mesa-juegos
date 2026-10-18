// Lógica de una sala. La ejecuta SOLO el navegador del anfitrión (es el "servidor").
(function (root) {
  const COLORS = ['#d8402f', '#3a78d6', '#f0a02a', '#ece6d6', '#3fa361', '#9b59b6'];
  const MAX_PLAYERS = { catan: 6, catan2: 6 };
  const cleanName = (n) => String(n || 'Jugador').replace(/[<>]/g, '').trim().slice(0, 20) || 'Jugador';

  function MesaRoom(code, game, deps) {
    this.code = code;
    this.game = game;
    this.deps = deps; // { makeEngine(ids, game) }
    this.hostId = null;
    this.players = [];
    this.started = false;
    this.engine = null;
    this.aborted = null;
  }

  // Devuelve una clave de error o null
  MesaRoom.COLORS = COLORS;
  MesaRoom.prototype.add = function (id, name) {
    if (this.started) return 'net.started';
    if (this.players.length >= (MAX_PLAYERS[this.game] || 4)) return 'net.full';
    const used = new Set(this.players.map((p) => p.color));
    let nm = cleanName(name), k = 2;
    while (this.players.some((p) => p.name.toLowerCase() === nm.toLowerCase())) nm = cleanName(name).slice(0, 17) + ' ' + k++; // nombres únicos: se usan para volver a la partida
    this.players.push({ id, name: nm, color: COLORS.find((c) => !used.has(c)), online: true });
    if (!this.hostId) this.hostId = id;
    return null;
  };

  MesaRoom.prototype.remove = function (id) {
    const p = this.players.find((x) => x.id === id);
    if (!p) return;
    if (this.started) { p.online = false; return; } // en partida: se queda su sitio, puede volver
    this.players = this.players.filter((x) => x.id !== id);
    if (this.hostId === id && this.players.length) this.hostId = this.players[0].id;
  };

  // Reconexión en partida: por id estable o, si no, por nombre entre los desconectados. Devuelve el id del jugador o null.
  MesaRoom.prototype.rejoin = function (cid, name) {
    if (!this.started) return null;
    const nm = cleanName(name).toLowerCase();
    const p = this.players.find((x) => x.id === cid) || this.players.find((x) => !x.online && x.name.toLowerCase() === nm);
    if (!p) return null;
    p.online = true;
    return p.id;
  };

  // Foto de la sala para poder reanudarla si el anfitrión recarga la página.
  MesaRoom.prototype.snapshot = function () {
    if (!this.started || !this.engine) return null;
    return { code: this.code, game: this.game, hostId: this.hostId, players: this.players, engine: { ids: this.engine.ids, board: this.engine.board, s: this.engine.s } };
  };
  MesaRoom.restore = function (snap, deps) {
    const r = new MesaRoom(snap.code, snap.game, deps);
    r.hostId = snap.hostId; r.started = true;
    r.players = snap.players.map((p) => Object.assign({}, p, { online: p.id === snap.hostId }));
    r.engine = deps.restoreEngine(snap.engine);
    return r;
  };

  MesaRoom.prototype.handle = function (id, m) {
    if (!m) return null;
    if (m.t === 'start') {
      if (id !== this.hostId || this.started) return null;
      if (this.players.length < 2) return 'wait.need2';
      this.engine = this.deps.makeEngine(this.players.map((p) => p.id), this.game);
      this.started = true;
      return null;
    }
    if (!this.started || this.aborted) return null;
    // Ajuste de sala: recolección automática de recursos (solo el anfitrión)
    if (m.t === 'auto') {
      if (id === this.hostId && this.engine.setAuto) this.engine.setAuto(!!m.v);
      return null;
    }
    // Pausa: solo el anfitrión (o cualquiera en una partida local)
    if (m.t === 'pause') {
      if (id !== this.hostId && !this.local) return 'e.hostonly';
      this.paused = !!m.v;
      return null;
    }
    // Deshacer: devuelve el estado a justo antes de la última pieza colocada
    if (m.t === 'undo') {
      const top = (this.undoStack || []).slice(-1)[0];
      if (!top || this.paused) return 'e.noundo';
      if (!this.local && top.pid !== id) return 'e.noundo';
      this.undoStack.pop();
      const cur = this.engine.s.seq;
      this.engine.s = JSON.parse(top.s);
      this.engine.s.seq = cur; // el contador no retrocede: así los clientes detectan el cambio
      this.engine.log('undo', { p: this.engine.ids.indexOf(top.pid) });
      return null;
    }
    if (this.paused) return 'e.paused';
    if (m.t === 'build') {
      const before = JSON.stringify(this.engine.s);
      const err = this.engine.act(id, m);
      if (!err) { (this.undoStack = this.undoStack || []).push({ s: before, pid: id }); if (this.undoStack.length > 12) this.undoStack.shift(); }
      return err;
    }
    const err2 = this.engine.act(id, m);
    if (!err2) this.undoStack = []; // tirar dados, comerciar, robar... ya no se puede volver atrás
    return err2;
  };

  MesaRoom.prototype.decorate = function (g, pid) {
    const top = (this.undoStack || []).slice(-1)[0];
    g.canUndo = !!top && !this.paused && (this.local || top.pid === pid);
    g.paused = !!this.paused;
    return g;
  };

  MesaRoom.prototype.view = function (pid) {
    return {
      code: this.code, game: this.game, hostId: this.hostId, started: this.started, aborted: this.aborted,
      players: this.players, g: this.engine ? this.decorate(this.engine.view(pid), pid) : null, paused: !!this.paused,
    };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = { MesaRoom };
  else root.MesaRoom = MesaRoom;
})(typeof window !== 'undefined' ? window : globalThis);
