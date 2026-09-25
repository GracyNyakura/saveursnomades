const defaultMenus = [
  { id: 1, name: 'Menu Découverte', price: '25€', items: ['Entrée', 'Plat', 'Dessert'], description: 'Le premier pas, tout en douceur.' },
  { id: 2, name: 'Menu Nomade', price: '35€', items: ['Apéro', 'Entrée', 'Plat', 'Dessert'], description: 'Le grand tour, généreux et curieux.' }
];

const catalog = [
  { id: 'entrees', title: 'Les entrées', intro: 'Des premières assiettes fraîches, généreuses et pensées pour ouvrir le voyage.', items: [
    ['Pastels de saison', 'Chaussons croustillants, herbes fraîches, sauce piment doux', '11€'],
    ['Briouates au fromage', 'Feuille croustillante, miel, sésame torréfié', '10€'],
    ['Ceviche des arrivages', 'Poisson du jour, leche de tigre, coriandre, maïs grillé', '17€'],
    ['Salade des marchés', 'Avocat, mangue verte, arachide, vinaigrette hibiscus', '13€']
  ]},
  { id: 'plats', title: 'Nourriture consistante', intro: 'Des plats signatures, des cuissons lentes et des épices qui restent longtemps en mémoire.', items: [
    ['Thiéboudienne rouge', 'Riz parfumé, poisson rôti, légumes fondants, tamarin', '24€'],
    ['Poulet yassa', 'Oignons confits au citron, moutarde douce, riz cassé', '22€'],
    ['Mafé de patate douce', 'Sauce cacahuète, légumes du marché, riz jasmin', '19€'],
    ['Curry vert nomade', 'Légumes, lait de coco, basilic thaï, riz parfumé', '19€'],
    ['Tajine végétal', 'Courge rôtie, pruneaux, amandes, semoule aux herbes', '18€'],
    ['Poisson braisé du jour', 'Condiment tomate fumée, banane plantain, salade croquante', '26€']
  ]},
  { id: 'boissons', title: 'Les boissons', intro: 'Des verres précis et vivants, avec ou sans alcool, pour accompagner chaque escale.', items: [
    ['Bissap maison', 'Hibiscus, gingembre, menthe fraîche · sans alcool', '6€'],
    ['Ginger beer', 'Gingembre, citron vert, sirop de canne · sans alcool', '6€'],
    ['Baobab Fizz', 'Gin, bissap, citron vert, tonic floral · cocktail', '12€'],
    ['Mango Colada', 'Rhum ambré, mangue, coco, citron vert · cocktail', '13€'],
    ['Verre de rouge solaire', 'Pic Saint-Loup, épices et fruits noirs · vin', '8€'],
    ['Bulles rosées', 'Pétillant naturel, fruits rouges et fraîcheur · vin', '9€']
  ]},
  { id: 'desserts', title: 'Les desserts', intro: 'La dernière note, douce, fraîche ou franchement chocolatée.', items: [
    ['Thiakry crémeux', 'Mil, yaourt vanillé, mangue rôtie, fleur d’oranger', '9€'],
    ['Mousse chocolat et piment', 'Chocolat noir, piment doux, huile d’olive', '10€'],
    ['Ananas rôti', 'Caramel gingembre, sorbet citron vert, menthe', '9€'],
    ['Assiette de douceurs', 'Trois bouchées de notre pâtissière', '12€']
  ]}
];
window.menuCatalog = catalog;

function renderMenus(menus) {
  document.querySelector('#menus-list').innerHTML = menus.map(menu => `<article class="menu-card menu-card--large">
    <div class="menu-card__number">0${menu.id}</div><div class="menu-card__body">
      <div class="menu-card__title"><h2>${menu.name}</h2><strong>${menu.price}</strong></div>
      <p>${menu.description || 'Une escale imaginée au fil des saisons.'}</p>
      <ul>${menu.items.map(item => `<li>${item}</li>`).join('')}</ul>
      <a class="menu-select" href="/reservation.html?menu=${encodeURIComponent(menu.name)}">Réserver ce menu <span>↗</span></a>
    </div></article>`).join('');
}

function renderCatalog() {
  document.querySelector('#catalog-list').innerHTML = catalog.map((category, index) => `<article class="catalog-category" id="${category.id}">
    <div class="catalog-category__intro"><span class="chapter">0${index + 1}</span><h3>${category.title}</h3><p>${category.intro}</p></div>
    <div class="catalog-items">${category.items.map(item => `<div class="catalog-item"><div><h4>${item[0]}</h4><p>${item[1]}</p></div><strong>${item[2]}</strong></div>`).join('')}</div>
  </article>`).join('');
}

(async () => {
  if (document.querySelector('#menus-list')) {
    try { renderMenus(await api('/api/menus')); } catch { renderMenus(defaultMenus); }
  }
  if (document.querySelector('#catalog-list')) renderCatalog();
})();
