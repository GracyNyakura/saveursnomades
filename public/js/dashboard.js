const formatDate = value => value ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)) : '-';
const statusLabel = { pending: 'En attente', confirmed: 'Confirmée', cancelled: 'Annulée' };
const statusClass = value => value === 'confirmed' ? 'status status--ok' : value === 'cancelled' ? 'status status--off' : 'status status--pending';

async function guard() {
  const { user } = await api('/api/auth/me');
  if (!user) { window.location.href = '/connexion.html'; return false; }
  document.querySelector('[data-user]').textContent = user.name;
  return true;
}
async function loadDashboard() {
  const summary = await api('/api/dashboard/summary');
  document.querySelector('[data-stat="reservations"]').textContent = summary.reservations;
  document.querySelector('[data-stat="pending"]').textContent = summary.pending;
  document.querySelector('[data-stat="stock"]').textContent = summary.lowStock;
  const rows = await api('/api/dashboard/reservations');
  document.querySelector('#reservation-rows').innerHTML = rows.length ? rows.map(row => `<tr>
    <td><strong>${row.name}</strong><small>${row.email}</small></td><td>${formatDate(row.date)}<small>${row.time} · ${row.party} pers.</small></td>
    <td><select class="status-select" data-id="${row.id}">${Object.entries(statusLabel).map(([value, label]) => `<option value="${value}" ${value === (row.status || 'pending') ? 'selected' : ''}>${label}</option>`).join('')}</select></td>
  </tr>`).join('') : '<tr><td colspan="3" class="empty">Aucune réservation pour le moment.</td></tr>';
  document.querySelectorAll('.status-select').forEach(select => select.addEventListener('change', async event => {
    await api(`/api/dashboard/reservations/${event.target.dataset.id}`, { method: 'PATCH', body: JSON.stringify({ status: event.target.value }) });
    event.target.className = `status-select ${statusClass(event.target.value)}`;
  }));
}
(async () => { try { if (await guard()) await loadDashboard(); } catch { window.location.href = '/connexion.html'; } })();
