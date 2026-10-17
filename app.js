// Hub: menú lateral, idioma, salas P2P (PeerJS), partida local y arranque de cada juego.
// El navegador del anfitrión hace de servidor: guarda el estado y reparte a cada jugador su vista.
(function () {
  const $ = (s) => document.querySelector(s);
  const T = (k, p) => I18N.t(k, p);
  const main = $('#main');
  const params = new URLSearchParams(location.search);
  const state = { myId: null, room: null, game: null };
  const net = { peer: null, role: null, room: null, conns: new Map(), hostConn: null, timer: null, hb: null, recon: false, retries: 0, seen: 0, target: null, onl: null };
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
  const newRoom = (code, game) => new MesaRoom(code, game, { makeEngine, restoreEngine: (e) => { const g = new CatanEngine.CatanGame(e.ids, e.board); g.s = e.s; return g; } });

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

  // ---------- Sesión guardada (para reconectar) ----------
  const SESS = 'mesa-sess', HOSTSAVE = 'mesa-host';
  const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch (e) {} };
  // Identificador estable de este navegador (sobrevive a recargas, no a cerrar la pestaña: ahí se usa el nombre)
  function getCid() {
    try {
      let c = sessionStorage.getItem('mesa-cid');
      if (!c) { c = Math.random().toString(36).slice(2, 12); sessionStorage.setItem('mesa-cid', c); }
      return c;
    } catch (e) { return net.cidMem || (net.cidMem = Math.random().toString(36).slice(2, 12)); }
  }
  const BEAT = params.get('fastnet') ? 1000 : 4000, DEAD = params.get('fastnet') ? 4000 : 14000;
  const restoreEngine = (e) => { const g = new CatanEngine.CatanGame(e.ids, e.board); g.s = e.s; return g; };
  const deps = { makeEngine, restoreEngine };

  function toastRaw(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), 2800);
  }

  function saveHost() {
    const room = net.room;
    if (net.role !== 'host' || !room || !room.started || !room.engine) return;
    if (room.engine.s.phase === 'over') { lsDel(HOSTSAVE); lsDel(SESS); return; }
    lsSet(SESS, { role: 'host', game: room.game, code: room.code, t: Date.now() });
    clearTimeout(net.saveT);
    net.saveT = setTimeout(() => { const sn = room.snapshot(); if (sn) lsSet(HOSTSAVE, { t: Date.now(), snap: sn }); }, 500);
  }

  function broadcast() {
    const room = net.room;
    if (net.role === 'local') {
      state.room = room.view(room.started ? actingId(room) : 'L0');
      state.myId = 'L0';
    } else {
      state.room = room.view('host');
      state.myId = 'host';
      net.conns.forEach((c, pid) => { try { if (c.open) c.send({ t: 'room', room: room.view(pid) }); } catch (e) {} });
      saveHost();
    }
    render();
  }

  // ----- Anfitrión -----
  function dropGuest(pid) {
    const c = net.conns.get(pid);
    if (!c) return;
    net.conns.delete(pid);
    c.pid = null;
    if (net.room) { net.room.remove(pid); broadcast(); }
    try { c.close(); } catch (e) {}
  }

  function hostBeat() {
    const now = Date.now();
    net.conns.forEach((c, pid) => {
      if (now - (c.seen || now) > DEAD) return dropGuest(pid);
      try { if (c.open) c.send({ t: 'hb' }); } catch (e) {}
    });
  }

  function onGuestConn(conn) {
    conn.seen = Date.now();
    conn.on('data', (m) => {
      const room = net.room;
      if (!room || !m) return;
      conn.seen = Date.now();
      if (m.t === 'join') {
        const cid = String(m.cid || conn.peer).replace(/[^\w-]/g, '').slice(0, 40) || conn.peer;
        let pid = null;
        if (room.started) {
          pid = room.rejoin(cid, m.name);
          if (!pid) { conn.send({ t: 'error', msg: 'net.started' }); setTimeout(() => { try { conn.close(); } catch (e) {} }, 300); return; }
        } else {
          const ex = room.players.find((p) => p.id === cid);
          if (ex) { ex.online = true; pid = cid; } else {
            const err = room.add(cid, m.name);
            if (err) { conn.send({ t: 'error', msg: err }); setTimeout(() => { try { conn.close(); } catch (e) {} }, 300); return; }
            pid = cid;
          }
        }
        const old = net.conns.get(pid);
        conn.pid = pid;
        net.conns.set(pid, conn);
        if (old && old !== conn) { old.pid = null; try { old.close(); } catch (e) {} }
        return broadcast();
      }
      if (!conn.pid || net.conns.get(conn.pid) !== conn) return;
      if (m.t === 'hb') return;
      if (m.t === 'leave') return dropGuest(conn.pid);
      const err = room.handle(conn.pid, m);
      if (err) conn.send({ t: 'error', msg: err });
      broadcast();
    });
    conn.on('close', () => { if (conn.pid && net.conns.get(conn.pid) === conn) dropGuest(conn.pid); });
  }

  function leaveAll(silent) {
    clearTimeout(net.timer); clearTimeout(net.saveT); clearInterval(net.hb);
    if (net.role === 'host') net.conns.forEach((c) => { try { c.send({ t: 'closed' }); } catch (e) {} });
    const p = net.peer;
    net.peer = null; net.role = null; net.room = null; net.hostConn = null; net.conns = new Map(); net.recon = false; net.target = null; net.onl = null;
    if (p) setTimeout(() => { try { p.destroy(); } catch (e) {} }, 300);
    state.room = null; state.myId = null;
    if (!silent) render();
  }

  // makeRoom crea la sala cuando el peer está abierto; resume = reintentar si el id aún está ocupado (recarga del anfitrión)
  function openHost(code, makeRoom, resume, tries) {
    tries = tries || 0;
    leaveAll(true);
    if (typeof Peer === 'undefined') return toast('net.err');
    const peer = new Peer('mesa-' + state.game + '-' + code);
    net.peer = peer;
    if (resume) { net.recon = true; renderBanner(); }
    peer.on('open', () => {
      net.room = makeRoom(); net.role = 'host'; net.recon = false;
      net.hb = setInterval(hostBeat, BEAT);
      broadcast();
    });
    peer.on('connection', onGuestConn);
    peer.on('error', (e) => {
      if (net.peer !== peer) return;
      if (e.type === 'unavailable-id' && tries < (resume ? 10 : 5)) {
        const g = state.game;
        return setTimeout(() => { if (!net.peer || net.peer === peer) { state.game = g; openHost(code, makeRoom, resume, tries + 1); if (resume) { net.recon = true; renderBanner(); } } }, resume ? 2000 : 0);
      }
      toast(T('net.err') + ': ' + e.type);
      net.recon = false;
      leaveAll();
    });
  }

  function createRoom(name) {
    const code = randomCode();
    openHost(code, () => { const room = newRoom(code, state.game); room.add('host', name); return room; }, false);
  }

  function resumeHost(sess) {
    const sv = lsGet(HOSTSAVE);
    if (!sv || !sv.snap || sv.snap.code !== sess.code) { lsDel(SESS); return false; }
    state.game = sv.snap.game;
    openHost(sv.snap.code, () => MesaRoom.restore(sv.snap, deps), true);
    return true;
  }

  // ----- Invitado -----
  function guestBeat() {
    if (net.hostConn && net.hostConn.open) { try { net.hostConn.send({ t: 'hb' }); } catch (e) {} }
    if (Date.now() - net.seen > DEAD) lost();
  }
  function giveUp() { lsDel(SESS); net.recon = false; leaveAll(); }
  function lost() {
    if (!net.target) return;
    scheduleRetry();
  }
  function scheduleRetry() {
    clearTimeout(net.timer); clearInterval(net.hb);
    if (!net.target) return;
    net.recon = true; renderBanner();
    if (++net.retries > 120) { toast('net.hostgone'); return giveUp(); }
    const t = net.target;
    net.timer = setTimeout(() => startGuest(t.code, t.name, true), 2500);
  }

  function startGuest(code, name, retry) {
    clearTimeout(net.timer); clearInterval(net.hb);
    const old = net.peer;
    net.peer = null;
    if (old) { try { old.destroy(); } catch (e) {} }
    if (typeof Peer === 'undefined') return toast('net.err');
    let connected = false;
    const peer = new Peer();
    net.peer = peer; net.role = 'guest'; net.target = { code, name };
    net.timer = setTimeout(() => {
      if (connected || net.peer !== peer) return;
      if (retry || state.room) scheduleRetry(); else { toast('net.notfound'); leaveAll(); }
    }, 10000);
    peer.on('open', () => {
      const conn = peer.connect('mesa-' + state.game + '-' + code, { reliable: true, serialization: 'json' });
      net.hostConn = conn;
      conn.on('open', () => {
        connected = true; clearTimeout(net.timer);
        net.seen = Date.now();
        conn.send({ t: 'join', name, cid: getCid() });
        net.hb = setInterval(guestBeat, BEAT);
      });
      conn.on('data', (m) => {
        if (!m) return;
        net.seen = Date.now();
        if (m.t === 'room') {
          state.room = m.room; state.myId = getCid();
          net.recon = false; net.retries = 0;
          if (m.room.g && m.room.g.phase === 'over') lsDel(SESS); else lsSet(SESS, { role: 'guest', game: state.game, code, name, t: Date.now() });
          render();
        } else if (m.t === 'error') {
          if (m.msg === 'net.started' && (retry || state.room) && net.retries < 8) { net.retries++; return; } // puede que el anfitrión aún no haya notado la caída: se reintenta
          toast(m.msg);
          if (!state.room || m.msg === 'net.started' || m.msg === 'net.full') giveUp(); // los errores de una jugada no te sacan de la partida
        } else if (m.t === 'closed') { toast('net.hostclosed'); lsDel(SESS); leaveAll(); }
      });
      conn.on('close', () => { if (net.peer !== peer) return; lost(); });
    });
    peer.on('error', (e) => {
      if (net.peer !== peer) return;
      if (retry || state.room) return scheduleRetry();
      if (e.type === 'peer-unavailable') toast('net.noroom'); else toast(T('net.err') + ': ' + e.type);
      leaveAll();
    });
  }

  function joinRoom(code, name) {
    leaveAll(true);
    if (typeof Peer === 'undefined') return toast('net.err');
    code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    if (code.length !== 4) return toast('lobby.code4');
    net.retries = 0;
    startGuest(code, name, false);
  }

  // Aviso de reconexión
  function renderBanner() {
    let el = $('#netbar');
    if (!net.recon) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('div'); el.id = 'netbar'; document.body.appendChild(el); el.addEventListener('click', (e) => { if (e.target.closest('button')) giveUp(); }); }
    const code = net.target ? net.target.code : (net.peer && net.peer.id ? String(net.peer.id).slice(-4) : '');
    el.innerHTML = `<span class="spin"></span><span>${T('net.reconnecting', { code })}</span><button>${T('a.cancel')}</button>`;
  }

  // Avisos cuando alguien se cae o vuelve
  function trackPresence(r) {
    if (!r || !r.started) { net.onl = null; return; }
    const cur = {};
    r.players.forEach((p) => { cur[p.id] = p.online !== false; });
    if (net.onl) r.players.forEach((p) => {
      if (net.onl[p.id] === true && !cur[p.id]) toastRaw(T('net.left', { name: p.name }));
      else if (net.onl[p.id] === false && cur[p.id]) toastRaw(T('net.back', { name: p.name }));
    });
    net.onl = cur;
  }

  function startLocal(names, privacy) {
    leaveAll(true);
    const room = newRoom('LOCL', state.game);
    names.forEach((nm, i) => room.add('L' + i, nm));
    net.privacy = !!privacy;
    room.handle('L0', { t: 'start' });
    net.room = room; net.role = 'local';
    broadcast();
  }

  // send(m, as): as = índice de jugador (solo partida local, para respuestas de otros jugadores)
  function send(m, as) {
    if (net.role === 'host' || net.role === 'local') {
      const room = net.room;
      let id = 'host';
      if (net.role === 'local') id = as !== undefined ? room.players[as].id : (room.started ? actingId(room) : 'L0');
      let err;
      if (net.role === 'local' && m.t === 'collect') {
        // pantalla compartida: al tocar un hexágono cobran todos los jugadores que tengan algo pendiente ahí
        room.players.forEach((pl) => { room.handle(pl.id, m); });
        err = null;
      } else err = room.handle(id, m);
      if (err) toast(err);
      broadcast();
    } else if (net.hostConn && net.hostConn.open) {
      net.hostConn.send(m);
    }
  }

  function leave() {
    if (net.role === 'guest' && net.hostConn) { try { net.hostConn.send({ t: 'leave' }); } catch (e) {} }
    lsDel(SESS); lsDel(HOSTSAVE);
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
    trackPresence(state.room);
    renderBanner();
    const r = state.room, playing = !!(r && r.started && r.g), full = playing && r.game === 'catan2';
    if (full !== inGame) { inGame = full; $('#sidebar').classList.toggle('closed', full); }
    if (full) return CatanUI.update(main, r, { send, leave, rerender: render, local: net.role === 'local', privacy: net.privacy, isHost: r.hostId === state.myId });
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
      ${g.local ? `<hr><p style="margin-bottom:4px"><b>🖥️ ${T('lobby.local')}</b></p><p class="hint" style="margin-top:0">${T('lobby.local.d')}</p>
      <div class="row"><select id="nloc"><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option></select><span>${T('lobby.localN')}</span></div>
      <div id="locnames"></div>
      <label class="chk"><input type="checkbox" id="locpriv" checked> ${T('lobby.local.priv')}</label>
      <div class="row"><button class="btn alt" id="local">${T('lobby.localGo')}</button></div>` : ''}
    </div>`;
    const name = () => { const n = $('#name').value.trim(); if (!n) { toast('lobby.needName'); return null; } try { localStorage.setItem('mesa-name', n); } catch (e) {} return n; };
    $('#create').onclick = () => { const n = name(); if (n) createRoom(n); };
    $('#join').onclick = () => { const n = name(); if (n) joinRoom($('#code').value, n); };
    if (g.local) {
      let saved = []; try { saved = JSON.parse(localStorage.getItem('mesa-locnames') || '[]'); } catch (e) {}
      const drawNames = () => {
        const n = +$('#nloc').value, cur = Array.from(document.querySelectorAll('#locnames input')).map((i) => i.value);
        $('#locnames').innerHTML = Array.from({ length: n }, (_, i) => `<div class="locrow"><span class="dot" style="background:${MesaRoom.COLORS[i]}"></span><input maxlength="20" placeholder="${T('lobby.local.p', { n: i + 1 })}" value="${esc(cur[i] !== undefined ? cur[i] : (saved[i] || ''))}"></div>`).join('');
      };
      drawNames();
      $('#nloc').onchange = drawNames;
      $('#local').onclick = () => {
        const inputs = Array.from(document.querySelectorAll('#locnames input'));
        const empty = inputs.filter((i) => !i.value.trim());
        inputs.forEach((i) => i.classList.toggle('bad', !i.value.trim()));
        if (empty.length) { empty[0].focus(); toast('lobby.needName'); return; }
        const names = inputs.map((i) => i.value.trim());
        try { localStorage.setItem('mesa-locnames', JSON.stringify(names)); } catch (e) {}
        startLocal(names, $('#locpriv').checked);
      };
    }
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

  // Al abrir la página: si había una partida en curso, volver a ella automáticamente
  (function autoResume() {
    const sess = lsGet(SESS);
    if (!sess || params.get('sala') || Date.now() - (sess.t || 0) > 12 * 3600 * 1000) { if (sess) lsDel(SESS); return; }
    if (!window.GAMES.some((g) => g.id === sess.game && g.ready)) return lsDel(SESS);
    state.game = sess.game;
    if (sess.role === 'host') return void resumeHost(sess);
    net.retries = 0; net.recon = true;
    startGuest(sess.code, sess.name, true);
  })();

  if (params.get('debug')) window.__mesa = { net, state, render, broadcast };
  render();
})();
