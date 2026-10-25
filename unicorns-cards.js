// Mazo propio para el juego de unicornios (cartas, nombres y efectos originales, mismas reglas de juego).
// Cada carta: type, emoji, name{es,en}, text{es,en}
//   fx: { enter | begin | end | cast : [ops] }   -> efectos con pausas para elegir (los ejecuta unicorns-engine.js)
//   pas: { ... }                                  -> efectos permanentes mientras la carta esté en un establo
(function (root) {
  const C = {};
  const add = (key, type, emoji, es, en, tes, ten, extra) => { C[key] = Object.assign({ key, type, emoji, name: { es, en }, text: { es: tes, en: ten } }, extra || {}); };

  // ---- Bebés (cada jugador empieza con uno; si salen del establo vuelven a la guardería)
  add('b_pip', 'baby', '🐣', 'Pipo', 'Pip', 'Unicornio bebé.', 'Baby unicorn.');
  add('b_bubbles', 'baby', '🫧', 'Burbujas', 'Bubbles', 'Unicornio bebé.', 'Baby unicorn.');
  add('b_nimbus', 'baby', '☁️', 'Nimbo', 'Nimbus', 'Unicornio bebé.', 'Baby unicorn.');
  add('b_sprout', 'baby', '🌱', 'Brote', 'Sprout', 'Unicornio bebé.', 'Baby unicorn.');
  add('b_ember', 'baby', '🔥', 'Ascua', 'Ember', 'Unicornio bebé.', 'Baby unicorn.');
  add('b_misty', 'baby', '🌫️', 'Neblina', 'Misty', 'Unicornio bebé.', 'Baby unicorn.');
  add('b_pebble', 'baby', '🪨', 'Guijarro', 'Pebble', 'Unicornio bebé.', 'Baby unicorn.');
  add('b_twinkle', 'baby', '✨', 'Brillito', 'Twinkle', 'Unicornio bebé.', 'Baby unicorn.');

  // ---- Unicornios básicos (sin efecto)
  add('u_biscuit', 'basic', '🍪', 'Galleta', 'Biscuit', 'Unicornio sin poderes.', 'A plain unicorn.');
  add('u_sunny', 'basic', '🌞', 'Trote Solar', 'Sunny Trot', 'Unicornio sin poderes.', 'A plain unicorn.');
  add('u_marsh', 'basic', '🍡', 'Nubecilla', 'Marshmallow', 'Unicornio sin poderes.', 'A plain unicorn.');
  add('u_pocket', 'basic', '🎒', 'Poni de Bolsillo', 'Pocket Pony', 'Unicornio sin poderes.', 'A plain unicorn.');
  add('u_rainbow', 'basic', '🌈', 'Poni Arcoíris', 'Rainbow Pony', 'Unicornio sin poderes.', 'A plain unicorn.');
  add('u_moon', 'basic', '🌙', 'Rayo de Luna', 'Moonbeam', 'Unicornio sin poderes.', 'A plain unicorn.');

  // ---- Unicornios mágicos
  add('m_sparkle', 'magical', '🧪', 'Doctora Chispa', 'Doctor Sparkle',
    'Al entrar en tu establo: roba 2 cartas y descarta 1.', 'When it enters your stable: draw 2 cards, then discard 1.',
    { fx: { enter: [{ op: 'draw', n: 2 }, { op: 'discard', n: 1 }] } });
  add('m_pickpocket', 'magical', '🧤', 'Poni Carterista', 'Pickpocket Pony',
    'Al entrar: roba una carta al azar de la mano de otro jugador.', 'When it enters: take a random card from another player\'s hand.',
    { fx: { enter: [{ op: 'pickPlayer', as: 'p', needHand: true }, { op: 'stealRandom', p: 'p' }] } });
  add('m_grave', 'magical', '🪦', 'Susurra-tumbas', 'Grave Whisperer',
    'Al entrar: coge un unicornio de la pila de descartes y ponlo en tu mano.', 'When it enters: take a unicorn from the discard pile into your hand.',
    { fx: { enter: [{ op: 'pick', as: 'x', zone: 'discard', types: 'unicorn', optional: true }, { op: 'take', t: 'x' }] } });
  add('m_blaze', 'magical', '🔥', 'Llamarada', 'Blaze',
    'Al entrar: destruye una Mejora en cualquier establo.', 'When it enters: destroy an Upgrade in any stable.',
    { fx: { enter: [{ op: 'pick', as: 'x', zone: 'stable', who: 'any', types: 'upgrade' }, { op: 'destroy', t: 'x' }] } });
  add('m_clover', 'magical', '🍀', 'Trébol de la Suerte', 'Lucky Clover',
    'Al principio de tu turno: roba 1 carta y descarta 1.', 'At the beginning of your turn: draw 1 card, then discard 1.',
    { fx: { begin: [{ op: 'draw', n: 1 }, { op: 'discard', n: 1 }] } });
  add('m_sabotage', 'magical', '🎭', 'Dama Sabotaje', 'Lady Sabotage',
    'Al entrar: cada otro jugador descarta una carta.', 'When it enters: each other player discards a card.',
    { fx: { enter: [{ op: 'discard', n: 1, who: 'others' }] } });
  add('m_librarian', 'magical', '📚', 'Yegua Bibliotecaria', 'Librarian Mare',
    'Al entrar: busca una Mejora en el mazo y ponla en tu mano.', 'When it enters: search the deck for an Upgrade and add it to your hand.',
    { fx: { enter: [{ op: 'pick', as: 'x', zone: 'deck', types: 'upgrade', optional: true }, { op: 'take', t: 'x' }, { op: 'shuffleDeck' }] } });
  add('m_swapshop', 'magical', '🔄', 'Trueque', 'Swap Shop',
    'Al entrar: puedes intercambiar un unicornio de tu establo por uno de otro establo.', 'When it enters: you may swap a unicorn in your stable with one in another stable.',
    { fx: { enter: [{ op: 'pick', as: 'a', zone: 'stable', who: 'mine', types: 'unicorn', optional: true }, { op: 'pick', as: 'b', zone: 'stable', who: 'others', types: 'unicorn', need: 'a' }, { op: 'swapStable', a: 'a', b: 'b' }] } });
  add('m_boomerang', 'magical', '🪃', 'Bella Bumerán', 'Boomerang Bella',
    'Al entrar: devuelve una carta de cualquier establo a la mano de su dueño.', 'When it enters: return a card from any stable to its owner\'s hand.',
    { fx: { enter: [{ op: 'pick', as: 'x', zone: 'stable', who: 'any', types: 'any', notSelf: true }, { op: 'returnHand', t: 'x' }] } });
  add('m_nightmare', 'magical', '🌑', 'Yegua Nocturna', 'Night Mare',
    'Al entrar: destruye un unicornio de otro jugador.', 'When it enters: destroy another player\'s unicorn.',
    { fx: { enter: [{ op: 'pick', as: 'x', zone: 'stable', who: 'others', types: 'unicorn' }, { op: 'destroy', t: 'x' }] } });
  add('m_prince', 'magical', '💖', 'Príncipe Encantador', 'Charming Prince',
    'Al entrar: puedes robar un unicornio básico de otro establo.', 'When it enters: you may steal a basic unicorn from another stable.',
    { fx: { enter: [{ op: 'pick', as: 'x', zone: 'stable', who: 'others', types: 'basic', optional: true }, { op: 'steal', t: 'x' }] } });
  add('m_dream', 'magical', '💭', 'Tejesueños', 'Dream Weaver',
    'Al entrar: mira las 3 primeras cartas del mazo, quédate una y el resto va al fondo.', 'When it enters: look at the top 3 cards of the deck, keep 1, put the rest at the bottom.',
    { fx: { enter: [{ op: 'peek', n: 3, as: 'x' }] } });
  add('m_charm', 'magical', '🎰', 'Potro Amuleto', 'Lucky Charm Colt',
    'Al entrar: roba 1 carta y puedes hacer una acción extra este turno.', 'When it enters: draw 1 card and take an extra action this turn.',
    { fx: { enter: [{ op: 'draw', n: 1 }, { op: 'extra', n: 1 }] } });
  add('m_gryph', 'magical', '🛡️', 'Grifocuerno Guardián', 'Guardian Gryphorn',
    'Tus otros unicornios no pueden ser destruidos.', 'Your other unicorns cannot be destroyed.', { pas: { guard: true } });
  add('m_stealth', 'magical', '🥷', 'Corcel Sigiloso', 'Stealth Stallion',
    'Esta carta no puede ser Relinchada al jugarla.', 'This card cannot be Neighed when you play it.', { pas: { noNeigh: true } });
  add('m_twin', 'magical', '👯', 'Chispa Gemela', 'Twin Spark',
    'Cuenta como 2 unicornios.', 'Counts as 2 unicorns.', { pas: { countsAs: 2 } });
  add('m_phoenix', 'magical', '🐦', 'Potrillo Fénix', 'Phoenix Foal',
    'Si fuera a ser destruido, vuelve a tu mano.', 'If it would be destroyed, it returns to your hand instead.', { pas: { phoenix: true } });

  // ---- Magia (se resuelve y va al descarte)
  add('g_wish', 'magic', '🌀', 'Deseo Renovador', 'Shuffle Wish',
    'Descarta toda tu mano y roba 5 cartas.', 'Discard your whole hand, then draw 5 cards.',
    { fx: { cast: [{ op: 'discard', all: true }, { op: 'draw', n: 5 }] } });
  add('g_rebirth', 'magic', '🌅', 'Renacer', 'Rebirth',
    'Pon un unicornio de la pila de descartes directamente en tu establo.', 'Put a unicorn from the discard pile directly into your stable.',
    { fx: { cast: [{ op: 'pick', as: 'x', zone: 'discard', types: 'unicorn' }, { op: 'revive', t: 'x' }] } });
  add('g_thunder', 'magic', '⚡', 'Llamada del Trueno', 'Thunder Call',
    'Destruye un unicornio de otro jugador.', 'Destroy another player\'s unicorn.',
    { fx: { cast: [{ op: 'pick', as: 'x', zone: 'stable', who: 'others', types: 'unicorn' }, { op: 'destroy', t: 'x' }] } });
  add('g_heist', 'magic', '🦹', 'Gran Robo de Cascos', 'Grand Heist',
    'Roba un unicornio de otro establo.', 'Steal a unicorn from another stable.',
    { fx: { cast: [{ op: 'pick', as: 'x', zone: 'stable', who: 'others', types: 'unicorn' }, { op: 'steal', t: 'x' }] } });
  add('g_sweep', 'magic', '🧹', 'Barrido', 'Clean Sweep',
    'Destruye una Maldición en cualquier establo.', 'Destroy a Downgrade in any stable.',
    { fx: { cast: [{ op: 'pick', as: 'x', zone: 'stable', who: 'any', types: 'downgrade' }, { op: 'destroy', t: 'x' }] } });
  add('g_tax', 'magic', '💰', 'Día de Impuestos', 'Tax Day',
    'Cada otro jugador te da una carta de su mano (la elige él).', 'Each other player gives you a card from their hand (their choice).',
    { fx: { cast: [{ op: 'give' }] } });
  add('g_fresh', 'magic', '🌸', 'Borrón y Cuenta Nueva', 'Fresh Start',
    'Todos descartan su mano y roban 4 cartas.', 'Every player discards their hand and draws 4 cards.',
    { fx: { cast: [{ op: 'discard', all: true, who: 'all' }, { op: 'draw', n: 4, who: 'all' }] } });
  add('g_draw3', 'magic', '🎴', 'Triple Robo', 'Triple Draw',
    'Roba 3 cartas.', 'Draw 3 cards.', { fx: { cast: [{ op: 'draw', n: 3 }] } });
  add('g_mindswap', 'magic', '🧠', 'Cambio de Mente', 'Mind Swap',
    'Intercambia tu mano con la de otro jugador.', 'Swap your hand with another player\'s hand.',
    { fx: { cast: [{ op: 'pickPlayer', as: 'p' }, { op: 'swapHands', p: 'p' }] } });
  add('g_wind', 'magic', '💨', 'Segundo Aire', 'Second Wind',
    'Puedes hacer una acción extra este turno.', 'You may take an extra action this turn.', { fx: { cast: [{ op: 'extra', n: 1 }] } });

  // ---- Mejoras (a tu establo)
  add('p_saddle', 'upgrade', '🪙', 'Silla Dorada', 'Golden Saddle',
    'Al principio de tu turno: roba 1 carta.', 'At the beginning of your turn: draw 1 card.', { fx: { begin: [{ op: 'draw', n: 1 }] } });
  add('p_shield', 'upgrade', '🌟', 'Escudo Estelar', 'Starry Shield',
    'Tus unicornios no pueden ser destruidos.', 'Your unicorns cannot be destroyed.', { pas: { noDestroy: true } });
  add('p_cushion', 'upgrade', '🛏️', 'Cojín de Nube', 'Cloud Cushion',
    'Tus cartas no pueden volver a la mano.', 'Your cards cannot be returned to your hand.', { pas: { noBounce: true } });
  add('p_pockets', 'upgrade', '🧥', 'Bolsillos Grandes', 'Big Pockets',
    'Tu límite de mano es 10.', 'Your hand limit is 10.', { pas: { handBonus: 3 } });
  add('p_spurs', 'upgrade', '👢', 'Espuelas Veloces', 'Swift Spurs',
    'Haces una acción extra en tu turno.', 'You take one extra action on your turn.', { pas: { extra: 1 } });
  add('p_veil', 'upgrade', '🎪', 'Velo del Misterio', 'Veil of Mystery',
    'Los unicornios que juegues no pueden ser Relinchados.', 'Unicorns you play cannot be Neighed.', { pas: { noNeighUnicorns: true } });

  // ---- Maldiciones (al establo de otro jugador)
  add('d_bridle', 'downgrade', '⛓️', 'Brida Maldita', 'Cursed Bridle',
    'No puedes jugar Mejoras.', 'You cannot play Upgrades.', { pas: { noUpgrades: true } });
  add('d_boots', 'downgrade', '🥾', 'Botas de Plomo', 'Lead Boots',
    'Tu límite de mano es 4.', 'Your hand limit is 4.', { pas: { handCap: 4 } });
  add('d_mud', 'downgrade', '🟤', 'Charco de Barro', 'Mud Puddle',
    'Te saltas tu fase de robar.', 'You skip your draw phase.', { pas: { skipDraw: true } });
  add('d_gate', 'downgrade', '🚪', 'Portón Oxidado', 'Rusty Gate',
    'Al principio de tu turno: descarta 1 carta.', 'At the beginning of your turn: discard 1 card.', { fx: { begin: [{ op: 'discard', n: 1 }] } });
  add('d_crown', 'downgrade', '👑', 'Corona de Espinas', 'Crown of Thorns',
    'Necesitas un unicornio más para ganar.', 'You need one more unicorn to win.', { pas: { winPlus: 1 } });
  add('d_spell', 'downgrade', '🤐', 'Hechizo de Silencio', 'Silent Spell',
    'No puedes jugar cartas Instantáneas.', 'You cannot play Instant cards.', { pas: { noInstants: true } });

  // ---- Instantáneas
  add('i_neigh', 'instant', '🐴', '¡Relincho!', 'Neigh',
    'Juégala cuando otro jugador juegue una carta: la carta se descarta sin efecto.', 'Play when another player plays a card: that card is discarded with no effect.', {});
  add('i_super', 'instant', '🌩️', '¡Super Relincho!', 'Super Neigh',
    'Como Relincho, pero no puede ser Relinchada.', 'Like Neigh, but it cannot be Neighed.', { super: true });

  const DECK = {
    u_biscuit: 2, u_sunny: 2, u_marsh: 2, u_pocket: 2, u_rainbow: 2, u_moon: 2,
    m_sparkle: 2, m_pickpocket: 2, m_grave: 2, m_blaze: 1, m_clover: 2, m_sabotage: 1, m_librarian: 1, m_swapshop: 1, m_boomerang: 1,
    m_nightmare: 2, m_prince: 1, m_dream: 1, m_charm: 1, m_gryph: 1, m_stealth: 1, m_twin: 1, m_phoenix: 1,
    g_wish: 2, g_rebirth: 2, g_thunder: 2, g_heist: 1, g_sweep: 1, g_tax: 1, g_fresh: 1, g_draw3: 2, g_mindswap: 1, g_wind: 1,
    p_saddle: 1, p_shield: 1, p_cushion: 1, p_pockets: 1, p_spurs: 1, p_veil: 1,
    d_bridle: 1, d_boots: 1, d_mud: 1, d_gate: 1, d_crown: 1, d_spell: 1,
    i_neigh: 8, i_super: 2,
  };
  const BABIES = ['b_pip', 'b_bubbles', 'b_nimbus', 'b_sprout', 'b_ember', 'b_misty', 'b_pebble', 'b_twinkle'];

  const api = { C, DECK, BABIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.UnicornCards = api;
})(typeof window !== 'undefined' ? window : globalThis);
