// Hub: menú lateral, idioma, salas P2P (PeerJS), partida local y arranque de cada juego.
// El navegador del anfitrión hace de servidor: guarda el estado y reparte a cada jugador su vista.
(function () {
  const $ = (s) => document.querySelector(s);
  const T = (k, p) => I18N.t(k, p);
  const main = $('#main');
  const params = new URLSearchParams(location.search);
  const state = { myId: null, room: null, game: null };
  const net = { peer: null, role: null, room: null, conns: new Map(), hostConn: null, timer: null };
  let inGame = false;

  const gameFromUrl = params.get('juego');
  if (gameFromUrl && window.GAMES.some((g) => g.id === gameFromUrl && g.ready)) state.game = gameFromUrl;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const savedName = () => { try { return localStorage.getItem('mesa-name') || ''; } catch (e) { return ''; } };
  const gname = (g) => g.name[I18N.lang] || g.name.es;

  function toast(msg) {
    const t = $('#toast');
    t.textContent = T(msg);
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2800);
  }

  const makeEngine = (ids, game) => (game === 'catan2' ? new CatanEngine.CatanGame(ids, CatanBoard.generateBoard(ids.length)) : new CatanSimple.Game(ids, CatanBoard.generateBoard()));
  const newRoom = (code, game) => new MesaRoom(code, game, { makeEngine });

  // ---------- Red (PeerJS) ----------
  function randomCode() {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    return Array.from({ length: 4 }, () => L[Math.floor(Math.random() * L.length)]).join('');
  }

  // Partida local: todos los jugadores en este dispositivo; la vista es la del jugador que debe actuar.
  function actingId(room) {
    const s = room.engine.s;
    if (s.phase === 'discard') return room.players[+Object.keys(s.discard)[0]].id;
    return room.players[s.turn].id;
  }

  function broadcast() {
    const room = net.room;
    if (net.role === 'local') {
      state.room = room.view(room.started ? actingId(room) : 'L0');
      state.myId = 'L0';
    } else {
      state.room = room.view('host');
      state.myId = 'host';
      net.conns.forEach((c) => { try { if (c.open) c.send({ t: 'room', room: room.view(c.peer) }); } catch (e) {} });
    }
    render();
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
    state.room = null; state.myId = null;
    if (!silent) render();
  }

  function createRoom(name, tries) {
    tries = tries || 0;
    leaveAll(true);
    if (typeof Peer === 'undefined') return toast('net.err');
    const code = randomCode();
    const peer = new Peer('mesa-' + state.game + '-' + code);
    net.peer = peer;
    peer.on('open', () => {
      const room = newRoom(code, state.game);
      room.add('host', name);
      net.room = room; net.role = 'host';
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
      toast(T('net.err') + ': ' + e.type);
      leaveAll();
    });
  }

  function joinRoom(code, name) {
    leaveAll(true);
    if (typeof Peer === 'undefined') return toast('net.err');
    code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (code.length !== 4) return toast('lobby.code4');
    let connected = false;
    const peer = new Peer();
    net.peer = peer; net.role = 'guest';
    net.timer = setTimeout(() => { if (!connected && net.peer === peer) { toast('net.notfound'); leaveAll(); } }, 10000);
    peer.on('open', (myId) => {
      const conn = peer.connect('mesa-' + state.game + '-' + code, { reliable: true, serialization: 'json' });
      net.hostConn = conn;
      state.myId = myId;
      conn.on('open', () => { connected = true; clearTimeout(net.timer); conn.send({ t: 'join', name }); });
      conn.on('data', (m) => {
        if (!m) return;
        if (m.t === 'room') { state.room = m.room; render(); }
        else if (m.t === 'error') { toast(m.msg); if (!state.room) leaveAll(); }
        else if (m.t === 'closed') { toast('net.hostclosed'); leaveAll(); }
      });
      conn.on('close', () => { if (net.peer !== peer) return; toast('net.hostgone'); leaveAll(); });
    });
    peer.on('error', (e) => {
      if (net.peer !== peer) return;
      if (e.type === 'peer-unavailable') toast('net.noroom'); else toast(T('net.err') + ': ' + e.type);
      leaveAll();
    });
  }

  function startLocal(n) {
    leaveAll(true);
    const room = newRoom('LOCL', state.game);
    for (let i = 0; i < n; i++) room.add('L' + i, (I18N.lang === 'en' ? 'Player ' : 'Jugador ') + (i + 1));
    room.handle('L0', { t: 'start' });
    if (room.engine && room.engine.setAuto) room.engine.setAuto(true); // en partida local los recursos se reparten solos
    net.room = room; net.role = 'local';
    broadcast();
  }

  // send(m, as): as = índice de jugador (solo partida local, para respuestas de otros jugadores)
  function send(m, as) {
    if (net.role === 'host' || net.role === 'local') {
      const room = net.room;
      let id = 'host';
      if (net.role === 'local') id = as !== undefined ? room.players[as].id : (room.started ? actingId(room) : 'L0');
      const err = room.handle(id, m);
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

  // ---------- Menú lateral e idioma ----------
  function renderMenu() {
    const nav = $('#gamelist');
    nav.innerHTML = '';
    window.GAMES.forEach((g) => {
      const b = document.createElement('button');
      b.className = 'game' + (state.game === g.id ? ' active' : '');
      b.dataset.id = g.id;
      b.disabled = !g.ready;
      b.innerHTML = `<span>${g.emoji}</span>${esc(gname(g))}${g.ready ? '' : `<small>${T('menu.soon')}</small>`}`;
      b.onclick = () => { state.game = g.id; render(); };
      nav.appendChild(b);
    });
    $('#langlabel').textContent = T('menu.lang');
    $('#langbtns').innerHTML = ['es', 'en'].map((l) => `<button class="${I18N.lang === l ? 'on' : ''}" data-l="${l}">${l.toUpperCase()}</button>`).join('');
    $('#foot').innerHTML = `${T('menu.add')} <code>games.js</code>`;
  }
  $('#langbtns').addEventListener('click', (e) => { const l = e.target.getAttribute('data-l'); if (l) I18N.set(l); });
  I18N.onChange(() => render());
  $('#toggle').onclick = () => $('#sidebar').classList.remove('closed');
  $('.brand').onclick = () => $('#sidebar').classList.add('closed');
  $('.brand').title = '☰';

  // ---------- Vistas ----------
  function render() {
    renderMenu();
    const r = state.room, playing = !!(r && r.started && r.g), full = playing && r.game === 'catan2';
    if (full !== inGame) { inGame = full; $('#sidebar').classList.toggle('closed', full); }
    if (full) return CatanUI.update(main, r, { send, leave, rerender: render, local: net.role === 'local', isHost: r.hostId === state.myId });
    if (playing) return CatanSimple.render(main, r, { send, leave });
    if (r) return renderWaiting();
    if (!state.game) return renderHome();
    renderLobby();
  }

  function renderHome() {
    main.innerHTML = `<div class="card parch"><h1>🎲 ${T('home.title')}</h1><p>${T('home.text')}</p></div>`;
  }

  function renderLobby() {
    const g = window.GAMES.find((x) => x.id === state.game);
    main.innerHTML = `<div class="card parch">
      <h1>${g.emoji} ${esc(gname(g))}</h1><p>${T(g.descKey)}</p>
      <input id="name" placeholder="${T('lobby.name')}" maxlength="20" value="${esc(savedName())}">
      <div class="row"><button class="btn alt" id="create">${T('lobby.create')}</button></div>
      <p style="margin-bottom:0">${T('lobby.or')}</p>
      <div class="row"><input id="code" placeholder="ABCD" maxlength="4" style="text-transform:uppercase" value="${esc(params.get('sala') || '')}"><button class="btn" id="join">${T('lobby.join')}</button></div>
      <p class="hint">${T('lobby.host')}</p>
      ${g.local ? `<hr><p style="margin-bottom:0"><b>${T('lobby.local')}</b></p><div class="row"><select id="nloc"><option>2</option><option selected>3</option><option>4</option><option>5</option><option>6</option></select><span>${T('lobby.localN')}</span><button class="btn" id="local">${T('lobby.localGo')}</button></div>` : ''}
    </div>`;
    const name = () => { const n = $('#name').value.trim(); if (!n) { toast('lobby.needName'); return null; } try { localStorage.setItem('mesa-name', n); } catch (e) {} return n; };
    $('#create').onclick = () => { const n = name(); if (n) createRoom(n); };
    $('#join').onclick = () => { const n = name(); if (n) joinRoom($('#code').value, n); };
    if (g.local) $('#local').onclick = () => startLocal(+$('#nloc').value);
  }

  function renderWaiting() {
    const r = state.room;
    const isHost = r.hostId === state.myId;
    const link = location.origin + location.pathname + '?juego=' + r.game + '&sala=' + r.code;
    main.innerHTML = `<div class="card parch">
      <h1>${T('wait.title')}</h1><p>${T('wait.share')}</p>
      <div class="code">${esc(r.code)}</div>
      <input readonly value="${esc(link)}" onclick="this.select()">
      ${r.game === 'catan2' ? `<p class="hint">${T('wait.ext')}</p>` : ''}
      <ul class="plist">${r.players.map((p) => `<li><span class="dot" style="background:${p.color}"></span>${esc(p.name)}${p.id === r.hostId ? ' 👑' : ''}</li>`).join('')}</ul>
      <div class="row">
        ${isHost ? `<button class="btn alt" id="start" ${r.players.length < 2 ? 'disabled' : ''}>${T('wait.start')}</button>` : `<span>${T('wait.host')}</span>`}
        <button class="btn" id="leave">${T('wait.leave')}</button>
      </div></div>`;
    if (isHost) $('#start').onclick = () => send({ t: 'start' });
    $('#leave').onclick = leave;
  }

  if (params.get('debug')) window.__mesa = { net, state, render, broadcast };
  render();
})();
