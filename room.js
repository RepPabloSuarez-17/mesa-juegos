// Lógica de una sala. La ejecuta SOLO el navegador del anfitrión (es el "servidor").
(function (root) {
  const COLORS = ['#d9382b', '#2f6fd1', '#f08a1c', '#f4f1e8', '#2f9e55', '#8e44ad'];
  const MAX_PLAYERS = { catan: 6 };

  const cleanName = (n) => String(n || 'Jugador').replace(/[<>]/g, '').trim().slice(0, 20) || 'Jugador';

  function MesaRoom(code, game, deps) {
    this.code = code;
    this.game = game;
    this.deps = deps;
    this.hostId = null;
    this.players = [];
    this.started = false;
    this.state = null;
  }

  // Devuelve un texto de error, o null si todo bien
  MesaRoom.prototype.add = function (id, name) {
    if (this.started) return 'La partida ya ha empezado';
    if (this.players.length >= (MAX_PLAYERS[this.game] || 4)) return 'Sala llena';
    const used = new Set(this.players.map((p) => p.color));
    this.players.push({ id, name: cleanName(name), color: COLORS.find((c) => !used.has(c)) });
    if (!this.hostId) this.hostId = id;
    return null;
  };

  MesaRoom.prototype.remove = function (id) {
    this.players = this.players.filter((p) => p.id !== id);
    if (this.hostId === id && this.players.length) this.hostId = this.players[0].id;
    if (this.state && this.state.turn >= this.players.length) this.state.turn = 0;
  };

  MesaRoom.prototype.handle = function (id, m) {
    if (m.t === 'start') {
      if (id !== this.hostId || this.started) return null;
      if (this.players.length < 2) return 'Hacen falta al menos 2 jugadores';
      this.started = true;
      this.state = { board: this.deps.generateBoard(), turn: 0, dice: null, rolled: false };
      return null;
    }
    if (!this.started) return null;
    const current = this.players[this.state.turn];
    if (!current || current.id !== id) return null;
    if (m.t === 'roll' && !this.state.rolled) {
      this.state.dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
      this.state.rolled = true;
    } else if (m.t === 'end' && this.state.rolled) {
      this.state.turn = (this.state.turn + 1) % this.players.length;
      this.state.rolled = false;
    }
    return null;
  };

  MesaRoom.prototype.view = function () {
    return { code: this.code, game: this.game, hostId: this.hostId, started: this.started, players: this.players, state: this.state };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = { MesaRoom };
  else root.MesaRoom = MesaRoom;
})(typeof window !== 'undefined' ? window : globalThis);
