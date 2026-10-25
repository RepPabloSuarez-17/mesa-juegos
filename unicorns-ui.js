// Interfaz del juego de unicornios. Recibe la vista filtrada del jugador y envía órdenes a la sala.
(function (root) {
  const C = root.UnicornCards.C;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const UT = {
    es: {
      baby: 'Bebé', basic: 'Unicornio', magical: 'Unicornio mágico', magic: 'Magia', upgrade: 'Mejora', downgrade: 'Maldición', instant: 'Instantánea',
      you: 'Tú', turnOf: 'Turno de {p}', yourTurn: 'Tu turno: juega una carta o roba', actions: 'Acción {a} de {b}', waiting: 'Esperando a {p}…',
      play: 'Jugar', draw: 'Robar en vez de jugar', pass: 'Terminar turno', hand: 'Tu mano', stable: 'Tu establo', deck: 'Mazo', discard: 'Descarte', nursery: 'Guardería',
      pickTarget: 'Elige a quién le pones la maldición:', neighAsk: '{p} juega «{c}». ¿Relinchas?', noNeigh: 'No relinchar', neighBtn: 'Relinchar con',
      pickStable: 'Elige una carta de un establo (brillan)', pickDiscard: 'Elige una carta del descarte', pickDeck: 'Elige una carta del mazo', peek: 'Quédate con una; el resto va al fondo del mazo',
      skip: 'No hacer nada', discardN: 'Descarta {n} carta(s) de tu mano', giveN: 'Dale una carta a {p}', limitN: 'Tienes demasiadas cartas: descarta {n}', confirm: 'Confirmar', pickPlayer: 'Elige un jugador',
      cardsIn: '{n} cartas', rules: 'Reglas', leave: 'Salir', close: 'Cerrar', viewDiscard: 'Ver descarte', empty: 'Vacío', winTitle: '¡{p} gana!', winU: 'Ha reunido sus unicornios.', winD: 'Se acabó el mazo: gana quien tiene más unicornios.', tie: '(empate, gana el primero en orden)',
      veil: 'Pasa el dispositivo a', veilGo: 'Toca para ver tus cartas', offline: 'desconectado', neighWin: 'Cadena de relinchos', playing: 'Jugada',
      log: 'Historial', nothing: 'Sin objetivo válido',
      rulesText: '<p><b>Objetivo:</b> ser el primero en tener <b>7 unicornios</b> en tu establo (<b>6</b> si sois 6 o más jugadores).</p><p><b>Tu turno:</b> 1) efectos de inicio de turno · 2) robas 1 carta · 3) <b>una acción</b>: jugar una carta de tu mano <i>o</i> robar otra · 4) si tienes más de 7 cartas, descartas.</p><p><b>Tipos:</b> Unicornios (al establo; los mágicos tienen poder), Magia (se resuelve y se descarta), Mejoras (a tu establo), Maldiciones (al establo de otro jugador), Instantáneas (solo como respuesta).</p><p><b>Relincho 🐴:</b> cuando alguien juega una carta, quien tenga un Relincho puede jugarlo y la carta se descarta sin efecto. Un Relincho puede ser relinchado (la jugada entonces se salva). El Super Relincho no se puede relinchar.</p><p><b>Bebés 🐣:</b> todos empiezan con uno; cuentan como unicornios y, si salen del establo, vuelven a la guardería.</p><p><b>Mazo agotado:</b> gana quien tenga más unicornios.</p><p class="hint">El mazo es original (cartas y nombres propios), con las mismas reglas básicas que el juego comercial.</p>',
      L: { turn: '— Turno de {p}', draw: '{p} roba', noDraw: '{p} se salta el robo', drawn: '{p} roba {x}', discardAll: '{p} descarta toda la mano ({x})', discarded: '{p} descarta {x}', gave: '{p} da una carta a {x}', stole: '{p} roba una carta a {x}', nothing: 'Sin objetivo para «{c}»', took: '{p} coge «{c}»', steal: '{p} roba «{c}» de {x}', bounce: '«{c}» vuelve a la mano de {p}', revive: '{p} resucita «{c}»', swap: '{p} y {x} intercambian «{c}»', swapHands: '{p} intercambia mano con {x}', extra: '{p} gana una acción extra', peeked: '{p} mira el mazo', play: '{p} juega «{c}»', enter: '«{c}» entra al establo de {p}', cast: '{p} lanza «{c}»', neigh: '{p} ¡relincha! («{c}»)', super: '{p} ¡SUPER RELINCHA!', stopped: '¡«{c}» de {p} queda anulada!', destroy: '«{c}» de {p} es destruida', protected: '«{c}» de {p} está protegida', phoenix: '«{c}» renace en la mano de {p}', win: '🏆 {p} gana', deckout: 'Mazo agotado', drawAct: '{p} roba en vez de jugar' },
    },
    en: {
      baby: 'Baby', basic: 'Unicorn', magical: 'Magical unicorn', magic: 'Magic', upgrade: 'Upgrade', downgrade: 'Downgrade', instant: 'Instant',
      you: 'You', turnOf: '{p}\'s turn', yourTurn: 'Your turn: play a card or draw', actions: 'Action {a} of {b}', waiting: 'Waiting for {p}…',
      play: 'Play', draw: 'Draw instead', pass: 'End turn', hand: 'Your hand', stable: 'Your stable', deck: 'Deck', discard: 'Discard', nursery: 'Nursery',
      pickTarget: 'Choose who gets the downgrade:', neighAsk: '{p} plays "{c}". Neigh?', noNeigh: 'Let it pass', neighBtn: 'Neigh with',
      pickStable: 'Pick a card in a stable (highlighted)', pickDiscard: 'Pick a card from the discard pile', pickDeck: 'Pick a card from the deck', peek: 'Keep one; the rest go to the bottom of the deck',
      skip: 'Do nothing', discardN: 'Discard {n} card(s) from your hand', giveN: 'Give a card to {p}', limitN: 'Too many cards: discard {n}', confirm: 'Confirm', pickPlayer: 'Choose a player',
      cardsIn: '{n} cards', rules: 'Rules', leave: 'Leave', close: 'Close', viewDiscard: 'View discard', empty: 'Empty', winTitle: '{p} wins!', winU: 'Collected enough unicorns.', winD: 'Deck ran out: most unicorns wins.', tie: '(tie, first in order wins)',
      veil: 'Pass the device to', veilGo: 'Tap to see your cards', offline: 'offline', neighWin: 'Neigh chain', playing: 'Play',
      log: 'History', nothing: 'No valid target',
      rulesText: '<p><b>Goal:</b> be the first to have <b>7 unicorns</b> in your stable (<b>6</b> with 6+ players).</p><p><b>Your turn:</b> 1) start-of-turn effects · 2) draw 1 card · 3) <b>one action</b>: play a card from your hand <i>or</i> draw another · 4) discard down to 7 cards.</p><p><b>Types:</b> Unicorns (to your stable; magical ones have powers), Magic (resolves then is discarded), Upgrades (to your stable), Downgrades (to another player\'s stable), Instants (only as a reaction).</p><p><b>Neigh 🐴:</b> when someone plays a card, anyone holding a Neigh may play it and the card is discarded with no effect. A Neigh can be Neighed (the play is saved). Super Neigh cannot be Neighed.</p><p><b>Babies 🐣:</b> everyone starts with one; they count as unicorns and return to the nursery when they leave a stable.</p><p><b>Deck runs out:</b> most unicorns wins.</p><p class="hint">The deck is original (own cards and names), with the same basic rules as the commercial game.</p>',
      L: { turn: '— {p}\'s turn', draw: '{p} draws', noDraw: '{p} skips the draw', drawn: '{p} draws {x}', discardAll: '{p} discards the whole hand ({x})', discarded: '{p} discards {x}', gave: '{p} gives a card to {x}', stole: '{p} takes a card from {x}', nothing: 'No target for "{c}"', took: '{p} takes "{c}"', steal: '{p} steals "{c}" from {x}', bounce: '"{c}" returns to {p}\'s hand', revive: '{p} revives "{c}"', swap: '{p} and {x} swap "{c}"', swapHands: '{p} swaps hands with {x}', extra: '{p} gets an extra action', peeked: '{p} looks at the deck', play: '{p} plays "{c}"', enter: '"{c}" enters {p}\'s stable', cast: '{p} casts "{c}"', neigh: '{p} Neighs! ("{c}")', super: '{p} SUPER NEIGHS!', stopped: '{p}\'s "{c}" is stopped!', destroy: '{p}\'s "{c}" is destroyed', protected: '{p}\'s "{c}" is protected', phoenix: '"{c}" is reborn in {p}\'s hand', win: '🏆 {p} wins', deckout: 'Deck ran out', drawAct: '{p} draws instead of playing' },
    },
  };
  const lang = () => (root.I18N && I18N.lang === 'en' ? 'en' : 'es');
  const tt = (k, p) => { let s = UT[lang()][k] || k; Object.keys(p || {}).forEach((x) => { s = s.split('{' + x + '}').join(p[x]); }); return s; };
  const BIG = { play: 1, cast: 1, neigh: 1, super: 1, stopped: 1, destroy: 1, steal: 1, win: 1, deckout: 1, phoenix: 1, swapHands: 1 };

  const S = { sel: null, multi: [], seen: null, ack: null, rules: false, zoom: null, disc: false, seq: -1, ann: null, annT: null, lastActor: null };

  function update(main, room, api) {
    const g = room.g, L = lang(), meI = g.me, myId = g.ids[meI];
    const pinfo = (id) => room.players.find((p) => p.id === id) || { name: '?', color: '#888' };
    const pname = (idx) => (idx >= 0 && g.ids[idx] != null ? pinfo(g.ids[idx]).name : '?');
    const cname = (k) => (k && C[k] ? C[k].name[L] : '');
    const pd = g.pending, mine = !!pd && pd.pid === myId && !g.winner;
    if (S.seq !== g.seq) { S.sel = null; S.multi = []; }
    const keyOf = (id) => g.cards[id];

    // ----- anuncios grandes (como en Catán)
    if (S.seen != null && g.seq !== S.seen) {
      const fresh = g.log.slice(-Math.min(g.seq - S.seen, g.log.length)).filter((e) => BIG[e[0]]);
      const e = fresh[fresh.length - 1];
      if (e) { S.ann = fmt(e); clearTimeout(S.annT); S.annT = setTimeout(() => { S.ann = null; const a = main.querySelector('.uann'); if (a) a.remove(); }, 2600); }
    }
    S.seen = g.seq; S.seq = g.seq;
    function fmt(e) { return (UT[L].L[e[0]] || e[0]).replace('{p}', pname(e[1])).replace('{c}', cname(e[2])).replace('{x}', ['drawn', 'discardAll', 'discarded'].includes(e[0]) ? e[3] : pname(e[3])); }

    // ----- tarjetas
    const card = (id, cls, extra) => {
      const k = keyOf(id), d = C[k]; if (!d) return `<div class="uc back ${cls || ''}"></div>`;
      return `<div class="uc t-${d.type} ${cls || ''}" data-id="${id}" ${extra || ''}><div class="uc-e">${d.emoji}</div><div class="uc-n">${esc(d.name[L])}</div><div class="uc-t">${esc(d.text[L])}</div><div class="uc-k">${tt(d.type)}</div></div>`;
    };
    const opts = pd && pd.opts ? pd.opts : [];
    const stablePick = mine && pd.kind === 'pick' && pd.zone === 'stable';
    const stableHtml = (j, big) => {
      const p = g.pl[j];
      return p.stable.length ? p.stable.map((id) => card(id, (big ? '' : 'sm ') + (stablePick && opts.includes(id) ? 'glow' : (stablePick ? 'dim' : '')), `data-a="${stablePick && opts.includes(id) ? 'pick' : 'zoom'}"`)).join('') : `<i class="hint">${tt('empty')}</i>`;
    };

    // ----- paneles de jugadores
    const wantTarget = mine && pd.kind === 'action' && S.sel != null && C[keyOf(S.sel)] && C[keyOf(S.sel)].type === 'downgrade';
    const panel = (j) => {
      const p = g.pl[j], inf = pinfo(p.id), isMe = j === meI;
      const cls = 'up' + (p.id === g.turn ? ' turn' : '') + (isMe ? ' me' : '') + (pd && pd.pid === p.id ? ' ask' : '');
      return `<section class="${cls}" style="--c:${inf.color}">
        <header><span class="dot" style="background:${inf.color}"></span><b>${esc(inf.name)}${isMe ? ' · ' + tt('you') : ''}</b>${inf.online === false ? `<em>⚠️ ${tt('offline')}</em>` : ''}<span class="sp"></span><small>🃏 ${p.handN}</small><span class="pw">🦄 ${p.power}/${p.target}</span></header>
        ${wantTarget && !isMe ? `<button class="btn alt" data-a="playto" data-p="${p.id}">${tt('pickTarget').replace(':', '')} → ${esc(inf.name)}</button>` : ''}
        <div class="stable ${isMe ? 'mine' : ''}">${stableHtml(j, isMe)}</div></section>`;
    };
    const others = g.ids.map((_, j) => j).filter((j) => j !== meI);
    const opp = others.map(panel).join('');

    // ----- centro
    const top = g.discard.length ? card(g.discard[g.discard.length - 1], 'sm', 'data-a="disc"') : `<div class="uc empty sm">${tt('empty')}</div>`;
    let react = '';
    if (g.react) {
      const r = g.react;
      react = `<div class="react"><div class="rc"><small>${tt('playing')} · ${esc(pinfo(r.orig.p).name)}</small>${card(r.orig.card, 'sm', 'data-a="zoom"')}</div>${r.chain.map((c) => `<div class="rc neigh"><small>${esc(pinfo(c.p).name)}</small>${card(c.card, 'sm', 'data-a="zoom"')}</div>`).join('')}<div class="rwait">${esc(pinfo(r.asking).name)}…</div></div>`;
    }
    const center = `<div class="center"><div class="pile"><div class="uc back sm"><span>${g.deck}</span></div><small>${tt('deck')}</small></div><div class="pile">${top}<small>${tt('discard')} (${g.discard.length})</small></div><div class="pile"><div class="uc back baby sm"><span>${g.nursery.length}</span></div><small>${tt('nursery')}</small></div>${react}</div>`;

    // ----- aviso y botones según lo pendiente
    let banner = '', btns = '';
    const turnName = pinfo(g.turn).name;
    if (g.winner) banner = '';
    else if (!pd) banner = tt('turnOf', { p: turnName });
    else if (!mine) banner = tt('waiting', { p: pinfo(pd.pid).name });
    else {
      switch (pd.kind) {
        case 'action': {
          banner = tt('yourTurn') + ' · ' + tt('actions', { a: Math.min(g.acts + 1, g.allowed), b: g.allowed });
          const sel = S.sel != null && g.playable[S.sel];
          const isDown = sel && C[keyOf(S.sel)].type === 'downgrade';
          btns = (sel && !isDown ? `<button class="btn alt" data-a="play">${tt('play')}</button>` : '') + (isDown ? `<span class="hint">${tt('pickTarget')}</span>` : '') + `<button class="btn" data-a="draw">${tt('draw')}</button>` + (g.acts >= 1 ? `<button class="btn" data-a="pass">${tt('pass')}</button>` : '');
          break;
        }
        case 'neigh': {
          const r = g.react, inst = g.pl[meI].hand.filter((id) => g.playable[id]);
          banner = tt('neighAsk', { p: pname(g.ids.indexOf(r.orig.p)), c: cname(keyOf(r.orig.card)) });
          btns = inst.map((id) => `<button class="btn alt" data-a="neigh" data-id="${id}">🐴 ${tt('neighBtn')} ${esc(cname(keyOf(id)))}</button>`).join('') + `<button class="btn" data-a="npass">${tt('noNeigh')}</button>`;
          break;
        }
        case 'limit': case 'discard': case 'give': {
          const n = pd.n || 1;
          banner = pd.kind === 'limit' ? tt('limitN', { n }) : pd.kind === 'give' ? tt('giveN', { p: g.turn === myId ? '' : pinfo(g.turn).name }) : tt('discardN', { n });
          btns = `<button class="btn alt" data-a="confirm" ${S.multi.length === n ? '' : 'disabled'}>${tt('confirm')} (${S.multi.length}/${n})</button>`;
          break;
        }
        case 'pick': banner = pd.zone === 'stable' ? tt('pickStable') : pd.zone === 'discard' ? tt('pickDiscard') : tt('pickDeck'); btns = pd.optional ? `<button class="btn" data-a="skip">${tt('skip')}</button>` : ''; break;
        case 'player': banner = tt('pickPlayer'); btns = pd.opts.map((id) => `<button class="btn alt" data-a="player" data-p="${id}"><span class="dot" style="background:${pinfo(id).color}"></span> ${esc(pinfo(id).name)}</button>`).join(''); break;
        case 'peek': banner = tt('peek'); break;
      }
    }

    // ----- mano
    const multiKind = mine && ['limit', 'discard', 'give'].includes(pd.kind);
    const hand = g.pl[meI].hand.map((id) => {
      let cls = '', act = 'zoom';
      if (mine && pd.kind === 'action') { cls = g.playable[id] ? (S.sel === id ? 'sel' : 'ok') : 'dim'; act = g.playable[id] ? 'sel' : 'zoom'; }
      else if (mine && pd.kind === 'neigh') { cls = g.playable[id] ? 'ok' : 'dim'; }
      else if (multiKind) { cls = S.multi.includes(id) ? 'sel' : 'ok'; act = 'tog'; }
      return card(id, cls, `data-a="${act}"`);
    }).join('');

    // ----- modales
    let modal = '';
    const grid = (ids, act, skip) => `<div class="mgrid">${ids.map((id) => card(id, 'ok', `data-a="${act}"`)).join('')}</div>${skip ? `<div class="row"><button class="btn" data-a="skip">${tt('skip')}</button></div>` : ''}`;
    if (mine && pd.kind === 'pick' && pd.zone !== 'stable') modal = `<div class="umodal"><div class="mbox"><h3>${esc(banner)}</h3>${grid(opts, 'pick', pd.optional)}</div></div>`;
    else if (mine && pd.kind === 'peek') modal = `<div class="umodal"><div class="mbox"><h3>${esc(banner)}</h3>${grid(opts, 'pick', false)}</div></div>`;
    else if (S.disc) modal = `<div class="umodal"><div class="mbox"><h3>${tt('discard')} (${g.discard.length})</h3>${g.discard.length ? `<div class="mgrid">${g.discard.slice().reverse().map((id) => card(id, 'sm', 'data-a="zoom"')).join('')}</div>` : `<p>${tt('empty')}</p>`}<div class="row"><button class="btn" data-a="closed">${tt('close')}</button></div></div></div>`;
    else if (S.zoom) modal = `<div class="umodal" data-a="closez"><div class="mbox zoom">${card(S.zoom, 'big')}<div class="row"><button class="btn" data-a="closez">${tt('close')}</button></div></div></div>`;
    if (S.rules) modal = `<div class="umodal"><div class="mbox rules"><h3>📖 ${tt('rules')}</h3>${tt('rulesText')}<div class="row"><button class="btn" data-a="closer">${tt('close')}</button></div></div></div>`;
    if (g.winner) {
      const w = pinfo(g.winner);
      modal = `<div class="umodal"><div class="mbox win"><h2>🏆 ${tt('winTitle', { p: esc(w.name) })}</h2><p>${g.endBy === 'deck' ? tt('winD') : tt('winU')}${g.tie ? ' ' + tt('tie') : ''}</p><div class="row"><button class="btn alt" data-a="leave">${tt('leave')}</button></div></div></div>`;
    }

    // ----- cortina de privacidad (partida local)
    let veil = '';
    if (api.local && api.privacy && !g.winner && S.ackWho !== myId) veil = `<div class="uveil"><div><p>${tt('veil')}</p><h1 style="color:${pinfo(myId).color}">${esc(pinfo(myId).name)}</h1><button class="btn alt" data-a="ack">${tt('veilGo')}</button></div></div>`;

    const logHtml = g.log.slice().reverse().map((e) => `<li class="l-${e[0]}">${esc(fmt(e))}</li>`).join('');
    main.innerHTML = `<div id="uu" class="${veil ? 'veiled' : ''}">
      <div class="utop"><b>🦄 Unstable Unicorns</b><span class="room">${esc(room.code)}</span><span class="sp"></span><span class="turnpill" style="--c:${pinfo(g.turn).color}">${esc(tt('turnOf', { p: turnName }))}</span><button class="btn" data-a="rules">📖 ${tt('rules')}</button><button class="btn" data-a="leave">${tt('leave')}</button></div>
      <div class="ugrid"><div class="ucol">
        <div class="opps">${opp}</div>
        ${center}
        ${banner ? `<div class="ubanner ${mine ? 'mine' : ''}"><span>${esc(banner)}</span><div class="bb">${btns}</div></div>` : ''}
        ${panel(meI)}
        <div class="handbox"><h4>${tt('hand')} · ${g.pl[meI].handN}/${g.pl[meI].limit}</h4><div class="hand">${hand}</div></div>
      </div><aside class="ulog"><h4>${tt('log')}</h4><ul>${logHtml}</ul></aside></div>
      ${S.ann ? `<div class="uann">${esc(S.ann)}</div>` : ''}${modal}${veil}</div>`;

    // ----- eventos
    const send = api.send;
    main.onclick = (ev) => {
      const el = ev.target.closest('[data-a]'); if (!el || !main.contains(el)) return;
      const a = el.dataset.a, id = el.dataset.id != null ? +el.dataset.id : null;
      const act = (m) => { S.sel = null; S.multi = []; send(m); };
      switch (a) {
        case 'sel': S.sel = S.sel === id ? null : id; api.rerender(); break;
        case 'tog': { const i = S.multi.indexOf(id); if (i >= 0) S.multi.splice(i, 1); else if (S.multi.length < (pd.n || 1)) S.multi.push(id); api.rerender(); break; }
        case 'play': act({ t: 'play', card: S.sel }); break;
        case 'playto': act({ t: 'play', card: S.sel, to: el.dataset.p }); break;
        case 'draw': act({ t: 'draw' }); break;
        case 'pass': act({ t: 'pass' }); break;
        case 'neigh': act({ t: 'neigh', card: id }); break;
        case 'npass': act({ t: 'pass' }); break;
        case 'confirm': act({ t: 'pick', ids: S.multi.slice() }); break;
        case 'pick': act({ t: 'pick', ids: [id] }); break;
        case 'skip': act({ t: 'skip' }); break;
        case 'player': act({ t: 'player', pid: el.dataset.p }); break;
        case 'zoom': S.zoom = id; api.rerender(); break;
        case 'closez': S.zoom = null; api.rerender(); break;
        case 'disc': S.disc = true; api.rerender(); break;
        case 'closed': S.disc = false; api.rerender(); break;
        case 'rules': S.rules = true; api.rerender(); break;
        case 'closer': S.rules = false; api.rerender(); break;
        case 'ack': S.ackWho = myId; api.rerender(); break;
        case 'leave': S.seen = null; S.ackWho = null; api.leave(); break;
      }
    };
  }

  root.UnicornUI = { update };
})(typeof window !== 'undefined' ? window : globalThis);
