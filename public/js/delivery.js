const deliveryForm = document.querySelector('#delivery-form');
const deliveryMessage = document.querySelector('#delivery-result');
const deliveryLines = document.createElement('div');
deliveryLines.id = 'delivery-order-lines';
deliveryLines.className = 'delivery-order-lines';
deliveryForm.insertAdjacentHTML('beforebegin', `<section class="order-builder delivery-order-builder" aria-labelledby="delivery-order-title"><div class="order-heading"><div><p class="eyebrow eyebrow--dark">Votre panier</p><h2 id="delivery-order-title">Choisissez vos<br><i>saveurs.</i></h2></div><span id="delivery-order-total">$0.00</span></div><div id="delivery-order-lines"></div><button type="button" class="add-order-line" id="add-delivery-line">+ Ajouter un article</button><div class="delivery-costs"><span>Sous-total <strong id="delivery-subtotal">$0.00</strong></span><span>Livraison fixe <strong id="delivery-fee">$15.00</strong></span><span>Total à payer <strong id="delivery-grand-total">$0.00</strong></span></div></section>`);
const orderLines = document.querySelector('#delivery-order-lines');
const deliveryFee = 15;
const categoryLabels = { entrees: 'Entrées', plats: 'Plats consistants', boissons: 'Boissons', cocktails: 'Cocktails', desserts: 'Desserts' };

function price(value) { return Number(String(value).replace('$', '').replace(',', '.')) || 0; }
function getCategory(categoryId) { return (window.menuCatalog || []).find(category => category.id === categoryId); }
function renderItemOptions(select, categoryId) {
  const category = getCategory(categoryId);
  select.innerHTML = `<option value="">Choisir un article</option>${(category?.items || []).map(item => `<option value="${item[0]}" data-price="${price(item[2])}">${item[0]} · ${item[2]}</option>`).join('')}`;
}
function collectOrder() {
  return [...document.querySelectorAll('.delivery-order-line')].map(line => {
    const option = line.querySelector('[data-item] option:checked');
    const quantity = Number(line.querySelector('[data-quantity]').value) || 0;
    return { name: option?.value, quantity };
  }).filter(line => line.name && line.quantity > 0);
}
function updateDeliveryTotal() {
  let subtotal = 0;
  document.querySelectorAll('.delivery-order-line').forEach(line => {
    const option = line.querySelector('[data-item] option:checked');
    const quantity = Number(line.querySelector('[data-quantity]').value) || 0;
    const lineTotal = price(option?.dataset.price) * quantity;
    subtotal += lineTotal;
    line.querySelector('[data-line-total]').textContent = `$${lineTotal.toFixed(2)}`;
  });
  const fee = subtotal > 0 ? deliveryFee : 0;
  document.querySelector('#delivery-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.querySelector('#delivery-fee').textContent = `$${fee.toFixed(2)}`;
  document.querySelector('#delivery-grand-total').textContent = `$${(subtotal + fee).toFixed(2)}`;
  document.querySelector('#delivery-order-total').textContent = `$${(subtotal + fee).toFixed(2)}`;
}
function addDeliveryLine(categoryId = 'plats') {
  orderLines.insertAdjacentHTML('beforeend', `<div class="order-line delivery-order-line"><select data-category aria-label="Catégorie">${Object.entries(categoryLabels).map(([id, label]) => `<option value="${id}" ${id === categoryId ? 'selected' : ''}>${label}</option>`).join('')}</select><select data-item aria-label="Article"></select><input data-quantity aria-label="Quantité" type="number" min="1" max="20" value="1"><strong data-line-total>$0.00</strong><button type="button" class="remove-order-line" aria-label="Supprimer cet article">×</button></div>`);
  const line = orderLines.lastElementChild;
  renderItemOptions(line.querySelector('[data-item]'), categoryId);
  line.querySelector('[data-category]').addEventListener('change', event => { renderItemOptions(line.querySelector('[data-item]'), event.target.value); updateDeliveryTotal(); });
  line.querySelector('[data-item]').addEventListener('change', updateDeliveryTotal);
  line.querySelector('[data-quantity]').addEventListener('input', updateDeliveryTotal);
  line.querySelector('.remove-order-line').addEventListener('click', () => { line.remove(); updateDeliveryTotal(); });
}

async function loadCommunes() {
  const response = await api('/api/delivery/options');
  const select = document.querySelector('#delivery-commune');
  select.innerHTML = `<option value="">Sélectionner une commune</option>${response.communes.map(commune => `<option value="${commune}">${commune}</option>`).join('')}`;
}
async function loadCatalog() {
  if (window.menuCatalog) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'js/menu.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
async function captureReturnedPayment() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'cancelled') {
    deliveryMessage.textContent = 'Paiement annulé : aucune commande n’a été réglée.';
    deliveryMessage.className = 'error';
    return;
  }
  if (params.get('payment') !== 'return') return;
  const paypalOrderId = params.get('token');
  if (!paypalOrderId) return;
  deliveryForm.hidden = true;
  document.querySelector('.delivery-order-builder').hidden = true;
  deliveryMessage.textContent = 'Vérification du paiement en cours…';
  try {
    const result = await api('/api/payments/paypal/capture-order', { method: 'POST', body: JSON.stringify({ paypalOrderId }) });
    deliveryMessage.innerHTML = `<strong>Paiement confirmé, merci !</strong><br>Commande ${result.order.order_reference} · $${result.order.total_usd} USD<br>Livraison à ${result.order.delivery_commune}.`;
    deliveryMessage.className = 'success';
  } catch (error) {
    deliveryMessage.textContent = error.message;
    deliveryMessage.className = 'error';
    deliveryForm.hidden = false;
    document.querySelector('.delivery-order-builder').hidden = false;
  }
  window.history.replaceState({}, '', '/livraison.html');
}

document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
  const input = document.querySelector('input[name="party"]');
  input.value = Math.min(12, Math.max(1, Number(input.value) + Number(button.dataset.step)));
}));
document.querySelector('#add-delivery-line').addEventListener('click', () => addDeliveryLine());
deliveryForm.addEventListener('submit', async event => {
  event.preventDefault();
  const button = deliveryForm.querySelector('[type="submit"]');
  const order = collectOrder();
  if (!order.length) {
    deliveryMessage.textContent = 'Choisissez au moins un article avant le paiement.';
    deliveryMessage.className = 'error';
    return;
  }
  button.disabled = true;
  button.textContent = 'Préparation du paiement…';
  deliveryMessage.textContent = '';
  try {
    const data = Object.fromEntries(new FormData(deliveryForm).entries());
    const result = await api('/api/payments/paypal/create-order', { method: 'POST', body: JSON.stringify({ ...data, order, fulfillment: 'delivery' }) });
    window.location.assign(result.approvalUrl);
  } catch (error) {
    deliveryMessage.textContent = error.message;
    deliveryMessage.className = 'error';
    button.disabled = false;
    button.innerHTML = 'Continuer vers PayPal <span>↗</span>';
  }
});

document.querySelector('input[name="date"]').min = new Date().toISOString().split('T')[0];
(async () => {
  try {
    await Promise.all([loadCatalog(), loadCommunes()]);
    ['entrees', 'plats', 'boissons', 'cocktails', 'desserts'].forEach(category => addDeliveryLine(category));
    updateDeliveryTotal();
    await captureReturnedPayment();
  } catch (error) {
    deliveryMessage.textContent = error.message;
    deliveryMessage.className = 'error';
  }
})();
