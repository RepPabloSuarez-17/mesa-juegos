// Registro de juegos del hub. Para añadir uno nuevo: una entrada aquí + su módulo.
// ready:false lo muestra en el menú como "pronto". descKey es una clave de i18n.js.
window.GAMES = [
  { id: 'catan', name: { es: 'Catán', en: 'Catan' }, emoji: '🏝️', ready: true, descKey: 'catan.desc' },
  { id: 'catan2', name: { es: 'Catán completo', en: 'Catan full' }, emoji: '🏰', ready: true, descKey: 'catan2.desc', local: true },
  { id: 'kittens', name: { es: 'Exploding Kittens', en: 'Exploding Kittens' }, emoji: '🐱', ready: false, descKey: 'soon.desc' },
  { id: 'unicorns', name: { es: 'Unstable Unicorns', en: 'Unstable Unicorns' }, emoji: '🦄', ready: false, descKey: 'soon.desc' },
];
