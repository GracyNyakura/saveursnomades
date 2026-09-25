const form = document.querySelector('#reservation-form');
const message = document.querySelector('#res-message');
const menuName = new URLSearchParams(window.location.search).get('menu');
const selectedMenu = document.querySelector('#selected-menu');
if (menuName && selectedMenu) selectedMenu.textContent = menuName;

const catalogReady = window.menuCatalog ? Promise.resolve() : new Promise(resolve => {
  const script = document.createElement('script');
  script.src = 'js/menu.js'; script.onload = resolve; document.head.appendChild(script);
});

const categoryLabels = { entrees: 'Entrées', plats: 'Nourriture consistante', boissons: 'Boissons', desserts: 'Desserts' };
const orderMarkup = `<section class="order-builder" aria-labelledby="order-title"><div class="order-heading"><div><p class="eyebrow eyebrow--dark">Votre commande</p><h2 id="order-title">Composez votre<br><i>escale.</i></h2></div><span id="order-total">0,00 €</span></div><div id="order-lines"></div><button type="button" class="add-order-line" id="add-order-line">+ Ajouter un article</button></section>`;
form.insertAdjacentHTML('beforebegin', orderMarkup);
const orderLines = document.querySelector('#order-lines');

function getCategory(categoryId) { return (window.menuCatalog || []).find(category => category.id === categoryId); }
function getPrice(value) { return Number(String(value).replace('€', '').replace(',', '.')) || 0; }
function renderItemOptions(select, categoryId, selected = '') {
  const category = getCategory(categoryId);
  select.innerHTML = `<option value="">Choisir un article</option>${(category?.items || []).map(item => `<option value="${item[0]}" data-price="${getPrice(item[2])}" ${item[0] === selected ? 'selected' : ''}>${item[0]} · ${item[2]}</option>`).join('')}`;
}
function updateOrderTotal() {
  let total = 0;
  document.querySelectorAll('.order-line').forEach(line => {
    const option = line.querySelector('[data-item] option:checked');
    const quantity = Number(line.querySelector('[data-quantity]').value) || 0;
    const lineTotal = getPrice(option?.dataset.price) * quantity;
    total += lineTotal;
    line.querySelector('[data-line-total]').textContent = `${lineTotal.toFixed(2).replace('.', ',')} €`;
  });
  document.querySelector('#order-total').textContent = `${total.toFixed(2).replace('.', ',')} €`;
  return total;
}
function addOrderLine(categoryId = 'plats') {
  orderLines.insertAdjacentHTML('beforeend', `<div class="order-line"><select data-category aria-label="Catégorie">${Object.entries(categoryLabels).map(([id, label]) => `<option value="${id}" ${id === categoryId ? 'selected' : ''}>${label}</option>`).join('')}</select><select data-item aria-label="Article"></select><input data-quantity aria-label="Quantité" type="number" min="1" max="20" value="1"><strong data-line-total>0,00 €</strong><button type="button" class="remove-order-line" aria-label="Supprimer cet article">×</button></div>`);
  const line = orderLines.lastElementChild;
  renderItemOptions(line.querySelector('[data-item]'), categoryId);
  line.querySelector('[data-category]').addEventListener('change', event => { renderItemOptions(line.querySelector('[data-item]'), event.target.value); updateOrderTotal(); });
  line.querySelector('[data-item]').addEventListener('change', updateOrderTotal);
  line.querySelector('[data-quantity]').addEventListener('input', updateOrderTotal);
  line.querySelector('.remove-order-line').addEventListener('click', () => { line.remove(); updateOrderTotal(); });
}
function collectOrder() {
  return [...document.querySelectorAll('.order-line')].map(line => {
    const item = line.querySelector('[data-item] option:checked');
    const quantity = Number(line.querySelector('[data-quantity]').value) || 0;
    return { category: line.querySelector('[data-category]').value, name: item?.value, quantity, unitPrice: getPrice(item?.dataset.price), lineTotal: getPrice(item?.dataset.price) * quantity };
  }).filter(line => line.name && line.quantity > 0);
}

(async () => { await catalogReady; ['entrees', 'plats', 'boissons', 'desserts'].forEach(category => addOrderLine(category)); updateOrderTotal(); })();
document.querySelector('#add-order-line').addEventListener('click', () => addOrderLine());

function createReservationPdf(data, reservation) {
  if (!window.jspdf?.jsPDF) throw new Error('Le module PDF est indisponible');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const forest = [31, 64, 52];
  const clay = [198, 92, 60];
  const ink = [31, 43, 37];
  const light = [246, 241, 232];
  const ref = `SN-${String(reservation?.id || Date.now()).padStart(5, '0')}`;
  pdf.setFillColor(...forest); pdf.rect(0, 0, 210, 297, 'F');
  pdf.setFillColor(...light); pdf.rect(15, 15, 180, 267, 'F');
  pdf.setFillColor(...forest); pdf.rect(15, 15, 180, 48, 'F');
  pdf.setFillColor(233, 163, 126);
  for (let y = 22; y <= 54; y += 8) pdf.circle(183, y, 1.2, 'F');
  pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(19); pdf.text('SAVEURS', 27, 35);
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(18); pdf.text('NOMADES', 27, 46);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('CUISINE EN MOUVEMENT', 157, 34, { align: 'right' }); pdf.text('MONTPELLIER · FRANCE', 157, 44, { align: 'right' });
  pdf.setTextColor(...ink); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(23); pdf.text('Facture', 27, 86); pdf.setTextColor(...clay); pdf.setFont('helvetica', 'italic'); pdf.text('de votre escale', 27, 97);
  pdf.setTextColor(100, 108, 101); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text('Merci, votre commande est confirmée.', 27, 110);
  pdf.setDrawColor(...clay); pdf.setLineWidth(.6); pdf.line(27, 119, 183, 119);
  const details = [['RÉFÉRENCE', ref], ['CLIENT', data.name], ['EMAIL', data.email], ['DATE', data.date], ['HEURE', data.time], ['CONVIVES', `${data.party} personne${Number(data.party) > 1 ? 's' : ''}`]];
  let y = 132;
  details.forEach(([label, value]) => { pdf.setTextColor(...clay); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.text(label, 27, y); pdf.setTextColor(...ink); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.text(String(value || 'Non précisé'), 86, y); y += 10; });
  pdf.setFillColor(...forest); pdf.rect(27, 193, 156, 9, 'F'); pdf.setTextColor(255, 255, 255); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.text('ARTICLE', 31, 199); pdf.text('QTÉ', 133, 199); pdf.text('TOTAL', 178, 199, { align: 'right' });
  y = 211;
  (data.order || []).forEach(line => { pdf.setTextColor(...ink); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text(String(line.name).slice(0, 34), 31, y); pdf.setTextColor(100, 108, 101); pdf.setFontSize(8); pdf.text(`${line.quantity} × ${Number(line.unitPrice).toFixed(2)} €`, 125, y); pdf.setTextColor(...ink); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text(`${Number(line.lineTotal).toFixed(2)} €`, 178, y, { align: 'right' }); y += 10; });
  pdf.setDrawColor(...clay); pdf.setLineWidth(.4); pdf.line(27, 257, 183, 257); pdf.setTextColor(...forest); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.text('TOTAL À RÉGLER', 27, 268); pdf.setTextColor(...clay); pdf.setFontSize(16); pdf.text(`${Number(data.total || 0).toFixed(2)} €`, 183, 268, { align: 'right' });
  pdf.setTextColor(110, 117, 110); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('Saveurs Nomades · bonjour@saveurs-nomades.fr · Merci pour votre confiance', 105, 278, { align: 'center' });
  pdf.save(`reservation-${ref}.pdf`);
}

document.querySelector('input[name="date"]').min = new Date().toISOString().split('T')[0];
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
  const input = document.querySelector('input[name="party"]');
  input.value = Math.min(12, Math.max(1, Number(input.value) + Number(button.dataset.step)));
}));
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Envoi en cours...';
  try {
    const data = Object.fromEntries(new FormData(form).entries());
    data.order = collectOrder();
    data.total = updateOrderTotal();
    if (!data.order.length) throw new Error('Choisissez au moins un article pour votre commande.');
    const response = await api('/api/reservations', { method: 'POST', body: JSON.stringify(data) });
    createReservationPdf(data, response.reservation);
    message.textContent = 'Réservation confirmée. Votre facture PDF a été téléchargée.';
    message.className = 'success'; form.reset();
  } catch (error) { message.textContent = error.message; message.className = 'error'; }
  button.disabled = false; button.innerHTML = 'Confirmer la demande <span>↗</span>';
});
