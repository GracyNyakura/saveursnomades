const defaultMenus = [
  { id: 1, name: 'Menu Découverte', price: '$28', items: ['Entrée du moment', 'Plat au choix', 'Dessert'], description: 'Trois escales généreuses pour découvrir la maison.' },
  { id: 2, name: 'Menu Nomade', price: '$42', items: ['Entrée', 'Plat au choix', 'Dessert', 'Boisson maison'], description: 'Le grand tour, gourmand et plein de soleil.' },
  { id: 3, name: 'Menu Grande Traversée', price: '$58', items: ['Deux entrées à partager', 'Plat signature', 'Dessert', 'Cocktail maison'], description: 'Une table abondante, à partager sans se presser.' }
];

const catalog = [
  { id: 'entrees', title: 'Les entrées', intro: 'Petites assiettes à partager, parfums familiers et découvertes épicées pour ouvrir l’appétit.', items: [
    ['Pastels sénégalais', 'Chaussons dorés au thon, oignon et persil, sauce tomate relevée', '$11'],
    ['Sambusas de bœuf', 'Triangles croustillants, bœuf épicé, cumin et coriandre', '$12'],
    ['Briouates chèvre-miel', 'Feuilles croustillantes, chèvre frais, miel et sésame', '$12'],
    ['Accras de morue', 'Beignets antillais légers, morue salée et piment végétarien', '$13'],
    ['Salade avocat-mangue', 'Mangue verte, avocat mûr, arachides et vinaigrette bissap', '$13'],
    ['Alloco à partager', 'Bananes plantain mûres frites, oignons citronnés et piment', '$10'],
    ['Chikwangue et pili-pili', 'Pain de manioc congolais et sauce tomate pimentée maison', '$10'],
    ['Beignets de niébé', 'Galettes croustillantes de haricots cornille, herbes et citron', '$11'],
    ['Salade de papaye verte', 'Papaye croquante, tomate, citron vert et cacahuètes', '$12'],
    ['Mini brochettes suya', 'Bœuf grillé aux épices d’arachide, oignon rouge et citron', '$15'],
    ['Œufs mimosa à la harissa', 'Jaune crémeux, paprika fumé et harissa douce', '$10'],
    ['Houmous de patate douce', 'Pois chiches, patate douce rôtie, tahini et pain chaud', '$12'],
    ['Ceviche péruvien', 'Poisson au citron vert, leche de tigre et maïs grillé', '$16'],
    ['Empanadas argentines', 'Chaussons au bœuf, olive, œuf et cumin', '$14'],
    ['Poutine miniature', 'Frites maison, fromage en grains et sauce brune', '$13'],
    ['Soupe à l’oignon gratinée', 'Oignons confits, bouillon et croûton au gruyère', '$14'],
    ['Gyozas aux légumes', 'Raviolis poêlés, chou, gingembre et sauce soja-sésame', '$13'],
    ['Tartare saumon-érable', 'Saumon frais, sirop d’érable, aneth et pain grillé', '$17'],
    ['Bruschetta tomate-basilic', 'Pain grillé, tomates mûries, basilic et huile d’olive', '$12'],
    ['Champignons farcis', 'Champignons rôtis, fromage fondant, ail et persil', '$13']
  ]},
  { id: 'plats', title: 'Plats consistants', intro: 'Grandes assiettes, cuissons lentes et recettes généreuses d’Afrique, d’Europe et des Amériques.', items: [
    ['Poulet mayo congolais', 'Poulet braisé, mayonnaise citronnée, frites plantain et salade', '$25'],
    ['Ntaba braisé', 'Chèvre marinée aux herbes, braisée au feu, chikwangue et pili-pili', '$29'],
    ['Ngulu rôti', 'Porc mariné et rôti lentement, banane plantain et sauce tomate', '$26'],
    ['Ngolo en sauce', 'Poisson ngolo mijoté aux tomates, saka-saka et riz parfumé', '$28'],
    ['Poulet à la moambe', 'Poulet tendre, sauce aux noix de palme, riz et saka-saka', '$27'],
    ['Liboké de poisson', 'Poisson vapeur en feuille de bananier, tomate et manioc', '$28'],
    ['Pondu au poisson fumé', 'Feuilles de manioc mijotées, poisson fumé, riz et chikwangue', '$23'],
    ['Fumbwa à l’arachide', 'Feuilles de fumbwa, pâte d’arachide, poisson fumé et manioc', '$24'],
    ['Poulet mayo façon Kinshasa', 'Poulet grillé, mayo épicée, frites dorées et plantain', '$26'],
    ['Chèvre en sauce tomate', 'Chèvre mijotée, tomate, piment doux et semoule de manioc', '$27'],
    ['Thiéboudienne sénégalaise', 'Poisson farci, riz rouge, légumes fondants et tamarin', '$27'],
    ['Poulet yassa', 'Poulet au citron, oignons confits, moutarde et riz cassé', '$24'],
    ['Mafé de bœuf', 'Bœuf fondant en sauce arachide, carottes et riz blanc', '$25'],
    ['Thiebou guinar', 'Poulet mijoté, riz parfumé, légumes et tomate épicée', '$24'],
    ['Jollof rice au poulet', 'Riz ouest-africain à la tomate, épices et poulet grillé', '$23'],
    ['Suya de bœuf', 'Brochettes aux épices yaji, oignons, tomate et riz', '$27'],
    ['Egusi et fufu', 'Ragoût nigérian de graines de melon, épinards et fufu', '$25'],
    ['Poulet doro wat', 'Poulet éthiopien au berbéré, œuf et injera moelleuse', '$26'],
    ['Injera assortiment', 'Injera fermentée, lentilles épicées, légumes et berbéré', '$23'],
    ['Couscous royal', 'Semoule fine, poulet, merguez, légumes et bouillon', '$28'],
    ['Tajine d’agneau aux pruneaux', 'Agneau confit, pruneaux, amandes grillées et semoule', '$30'],
    ['Poisson braisé à la congolaise', 'Poisson grillé, chikwangue, pili-pili et légumes', '$29'],
    ['Attiéké-poisson braisé', 'Poisson mariné, manioc fermenté, tomate-oignon et citron', '$26'],
    ['Poulet bicyclette', 'Poulet fermier braisé, alloco, oignons et sauce pimentée', '$27'],
    ['Ndolé au bœuf et crevettes', 'Feuilles amères, arachides, bœuf, crevettes et plantain', '$28'],
    ['Jollof végétarien', 'Riz à la tomate, légumes rôtis, haricots et plantain', '$21'],
    ['Steak frites', 'Bavette grillée, frites croustillantes et beurre maître d’hôtel', '$32'],
    ['Bœuf bourguignon', 'Bœuf braisé au vin rouge, carottes, champignons et purée', '$31'],
    ['Confit de canard', 'Cuisse dorée, pommes de terre sarladaises et salade', '$33'],
    ['Cassoulet toulousain', 'Haricots blancs, saucisse, confit de canard et chapelure', '$29'],
    ['Empanadas argentines au bœuf', 'Empanadas maison, chimichurri, salade et pommes grenailles', '$24'],
    ['Asado argentin', 'Bavette grillée, chimichurri frais, pommes de terre et salade', '$34'],
    ['Milanesa napolitana', 'Escalope panée, tomate, mozzarella fondue et frites', '$27'],
    ['Poutine québécoise', 'Frites maison, fromage en grains et sauce brune chaude', '$22'],
    ['Tourtière du Québec', 'Tourte dorée au porc et bœuf épicés, salade de saison', '$24'],
    ['Saumon laqué à l’érable', 'Saumon rôti, glaçage érable, légumes et riz sauvage', '$29'],
    ['Tacos carnitas', 'Porc confit, tortillas de maïs, salsa verde et chou citronné', '$24'],
    ['Enchiladas au poulet', 'Tortillas gratinées, poulet, mole légère et haricots', '$25'],
    ['Curry vert thaï au poulet', 'Poulet, lait de coco, basilic thaï et riz jasmin', '$24'],
    ['Pad thaï aux crevettes', 'Nouilles de riz, crevettes, cacahuètes et citron vert', '$25'],
    ['Biryani d’agneau', 'Riz basmati épicé, agneau tendre, yaourt et herbes', '$28'],
    ['Ramen au porc braisé', 'Bouillon mijoté, nouilles, porc, œuf et ciboule', '$26'],
    ['Paella aux fruits de mer', 'Riz safrané, crevettes, moules, calamars et citron', '$31'],
    ['Lasagnes à la bolognaise', 'Pâtes fraîches, bœuf mijoté, béchamel et parmesan', '$25'],
    ['Risotto aux champignons', 'Riz crémeux, champignons rôtis, parmesan et truffe', '$24'],
    ['Curry de légumes et pois chiches', 'Légumes, pois chiches, coco et riz parfumé', '$21']
  ]},
  { id: 'boissons', title: 'Boissons du monde', intro: 'Boissons maison et classiques, avec ou sans alcool, des terroirs africains aux cafés du monde.', items: [
    ['Bissap glacé', 'Hibiscus, gingembre et menthe fraîche · sans alcool', '$6'],
    ['Jus de gingembre', 'Gingembre pressé, citron et pointe de sucre · sans alcool', '$6'],
    ['Jus de bouye', 'Fruit du baobab, lait et vanille · sans alcool', '$7'],
    ['Jus de tamarin', 'Tamarin acidulé, citron vert et canne · sans alcool', '$6'],
    ['Eau de coco fraîche', 'Eau de coco, citron vert et menthe · sans alcool', '$7'],
    ['Dégué à boire', 'Mil, lait fermenté, vanille et muscade · sans alcool', '$7'],
    ['Limonade maison', 'Citron pressé et eau pétillante · sans alcool', '$5'],
    ['Ginger beer', 'Gingembre, citron vert et sirop de canne · sans alcool', '$6'],
    ['Thé à la menthe', 'Thé vert, menthe fraîche et sucre à part · sans alcool', '$5'],
    ['Café Touba', 'Café sénégalais, poivre de Guinée et girofle', '$5'],
    ['Café con leche', 'Espresso argentin et lait chaud', '$5'],
    ['Café filtre québécois', 'Torréfaction locale, notes chocolatées', '$4'],
    ['Chocolat chaud français', 'Chocolat noir fondu, lait et crème légère', '$6'],
    ['Thé glacé pêche', 'Thé noir, pêche mûre et citron · sans alcool', '$5'],
    ['Maté traditionnel', 'Yerba maté, servi chaud ou froid', '$6'],
    ['Horchata mexicaine', 'Riz, cannelle, vanille et lait · sans alcool', '$6'],
    ['Lassi mangue', 'Yaourt frais, mangue et cardamome · sans alcool', '$7'],
    ['Jus d’ananas frais', 'Ananas pressé minute et citron vert · sans alcool', '$7'],
    ['Eau pétillante', 'Eau minérale fraîche, bouteille 75 cl · sans alcool', '$5'],
    ['Jus de bissap-ananas', 'Hibiscus, ananas frais et citron · sans alcool', '$7'],
    ['Bière blonde locale', 'Bière artisanale légère, pression 33 cl · alcool', '$8'],
    ['Bière gingembre artisanale', 'Bière épicée au gingembre, fraîche et sèche · alcool', '$9'],
    ['Bière Primus', 'Lager congolaise, fraîche et maltée · alcool', '$8'],
    ['Bière Castel', 'Lager ouest-africaine, notes céréalières · alcool', '$8'],
    ['Cidre de glace québécois', 'Cidre liquoreux de pomme, servi frais · alcool', '$12'],
    ['Côtes-du-Rhône, verre', 'Rouge souple, fruits noirs et épices · alcool', '$12'],
    ['Malbec argentin, verre', 'Rouge généreux, prune et cacao · alcool', '$13'],
    ['Rosé de Provence, verre', 'Rosé sec, agrumes et petits fruits · alcool', '$12'],
    ['Chardonnay, verre', 'Blanc frais, pomme, poire et finale ronde · alcool', '$12'],
    ['Champagne brut, coupe', 'Bulles fines, agrumes et brioche · alcool', '$18']
  ]},
  { id: 'cocktails', title: 'Cocktails & mocktails', intro: 'Trente créations colorées : cocktails alcoolisés et mélanges sans alcool inspirés des routes du monde.', items: [
    ['Baobab Fizz', 'Gin, baobab, citron vert et tonic floral · alcool', '$14'],
    ['Mango Colada', 'Rhum ambré, mangue, coco et citron vert · alcool', '$15'],
    ['Bissap Spritz', 'Vin pétillant, bissap, orange et eau gazeuse · alcool', '$14'],
    ['Kinshasa Mule', 'Vodka, gingembre, citron vert et ginger beer · alcool', '$15'],
    ['Dakar Sour', 'Rhum vieux, tamarin, citron et blanc d’œuf · alcool', '$15'],
    ['Mojito menthe-bissap', 'Rhum blanc, menthe, citron vert et hibiscus · alcool', '$14'],
    ['Margarita passion', 'Tequila, fruit de la passion, citron vert et sel · alcool', '$15'],
    ['Caipirinha mangue', 'Cachaça, mangue fraîche, citron vert et sucre · alcool', '$14'],
    ['Negroni aux épices', 'Gin, vermouth rouge, bitter et cardamome · alcool', '$16'],
    ['Old Fashioned érable', 'Bourbon, sirop d’érable, bitter et orange · alcool', '$16'],
    ['Paloma pamplemousse', 'Tequila, pamplemousse rose, citron vert et soda · alcool', '$15'],
    ['Espresso Martini', 'Vodka, espresso, liqueur de café et cacao · alcool', '$16'],
    ['Piña Colada', 'Rhum, ananas frais, coco et citron vert · alcool', '$15'],
    ['French 75', 'Gin, citron, sirop et champagne · alcool', '$17'],
    ['Mimosa tropical', 'Bulles, jus d’ananas et fruit de la passion · alcool', '$15'],
    ['Sangria rouge', 'Vin rouge, agrumes, pomme et cannelle · alcool', '$14'],
    ['Sangria blanche', 'Vin blanc, pêche, citron et menthe · alcool', '$14'],
    ['Martini passion', 'Vodka, passion, vanille et citron · alcool', '$15'],
    ['Whisky Sour', 'Whisky, citron frais, sucre et mousse légère · alcool', '$16'],
    ['Moscow Mule', 'Vodka, citron vert et ginger beer · alcool', '$15'],
    ['Caïpirinha classique', 'Cachaça, citron vert pilé et sucre de canne · alcool', '$14'],
    ['Tropical sans alcool', 'Mangue, ananas, citron vert et eau pétillante · sans alcool', '$10'],
    ['Virgin Mojito', 'Menthe, citron vert, sucre et soda · sans alcool', '$9'],
    ['Bissap Sunrise', 'Hibiscus, orange, citron et grenadine · sans alcool', '$10'],
    ['Mule gingembre sans alcool', 'Ginger beer, citron vert et concombre · sans alcool', '$9'],
    ['Colada coco-ananas', 'Ananas frais, coco et vanille · sans alcool', '$10'],
    ['Passion Fizz', 'Fruit de la passion, citron et tonic · sans alcool', '$10'],
    ['Limonade baobab', 'Baobab, citron, miel et eau pétillante · sans alcool', '$9'],
    ['Margarita zéro', 'Agave, orange, citron vert et sel fumé · sans alcool', '$10'],
    ['Spritz pêche sans alcool', 'Pêche blanche, orange et bulles sans alcool · sans alcool', '$10']
  ]},
  { id: 'desserts', title: 'Desserts d’ici et d’ailleurs', intro: 'Douceurs généreuses, fruits mûrs, parfums d’enfance et grands classiques du monde.', items: [
    ['Thiakry crémeux', 'Mil fin, yaourt vanillé, mangue rôtie et fleur d’oranger', '$10'],
    ['Makemba caramélisée', 'Plantain doux, caramel au gingembre et glace vanille', '$10'],
    ['Beignets de banane', 'Bananes mûres, sucre-cannelle et crème légère', '$9'],
    ['Puff-puff au sucre', 'Bouchées moelleuses ouest-africaines, sucre glace et coulis', '$9'],
    ['Mikate congolais', 'Beignets dorés, sauce chocolat et banane fraîche', '$10'],
    ['Gâteau de manioc', 'Manioc râpé, coco, vanille et pointe de citron', '$10'],
    ['Gâteau à la patate douce', 'Patate douce, cannelle, muscade et crème fouettée', '$11'],
    ['Tarte à la mangue', 'Pâte sablée, mangue fraîche et crème vanillée', '$11'],
    ['Dèguè maison', 'Mil perlé, lait caillé, vanille et raisins dorés', '$9'],
    ['Fruits frais au bissap', 'Fruits de saison, sirop d’hibiscus et menthe', '$10'],
    ['Baklava pistache', 'Feuilletage au miel, pistaches et fleur d’oranger', '$10'],
    ['Cornes de gazelle', 'Pâtisserie marocaine à l’amande et fleur d’oranger', '$9'],
    ['Basboussa coco', 'Gâteau de semoule imbibé, coco et sirop citronné', '$9'],
    ['Crêpes mille trous', 'Baghrir moelleux, miel chaud et beurre noisette', '$10'],
    ['Pastilla au lait', 'Feuilletage croustillant, crème lactée, amandes et cannelle', '$11'],
    ['Tarte Tatin', 'Pommes caramélisées, pâte pur beurre et crème fraîche', '$12'],
    ['Crème brûlée vanille', 'Crème onctueuse et sucre craquant caramélisé', '$11'],
    ['Fondant au chocolat', 'Cœur coulant de chocolat noir et glace vanille', '$12'],
    ['Mille-feuille praliné', 'Feuilletage pur beurre, crème pralinée et noisettes', '$12'],
    ['Crème caramel', 'Flan soyeux à la vanille et caramel ambré maison', '$10'],
    ['Clafoutis aux cerises', 'Cerises juteuses, pâte moelleuse et sucre glace', '$11'],
    ['Crêpes Suzette', 'Crêpes flambées à l’orange et beurre citronné', '$13'],
    ['Alfajores argentins', 'Biscuits fondants, dulce de leche et coco', '$10'],
    ['Chocotorta', 'Gâteau argentin au chocolat, biscuits et dulce de leche', '$12'],
    ['Flan au dulce de leche', 'Flan vanillé nappé de caramel au lait argentin', '$11'],
    ['Tarte au sucre québécoise', 'Pâte dorée, crème et sirop d’érable', '$11'],
    ['Pouding chômeur', 'Gâteau moelleux au sirop d’érable et crème chaude', '$12'],
    ['Tarte aux pacanes', 'Pacanes caramélisées, sirop d’érable et pâte sablée', '$12'],
    ['Tarte citron meringuée', 'Crème citron acidulée, meringue dorée et sablé', '$11'],
    ['Cheesecake new-yorkais', 'Fromage frais, base biscuitée et fruits rouges', '$12'],
    ['Tres leches', 'Gâteau imbibé de trois laits, cannelle et crème', '$11'],
    ['Churros et chocolat', 'Churros croustillants, sucre-cannelle et chocolat chaud', '$10'],
    ['Mochi glacés', 'Mochi japonais, cœur glacé aux parfums assortis', '$10'],
    ['Panna cotta coco-passion', 'Crème coco légère, fruit de la passion et citron vert', '$11'],
    ['Ananas rôti au gingembre', 'Ananas caramélisé, sorbet citron vert et menthe', '$10']
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
