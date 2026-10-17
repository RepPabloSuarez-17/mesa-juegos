// Catán básico (la primera versión del hub): tablero, turnos y dados. Se conserva tal cual junto al Catán completo.
(function (root) {
  const rnd = (n) => Math.floor(Math.random() * n);

  function Game(ids, board) {
    this.ids = ids;
    this.s = { board, turn: 0, dice: null, rolled: false };
  }
  Game.prototype.act = function (id, m) {
    const s = this.s, i = this.ids.indexOf(id);
    if (i < 0 || i !== s.turn || !m) return null;
    if (m.t === 'roll' && !s.rolled) { s.dice = [1 + rnd(6), 1 + rnd(6)]; s.rolled = true; }
    else if (m.t === 'end' && s.rolled) { s.turn = (s.turn + 1) % this.ids.length; s.rolled = false; }
    return null;
  };
  Game.prototype.view = function (pid) {
    return JSON.parse(JSON.stringify(Object.assign({ me: this.ids.indexOf(pid) }, this.s)));
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const COLOR = { wood: '#2f7a3d', wool: '#9bcf53', grain: '#f2cf4a', brick: '#c4572f', ore: '#8b9099', desert: '#e6d29a' };
  const ICON = { wood: '🌲', wool: '🐑', grain: '🌾', brick: '🧱', ore: '⛰️', desert: '🏜️' };
  const S = 62;
  const toXY = (q, r) => ({ x: S * Math.sqrt(3) * (q + r / 2), y: S * 1.5 * r });
  const hexPts = (cx, cy, s) => Array.from({ length: 6 }, (_, i) => { const a = Math.PI / 180 * (60 * i - 30); return (cx + s * Math.cos(a)).toFixed(1) + ',' + (cy + s * Math.sin(a)).toFixed(1); }).join(' ');

  function boardSVG(board) {
    const W = 900, H = 800;
    let svg = `<svg viewBox="${-W / 2} ${-H / 2} ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<polygon points="${hexPts(0, 0, S * 5.1)}" fill="#1d6a96" stroke="#e8d9a8" stroke-width="10" stroke-linejoin="round" opacity=".95"/>`;
    board.tiles.forEach((t) => {
      const { x, y } = toXY(t.q, t.r);
      svg += `<g><polygon class="shex" points="${hexPts(x, y, S - 1)}" fill="${COLOR[t.res]}"/>`;
      svg += `<text x="${x}" y="${y - 20}" text-anchor="middle" font-size="22">${ICON[t.res]}</text>`;
      if (t.num) {
        const hot = t.num === 6 || t.num === 8, dots = 6 - Math.abs(7 - t.num);
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

  // api: { send(m), leave() }
  function render(main, room, api) {
    const T = root.I18N.t, g = room.g;
    if (room.aborted) {
      main.innerHTML = `<div class="card parch"><h1>${T('abort.title')}</h1><p>${T('abort.text', { name: esc(room.aborted) })}</p><div class="row"><button class="btn alt" id="sleave">${T('a.exit')}</button></div></div>`;
      document.getElementById('sleave').onclick = api.leave;
      return;
    }
    const cur = room.players[g.turn], mine = g.turn === g.me;
    main.innerHTML = `<div id="sgame">
      <div id="sboard">${boardSVG(g.board)}</div>
      <div id="spanel">
        <b>${T('room')} ${esc(room.code)}</b>
        <div>${room.players.map((p, i) => `<div class="spl ${i === g.turn ? 'turn' : ''}"><span class="dot" style="background:${p.color}"></span>${esc(p.name)}${i === g.turn ? ' 🎯' : ''}</div>`).join('')}</div>
        <div class="sdice">${g.dice ? g.dice.map((d) => `<div class="sdie">${d}</div>`).join('') : ''}</div>
        ${g.dice ? `<div style="text-align:center;font-size:20px"><b>${g.dice[0] + g.dice[1]}</b></div>` : ''}
        ${mine ? `<button class="btn alt" id="sroll" ${g.rolled ? 'disabled' : ''}>${T('a.roll')}</button><button class="btn" id="send" ${g.rolled ? '' : 'disabled'}>${T('a.end')}</button>` : `<span>${T('g.wait', { name: esc(cur ? cur.name : '') })}</span>`}
        <button class="btn" id="sleave" style="margin-top:auto">${T('a.leave')}</button>
      </div></div>`;
    if (mine) {
      document.getElementById('sroll').onclick = () => api.send({ t: 'roll' });
      document.getElementById('send').onclick = () => api.send({ t: 'end' });
    }
    document.getElementById('sleave').onclick = api.leave;
  }

  const api = { Game, render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatanSimple = api;
})(typeof window !== 'undefined' ? window : globalThis);
