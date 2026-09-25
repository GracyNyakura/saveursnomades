const defaultMenus = [
  { id: 1, name: 'Menu Découverte', price: '25€', items: ['Entrée', 'Plat', 'Dessert'], description: 'Le premier pas, tout en douceur.' },
  { id: 2, name: 'Menu Nomade', price: '35€', items: ['Apéro', 'Entrée', 'Plat', 'Dessert'], description: 'Le grand tour, généreux et curieux.' }
];

function renderMenus(menus) {
  document.querySelector('#menus-list').innerHTML = menus.map(menu => `<article class="menu-card menu-card--large">
    <div class="menu-card__number">0${menu.id}</div><div class="menu-card__body">
      <div class="menu-card__title"><h2>${menu.name}</h2><strong>${menu.price}</strong></div>
      <p>${menu.description || 'Une escale imaginée au fil des saisons.'}</p>
      <ul>${menu.items.map(item => `<li>${item}</li>`).join('')}</ul>
      <a class="menu-select" href="/reservation.html?menu=${encodeURIComponent(menu.name)}">Réserver ce menu <span>↗</span></a>
    </div></article>`).join('');
}

(async () => {
  try { renderMenus(await api('/api/menus')); } catch { renderMenus(defaultMenus); }
})();
