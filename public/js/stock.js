let editingId = null;
const stockForm = document.querySelector('#stock-form');
const message = document.querySelector('#stock-message');
const formatQuantity = item => `${item.quantity} ${item.unit}`;
async function loadStock() {
  const items = await api('/api/stock');
  document.querySelector('#stock-rows').innerHTML = items.length ? items.map(item => `<tr class="${item.quantity <= item.threshold ? 'row-alert' : ''}">
    <td><strong>${item.name}</strong><small>${item.category}</small></td><td>${formatQuantity(item)}</td><td>${item.threshold} ${item.unit}</td>
    <td><button class="table-action" data-edit="${item.id}">Modifier</button><button class="table-action table-action--danger" data-delete="${item.id}">Supprimer</button></td>
  </tr>`).join('') : '<tr><td colspan="4" class="empty">Votre stock est vide.</td></tr>';
  document.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => editItem(items.find(item => item.id === Number(button.dataset.edit)))));
  document.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => { if (confirm('Supprimer cet article ?')) { await api(`/api/stock/${button.dataset.delete}`, { method: 'DELETE' }); loadStock(); } }));
}
function editItem(item) { editingId = item.id; Object.entries(item).forEach(([key, value]) => { const input = stockForm.elements[key]; if (input) input.value = value; }); document.querySelector('#form-title').textContent = 'Modifier un article'; stockForm.querySelector('button[type="submit"]').textContent = 'Enregistrer'; }
stockForm.addEventListener('submit', async event => { event.preventDefault(); const payload = Object.fromEntries(new FormData(stockForm).entries()); payload.quantity = Number(payload.quantity); payload.threshold = Number(payload.threshold); try { await api(editingId ? `/api/stock/${editingId}` : '/api/stock', { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); message.textContent = 'Stock mis à jour.'; message.className = 'success'; editingId = null; stockForm.reset(); document.querySelector('#form-title').textContent = 'Ajouter un article'; stockForm.querySelector('button[type="submit"]').textContent = 'Ajouter au stock'; loadStock(); } catch (error) { message.textContent = error.message; message.className = 'error'; } });
(async () => { try { const { user } = await api('/api/auth/me'); if (!user) return window.location.href = '/connexion.html'; document.querySelector('[data-user]').textContent = user.name; await loadStock(); } catch { window.location.href = '/connexion.html'; } })();
