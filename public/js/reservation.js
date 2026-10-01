const form = document.querySelector('#reservation-form');
const message = document.querySelector('#res-message');
const menuName = new URLSearchParams(window.location.search).get('menu');
const selectedMenu = document.querySelector('#selected-menu');
if (menuName && selectedMenu) selectedMenu.textContent = menuName;

const catalogReady = window.menuCatalog ? Promise.resolve() : new Promise(resolve => {
  const script = document.createElement('script');
  script.src = 'js/menu.js'; script.onload = resolve; document.head.appendChild(script);
});

const categoryLabels = { entrees: 'Entrées', plats: 'Plats consistants', boissons: 'Boissons', cocktails: 'Cocktails', desserts: 'Desserts' };
const orderMarkup = `<section class="order-builder" aria-labelledby="order-title"><div class="order-heading"><div><p class="eyebrow eyebrow--dark">Votre commande</p><h2 id="order-title">Composez votre<br><i>escale.</i></h2></div><span id="order-total">$0.00</span></div><div id="order-lines"></div><button type="button" class="add-order-line" id="add-order-line">+ Ajouter un article</button></section>`;
form.insertAdjacentHTML('beforebegin', orderMarkup);
const orderLines = document.querySelector('#order-lines');

function getCategory(categoryId) { return (window.menuCatalog || []).find(category => category.id === categoryId); }
function getPrice(value) { return Number(String(value).replace('$', '').replace(',', '.')) || 0; }
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
    line.querySelector('[data-line-total]').textContent = `$${lineTotal.toFixed(2)}`;
  });
  document.querySelector('#order-total').textContent = `$${total.toFixed(2)}`;
  return total;
}
function addOrderLine(categoryId = 'plats') {
  orderLines.insertAdjacentHTML('beforeend', `<div class="order-line"><select data-category aria-label="Catégorie">${Object.entries(categoryLabels).map(([id, label]) => `<option value="${id}" ${id === categoryId ? 'selected' : ''}>${label}</option>`).join('')}</select><select data-item aria-label="Article"></select><input data-quantity aria-label="Quantité" type="number" min="1" max="20" value="1"><strong data-line-total>$0.00</strong><button type="button" class="remove-order-line" aria-label="Supprimer cet article">×</button></div>`);
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

(async () => { await catalogReady; ['entrees', 'plats', 'boissons', 'cocktails', 'desserts'].forEach(category => addOrderLine(category)); updateOrderTotal(); })();
document.querySelector('#add-order-line').addEventListener('click', () => addOrderLine());

async function createReservationPdf(data, reservation) {
  if (!window.jspdf?.jsPDF || !window.html2canvas) throw new Error('Le module PDF est indisponible');
  const ref = `SN-${String(reservation?.id || Date.now()).padStart(5, '0')}`;
  const invoice = document.createElement('article');
  invoice.className = 'pdf-invoice';
  invoice.innerHTML = `<div class="pdf-invoice__head"><div class="pdf-invoice__logo">SAVEURS<strong>NOMADES</strong></div><div>CUISINE EN MOUVEMENT<br>MONTPELLIER · FRANCE</div><div class="pdf-invoice__motif">•<br>•<br>•</div></div><div class="pdf-invoice__title"><span>Facture</span><strong>de votre escale</strong><p>Merci, votre commande est confirmée.</p></div><div class="pdf-invoice__details"><div><small>RÉFÉRENCE</small><span>${ref}</span></div><div><small>CLIENT</small><span>${data.name}</span></div><div><small>EMAIL</small><span>${data.email}</span></div><div><small>DATE & HEURE</small><span>${data.date} · ${data.time}</span></div><div><small>CONVIVES</small><span>${data.party} personne${Number(data.party) > 1 ? 's' : ''}</span></div></div><div class="pdf-invoice__table"><div class="pdf-invoice__table-head"><span>ARTICLE</span><span>QUANTITÉ</span><span>TOTAL</span></div>${(data.order || []).map(line => `<div class="pdf-invoice__row"><span>${line.name}<small>$${Number(line.unitPrice).toFixed(2)} l'unité</small></span><span>${line.quantity}</span><strong>$${Number(line.lineTotal).toFixed(2)}</strong></div>`).join('')}</div><div class="pdf-invoice__total"><span>TOTAL À RÉGLER</span><strong>$${Number(data.total || 0).toFixed(2)}</strong></div><footer>Saveurs Nomades · bonjour@saveurs-nomades.fr · Merci pour votre confiance</footer>`;
  invoice.innerHTML = invoice.innerHTML.replace('MONTPELLIER · FRANCE', 'KINSHASA · RDC');
  document.body.appendChild(invoice);
  await document.fonts.ready;
  const canvas = await html2canvas(invoice, { scale: 2, backgroundColor: '#f6f1e8', useCORS: true });
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const width = 180;
  const height = canvas.height * width / canvas.width;
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 15, 15, width, height);
  pdf.save(`reservation-${ref}.pdf`);
  invoice.remove();
}

document.querySelector('input[name="date"]').min = new Date().toISOString().split('T')[0];
document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
  const input = document.querySelector('input[name="party"]');
  input.value = Math.min(12, Math.max(1, Number(input.value) + Number(button.dataset.step)));
}));
async function handlePaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'cancelled') {
    message.textContent = 'Paiement annulé : aucune réservation n’a été réglée.';
    message.className = 'error';
    return;
  }
  if (params.get('payment') !== 'return' || !params.get('token')) return;
  form.hidden = true;
  document.querySelector('.order-builder').hidden = true;
  message.textContent = 'Vérification du paiement en cours…';
  try {
    const result = await api('/api/payments/paypal/capture-order', { method: 'POST', body: JSON.stringify({ paypalOrderId: params.get('token') }) });
    const order = result.order;
    message.textContent = `Paiement confirmé. Réservation ${order.order_reference} · $${order.total_usd} USD.`;
    message.className = 'success';
    try {
      await createReservationPdf({ name: order.customer_name, email: order.customer_email, phone: order.phone, party: order.party, date: order.requested_date, time: order.requested_time, order: order.items, total: order.total_usd }, { id: order.order_reference });
      message.textContent += ' Votre reçu PDF a été téléchargé.';
    } catch (pdfError) {
      console.error('Receipt generation failed:', pdfError);
    }
  } catch (error) {
    form.hidden = false;
    document.querySelector('.order-builder').hidden = false;
    message.textContent = error.message;
    message.className = 'error';
  }
  window.history.replaceState({}, '', '/reservation.html');
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Préparation du paiement…';
  try {
    const data = Object.fromEntries(new FormData(form).entries());
    data.order = collectOrder();
    updateOrderTotal();
    if (!data.order.length) throw new Error('Choisissez au moins un article pour votre commande.');
    const response = await api('/api/payments/paypal/create-order', { method: 'POST', body: JSON.stringify({ ...data, fulfillment: 'reservation', order: data.order }) });
    window.location.assign(response.approvalUrl);
  } catch (error) { message.textContent = error.message; message.className = 'error'; }
  button.disabled = false; button.innerHTML = 'Payer avec PayPal <span>↗</span>';
});

handlePaymentReturn();
