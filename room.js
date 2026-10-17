// Lógica de una sala. La ejecuta SOLO el navegador del anfitrión (es el "servidor").
(function (root) {
  const COLORS = ['#d8402f', '#3a78d6', '#f0a02a', '#ece6d6', '#3fa361', '#9b59b6'];
  const MAX_PLAYERS = { catan: 6, catan2: 4 };
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
  MesaRoom.prototype.add = function (id, name) {
    if (this.started) return 'net.started';
    if (this.players.length >= (MAX_PLAYERS[this.game] || 4)) return 'net.full';
    const used = new Set(this.players.map((p) => p.color));
    this.players.push({ id, name: cleanName(name), color: COLORS.find((c) => !used.has(c)) });
    if (!this.hostId) this.hostId = id;
    return null;
  };

  MesaRoom.prototype.remove = function (id) {
    const p = this.players.find((x) => x.id === id);
    if (!p) return;
    if (this.started) { if (!this.aborted) this.aborted = p.name; return; }
    this.players = this.players.filter((x) => x.id !== id);
    if (this.hostId === id && this.players.length) this.hostId = this.players[0].id;
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
    return this.engine.act(id, m);
  };

  MesaRoom.prototype.view = function (pid) {
    return {
      code: this.code, game: this.game, hostId: this.hostId, started: this.started, aborted: this.aborted,
      players: this.players, g: this.engine ? this.engine.view(pid) : null,
    };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = { MesaRoom };
  else root.MesaRoom = MesaRoom;
})(typeof window !== 'undefined' ? window : globalThis);
