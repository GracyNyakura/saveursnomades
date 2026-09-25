const defaultMenus = [
  { id: 1, name: 'Menu Découverte', price: '25€', items: ['Entrée', 'Plat', 'Dessert'], description: 'Le premier pas, tout en douceur.' },
  { id: 2, name: 'Menu Nomade', price: '35€', items: ['Apéro', 'Entrée', 'Plat', 'Dessert'], description: 'Le grand tour, généreux et curieux.' }
];

const catalog = [
  { id: 'afrique', title: 'Escales africaines', intro: 'Des recettes solaires, des épices franches et des cuissons lentes.', items: [
    ['Thiéboudienne rouge', 'Riz parfumé, poisson rôti, légumes fondants, tamarin', '24€'],
    ['Mafé de patate douce', 'Sauce cacahuète, légumes du marché, riz jasmin', '19€'],
    ['Poulet yassa', 'Oignons confits au citron, moutarde douce, riz cassé', '22€'],
    ['Pastels de saison', 'Chaussons croustillants, herbes fraîches, sauce piment doux', '11€']
  ]},
  { id: 'ailleurs', title: 'Routes d’ailleurs', intro: 'Les inspirations de nos voyages, réinterprétées avec les produits locaux.', items: [
    ['Ceviche des arrivages', 'Poisson du jour, leche de tigre, coriandre, maïs grillé', '17€'],
    ['Curry vert nomade', 'Légumes, lait de coco, basilic thaï, riz parfumé', '19€'],
    ['Tajine végétal', 'Courge rôtie, pruneaux, amandes, semoule aux herbes', '18€'],
    ['Briouates au fromage', 'Feuille croustillante, miel, sésame torréfié', '10€']
  ]},
  { id: 'sans-alcool', title: 'Sans alcool', intro: 'Des verres frais, précis et vivants.', items: [
    ['Bissap maison', 'Hibiscus, gingembre, menthe fraîche', '6€'],
    ['Ginger beer', 'Gingembre, citron vert, sirop de canne', '6€'],
    ['Thé glacé de la maison', 'Thé vert, pêche blanche, verveine', '5€'],
    ['Eau pétillante botanique', 'Romarin, concombre, agrumes', '5€']
  ]},
  { id: 'cocktails', title: 'Cocktails nomades', intro: 'Des créations signatures pour commencer le voyage.', items: [
    ['Baobab Fizz', 'Gin, bissap, citron vert, tonic floral', '12€'],
    ['Mango Colada', 'Rhum ambré, mangue, coco, citron vert', '13€'],
    ['Casamance Mule', 'Vodka, gingembre, hibiscus, citron', '12€'],
    ['Café Touba Old Fashioned', 'Bourbon, café épicé, orange, cacao', '14€']
  ]},
  { id: 'vins', title: 'Vins & bulles', intro: 'Des bouteilles choisies chez des vignerons curieux.', items: [
    ['Verre de blanc sec', 'Languedoc, minéral et citronné', '7€'],
    ['Verre de rouge solaire', 'Pic Saint-Loup, épices et fruits noirs', '8€'],
    ['Orange wine', 'Vin de macération, notes de thé et d’abricot', '9€'],
    ['Bulles rosées', 'Pétillant naturel, fruits rouges et fraîcheur', '9€']
  ]},
  { id: 'desserts', title: 'Dernières escales', intro: 'La dernière note, douce, fraîche ou franchement chocolatée.', items: [
    ['Thiakry crémeux', 'Mil, yaourt vanillé, mangue rôtie, fleur d’oranger', '9€'],
    ['Mousse chocolat et piment', 'Chocolat noir, piment doux, huile d’olive', '10€'],
    ['Ananas rôti', 'Caramel gingembre, sorbet citron vert, menthe', '9€'],
    ['Assiette de douceurs', 'Trois bouchées de notre pâtissière', '12€']
  ]}
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

function renderCatalog() {
  document.querySelector('#catalog-list').innerHTML = catalog.map((category, index) => `<article class="catalog-category" id="${category.id}">
    <div class="catalog-category__intro"><span class="chapter">0${index + 1}</span><h3>${category.title}</h3><p>${category.intro}</p></div>
    <div class="catalog-items">${category.items.map(item => `<div class="catalog-item"><div><h4>${item[0]}</h4><p>${item[1]}</p></div><strong>${item[2]}</strong></div>`).join('')}</div>
  </article>`).join('');
}

(async () => {
  try { renderMenus(await api('/api/menus')); } catch { renderMenus(defaultMenus); }
  renderCatalog();
})();
