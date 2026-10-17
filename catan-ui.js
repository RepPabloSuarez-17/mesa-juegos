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
    const collect = ui.api.local || g.auto || g.phase === 'setup' ? [] : (g.pendTiles || []);
    ui.b3.draw({ g, colors: room.players.map((p) => p.color), spots, collect });
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

    $('#cg-tradebar').innerHTML = `<span class="tl">${T('a.trade')}</span><button data-a="trade" data-k="bank" ${main ? '' : 'disabled'}>🏦 ${T('tr.bank')}</button><button data-a="trade" data-k="players" ${main ? '' : 'disabled'}>🤝 ${T('tr.players')}</button>`;
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
    // Botón de la acción del momento (tirar / terminar turno)
    let acts = '';
    if (my && phase === 'roll') acts = `<button class="big primary" data-a="roll">🎲 ${T('a.roll')}</button>`;
    else if (my && (phase === 'main' || phase === 'special')) acts = `<button class="big primary" data-a="end">${phase === 'special' ? T('a.endSp') : T('a.end')} ➜</button>`;
    // Tarjeta grande en el centro cuando hay que pulsar un botón y no se necesita el tablero: tirar los dados o elegir a quién robar
    const pk = phase + ':' + g.turn + ':' + g.rollId;
    if (ui.popKey !== pk) { ui.popKey = pk; ui.popMin = false; }
    const full = !!(my && (phase === 'roll' || i.steal)) && !ui.popMin;
    let steps = '';
    if (i.steps) {
      if (full && i.steps.items.length === 3) {
        const det = [T('st.roll.d'), T('st.build.d'), T('st.end.d')];
        steps = `<ol class="seq">${i.steps.items.map((t, k) => `<li class="${k === i.steps.on ? 'on' : k < i.steps.on ? 'done' : ''}"><i>${k < i.steps.on ? '✔' : k + 1}</i><div><b>${esc(t)}</b>${k === i.steps.on ? `<span>${esc(det[k])}</span>` : ''}</div></li>`).join('')}</ol>`;
      } else steps = `<div class="steps">${i.steps.items.map((t, k) => `<span class="${k === i.steps.on ? 'on' : k < i.steps.on ? 'done' : ''}"><i>${k < i.steps.on ? '✔' : k + 1}</i>${esc(t)}</span>`).join('')}</div>`;
    }
    const html = `${full ? `<button class="gmin" data-a="popmin" title="${T('pop.min')}">▾</button>` : ''}<div class="gk">${esc(i.kick)}</div><h3>${esc(i.title)}</h3>${i.text ? `<p>${esc(i.text)}</p>` : ''}${full ? '' : steps}${full ? steps : ''}${extra}${acts ? `<div class="gacts">${acts}</div>` : ''}`;
    const top = $('#cg-guide'), mid = $('#cg-gfull');
    const key = (full ? 'F' : 'C') + html;
    if (ui.guideKey === key) return;
    ui.guideKey = key;
    top.innerHTML = full ? '' : html; top.classList.toggle('on', !full); top.classList.toggle('mine', my);
    mid.innerHTML = full ? html : ''; mid.classList.toggle('on', full);
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

  // ---------- avisos ----------
  const TOAST = { special: 1, short: 1, roll: 1, robber: 1, steal: 1, knight: 1, longest: 1, army: 1, trade: 1, offer: 1, win: 1, produce: 1, playMonopoly: 1, playPlenty: 1, discard: 1 };
  function pushToast(txt, cls) {
    const box = $('#cg-toasts'), d = document.createElement('div');
    d.className = 'ev ' + (cls || '');
    d.innerHTML = txt;
    box.appendChild(d);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, 4200);
  }
  function processEvents(g) {
    const fresh = g.log.filter((e) => e.s > ui.lastSeq);
    if (ui.lastSeq >= 0 && ui.started) {
      fresh.forEach((e) => {
        if (!TOAST[e.k]) return;
        if (e.k === 'produce' && e.p !== g.me && !ui.api.local) return;
        if (e.k === 'roll') {
          if (e.d1 + e.d2 === 7) { pushToast(`<b>${T('g.robber')}</b><span>${esc(logText(e))}</span>`, 'dark'); sfx.robber(); }
          return;
        }
        pushToast(`<span>${esc(logText(e))}</span>`, e.k === 'win' ? 'gold' : '');
        if (e.k === 'longest' || e.k === 'army' || e.k === 'win') sfx.ping();
      });
      if (fresh.some((e) => e.k === 'build' || e.k === 'setupSettle' || e.k === 'setupRoad')) sfx.build();
    }
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
    return modal(`<h2>${T('tr.title')}</h2><div class="tabs"><button class="${ui.tab === 'bank' ? 'on' : ''}" data-a="tab" data-k="bank">${T('tr.bank')}</button><button class="${ui.tab === 'players' ? 'on' : ''}" data-a="tab" data-k="players">${T('tr.players')}</button></div>${body}`, { cls: 'trade' });
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
    else if (g.phase === 'discard' && g.discard[g.me]) { if (!ui.dc) ui.dc = {}; h = discardModal(g); }
    else {
      ui.dc = null;
      if (ui.modal === 'trade') { if (myTurn() && g.phase === 'main' || ui.tab === 'players') h = tradeModal(g); else ui.modal = null; }
      else if (ui.modal === 'rules') h = rulesModal();
      else if (ui.modal === 'settings') h = settingsModal();
      else if (ui.modal === 'plenty' || ui.modal === 'monopoly') h = pickModal(ui.modal);
    }
    const key = ui.modal === 'rules' && h ? 'rules:' + ui.rule + ':' + root.I18N.lang : '';
    if (key && key === ui.modalKey && el.firstChild) return;
    ui.modalKey = key;
    el.innerHTML = h;
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
        if (!(g.myPend && g.myPend[id])) { pushToast('<span>' + esc(T('collect.none')) + '</span>'); return; }
        act({ t: 'collect', tile: id }); return;
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
    Object.assign(ui, { code: room.code, mode: null, modal: null, tab: 'bank', bankGive: null, bankGet: null, draft: { give: {}, want: {} }, dc: null, plenty: [], lastRoll: room.g.rollId, lastSeq: -1, started: false, rule: 0, modalKey: '', guideKey: '' });
    main.innerHTML = `<div id="cg">
<div id="cg-top"><div class="ttl"><span class="logo">${ic('settle', 26)}</span><b>Catán</b><span class="rm"></span></div><div class="topbtns"><button data-a="rules">${T('a.rules')}</button><button data-a="settings">⚙ ${T('a.settings')}</button></div></div>
<div id="cg-body"><aside id="cg-players"></aside>
<section id="cg-center"><div id="cg-boardwrap"><div id="cg-tradebar"></div><div id="cg-guide" class="gpop"></div><div id="cg-mid"><div id="cg-gfull" class="gpop full"></div><div id="cg-offer" class="parch"></div></div><div id="cg-dice" class="dice-tray"></div><div id="cg-toasts"></div></div>
<div id="cg-bottom"><div id="cg-hand"></div><div id="cg-dev"></div><div id="cg-build"></div></div></section>
<aside id="cg-side"><div id="cg-log"></div></aside></div>
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
    renderOffer(g, room);
    renderLog(g);
    renderDice(g);
    renderModal(g, room);
  }

  root.CatanUI = { update };
})(typeof window !== 'undefined' ? window : globalThis);
