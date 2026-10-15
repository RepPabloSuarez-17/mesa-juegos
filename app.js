// Cliente del hub: menú lateral, salas P2P (PeerJS) y tablero de Catán.
// El navegador del anfitrión hace de servidor: guarda el estado y lo reparte a los demás.
(function () {
  const $ = (s) => document.querySelector(s);
  const main = $('#main');
  const params = new URLSearchParams(location.search);
  const state = { me: null, room: null, game: null };
  const net = { peer: null, role: null, room: null, conns: new Map(), hostConn: null, timer: null };

  const gameFromUrl = params.get('juego');
  if (gameFromUrl && window.GAMES.some((g) => g.id === gameFromUrl && g.ready)) state.game = gameFromUrl;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const savedName = () => localStorage.getItem('mesa-name') || '';

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2800);
  }

  // ---------- Red (PeerJS) ----------
  function randomCode() {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    return Array.from({ length: 4 }, () => L[Math.floor(Math.random() * L.length)]).join('');
  }

  function broadcast() {
    const v = net.room.view();
    state.room = v;
    render();
    net.conns.forEach((c) => { try { if (c.open) c.send({ t: 'room', room: v }); } catch (e) {} });
  }

  function dropGuest(id) {
    const c = net.conns.get(id);
    if (!c) return;
    net.conns.delete(id);
    if (net.room) { net.room.remove(id); broadcast(); }
    try { c.close(); } catch (e) {}
  }

  function leaveAll(silent) {
    clearTimeout(net.timer);
    if (net.role === 'host') net.conns.forEach((c) => { try { c.send({ t: 'closed' }); } catch (e) {} });
    const p = net.peer;
    net.peer = null; net.role = null; net.room = null; net.hostConn = null; net.conns = new Map();
    if (p) setTimeout(() => { try { p.destroy(); } catch (e) {} }, 300);
    state.room = null; state.me = null;
    if (!silent) render();
  }

  function createRoom(name, tries) {
    tries = tries || 0;
    leaveAll(true);
    const code = randomCode();
    const peer = new Peer('mesa-' + state.game + '-' + code);
    net.peer = peer;
    peer.on('open', () => {
      const room = new MesaRoom(code, state.game, { generateBoard: CatanBoard.generateBoard });
      room.add('host', name);
      net.room = room; net.role = 'host'; state.me = 'host';
      broadcast();
    });
    peer.on('connection', (conn) => {
      conn.on('data', (m) => {
        const room = net.room;
        if (!room || !m) return;
        if (m.t === 'join') {
          const err = room.add(conn.peer, m.name);
          if (err) { conn.send({ t: 'error', msg: err }); setTimeout(() => { try { conn.close(); } catch (e) {} }, 300); return; }
          net.conns.set(conn.peer, conn);
          conn.send({ t: 'you', id: conn.peer });
          return broadcast();
        }
        if (!net.conns.has(conn.peer)) return;
        if (m.t === 'leave') return dropGuest(conn.peer);
        const err = room.handle(conn.peer, m);
        if (err) conn.send({ t: 'error', msg: err });
        broadcast();
      });
      conn.on('close', () => dropGuest(conn.peer));
    });
    peer.on('error', (e) => {
      if (net.peer !== peer) return;
      if (e.type === 'unavailable-id' && tries < 5) return createRoom(name, tries + 1);
      toast('Error de red: ' + e.type);
      leaveAll();
    });
  }

  function joinRoom(code, name) {
    leaveAll(true);
    code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (code.length !== 4) return toast('El código tiene 4 letras');
    let connected = false;
    const peer = new Peer();
    net.peer = peer; net.role = 'guest';
    net.timer = setTimeout(() => { if (!connected && net.peer === peer) { toast('No se encuentra esa sala'); leaveAll(); } }, 10000);
    peer.on('open', () => {
      const conn = peer.connect('mesa-' + state.game + '-' + code, { reliable: true, serialization: 'json' });
      net.hostConn = conn;
      conn.on('open', () => { connected = true; clearTimeout(net.timer); conn.send({ t: 'join', name }); });
      conn.on('data', (m) => {
        if (!m) return;
        if (m.t === 'you') state.me = m.id;
        else if (m.t === 'room') { state.room = m.room; render(); }
        else if (m.t === 'error') { toast(m.msg); if (!state.room) leaveAll(); }
        else if (m.t === 'closed') { toast('El anfitrión ha cerrado la sala'); leaveAll(); }
      });
      conn.on('close', () => { if (net.peer !== peer) return; toast('El anfitrión se ha desconectado'); leaveAll(); });
    });
    peer.on('error', (e) => {
      if (net.peer !== peer) return;
      toast(e.type === 'peer-unavailable' ? 'Esa sala no existe' : 'Error de red: ' + e.type);
      leaveAll();
    });
  }

  function send(m) {
    if (net.role === 'host') {
      const err = net.room.handle('host', m);
      if (err) toast(err);
      broadcast();
    } else if (net.hostConn && net.hostConn.open) {
      net.hostConn.send(m);
    }
  }

  function leave() {
    if (net.role === 'guest' && net.hostConn) { try { net.hostConn.send({ t: 'leave' }); } catch (e) {} }
    leaveAll();
  }

  // ---------- Menú lateral ----------
  function renderMenu() {
    const nav = $('#gamelist');
    nav.innerHTML = '';
    window.GAMES.forEach((g) => {
      const b = document.createElement('button');
      b.className = 'game' + (state.game === g.id ? ' active' : '');
      b.disabled = !g.ready;
      b.innerHTML = `<span>${g.emoji}</span>${esc(g.name)}${g.ready ? '' : '<small>pronto</small>'}`;
      b.onclick = () => { state.game = g.id; render(); };
      nav.appendChild(b);
    });
  }
  $('#toggle').onclick = () => $('#sidebar').classList.remove('closed');
  $('.brand').onclick = () => $('#sidebar').classList.add('closed');
  $('.brand').title = 'Pulsa para ocultar el menú';

  // ---------- Vistas ----------
  function render() {
    renderMenu();
    if (state.room && state.room.started) return renderGame();
    if (state.room) return renderWaiting();
    if (!state.game) return renderHome();
    renderLobby();
  }

  function renderHome() {
    main.innerHTML = `<div class="card"><h1>🎲 Mesa</h1><p>Elige un juego en el menú de la izquierda para crear una sala o unirte a la de tus amigos.</p></div>`;
  }

  function renderLobby() {
    const g = window.GAMES.find((x) => x.id === state.game);
    main.innerHTML = `<div class="card">
      <h1>${g.emoji} ${esc(g.name)}</h1><p>${esc(g.desc)}</p>
      <input id="name" placeholder="Tu nombre" maxlength="20" value="${esc(savedName())}">
      <div class="row"><button class="btn alt" id="create">Crear sala</button></div>
      <p style="margin-bottom:0">o únete con un código:</p>
      <div class="row"><input id="code" placeholder="ABCD" maxlength="4" style="text-transform:uppercase" value="${esc(params.get('sala') || '')}"><button class="btn" id="join">Unirse</button></div>
      <p class="hint">Quien crea la sala hace de servidor: si cierra la pestaña, se acaba la partida.</p>
    </div>`;
    const name = () => { const n = $('#name').value.trim(); if (!n) { toast('Escribe tu nombre'); return null; } localStorage.setItem('mesa-name', n); return n; };
    $('#create').onclick = () => { const n = name(); if (n) createRoom(n); };
    $('#join').onclick = () => { const n = name(); if (n) joinRoom($('#code').value, n); };
  }

  function renderWaiting() {
    const r = state.room;
    const isHost = r.hostId === state.me;
    const link = location.origin + location.pathname + '?juego=' + r.game + '&sala=' + r.code;
    main.innerHTML = `<div class="card">
      <h1>Sala de espera</h1><p>Comparte este código con tus amigos:</p>
      <div class="code">${esc(r.code)}</div>
      <input readonly value="${esc(link)}" onclick="this.select()">
      <ul class="plist">${r.players.map((p) => `<li><span class="dot" style="background:${p.color}"></span>${esc(p.name)}${p.id === r.hostId ? ' 👑' : ''}</li>`).join('')}</ul>
      <div class="row">
        ${isHost ? `<button class="btn alt" id="start" ${r.players.length < 2 ? 'disabled' : ''}>Empezar partida</button>` : '<span>Esperando al anfitrión…</span>'}
        <button class="btn" id="leave">Salir</button>
      </div></div>`;
    if (isHost) $('#start').onclick = () => send({ t: 'start' });
    $('#leave').onclick = leave;
  }

  // ---------- Tablero de Catán ----------
  const COLOR = { bosque: '#2f7a3d', pasto: '#9bcf53', trigo: '#f2cf4a', arcilla: '#c4572f', piedra: '#8b9099', desierto: '#e6d29a' };
  const ICON = { bosque: '🌲', pasto: '🐑', trigo: '🌾', arcilla: '🧱', piedra: '⛰️', desierto: '🏜️' };
  const S = 62;
  const toXY = (q, r) => ({ x: S * Math.sqrt(3) * (q + r / 2), y: S * 1.5 * r });
  const hexPts = (cx, cy, s) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return (cx + s * Math.cos(a)).toFixed(1) + ',' + (cy + s * Math.sin(a)).toFixed(1); }).join(' ');

  function boardSVG(board) {
    const W = 900, H = 800;
    let svg = `<svg viewBox="${-W / 2} ${-H / 2} ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<polygon points="${hexPts(0, 0, S * 5.1)}" fill="#1d6a96" stroke="#e8d9a8" stroke-width="10" stroke-linejoin="round" opacity=".95"/>`;
    board.tiles.forEach((t) => {
      const { x, y } = toXY(t.q, t.r);
      svg += `<g><polygon class="hex" points="${hexPts(x, y, S - 1)}" fill="${COLOR[t.res]}"/>`;
      svg += `<text x="${x}" y="${y - 20}" text-anchor="middle" font-size="22">${ICON[t.res]}</text>`;
      if (t.num) {
        const hot = t.num === 6 || t.num === 8;
        const dots = 6 - Math.abs(7 - t.num);
        svg += `<circle cx="${x}" cy="${y + 8}" r="19" fill="#f6ecd6" stroke="#3d2615" stroke-width="2"/>`;
        svg += `<text x="${x}" y="${y + 14}" text-anchor="middle" font-size="19" font-weight="800" fill="${hot ? '#c0261c' : '#2b1d12'}">${t.num}</text>`;
        svg += `<text x="${x}" y="${y + 26}" text-anchor="middle" font-size="8" fill="${hot ? '#c0261c' : '#2b1d12'}">${'•'.repeat(dots)}</text>`;
      } else {
        svg += `<text x="${x}" y="${y + 20}" text-anchor="middle" font-size="26">🥷</text>`;
      }
      svg += '</g>';
    });
    return svg + '</svg>';
  }

  function renderGame() {
    const r = state.room, s = r.state;
    const current = r.players[s.turn];
    const mine = current && current.id === state.me;
    main.innerHTML = `<div id="game">
      <div id="boardwrap">${boardSVG(s.board)}</div>
      <div id="panel">
        <b>Sala ${esc(r.code)}</b>
        <div>${r.players.map((p, i) => `<div class="pl ${i === s.turn ? 'turn' : ''}"><span class="dot" style="background:${p.color}"></span>${esc(p.name)}${i === s.turn ? ' 🎯' : ''}</div>`).join('')}</div>
        <div class="dice">${s.dice ? s.dice.map((d) => `<div class="die">${d}</div>`).join('') : ''}</div>
        ${s.dice ? `<div style="text-align:center;font-size:20px"><b>${s.dice[0] + s.dice[1]}</b></div>` : ''}
        ${mine ? `<button class="btn alt" id="roll" ${s.rolled ? 'disabled' : ''}>Tirar dados</button><button class="btn" id="end" ${s.rolled ? '' : 'disabled'}>Terminar turno</button>` : `<span>Turno de ${esc(current ? current.name : '')}</span>`}
        <button class="btn" id="leave" style="margin-top:auto">Salir</button>
      </div></div>`;
    if (mine) { $('#roll').onclick = () => send({ t: 'roll' }); $('#end').onclick = () => send({ t: 'end' }); }
    $('#leave').onclick = leave;
  }

  render();
})();
