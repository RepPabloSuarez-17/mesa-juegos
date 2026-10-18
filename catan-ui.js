// Interfaz de Catán: tablero SVG con relieve, panel de colonos, mano de cartas, dados, mesa de comercio, reglas y ajustes.
(function (root) {
  const T = (k, p) => root.I18N.t(k, p);
  const Board = root.CatanBoard;
  const RES = Board.RES;
    const COL = { wood: '#3b7a45', brick: '#c0583a', wool: '#9ccf63', grain: '#e8c04b', ore: '#8d95a2', desert: '#e2cf99' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (n, s) => `<svg class="ic" width="${s || 22}" height="${s || 22}"><use href="#i-${n}"/></svg>`;
  const $ = (s, el) => (el || document).querySelector(s);

  const SYMBOLS = `<svg style="position:absolute;width:0;height:0" aria-hidden="true"><defs>
<symbol id="i-wood" viewBox="0 0 48 48"><g><rect x="5" y="27" width="38" height="11" rx="5.5" fill="#8a5a2b" stroke="#4d3016" stroke-width="1.5"/><circle cx="37" cy="32.5" r="5.5" fill="#d9ab6b" stroke="#4d3016" stroke-width="1.2"/><circle cx="37" cy="32.5" r="2" fill="#a06c35"/><rect x="5" y="14" width="38" height="11" rx="5.5" fill="#9e6c37" stroke="#4d3016" stroke-width="1.5"/><circle cx="37" cy="19.5" r="5.5" fill="#e0b373" stroke="#4d3016" stroke-width="1.2"/><circle cx="37" cy="19.5" r="2" fill="#a06c35"/><rect x="11" y="38" width="32" height="7" rx="3.5" fill="#7b4f25" stroke="#4d3016" stroke-width="1.2"/></g></symbol>
<symbol id="i-brick" viewBox="0 0 48 48"><g fill="#cb5a3c" stroke="#6f2a16" stroke-width="1.6"><rect x="3" y="7" width="20" height="11" rx="1.5"/><rect x="25" y="7" width="20" height="11" rx="1.5"/><rect x="3" y="20" width="12" height="11" rx="1.5"/><rect x="17" y="20" width="20" height="11" rx="1.5"/><rect x="39" y="20" width="6" height="11" rx="1.5"/><rect x="3" y="33" width="20" height="11" rx="1.5"/><rect x="25" y="33" width="20" height="11" rx="1.5"/></g></symbol>
<symbol id="i-wool" viewBox="0 0 48 48"><g><g fill="#f6f2e6" stroke="#b5af98" stroke-width="1.4"><circle cx="15" cy="25" r="8"/><circle cx="24" cy="19" r="9"/><circle cx="32" cy="26" r="8"/><circle cx="22" cy="29" r="9"/></g><ellipse cx="39" cy="28" rx="5" ry="6.5" fill="#3b3a38"/><rect x="15" y="36" width="3.2" height="8" rx="1" fill="#3b3a38"/><rect x="28" y="36" width="3.2" height="8" rx="1" fill="#3b3a38"/></g></symbol>
<symbol id="i-grain" viewBox="0 0 48 48"><g stroke="#7d5c12" stroke-width="1.2"><path d="M24 45 V12" stroke-width="2.6" fill="none"/><g fill="#eab93a"><ellipse cx="18" cy="14" rx="3.4" ry="6.5" transform="rotate(-24 18 14)"/><ellipse cx="30" cy="14" rx="3.4" ry="6.5" transform="rotate(24 30 14)"/><ellipse cx="24" cy="8" rx="3.4" ry="6.5"/><ellipse cx="17" cy="25" rx="3.4" ry="6.5" transform="rotate(-24 17 25)"/><ellipse cx="31" cy="25" rx="3.4" ry="6.5" transform="rotate(24 31 25)"/><ellipse cx="18" cy="36" rx="3.4" ry="6.5" transform="rotate(-24 18 36)"/><ellipse cx="30" cy="36" rx="3.4" ry="6.5" transform="rotate(24 30 36)"/></g></g></symbol>
<symbol id="i-ore" viewBox="0 0 48 48"><g stroke="#3b4350" stroke-width="1.6" stroke-linejoin="round"><polygon points="4,38 13,17 24,8 37,16 44,38" fill="#8d95a3"/><polygon points="24,8 37,16 44,38 28,38" fill="#6c7584"/><polygon points="13,17 24,8 21,26" fill="#b9bfca"/><polygon points="4,38 13,17 21,26 16,38" fill="#a0a7b3"/></g></symbol>
<symbol id="i-knight" viewBox="0 0 48 48"><g stroke="#2c1d10" stroke-width="2" stroke-linejoin="round"><path d="M24 4 L41 10 V24 C41 34 33 41 24 45 C15 41 7 34 7 24 V10 Z" fill="#6f4d2c"/><path d="M24 11 V38 M14 20 H34" stroke="#ead9a6" stroke-width="3.4" fill="none"/></g></symbol>
<symbol id="i-vp" viewBox="0 0 48 48"><path d="M7 37 L9 14 L19 25 L24 9 L29 25 L39 14 L41 37 Z" fill="#e8bb3c" stroke="#85600f" stroke-width="2.2" stroke-linejoin="round"/><circle cx="24" cy="30" r="3" fill="#c0392b"/></symbol>
<symbol id="i-roads" viewBox="0 0 48 48"><g stroke="#2c1d10" stroke-width="2"><path d="M6 44 L19 4 H29 L42 44 Z" fill="#59534b"/><path d="M24 8 V15 M24 21 V28 M24 34 V42" stroke="#f0e2b0" stroke-width="3" fill="none"/></g></symbol>
<symbol id="i-plenty" viewBox="0 0 48 48"><g stroke="#3a2412" stroke-width="1.8" stroke-linejoin="round"><path d="M6 22 H42 L37 44 H11 Z" fill="#a8722f"/><circle cx="16" cy="14" r="7" fill="#d94b3a"/><circle cx="31" cy="12" r="7" fill="#eab93a"/><circle cx="24" cy="18" r="6" fill="#7fba4f"/></g></symbol>
<symbol id="i-monopoly" viewBox="0 0 48 48"><g stroke="#85600f" stroke-width="2.2"><circle cx="24" cy="24" r="18" fill="#e8bb3c"/><circle cx="24" cy="24" r="12.5" fill="none"/></g><path d="M18 20 Q24 13 30 20 Q18 25 30 30 Q24 36 18 29" stroke="#85600f" stroke-width="2.6" fill="none"/></symbol>
<symbol id="i-road" viewBox="0 0 48 48"><g stroke="#241709" stroke-width="2"><path d="M7 33 L33 7 L41 15 L15 41 Z" fill="#b47a3c"/><path d="M13 31 L31 13" stroke="#f0d9a0" stroke-width="2" fill="none"/></g></symbol>
<symbol id="i-settle" viewBox="0 0 48 48"><g stroke="#241709" stroke-width="2.2" stroke-linejoin="round"><path d="M8 42 V22 L24 7 L40 22 V42 Z" fill="#d9b277"/><path d="M5 24 L24 5 L43 24" fill="none"/><rect x="19" y="28" width="10" height="14" fill="#6d4421"/></g></symbol>
<symbol id="i-city" viewBox="0 0 48 48"><g stroke="#241709" stroke-width="2.2" stroke-linejoin="round"><path d="M4 44 V25 H17 V13 L26 5 L35 13 V25 H44 V44 Z" fill="#cfc7b6"/><rect x="21" y="32" width="8" height="12" fill="#6d4421"/><rect x="9" y="31" width="5" height="6" fill="#6d4421"/><rect x="36" y="31" width="5" height="6" fill="#6d4421"/></g></symbol>
<symbol id="i-dev" viewBox="0 0 48 48"><g stroke="#2c1d10" stroke-width="2"><rect x="9" y="4" width="30" height="40" rx="4" fill="#7a4a2a"/><rect x="14" y="9" width="20" height="30" rx="2" fill="none" stroke="#e8c98a"/></g><path d="M24 14 L27 22 L35 22 L29 27 L31 35 L24 30 L17 35 L19 27 L13 22 L21 22 Z" fill="#e8c98a" transform="translate(0 -1) scale(1)"/></symbol>
<symbol id="i-card" viewBox="0 0 48 48"><g stroke="#2c1d10" stroke-width="2"><rect x="6" y="9" width="28" height="36" rx="4" fill="#cdb88f" transform="rotate(-8 20 27)"/><rect x="14" y="5" width="28" height="36" rx="4" fill="#efe0bb"/></g></symbol>
</defs></svg>`;

  const ui = { code: null, mode: null, modal: null, tab: 'bank', bankGive: null, bankGet: null, draft: { give: {}, want: {} },
    dc: null, plenty: [], lastRoll: 0, lastSeq: -1, sound: true, api: null, room: null, g: null, b3: null, rule: 0, modalKey: '' };
  try { ui.sound = localStorage.getItem('mesa-sound') !== '0'; } catch (e) {}

  // ---------- sonido ----------
  let actx = null;
  function beep(freq, dur, type, vol, delay) {
    if (!ui.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + (delay || 0);
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(vol || 0.05, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + dur);
    } catch (e) {}
  }
  const sfx = {
    dice: () => { for (let i = 0; i < 5; i++) beep(180 + Math.random() * 160, 0.06, 'square', 0.03, i * 0.07); },
    build: () => { beep(160, 0.12, 'triangle', 0.08); beep(240, 0.1, 'triangle', 0.05, 0.08); },
    ping: () => { beep(660, 0.12, 'sine', 0.05); beep(880, 0.14, 'sine', 0.04, 0.1); },
    robber: () => { beep(110, 0.35, 'sawtooth', 0.05); beep(82, 0.4, 'sawtooth', 0.05, 0.15); },
  };

  // ---------- tablero 3D (lo dibuja catan-3d.js) ----------
  function renderBoard(g, room) {
    const L = g.legal || {}, act = g.turn === g.me || ui.api.local;
    let spots = null;
    if (act) {
      if (g.phase === 'setup') { const k = g.setup.stage === 'settlement' ? 'settlement' : 'road'; spots = { kind: k, ids: L[k] || [] }; }
      else if (g.phase === 'roadbuilding') spots = { kind: 'road', ids: L.road || [] };
      else if ((g.phase === 'main' || g.phase === 'special') && ui.mode) spots = { kind: ui.mode, ids: L[ui.mode] || [] };
      else if (g.phase === 'robber') spots = { kind: 'robber', ids: L.robber || [] };
    }
    const collect = g.auto || g.phase === 'setup' ? [] : (g.pendTiles || []);
    if (spots) spots.ids = spots.ids.slice().sort((a, b) => a - b);
    ui.spots = spots;
    ui.b3.draw({ g, colors: room.players.map((p) => p.color), spots, collect, labels: voice.cands ? voice.cands.ids : false });
    voiceHook();
  }

  // ---------- paneles ----------
  const myTurn = () => ui.g.turn === ui.g.me || ui.api.local;
  const nameOf = (i) => (ui.room.players[i] ? ui.room.players[i].name : '?');

  function resList(o) { return RES.filter((r) => o[r] > 0).map((r) => `${o[r]} ${T('res.' + r)}`).join(', '); }
  function logText(e) {
    const P = (i) => nameOf(i);
    const p = { p: P(e.p), v: e.v !== undefined ? P(e.v) : '', sum: (e.d1 || 0) + (e.d2 || 0), d1: e.d1, d2: e.d2, n: e.n,
      what: e.what ? T('w.' + e.what) : '', res: e.res && typeof e.res === 'object' ? resList(e.res) : (e.res ? T('res.' + e.res) : ''),
      give: e.give ? T('res.' + e.give) : '', get: e.get ? T('res.' + e.get) : '', a: e.a ? T('res.' + e.a) : '', b: e.b ? T('res.' + e.b) : '' };
    return T('l.' + e.k, p);
  }

  function renderPlayers(g, room) {
    $('#cg-players').innerHTML = `<h4>${T('settlers')}</h4>` + room.players.map((pl, i) => {
      const pp = g.players[i], you = i === g.me, vp = you || g.phase === 'over' ? pp.total : pp.pub, turn = g.turn === i && g.phase !== 'over';
      const bd = (g.longest.o === i ? `<span class="badge" title="${T('badge.road')}">${ic('road', 14)}${T('badge.road')}</span>` : '') + (g.army.o === i ? `<span class="badge" title="${T('badge.army')}">${ic('knight', 14)}${T('badge.army')}</span>` : '');
      return `<div class="pcard ${turn ? 'turn' : ''} ${pl.online === false ? 'off' : ''}" style="--pc:${pl.color}"><div class="av">${esc(pl.name.charAt(0).toUpperCase())}</div>
<div class="pinfo"><div class="pname">${esc(pl.name)}${pl.online === false ? ` <em class="offl">⚠ ${T('pl.offline')}</em>` : ''}${you && !ui.api.local ? ` <em>(${T('you')})</em>` : ''}</div>
<div class="pstats"><span title="${T('cards')}">${ic('card', 16)}${pp.res ? Object.values(pp.res).reduce((a, b) => a + b, 0) : pp.resN}</span><span title="${T('devc')}">${ic('dev', 16)}${pp.devN}</span><span title="${T('knights')}">${ic('knight', 16)}${pp.knights}</span><span title="${T('roadlen')}">${ic('road', 16)}${pp.len}</span></div>${bd ? `<div class="badges">${bd}</div>` : ''}</div>
<div class="pvp"><b>${vp}</b><small>${T('vp')}</small></div></div>`;
    }).join('') + `<div class="bankbox"><h4>${T('bank')}</h4><div class="bk">${RES.map((r) => `<span title="${T('res.' + r)}">${ic(r, 18)}<b>${g.bank[r]}</b></span>`).join('')}<span title="${T('deck')}">${ic('dev', 18)}<b>${g.deckN}</b></span></div>${g.ext ? `<p class="extnote">${T('ext.on')}</p>` : ''}</div>`;
  }

  // Privacidad en pantalla compartida: las cartas están tapadas hasta que el jugador del turno las destapa
  function renderPrivacy(g) {
    const bt = $('#cg-bottom'), eye = $('#cg-eye');
    const on = !!(ui.api.local && ui.api.privacy);
    if (ui.eyeFor !== g.me) { ui.eyeFor = g.me; ui.reveal = false; }
    const veil = on && !ui.reveal;
    bt.classList.toggle('veiled', veil);
    eye.style.display = on ? '' : 'none';
    eye.textContent = veil ? '👁 ' + T('ui.reveal') + ' — ' + nameOf(g.me) : '🙈 ' + T('ui.hide');
  }

  function renderHand(g) {
    const me = g.players[g.me], res = me.res || {}, my = myTurn(), main = my && g.phase === 'main', build = my && (g.phase === 'main' || g.phase === 'special');
    $('#cg-hand').innerHTML = RES.map((r) => `<div class="rcard ${res[r] ? '' : 'zero'}" style="--rc:${COL[r]}" title="${T('res.' + r)}">${ic(r, 34)}<span class="rname">${T('res.' + r)}</span><b class="rcount">${res[r] || 0}</b></div>`).join('');
    const cnt = {};
    (me.dev || []).forEach((c) => { (cnt[c] = cnt[c] || { n: 0, new: 0 }).n++; });
    (me.newDev || []).forEach((c) => { (cnt[c] = cnt[c] || { n: 0, new: 0 }).new++; });
    const can = my && (g.phase === 'main' || g.phase === 'roll') && !g.devPlayed;
    $('#cg-dev').innerHTML = `<div class="hlabel">${T('devc')}</div><div class="drow">` + (Object.keys(cnt).map((c) => {
      const playable = can && cnt[c].n > 0;
      return `<div class="dcard ${playable ? 'playable' : ''}" data-a="dev" data-k="${c}" title="${T('dev.' + c)}: ${T('dev.' + c + '.d')}${cnt[c].new && !cnt[c].n ? ' · ' + T('dev.new') : ''}">${ic(c, 22)}<span class="dname">${T('dev.' + c)}</span><b>${cnt[c].n + cnt[c].new}</b>${cnt[c].new ? '<i class="newtag">★</i>' : ''}</div>`;
    }).join('') || `<span class="empty">—</span>`) + (me.vp ? `<div class="dcard" title="${T('dev.vp')}: ${T('dev.vp.d')}">${ic('vp', 22)}<span class="dname">${T('dev.vp')}</span><b>${me.vp}</b></div>` : '') + '</div>';

    const L = g.legal || {}, u = me.used, COST = root.CatanEngine.COST, LIM = root.CatanEngine.LIMIT;
    const aff = (c) => Object.keys(c).every((k) => (res[k] || 0) >= c[k]);
    const costHtml = (c) => Object.keys(c).map((k) => `<span>${c[k] > 1 ? c[k] : ''}${ic(k, 13)}</span>`).join('');
    const bt = (k, icon, ok, extra) => `<button class="bbtn ${ui.mode === k ? 'on' : ''}" data-a="${k === 'dev' ? 'buyDev' : 'mode'}" data-k="${k}" ${ok ? '' : 'disabled'}>${ic(icon, 28)}<span class="bn">${T('b.' + k)}</span><span class="cost">${costHtml(COST[k])}</span>${extra || ''}</button>`;
    $('#cg-build').innerHTML =
      bt('road', 'road', build && aff(COST.road) && u.road < LIM.road && (L.road || []).length) +
      bt('settlement', 'settle', build && aff(COST.settlement) && u.settlement < LIM.settlement && (L.settlement || []).length) +
      bt('city', 'city', build && aff(COST.city) && u.city < LIM.city && (L.city || []).length) +
      bt('dev', 'dev', build && aff(COST.dev) && g.deckN > 0, `<small class="deckn">${g.deckN}</small>`);

    $('#cg-tradebar').innerHTML = `<span class="tl">${T('a.trade')}</span><button data-a="trade" data-k="bank" ${main ? '' : 'disabled'}>🏦 ${T('tr.bank')}</button><button data-a="trade" data-k="players" ${main ? '' : 'disabled'}>🤝 ${T('tr.players')}</button><span class="sep"></span><button class="ib" data-a="undo" title="${T('a.undo')}" ${g.canUndo ? '' : 'disabled'}>↩</button><button class="ib" data-a="pause" title="${T('a.pause')}" ${ui.api.local || ui.api.isHost ? '' : 'disabled'}>II</button>`;
  }

  // Pistas sutiles según el momento de la partida. No se menciona nunca recoger recursos: eso lo debe notar el jugador.
  function guideInfo(g) {
    const my = myTurn(), cur = nameOf(g.turn), me = g.players[g.me], have = me.res || {};
    const COST = root.CatanEngine.COST, LIM = root.CatanEngine.LIMIT, u = me.used;
    const aff = (c) => Object.keys(c).every((k) => (have[k] || 0) >= c[k]);
    const offl = ui.room && ui.room.players[g.turn] && ui.room.players[g.turn].online === false;
    const wait = (extra) => ({ kick: cur, title: T('g.wait', { name: cur }), text: offl ? T('g.offline') : (extra || T('g.wait.d')) });
    const L = g.legal || {};
    switch (g.phase) {
      case 'setup': {
        const round = g.setup.step < g.players.length ? 1 : 2, n = g.players.length;
        const steps = { items: [T('st.settle'), T('st.road')], on: g.setup.stage === 'settlement' ? 0 : 1 };
        if (!my) return { kick: T('ev.setup', { r: round }), title: T('g.wait', { name: cur }), text: T('g.setupW'), steps };
        return g.setup.stage === 'settlement'
          ? { kick: T('ev.setup', { r: round }), title: T('g.setupSettle'), text: T('g.setupSettle.d'), steps }
          : { kick: T('ev.setup', { r: round }), title: T('g.setupRoad'), text: T('g.setupRoad.d'), steps };
      }
      case 'roll': {
        const steps = { items: [T('st.roll'), T('st.build'), T('st.end')], on: 0 };
        if (!my) return Object.assign(wait(), { steps });
        const kn = (me.dev || []).indexOf('knight') >= 0 && !g.devPlayed;
        return { kick: cur, title: T('g.roll'), text: kn ? T('g.roll.kn') : T('g.roll.d'), steps };
      }
      case 'main': {
        const steps = { items: [T('st.roll'), T('st.build'), T('st.end')], on: 1 };
        if (!my) return Object.assign(wait(T('g.wait.main')), { steps });
        if (ui.mode === 'road') return { kick: cur, title: T('g.mode.road'), text: T('g.mode.road.d'), steps };
        if (ui.mode === 'settlement') return { kick: cur, title: T('g.mode.settlement'), text: T('g.mode.settlement.d'), steps };
        if (ui.mode === 'city') return { kick: cur, title: T('g.mode.city'), text: T('g.mode.city.d'), steps };
        const can = [];
        if (aff(COST.road) && u.road < LIM.road && (L.road || []).length) can.push(T('w.road'));
        if (aff(COST.settlement) && u.settlement < LIM.settlement && (L.settlement || []).length) can.push(T('w.settlement'));
        if (aff(COST.city) && u.city < LIM.city && (L.city || []).length) can.push(T('w.city'));
        if (aff(COST.dev) && g.deckN > 0) can.push(T('w.dev'));
        return { kick: cur, title: T('g.main'), text: can.length ? T('g.main.can', { list: can.join(', ') }) : T('g.main.none'), steps };
      }
      case 'special': {
        const steps = null;
        if (!my) return { kick: T('g.special.k'), title: T('g.wait', { name: cur }), text: T('g.special.w') };
        return { kick: T('g.special.k'), title: T('g.special'), text: T('g.special.d'), steps };
      }
      case 'discard': return { kick: T('g.discard'), title: g.discard[g.me] ? T('g.discard.me', { n: g.discard[g.me] }) : T('g.discard'), text: g.discard[g.me] ? T('g.discard.d') : T('g.discard.w') };
      case 'robber': return my ? { kick: cur, title: T('g.robber'), text: T('g.robber.d') } : { kick: cur, title: T('g.robberW', { name: cur }), text: '' };
      case 'steal': return my ? { kick: cur, title: T('g.steal'), text: '', steal: true } : { kick: cur, title: T('g.stealW', { name: cur }), text: '' };
      case 'roadbuilding': return my ? { kick: cur, title: T('g.roads'), text: T('g.roads.d', { n: g.freeRoads }) } : wait('');
      default: return { kick: '', title: T('g.over'), text: '' };
    }
  }

  function renderGuide(g, room) {
    const i = guideInfo(g), my = myTurn(), phase = g.phase;
    let extra = '';
    if (i.steal) extra = `<div class="stealrow">${(g.victims || []).map((v) => `<button class="pbtn" style="--pc:${room.players[v].color}" data-a="steal" data-id="${v}">${esc(room.players[v].name)}</button>`).join('')}</div>`;
    if (phase === 'discard') {
      const pend = Object.keys(g.discard).map((k) => `${esc(nameOf(+k))} (${g.discard[k]})`).join(', ');
      extra = `<p class="pend">${pend}</p>`;
    }
    let acts = '';
    if (my && phase === 'roll') acts = `<button class="big primary" data-a="roll">🎲 ${T('a.roll')}</button>`;
    else if (my && (phase === 'main' || phase === 'special')) acts = `<button class="big primary" data-a="end">${phase === 'special' ? T('a.endSp') : T('a.end')} ➜</button>`;
    const steps = i.steps ? `<div class="steps">${i.steps.items.map((t, k) => `<span class="${k === i.steps.on ? 'on' : k < i.steps.on ? 'done' : ''}"><i>${k < i.steps.on ? '✔' : k + 1}</i>${esc(t)}</span>`).join('')}</div>` : '';
    const html = `<div class="gk">${esc(i.kick)}</div><h3>${esc(i.title)}</h3>${i.text ? `<p>${esc(i.text)}</p>` : ''}${steps}${extra}${acts ? `<div class="gacts">${acts}</div>` : ''}`;
    if (ui.guideKey === html) return;
    ui.guideKey = html;
    const el = $('#cg-guide');
    el.innerHTML = html; el.classList.toggle('mine', my);
  }

  function offerRow(o) {
    const side = (x) => RES.filter((r) => x[r] > 0).map((r) => `<span class="chip">${x[r]}${ic(r, 20)}</span>`).join('');
    return `<div class="offrow">${side(o.give)}<span class="arrow">⇄</span>${side(o.want)}</div>`;
  }
  function renderOffer(g, room) {
    const o = g.offer, el = $('#cg-offer');
    if (!o || g.phase !== 'main') { el.innerHTML = ''; el.classList.remove('on'); return; }
    el.classList.add('on');
    const me = g.me, from = o.from;
    let h = `<div class="gk">${T('tr.offered', { name: esc(nameOf(from)) })}</div>${offerRow(o)}`;
    const others = room.players.map((_, i) => i).filter((i) => i !== from);
    if (ui.api.local) {
      h += others.map((i) => `<div class="resp"><span class="rn" style="--pc:${room.players[i].color}">${esc(nameOf(i))}</span>
<button class="mini ${o.resp[i] === 1 ? 'sel' : ''}" data-a="respond" data-as="${i}" data-v="1">${T('a.accept')}</button>
<button class="mini ${o.resp[i] === 0 ? 'sel' : ''}" data-a="respond" data-as="${i}" data-v="0">${T('a.decline')}</button>
${o.resp[i] === 1 ? `<button class="mini go" data-a="confirm" data-id="${i}">${T('tr.with', { name: esc(nameOf(i)) })}</button>` : ''}</div>`).join('');
      h += `<button class="mini" data-a="cancelOffer">${T('a.cancel')}</button>`;
    } else if (me === from) {
      h += others.map((i) => `<div class="resp"><span class="rn" style="--pc:${room.players[i].color}">${esc(nameOf(i))}</span>${o.resp[i] === 1 ? `<span class="ok">✔ ${T('tr.accepted')}</span><button class="mini go" data-a="confirm" data-id="${i}">${T('a.confirm')}</button>` : o.resp[i] === 0 ? `<span class="no">✖ ${T('tr.declined')}</span>` : `<span class="wt">… ${T('tr.nores')}</span>`}</div>`).join('');
      h += `<button class="mini" data-a="cancelOffer">${T('a.cancel')}</button>`;
    } else {
      const have = g.players[me].res || {}, can = RES.every((r) => (have[r] || 0) >= o.want[r]);
      h += `<div class="resp"><button class="mini go" data-a="respond" data-v="1" ${can ? '' : 'disabled'}>${T('a.accept')}</button><button class="mini" data-a="respond" data-v="0">${T('a.decline')}</button></div>`;
      if (!can) h += `<p class="pend">${T('tr.cantafford')}</p>`;
      if (o.resp[me] === 1) h += `<p class="ok">✔ ${T('tr.accepted')}</p>`;
    }
    el.innerHTML = h;
  }

  function renderLog(g) {
    $('#cg-log').innerHTML = g.log.slice(-30).reverse().map((e) => `<div class="le k-${e.k}">${esc(logText(e))}</div>`).join('');
  }

  // ---------- dados ----------
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const dieHtml = (n, cls) => `<div class="die ${cls}">${Array.from({ length: 9 }, (_, i) => `<i class="${n && PIPS[n].indexOf(i) >= 0 ? 'on' : ''}"></i>`).join('')}</div>`;
  function renderDice(g) {
    const el = $('#cg-dice'), d = g.dice, fresh = g.rollId > ui.lastRoll && d;
    const clickable = myTurn() && g.phase === 'roll';
    el.className = 'dice-tray' + (clickable ? ' can' : '');
    el.dataset.a = clickable ? 'roll' : '';
    el.innerHTML = dieHtml(d ? d[0] : 0, fresh ? 'tumble a' : '') + dieHtml(d ? d[1] : 0, fresh ? 'tumble b' : '') + (d ? `<span class="dsum">${d[0] + d[1]}</span>` : '');
    if (fresh && ui.lastRoll >= 0 && ui.started) sfx.dice();
    ui.lastRoll = g.rollId;
  }

  // ---------- avisos grandes en el centro del tablero ----------
  const ICON = { roll: '🎲', build: '🏗️', setupSettle: '🏠', setupRoad: '🛣️', buyDev: '🃏', trade: '🤝', bank: '🏦', offer: '💬', robber: '🦹', steal: '🫳', knight: '⚔️', longest: '🛣️', army: '🛡️', win: '🏆', discard: '✋', playMonopoly: '💰', playPlenty: '🎁', playRoads: '🛣️', special: '🔔', short: '⚠️' };
  const ANN = { roll: 1, build: 1, setupSettle: 1, setupRoad: 1, buyDev: 1, trade: 1, bank: 1, offer: 1, robber: 1, steal: 1, knight: 1, longest: 1, army: 1, win: 1, discard: 1, playMonopoly: 1, playPlenty: 1, playRoads: 1, short: 1, special: 1 };
  function announce(o) { // { icon, title, sub, cls, ms }
    const q = ui.annQ = ui.annQ || [];
    q.push(o);
    while (q.length > 4) { const k = q.findIndex((x) => !x.keep); q.splice(k < 0 ? 0 : k, 1); }
    if (!ui.annBusy) nextAnn();
  }
  function nextAnn() {
    const box = $('#cg-big');
    const o = (ui.annQ || []).shift();
    if (!o || !box) { ui.annBusy = false; return; }
    ui.annBusy = true;
    const d = document.createElement('div');
    d.className = 'bigmsg ' + (o.cls || '');
    d.innerHTML = `${o.icon ? `<i>${o.icon}</i>` : ''}<div><b>${esc(o.title)}</b>${o.sub ? `<span>${esc(o.sub)}</span>` : ''}</div>`;
    box.innerHTML = ''; box.appendChild(d);
    const ms = o.ms || 2300;
    setTimeout(() => { d.classList.add('out'); setTimeout(() => { if (d.parentNode) d.remove(); nextAnn(); }, 350); }, ms);
  }
  function pushToast(txt, cls) { // aviso pequeño (errores y avisos puntuales)
    const box = $('#cg-toasts'), d = document.createElement('div');
    d.className = 'ev ' + (cls || '');
    d.innerHTML = txt;
    box.appendChild(d);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, 3200);
  }
  function processEvents(g) {
    const fresh = g.log.filter((e) => e.s > ui.lastSeq);
    if (ui.lastSeq >= 0 && ui.started) {
      fresh.forEach((e) => {
        if (!ANN[e.k]) return;
        const txt = logText(e);
        if (e.k === 'roll') {
          const sum = e.d1 + e.d2;
          if (sum === 7) { announce({ icon: '🦹', title: T('an.robber'), sub: txt, cls: 'dark', ms: 2600 }); sfx.robber(); }
          else announce({ icon: '🎲', title: String(sum), sub: txt, cls: 'dice', ms: 1900 });
          return;
        }
        const setup = e.k === 'setupSettle' || e.k === 'setupRoad';
        announce({ icon: ICON[e.k], title: txt, cls: e.k === 'win' ? 'gold' : (setup ? 'small' : ''), ms: setup ? 1500 : (e.k === 'win' ? 6000 : 2300), keep: e.k === 'win' });
        if (e.k === 'longest' || e.k === 'army' || e.k === 'win') sfx.ping();
      });
      if (fresh.some((e) => e.k === 'build' || e.k === 'setupSettle' || e.k === 'setupRoad')) sfx.build();
      // qué le toca hacer a quien tiene que actuar
      const my = myTurn(), key = g.phase + ':' + g.turn + ':' + (g.setup ? g.setup.stage + g.setup.step : '') + ':' + (g.discard && g.discard[g.me] ? 'd' : '');
      if (key !== ui.turnKey && g.phase !== 'over') {
        const i = guideInfo(g), cur = nameOf(g.turn);
        if (g.phase === 'roll') announce(my ? { icon: '⭐', title: T('an.yourTurn'), sub: T('an.roll'), cls: 'turn', ms: 2200 } : { icon: '⏳', title: T('an.turnOf', { name: cur }), cls: 'small', ms: 1500 });
        else if (g.phase === 'discard' && g.discard[g.me]) announce({ icon: '✋', title: i.title, sub: i.text, cls: 'turn', ms: 2600 });
        else if (my && (g.phase === 'robber' || g.phase === 'steal' || g.phase === 'roadbuilding' || g.phase === 'special' || g.phase === 'setup')) announce({ icon: ICON[g.phase === 'setup' ? (g.setup.stage === 'settlement' ? 'setupSettle' : 'setupRoad') : g.phase] || '👉', title: i.title, sub: g.phase === 'setup' ? '' : i.text, cls: 'turn', ms: g.phase === 'setup' ? 1800 : 2600 });
      }
      ui.turnKey = key;
    } else ui.turnKey = g.phase + ':' + g.turn + ':' + (g.setup ? g.setup.stage + g.setup.step : '') + ':' + (g.discard && g.discard[g.me] ? 'd' : '');
    ui.lastSeq = g.seq;
    ui.started = true;
  }

  // ---------- ventanas ----------
  function modal(inner, opts) {
    opts = opts || {};
    return `<div class="modal-back ${opts.force ? 'force' : ''}" data-a="${opts.force ? '' : 'mclose-bg'}"><div class="modal parch ${opts.cls || ''}">${opts.force ? '' : `<button class="x" data-a="mclose" aria-label="${T('a.close')}">×</button>`}${inner}</div></div>`;
  }
  const resBtn = (r, a, k, sel, extra) => `<button class="rpick ${sel ? 'sel' : ''}" style="--rc:${COL[r]}" data-a="${a}" data-r="${r}" ${extra || ''}>${ic(r, 30)}<span>${T('res.' + r)}</span>${k !== undefined ? `<small>${k}</small>` : ''}</button>`;

  function tradeModal(g) {
    const have = g.players[g.me].res || {}, my = myTurn() && g.phase === 'main';
    let body;
    if (ui.tab === 'bank') {
      const ok = my && ui.bankGive && ui.bankGet && ui.bankGive !== ui.bankGet && (have[ui.bankGive] || 0) >= g.ratios[ui.bankGive];
      body = `<p class="sub">${T('tr.bank.d')}</p><div class="trow"><h5>${T('tr.give')}</h5><div class="picks">${RES.map((r) => resBtn(r, 'bgive', T('ratio', { n: g.ratios[r] }), ui.bankGive === r, (have[r] || 0) < g.ratios[r] ? 'data-dim="1"' : '')).join('')}</div></div>
<div class="trow"><h5>${T('tr.get')}</h5><div class="picks">${RES.map((r) => resBtn(r, 'bget', undefined, ui.bankGet === r)).join('')}</div></div>
<div class="ports">${g.board.harbors.filter((h) => [h.a, h.b].some((v) => g.buildings[v] && g.buildings[v].o === g.me)).map((h) => `<span class="chip">${h.type === 'any' ? T('port.any') : T('port.res', { res: T('res.' + h.type) })}</span>`).join('')}</div>
<button class="big primary" data-a="bank" ${ok ? '' : 'disabled'}>${T('tr.exchange')}</button>`;
    } else {
      const d = ui.draft, row = (side, title, max) => `<div class="trow"><h5>${title}</h5><div class="picks">${RES.map((r) => `<div class="cnt" style="--rc:${COL[r]}">${ic(r, 28)}<div class="ctl"><button data-a="dm" data-side="${side}" data-r="${r}">−</button><b>${d[side][r] || 0}</b><button data-a="dp" data-side="${side}" data-r="${r}" data-max="${max === 'have' ? (have[r] || 0) : 9}">+</button></div></div>`).join('')}</div></div>`;
      const give = RES.some((r) => d.give[r] > 0), want = RES.some((r) => d.want[r] > 0);
      body = (my ? '' : `<p class="sub">${T('tr.only')}</p>`) + row('give', T('tr.offer'), 'have') + row('want', T('tr.request'), 9) + `<button class="big primary" data-a="propose" ${my && give && want ? '' : 'disabled'}>${T('tr.propose')}</button>`;
    }
    return modal(`<h2>${ui.tab === 'bank' ? '🏦 ' + T('tr.bank') : '🤝 ' + T('tr.players')}</h2>${body}`, { cls: 'trade' });
  }
  function rulesModal() {
    const R = root.I18N.rules(), i = Math.min(ui.rule, R.length - 1);
    const html = R[i].html.replace(/\{ic:(\w+)\}/g, (m, n) => ic(n, 18));
    return modal(`<h2>${T('rules.title')}</h2><div class="rbook"><nav>${R.map((x, k) => `<button class="${k === i ? 'on' : ''}" data-a="rule" data-k="${k}"><span>${k + 1}</span>${esc(x.t)}</button>`).join('')}</nav><article><h3>${esc(R[i].t)}</h3>${html}<div class="rnav">${i > 0 ? `<button class="mini" data-a="rule" data-k="${i - 1}">← ${esc(R[i - 1].t)}</button>` : '<span></span>'}${i < R.length - 1 ? `<button class="mini go" data-a="rule" data-k="${i + 1}">${esc(R[i + 1].t)} →</button>` : ''}</div></article></div>`, { cls: 'rules' });
  }
  function settingsModal() {
    const g = ui.g, can = ui.api.isHost && !ui.api.local;
    return modal(`<h2>${T('set.title')}</h2><div class="setrow"><span>${T('set.lang')}</span><div class="seg"><button class="${root.I18N.lang === 'es' ? 'on' : ''}" data-a="lang" data-k="es">Español</button><button class="${root.I18N.lang === 'en' ? 'on' : ''}" data-a="lang" data-k="en">English</button></div></div>
<div class="setrow"><span>${T('set.sound')}</span><div class="seg"><button class="${ui.sound ? 'on' : ''}" data-a="sound" data-k="1">${T('set.on')}</button><button class="${ui.sound ? '' : 'on'}" data-a="sound" data-k="0">${T('set.off')}</button></div></div>
${ui.api.local ? '' : `<div class="setrow"><span>${T('set.auto')}<small>${T(can ? 'set.auto.d' : 'set.auto.h')}</small></span><div class="seg"><button class="${g.auto ? 'on' : ''}" data-a="auto" data-k="1" ${can ? '' : 'disabled'}>${T('set.on')}</button><button class="${g.auto ? '' : 'on'}" data-a="auto" data-k="0" ${can ? '' : 'disabled'}>${T('set.off')}</button></div></div>`}
<div class="setrow"><span>${T('set.cam')}<small>${T('set.cam.d')}</small></span><div class="seg"><button data-a="camreset">${T('cam.reset')}</button><button data-a="camflat">${T('cam.flat')}</button></div></div>
<div class="setrow"><span>${T('v.title')}<small>${T('v.soon.d')}</small></span><div class="seg"><button disabled>${T('v.soon')}</button></div></div>
<div class="setrow"><span></span><button class="big" data-a="leave">${T('a.leave')}</button></div>`, { cls: 'settings' });
  }
  function discardModal(g) {
    const need = g.discard[g.me], have = g.players[g.me].res, d = ui.dc || {};
    const tot = RES.reduce((a, r) => a + (d[r] || 0), 0);
    return modal(`<h2>${T('dc.title')}</h2><p class="sub">${T('dc.text', { n: need })} ${T('dc.sel')}: <b>${tot}/${need}</b></p><div class="picks">${RES.map((r) => `<div class="cnt" style="--rc:${COL[r]}">${ic(r, 28)}<small>${have[r]}</small><div class="ctl"><button data-a="dcm" data-r="${r}">−</button><b>${d[r] || 0}</b><button data-a="dcp" data-r="${r}" data-max="${have[r]}">+</button></div></div>`).join('')}</div><button class="big primary" data-a="discard" ${tot === need ? '' : 'disabled'}>${T('a.confirm')}</button>`, { force: true, cls: 'discard' });
  }
  function pickModal(kind) {
    if (kind === 'plenty') return modal(`<h2>${T('pl.title')}</h2><p class="sub">${T('pl.text')} (${ui.plenty.length}/2)</p><div class="picks">${RES.map((r) => resBtn(r, 'pplenty', undefined, false)).join('')}</div>`, { cls: 'pick' });
    return modal(`<h2>${T('mo.title')}</h2><p class="sub">${T('mo.text')}</p><div class="picks">${RES.map((r) => resBtn(r, 'pmono', undefined, false)).join('')}</div>`, { cls: 'pick' });
  }
  function endModal(g, room) {
    if (room.aborted) return modal(`<h2>${T('abort.title')}</h2><p class="sub">${T('abort.text', { name: esc(room.aborted) })}</p><button class="big primary" data-a="leave">${T('a.exit')}</button>`, { force: true, cls: 'end' });
    const w = g.winner, pl = room.players[w];
    return modal(`<div class="crown">${ic('vp', 54)}</div><h2 style="color:${pl.color === '#ece6d6' ? '#6b4a24' : pl.color}">${T('win.title', { name: esc(pl.name) })}</h2><p class="sub">${T('win.text', { vp: g.players[w].total })}</p><button class="big primary" data-a="leave">${T('a.exit')}</button>`, { force: true, cls: 'end' });
  }

  function renderModal(g, room) {
    const el = $('#cg-modal');
    let h = '';
    if (room.aborted || g.phase === 'over') h = endModal(g, room);
    else if (g.paused) h = modal(`<h2>⏸ ${T('v.paused')}</h2><p class="sub">${T('v.pausedmsg')}</p>${ui.api.local || ui.api.isHost ? `<button class="big primary" data-a="resume">▶ ${T('a.resume')}</button>` : ''}`, { force: true });
    else if (g.phase === 'discard' && g.discard[g.me]) { if (!ui.dc) ui.dc = {}; h = discardModal(g); }
    else {
      ui.dc = null;
      if (ui.modal === 'trade') { if (myTurn() && g.phase === 'main' || ui.tab === 'players') h = tradeModal(g); else ui.modal = null; }
      else if (ui.modal === 'rules') h = rulesModal();
      else if (ui.modal === 'settings') h = settingsModal();
      else if (ui.modal === 'vhelp') h = voiceHelp();
      else if (ui.modal === 'plenty' || ui.modal === 'monopoly') h = pickModal(ui.modal);
    }
    const key = ui.modal === 'rules' && h ? 'rules:' + ui.rule + ':' + root.I18N.lang : '';
    if (key && key === ui.modalKey && el.firstChild) return;
    ui.modalKey = key;
    el.innerHTML = h;
  }

  // ---------- control por voz ----------
  const SR = root.SpeechRecognition || root.webkitSpeechRecognition;
  const VOICE_ENABLED = false; // voz desactivada de momento (el código queda listo para reactivarla)
  const isOpera = () => /OPR\/|Opera/.test(navigator.userAgent || '');
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:"“”()]/g, ' ').replace(/\s+/g, ' ').trim();
  const NUM = { cero: 0, uno: 1, una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintiun: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100,
    zero: 0, one: 1, two: 2, to: 2, too: 2, three: 3, four: 4, for: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };
  const RESW = { madera: 'wood', lena: 'wood', arbol: 'wood', wood: 'wood', lumber: 'wood', arcilla: 'brick', ladrillo: 'brick', ladrillos: 'brick', barro: 'brick', brick: 'brick', bricks: 'brick', clay: 'brick', lana: 'wool', oveja: 'wool', ovejas: 'wool', wool: 'wool', sheep: 'wool', trigo: 'grain', cereal: 'grain', cereales: 'grain', grano: 'grain', grain: 'grain', wheat: 'grain', mineral: 'ore', minerales: 'ore', piedra: 'ore', hierro: 'ore', ore: 'ore', stone: 'ore' };
  // lista de {n, i}: números (dígitos o palabras, incluso "treinta y cinco") con su posición
  function numsIn(words) {
    const out = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      let n = /^\d+$/.test(w) ? +w : NUM[w];
      if (n === undefined) continue;
      if (n >= 30 && n % 10 === 0 && n < 100) {
        let j = i + 1; if (words[j] === 'y' || words[j] === 'and') j++;
        const u = /^\d$/.test(words[j]) ? +words[j] : NUM[words[j]];
        if (u !== undefined && u > 0 && u < 10) { n += u; i = j; }
      }
      out.push({ n, i });
    }
    return out;
  }
  const resIn = (words) => words.map((w, i) => (RESW[w] ? { r: RESW[w], i } : null)).filter(Boolean);
  // Recursos extra (terrenos) y tolerancia a plurales / pequeñas faltas de reconocimiento
  Object.assign(RESW, { bosque: 'wood', bosques: 'wood', forest: 'wood', woods: 'wood', tree: 'wood', trees: 'wood', arboles: 'wood', colina: 'brick', colinas: 'brick', hill: 'brick', hills: 'brick', pasto: 'wool', prado: 'wool', pradera: 'wool', pasture: 'wool', campo: 'grain', campos: 'grain', field: 'grain', fields: 'grain', cultivo: 'grain', montana: 'ore', montanas: 'ore', mountain: 'ore', mountains: 'ore', roca: 'ore', rocas: 'ore', desierto: 'desert', desert: 'desert', piedras: 'ore' });
  const RKEYS = Object.keys(RESW).filter((k) => k.length >= 5);
  const lev1 = (a, b) => {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
    const [s, l] = a.length < b.length ? [a, b] : [b, a];
    return s.slice(i) === l.slice(i + 1);
  };
  const resWord = (w) => {
    if (RESW[w]) return RESW[w];
    if (w.length > 3 && w[w.length - 1] === 's' && RESW[w.slice(0, -1)]) return RESW[w.slice(0, -1)];
    if (w.length >= 5) { const k = RKEYS.find((x) => lev1(w, x)); if (k) return RESW[k]; }
    return null;
  };
  const resIn2 = (words) => words.map((w, i) => { const r = resWord(w); return r ? { r, i } : null; }).filter(Boolean);
  const EMO = { wood: '🌲', brick: '🧱', wool: '🐑', grain: '🌾', ore: '⛰️', desert: '🏜️' };
  const NOTNUM = { to: 1, too: 1, for: 1, a: 1, un: 1, una: 1, uno: 1 };

  // «el 4 de trigo, el 8 de piedra y el 10 de oveja» -> [{res:'grain',num:4},{res:'ore',num:8},{res:'wool',num:10}]
  function hexMentions(words) {
    const ns = numsIn(words).filter((q) => q.n >= 2 && q.n <= 12 && !NOTNUM[words[q.i]]);
    const rs = resIn2(words);
    const usedR = new Set(), usedN = new Set(), out = [];
    const pairUp = (dir) => {
      const got = [];
      rs.forEach((r) => {
        if (usedR.has(r.i)) return;
        for (let j = r.i + dir, c = 0; j >= 0 && j < words.length && c < 5; j += dir, c++) {
          if (rs.some((x) => x.i === j)) break;
          const q = ns.find((x) => x.i === j);
          if (q) { if (!usedN.has(q.i)) got.push({ r, q }); break; }
        }
      });
      return got;
    };
    const A = pairUp(-1), B = pairUp(1);
    // orientación dominante: «4 de trigo» (número antes) o «trigo 4» (número después)
    (A.length >= B.length ? A : B).forEach((p) => { if (!usedR.has(p.r.i) && !usedN.has(p.q.i)) { usedR.add(p.r.i); usedN.add(p.q.i); out.push({ res: p.r.r, num: p.q.n, i: Math.min(p.r.i, p.q.i) }); } });
    (A.length >= B.length ? B : A).forEach((p) => { if (!usedR.has(p.r.i) && !usedN.has(p.q.i)) { usedR.add(p.r.i); usedN.add(p.q.i); out.push({ res: p.r.r, num: p.q.n, i: Math.min(p.r.i, p.q.i) }); } });
    rs.forEach((r) => { if (!usedR.has(r.i)) out.push({ res: r.r, i: r.i }); });
    ns.forEach((q) => { if (!usedN.has(q.i) && !out.some((m) => m.num === q.n)) out.push({ num: q.n, i: q.i }); });
    return out.sort((a, b) => a.i - b.i);
  }

  // Máximo de condiciones que se pueden asignar a hexágonos distintos de la lista
  function matchCount(conds, tileIdxs, T0) {
    let best = 0;
    const rec = (ci, used, m) => {
      if (m + (conds.length - ci) <= best) return;
      if (ci === conds.length) { best = Math.max(best, m); return; }
      const c = conds[ci];
      tileIdxs.forEach((ti, k) => {
        if (used & (1 << k)) return;
        const t = T0[ti];
        if ((!c.res || t.res === c.res) && (!c.num || t.num === c.num)) rec(ci + 1, used | (1 << k), m + 1);
      });
      rec(ci + 1, used, m);
    };
    rec(0, 0, 0);
    return best;
  }
  function graphOf(g) {
    const key = g.board.tiles.map((t) => t.q + ',' + t.r).join(';');
    if (ui.gkey !== key) { ui.gkey = key; ui.graph = root.CatanBoard.buildGraph(g.board.tiles); }
    return ui.graph;
  }
  // Busca entre los puntos legales los que encajan con la descripción
  function candidatesFor(kind, conds, g) {
    const L = g.legal || {}, T0 = g.board.tiles, G = graphOf(g);
    const ids = kind === 'robber' ? (L.robber || []) : (L[kind] || []);
    const need = kind === 'robber' ? 1 : conds.length;
    const cs = kind === 'robber' ? conds.slice(0, 1) : conds;
    const sc = ids.map((id) => {
      if (kind === 'robber') return matchCount(cs, [id], T0);
      if (kind === 'road') {
        const e = G.edges[id], ends = Array.from(new Set(G.verts[e.a].tiles.concat(G.verts[e.b].tiles)));
        return matchCount(cs, ends, T0) + (matchCount(cs, e.tiles, T0) === cs.length ? 0.5 : 0);
      }
      return matchCount(cs, G.verts[id].tiles, T0);
    });
    const max = Math.max(0, ...sc);
    if (max <= 0) return { ids: [], full: false };
    let full = ids.filter((id, i) => sc[i] >= need);
    if (full.length) {
      if (kind === 'road') { const b = full.filter((id) => sc[ids.indexOf(id)] % 1); if (b.length) full = b; }
      return { ids: full, full: true };
    }
    return { ids: ids.filter((id, i) => sc[i] === max), full: false };
  }
  const spotText = (kind, id, g) => {
    const G = graphOf(g), T0 = g.board.tiles;
    const ts = kind === 'robber' ? [id] : kind === 'road' ? G.edges[id].tiles : G.verts[id].tiles;
    return ts.map((ti) => (EMO[T0[ti].res] || '') + (T0[ti].num || '')).join(' ');
  };

  const voice = { on: false, rec: null, last: '', msg: '', ok: true, armUntil: 0, wake: false, cands: null, after: null, stealName: null, lastKind: null, lang: 'es', live: '', stage: 0, tmo: 0 };
  try { voice.wake = localStorage.getItem('mesa-wake') === '1'; } catch (e) {}
  try { const sv = localStorage.getItem('mesa-vlang'); voice.lang = sv === 'en' ? 'en' : 'es'; } catch (e) {}

  const fire = (a, data) => onClick({ target: { closest: () => ({ dataset: Object.assign({ a }, data || {}), classList: { contains: () => true } }) } });
  function vsay(ok, msg) { voice.ok = ok; voice.msg = msg; renderVoice(); }
  function speak(text) {
    try { const u = new SpeechSynthesisUtterance(text); u.lang = voice.lang === 'en' ? 'en-US' : 'es-ES'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {}
  }

  function doPlace(kind, id) {
    const g = ui.g;
    voice.cands = null; voice.lastKind = kind;
    if (kind === 'robber') act({ t: 'moveRobber', tile: id });
    else act({ t: 'build', kind, id });
    ui.mode = null;
    vsay(true, '✔ ' + (kind === 'robber' ? '🦹 ' : T('b.' + kind) + ' · ') + spotText(kind, id, g));
    ui.api.rerender();
  }
  // Resuelve una descripción y coloca, o pide que se aclare señalando los puntos con números
  function placeFlow(kind, conds) {
    const g = ui.g;
    if ((kind === 'settlement' || kind === 'city' || kind === 'road') && (g.phase === 'main' || g.phase === 'special') && ui.mode !== kind) { ui.mode = kind; }
    const r = candidatesFor(kind, conds, g);
    if (!r.ids.length) { voice.cands = null; ui.api.rerender(); vsay(false, T('v.nomatch')); return true; }
    if (r.full && r.ids.length === 1) { doPlace(kind, r.ids[0]); return true; }
    if (r.ids.length > 12) { voice.cands = null; vsay(false, T('v.toomany', { n: r.ids.length })); return true; }
    voice.cands = { kind, ids: r.ids, conds, t: Date.now() };
    ui.api.rerender();
    vsay(true, T(r.full ? 'v.which' : 'v.closest'));
    return true;
  }
  // Tareas que esperan a que llegue el nuevo estado (tras deshacer o mover el ladrón)
  function voiceHook() {
    const g = ui.g; if (!g) return;
    if (voice.after) {
      const a = voice.after;
      if (Date.now() - a.t > 5000) voice.after = null;
      else if (g.seq !== a.seq) { voice.after = null; setTimeout(() => { if (ui.g) placeFlow(a.kind, a.conds); }, 40); }
    }
    if (voice.stealName) {
      const s = voice.stealName;
      if (Date.now() - s.t > 6000) voice.stealName = null;
      else if (g.phase === 'steal' && myTurn()) { voice.stealName = null; const v = (g.victims || []).find((i) => nameMatch(nameOf(i), s.text)); if (v !== undefined) setTimeout(() => fire('steal', { id: v }), 40); }
    }
  }
  const nameMatch = (name, t) => { const nm = norm(name); return nm && (' ' + t + ' ').indexOf(' ' + nm + ' ') >= 0; };
  const ORD = { primero: 1, primera: 1, first: 1, segundo: 2, segunda: 2, second: 2, tercero: 3, tercera: 3, third: 3, cuarto: 4, cuarta: 4, fourth: 4, quinto: 5, quinta: 5, fifth: 5, sexto: 6, sexta: 6, sixth: 6, septimo: 7, seventh: 7, octavo: 8, eighth: 8 };

  // Interpreta una frase libre y ejecuta la acción. true = entendida, false = no entendida, null = ignorada.
  function voiceCommand(raw) {
    const g = ui.g; if (!g) return false;
    let t = norm(raw);
    if (voice.wake) {
      const wakeRe = /\b(catan|catanes|catane|kattan|cattan|katan)\b/;
      if (!wakeRe.test(t) && Date.now() > voice.armUntil) return null;
      t = t.replace(/\b(oye|hey|ok|vale)?\s*(catan|catanes|catane|kattan|cattan|katan)\b/, ' ').replace(/\s+/g, ' ').trim();
      if (!t) { voice.armUntil = Date.now() + 7000; vsay(true, T('v.listening')); return true; }
      voice.armUntil = 0;
    }
    if (!t) return null;
    const w = t.split(' '), nums = numsIn(w), ress = resIn2(w), has = (re) => re.test(t);
    const my = myTurn();
    const need = () => { if (!my) { vsay(false, T('v.notyou')); return true; } return false; };
    if (voice.cands && Date.now() - voice.cands.t > 25000) { voice.cands = null; ui.api.rerender(); }

    // ---- pausa / reanudar (siempre disponibles)
    if (g.paused) {
      if (has(/\b(reanuda\w*|continua\w*|resume|continue|unpause|sigue|seguir|play)\b/)) { fire('resume'); vsay(true, T('v.resumed')); return true; }
      vsay(false, T('v.pausedmsg')); return true;
    }
    if (has(/\b(pausa|pausar|pausad[oa]|pause|hold on|espera|para el juego|stop the game)\b/)) { fire('pause'); vsay(true, T('v.paused')); return true; }

    // ---- ayuda, reglas, cancelar
    if (has(/\b(que hago|que toca|what do i do|what now|what next|que sigue|dime que hacer)\b/)) { const i = guideInfo(g); const x = i.title + '. ' + (i.text || ''); speak(x); vsay(true, x); return true; }
    if (has(/\b(que puedo decir|comandos|commands|what can i say|help|ayuda)\b/)) { ui.modal = 'vhelp'; ui.api.rerender(); return true; }
    if (has(/\b(reglas|rules|rulebook)\b/)) { fire('rules'); vsay(true, T('a.rules')); return true; }
    if (has(/\b(cancela|cancelar|cancel|never ?mind|olvidalo|olvida)\b/)) { voice.cands = null; voice.after = null; ui.mode = null; ui.modal = null; ui.api.rerender(); vsay(true, T('a.cancel')); return true; }

    // ---- deshacer / retroceder
    const kindHint = has(/\b(camino|caminos|carretera|calle|road)\b/) ? 'road' : has(/\b(ciudad|city|town)\b/) ? 'city' : has(/\b(poblado|pueblo|casa|asentamiento|settlement|house|village)\b/) ? 'settlement' : null;
    const mentions = hexMentions(w);
    const moveWord = has(/\b(move|relocate|instead|rather|actually|mueve|muevelo|muevela|cambialo|cambiala|mejor|en vez)\b/) || (has(/\b(change|cambia)\b/) && !has(/\b(banco|bank|por|for)\b/));
    const undoWord = has(/\b(undo|go back|take (it|that) back|revert|step back|rewind|retrocede\w*|retroceder|retrocedo|deshaz\w*|deshacer|vuelve atras|volver atras|atras|quita (eso|lo ultimo|la ultima|esa)|borra (eso|lo ultimo))\b/);
    if (undoWord || (moveWord && mentions.length)) {
      voice.cands = null;
      if (!g.canUndo) { vsay(false, T('v.noundo')); return true; }
      if (moveWord && mentions.length) {
        const kind = kindHint || voice.lastKind;
        if (kind) { voice.after = { kind, conds: mentions, seq: g.seq, t: Date.now() }; if (kind !== 'robber') ui.mode = kind; }
      }
      fire('undo'); vsay(true, T('v.undone')); return true;
    }

    // ---- cámara
    if (has(/\b(gira|girar|rota|rotar|rotate|turn)\b/) && has(/\b(izquierda|derecha|left|right)\b/)) { if (ui.b3) { ui.b3.cam.yaw += has(/izquierda|left/) ? -35 : 35; ui.b3.redraw(); } vsay(true, 'OK'); return true; }
    if (has(/\b(zoom|acerca|acercar|aleja|alejar|closer|further)\b/)) { if (ui.b3) { ui.b3.cam.zoom *= has(/aleja|alejar|further|out/) ? 0.85 : 1.2; ui.b3.redraw(); } vsay(true, 'OK'); return true; }
    if (has(/\b(plano|2d|flat)\b/)) { fire('camflat'); vsay(true, 'OK'); return true; }
    if (has(/\b(vista normal|restablecer|reset camara|reset camera)\b/)) { fire('camreset'); vsay(true, 'OK'); return true; }

    // ---- elegir entre varias opciones señaladas con números
    if (voice.cands) {
      const C = voice.cands;
      const yes = has(/\b(yes|yeah|yep|ok|okay|si|vale|correct|correcto|that one|esa|ese|confirm\w*|exacto|eso)\b/);
      const ord = w.map((x) => ORD[x]).find(Boolean);
      const label = has(/\b(number|numero|option|opcion|spot|punto|el|la|the|one)\b/);
      const nn = nums.map((q) => q.n).find((n) => n >= 1 && n <= C.ids.length);
      let pick;
      if (yes && C.ids.length === 1 && !ress.length) pick = 0;
      else if (!ress.length && ord && ord <= C.ids.length) pick = ord - 1;
      else if (!ress.length && nn && (w.length <= 3 || has(/\b(number|numero|option|opcion|spot|punto)\b/))) pick = nn - 1;
      if (pick !== undefined) { if (need()) return true; doPlace(C.kind, C.ids[pick]); return true; }
      if (mentions.length) { if (need()) return true; return placeFlow(C.kind, C.conds.concat(mentions.filter((m) => !C.conds.some((c) => c.res === m.res && c.num === m.num)))); }
    }

    // ---- elegir a quién robar
    if (g.phase === 'steal' && my) {
      const v = (g.victims || []).find((i) => nameMatch(nameOf(i), t));
      if (v !== undefined) { fire('steal', { id: v }); vsay(true, nameOf(v)); return true; }
    }
    // ---- descartar
    if (g.phase === 'discard' && g.discard[g.me] && ress.length) {
      const cards = {}; let tot = 0;
      ress.forEach((rr) => { const pre = nums.filter((q) => q.i < rr.i).pop(); const n = pre && rr.i - pre.i <= 2 ? pre.n : 1; cards[rr.r] = (cards[rr.r] || 0) + n; tot += n; });
      if (!tot) { vsay(false, T('v.what')); return true; }
      act({ t: 'discard', cards }, ui.api.local ? g.me : undefined); vsay(true, resList(cards)); return true;
    }

    // ---- colocar o mover el ladrón describiendo el hexágono
    if (g.phase === 'robber' && my && mentions.length) {
      const nm = (ui.room.players || []).findIndex((p, i) => i !== g.turn && nameMatch(p.name, t));
      if (nm >= 0) voice.stealName = { text: t, t: Date.now() };
      return placeFlow('robber', mentions);
    }
    // ---- colocar piezas describiendo los hexágonos que las rodean
    const placing = g.phase === 'setup' || g.phase === 'roadbuilding' || ((g.phase === 'main' || g.phase === 'special') && (kindHint || ui.mode));
    if (placing && mentions.length && !has(/\b(cambia\w*|intercambia\w*|ofrece\w*|offer|swap|trade|banco|bank|recoge\w*|collect|compra\w*|buy)\b/)) {
      if (need()) return true;
      let kind = kindHint || ui.mode;
      if (g.phase === 'setup') {
        const stage = g.setup.stage === 'settlement' ? 'settlement' : 'road';
        if (kindHint && kindHint !== stage && !(stage === 'settlement' && kindHint === 'city')) { vsay(false, T(stage === 'settlement' ? 'v.firstSettle' : 'v.firstRoad')); return true; }
        kind = stage;
      } else if (g.phase === 'roadbuilding') kind = 'road';
      return placeFlow(kind, mentions);
    }

    // ---- acciones simples
    if (has(/\b(tira\w*|lanza\w*|dados?|roll|throw|toss)\b/) && !has(/\b(carta|cartas|cambiar|banco|bank|trade|ladron|robber)\b/)) { if (need()) return true; if (g.phase !== 'roll') { vsay(false, T('v.notNow')); return true; } fire('roll'); vsay(true, T('a.roll')); return true; }
    if (!kindHint && !mentions.length && has(/\b(termina\w*|acab\w*|fin|pasa\w*|paso|end|finish|done|pass|next player|next turn|siguiente|ya esta|that is all|thats all)\b/)) { if (need()) return true; fire('end'); vsay(true, T('a.end')); return true; }
    if (has(/\b(carta|cartas|desarrollo|card|development)\b/) && has(/\b(compra\w*|compro|saca\w*|buy|draw|get|purchase)\b/)) { if (need()) return true; fire('buyDev'); vsay(true, T('b.dev')); return true; }
    if (has(/\b(caballero|soldado|knight)\b/) && has(/\b(juega\w*|jugar|juego|usa\w*|play|use)\b/)) { if (need()) return true; fire('dev', { k: 'knight' }); vsay(true, T('dev.knight')); return true; }
    if (has(/\b(monopolio|monopoly)\b/) && ress.length) { if (need()) return true; act({ t: 'playDev', card: 'monopoly', res: ress[0].r }); vsay(true, T('dev.monopoly')); return true; }
    if (has(/\b(abundancia|invento|plenty|harvest)\b/) && ress.length) { if (need()) return true; act({ t: 'playDev', card: 'plenty', a: ress[0].r, b: (ress[1] || ress[0]).r }); vsay(true, T('dev.plenty')); return true; }
    if (has(/\b(carreteras|construccion de caminos|road building)\b/)) { if (need()) return true; fire('dev', { k: 'roadbuilding' }); vsay(true, T('dev.roadbuilding')); return true; }

    // ---- comerciar con el banco / ofertas
    const split = t.split(/\b(por|a cambio de|for|into)\b/);
    if (split.length >= 3 && has(/\b(banco|bank|cambia\w*|cambio|intercambia\w*|swap|trade|exchange)\b/) && !has(/\b(jugadores|players|ofrece\w*|offer)\b/)) {
      const A = resIn2(split[0].split(' '))[0], B = resIn2(split.slice(2).join(' ').split(' '))[0];
      if (A && B) { if (need()) return true; act({ t: 'bank', give: A.r, get: B.r }); vsay(true, T('res.' + A.r) + ' → ' + T('res.' + B.r)); return true; }
    }
    if (split.length >= 3 && has(/\b(ofrece\w*|ofrezco|propon\w*|offer|propose|jugadores|players)\b/)) {
      const side = (txt) => { const ww = txt.split(' '), rs = resIn2(ww), ns = numsIn(ww), o = {}; rs.forEach((rr) => { const pre = ns.filter((q) => q.i < rr.i).pop(); o[rr.r] = (o[rr.r] || 0) + (pre && rr.i - pre.i <= 2 ? pre.n : 1); }); return o; };
      const give = side(split[0]), want = side(split.slice(2).join(' '));
      if (Object.keys(give).length && Object.keys(want).length) { if (need()) return true; act({ t: 'offer', give, want }); vsay(true, resList(give) + ' ⇄ ' + resList(want)); return true; }
    }
    if (g.offer && has(/\b(acepto|acepta\w*|accept|yes|si|deal|trato)\b/) && !ui.api.local) { act({ t: 'respond', accept: true }); vsay(true, T('a.accept')); return true; }
    if (g.offer && has(/\b(rechazo|rechaza\w*|decline|reject|no)\b/) && !ui.api.local) { act({ t: 'respond', accept: false }); vsay(true, T('a.decline')); return true; }
    if (has(/\b(comerciar|comercio|trade)\b/)) { fire('trade', { k: has(/jugadores|players/) ? 'players' : 'bank' }); vsay(true, T('a.trade')); return true; }

    // ---- recoger materiales de un hexágono (por su número o su recurso)
    if (has(/\b(recoge\w*|recojo|coger|cojo|cobra\w*|collect|take|grab|get)\b/)) {
      const tiles = (g.pendTiles || []), T0 = g.board.tiles;
      let pick = tiles.find((ti) => mentions.some((m) => (!m.res || T0[ti].res === m.res) && (!m.num || T0[ti].num === m.num)));
      if (pick === undefined && tiles.length === 1) pick = tiles[0];
      if (pick !== undefined) { fire('collect', { id: pick }); vsay(true, (EMO[T0[pick].res] || '') + (T0[pick].num || '')); return true; }
      vsay(false, T('collect.none')); return true;
    }
    // ---- modo de construcción sin lugar: se enseñan los puntos legales
    if (kindHint && !mentions.length) {
      if (need()) return true;
      if (g.phase === 'setup' || g.phase === 'roadbuilding') { vsay(true, T('v.describe')); return true; }
      if (g.phase !== 'main' && g.phase !== 'special') { vsay(false, T('v.notNow')); return true; }
      ui.mode = kindHint; ui.api.rerender(); vsay(true, T('v.describe')); return true;
    }
    return false;
  }

  function startVoice() {
    if (!VOICE_ENABLED) return;
    if (!SR) { vsay(false, T('v.unsupported')); return; }
    if (voice.on) return;
    const rec = new SR();
    rec.lang = voice.lang === 'en' ? 'en-US' : 'es-ES';
    rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 3;
    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (!ev.results[i].isFinal) { voice.live = ev.results[i][0].transcript; renderVoice(); continue; }
        voice.live = '';
        let done = null;
        for (let a = 0; a < ev.results[i].length && !done; a++) {
          const txt = ev.results[i][a].transcript; voice.last = txt;
          try { done = voiceCommand(txt); } catch (e) { done = false; }
        }
        if (done === false) vsay(false, T('v.what')); else if (done === null) { vsay(true, T('v.listening')); } else renderVoice();
      }
    };
    rec.onerror = (e) => {
      const er = e && e.error;
      if (er === 'not-allowed' || er === 'service-not-allowed') { voice.on = false; vsay(false, T('v.denied')); }
      else if (er === 'audio-capture') { voice.on = false; vsay(false, T('v.nomic')); }
      else if (er === 'network') { vsay(false, isOpera() ? T('v.opera') : T('v.network')); }
      else if (er && er !== 'no-speech' && er !== 'aborted') { vsay(false, 'Voice error: ' + er); }
    };
    // Diagnóstico paso a paso: dónde se queda el micrófono
    voice.stage = 0;
    rec.onstart = () => { voice.stage = Math.max(voice.stage, 1); vsay(true, T('v.starting')); };
    rec.onaudiostart = () => { voice.stage = Math.max(voice.stage, 2); clearTimeout(voice.tmo); vsay(true, T('v.open')); };
    rec.onsoundstart = () => { voice.stage = Math.max(voice.stage, 3); vsay(true, T('v.sound')); };
    rec.onspeechstart = () => { voice.stage = Math.max(voice.stage, 4); vsay(true, T('v.speech')); };
    rec.onnomatch = () => { vsay(false, T('v.nomatch2')); };
    rec.onend = () => { if (voice.on) { setTimeout(() => { if (voice.on) { try { rec.start(); } catch (e) {} } }, 250); } else renderVoice(); };
    voice.rec = rec; voice.on = true;
    try { rec.start(); } catch (e) { vsay(false, 'Voice error: ' + (e && e.message)); }
    vsay(true, T('v.starting'));
    clearTimeout(voice.tmo);
    voice.tmo = setTimeout(() => { if (voice.on && voice.stage < 2) vsay(false, isOpera() ? T('v.opera') : T('v.noaudio')); }, 6000);
    try { navigator.permissions && navigator.permissions.query({ name: 'microphone' }).then((p) => { if (p.state === 'denied') { voice.on = false; try { rec.stop(); } catch (e) {} vsay(false, T('v.denied')); } }); } catch (e) {}
    ui.api.rerender();
  }
  function stopVoice() {
    voice.on = false; voice.cands = null;
    try { voice.rec && voice.rec.stop(); } catch (e) {}
    voice.rec = null; voice.msg = ''; voice.last = '';
    renderVoice(); ui.api.rerender();
  }
  function renderVoice() {
    const el = $('#cg-voice'); if (!el) return;
    if (!voice.on) { el.className = ''; el.innerHTML = voice.msg && !voice.ok ? `<span class="vmsg bad">${esc(voice.msg)}</span>` : ''; if (voice.msg && !voice.ok) { el.className = 'on'; } return; }
    el.className = 'on';
    el.innerHTML = `<span class="vmic">🎤</span><span class="vmsg ${voice.ok ? '' : 'bad'}">${esc(voice.msg || T('v.listening'))}</span>${voice.live || voice.last ? `<span class="vheard">${voice.live ? '… ' : ''}«${esc((voice.live || voice.last).trim())}»</span>` : ''}<button data-a="vlang" data-k="${voice.lang === 'es' ? 'en' : 'es'}" title="${T('v.lang')}">${voice.lang.toUpperCase()}</button><button data-a="vhelp" title="${T('v.help')}">?</button>`;
  }
  // La ayuda de voz está siempre en inglés
  const VOICE_HELP = `<p>Just talk. There is no fixed phrase to learn: say what you want in your own words, in Spanish or English.</p>
<ul>
<li><b>Simple things:</b> “roll the dice”, “I'm done, next player”, “pause the game”, “resume”, “collect the 8 of ore”, “buy a card”, “play the knight”.</li>
<li><b>Placing pieces — describe the hexes around the spot:</b> “put a settlement where the 4 of wheat, the 8 of ore and the 10 of wool meet”. You can also say just the numbers (“settlement at 4, 8 and 10”) or just the terrains.</li>
<li><b>Roads:</b> “road between the 6 of wood and the 3 of brick”. <b>Cities:</b> “upgrade the settlement next to the 9 of ore”.</li>
<li><b>Robber:</b> “move the robber to the 8 of ore and steal from Ana”.</li>
<li><b>If it is ambiguous</b> numbers appear on the candidate spots: say the number (“the second one”), or add more detail (“the one touching the 10 of wool”).</li>
<li><b>Changed your mind?</b> “Undo”, “go back”, or “move it to the 5 of wood and the 9 of wheat”.</li>
<li><b>Trading:</b> “swap wood for grain with the bank”, “offer two wool for one ore”.</li>
<li><b>Other:</b> “what should I do?” (reads the hint aloud), “rules”, “rotate left”, “zoom in”.</li>
</ul>
<p class="sub">Voice is sent to your browser's speech service, so it needs Chrome or Edge, internet and microphone permission.</p>`;
  function voiceHelp() {
    return modal(`<h2>🎤 Voice control</h2><div class="vhelp">${VOICE_HELP}</div>`, { cls: 'rules' });
  }

  // ---------- eventos ----------
  const act = (m, as) => ui.api.send(m, as);
  function onClick(e) {
    const el = e.target.closest('[data-a]');
    if (!el) return;
    const a = el.dataset.a, g = ui.g, id = el.dataset.id !== undefined ? +el.dataset.id : undefined, r = el.dataset.r, k = el.dataset.k;
    const rerender = () => ui.api.rerender();
    switch (a) {
      case 'mclose-bg': if (e.target === el) { ui.modal = null; rerender(); } return;
      case 'mclose': ui.modal = null; ui.plenty = []; rerender(); return;
      case 'rules': ui.modal = 'rules'; ui.modalKey = ''; rerender(); return;
      case 'rule': ui.rule = +k; ui.modalKey = ''; rerender(); { const art = $('#cg-modal .rbook article'); if (art) art.scrollTop = 0; } return;
      case 'settings': ui.modal = 'settings'; rerender(); return;
      case 'lang': root.I18N.set(k); return;
      case 'sound': ui.sound = k === '1'; try { localStorage.setItem('mesa-sound', k); } catch (x) {} if (ui.sound) sfx.ping(); rerender(); return;
      case 'leave': ui.api.leave(); return;
      case 'auto': act({ t: 'auto', v: k === '1' }); return;
      case 'camreset': if (ui.b3) { ui.b3.cam.yaw = 28; ui.b3.cam.pitch = 52; ui.b3.cam.zoom = 1; ui.b3.redraw(); } return;
      case 'camflat': if (ui.b3) { ui.b3.cam.yaw = 0; ui.b3.cam.pitch = 0; ui.b3.cam.zoom = 1; ui.b3.redraw(); } return;
      case 'collect':
        if (!(ui.api.local ? (g.pendTiles || []).includes(id) : (g.myPend && g.myPend[id]))) { pushToast('<span>' + esc(T('collect.none')) + '</span>'); return; }
        act({ t: 'collect', tile: id }); return;
      case 'vtoggle': if (voice.on) stopVoice(); else startVoice(); return;
      case 'vwake': voice.wake = k === '1'; try { localStorage.setItem('mesa-wake', k); } catch (x) {} rerender(); return;
      case 'vhelp': ui.modal = 'vhelp'; rerender(); return;
      case 'undo': act({ t: 'undo' }); return;
      case 'pause': act({ t: 'pause', v: true }); return;
      case 'resume': act({ t: 'pause', v: false }); return;
      case 'vlang': voice.lang = k === 'en' ? 'en' : 'es'; try { localStorage.setItem('mesa-vlang', voice.lang); } catch (x) {} if (voice.on) { stopVoice(); startVoice(); } else rerender(); return;
      case 'eye': ui.reveal = !ui.reveal; rerender(); return;
      case 'popmin': ui.popMin = true; ui.guideKey = ''; rerender(); return;
      case 'roll': if (myTurn() && g.phase === 'roll') act({ t: 'roll' }); return;
      case 'end': ui.mode = null; act({ t: 'end' }); return;
      case 'mode': ui.mode = ui.mode === k ? null : k; rerender(); return;
      case 'buyDev': act({ t: 'buyDev' }); return;
      case 'dev':
        if (k === 'plenty' || k === 'monopoly') { if (el.classList.contains('playable')) { ui.modal = k; ui.plenty = []; rerender(); } }
        else if (el.classList.contains('playable')) act({ t: 'playDev', card: k });
        return;
      case 'spot-v': act({ t: 'build', kind: g.phase === 'setup' ? 'settlement' : ui.mode, id }); if (g.phase !== 'setup') ui.mode = null; return;
      case 'spot-e': act({ t: 'build', kind: 'road', id }); if (g.phase === 'main' || g.phase === 'special') ui.mode = null; return;
      case 'spot-t': act({ t: 'moveRobber', tile: id }); return;
      case 'steal': act({ t: 'steal', from: id }); return;
      case 'trade': ui.modal = 'trade'; ui.tab = el.dataset.k === 'players' ? 'players' : 'bank'; rerender(); return;
      case 'tab': ui.tab = k; rerender(); return;
      case 'bgive': ui.bankGive = r; rerender(); return;
      case 'bget': ui.bankGet = r; rerender(); return;
      case 'bank': act({ t: 'bank', give: ui.bankGive, get: ui.bankGet }); return;
      case 'dp': { const s = el.dataset.side; const cur = ui.draft[s][r] || 0; if (cur < +el.dataset.max) { ui.draft[s][r] = cur + 1; ui.draft[s === 'give' ? 'want' : 'give'][r] = 0; } rerender(); return; }
      case 'dm': { const s = el.dataset.side; ui.draft[s][r] = Math.max(0, (ui.draft[s][r] || 0) - 1); rerender(); return; }
      case 'propose': act({ t: 'offer', give: ui.draft.give, want: ui.draft.want }); ui.modal = null; ui.draft = { give: {}, want: {} }; rerender(); return;
      case 'respond': act({ t: 'respond', accept: el.dataset.v === '1' }, el.dataset.as !== undefined ? +el.dataset.as : undefined); return;
      case 'confirm': act({ t: 'confirm', with: id }); return;
      case 'cancelOffer': act({ t: 'cancelOffer' }); return;
      case 'dcp': { const cur = ui.dc[r] || 0, tot = RES.reduce((x, q) => x + (ui.dc[q] || 0), 0); if (cur < +el.dataset.max && tot < g.discard[g.me]) ui.dc[r] = cur + 1; rerender(); return; }
      case 'dcm': ui.dc[r] = Math.max(0, (ui.dc[r] || 0) - 1); rerender(); return;
      case 'discard': act({ t: 'discard', cards: ui.dc }, ui.api.local ? g.me : undefined); ui.dc = null; return;
      case 'pplenty': ui.plenty.push(r); if (ui.plenty.length === 2) { act({ t: 'playDev', card: 'plenty', a: ui.plenty[0], b: ui.plenty[1] }); ui.plenty = []; ui.modal = null; } rerender(); return;
      case 'pmono': act({ t: 'playDev', card: 'monopoly', res: r }); ui.modal = null; rerender(); return;
    }
  }

  // ---------- montaje ----------
  function mount(main, room) {
    if (!document.getElementById('cg-symbols')) {
      const d = document.createElement('div'); d.id = 'cg-symbols'; d.innerHTML = SYMBOLS; document.body.appendChild(d);
    }
    if (ui.b3) { try { ui.b3.destroy(); } catch (e) {} ui.b3 = null; }
    Object.assign(ui, { code: room.code, mode: null, modal: null, tab: 'bank', bankGive: null, bankGet: null, draft: { give: {}, want: {} }, dc: null, plenty: [], lastRoll: room.g.rollId, lastSeq: -1, started: false, rule: 0, modalKey: '', guideKey: '', eyeFor: -1, reveal: false, annQ: [], annBusy: false, turnKey: '' });
    main.innerHTML = `<div id="cg">
<div id="cg-top"><div class="ttl"><span class="logo">${ic('settle', 26)}</span><b>Catán</b><span class="rm"></span></div><div class="topbtns"><button data-a="rules">${T('a.rules')}</button><button data-a="settings">⚙ ${T('a.settings')}</button></div></div>
<div id="cg-body"><aside id="cg-players"></aside>
<section id="cg-center"><div id="cg-boardwrap"><div id="cg-tradebar"></div><div id="cg-big"></div><div id="cg-voice"></div><div id="cg-dice" class="dice-tray"></div><div id="cg-toasts"></div></div>
<div id="cg-bottom"><button id="cg-eye" data-a="eye" style="display:none"></button><div id="cg-hand"></div><div id="cg-dev"></div><div id="cg-build"></div></div></section>
<aside id="cg-side"><div id="cg-guide" class="gpop"></div><div id="cg-offer" class="parch"></div><div id="cg-log"></div></aside></div>
<div id="cg-modal"></div></div>`;
    $('#cg').addEventListener('click', onClick);
    ui.b3 = root.Catan3D.create($('#cg-boardwrap'), room.g.board, { labels: { left: T('cam.left'), right: T('cam.right'), up: T('cam.up'), down: T('cam.down'), in: T('cam.in'), out: T('cam.out'), flat: T('cam.flat'), reset: T('cam.reset'), hint: T('cam.hint'), toggle: T('cam.toggle') } });
  }

  function update(main, room, api) {
    const g = room.g;
    if (!main.firstElementChild || main.firstElementChild.id !== 'cg' || ui.code !== room.code) mount(main, room);
    ui.api = api; ui.room = room; ui.g = g;
    const ttl = $('#cg-top .ttl');
    ttl.innerHTML = `<span class="logo">${ic('settle', 26)}</span><b>${esc(root.GAMES.find((x) => x.id === room.game).name[root.I18N.lang])}</b><span class="rm">${T('room')} ${esc(room.code)}</span>`;
    $('#cg-top .topbtns').innerHTML = `<button data-a="rules">📖 ${T('a.rules')}</button><button data-a="settings">⚙ ${T('a.settings')}</button>`;
    if (g.phase !== 'main' && g.phase !== 'special') ui.mode = null;
    document.querySelectorAll('#cg-boardwrap .cam [data-cam]').forEach((b) => { b.title = T('cam.' + b.dataset.cam); });
    processEvents(g);
    renderBoard(g, room);
    renderPlayers(g, room);
    renderHand(g);
    renderGuide(g, room);
    renderPrivacy(g);
    renderOffer(g, room);
    renderLog(g);
    renderDice(g);
    renderModal(g, room);
  }

  root.CatanUI = { update, voiceCommand: (t, wake) => { voice.wake = !!wake; return voiceCommand(t); } };
})(typeof window !== 'undefined' ? window : globalThis);
